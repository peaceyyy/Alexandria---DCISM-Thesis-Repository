import type {
  FieldErrors,
  LoginInput,
  RegistrationFormInput,
} from "./auth-contract";

export function isUscEmail(email: string): boolean {
  return /^[^\s@]+@usc\.edu\.ph$/i.test(email.trim());
}

export function validateLoginInput(
  input: LoginInput,
): FieldErrors<LoginInput> {
  const errors: FieldErrors<LoginInput> = {};

  if (!isUscEmail(input.email)) {
    errors.email = "Use your @usc.edu.ph email address.";
  }
  if (!input.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function validateRegistrationInput(
  input: RegistrationFormInput,
): FieldErrors<RegistrationFormInput> {
  const errors: FieldErrors<RegistrationFormInput> = {};

  if (input.profile_name.trim().length < 2) {
    errors.profile_name = "Enter your full name.";
  }
  if (!isUscEmail(input.email)) {
    errors.email = "Use your @usc.edu.ph email address.";
  }
  if (!/^\d+$/.test(input.usc_id)) {
    errors.usc_id = "Enter a valid numeric USC ID.";
  }
  if (!input.affiliation) {
    errors.affiliation = "Select your USC affiliation.";
  }
  if (input.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  if (input.confirm_password !== input.password) {
    errors.confirm_password = "Passwords do not match.";
  }

  return errors;
}
