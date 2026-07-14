import type { ReactNode } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/async-states";
import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: ReactNode;
  docsHref?: "/docs" | "/docs/features" | "/docs/getting-started";
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
  docsHref = "/docs/features",
}: PlaceholderPageProps) {
  return (
    <main id="main-content">
      <p className="text-primary text-sm font-semibold">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
        {description}
      </p>
      <div className="mt-8">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={icon}
          action={
            <Button asChild variant="outline">
              <Link href={docsHref}>Read the workflow guide</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
