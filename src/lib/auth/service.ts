import "server-only";

import { randomUUID } from "node:crypto";

import {
  ActivityAction,
  ActivityEntityType,
  InvitationRole,
  Prisma,
  Role,
} from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createMailMessage, type MailAdapter } from "@/lib/auth/mail";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  ORGANIZATION_INVITATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  generateRawToken,
  hashToken,
} from "@/lib/auth/tokens";
import {
  normalizeEmail,
  type AcceptInvitationInput,
  type InviteMemberInput,
  type OnboardingInput,
  type ResetPasswordInput,
  type SignUpInput,
} from "@/lib/auth/validation";

export type AuthServiceDeps = {
  database: PrismaClient;
  mail: MailAdapter;
  baseUrl: string;
  now?: () => Date;
};

function slugify(value: string) {
  const slug = value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return slug || "workspace";
}

async function uniqueSlug(transaction: Prisma.TransactionClient, name: string) {
  const root = slugify(name);
  const existing = await transaction.organization.findUnique({
    where: { slug: root },
    select: { id: true },
  });
  return existing ? `${root}-${randomUUID().slice(0, 8)}` : root;
}

function expiry(now: Date, duration: number) {
  return new Date(now.getTime() + duration);
}
function tokenUrl(baseUrl: string, path: string, raw: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}#token=${encodeURIComponent(raw)}`;
}

export async function signUp(deps: AuthServiceDeps, input: SignUpInput) {
  const now = deps.now?.() ?? new Date();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const issued = await deps.database.$transaction(async (transaction) => {
    const existing = await transaction.user.findUnique({
      where: { emailNormalized: email },
      select: { id: true },
    });
    if (existing) throw new Error("AUTH_EMAIL_CONFLICT");
    const organization = await transaction.organization.create({
      data: {
        name: input.organizationName,
        slug: await uniqueSlug(transaction, input.organizationName),
      },
    });
    const user = await transaction.user.create({
      data: {
        name: input.name,
        email,
        emailNormalized: email,
        passwordHash,
        emailVerified: null,
      },
    });
    const membership = await transaction.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: Role.ADMIN,
      },
    });
    const rawToken = generateRawToken();
    await transaction.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    await transaction.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: expiry(now, EMAIL_VERIFICATION_TOKEN_TTL_MS),
      },
    });
    await transaction.activityLog.create({
      data: {
        organizationId: organization.id,
        actorMembershipId: membership.id,
        entityType: ActivityEntityType.ORGANIZATION,
        entityId: organization.id,
        action: ActivityAction.CREATED,
        changes: { name: organization.name },
      },
    });
    return { user, organization, rawToken };
  });
  await deps.mail.send(
    createMailMessage({
      kind: "verification",
      to: email,
      name: input.name,
      organizationName: issued.organization.name,
      url: tokenUrl(deps.baseUrl, "/verify-email", issued.rawToken),
    }),
  );
  return {
    userId: issued.user.id,
    organizationId: issued.organization.id,
    email,
    verificationPending: true,
  };
}

export async function verifyEmail(deps: AuthServiceDeps, rawToken: string) {
  const now = deps.now?.() ?? new Date();
  const result = await deps.database.$transaction(async (transaction) => {
    const token = await transaction.emailVerificationToken.findFirst({
      where: {
        tokenHash: hashToken(rawToken),
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, userId: true },
    });
    if (!token) return null;
    const consumed = await transaction.emailVerificationToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return null;
    await transaction.user.update({
      where: { id: token.userId },
      data: { emailVerified: now },
    });
    return { userId: token.userId };
  });
  return result;
}

export async function issueVerification(
  deps: AuthServiceDeps,
  emailInput: string,
) {
  const now = deps.now?.() ?? new Date();
  const email = normalizeEmail(emailInput);
  const issued = await deps.database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { emailNormalized: email },
      select: {
        id: true,
        name: true,
        emailVerified: true,
        memberships: {
          where: { deactivatedAt: null },
          take: 1,
          select: { organization: { select: { name: true } } },
        },
      },
    });
    if (!user || user.emailVerified) return null;
    const rawToken = generateRawToken();
    await transaction.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    await transaction.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: expiry(now, EMAIL_VERIFICATION_TOKEN_TTL_MS),
      },
    });
    return {
      rawToken,
      name: user.name,
      organizationName: user.memberships[0]?.organization.name,
    };
  });
  if (issued)
    await deps.mail.send(
      createMailMessage({
        kind: "verification",
        to: email,
        ...(issued.name !== undefined ? { name: issued.name } : {}),
        ...(issued.organizationName
          ? { organizationName: issued.organizationName }
          : {}),
        url: tokenUrl(deps.baseUrl, "/verify-email", issued.rawToken),
      }),
    );
  return { accepted: true };
}

export async function requestPasswordReset(
  deps: AuthServiceDeps,
  emailInput: string,
) {
  const now = deps.now?.() ?? new Date();
  const email = normalizeEmail(emailInput);
  const issued = await deps.database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { emailNormalized: email },
      select: {
        id: true,
        name: true,
        disabledAt: true,
        memberships: {
          where: { deactivatedAt: null },
          take: 1,
          select: { organization: { select: { name: true } } },
        },
      },
    });
    if (!user || user.disabledAt) return null;
    const rawToken = generateRawToken();
    await transaction.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
    await transaction.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: expiry(now, PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });
    return {
      rawToken,
      name: user.name,
      organizationName: user.memberships[0]?.organization.name,
    };
  });
  if (issued)
    await deps.mail.send(
      createMailMessage({
        kind: "password-reset",
        to: email,
        ...(issued.name !== undefined ? { name: issued.name } : {}),
        ...(issued.organizationName
          ? { organizationName: issued.organizationName }
          : {}),
        url: tokenUrl(deps.baseUrl, "/reset-password", issued.rawToken),
      }),
    );
  return { accepted: true };
}

export async function resetPassword(
  deps: AuthServiceDeps,
  input: ResetPasswordInput,
) {
  const now = deps.now?.() ?? new Date();
  const passwordHash = await hashPassword(input.newPassword);
  return deps.database.$transaction(async (transaction) => {
    const token = await transaction.passwordResetToken.findFirst({
      where: {
        tokenHash: hashToken(input.token),
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, userId: true },
    });
    if (!token) return null;
    const consumed = await transaction.passwordResetToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return null;
    await transaction.user.update({
      where: { id: token.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await transaction.passwordResetToken.updateMany({
      where: {
        userId: token.userId,
        id: { not: token.id },
        usedAt: null,
        invalidatedAt: null,
      },
      data: { invalidatedAt: now },
    });
    return { userId: token.userId };
  });
}

export async function completeOAuthOnboarding(
  deps: AuthServiceDeps,
  userId: string,
  input: OnboardingInput,
) {
  return deps.database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerified: true },
    });
    if (!user || !user.emailVerified) return null;
    const organization = await transaction.organization.create({
      data: {
        name: input.organizationName,
        slug: await uniqueSlug(transaction, input.organizationName),
      },
    });
    const membership = await transaction.membership.create({
      data: { organizationId: organization.id, userId, role: Role.ADMIN },
    });
    await transaction.activityLog.create({
      data: {
        organizationId: organization.id,
        actorMembershipId: membership.id,
        entityType: ActivityEntityType.ORGANIZATION,
        entityId: organization.id,
        action: ActivityAction.CREATED,
        changes: { name: organization.name, source: "oauth-onboarding" },
      },
    });
    return { organizationId: organization.id, membershipId: membership.id };
  });
}

type MemberContext = {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: Role;
  emailVerified: boolean;
};

export async function inviteMember(
  deps: AuthServiceDeps,
  context: MemberContext,
  input: InviteMemberInput,
) {
  if (context.role !== Role.ADMIN || !context.emailVerified)
    throw new Error("FORBIDDEN");
  const now = deps.now?.() ?? new Date();
  const email = normalizeEmail(input.email);
  const issued = await deps.database.$transaction(async (transaction) => {
    const existingMember = await transaction.membership
      .findUnique({
        where: {
          organizationId_userId: {
            organizationId: context.organizationId,
            userId:
              (
                await transaction.user.findUnique({
                  where: { emailNormalized: email },
                  select: { id: true },
                })
              )?.id ?? "00000000-0000-0000-0000-000000000000",
          },
        },
        select: { id: true },
      })
      .catch(() => null);
    if (existingMember) throw new Error("AUTH_EMAIL_CONFLICT");
    await transaction.organizationInvitation.updateMany({
      where: {
        organizationId: context.organizationId,
        emailNormalized: email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
    const rawToken = generateRawToken();
    const invitation = await transaction.organizationInvitation.create({
      data: {
        organizationId: context.organizationId,
        email,
        emailNormalized: email,
        role: input.role as InvitationRole,
        tokenHash: hashToken(rawToken),
        invitedByMembershipId: context.membershipId,
        expiresAt: expiry(now, ORGANIZATION_INVITATION_TOKEN_TTL_MS),
      },
      include: { organization: { select: { name: true } } },
    });
    await transaction.activityLog.create({
      data: {
        organizationId: context.organizationId,
        actorMembershipId: context.membershipId,
        entityType: ActivityEntityType.INVITATION,
        entityId: invitation.id,
        action: ActivityAction.INVITED,
        changes: { role: input.role },
      },
    });
    return {
      invitationId: invitation.id,
      rawToken,
      organizationName: invitation.organization.name,
    };
  });
  await deps.mail.send(
    createMailMessage({
      kind: "invitation",
      to: email,
      organizationName: issued.organizationName,
      url: tokenUrl(deps.baseUrl, "/accept-invite", issued.rawToken),
    }),
  );
  return { invitationId: issued.invitationId, accepted: true };
}

export async function revokeInvitation(
  deps: AuthServiceDeps,
  context: MemberContext,
  invitationId: string,
) {
  if (context.role !== Role.ADMIN || !context.emailVerified)
    throw new Error("FORBIDDEN");
  const now = deps.now?.() ?? new Date();
  const result = await deps.database.organizationInvitation.updateMany({
    where: {
      id: invitationId,
      organizationId: context.organizationId,
      acceptedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: now },
  });
  return result.count === 1;
}

export async function acceptOrganizationInvitation(
  deps: AuthServiceDeps,
  userId: string,
  input: AcceptInvitationInput,
) {
  const now = deps.now?.() ?? new Date();
  return deps.database.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { emailNormalized: true, emailVerified: true },
    });
    const invitation = await transaction.organizationInvitation.findFirst({
      where: {
        tokenHash: hashToken(input.token),
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
    });
    if (
      !user ||
      !user.emailVerified ||
      !invitation ||
      invitation.emailNormalized !== user.emailNormalized
    )
      return null;
    const existing = await transaction.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId,
        },
      },
    });
    const membership = existing
      ? await transaction.membership.update({
          where: { id: existing.id },
          data: {
            role:
              invitation.role === InvitationRole.RECRUITER
                ? Role.RECRUITER
                : Role.VIEWER,
            deactivatedAt: null,
            version: { increment: 1 },
          },
        })
      : await transaction.membership.create({
          data: {
            organizationId: invitation.organizationId,
            userId,
            role:
              invitation.role === InvitationRole.RECRUITER
                ? Role.RECRUITER
                : Role.VIEWER,
          },
        });
    const consumed = await transaction.organizationInvitation.updateMany({
      where: {
        id: invitation.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { acceptedAt: now },
    });
    if (consumed.count !== 1) return null;
    await transaction.activityLog.create({
      data: {
        organizationId: invitation.organizationId,
        actorMembershipId: membership.id,
        entityType: ActivityEntityType.MEMBERSHIP,
        entityId: membership.id,
        action: ActivityAction.CREATED,
        changes: { invitationId: invitation.id },
      },
    });
    return {
      organizationId: invitation.organizationId,
      membershipId: membership.id,
    };
  });
}
