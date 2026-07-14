import { randomUUID } from "node:crypto";

import {
  ApplicationStage,
  EmploymentType,
  JobStatus,
  Prisma,
  Role,
} from "@/generated/prisma/client";
import type { DatabaseClient } from "@/lib/db/client";

function suffix() {
  return randomUUID().replaceAll("-", "").slice(0, 12);
}

export async function createTestTenant(
  database: DatabaseClient,
  role: Role = Role.ADMIN,
) {
  const key = suffix();
  const email = `member.${key}@example.com`;

  const organization = await database.organization.create({
    data: {
      name: `Test Organization ${key}`,
      slug: `test-organization-${key}`,
    },
  });

  const user = await database.user.create({
    data: {
      name: `Test Member ${key}`,
      email,
      emailNormalized: email,
      emailVerified: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  const membership = await database.membership.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role,
    },
  });

  return { organization, user, membership };
}

export type TestTenant = Awaited<ReturnType<typeof createTestTenant>>;

export async function createTestJob(
  database: DatabaseClient,
  tenant: TestTenant,
  overrides: Partial<{
    title: string;
    status: JobStatus;
  }> = {},
) {
  return database.job.create({
    data: {
      organizationId: tenant.organization.id,
      createdByMembershipId: tenant.membership.id,
      title: overrides.title ?? `Product Engineer ${suffix()}`,
      department: "Engineering",
      location: "Remote",
      employmentType: EmploymentType.FULL_TIME,
      description: "Build a reliable, accessible product experience.",
      requirements: "Strong product engineering fundamentals.",
      status: overrides.status ?? JobStatus.OPEN,
    },
  });
}

export async function createTestCandidate(
  database: DatabaseClient,
  tenant: TestTenant,
  overrides: Partial<{
    email: string;
    firstName: string;
    lastName: string;
  }> = {},
) {
  const email = (overrides.email ?? `candidate.${suffix()}@example.com`)
    .trim()
    .toLowerCase();

  return database.candidate.create({
    data: {
      organizationId: tenant.organization.id,
      createdByMembershipId: tenant.membership.id,
      firstName: overrides.firstName ?? "Casey",
      lastName: overrides.lastName ?? "Candidate",
      email,
      emailNormalized: email,
      skills: ["TypeScript"],
      experienceYears: new Prisma.Decimal("3.0"),
    },
  });
}

export async function createTestApplication(
  database: DatabaseClient,
  tenant: TestTenant,
  jobId: string,
  candidateId: string,
  stage: ApplicationStage = ApplicationStage.APPLIED,
) {
  return database.application.create({
    data: {
      organizationId: tenant.organization.id,
      createdByMembershipId: tenant.membership.id,
      jobId,
      candidateId,
      stage,
      hiredAt:
        stage === ApplicationStage.HIRED
          ? new Date("2026-01-10T00:00:00.000Z")
          : null,
      rejectedAt:
        stage === ApplicationStage.REJECTED
          ? new Date("2026-01-10T00:00:00.000Z")
          : null,
    },
  });
}
