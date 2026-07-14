import { ArrowUpRightIcon, MoreHorizontalIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const columns = [
  {
    title: "Screening",
    count: 4,
    candidates: [
      { initials: "AM", name: "Avery Morgan", role: "Product designer" },
      { initials: "NK", name: "Noah Kim", role: "Backend engineer" },
    ],
  },
  {
    title: "Interview",
    count: 3,
    candidates: [
      { initials: "SL", name: "Sam Lee", role: "Growth marketer" },
      { initials: "JR", name: "Jordan Reed", role: "Product designer" },
    ],
  },
  {
    title: "Offered",
    count: 1,
    candidates: [
      { initials: "RP", name: "Riley Patel", role: "Backend engineer" },
    ],
  },
] as const;

export function ProductPreview() {
  return (
    <div
      className="relative mx-auto max-w-6xl"
      aria-label="Illustrative pipeline preview"
    >
      <div className="bg-primary/10 absolute -inset-8 -z-10 rounded-[2rem] blur-3xl" />
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[0_24px_70px_rgba(15,23,42,0.12)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="border-border flex min-h-16 items-center justify-between gap-4 border-b px-4 sm:px-6">
          <div>
            <p className="font-semibold">Design team pipeline</p>
            <p className="text-muted-foreground text-xs">
              Illustrative product preview
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="border-border bg-background text-muted-foreground flex h-10 min-w-48 items-center gap-2 rounded-md border px-3 text-sm">
              <SearchIcon className="size-4" aria-hidden="true" />
              Search candidates
            </div>
            <span
              aria-hidden="true"
              className="text-muted-foreground grid size-11 place-items-center rounded-md"
            >
              <MoreHorizontalIcon className="size-4" />
            </span>
          </div>
        </div>
        <div className="bg-muted/45 grid gap-4 overflow-hidden p-4 sm:p-6 md:grid-cols-3">
          {columns.map((column) => (
            <section
              key={column.title}
              className="min-w-0"
              aria-label={`${column.title} candidates`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="bg-primary size-2 rounded-full"
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold">{column.title}</h3>
                </div>
                <span className="text-muted-foreground font-mono text-xs">
                  {column.count}
                </span>
              </div>
              <div className="grid gap-3">
                {column.candidates.map((candidate) => (
                  <article
                    key={candidate.name}
                    className="border-border bg-card rounded-xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="bg-accent text-accent-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold">
                        {candidate.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {candidate.name}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {candidate.role}
                        </p>
                      </div>
                      <ArrowUpRightIcon
                        className="text-muted-foreground size-4"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Badge variant="secondary">Active</Badge>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        2d
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
