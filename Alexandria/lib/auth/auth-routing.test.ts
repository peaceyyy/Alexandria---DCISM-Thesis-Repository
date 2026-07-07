import { describe, expect, it } from "vitest";
import { getPostAuthDestination } from "./auth-routing";

describe("getPostAuthDestination", () => {
  it("sends members to the repository", () => {
    expect(getPostAuthDestination("member")).toBe("/home");
  });

  it.each(["moderator", "admin"] as const)(
    "sends %s to the shared admin dashboard",
    (role) => {
      expect(getPostAuthDestination(role)).toBe("/admin/dashboard");
    },
  );

  it("sends a newly registered account to the thesis preview", () => {
    expect(getPostAuthDestination()).toBe("/home");
  });
});
