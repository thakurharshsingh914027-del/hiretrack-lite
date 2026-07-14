"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";

import { auth, signIn, signOut } from "../../../auth";
import { getDatabase } from "@/lib/db";
import { getMailAdapter } from "@/lib/auth/mail";
import {
  getAuthRateLimiter,
  authRateLimitKeys,
  getRequestIp,
} from "@/lib/auth/rate-limit";
import { resolveAccessContext } from "@/lib/auth/session";
import { getSafeCallbackUrl } from "@/lib/auth/urls";
import {
  acceptOrganizationInvitation,
  completeOAuthOnboarding,
  inviteMember,
  requestPasswordReset,
  resetPassword,
  revokeInvitation,
  signUp,
  verifyEmail,
  issueVerification,
} from "@/lib/auth/service";
import {
  acceptInvitationSchema,
  completeOAuthOnboardingSchema,
  emailSchema,
  inviteMemberSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordFormSchema,
  revokeInvitationSchema,
  signUpSchema,
  verifyEmailSchema,
} from "@/lib/auth/validation";
import {
  ActionResult,
  GENERIC_CREDENTIALS_MESSAGE,
  GENERIC_TOKEN_MESSAGE,
  RateLimitError,
  safeFailure,
  validationFailure,
} from "@/lib/auth/errors";

const baseUrl =
  process.env.AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";
const deps = () => ({
  database: getDatabase(),
  mail: getMailAdapter(),
  baseUrl,
});
const zodFields = (error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) => error.flatten().fieldErrors;

export async function signUpAction(
  formData: FormData,
): Promise<ActionResult<{ email: string; verificationPending: true }>> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  try {
    const result = await signUp(deps(), parsed.data);
    return {
      ok: true,
      data: { email: result.email, verificationPending: true },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_EMAIL_CONFLICT")
      return safeFailure(
        "CONFLICT",
        "An account with that email already exists.",
      );
    return safeFailure(
      "SERVICE_UNAVAILABLE",
      "We could not complete sign up. Please try again.",
    );
  }
}

export async function loginAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  const email = parsed.data.email;
  try {
    const requestHeaders = await headers();
    await getAuthRateLimiter().check(
      authRateLimitKeys(getRequestIp(requestHeaders), email),
    );
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
      redirectTo: getSafeCallbackUrl(parsed.data.callbackUrl),
    });
    return {
      ok: true,
      data: { redirectTo: getSafeCallbackUrl(parsed.data.callbackUrl) },
    };
  } catch (error) {
    if (error instanceof RateLimitError)
      return safeFailure(
        "RATE_LIMITED",
        "Too many attempts. Try again later.",
        { retryAfter: error.retryAfter },
      );
    if (error instanceof AuthError)
      return safeFailure("INVALID_CREDENTIALS", GENERIC_CREDENTIALS_MESSAGE);
    return safeFailure("INVALID_CREDENTIALS", GENERIC_CREDENTIALS_MESSAGE);
  }
}

export async function verifyEmailAction(
  formData: FormData,
): Promise<ActionResult<{ verified: true }>> {
  const parsed = verifyEmailSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success)
    return safeFailure("INVALID_TOKEN", GENERIC_TOKEN_MESSAGE);
  const result = await verifyEmail(deps(), parsed.data.token);
  return result
    ? { ok: true, data: { verified: true } }
    : safeFailure("INVALID_TOKEN", GENERIC_TOKEN_MESSAGE);
}

export async function resendVerificationAction(
  formData: FormData,
): Promise<ActionResult<{ accepted: true }>> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    return validationFailure({ email: ["Enter a valid email address"] });
  try {
    await getAuthRateLimiter().consume(
      authRateLimitKeys(getRequestIp(await headers()), parsed.data),
    );
  } catch (error) {
    if (error instanceof RateLimitError)
      return safeFailure(
        "RATE_LIMITED",
        "Too many requests. Try again later.",
        { retryAfter: error.retryAfter },
      );
  }
  try {
    await issueVerification(deps(), parsed.data);
  } catch {
    /* generic response intentionally hides account state */
  }
  return { ok: true, data: { accepted: true } };
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ActionResult<{ accepted: true }>> {
  const parsed = requestPasswordResetSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  try {
    await getAuthRateLimiter().consume(
      authRateLimitKeys(getRequestIp(await headers()), parsed.data.email),
    );
  } catch (error) {
    if (error instanceof RateLimitError)
      return safeFailure(
        "RATE_LIMITED",
        "Too many requests. Try again later.",
        { retryAfter: error.retryAfter },
      );
  }
  try {
    await requestPasswordReset(deps(), parsed.data.email);
  } catch {
    /* same generic response */
  }
  return { ok: true, data: { accepted: true } };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult<{ reset: true }>> {
  const parsed = resetPasswordFormSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  const result = await resetPassword(deps(), {
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
  });
  return result
    ? { ok: true, data: { reset: true } }
    : safeFailure("INVALID_TOKEN", GENERIC_TOKEN_MESSAGE);
}

export async function completeOAuthOnboardingAction(
  formData: FormData,
): Promise<ActionResult<{ organizationId: string }>> {
  const parsed = completeOAuthOnboardingSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  const session = await auth();
  if (!session?.user.id)
    return safeFailure("UNAUTHENTICATED", "Sign in to continue.");
  const result = await completeOAuthOnboarding(
    deps(),
    session.user.id,
    parsed.data,
  );
  return result
    ? { ok: true, data: { organizationId: result.organizationId } }
    : safeFailure("FORBIDDEN", "Your account is not ready for onboarding.");
}

export async function acceptInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ organizationId: string }>> {
  const parsed = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
  });
  if (!parsed.success)
    return safeFailure("INVALID_TOKEN", GENERIC_TOKEN_MESSAGE);
  const session = await auth();
  if (!session?.user.id)
    return safeFailure(
      "UNAUTHENTICATED",
      "Sign in or create an account before accepting this invitation.",
    );
  const result = await acceptOrganizationInvitation(
    deps(),
    session.user.id,
    parsed.data,
  );
  return result
    ? { ok: true, data: { organizationId: result.organizationId } }
    : safeFailure("INVALID_TOKEN", GENERIC_TOKEN_MESSAGE);
}

export async function inviteMemberAction(
  formData: FormData,
): Promise<ActionResult<{ accepted: true }>> {
  const parsed = inviteMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  const session = await auth();
  if (!session?.user.id)
    return safeFailure("UNAUTHENTICATED", "Sign in to continue.");
  const context = await resolveAccessContext(
    getDatabase(),
    {
      userId: session.user.id,
      sessionVersion: session.sessionVersion,
      ...(session.selectedOrganizationId
        ? { selectedOrganizationId: session.selectedOrganizationId }
        : {}),
    },
    { requireVerified: true },
  );
  if (!context)
    return safeFailure(
      "FORBIDDEN",
      "You do not have permission to invite members.",
    );
  try {
    await inviteMember(
      { ...deps() },
      {
        userId: context.user.id,
        organizationId: context.organization.id,
        membershipId: context.membership.id,
        role: context.membership.role,
        emailVerified: context.emailVerified,
      },
      parsed.data,
    );
    return { ok: true, data: { accepted: true } };
  } catch {
    return safeFailure(
      "FORBIDDEN",
      "You do not have permission to invite members.",
    );
  }
}

export async function revokeInvitationAction(
  formData: FormData,
): Promise<ActionResult<{ revoked: true }>> {
  const parsed = revokeInvitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(zodFields(parsed.error));
  const session = await auth();
  if (!session?.user.id)
    return safeFailure("UNAUTHENTICATED", "Sign in to continue.");
  const context = await resolveAccessContext(
    getDatabase(),
    {
      userId: session.user.id,
      sessionVersion: session.sessionVersion,
      ...(session.selectedOrganizationId
        ? { selectedOrganizationId: session.selectedOrganizationId }
        : {}),
    },
    { requireVerified: true },
  );
  if (!context || context.membership.role !== "ADMIN")
    return safeFailure(
      "FORBIDDEN",
      "You do not have permission to revoke invitations.",
    );
  const revoked = await revokeInvitation(
    { ...deps() },
    {
      userId: context.user.id,
      organizationId: context.organization.id,
      membershipId: context.membership.id,
      role: context.membership.role,
      emailVerified: context.emailVerified,
    },
    parsed.data.invitationId,
  );
  return revoked
    ? { ok: true, data: { revoked: true } }
    : safeFailure("NOT_FOUND", "Invitation not found.");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function oauthGoogleAction(formData: FormData) {
  await signIn("google", {
    redirectTo: getSafeCallbackUrl(formData.get("callbackUrl")),
  });
}

export async function oauthGithubAction(formData: FormData) {
  await signIn("github", {
    redirectTo: getSafeCallbackUrl(formData.get("callbackUrl")),
  });
}

// Two-argument wrappers are explicit Server Actions so React can safely pass
// them across the server/client form boundary used by useActionState.
export async function loginFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return loginAction(formData);
}
export async function oauthGoogleFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  await oauthGoogleAction(formData);
  return { ok: true as const, data: null };
}
export async function oauthGithubFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  await oauthGithubAction(formData);
  return { ok: true as const, data: null };
}
export async function signUpFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return signUpAction(formData);
}
export async function verifyEmailFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return verifyEmailAction(formData);
}
export async function resendVerificationFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return resendVerificationAction(formData);
}
export async function requestPasswordResetFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return requestPasswordResetAction(formData);
}
export async function resetPasswordFormAction(
  _previous: ActionResult<unknown>,
  formData: FormData,
) {
  return resetPasswordAction(formData);
}
