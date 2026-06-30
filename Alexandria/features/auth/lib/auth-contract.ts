export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";

export type ServiceError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: ServiceError };

export type CurrentUser = {
  id: string;
  email: string;
  profile_name: string;
  usc_id: number;
  role: UserRole;
  affiliation: Affiliation;
};

export type RegisterPayload = {
  email: string;
  password: string;
  profile_name: string;
  usc_id: number;
  affiliation: Affiliation;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegistrationFormInput = {
  profile_name: string;
  email: string;
  usc_id: string;
  affiliation: Affiliation | "";
  password: string;
  confirm_password: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
