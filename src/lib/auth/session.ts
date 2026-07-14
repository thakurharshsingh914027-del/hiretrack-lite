import "server-only";

import type { PrismaClient, Role } from "@/generated/prisma/client";
import { can, type Permission } from "@/lib/auth/policy";

export type SessionHint = {
  userId?: string;
  sessionVersion?: number;
  selectedOrganizationId?: string;
};

export type AccessContext = {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    disabledAt: Date | null;
    sessionVersion: number;
  };
  organization: { id: string; name: string; slug: string };
  membership: {
    id: string;
    role: Role;
    version: number;
    deactivatedAt: Date | null;
  };
  emailVerified: boolean;
};

export async function resolveAccessContext(
  database: PrismaClient,
  hint: SessionHint,
  options?: { organizationId?: string; requireVerified?: boolean },
): Promise<AccessContext | null> {
  if (!hint.userId) return null;
  const user = await database.user.findUnique({
    where: { id: hint.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      disabledAt: true,
      sessionVersion: true,
      memberships: {
        where: { deactivatedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (
    !user ||
    user.disabledAt ||
    (hint.sessionVersion !== undefined &&
      hint.sessionVersion !== user.sessionVersion)
  )
    return null;
  const selectedId = options?.organizationId ?? hint.selectedOrganizationId;
  const membership =
    (selectedId
      ? user.memberships.find((entry) => entry.organizationId === selectedId)
      : undefined) ?? user.memberships[0];
  if (!membership || (options?.requireVerified && !user.emailVerified))
    return null;
  return {
    user,
    organization: membership.organization,
    membership: {
      id: membership.id,
      role: membership.role,
      version: membership.version,
      deactivatedAt: membership.deactivatedAt,
    },
    emailVerified: Boolean(user.emailVerified),
  };
}

export async function requireAccess(
  database: PrismaClient,
  hint: SessionHint,
  permission: Permission,
  options?: { organizationId?: string },
) {
  const context = await resolveAccessContext(database, hint, options);
  if (
    !context ||
    !can(
      {
        role: context.membership.role,
        active: !context.membership.deactivatedAt,
        emailVerified: context.emailVerified,
      },
      permission,
    )
  )
    return null;
  return context;
}

export async function rotateSessionVersion(
  database: PrismaClient,
  userId: string,
) {
  const user = await database.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  return user.sessionVersion;
}
