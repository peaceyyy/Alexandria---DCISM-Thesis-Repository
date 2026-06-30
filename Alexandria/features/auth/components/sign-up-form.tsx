"use client";

import { GraduationCap, IdCard, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type {
  FieldErrors,
  RegistrationFormInput,
  RegisterPayload,
} from "../lib/auth-contract";
import { authGateway, type AuthGateway } from "../lib/auth-gateway";
import { validateRegistrationInput } from "../lib/auth-validation";
import { AuthField } from "./auth-field";
import { AuthTabs } from "./auth-tabs";
import { PasswordField } from "./password-field";

const initialInput: RegistrationFormInput = {
  profile_name: "",
  email: "",
  usc_id: "",
  affiliation: "",
  password: "",
  confirm_password: "",
};

export function SignUpForm({
  gateway = authGateway,
}: {
  gateway?: AuthGateway;
}) {
  const router = useRouter();
  const [input, setInput] = useState(initialInput);
  const [errors, setErrors] =
    useState<FieldErrors<RegistrationFormInput>>({});
  const [serviceError, setServiceError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegistrationInput(input);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: RegisterPayload = {
      profile_name: input.profile_name.trim(),
      email: input.email.trim().toLowerCase(),
      usc_id: Number(input.usc_id),
      affiliation: input.affiliation as RegisterPayload["affiliation"],
      password: input.password,
    };

    setErrors({});
    setServiceError("");
    setPending(true);
    const result = await gateway.registerMember(payload);
    setPending(false);

    if (result.error) {
      if (result.error.code === "INVALID_EMAIL_DOMAIN") {
        setErrors({ email: result.error.message });
      } else {
        setServiceError(result.error.message);
      }
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      className="space-y-4"
    >
      <AuthTabs active="sign-up" />
      <AuthField
        id="sign-up-name"
        label="Full name"
        name="profile_name"
        autoComplete="name"
        placeholder="Enter your full name"
        value={input.profile_name}
        onChange={(event) =>
          setInput((current) => ({
            ...current,
            profile_name: event.target.value,
          }))
        }
        icon={<User size={26} />}
        error={errors.profile_name}
      />
      <AuthField
        id="sign-up-email"
        label="Student email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Enter your student email"
        value={input.email}
        onChange={(event) =>
          setInput((current) => ({ ...current, email: event.target.value }))
        }
        icon={<Mail size={26} />}
        error={errors.email}
      />
      <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
        <AuthField
          id="sign-up-usc-id"
          label="USC ID"
          name="usc_id"
          inputMode="numeric"
          placeholder="Enter your USC ID"
          value={input.usc_id}
          onChange={(event) =>
            setInput((current) => ({
              ...current,
              usc_id: event.target.value,
            }))
          }
          icon={<IdCard size={24} />}
          error={errors.usc_id}
        />
        <div>
          <label
            htmlFor="sign-up-affiliation"
            className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
          >
            Affiliation
          </label>
          <div className="relative">
            <select
              id="sign-up-affiliation"
              name="affiliation"
              value={input.affiliation}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  affiliation: event.target
                    .value as RegistrationFormInput["affiliation"],
                }))
              }
              aria-invalid={Boolean(errors.affiliation)}
              aria-describedby={
                errors.affiliation ? "sign-up-affiliation-error" : undefined
              }
              className="h-[60px] w-full appearance-none rounded-[20px] border border-[#368bfe] bg-[var(--color-bg)] px-5 pr-12 text-base text-[var(--color-text)]"
            >
              <option value="">Select affiliation</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="professor">Professor</option>
            </select>
            <GraduationCap
              aria-hidden
              size={24}
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--color-placeholder)]"
            />
          </div>
          {errors.affiliation ? (
            <p
              id="sign-up-affiliation-error"
              className="mt-1 px-2 text-sm text-[var(--color-danger)]"
            >
              {errors.affiliation}
            </p>
          ) : null}
        </div>
      </div>
      <PasswordField
        id="sign-up-password"
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Use at least 8 characters"
        value={input.password}
        onChange={(event) =>
          setInput((current) => ({ ...current, password: event.target.value }))
        }
        error={errors.password}
      />
      <PasswordField
        id="sign-up-confirm-password"
        label="Confirm password"
        name="confirm_password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={input.confirm_password}
        onChange={(event) =>
          setInput((current) => ({
            ...current,
            confirm_password: event.target.value,
          }))
        }
        error={errors.confirm_password}
      />
      {serviceError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {serviceError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 w-[234px] max-w-full rounded-[20px] bg-[#368bfe] px-6 font-[var(--font-display)] text-xl font-semibold text-white disabled:cursor-wait disabled:opacity-60 max-sm:w-full"
      >
        {pending ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
