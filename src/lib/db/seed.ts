import { argon2id, hash, needsRehash, verify } from "argon2";

import {
  ActivityAction,
  ActivityEntityType,
  ApplicationStage,
  EmploymentType,
  InterviewStatus,
  InterviewType,
  JobStatus,
  Prisma,
  Role,
} from "@/generated/prisma/client";
import type { DatabaseClient } from "@/lib/db/client";

export const DEMO_FIXTURE_IDS = {
  organization: "10000000-0000-4000-8000-000000000001",
  adminUser: "20000000-0000-4000-8000-000000000001",
  recruiterUser: "20000000-0000-4000-8000-000000000002",
  viewerUser: "20000000-0000-4000-8000-000000000003",
  adminMembership: "30000000-0000-4000-8000-000000000001",
  recruiterMembership: "30000000-0000-4000-8000-000000000002",
  viewerMembership: "30000000-0000-4000-8000-000000000003",
  engineeringJob: "40000000-0000-4000-8000-000000000001",
  designJob: "40000000-0000-4000-8000-000000000002",
  successJob: "40000000-0000-4000-8000-000000000003",
  ashaCandidate: "50000000-0000-4000-8000-000000000001",
  noahCandidate: "50000000-0000-4000-8000-000000000002",
  meiCandidate: "50000000-0000-4000-8000-000000000003",
  ashaApplication: "60000000-0000-4000-8000-000000000001",
  noahApplication: "60000000-0000-4000-8000-000000000002",
  meiApplication: "60000000-0000-4000-8000-000000000003",
  ashaInterview: "70000000-0000-4000-8000-000000000001",
  noahInterview: "70000000-0000-4000-8000-000000000002",
  meiInterview: "70000000-0000-4000-8000-000000000003",
  ashaNote: "80000000-0000-4000-8000-000000000001",
  activityOrganization: "90000000-0000-4000-8000-000000000001",
  activityEngineeringJob: "90000000-0000-4000-8000-000000000002",
  activityAshaCandidate: "90000000-0000-4000-8000-000000000003",
  activityAshaStage: "90000000-0000-4000-8000-000000000004",
  activityAshaInterview: "90000000-0000-4000-8000-000000000005",
  activityMeiHired: "90000000-0000-4000-8000-000000000006",
} as const;

const SEEDED_AT = new Date("2026-01-05T09:00:00.000Z");
const UPDATED_AT = new Date("2026-01-15T12:00:00.000Z");

const ARGON2_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export type DemoSeedConfig = {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

export type DemoSeedSummary = {
  organizationId: string;
  memberships: number;
  jobs: number;
  candidates: number;
  applications: number;
  interviews: number;
  notes: number;
  activityLogs: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createFixtureEmail(localPart: string, adminEmail: string) {
  const domain = normalizeEmail(adminEmail).split("@")[1] ?? "example.com";
  return `hiretrack.${localPart}@${domain}`;
}

async function resolveAdminPasswordHash(
  database: DatabaseClient,
  password: string,
) {
  const existing = await database.user.findUnique({
    where: { id: DEMO_FIXTURE_IDS.adminUser },
    select: { passwordHash: true },
  });

  if (existing?.passwordHash) {
    try {
      const usesApprovedPolicy =
        existing.passwordHash.startsWith("$argon2id$") &&
        !needsRehash(existing.passwordHash, ARGON2_OPTIONS);

      if (
        usesApprovedPolicy &&
        (await verify(existing.passwordHash, password))
      ) {
        return existing.passwordHash;
      }
    } catch {
      // Replace an invalid or legacy hash with the approved Argon2id format.
    }
  }

  return hash(password, ARGON2_OPTIONS);
}

export async function seedDemoDatabase(
  database: DatabaseClient,
  config: DemoSeedConfig,
): Promise<DemoSeedSummary> {
  const adminEmail = normalizeEmail(config.adminEmail);
  const recruiterEmail = createFixtureEmail("recruiter", adminEmail);
  const viewerEmail = createFixtureEmail("viewer", adminEmail);
  const passwordHash = await resolveAdminPasswordHash(
    database,
    config.adminPassword,
  );

  return database.$transaction(
    async (transaction) => {
      await transaction.organization.upsert({
        where: { id: DEMO_FIXTURE_IDS.organization },
        create: {
          id: DEMO_FIXTURE_IDS.organization,
          name: config.organizationName.trim(),
          slug: "hiretrack-demo",
          createdAt: SEEDED_AT,
          updatedAt: UPDATED_AT,
        },
        update: {
          name: config.organizationName.trim(),
          slug: "hiretrack-demo",
          updatedAt: UPDATED_AT,
        },
      });

      await transaction.user.upsert({
        where: { id: DEMO_FIXTURE_IDS.adminUser },
        create: {
          id: DEMO_FIXTURE_IDS.adminUser,
          name: config.adminName.trim(),
          email: adminEmail,
          emailNormalized: adminEmail,
          passwordHash,
          emailVerified: SEEDED_AT,
          sessionVersion: 0,
          createdAt: SEEDED_AT,
          updatedAt: UPDATED_AT,
        },
        update: {
          name: config.adminName.trim(),
          email: adminEmail,
          emailNormalized: adminEmail,
          passwordHash,
          emailVerified: SEEDED_AT,
          disabledAt: null,
          updatedAt: UPDATED_AT,
        },
      });

      await transaction.user.upsert({
        where: { id: DEMO_FIXTURE_IDS.recruiterUser },
        create: {
          id: DEMO_FIXTURE_IDS.recruiterUser,
          name: "Riya Recruiter",
          email: recruiterEmail,
          emailNormalized: recruiterEmail,
          emailVerified: SEEDED_AT,
          createdAt: SEEDED_AT,
          updatedAt: UPDATED_AT,
        },
        update: {
          name: "Riya Recruiter",
          email: recruiterEmail,
          emailNormalized: recruiterEmail,
          emailVerified: SEEDED_AT,
          disabledAt: null,
          updatedAt: UPDATED_AT,
        },
      });

      await transaction.user.upsert({
        where: { id: DEMO_FIXTURE_IDS.viewerUser },
        create: {
          id: DEMO_FIXTURE_IDS.viewerUser,
          name: "Victor Viewer",
          email: viewerEmail,
          emailNormalized: viewerEmail,
          emailVerified: SEEDED_AT,
          createdAt: SEEDED_AT,
          updatedAt: UPDATED_AT,
        },
        update: {
          name: "Victor Viewer",
          email: viewerEmail,
          emailNormalized: viewerEmail,
          emailVerified: SEEDED_AT,
          disabledAt: null,
          updatedAt: UPDATED_AT,
        },
      });

      const memberships = [
        {
          id: DEMO_FIXTURE_IDS.adminMembership,
          userId: DEMO_FIXTURE_IDS.adminUser,
          role: Role.ADMIN,
        },
        {
          id: DEMO_FIXTURE_IDS.recruiterMembership,
          userId: DEMO_FIXTURE_IDS.recruiterUser,
          role: Role.RECRUITER,
        },
        {
          id: DEMO_FIXTURE_IDS.viewerMembership,
          userId: DEMO_FIXTURE_IDS.viewerUser,
          role: Role.VIEWER,
        },
      ] as const;

      for (const membership of memberships) {
        await transaction.membership.upsert({
          where: { id: membership.id },
          create: {
            ...membership,
            organizationId: DEMO_FIXTURE_IDS.organization,
            version: 1,
            createdAt: SEEDED_AT,
            updatedAt: UPDATED_AT,
          },
          update: {
            userId: membership.userId,
            organizationId: DEMO_FIXTURE_IDS.organization,
            role: membership.role,
            version: 1,
            deactivatedAt: null,
            updatedAt: UPDATED_AT,
          },
        });
      }

      const jobs = [
        {
          id: DEMO_FIXTURE_IDS.engineeringJob,
          title: "Full-stack Product Engineer",
          department: "Engineering",
          location: "Remote — India",
          employmentType: EmploymentType.FULL_TIME,
          description:
            "Build reliable product workflows for a growing distributed team.",
          requirements:
            "Strong TypeScript fundamentals and thoughtful product judgment.",
          status: JobStatus.OPEN,
        },
        {
          id: DEMO_FIXTURE_IDS.designJob,
          title: "Product Designer",
          department: "Design",
          location: "Bengaluru, India",
          employmentType: EmploymentType.FULL_TIME,
          description:
            "Shape accessible recruiting experiences from research to delivery.",
          requirements:
            "A systems mindset, strong interaction design, and clear communication.",
          status: JobStatus.OPEN,
        },
        {
          id: DEMO_FIXTURE_IDS.successJob,
          title: "Customer Success Specialist",
          department: "Customer Success",
          location: "Hybrid — Delhi NCR",
          employmentType: EmploymentType.CONTRACT,
          description: "Help small teams adopt HireTrack Lite with confidence.",
          requirements:
            "Empathy, structured problem solving, and customer-facing experience.",
          status: JobStatus.CLOSED,
        },
      ] as const;

      for (const job of jobs) {
        await transaction.job.upsert({
          where: { id: job.id },
          create: {
            ...job,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.adminMembership,
            version: 1,
            createdAt: SEEDED_AT,
            updatedAt: UPDATED_AT,
          },
          update: {
            ...job,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.adminMembership,
            version: 1,
            deletedAt: null,
            updatedAt: UPDATED_AT,
          },
        });
      }

      const candidates = [
        {
          id: DEMO_FIXTURE_IDS.ashaCandidate,
          firstName: "Asha",
          lastName: "Verma",
          email: "asha.verma@example.com",
          phone: "+91 90000 00001",
          location: "Pune, India",
          skills: ["TypeScript", "React", "PostgreSQL"],
          experienceYears: new Prisma.Decimal("4.5"),
        },
        {
          id: DEMO_FIXTURE_IDS.noahCandidate,
          firstName: "Noah",
          lastName: "Williams",
          email: "noah.williams@example.com",
          phone: "+1 555 010 1002",
          location: "Austin, USA",
          skills: ["Product design", "Research", "Accessibility"],
          experienceYears: new Prisma.Decimal("6.0"),
        },
        {
          id: DEMO_FIXTURE_IDS.meiCandidate,
          firstName: "Mei",
          lastName: "Chen",
          email: "mei.chen@example.com",
          phone: "+65 6000 1003",
          location: "Singapore",
          skills: ["Customer success", "Onboarding", "Analytics"],
          experienceYears: new Prisma.Decimal("3.5"),
        },
      ] as const;

      for (const candidate of candidates) {
        await transaction.candidate.upsert({
          where: { id: candidate.id },
          create: {
            ...candidate,
            skills: [...candidate.skills],
            emailNormalized: candidate.email,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            createdAt: SEEDED_AT,
            updatedAt: UPDATED_AT,
          },
          update: {
            ...candidate,
            skills: [...candidate.skills],
            emailNormalized: candidate.email,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            deletedAt: null,
            updatedAt: UPDATED_AT,
          },
        });
      }

      const applications = [
        {
          id: DEMO_FIXTURE_IDS.ashaApplication,
          jobId: DEMO_FIXTURE_IDS.engineeringJob,
          candidateId: DEMO_FIXTURE_IDS.ashaCandidate,
          stage: ApplicationStage.INTERVIEW,
          source: "Employee referral",
          hiredAt: null,
          rejectedAt: null,
        },
        {
          id: DEMO_FIXTURE_IDS.noahApplication,
          jobId: DEMO_FIXTURE_IDS.designJob,
          candidateId: DEMO_FIXTURE_IDS.noahCandidate,
          stage: ApplicationStage.SCREENING,
          source: "Portfolio community",
          hiredAt: null,
          rejectedAt: null,
        },
        {
          id: DEMO_FIXTURE_IDS.meiApplication,
          jobId: DEMO_FIXTURE_IDS.successJob,
          candidateId: DEMO_FIXTURE_IDS.meiCandidate,
          stage: ApplicationStage.HIRED,
          source: "Direct application",
          hiredAt: new Date("2026-01-12T11:00:00.000Z"),
          rejectedAt: null,
        },
      ] as const;

      for (const application of applications) {
        await transaction.application.upsert({
          where: { id: application.id },
          create: {
            ...application,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            createdAt: SEEDED_AT,
            updatedAt: UPDATED_AT,
          },
          update: {
            ...application,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            deletedAt: null,
            updatedAt: UPDATED_AT,
          },
        });
      }

      const interviews = [
        {
          id: DEMO_FIXTURE_IDS.ashaInterview,
          applicationId: DEMO_FIXTURE_IDS.ashaApplication,
          interviewerMembershipId: DEMO_FIXTURE_IDS.adminMembership,
          type: InterviewType.TECHNICAL,
          startsAt: new Date("2030-02-12T09:30:00.000Z"),
          endsAt: new Date("2030-02-12T10:30:00.000Z"),
          timeZone: "Asia/Kolkata",
          meetingUrl: "https://meet.example.com/hiretrack-asha",
          status: InterviewStatus.SCHEDULED,
          feedback: null,
          rating: null,
        },
        {
          id: DEMO_FIXTURE_IDS.noahInterview,
          applicationId: DEMO_FIXTURE_IDS.noahApplication,
          interviewerMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          type: InterviewType.VIDEO,
          startsAt: new Date("2026-01-09T16:00:00.000Z"),
          endsAt: new Date("2026-01-09T16:45:00.000Z"),
          timeZone: "America/Chicago",
          meetingUrl: "https://meet.example.com/hiretrack-noah",
          status: InterviewStatus.CANCELLED,
          feedback: null,
          rating: null,
        },
        {
          id: DEMO_FIXTURE_IDS.meiInterview,
          applicationId: DEMO_FIXTURE_IDS.meiApplication,
          interviewerMembershipId: DEMO_FIXTURE_IDS.adminMembership,
          type: InterviewType.VIDEO,
          startsAt: new Date("2026-01-10T08:00:00.000Z"),
          endsAt: new Date("2026-01-10T08:45:00.000Z"),
          timeZone: "Asia/Singapore",
          meetingUrl: "https://meet.example.com/hiretrack-mei",
          status: InterviewStatus.COMPLETED,
          feedback: "Clear communicator with strong onboarding instincts.",
          rating: 5,
        },
      ] as const;

      for (const interview of interviews) {
        await transaction.interview.upsert({
          where: { id: interview.id },
          create: {
            ...interview,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            createdAt: SEEDED_AT,
            updatedAt: UPDATED_AT,
          },
          update: {
            ...interview,
            organizationId: DEMO_FIXTURE_IDS.organization,
            createdByMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
            version: 1,
            updatedAt: UPDATED_AT,
          },
        });
      }

      await transaction.candidateNote.upsert({
        where: { id: DEMO_FIXTURE_IDS.ashaNote },
        create: {
          id: DEMO_FIXTURE_IDS.ashaNote,
          organizationId: DEMO_FIXTURE_IDS.organization,
          candidateId: DEMO_FIXTURE_IDS.ashaCandidate,
          authorMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          body: "Strong product instincts; prepare a systems-design follow-up.",
          createdAt: SEEDED_AT,
          updatedAt: UPDATED_AT,
        },
        update: {
          organizationId: DEMO_FIXTURE_IDS.organization,
          candidateId: DEMO_FIXTURE_IDS.ashaCandidate,
          authorMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          body: "Strong product instincts; prepare a systems-design follow-up.",
          deletedAt: null,
          deletedByMembershipId: null,
          updatedAt: UPDATED_AT,
        },
      });

      const activityLogs = [
        {
          id: DEMO_FIXTURE_IDS.activityOrganization,
          actorMembershipId: DEMO_FIXTURE_IDS.adminMembership,
          entityType: ActivityEntityType.ORGANIZATION,
          entityId: DEMO_FIXTURE_IDS.organization,
          action: ActivityAction.CREATED,
          changes: { name: config.organizationName.trim() },
          createdAt: new Date("2026-01-05T09:00:00.000Z"),
        },
        {
          id: DEMO_FIXTURE_IDS.activityEngineeringJob,
          actorMembershipId: DEMO_FIXTURE_IDS.adminMembership,
          entityType: ActivityEntityType.JOB,
          entityId: DEMO_FIXTURE_IDS.engineeringJob,
          action: ActivityAction.CREATED,
          changes: { status: JobStatus.OPEN },
          createdAt: new Date("2026-01-06T10:00:00.000Z"),
        },
        {
          id: DEMO_FIXTURE_IDS.activityAshaCandidate,
          actorMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          entityType: ActivityEntityType.CANDIDATE,
          entityId: DEMO_FIXTURE_IDS.ashaCandidate,
          action: ActivityAction.CREATED,
          changes: { source: "Employee referral" },
          createdAt: new Date("2026-01-07T11:00:00.000Z"),
        },
        {
          id: DEMO_FIXTURE_IDS.activityAshaStage,
          actorMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          entityType: ActivityEntityType.APPLICATION,
          entityId: DEMO_FIXTURE_IDS.ashaApplication,
          action: ActivityAction.STAGE_CHANGED,
          changes: {
            from: ApplicationStage.SCREENING,
            to: ApplicationStage.INTERVIEW,
          },
          createdAt: new Date("2026-01-08T12:00:00.000Z"),
        },
        {
          id: DEMO_FIXTURE_IDS.activityAshaInterview,
          actorMembershipId: DEMO_FIXTURE_IDS.recruiterMembership,
          entityType: ActivityEntityType.INTERVIEW,
          entityId: DEMO_FIXTURE_IDS.ashaInterview,
          action: ActivityAction.SCHEDULED,
          changes: { type: InterviewType.TECHNICAL },
          createdAt: new Date("2026-01-09T13:00:00.000Z"),
        },
        {
          id: DEMO_FIXTURE_IDS.activityMeiHired,
          actorMembershipId: DEMO_FIXTURE_IDS.adminMembership,
          entityType: ActivityEntityType.APPLICATION,
          entityId: DEMO_FIXTURE_IDS.meiApplication,
          action: ActivityAction.STAGE_CHANGED,
          changes: {
            from: ApplicationStage.OFFERED,
            to: ApplicationStage.HIRED,
          },
          createdAt: new Date("2026-01-12T11:00:00.000Z"),
        },
      ] satisfies Array<
        Omit<Prisma.ActivityLogCreateManyInput, "organizationId">
      >;

      for (const activity of activityLogs) {
        await transaction.activityLog.upsert({
          where: { id: activity.id },
          create: {
            ...activity,
            organizationId: DEMO_FIXTURE_IDS.organization,
            updatedAt: UPDATED_AT,
          },
          update: {
            ...activity,
            organizationId: DEMO_FIXTURE_IDS.organization,
            updatedAt: UPDATED_AT,
          },
        });
      }

      const [
        membershipCount,
        jobCount,
        candidateCount,
        applicationCount,
        interviewCount,
        noteCount,
        activityCount,
      ] = await Promise.all([
        transaction.membership.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.job.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.candidate.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.application.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.interview.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.candidateNote.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
        transaction.activityLog.count({
          where: { organizationId: DEMO_FIXTURE_IDS.organization },
        }),
      ]);

      return {
        organizationId: DEMO_FIXTURE_IDS.organization,
        memberships: membershipCount,
        jobs: jobCount,
        candidates: candidateCount,
        applications: applicationCount,
        interviews: interviewCount,
        notes: noteCount,
        activityLogs: activityCount,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
