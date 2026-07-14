import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { DocsPage } from "@/components/marketing/docs-page";
import { Card, CardContent } from "@/components/ui/card";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Product documentation and setup guides",
  description:
    "Read the HireTrack Lite product documentation, run the current foundation locally, review planned workflows, and understand architecture and deployment choices.",
  path: "/docs",
});

const guides = [
  {
    href: "/docs/getting-started",
    title: "Getting started",
    description:
      "Run the current milestone locally and understand the release path.",
  },
  {
    href: "/docs/features",
    title: "Product features",
    description:
      "See how jobs, candidates, applications, and interviews fit together.",
  },
  {
    href: "/docs/deployment",
    title: "Deployment",
    description:
      "Prepare Vercel and managed services without exposing secrets.",
  },
] as const;

export default function DocumentationPage() {
  return (
    <DocsPage
      title="Documentation"
      description="The practical guide to running, understanding, and eventually deploying HireTrack Lite."
      path="/docs"
    >
      <p>
        HireTrack Lite is built milestone by milestone. These guides describe
        what exists now and label future release behavior clearly, so setup
        instructions never pretend an unfinished service is available.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Card key={guide.href} className="gap-0 py-0 shadow-none">
            <CardContent className="p-5">
              <h2 className="mt-0! text-base!">{guide.title}</h2>
              <p className="mt-2! text-sm! leading-6!">{guide.description}</p>
              <Link
                href={guide.href}
                className="mt-4 inline-flex min-h-11 items-center gap-2"
              >
                Open guide{" "}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2>Architecture first</h2>
      <p>
        The repository includes a reviewed product plan and architecture
        diagrams covering tenant isolation, authorization, transactions,
        optimistic updates, and deployment topology. Start with{" "}
        <a href="/docs/architecture">the repository architecture document</a>{" "}
        when reviewing implementation decisions.
      </p>
    </DocsPage>
  );
}
