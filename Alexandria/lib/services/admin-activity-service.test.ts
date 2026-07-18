import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../supabase/server";
import { requireRole } from "./_guards";
import { listAdminActivity } from "./admin-activity-service";

vi.mock("../supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./_guards", () => ({
  requireRole: vi.fn(),
}));

const rpc = vi.fn();

describe("listAdminActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-id",
      email: "admin@usc.edu.ph",
      profile_name: "Alex Admin",
      usc_id: null,
      role: "admin",
      affiliation: "professor",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  });

  it("maps the guarded activity RPC into paginated frontend data", async () => {
    rpc.mockResolvedValue({
      data: {
        items: [
          {
            id: 10,
            thesis_id: 4,
            thesis_title: "Activity-aware dashboard",
            actor_name: "Alex Admin",
            event: "metadata_edited",
            description: "Research area corrected.",
            occurred_at: "2026-07-18T01:00:00.000Z",
          },
        ],
        page: 2,
        limit: 20,
        total_count: 21,
      },
      error: null,
    });

    const result = await listAdminActivity({ page: 2, limit: 20 });

    expect(requireRole).toHaveBeenCalledWith(["admin", "moderator"]);
    expect(rpc).toHaveBeenCalledWith("get_admin_activity_page", {
      target_page: 2,
      target_limit: 20,
    });
    expect(result).toEqual({
      data: [
        {
          id: 10,
          thesisId: 4,
          thesisTitle: "Activity-aware dashboard",
          actorName: "Alex Admin",
          event: "metadata_edited",
          description: "Research area corrected.",
          occurredAt: "2026-07-18T01:00:00.000Z",
        },
      ],
      error: null,
      meta: {
        page: 2,
        limit: 20,
        total_count: 21,
      },
    });
  });

  it("returns a client-safe error when the activity RPC fails", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "database detail that must not leak" },
    });

    const result = await listAdminActivity();

    expect(result.error).toEqual({
      code: "SUPABASE_ERROR",
      message: "The activity history could not be loaded.",
    });
  });
});
