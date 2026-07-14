import { Role } from "@/generated/prisma/client";

export const permissions = [
  "dashboard:read",
  "jobs:read",
  "jobs:write",
  "jobs:export",
  "candidates:read",
  "candidates:write",
  "candidates:export",
  "resumes:download",
  "applications:read",
  "applications:write",
  "interviews:read",
  "interviews:write",
  "notes:read",
  "notes:create",
  "notes:delete-own",
  "notes:delete-any",
  "analytics:read",
  "members:manage",
  "roles:manage",
  "audit:read",
  "profile:read-own",
  "profile:write-own",
] as const;

export type Permission = (typeof permissions)[number];

const READ_PERMISSIONS = [
  "dashboard:read",
  "jobs:read",
  "candidates:read",
  "resumes:download",
  "applications:read",
  "interviews:read",
  "notes:read",
  "analytics:read",
  "profile:read-own",
] satisfies Permission[];

const RECRUITING_WRITES = [
  "jobs:write",
  "jobs:export",
  "candidates:write",
  "candidates:export",
  "applications:write",
  "interviews:write",
  "notes:create",
  "notes:delete-own",
  "profile:write-own",
] satisfies Permission[];

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  [Role.ADMIN]: new Set<Permission>([
    ...READ_PERMISSIONS,
    ...RECRUITING_WRITES,
    "notes:delete-any",
    "members:manage",
    "roles:manage",
    "audit:read",
  ]),
  [Role.RECRUITER]: new Set<Permission>([
    ...READ_PERMISSIONS,
    ...RECRUITING_WRITES,
  ]),
  [Role.VIEWER]: new Set<Permission>([
    ...READ_PERMISSIONS,
    "profile:write-own",
  ]),
};

const VERIFIED_EMAIL_REQUIRED = new Set<Permission>([
  "jobs:write",
  "jobs:export",
  "candidates:write",
  "candidates:export",
  "applications:write",
  "interviews:write",
  "notes:create",
  "notes:delete-own",
  "notes:delete-any",
  "members:manage",
  "roles:manage",
  "profile:write-own",
]);

export type PolicySubject = {
  role: Role;
  emailVerified: boolean;
  active: boolean;
};

export function can(subject: PolicySubject | null, permission: Permission) {
  if (!subject?.active) return false;
  if (!rolePermissions[subject.role].has(permission)) return false;
  if (VERIFIED_EMAIL_REQUIRED.has(permission) && !subject.emailVerified) {
    return false;
  }
  return true;
}

export function canDeleteNote(
  subject: PolicySubject | null,
  isAuthor: boolean,
) {
  return (
    can(subject, "notes:delete-any") ||
    (isAuthor && can(subject, "notes:delete-own"))
  );
}

export function preservesLastAdmin(input: {
  activeAdminCount: number;
  targetIsActiveAdmin: boolean;
  nextRole?: Role;
  deactivating?: boolean;
}) {
  if (!input.targetIsActiveAdmin) return true;
  const removesAdmin = input.deactivating || input.nextRole !== Role.ADMIN;
  return !removesAdmin || input.activeAdminCount > 1;
}
