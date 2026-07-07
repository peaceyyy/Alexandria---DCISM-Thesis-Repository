"use server";

import { redirect } from "next/navigation";
import {
  login as serviceLogin,
  logout as serviceLogout,
  registerMember as serviceRegisterMember,
} from "@/lib/services/auth-service";
import type { RegisterPayload } from "./auth-contract";

export async function loginAction(email: string, password: string) {
  return serviceLogin(email, password);
}

export async function clearSessionAction() {
  return serviceLogout();
}

export async function registerAction(payload: RegisterPayload) {
  return serviceRegisterMember(payload);
}

export async function logoutAction() {
  const result = await serviceLogout();

  if (result.error) {
    redirect("/profile?error=logout");
  }

  redirect("/home");
}
