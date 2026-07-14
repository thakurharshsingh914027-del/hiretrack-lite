import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/client";
import {
  can,
  canDeleteNote,
  permissions,
  preservesLastAdmin,
} from "@/lib/auth/policy";

const activeVerified = (role: Role) => ({
  role,
  active: true,
  emailVerified: true,
});

describe("authorization policy", () => {
  it("matches the documented role matrix", () => {
    const admin = activeVerified(Role.ADMIN);
    const recruiter = activeVerified(Role.RECRUITER);
    const viewer = activeVerified(Role.VIEWER);

    for (const permission of permissions) {
      expect(can(admin, permission)).toBe(true);
    }

    expect(can(recruiter, "jobs:write")).toBe(true);
    expect(can(recruiter, "candidates:export")).toBe(true);
    expect(can(recruiter, "members:manage")).toBe(false);
    expect(can(recruiter, "audit:read")).toBe(false);

    expect(can(viewer, "jobs:read")).toBe(true);
    expect(can(viewer, "resumes:download")).toBe(true);
    expect(can(viewer, "jobs:write")).toBe(false);
    expect(can(viewer, "candidates:export")).toBe(false);
    expect(can(null, "dashboard:read")).toBe(false);
  });

  it("requires a verified email for writes and exports", () => {
    const unverified = {
      role: Role.ADMIN,
      active: true,
      emailVerified: false,
    };

    expect(can(unverified, "dashboard:read")).toBe(true);
    expect(can(unverified, "jobs:write")).toBe(false);
    expect(can(unverified, "jobs:export")).toBe(false);
  });

  it("denies deactivated members and applies note ownership", () => {
    const inactive = {
      role: Role.ADMIN,
      active: false,
      emailVerified: true,
    };
    const recruiter = activeVerified(Role.RECRUITER);

    expect(can(inactive, "dashboard:read")).toBe(false);
    expect(canDeleteNote(recruiter, true)).toBe(true);
    expect(canDeleteNote(recruiter, false)).toBe(false);
    expect(canDeleteNote(activeVerified(Role.ADMIN), false)).toBe(true);
  });

  it("never removes the final active admin", () => {
    expect(
      preservesLastAdmin({
        activeAdminCount: 1,
        targetIsActiveAdmin: true,
        nextRole: Role.RECRUITER,
      }),
    ).toBe(false);
    expect(
      preservesLastAdmin({
        activeAdminCount: 2,
        targetIsActiveAdmin: true,
        deactivating: true,
      }),
    ).toBe(true);
    expect(
      preservesLastAdmin({
        activeAdminCount: 1,
        targetIsActiveAdmin: false,
        deactivating: true,
      }),
    ).toBe(true);
  });
});
