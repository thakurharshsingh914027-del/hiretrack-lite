import { DocsPage } from "@/components/marketing/docs-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Getting started with HireTrack Lite",
  description:
    "Set up the HireTrack Lite application and PostgreSQL data foundation locally, then run the same quality checks used by continuous integration.",
  path: "/docs/getting-started",
});

export default function GettingStartedPage() {
  return (
    <DocsPage
      title="Getting started"
      description="Run the application and reviewed PostgreSQL foundation locally, then verify the same checks used by continuous integration."
      path="/docs/getting-started"
    >
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 24 LTS.</li>
        <li>npm 10 or newer.</li>
        <li>An isolated PostgreSQL 17-compatible database.</li>
      </ul>
      <h2>Install and run</h2>
      <div className="border-border bg-foreground text-background my-5 overflow-x-auto rounded-xl border p-4">
        <pre className="min-w-max font-mono text-sm">
          <code>{`cp .env.example .env.local\nnpm ci\nnpm run db:validate\nnpm run db:migrate\nnpm run db:seed\nnpm run dev`}</code>
        </pre>
      </div>
      <p>
        Open <a href="http://localhost:3000">http://localhost:3000</a>. The
        landing page, workspace shell, static guides, metadata routes, dark
        mode, and keyboard palette are available. Replace the documented demo
        password placeholder before seeding; login arrives with the next
        authentication milestone.
      </p>
      <h2>Verify the foundation</h2>
      <div className="border-border bg-foreground text-background my-5 overflow-x-auto rounded-xl border p-4">
        <pre className="min-w-max font-mono text-sm">
          <code>{`npm run format:check\nnpm run lint\nnpm run typecheck\nnpm run test\nnpm run build`}</code>
        </pre>
      </div>
      <p>
        Set <code>TEST_DATABASE_URL</code> to a dedicated PostgreSQL database
        whose database or schema name contains <code>test</code>. Apply the
        committed migrations to that target, then run{" "}
        <code>npm run test:db</code> to verify partial indexes, checks,
        tenant-consistent foreign keys, and seed idempotency. The suite clears
        HireTrack tables, rejects the configured application database without an
        explicit disposable-database acknowledgement, and requires a second
        acknowledgement for remote targets. CI provisions its own PostgreSQL
        service and applies committed migrations before tests.
      </p>
    </DocsPage>
  );
}
