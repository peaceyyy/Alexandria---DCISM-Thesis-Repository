import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "../supabase/server";
import { requireRole } from "./_guards";
import {
  deactivateUser,
  getUserRoleCounts,
  getUsers,
  reactivateUser,
  updateUserRole,
} from "./user-service";

vi.mock("../supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("./_guards", () => ({
  requireRole: vi.fn(),
}));

const rpc = vi.fn();

function userQuery(response: {
  data: unknown[];
  count: number;
  error: unknown;
}) {
  const query = {
    select: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    then: (
      resolve: (value: typeof response) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.not.mockReturnValue(query);

  return query;
}

describe("user-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRole).mockResolvedValue({
      id: "admin-id",
      email: "admin@usc.edu.ph",
      profile_name: "Admin",
      usc_id: null,
      role: "admin",
      affiliation: "professor",
      created_at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns server pagination for a role-filtered account list", async () => {
    const query = userQuery({
      data: [
        {
          id: "member-id",
          email: "member@usc.edu.ph",
          profile_name: "Member",
          usc_id: null,
          role: "member",
          affiliation: "alumni",
          created_at: "2026-01-01T00:00:00.000Z",
          deactivated_at: null,
          deactivation_reason: null,
          deactivated_by_user_id: null,
        },
      ],
      count: 21,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => query),
    } as never);

    const result = await getUsers({ role: "member", page: 2, limit: 20 });

    expect(query.eq).toHaveBeenCalledWith("role", "member");
    expect(query.range).toHaveBeenCalledWith(20, 39);
    expect(result.error).toBeNull();
    if (result.error) {
      throw new Error(result.error.message);
    }
    expect(result.meta).toEqual({ total_count: 21, page: 2, limit: 20 });
  });

  it("allows administrators to list protected administrator accounts", async () => {
    const query = userQuery({
      data: [
        {
          id: "admin-id",
          email: "admin@usc.edu.ph",
          profile_name: "Admin",
          usc_id: null,
          role: "admin",
          affiliation: "professor",
          created_at: "2026-01-01T00:00:00.000Z",
          deactivated_at: null,
          deactivation_reason: null,
          deactivated_by_user_id: null,
        },
      ],
      count: 1,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => query),
    } as never);

    const result = await getUsers({ role: "admin" });

    expect(query.eq).toHaveBeenCalledWith("role", "admin");
    expect(result.error).toBeNull();
    if (result.error) {
      throw new Error(result.error.message);
    }
    expect(result.data[0]?.role).toBe("admin");
  });

  it("returns Supabase-backed counts for every account role", async () => {
    const memberQuery = userQuery({ data: [], count: 8, error: null });
    const moderatorQuery = userQuery({ data: [], count: 2, error: null });
    const adminQuery = userQuery({ data: [], count: 1, error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce(memberQuery)
      .mockReturnValueOnce(moderatorQuery)
      .mockReturnValueOnce(adminQuery);
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    const result = await getUserRoleCounts();

    expect(memberQuery.eq).toHaveBeenCalledWith("role", "member");
    expect(moderatorQuery.eq).toHaveBeenCalledWith("role", "moderator");
    expect(adminQuery.eq).toHaveBeenCalledWith("role", "admin");
    expect(result).toEqual({
      data: {
        member: 8,
        moderator: 2,
        admin: 1,
      },
      error: null,
    });
  });

  it("uses guarded RPCs for role and account-state mutations", async () => {
    rpc.mockResolvedValue({ error: null });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    await updateUserRole("member-id", "moderator");
    await deactivateUser("member-id", "Policy violation");
    await reactivateUser("member-id");

    expect(rpc).toHaveBeenNthCalledWith(1, "admin_update_user_role", {
      target_user_id: "member-id",
      new_role: "moderator",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "admin_deactivate_user", {
      target_user_id: "member-id",
      reason: "Policy violation",
    });
    expect(rpc).toHaveBeenNthCalledWith(3, "admin_reactivate_user", {
      target_user_id: "member-id",
    });
  });

  it("returns safe Supabase RPC messages for blocked role changes", async () => {
    rpc.mockResolvedValue({
      error: {
        code: "42501",
        message: "Reactivate the account before changing its role",
        details: null,
        hint: null,
      },
    });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const result = await updateUserRole("member-id", "moderator");

    expect(result.error).toMatchObject({
      code: "SUPABASE_ERROR",
      message: "Reactivate the account before changing its role",
      details: { supabase_code: "42501" },
    });
  });

  it("rejects self-deactivation before calling Supabase", async () => {
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);

    const result = await deactivateUser("admin-id", "Mistake");

    expect(result.error?.code).toBe("FORBIDDEN");
    expect(rpc).not.toHaveBeenCalled();
  });
});
