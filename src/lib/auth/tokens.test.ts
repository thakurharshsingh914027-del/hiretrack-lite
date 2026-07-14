import { describe, expect, it } from "vitest";

import {
  createEmailVerificationToken,
  createOrganizationInvitationToken,
  createPasswordResetToken,
  createSecureToken,
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  generateRawToken,
  hashToken,
  isTokenExpired,
  isTokenUsable,
  ORGANIZATION_INVITATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  RAW_TOKEN_PATTERN,
  tokenHashesEqual,
  TOKEN_HASH_PATTERN,
} from "@/lib/auth/tokens";

describe("secure authentication tokens", () => {
  it("generates independent URL-safe values with at least 256 bits", () => {
    const first = generateRawToken();
    const second = generateRawToken();

    expect(first).toMatch(RAW_TOKEN_PATTERN);
    expect(first).not.toBe(second);
    expect(Buffer.from(first, "base64url")).toHaveLength(32);
    expect(() => generateRawToken(31)).toThrow(RangeError);
  });

  it("stores deterministic SHA-256 hex digests instead of raw values", () => {
    const rawToken = generateRawToken();
    const digest = hashToken(rawToken);

    expect(digest).toMatch(TOKEN_HASH_PATTERN);
    expect(digest).not.toContain(rawToken);
    expect(hashToken(rawToken)).toBe(digest);
    expect(tokenHashesEqual(digest, hashToken(rawToken))).toBe(true);
    expect(tokenHashesEqual(digest, "0".repeat(64))).toBe(false);
    expect(tokenHashesEqual(digest, "invalid")).toBe(false);
    expect(() => hashToken("not a safe token")).toThrow(TypeError);
  });

  it("creates each purpose with its documented expiration", () => {
    const now = new Date("2030-01-01T00:00:00.000Z");

    expect(createEmailVerificationToken(now).expiresAt.getTime()).toBe(
      now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS,
    );
    expect(createPasswordResetToken(now).expiresAt.getTime()).toBe(
      now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS,
    );
    expect(createOrganizationInvitationToken(now).expiresAt.getTime()).toBe(
      now.getTime() + ORGANIZATION_INVITATION_TOKEN_TTL_MS,
    );
  });

  it("treats the exact expiry boundary as expired", () => {
    const now = new Date("2030-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 1_000);

    expect(isTokenExpired(expiresAt, new Date(now.getTime() + 999))).toBe(
      false,
    );
    expect(isTokenExpired(expiresAt, expiresAt)).toBe(true);
    expect(isTokenUsable({ expiresAt }, now)).toBe(true);
    expect(isTokenUsable({ expiresAt, usedAt: now }, now)).toBe(false);
    expect(isTokenUsable({ expiresAt, invalidatedAt: now }, now)).toBe(false);
  });

  it("rejects invalid lifetimes and dates", () => {
    expect(() => createSecureToken(0)).toThrow(RangeError);
    expect(() => createSecureToken(1.5)).toThrow(RangeError);
    expect(() => createSecureToken(1_000, new Date("invalid"))).toThrow(
      RangeError,
    );
    expect(() => isTokenExpired(new Date("invalid"))).toThrow(RangeError);
  });
});
