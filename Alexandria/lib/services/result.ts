import type { ServiceError, ServiceResult, PaginationMeta } from "./types";

/** Wrap a successful value in the standard envelope. */
export function ok<T>(data: T, meta?: PaginationMeta): ServiceResult<T> {
  return {
    data,
    error: null,
    ...(meta ? { meta } : {}),
  };
}

/** Wrap a known ServiceError. */
export function err<T>(error: ServiceError): ServiceResult<T> {
  return {
    data: null,
    error,
  };
}

/** Construct a typed ServiceError literal. */
export function makeError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ServiceError {
  return {
    code,
    message,
    ...(details ? { details } : {}),
  };
}

export function isServiceError(value: unknown): value is ServiceError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ServiceError>;
  return typeof candidate.code === "string" && typeof candidate.message === "string";
}

/** Convert an unexpected thrown value into a client-safe service error. */
export function normalizeServiceError(
  value: unknown,
  fallbackMessage = "The requested operation could not be completed.",
): ServiceError {
  if (isServiceError(value)) {
    return value;
  }

  return makeError("INTERNAL_ERROR", fallbackMessage);
}
