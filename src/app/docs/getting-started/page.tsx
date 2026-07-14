import { DocsPage } from "@/components/marketing/docs-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Getting started with the foundation",
  description:
    "Set up the HireTrack Lite Milestone 1 foundation locally, configure environment values, and run formatting, linting, type, unit, build, and browser checks.",
  path: "/docs/getting-started",
});

export default function GettingStartedPage() {
  return (
    <DocsPage
      title="Getting started"
      description="Run the current foundation locally, then verify the same checks used by continuous integration."
      path="/docs/getting-started"
    >
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 22 or a newer supported LTS release.</li>
        <li>npm 10 or newer.</li>
        <li>
          PostgreSQL is required beginning with the database milestone, not for
          the current static foundation.
        </li>
      </ul>
      <h2>Install and run</h2>
      <div className="border-border bg-foreground text-background my-5 overflow-x-auto rounded-xl border p-4">
        <pre className="min-w-max font-mono text-sm">
          <code>{`cp .env.example .env.local\nnpm ci\nnpm run dev`}</code>
        </pre>
      </div>
      <p>
        Open <a href="http://localhost:3000">http://localhost:3000</a>. The
        landing page, workspace shell, static guides, metadata routes, dark
        mode, and keyboard palette are available in Milestone 1.
      </p>
      <h2>Verify the foundation</h2>
      <div className="border-border bg-foreground text-background my-5 overflow-x-auto rounded-xl border p-4">
        <pre className="min-w-max font-mono text-sm">
          <code>{`npm run lint\nnpm run typecheck\nnpm run test\nnpm run build`}</code>
        </pre>
      </div>
      <p>
        Database migration and seed commands are intentionally unavailable until
        the schema milestone supplies reviewed migrations and an idempotent
        seed.
      </p>
    </DocsPage>
  );
}
