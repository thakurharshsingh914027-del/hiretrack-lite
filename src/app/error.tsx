"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ErrorState } from "@/components/async-states";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route render failed", error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        This page hit a snag
      </h1>
      <div className="mt-6">
        <ErrorState
          title="The page could not be loaded"
          description="Try the request once more. If it still fails, return home and choose another route."
          action={
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button asChild variant="outline">
                <Link href="/">Return home</Link>
              </Button>
            </div>
          }
        />
      </div>
    </main>
  );
}
