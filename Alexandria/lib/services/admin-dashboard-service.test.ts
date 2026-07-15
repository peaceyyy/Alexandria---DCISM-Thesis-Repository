import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../supabase/server";
import { requireRole } from "./_guards";
import { getAdminDashboardSnapshot } from "./admin-dashboard-service";

vi.mock("../supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./_guards", () => ({
  requireRole: vi.fn(),
}));

const rpc = vi.fn();

describe("getAdminDashboardSnapshot", () => {
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

  it("maps the guarded dashboard RPC into the frontend snapshot", async () => {
    rpc.mockResolvedValue({
      data: {
        metrics: {
          total_research: 12,
          pending_docs: 3,
        },
        recent_uploads: [
          {
            id: 1,
            title: "Thesis",
            author: "Author",
            created_at: "2026-07-01T00:00:00.000Z",
            review_status: "for_review",
          },
        ],
        recent_activity: [],
        research_by_department: [{ department: "CS", count: 12 }],
      },
      error: null,
    });

    const result = await getAdminDashboardSnapshot();

    expect(requireRole).toHaveBeenCalledWith(["admin", "moderator"]);
    expect(rpc).toHaveBeenCalledWith("get_admin_dashboard_snapshot");
    expect(result.data?.viewer.profile_name).toBe("Alex Admin");
    expect(result.data?.research_by_department).toEqual([
      { department: "CS", count: 12 },
    ]);
  });

  it("returns a client-safe error when the RPC fails", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "database detail that must not leak" },
    });

    const result = await getAdminDashboardSnapshot();

    expect(result.error).toEqual({
      code: "SUPABASE_ERROR",
      message: "The admin dashboard data could not be loaded.",
    });
  });
});
