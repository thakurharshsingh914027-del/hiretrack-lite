import { PageSkeleton } from "@/components/async-states";

export default function Loading() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <h1 className="sr-only">Loading HireTrack Lite</h1>
      <PageSkeleton />
    </main>
  );
}
