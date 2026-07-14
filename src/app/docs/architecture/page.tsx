import { DocsPage } from "@/components/marketing/docs-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Application architecture and data plan",
  description:
    "Review the planned HireTrack Lite system boundaries, tenant isolation, server-side authorization, persistence model, and production deployment topology.",
  path: "/docs/architecture",
});

export default function ArchitecturePage() {
  return (
    <DocsPage
      title="Application architecture"
      description="The approved target for a server-first Next.js release with PostgreSQL as the source of truth and tenant ownership enforced at protected boundaries."
      path="/docs/architecture"
    >
      <p>
        Milestone 1 establishes the runnable interface and public documentation;
        Milestone 2 adds the reviewed Prisma/PostgreSQL schema, migration, seed,
        and real-database tests. Later milestones will connect the following
        protected request flow to that foundation.
      </p>
      <h2>Target request flow</h2>
      <ol>
        <li>
          Parse untrusted route, query, form, or file input with a shared Zod
          schema.
        </li>
        <li>
          Resolve the Auth.js session, current user, session version, and active
          membership on the server.
        </li>
        <li>
          Enforce verified-email and role policy for the requested action.
        </li>
        <li>
          Read or mutate using both the resource identifier and trusted{" "}
          <code>organizationId</code>.
        </li>
        <li>
          Commit domain changes and redacted activity history in one transaction
          where consistency requires it.
        </li>
        <li>
          Return a typed safe result containing the canonical updated record or
          an actionable error.
        </li>
      </ol>
      <h2>Planned system boundaries</h2>
      <ul>
        <li>
          <strong>React Server Components</strong> perform authorized list,
          detail, dashboard, and analytics reads.
        </li>
        <li>
          <strong>Server Actions</strong> provide thin typed entry points into
          testable domain services.
        </li>
        <li>
          <strong>Route Handlers</strong> own Auth.js, private resume streams,
          and streamed CSV/PDF exports.
        </li>
        <li>
          <strong>PostgreSQL and Prisma</strong> own relational truth,
          constraints, transactions, and reviewed migrations.
        </li>
        <li>
          <strong>Private adapters</strong> isolate object storage,
          transactional email, and distributed rate limiting.
        </li>
      </ul>
      <h2>Detailed engineering reference</h2>
      <p>
        The repository’s <code>docs/architecture.md</code> contains the approved
        target-state Mermaid ER, application, authorization, optimistic
        pipeline, and deployment diagrams. Architectural decisions and
        trade-offs are recorded alongside the code in{" "}
        <code>docs/decisions.md</code>.
      </p>
    </DocsPage>
  );
}
