import { z } from "zod";

import {
  getPasswordPolicyIssue,
  PASSWORD_MAX_BYTES,
  passwordByteLength,
} from "@/lib/auth/password";
import { RAW_TOKEN_PATTERN } from "@/lib/auth/tokens";
import { isSafeRelativeCallbackUrl } from "@/lib/auth/urls";

export function normalizeEmail(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase();
}

function normalizeDisplayText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export const emailSchema = z
  .string()
  .transform(normalizeEmail)
  .pipe(z.email("Enter a valid email address").max(320));

export const passwordSchema = z.string().superRefine((value, context) => {
  const issue = getPasswordPolicyIssue(value);

  if (issue) {
    context.addIssue({ code: "custom", message: issue.message });
  }
});

export const loginPasswordSchema = z
  .string()
  .min(1, "Enter your password")
  .refine((value) => passwordByteLength(value) <= PASSWORD_MAX_BYTES, {
    message: `Password must be at most ${PASSWORD_MAX_BYTES} UTF-8 bytes`,
  });

export const rawTokenSchema = z
  .string()
  .regex(RAW_TOKEN_PATTERN, "The link is invalid or incomplete");

export const personNameSchema = z
  .string()
  .transform(normalizeDisplayText)
  .pipe(z.string().min(1, "Enter your name").max(120));

export const organizationNameSchema = z
  .string()
  .transform(normalizeDisplayText)
  .pipe(z.string().min(1, "Enter an organization name").max(120));

export const signUpSchema = z
  .object({
    name: personNameSchema,
    email: emailSchema,
    password: passwordSchema,
    organizationName: organizationNameSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
    callbackUrl: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .max(2_048)
        .refine(isSafeRelativeCallbackUrl, "Enter a valid callback path")
        .optional(),
    ),
  })
  .strict();

export const verifyEmailSchema = z.object({ token: rawTokenSchema }).strict();

export const resendVerificationSchema = z
  .object({ email: emailSchema })
  .strict();

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const requestPasswordResetSchema = forgotPasswordSchema;

export const resetPasswordSchema = z
  .object({
    token: rawTokenSchema,
    newPassword: passwordSchema,
  })
  .strict();

export const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirmPassword: passwordSchema })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const onboardingSchema = z
  .object({
    organizationName: organizationNameSchema,
    invitationToken: rawTokenSchema.optional(),
  })
  .strict();

export const completeOAuthOnboardingSchema = onboardingSchema;

export const invitationRoleSchema = z.enum(["RECRUITER", "VIEWER"]);

export const inviteMemberSchema = z
  .object({
    email: emailSchema,
    role: invitationRoleSchema,
  })
  .strict();

export const acceptOrganizationInvitationSchema = z
  .object({ token: rawTokenSchema })
  .strict();

export const acceptInvitationSchema = acceptOrganizationInvitationSchema;

export const revokeInvitationSchema = z
  .object({ invitationId: z.uuid("Enter a valid invitation ID") })
  .strict();

// Explicit aliases keep framework entry points readable without duplicating
// schemas or allowing their validation contracts to drift.
export const signUpInputSchema = signUpSchema;
export const loginInputSchema = loginSchema;
export const verifyEmailInputSchema = verifyEmailSchema;
export const resendVerificationInputSchema = resendVerificationSchema;
export const forgotPasswordInputSchema = forgotPasswordSchema;
export const resetPasswordInputSchema = resetPasswordSchema;
export const onboardingInputSchema = onboardingSchema;
export const inviteMemberInputSchema = inviteMemberSchema;
export const acceptInvitationInputSchema = acceptInvitationSchema;
export const revokeInvitationInputSchema = revokeInvitationSchema;

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
