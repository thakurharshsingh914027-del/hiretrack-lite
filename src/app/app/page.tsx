import Link from "next/link";
import { ArrowRightIcon, BriefcaseBusinessIcon } from "lucide-react";

import { EmptyState } from "@/components/async-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspacePage() {
  return (
    <main id="main-content">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            Your hiring workspace
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Jobs, candidates, interviews, and decisions will come together here.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/docs/getting-started">
            Read the quick start
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <section
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Workspace metric placeholders"
      >
        {["Candidates", "Active jobs", "Interviews", "Hired"].map((label) => (
          <Card key={label} className="gap-3 py-5 shadow-none">
            <CardContent className="px-5">
              <p className="text-muted-foreground text-sm">{label}</p>
              <p
                className="mt-3 font-mono text-2xl font-semibold"
                aria-label={`${label} unavailable`}
              >
                —
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6" aria-label="Workspace empty state">
        <EmptyState
          title="Your workspace is ready for its first job"
          description="Data setup and secure access arrive in the next approved milestones. For now, explore the workflow and project documentation."
          icon={<BriefcaseBusinessIcon className="size-5" aria-hidden="true" />}
          action={
            <Button asChild>
              <Link href="/docs/features">See the planned workflow</Link>
            </Button>
          }
        />
      </section>
    </main>
  );
}
