"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/async-states";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace render failed", error);
  }, [error]);

  return (
    <main id="main-content">
      <h1 className="sr-only">Workspace error</h1>
      <ErrorState
        description="Refresh this view with the retry button. If the problem continues, return to the product site and try again."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
