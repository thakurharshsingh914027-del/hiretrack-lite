-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECRUITER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationRole" AS ENUM ('RECRUITER', 'VIEWER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE_SCREEN', 'VIDEO', 'ONSITE', 'TECHNICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('ORGANIZATION', 'USER', 'MEMBERSHIP', 'INVITATION', 'JOB', 'CANDIDATE', 'APPLICATION', 'INTERVIEW', 'CANDIDATE_NOTE');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED', 'STATUS_CHANGED', 'STAGE_CHANGED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'INVITED', 'INVITATION_REVOKED', 'ROLE_CHANGED', 'DEACTIVATED', 'REACTIVATED', 'NOTE_ADDED', 'NOTE_DELETED', 'RESUME_REPLACED', 'EXPORTED', 'BULK_UPDATED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120),
    "email" VARCHAR(320) NOT NULL,
    "email_normalized" VARCHAR(320) NOT NULL,
    "password_hash" TEXT,
    "email_verified_at" TIMESTAMPTZ(3),
    "image" TEXT,
    "session_version" INTEGER NOT NULL DEFAULT 0,
    "disabled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" VARCHAR(80),
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deactivated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "department" VARCHAR(120) NOT NULL,
    "location" VARCHAR(180) NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "first_name" VARCHAR(120) NOT NULL,
    "last_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "email_normalized" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40),
    "location" VARCHAR(180),
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_years" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "resume_storage_key" TEXT,
    "resume_file_name" VARCHAR(255),
    "resume_mime_type" VARCHAR(120),
    "resume_size_bytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'APPLIED',
    "source" VARCHAR(120),
    "hired_at" TIMESTAMPTZ(3),
    "rejected_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "interviewer_membership_id" UUID NOT NULL,
    "type" "InterviewType" NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "time_zone" VARCHAR(100) NOT NULL,
    "meeting_url" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "rating" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_membership_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "author_membership_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by_membership_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidate_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "actor_membership_id" UUID,
    "entity_type" "ActivityEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "batch_id" UUID,
    "changes" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "invalidated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "invalidated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "email_normalized" VARCHAR(320) NOT NULL,
    "role" "InvitationRole" NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "invited_by_membership_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE INDEX "users_disabled_at_idx" ON "users"("disabled_at");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "auth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "memberships_user_id_deactivated_at_idx" ON "memberships"("user_id", "deactivated_at");

-- CreateIndex
CREATE INDEX "memberships_org_role_deactivated_at_idx" ON "memberships"("organization_id", "role", "deactivated_at");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organization_id_user_id_key" ON "memberships"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organization_id_id_key" ON "memberships"("organization_id", "id");

-- CreateIndex
CREATE INDEX "jobs_org_deleted_status_created_id_idx" ON "jobs"("organization_id", "deleted_at", "status", "created_at", "id");

-- CreateIndex
CREATE INDEX "jobs_org_department_deleted_created_id_idx" ON "jobs"("organization_id", "department", "deleted_at", "created_at", "id");

-- CreateIndex
CREATE INDEX "jobs_org_title_id_idx" ON "jobs"("organization_id", "title", "id");

-- CreateIndex
CREATE INDEX "jobs_org_creator_idx" ON "jobs"("organization_id", "created_by_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_organization_id_id_key" ON "jobs"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_resume_storage_key_key" ON "candidates"("resume_storage_key");

-- CreateIndex
CREATE INDEX "candidates_org_deleted_created_id_idx" ON "candidates"("organization_id", "deleted_at", "created_at", "id");

-- CreateIndex
CREATE INDEX "candidates_org_name_id_idx" ON "candidates"("organization_id", "last_name", "first_name", "id");

-- CreateIndex
CREATE INDEX "candidates_org_location_deleted_id_idx" ON "candidates"("organization_id", "location", "deleted_at", "id");

-- CreateIndex
CREATE INDEX "candidates_org_creator_idx" ON "candidates"("organization_id", "created_by_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_organization_id_id_key" ON "candidates"("organization_id", "id");

-- CreateIndex
CREATE INDEX "applications_org_job_stage_updated_id_idx" ON "applications"("organization_id", "job_id", "stage", "updated_at", "id");

-- CreateIndex
CREATE INDEX "applications_org_candidate_created_id_idx" ON "applications"("organization_id", "candidate_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "applications_org_stage_updated_id_idx" ON "applications"("organization_id", "stage", "updated_at", "id");

-- CreateIndex
CREATE INDEX "applications_org_hired_at_id_idx" ON "applications"("organization_id", "hired_at", "id");

-- CreateIndex
CREATE INDEX "applications_org_creator_idx" ON "applications"("organization_id", "created_by_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_organization_id_id_key" ON "applications"("organization_id", "id");

-- CreateIndex
CREATE INDEX "interviews_org_status_starts_id_idx" ON "interviews"("organization_id", "status", "starts_at", "id");

-- CreateIndex
CREATE INDEX "interviews_org_application_starts_idx" ON "interviews"("organization_id", "application_id", "starts_at", "id");

-- CreateIndex
CREATE INDEX "interviews_org_interviewer_starts_id_idx" ON "interviews"("organization_id", "interviewer_membership_id", "starts_at", "id");

-- CreateIndex
CREATE INDEX "interviews_org_creator_idx" ON "interviews"("organization_id", "created_by_membership_id");

-- CreateIndex
CREATE INDEX "candidate_notes_org_candidate_deleted_created_id_idx" ON "candidate_notes"("organization_id", "candidate_id", "deleted_at", "created_at", "id");

-- CreateIndex
CREATE INDEX "candidate_notes_org_author_idx" ON "candidate_notes"("organization_id", "author_membership_id");

-- CreateIndex
CREATE INDEX "candidate_notes_org_deleter_idx" ON "candidate_notes"("organization_id", "deleted_by_membership_id");

-- CreateIndex
CREATE INDEX "activity_logs_org_created_id_idx" ON "activity_logs"("organization_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "activity_logs_org_entity_created_idx" ON "activity_logs"("organization_id", "entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_org_actor_created_idx" ON "activity_logs"("organization_id", "actor_membership_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_org_batch_id_idx" ON "activity_logs"("organization_id", "batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_expires_idx" ON "email_verification_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expires_idx" ON "email_verification_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_expires_idx" ON "password_reset_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_token_hash_key" ON "organization_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "organization_invitations_org_state_expires_idx" ON "organization_invitations"("organization_id", "accepted_at", "revoked_at", "expires_at");

-- CreateIndex
CREATE INDEX "organization_invitations_org_inviter_idx" ON "organization_invitations"("organization_id", "invited_by_membership_id");

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_created_by_membership_id_fkey" FOREIGN KEY ("organization_id", "created_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_created_by_membership_id_fkey" FOREIGN KEY ("organization_id", "created_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_job_id_fkey" FOREIGN KEY ("organization_id", "job_id") REFERENCES "jobs"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_candidate_id_fkey" FOREIGN KEY ("organization_id", "candidate_id") REFERENCES "candidates"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_created_by_membership_id_fkey" FOREIGN KEY ("organization_id", "created_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_application_id_fkey" FOREIGN KEY ("organization_id", "application_id") REFERENCES "applications"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_interviewer_membership_id_fkey" FOREIGN KEY ("organization_id", "interviewer_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_organization_id_created_by_membership_id_fkey" FOREIGN KEY ("organization_id", "created_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_organization_id_candidate_id_fkey" FOREIGN KEY ("organization_id", "candidate_id") REFERENCES "candidates"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_organization_id_author_membership_id_fkey" FOREIGN KEY ("organization_id", "author_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_notes" ADD CONSTRAINT "candidate_notes_organization_id_deleted_by_membership_id_fkey" FOREIGN KEY ("organization_id", "deleted_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_actor_membership_id_fkey" FOREIGN KEY ("organization_id", "actor_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE SET NULL ("actor_membership_id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_invited_by_member_fkey" FOREIGN KEY ("organization_id", "invited_by_membership_id") REFERENCES "memberships"("organization_id", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Prisma does not currently model the following PostgreSQL checks and
-- active-row uniqueness rules. Keep these named constraints/indexes reviewed
-- alongside future migrations.

-- Required normalized identity and positive concurrency versions.
ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_name_nonblank_check"
    CHECK (btrim("name") <> ''),
  ADD CONSTRAINT "organizations_slug_format_check"
    CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

ALTER TABLE "users"
  ADD CONSTRAINT "users_email_normalized_check"
    CHECK (
      "email" = lower(btrim("email"))
      AND "email_normalized" = lower(btrim("email_normalized"))
      AND "email" = "email_normalized"
    ),
  ADD CONSTRAINT "users_session_version_check"
    CHECK ("session_version" >= 0);

ALTER TABLE "auth_accounts"
  ADD CONSTRAINT "auth_accounts_identity_nonblank_check"
    CHECK (
      btrim("type") <> ''
      AND btrim("provider") <> ''
      AND btrim("provider_account_id") <> ''
    );

ALTER TABLE "memberships"
  ADD CONSTRAINT "memberships_version_check"
    CHECK ("version" >= 1);

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_required_text_check"
    CHECK (
      btrim("title") <> ''
      AND btrim("department") <> ''
      AND btrim("location") <> ''
      AND btrim("description") <> ''
      AND btrim("requirements") <> ''
    ),
  ADD CONSTRAINT "jobs_version_check"
    CHECK ("version" >= 1);

-- Candidate lifecycle and private resume metadata.
ALTER TABLE "candidates"
  ALTER COLUMN "skills" SET NOT NULL,
  ADD CONSTRAINT "candidates_required_identity_check"
    CHECK (
      btrim("first_name") <> ''
      AND btrim("last_name") <> ''
      AND btrim("email") <> ''
      AND "email_normalized" = lower(btrim("email"))
    ),
  ADD CONSTRAINT "candidates_experience_years_check"
    CHECK ("experience_years" >= 0 AND "experience_years" <= 80),
  ADD CONSTRAINT "candidates_skills_count_check"
    CHECK (cardinality("skills") <= 50),
  ADD CONSTRAINT "candidates_resume_metadata_check"
    CHECK (
      (
        "resume_storage_key" IS NULL
        AND "resume_file_name" IS NULL
        AND "resume_mime_type" IS NULL
        AND "resume_size_bytes" IS NULL
      )
      OR
      (
        "resume_storage_key" IS NOT NULL
        AND "resume_file_name" IS NOT NULL
        AND "resume_mime_type" IS NOT NULL
        AND "resume_size_bytes" IS NOT NULL
        AND btrim("resume_storage_key") <> ''
        AND btrim("resume_file_name") <> ''
        AND "resume_mime_type" IN (
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        AND "resume_size_bytes" BETWEEN 1 AND 5242880
      )
    ),
  ADD CONSTRAINT "candidates_version_check"
    CHECK ("version" >= 1);

-- Stage timestamps are canonical and cannot drift from the active stage.
ALTER TABLE "applications"
  ADD CONSTRAINT "applications_stage_timestamp_check"
    CHECK (
      (("stage" = 'HIRED') = ("hired_at" IS NOT NULL))
      AND (("stage" = 'REJECTED') = ("rejected_at" IS NOT NULL))
    ),
  ADD CONSTRAINT "applications_version_check"
    CHECK ("version" >= 1);

ALTER TABLE "interviews"
  ADD CONSTRAINT "interviews_time_range_check"
    CHECK ("ends_at" > "starts_at"),
  ADD CONSTRAINT "interviews_time_zone_nonblank_check"
    CHECK (btrim("time_zone") <> ''),
  ADD CONSTRAINT "interviews_rating_check"
    CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "interviews_version_check"
    CHECK ("version" >= 1);

ALTER TABLE "candidate_notes"
  ADD CONSTRAINT "candidate_notes_body_nonblank_check"
    CHECK (btrim("body") <> ''),
  ADD CONSTRAINT "candidate_notes_deletion_pair_check"
    CHECK (("deleted_at" IS NULL) = ("deleted_by_membership_id" IS NULL));

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_changes_object_check"
    CHECK ("changes" IS NULL OR jsonb_typeof("changes") = 'object');

-- Tokens are SHA-256 hex digests, single-purpose, and either consumed or
-- invalidated. Plaintext tokens never enter PostgreSQL.
ALTER TABLE "email_verification_tokens"
  ADD CONSTRAINT "email_verification_tokens_hash_format_check"
    CHECK ("token_hash"::text ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "email_verification_tokens_terminal_state_check"
    CHECK (NOT ("used_at" IS NOT NULL AND "invalidated_at" IS NOT NULL));

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_hash_format_check"
    CHECK ("token_hash"::text ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "password_reset_tokens_terminal_state_check"
    CHECK (NOT ("used_at" IS NOT NULL AND "invalidated_at" IS NOT NULL));

ALTER TABLE "organization_invitations"
  ADD CONSTRAINT "organization_invitations_email_normalized_check"
    CHECK (
      btrim("email") <> ''
      AND "email_normalized" = lower(btrim("email"))
    ),
  ADD CONSTRAINT "organization_invitations_hash_format_check"
    CHECK ("token_hash"::text ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "organization_invitations_terminal_state_check"
    CHECK (NOT ("accepted_at" IS NOT NULL AND "revoked_at" IS NOT NULL)),
  ADD CONSTRAINT "organization_invitations_expiry_check"
    CHECK ("expires_at" > "created_at");

-- Active-row uniqueness preserves archive history while closing races.
CREATE UNIQUE INDEX "candidates_org_email_active_uq"
  ON "candidates" ("organization_id", "email_normalized")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "applications_org_job_candidate_active_uq"
  ON "applications" ("organization_id", "job_id", "candidate_id")
  WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "organization_invitations_org_email_pending_uq"
  ON "organization_invitations" ("organization_id", "email_normalized")
  WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;

CREATE UNIQUE INDEX "email_verification_tokens_user_active_uq"
  ON "email_verification_tokens" ("user_id")
  WHERE "used_at" IS NULL AND "invalidated_at" IS NULL;

CREATE UNIQUE INDEX "password_reset_tokens_user_active_uq"
  ON "password_reset_tokens" ("user_id")
  WHERE "used_at" IS NULL AND "invalidated_at" IS NULL;

CREATE INDEX "applications_org_hired_active_idx"
  ON "applications" ("organization_id", "hired_at", "id")
  WHERE "deleted_at" IS NULL AND "hired_at" IS NOT NULL;
