"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { FieldErrors, LoginInput } from "../lib/auth-contract";
import { authGateway, type AuthGateway } from "../lib/auth-gateway";
import { validateLoginInput } from "../lib/auth-validation";
import { AuthField } from "./auth-field";
import { AuthTabs } from "./auth-tabs";
import { PasswordField } from "./password-field";

export function LoginForm({
  gateway = authGateway,
  registered = false,
}: {
  gateway?: AuthGateway;
  registered?: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [serviceError, setServiceError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginInput(input);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setServiceError("");
    setPending(true);
    const email = input.email.trim().toLowerCase();
    const result = await gateway.login(email, input.password);
    setPending(false);

    if (result.error) {
      setServiceError(result.error.message);
      return;
    }

    const destination = {
      admin: "/admin",
      moderator: "/moderator",
      member: "/",
    }[result.data.role];
    router.push(destination);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      className="space-y-4"
    >
      <AuthTabs active="login" />
      {registered ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          Account created. Log in with your USC email.
        </p>
      ) : null}
      <AuthField
        id="login-email"
        name="email"
        label="Student email"
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
      <PasswordField
        id="login-password"
        name="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={input.password}
        onChange={(event) =>
          setInput((current) => ({ ...current, password: event.target.value }))
        }
        error={errors.password}
      />
      <button
        type="button"
        onClick={() => setRecoveryNotice(true)}
        className="ml-auto block min-h-11 text-[13px] text-[var(--color-text)]"
      >
        Forgot Password?
      </button>
      {recoveryNotice ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          Password recovery is not available in this frontend phase.
        </p>
      ) : null}
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
        {pending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
