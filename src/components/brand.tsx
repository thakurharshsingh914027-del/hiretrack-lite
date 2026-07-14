import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandProps = {
  compact?: boolean;
  className?: string;
};

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-11 items-center gap-3 rounded-md font-semibold tracking-[-0.02em] outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      aria-label="HireTrack Lite home"
    >
      <span
        className="bg-foreground text-background relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
        aria-hidden="true"
      >
        <span className="bg-primary absolute h-4 w-1.5 -translate-x-1.5 rounded-full" />
        <span className="bg-primary/70 absolute h-2.5 w-1.5 translate-x-1.5 translate-y-0.5 rounded-full" />
      </span>
      {compact ? null : <span>HireTrack Lite</span>}
    </Link>
  );
}
