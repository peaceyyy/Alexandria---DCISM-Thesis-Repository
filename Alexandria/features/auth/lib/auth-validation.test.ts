import { describe, expect, it } from "vitest";
import {
  validateLoginInput,
  validateRegistrationInput,
} from "./auth-validation";

describe("validateLoginInput", () => {
  it("requires a USC email and password", () => {
    expect(
      validateLoginInput({ email: "user@gmail.com", password: "" }),
    ).toEqual({
      email: "Use your @usc.edu.ph email address.",
      password: "Enter your password.",
    });
  });
});

describe("validateRegistrationInput", () => {
  it("validates every backend-required registration field", () => {
    expect(
      validateRegistrationInput({
        profile_name: "",
        email: "user@gmail.com",
        usc_id: "",
        affiliation: "",
        password: "password",
        confirm_password: "different",
      }),
    ).toEqual({
      profile_name: "Enter your full name.",
      email: "Use your @usc.edu.ph email address.",
      usc_id: "Enter a valid numeric USC ID.",
      affiliation: "Select your USC affiliation.",
      confirm_password: "Passwords do not match.",
    });
  });
});
