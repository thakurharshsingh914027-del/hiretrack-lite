import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "@/generated/prisma/client";
import { can } from "@/lib/auth/policy";
import type { AccessContext } from "@/lib/auth/session";
import { jobFormSchema, jobQuerySchema } from "@/lib/jobs/validation";

export type JobActionResult<T> =
  { ok: true; data: T } | { ok: false; code: string; message: string };

function encodeCursor(value: { createdAt: string; id: string }) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
function decodeCursor(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as { createdAt?: string; id?: string };
    if (!parsed.createdAt || !parsed.id) return null;
    return { createdAt: new Date(parsed.createdAt), id: parsed.id };
  } catch {
    return null;
  }
}

export async function listJobs(
  database: PrismaClient,
  context: AccessContext,
  rawQuery: Record<string, string | undefined>,
) {
  const query = jobQuerySchema.parse(rawQuery);
  const cursor = decodeCursor(query.after);
  const filters: Prisma.JobWhereInput[] = [];
  if (query.q)
    filters.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { department: { contains: query.q, mode: "insensitive" } },
        { location: { contains: query.q, mode: "insensitive" } },
      ],
    });
  if (cursor)
    filters.push({
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    });
  const where: Prisma.JobWhereInput = {
    organizationId: context.organization.id,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.employmentType ? { employmentType: query.employmentType } : {}),
    ...(filters.length ? { AND: filters } : {}),
  };
  const rows = await database.job.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      employmentType: true,
      status: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { applications: true } },
    },
  });
  const hasNext = rows.length > query.limit;
  const items = hasNext ? rows.slice(0, query.limit) : rows;
  const last = items.at(-1);
  return {
    items,
    pageInfo: {
      hasNext,
      nextCursor: last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
    },
  };
}

function requireJobWrite(context: AccessContext) {
  return can(
    {
      role: context.membership.role,
      emailVerified: context.emailVerified,
      active: true,
    },
    "jobs:write",
  );
}

export async function createJob(
  database: PrismaClient,
  context: AccessContext,
  input: unknown,
): Promise<JobActionResult<unknown>> {
  if (!requireJobWrite(context))
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Verified recruiters and admins can manage jobs.",
    };
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Check the job fields and try again.",
    };
  const job = await database.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        ...parsed.data,
        organizationId: context.organization.id,
        createdByMembershipId: context.membership.id,
      },
    });
    await tx.activityLog.create({
      data: {
        organizationId: context.organization.id,
        actorMembershipId: context.membership.id,
        entityType: ActivityEntityType.JOB,
        entityId: created.id,
        action: ActivityAction.CREATED,
        changes: { title: created.title, status: created.status },
      },
    });
    return created;
  });
  return { ok: true, data: job };
}

export async function updateJob(
  database: PrismaClient,
  context: AccessContext,
  id: string,
  version: number,
  input: unknown,
): Promise<JobActionResult<unknown>> {
  if (!requireJobWrite(context))
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Verified recruiters and admins can manage jobs.",
    };
  const parsed = jobFormSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Check the job fields and try again.",
    };
  const updated = await database.$transaction(async (tx) => {
    const result = await tx.job.updateMany({
      where: {
        id,
        organizationId: context.organization.id,
        deletedAt: null,
        version,
      },
      data: { ...parsed.data, version: { increment: 1 } },
    });
    if (result.count !== 1) return null;
    const job = await tx.job.findUniqueOrThrow({ where: { id } });
    await tx.activityLog.create({
      data: {
        organizationId: context.organization.id,
        actorMembershipId: context.membership.id,
        entityType: ActivityEntityType.JOB,
        entityId: id,
        action: ActivityAction.UPDATED,
        changes: { title: job.title, status: job.status },
      },
    });
    return job;
  });
  return updated
    ? { ok: true, data: updated }
    : {
        ok: false,
        code: "CONFLICT",
        message: "This job changed elsewhere. Refresh and try again.",
      };
}

export async function archiveJob(
  database: PrismaClient,
  context: AccessContext,
  id: string,
  version: number,
  restore = false,
): Promise<JobActionResult<unknown>> {
  if (!requireJobWrite(context))
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "Verified recruiters and admins can manage jobs.",
    };
  const result = await database.job.updateMany({
    where: {
      id,
      organizationId: context.organization.id,
      version,
      deletedAt: restore ? { not: null } : null,
    },
    data: { deletedAt: restore ? null : new Date(), version: { increment: 1 } },
  });
  if (result.count !== 1)
    return {
      ok: false,
      code: "CONFLICT",
      message: "The job is no longer available. Refresh and try again.",
    };
  return {
    ok: true,
    data: await database.job.findUniqueOrThrow({ where: { id } }),
  };
}
