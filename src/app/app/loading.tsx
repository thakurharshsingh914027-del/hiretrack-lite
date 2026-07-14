import { PageSkeleton } from "@/components/async-states";

export default function WorkspaceLoading() {
  return (
    <main id="main-content">
      <h1 className="sr-only">Loading workspace</h1>
      <PageSkeleton />
    </main>
  );
}
