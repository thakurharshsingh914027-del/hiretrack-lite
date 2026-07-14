import { describe, expect, it } from "vitest";

import {
  assertPasswordPolicy,
  DUMMY_PASSWORD_HASH,
  getPasswordPolicyIssue,
  hashPassword,
  isPasswordPolicyCompliant,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_CHARACTERS,
  passwordByteLength,
  passwordCharacterLength,
  passwordHashNeedsRehash,
  PasswordPolicyError,
  verifyPassword,
} from "@/lib/auth/password";

describe("password policy", () => {
  it("counts Unicode code points and UTF-8 bytes independently", () => {
    expect(passwordCharacterLength("🔐".repeat(12))).toBe(12);
    expect(passwordByteLength("🔐".repeat(12))).toBe(48);
  });

  it("requires 12 characters without imposing composition rules", () => {
    expect(getPasswordPolicyIssue("short-value")).toEqual({
      code: "PASSWORD_TOO_SHORT",
      message: `Password must contain at least ${PASSWORD_MIN_CHARACTERS} characters`,
    });
    expect(isPasswordPolicyCompliant("alllowercase!")).toBe(true);
  });

  it("enforces the maximum by UTF-8 bytes", () => {
    const boundary = "a".repeat(PASSWORD_MAX_BYTES);
    const oversized = "é".repeat(PASSWORD_MAX_BYTES / 2 + 1);

    expect(isPasswordPolicyCompliant(boundary)).toBe(true);
    expect(getPasswordPolicyIssue(oversized)?.code).toBe("PASSWORD_TOO_LONG");
  });

  it("throws a typed policy error before hashing invalid input", () => {
    expect(() => assertPasswordPolicy("too-short")).toThrow(
      PasswordPolicyError,
    );
  });
});

describe("password hashing", () => {
  it("creates an approved Argon2id digest and verifies it", async () => {
    const password = "correct horse battery staple";
    const digest = await hashPassword(password);

    expect(digest).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(digest, password)).resolves.toBe(true);
    await expect(
      verifyPassword(digest, "wrong horse battery staple"),
    ).resolves.toBe(false);
    expect(passwordHashNeedsRehash(digest)).toBe(false);
  });

  it("rejects policy-invalid passwords before hashing", async () => {
    await expect(hashPassword("too-short")).rejects.toMatchObject({
      name: "PasswordPolicyError",
      code: "PASSWORD_TOO_SHORT",
    });
  });

  it("uses the dummy digest for a missing account without authenticating", async () => {
    await expect(
      verifyPassword(null, "an attacker supplied password"),
    ).resolves.toBe(false);
    await expect(
      verifyPassword(undefined, "hiretrack-dummy-password-never-valid"),
    ).resolves.toBe(false);
  });

  it("fails safely for corrupt digests and oversized attacker input", async () => {
    await expect(
      verifyPassword("$argon2id$definitely-corrupt", "a valid length password"),
    ).resolves.toBe(false);
    await expect(
      verifyPassword(DUMMY_PASSWORD_HASH, "é".repeat(600)),
    ).resolves.toBe(false);
    expect(passwordHashNeedsRehash("not-an-argon-hash")).toBe(true);
  });
});
