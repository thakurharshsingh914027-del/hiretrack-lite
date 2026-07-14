import { notFound } from "next/navigation";
import { auth } from "../../../../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import { JobForm } from "@/components/jobs/job-form";
import { updateJobAction } from "@/lib/jobs/actions";
export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const access = session?.user?.id
    ? await resolveAccessContext(getDatabase(), {
        userId: session.user.id,
        ...(session.user.sessionVersion !== undefined
          ? { sessionVersion: session.user.sessionVersion }
          : {}),
        ...(session.user.selectedOrganizationId
          ? { selectedOrganizationId: session.user.selectedOrganizationId }
          : {}),
      })
    : null;
  if (!access) return null;
  const job = await getDatabase().job.findFirst({
    where: {
      id: (await params).id,
      organizationId: access.organization.id,
      deletedAt: null,
    },
  });
  if (!job) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Edit job</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Changes are protected by optimistic version checks.
      </p>
      <JobForm
        action={updateJobAction}
        initial={{
          id: job.id,
          version: job.version,
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          description: job.description,
          requirements: job.requirements,
          status: job.status,
        }}
      />
    </main>
  );
}
