import type { AuthGateway } from "./auth-gateway";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 250));

export const mockAuthGateway: AuthGateway = {
  async login(email) {
    await wait();

    if (email.toLowerCase() === "error@usc.edu.ph") {
      return {
        data: null,
        error: {
          code: "SUPABASE_ERROR",
          message: "The email or password is incorrect.",
        },
      };
    }

    const role = email.startsWith("admin")
      ? "admin"
      : email.startsWith("moderator")
        ? "moderator"
        : "member";

    return {
      data: {
        id: "mock-user",
        email,
        profile_name: "Alexandria Member",
        usc_id: 12345678,
        role,
        affiliation: "student",
      },
      error: null,
    };
  },

  async registerMember() {
    await wait();
    return { data: { id: "mock-user" }, error: null };
  },
};
