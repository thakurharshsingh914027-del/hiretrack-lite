const CALLBACK_BASE_URL = "https://callback.hiretrack.invalid";

export const DEFAULT_ALLOWED_CONTENT_TYPES = [
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
] as const;

export type HeadersLike = Readonly<{
  get(name: string): string | null;
}>;

export type RequestLike = Readonly<{
  headers: HeadersLike;
}>;

export type RequestGuardFailureCode =
  | "ORIGIN_REQUIRED"
  | "ORIGIN_DENIED"
  | "CONTENT_TYPE_REQUIRED"
  | "CONTENT_TYPE_DENIED";

export type RequestGuardResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      code: RequestGuardFailureCode;
      status: 403 | 415;
      message: string;
    }>;

export class RequestGuardError extends Error {
  readonly code: RequestGuardFailureCode;
  readonly status: 403 | 415;

  constructor(failure: Exclude<RequestGuardResult, { ok: true }>) {
    super(failure.message);
    this.name = "RequestGuardError";
    this.code = failure.code;
    this.status = failure.status;
  }
}

function decodedCallbackLooksSafe(value: string): boolean {
  let decoded = value;

  for (let pass = 0; pass < 2; pass += 1) {
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      return false;
    }

    if (
      decoded.startsWith("//") ||
      decoded.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return false;
    }
  }

  return true;
}

export function isSafeRelativeCallbackUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2_048 ||
    value !== value.trim() ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    !decodedCallbackLooksSafe(value)
  ) {
    return false;
  }

  try {
    const parsed = new URL(value, CALLBACK_BASE_URL);
    return (
      parsed.origin === CALLBACK_BASE_URL &&
      parsed.username === "" &&
      parsed.password === ""
    );
  } catch {
    return false;
  }
}

export function getSafeCallbackUrl(value: unknown, fallback = "/app"): string {
  const safeFallback = isSafeRelativeCallbackUrl(fallback) ? fallback : "/app";
  return isSafeRelativeCallbackUrl(value) ? value : safeFallback;
}

export const resolveSafeCallbackUrl = getSafeCallbackUrl;

export function normalizeHttpOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);

    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizedAllowedOrigins(
  allowedOrigins: string | readonly string[],
): string[] {
  const values = Array.isArray(allowedOrigins)
    ? allowedOrigins
    : [allowedOrigins];

  return values.flatMap((value) => {
    const origin = normalizeHttpOrigin(value);
    return origin ? [origin] : [];
  });
}

export function guardSameOriginRequest(
  request: RequestLike,
  allowedOrigins: string | readonly string[],
): RequestGuardResult {
  const suppliedOrigin = request.headers.get("origin");

  if (!suppliedOrigin || suppliedOrigin === "null") {
    return {
      ok: false,
      code: "ORIGIN_REQUIRED",
      status: 403,
      message: "A trusted request origin is required",
    };
  }

  const normalizedOrigin = normalizeHttpOrigin(suppliedOrigin);
  const allowed = normalizedAllowedOrigins(allowedOrigins);

  if (!normalizedOrigin || !allowed.includes(normalizedOrigin)) {
    return {
      ok: false,
      code: "ORIGIN_DENIED",
      status: 403,
      message: "The request origin is not allowed",
    };
  }

  return { ok: true };
}

function parseMediaType(value: string): string {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function guardRequestContentType(
  request: RequestLike,
  allowedContentTypes: readonly string[] = DEFAULT_ALLOWED_CONTENT_TYPES,
): RequestGuardResult {
  const contentType = request.headers.get("content-type");

  if (!contentType) {
    return {
      ok: false,
      code: "CONTENT_TYPE_REQUIRED",
      status: 415,
      message: "A supported request content type is required",
    };
  }

  const mediaType = parseMediaType(contentType);
  const allowed = allowedContentTypes.map((value) => parseMediaType(value));

  if (!allowed.includes(mediaType)) {
    return {
      ok: false,
      code: "CONTENT_TYPE_DENIED",
      status: 415,
      message: "The request content type is not supported",
    };
  }

  return { ok: true };
}

export function guardStateChangingRequest(
  request: RequestLike,
  options: Readonly<{
    allowedOrigins: string | readonly string[];
    allowedContentTypes?: readonly string[];
  }>,
): RequestGuardResult {
  const originResult = guardSameOriginRequest(request, options.allowedOrigins);

  if (!originResult.ok) {
    return originResult;
  }

  return guardRequestContentType(
    request,
    options.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES,
  );
}

export function assertStateChangingRequest(
  request: RequestLike,
  options: Readonly<{
    allowedOrigins: string | readonly string[];
    allowedContentTypes?: readonly string[];
  }>,
): void {
  const result = guardStateChangingRequest(request, options);

  if (!result.ok) {
    throw new RequestGuardError(result);
  }
}
