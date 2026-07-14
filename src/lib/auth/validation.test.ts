import { describe, expect, it } from "vitest";

import {
  acceptInvitationSchema,
  forgotPasswordSchema,
  inviteMemberSchema,
  loginSchema,
  normalizeEmail,
  onboardingSchema,
  resendVerificationSchema,
  resetPasswordFormSchema,
  resetPasswordSchema,
  revokeInvitationSchema,
  signUpSchema,
  verifyEmailSchema,
} from "@/lib/auth/validation";

const validToken = "a".repeat(43);

describe("authentication input validation", () => {
  it("normalizes email identity consistently", () => {
    expect(normalizeEmail("  PERSON@Example.COM  ")).toBe("person@example.com");
    expect(
      forgotPasswordSchema.parse({ email: "  PERSON@Example.COM  " }),
    ).toEqual({ email: "person@example.com" });
    expect(
      resendVerificationSchema.parse({ email: "ＰＥＲＳＯＮ＠example.com" }),
    ).toEqual({ email: "person@example.com" });
  });

  it("parses and normalizes a valid signup without modifying its password", () => {
    const result = signUpSchema.parse({
      name: "  Harsh   Singh ",
      email: " HARSH@EXAMPLE.COM ",
      password: "  leading spaces stay  ",
      organizationName: "  Digital   Heroes ",
    });

    expect(result).toEqual({
      name: "Harsh Singh",
      email: "harsh@example.com",
      password: "  leading spaces stay  ",
      organizationName: "Digital Heroes",
    });
  });

  it("rejects short or oversized new passwords but permits legacy-length login input", () => {
    expect(
      signUpSchema.safeParse({
        name: "Harsh",
        email: "harsh@example.com",
        password: "short",
        organizationName: "HireTrack",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        token: validToken,
        newPassword: "é".repeat(600),
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "harsh@example.com",
        password: "short",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed email/token inputs and unknown authority fields", () => {
    expect(verifyEmailSchema.safeParse({ token: "not valid" }).success).toBe(
      false,
    );
    expect(
      signUpSchema.safeParse({
        name: "Harsh",
        email: "not-an-email",
        password: "correct horse battery staple",
        organizationName: "HireTrack",
      }).success,
    ).toBe(false);
    expect(
      inviteMemberSchema.safeParse({
        email: "viewer@example.com",
        role: "VIEWER",
        organizationId: "client-supplied",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "person@example.com",
        password: "legacy-password",
        callbackUrl: "https://evil.example/app",
      }).success,
    ).toBe(false);
  });

  it("accepts only a safe relative login callback and normalizes an empty one", () => {
    expect(
      loginSchema.parse({
        email: "person@example.com",
        password: "legacy-password",
        callbackUrl: "/app/jobs?status=OPEN",
      }).callbackUrl,
    ).toBe("/app/jobs?status=OPEN");
    expect(
      loginSchema.parse({
        email: "person@example.com",
        password: "legacy-password",
        callbackUrl: "",
      }),
    ).toEqual({
      email: "person@example.com",
      password: "legacy-password",
      callbackUrl: undefined,
    });
  });

  it("allows invitation roles but never ADMIN", () => {
    expect(
      inviteMemberSchema.parse({
        email: "recruiter@example.com",
        role: "RECRUITER",
      }),
    ).toEqual({ email: "recruiter@example.com", role: "RECRUITER" });
    expect(
      inviteMemberSchema.safeParse({
        email: "admin@example.com",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });

  it("validates verification, acceptance, onboarding, and revocation shapes", () => {
    expect(verifyEmailSchema.parse({ token: validToken })).toEqual({
      token: validToken,
    });
    expect(acceptInvitationSchema.parse({ token: validToken })).toEqual({
      token: validToken,
    });
    expect(
      onboardingSchema.parse({ organizationName: "  Acme   Hiring " }),
    ).toEqual({ organizationName: "Acme Hiring" });
    expect(
      revokeInvitationSchema.safeParse({
        invitationId: "10000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true);
  });

  it("places a confirmation mismatch on the confirmation field", () => {
    const result = resetPasswordFormSchema.safeParse({
      token: validToken,
      newPassword: "correct horse battery staple",
      confirmPassword: "different horse battery staple",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }),
      );
    }
  });
});
