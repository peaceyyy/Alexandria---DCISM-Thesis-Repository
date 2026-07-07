import type {
  CurrentUser,
  RegisterPayload,
  ServiceResult,
} from "./auth-contract";
import {
  clearSessionAction,
  loginAction,
  registerAction,
} from "./actions";

export type AuthGateway = {
  login(email: string, password: string): Promise<ServiceResult<CurrentUser>>;
  clearSession(): Promise<ServiceResult<null>>;
  registerMember(
    payload: RegisterPayload,
  ): Promise<ServiceResult<{ id: string }>>;
};

export const authGateway: AuthGateway = {
  login: loginAction,
  clearSession: clearSessionAction,
  registerMember: registerAction,
};
