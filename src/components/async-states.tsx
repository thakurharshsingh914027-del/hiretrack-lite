import type { ReactNode } from "react";
import { AlertCircleIcon, CheckCircle2Icon, InboxIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed shadow-none", className)}>
      <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:py-12">
        <span className="bg-accent text-accent-foreground grid size-12 place-items-center rounded-xl">
          {icon ?? <InboxIcon className="size-5" aria-hidden="true" />}
        </span>
        <h2 className="mt-5 text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
          {description}
        </p>
        {action ? <div className="mt-6">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

type ErrorStateProps = {
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "We could not load this view",
  description,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "border-destructive/25 bg-destructive/5 rounded-xl border p-6",
        className,
      )}
      role="alert"
    >
      <AlertCircleIcon className="text-destructive size-5" aria-hidden="true" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type SuccessBannerProps = {
  title: string;
  description?: string;
};

export function SuccessBanner({ title, description }: SuccessBannerProps) {
  return (
    <div
      className="border-primary/20 bg-primary/8 flex gap-3 rounded-lg border p-4 text-sm"
      role="status"
    >
      <CheckCircle2Icon
        className="text-primary mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-1">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading content" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border bg-card rounded-xl border p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
