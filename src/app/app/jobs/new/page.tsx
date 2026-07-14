import { auth } from "../../../../../auth";
import { JobForm } from "@/components/jobs/job-form";
import { createJobAction } from "@/lib/jobs/actions";
export default async function NewJobPage() {
  const session = await auth();
  if (!session) return null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Create a job</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Add a clear role brief for your hiring team.
      </p>
      <JobForm action={createJobAction} />
    </main>
  );
}
