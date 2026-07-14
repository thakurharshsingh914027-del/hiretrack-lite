import { UsersRoundIcon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Candidates",
  description:
    "Search and manage organization-scoped candidate profiles in HireTrack Lite.",
  path: "/app/candidates",
  noIndex: true,
});

export default function CandidatesPage() {
  return (
    <PlaceholderPage
      eyebrow="Workspace"
      title="Candidates"
      description="Candidate profiles, applications, resumes, and notes will stay connected here."
      emptyTitle="No candidates to show yet"
      emptyDescription="The candidate directory will activate with persisted organization data in a later approved milestone."
      icon={<UsersRoundIcon className="size-5" aria-hidden="true" />}
    />
  );
}
