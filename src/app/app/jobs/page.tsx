import { BriefcaseBusinessIcon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Jobs",
  description:
    "Create, search, filter, and manage hiring roles in HireTrack Lite.",
  path: "/app/jobs",
  noIndex: true,
});

export default function JobsPage() {
  return (
    <PlaceholderPage
      eyebrow="Workspace"
      title="Jobs"
      description="Open roles and their application progress will be managed from this view."
      emptyTitle="No jobs to show yet"
      emptyDescription="Job data becomes available after the database and secure access milestones are approved and completed."
      icon={<BriefcaseBusinessIcon className="size-5" aria-hidden="true" />}
    />
  );
}
