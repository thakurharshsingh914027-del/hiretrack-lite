import { Columns3Icon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Hiring pipeline",
  description: "Move applications through a clear, accessible hiring pipeline.",
  path: "/app/pipeline",
  noIndex: true,
});

export default function PipelinePage() {
  return (
    <PlaceholderPage
      eyebrow="Workspace"
      title="Hiring pipeline"
      description="Applications will move through applied, screening, interview, offer, hired, and rejected stages."
      emptyTitle="Choose a job to start its pipeline"
      emptyDescription="The optimistic, keyboard-operable pipeline arrives with the applications milestone."
      icon={<Columns3Icon className="size-5" aria-hidden="true" />}
    />
  );
}
