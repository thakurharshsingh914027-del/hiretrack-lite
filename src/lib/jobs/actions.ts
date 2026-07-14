"use server";

import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import {
  archiveJob,
  createJob,
  updateJob,
  type JobActionResult,
} from "@/lib/jobs/service";

async function context() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return resolveAccessContext(getDatabase(), {
    userId: session.user.id,
    ...(session.user.sessionVersion !== undefined
      ? { sessionVersion: session.user.sessionVersion }
      : {}),
    ...(session.user.selectedOrganizationId
      ? { selectedOrganizationId: session.user.selectedOrganizationId }
      : {}),
  });
}

export async function createJobAction(
  _previous: unknown,
  formData: FormData,
): Promise<JobActionResult<unknown>> {
  const access = await context();
  if (!access)
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in again.",
    };
  return createJob(getDatabase(), access, Object.fromEntries(formData));
}

export async function updateJobAction(
  _previous: unknown,
  formData: FormData,
): Promise<JobActionResult<unknown>> {
  const access = await context();
  if (!access)
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in again.",
    };
  const id = String(formData.get("id") ?? "");
  const version = Number(formData.get("version"));
  return updateJob(
    getDatabase(),
    access,
    id,
    version,
    Object.fromEntries(formData),
  );
}

export async function archiveJobAction(
  _previous: unknown,
  formData: FormData,
): Promise<JobActionResult<unknown>> {
  const access = await context();
  if (!access)
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in again.",
    };
  return archiveJob(
    getDatabase(),
    access,
    String(formData.get("id") ?? ""),
    Number(formData.get("version")),
    false,
  );
}

export async function restoreJobAction(
  _previous: unknown,
  formData: FormData,
): Promise<JobActionResult<unknown>> {
  const access = await context();
  if (!access)
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Please sign in again.",
    };
  return archiveJob(
    getDatabase(),
    access,
    String(formData.get("id") ?? ""),
    Number(formData.get("version")),
    true,
  );
}

export async function archiveJobFormAction(formData: FormData) {
  await archiveJobAction(null, formData);
  revalidatePath("/app/jobs");
}

export async function restoreJobFormAction(formData: FormData) {
  await restoreJobAction(null, formData);
  revalidatePath("/app/jobs");
}
