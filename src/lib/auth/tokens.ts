import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_ENTROPY_BYTES = 32;
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1_000;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1_000;
export const ORGANIZATION_INVITATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export const RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
export const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

export type SecureToken = Readonly<{
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}>;

export type TokenState = Readonly<{
  expiresAt: Date;
  usedAt?: Date | null;
  invalidatedAt?: Date | null;
}>;

export function generateRawToken(
  entropyBytes: number = TOKEN_ENTROPY_BYTES,
): string {
  if (
    !Number.isSafeInteger(entropyBytes) ||
    entropyBytes < TOKEN_ENTROPY_BYTES
  ) {
    throw new RangeError(
      `Token entropy must be an integer of at least ${TOKEN_ENTROPY_BYTES} bytes`,
    );
  }

  return randomBytes(entropyBytes).toString("base64url");
}

export function hashToken(rawToken: string): string {
  if (!RAW_TOKEN_PATTERN.test(rawToken)) {
    throw new TypeError("Token must be a valid URL-safe value");
  }

  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function tokenHashesEqual(left: string, right: string): boolean {
  if (!TOKEN_HASH_PATTERN.test(left) || !TOKEN_HASH_PATTERN.test(right)) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function asValidDate(value: Date | number): Date {
  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("A valid date is required");
  }

  return date;
}

export function createSecureToken(
  ttlMs: number,
  now: Date | number = new Date(),
): SecureToken {
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
    throw new RangeError("Token lifetime must be a positive integer");
  }

  const issuedAt = asValidDate(now);
  const rawToken = generateRawToken();

  return {
    rawToken,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(issuedAt.getTime() + ttlMs),
  };
}

export function createEmailVerificationToken(now?: Date | number): SecureToken {
  return createSecureToken(EMAIL_VERIFICATION_TOKEN_TTL_MS, now);
}

export function createPasswordResetToken(now?: Date | number): SecureToken {
  return createSecureToken(PASSWORD_RESET_TOKEN_TTL_MS, now);
}

export function createOrganizationInvitationToken(
  now?: Date | number,
): SecureToken {
  return createSecureToken(ORGANIZATION_INVITATION_TOKEN_TTL_MS, now);
}

export function isTokenExpired(
  expiresAt: Date,
  now: Date | number = new Date(),
): boolean {
  return asValidDate(expiresAt).getTime() <= asValidDate(now).getTime();
}

export function isTokenUsable(
  state: TokenState,
  now: Date | number = new Date(),
): boolean {
  return (
    !state.usedAt &&
    !state.invalidatedAt &&
    !isTokenExpired(state.expiresAt, now)
  );
}
