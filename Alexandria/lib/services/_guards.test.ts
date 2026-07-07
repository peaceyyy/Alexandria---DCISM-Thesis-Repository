import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "./auth-service";
import { requireSession } from "./_guards";

vi.mock("./auth-service", () => ({
  getCurrentUser: vi.fn(),
}));

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves the stable account-deactivated error", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: null,
      error: {
        code: "ACCOUNT_DEACTIVATED",
        message: "This account is deactivated.",
      },
    });

    await expect(requireSession()).rejects.toMatchObject({
      code: "ACCOUNT_DEACTIVATED",
    });
  });

  it("returns an active principal", async () => {
    const user = {
      id: "user-id",
      email: "user@usc.edu.ph",
      profile_name: "User",
      usc_id: null,
      role: "member" as const,
      affiliation: "student" as const,
      created_at: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: user,
      error: null,
    });

    await expect(requireSession()).resolves.toEqual(user);
  });
});
