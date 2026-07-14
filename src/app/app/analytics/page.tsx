import { BarChart3Icon } from "lucide-react";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Hiring analytics",
  description:
    "Understand hiring stages, job demand, hires, and interview completion.",
  path: "/app/analytics",
  noIndex: true,
});

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      eyebrow="Insights"
      title="Hiring analytics"
      description="Accessible charts and text summaries will be calculated from real organization data."
      emptyTitle="Analytics need hiring activity"
      emptyDescription="No sample values are shown here. Live metrics appear only after your workspace has persisted records."
      icon={<BarChart3Icon className="size-5" aria-hidden="true" />}
    />
  );
}
