export const AUTH_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "ACCOUNT_NOT_READY",
  "INVALID_TOKEN",
  "RATE_LIMITED",
  "CONFLICT",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "PROVIDER_NOT_CONFIGURED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionSuccess<T> = {
  ok: true;
  data: T;
};

export type ActionFailure = {
  ok: false;
  code: AuthErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  retryAfter?: number;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export const GENERIC_CREDENTIALS_MESSAGE =
  "Unable to sign in with those details.";

export const GENERIC_EMAIL_MESSAGE =
  "If an eligible account exists, an email will arrive shortly.";

export const GENERIC_TOKEN_MESSAGE =
  "This link is invalid or has expired. Request a new one and try again.";

export class RateLimitError extends Error {
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = Math.max(1, Math.ceil(retryAfter));
  }
}

export function validationFailure(fieldErrors: FieldErrors): ActionFailure {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    message: "Check the highlighted fields and try again.",
    fieldErrors,
  };
}

export function safeFailure(
  code: AuthErrorCode,
  message: string,
  options?: { fieldErrors?: FieldErrors; retryAfter?: number },
): ActionFailure {
  return {
    ok: false,
    code,
    message,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.retryAfter
      ? { retryAfter: Math.max(1, Math.ceil(options.retryAfter)) }
      : {}),
  };
}
