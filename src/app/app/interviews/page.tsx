import { CalendarDaysIcon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Interviews",
  description:
    "Coordinate interview schedules, interviewers, feedback, and outcomes.",
  path: "/app/interviews",
  noIndex: true,
});

export default function InterviewsPage() {
  return (
    <PlaceholderPage
      eyebrow="Workspace"
      title="Interviews"
      description="Upcoming schedules, interviewer assignments, feedback, and outcomes will appear here."
      emptyTitle="No interviews scheduled"
      emptyDescription="Interview scheduling activates after candidates can be connected to open jobs."
      icon={<CalendarDaysIcon className="size-5" aria-hidden="true" />}
    />
  );
}
