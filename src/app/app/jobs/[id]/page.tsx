import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "../../../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import { can } from "@/lib/auth/policy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { archiveJobFormAction } from "@/lib/jobs/actions";
export default async function JobDetailPage({
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
  const { id } = await params;
  const job = await getDatabase().job.findFirst({
    where: { id, organizationId: access.organization.id, deletedAt: null },
    include: { _count: { select: { applications: true } } },
  });
  if (!job) notFound();
  const writable = can(
    {
      role: access.membership.role,
      emailVerified: access.emailVerified,
      active: true,
    },
    "jobs:write",
  );
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link className="text-primary text-sm hover:underline" href="/app/jobs">
        ← Back to jobs
      </Link>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{job.title}</h1>
            <p className="text-muted-foreground mt-2">
              {job.department} · {job.location} ·{" "}
              {job.employmentType.replace("_", " ")}
            </p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs font-semibold">
            {job.status}
          </span>
        </div>
        {writable ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/app/jobs/${job.id}/edit`}>Edit job</Link>
            </Button>
            <form action={archiveJobFormAction}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="version" value={job.version} />
              <Button type="submit" variant="destructive">
                Archive job
              </Button>
            </form>
          </div>
        ) : null}
      </div>
      <Card>
        <CardContent className="space-y-8 pt-6">
          <section>
            <h2 className="font-semibold">Description</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
              {job.description}
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Requirements</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
              {job.requirements}
            </p>
          </section>
          <p className="text-muted-foreground text-sm">
            {job._count.applications} applications · Version {job.version}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
