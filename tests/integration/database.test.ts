// @vitest-environment node

import { argon2i, hash, verify } from "argon2";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  ActivityAction,
  ActivityEntityType,
  ApplicationStage,
  InterviewStatus,
  InterviewType,
  InvitationRole,
  Prisma,
} from "@/generated/prisma/client";
import {
  createTestApplication,
  createTestCandidate,
  createTestJob,
  createTestTenant,
} from "../factories/database";
import { createPrismaClient } from "@/lib/db/client";
import type { DatabaseClient } from "@/lib/db/client";
import { DEMO_FIXTURE_IDS, seedDemoDatabase } from "@/lib/db/seed";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseDescribe = testDatabaseUrl ? describe : describe.skip;

if (!testDatabaseUrl && process.env.npm_lifecycle_event === "test:db") {
  describe("database test configuration", () => {
    it("requires TEST_DATABASE_URL", () => {
      expect.fail(
        "TEST_DATABASE_URL is required for npm run test:db; use an isolated PostgreSQL database.",
      );
    });
  });
}

function assertSafeTestDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);
  const resetAcknowledged = process.env.ALLOW_DATABASE_RESET === "true";
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const schemaName = url.searchParams.get("schema") ?? "public";
  const looksTestOnly = [databaseName, schemaName].some((value) =>
    /(^|[-_])test(?:[-_]|$)/i.test(value),
  );

  if (!isLocal && process.env.ALLOW_REMOTE_DATABASE_TESTS !== "true") {
    throw new Error(
      "Remote database tests require ALLOW_REMOTE_DATABASE_TESTS=true and an isolated test database.",
    );
  }

  if (!looksTestOnly && !resetAcknowledged) {
    throw new Error(
      "Destructive database tests require a database/schema name containing 'test' or ALLOW_DATABASE_RESET=true.",
    );
  }

  const testTarget = `${url.protocol}//${url.hostname.toLowerCase()}:${url.port}/${databaseName}?schema=${schemaName}`;
  const applicationTargets = [
    process.env.DATABASE_URL,
    process.env.DIRECT_URL,
  ].flatMap((value) => {
    if (!value) return [];

    try {
      const applicationUrl = new URL(value);
      const applicationDatabase = decodeURIComponent(
        applicationUrl.pathname.replace(/^\//, ""),
      );
      const applicationSchema =
        applicationUrl.searchParams.get("schema") ?? "public";

      return [
        `${applicationUrl.protocol}//${applicationUrl.hostname.toLowerCase()}:${applicationUrl.port}/${applicationDatabase}?schema=${applicationSchema}`,
      ];
    } catch {
      return [];
    }
  });

  if (applicationTargets.includes(testTarget) && !resetAcknowledged) {
    throw new Error(
      "TEST_DATABASE_URL targets the configured application database. Set ALLOW_DATABASE_RESET=true only for a disposable database.",
    );
  }
}

async function clearDatabase(database: DatabaseClient) {
  await database.activityLog.deleteMany();
  await database.candidateNote.deleteMany();
  await database.interview.deleteMany();
  await database.application.deleteMany();
  await database.candidate.deleteMany();
  await database.job.deleteMany();
  await database.organizationInvitation.deleteMany();
  await database.membership.deleteMany();
  await database.account.deleteMany();
  await database.emailVerificationToken.deleteMany();
  await database.passwordResetToken.deleteMany();
  await database.organization.deleteMany();
  await database.user.deleteMany();
}

databaseDescribe("PostgreSQL data model", () => {
  let database!: DatabaseClient;

  beforeAll(() => {
    assertSafeTestDatabaseUrl(testDatabaseUrl!);
    database = createPrismaClient(testDatabaseUrl!);
  });

  beforeEach(async () => {
    await clearDatabase(database);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("seeds coherent demo data idempotently with an Argon2id password", async () => {
    const config = {
      organizationName: "HireTrack Test Demo",
      adminName: "Demo Admin",
      adminEmail: "demo-admin@example.com",
      adminPassword: "correct-horse-battery-staple",
    };

    const first = await seedDemoDatabase(database, config);
    const firstAdmin = await database.user.findUniqueOrThrow({
      where: { id: DEMO_FIXTURE_IDS.adminUser },
      select: { passwordHash: true },
    });
    const second = await seedDemoDatabase(database, config);

    expect(second).toEqual(first);
    expect(second).toMatchObject({
      memberships: 3,
      jobs: 3,
      candidates: 3,
      applications: 3,
      interviews: 3,
      notes: 1,
      activityLogs: 6,
    });

    const admin = await database.user.findUniqueOrThrow({
      where: { id: DEMO_FIXTURE_IDS.adminUser },
      select: { emailVerified: true, passwordHash: true },
    });

    expect(admin.emailVerified).toEqual(new Date("2026-01-05T09:00:00.000Z"));
    expect(admin.passwordHash).toBe(firstAdmin.passwordHash);
    expect(admin.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await verify(admin.passwordHash!, config.adminPassword)).toBe(true);

    const legacyHash = await hash(config.adminPassword, {
      type: argon2i,
      memoryCost: 4_096,
      timeCost: 1,
      parallelism: 1,
    });
    await database.user.update({
      where: { id: DEMO_FIXTURE_IDS.adminUser },
      data: { passwordHash: legacyHash },
    });

    await seedDemoDatabase(database, config);
    const upgradedAdmin = await database.user.findUniqueOrThrow({
      where: { id: DEMO_FIXTURE_IDS.adminUser },
      select: { passwordHash: true },
    });

    expect(upgradedAdmin.passwordHash).not.toBe(legacyHash);
    expect(upgradedAdmin.passwordHash).toMatch(
      /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/,
    );
    expect(
      await verify(upgradedAdmin.passwordHash!, config.adminPassword),
    ).toBe(true);
  }, 20_000);

  it("enforces active candidate email uniqueness within a tenant only", async () => {
    const firstTenant = await createTestTenant(database);
    const secondTenant = await createTestTenant(database);
    const email = "same.candidate@example.com";

    const firstCandidate = await createTestCandidate(database, firstTenant, {
      email,
    });

    await expect(
      database.candidate.create({
        data: {
          organizationId: firstTenant.organization.id,
          createdByMembershipId: firstTenant.membership.id,
          firstName: "Mismatched",
          lastName: "Identity",
          email: "Mixed.Case@example.com ",
          emailNormalized: "bypass@example.com",
          skills: [],
          experienceYears: new Prisma.Decimal(0),
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      createTestCandidate(database, firstTenant, { email }),
    ).rejects.toMatchObject({ code: "P2002" });

    await expect(
      createTestCandidate(database, secondTenant, { email }),
    ).resolves.toMatchObject({ emailNormalized: email });

    await database.candidate.update({
      where: { id: firstCandidate.id },
      data: { deletedAt: new Date("2026-02-01T00:00:00.000Z") },
    });

    await expect(
      createTestCandidate(database, firstTenant, { email }),
    ).resolves.toMatchObject({ emailNormalized: email });
  });

  it("allows only one active application per candidate and job", async () => {
    const tenant = await createTestTenant(database);
    const job = await createTestJob(database, tenant);
    const candidate = await createTestCandidate(database, tenant);
    const application = await createTestApplication(
      database,
      tenant,
      job.id,
      candidate.id,
    );

    await expect(
      createTestApplication(database, tenant, job.id, candidate.id),
    ).rejects.toMatchObject({ code: "P2002" });

    await database.application.update({
      where: { id: application.id },
      data: { deletedAt: new Date("2026-02-01T00:00:00.000Z") },
    });

    await expect(
      createTestApplication(database, tenant, job.id, candidate.id),
    ).resolves.toMatchObject({ stage: ApplicationStage.APPLIED });
  });

  it("rejects cross-tenant domain and attribution relations", async () => {
    const firstTenant = await createTestTenant(database);
    const secondTenant = await createTestTenant(database);
    const firstJob = await createTestJob(database, firstTenant);
    const secondCandidate = await createTestCandidate(database, secondTenant);

    await expect(
      createTestApplication(
        database,
        secondTenant,
        firstJob.id,
        secondCandidate.id,
      ),
    ).rejects.toBeDefined();

    await expect(
      database.job.create({
        data: {
          organizationId: firstTenant.organization.id,
          createdByMembershipId: secondTenant.membership.id,
          title: "Cross-tenant job",
          department: "Security",
          location: "Remote",
          employmentType: "FULL_TIME",
          description: "This insert must never cross the tenant boundary.",
          requirements: "A matching organization membership.",
          status: "OPEN",
        },
      }),
    ).rejects.toBeDefined();
  });

  it("enforces interview, resume, application, and note checks", async () => {
    const tenant = await createTestTenant(database);
    const job = await createTestJob(database, tenant);
    const candidate = await createTestCandidate(database, tenant);
    const application = await createTestApplication(
      database,
      tenant,
      job.id,
      candidate.id,
    );

    await expect(
      database.interview.create({
        data: {
          organizationId: tenant.organization.id,
          applicationId: application.id,
          interviewerMembershipId: tenant.membership.id,
          createdByMembershipId: tenant.membership.id,
          type: InterviewType.VIDEO,
          startsAt: new Date("2026-03-01T11:00:00.000Z"),
          endsAt: new Date("2026-03-01T10:00:00.000Z"),
          timeZone: "UTC",
          status: InterviewStatus.COMPLETED,
          rating: 5,
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.interview.create({
        data: {
          organizationId: tenant.organization.id,
          applicationId: application.id,
          interviewerMembershipId: tenant.membership.id,
          createdByMembershipId: tenant.membership.id,
          type: InterviewType.VIDEO,
          startsAt: new Date("2026-03-01T10:00:00.000Z"),
          endsAt: new Date("2026-03-01T11:00:00.000Z"),
          timeZone: "UTC",
          status: InterviewStatus.COMPLETED,
          rating: 6,
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.candidate.create({
        data: {
          organizationId: tenant.organization.id,
          createdByMembershipId: tenant.membership.id,
          firstName: "Invalid",
          lastName: "Resume",
          email: "invalid.resume@example.com",
          emailNormalized: "invalid.resume@example.com",
          experienceYears: new Prisma.Decimal(1),
          resumeStorageKey: "private/resume.pdf",
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.application.create({
        data: {
          organizationId: tenant.organization.id,
          jobId: job.id,
          candidateId: candidate.id,
          createdByMembershipId: tenant.membership.id,
          stage: ApplicationStage.HIRED,
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.candidateNote.create({
        data: {
          organizationId: tenant.organization.id,
          candidateId: candidate.id,
          authorMembershipId: tenant.membership.id,
          body: "Deletion state must be coherent.",
          deletedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toBeDefined();
  });

  it("enforces pending invitation and active-token uniqueness", async () => {
    const tenant = await createTestTenant(database);
    const invitedEmail = "invitee@example.com";

    await expect(
      database.organizationInvitation.create({
        data: {
          organizationId: tenant.organization.id,
          invitedByMembershipId: tenant.membership.id,
          email: "Mixed.Invitee@example.com ",
          emailNormalized: "bypass@example.com",
          role: InvitationRole.RECRUITER,
          tokenHash: "e".repeat(64),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.organizationInvitation.create({
        data: {
          organizationId: tenant.organization.id,
          invitedByMembershipId: tenant.membership.id,
          email: "bad-hash@example.com",
          emailNormalized: "bad-hash@example.com",
          role: InvitationRole.RECRUITER,
          tokenHash: "not-a-sha-256-digest".padEnd(64, "x"),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toBeDefined();
    const firstInvitation = await database.organizationInvitation.create({
      data: {
        organizationId: tenant.organization.id,
        invitedByMembershipId: tenant.membership.id,
        email: invitedEmail,
        emailNormalized: invitedEmail,
        role: InvitationRole.RECRUITER,
        tokenHash: "a".repeat(64),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    });

    await expect(
      database.organizationInvitation.create({
        data: {
          organizationId: tenant.organization.id,
          invitedByMembershipId: tenant.membership.id,
          email: invitedEmail,
          emailNormalized: invitedEmail,
          role: InvitationRole.VIEWER,
          tokenHash: "b".repeat(64),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await database.organizationInvitation.update({
      where: { id: firstInvitation.id },
      data: { revokedAt: new Date("2026-03-01T00:00:00.000Z") },
    });

    await expect(
      database.organizationInvitation.create({
        data: {
          organizationId: tenant.organization.id,
          invitedByMembershipId: tenant.membership.id,
          email: invitedEmail,
          emailNormalized: invitedEmail,
          role: InvitationRole.VIEWER,
          tokenHash: "b".repeat(64),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).resolves.toMatchObject({ role: InvitationRole.VIEWER });

    await database.emailVerificationToken.create({
      data: {
        userId: tenant.user.id,
        tokenHash: "c".repeat(64),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    });

    await expect(
      database.emailVerificationToken.create({
        data: {
          userId: tenant.user.id,
          tokenHash: "d".repeat(64),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await database.passwordResetToken.create({
      data: {
        userId: tenant.user.id,
        tokenHash: "e".repeat(64),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    });

    await expect(
      database.passwordResetToken.create({
        data: {
          userId: tenant.user.id,
          tokenHash: "f".repeat(64),
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("retains activity history when an actor membership is hard-deleted", async () => {
    const tenant = await createTestTenant(database);
    const activity = await database.activityLog.create({
      data: {
        organizationId: tenant.organization.id,
        actorMembershipId: tenant.membership.id,
        entityType: ActivityEntityType.MEMBERSHIP,
        entityId: tenant.membership.id,
        action: ActivityAction.CREATED,
      },
    });

    await database.membership.delete({ where: { id: tenant.membership.id } });

    await expect(
      database.activityLog.findUniqueOrThrow({ where: { id: activity.id } }),
    ).resolves.toMatchObject({
      organizationId: tenant.organization.id,
      actorMembershipId: null,
    });
  });

  it("accepts only object-shaped audit summaries from the matching tenant", async () => {
    const tenant = await createTestTenant(database);

    await expect(
      database.activityLog.create({
        data: {
          organizationId: tenant.organization.id,
          actorMembershipId: tenant.membership.id,
          entityType: ActivityEntityType.MEMBERSHIP,
          entityId: tenant.membership.id,
          action: ActivityAction.UPDATED,
          changes: ["unsafe", "shape"],
        },
      }),
    ).rejects.toBeDefined();

    await expect(
      database.activityLog.create({
        data: {
          organizationId: tenant.organization.id,
          actorMembershipId: tenant.membership.id,
          entityType: ActivityEntityType.MEMBERSHIP,
          entityId: tenant.membership.id,
          action: ActivityAction.UPDATED,
          changes: { role: { from: "VIEWER", to: "RECRUITER" } },
        },
      }),
    ).resolves.toMatchObject({ entityId: tenant.membership.id });
  });
});
