import Link from "next/link";
import { auth } from "../../../../auth";
import { getDatabase } from "@/lib/db";
import { resolveAccessContext } from "@/lib/auth/session";
import { can } from "@/lib/auth/policy";
import { listJobs } from "@/lib/jobs/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
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
  const params = await searchParams;
  const result = await listJobs(getDatabase(), access, params);
  const writable = can(
    {
      role: access.membership.role,
      emailVerified: access.emailVerified,
      active: true,
    },
    "jobs:write",
  );
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-medium">Workspace / Jobs</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage the roles your team is hiring for.
          </p>
        </div>
        {writable ? (
          <Button asChild>
            <Link href="/app/jobs/new">New job</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
            method="get"
          >
            <label className="sr-only" htmlFor="q">
              Search jobs
            </label>
            <input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search title, department, location"
              className="bg-background h-11 rounded-md border px-3"
            />
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="bg-background h-11 rounded-md border px-3"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>
      {result.items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            No jobs match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {result.items.map((job) => (
            <Card key={job.id}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>
                    <Link
                      className="hover:underline"
                      href={`/app/jobs/${job.id}`}
                    >
                      {job.title}
                    </Link>
                  </CardTitle>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {job.department} · {job.location} ·{" "}
                    {job.employmentType.replace("_", " ")}
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                  {job.status}
                </span>
              </CardHeader>
              <CardContent className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>{job._count.applications} applications</span>
                <Link
                  className="text-primary font-medium hover:underline"
                  href={`/app/jobs/${job.id}`}
                >
                  View details →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {result.pageInfo.hasNext ? (
        <div>
          <Link
            className="text-primary text-sm font-medium hover:underline"
            href={{
              pathname: "/app/jobs",
              query: {
                ...params,
                after: result.pageInfo.nextCursor ?? undefined,
              },
            }}
          >
            Next page →
          </Link>
        </div>
      ) : null}
    </main>
  );
}
