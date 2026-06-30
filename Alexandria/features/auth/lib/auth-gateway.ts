import type {
  CurrentUser,
  RegisterPayload,
  ServiceResult,
} from "./auth-contract";
import { mockAuthGateway } from "./mock-auth-gateway";

export type AuthGateway = {
  login(email: string, password: string): Promise<ServiceResult<CurrentUser>>;
  registerMember(
    payload: RegisterPayload,
  ): Promise<ServiceResult<{ id: string }>>;
};

export const authGateway: AuthGateway = mockAuthGateway;
