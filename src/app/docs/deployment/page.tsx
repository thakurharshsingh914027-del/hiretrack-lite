import { DocsPage } from "@/components/marketing/docs-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Secure HireTrack Lite deployment guide",
  description:
    "Plan a secure HireTrack Lite deployment on Vercel, including managed PostgreSQL, private service credentials, environment validation, and release checks.",
  path: "/docs/deployment",
});

export default function DeploymentPage() {
  return (
    <DocsPage
      title="Deployment"
      description="The production target is Vercel with isolated managed services and reviewed database migrations."
      path="/docs/deployment"
    >
      <h2>Production topology</h2>
      <ul>
        <li>
          Vercel runs the Next.js application and creates preview deployments.
        </li>
        <li>
          Managed PostgreSQL is the source of truth, using pooled runtime and
          direct migration connections.
        </li>
        <li>
          Private Vercel Blob storage holds resumes; Resend delivers account
          email; Upstash Redis enforces distributed limits.
        </li>
      </ul>
      <h2>Release path</h2>
      <ol>
        <li>
          Run lint, strict typecheck, automated tests, and the production build
          in GitHub Actions.
        </li>
        <li>
          Configure only the variables required by the features being deployed,
          using Vercel environment settings. Never deploy documented placeholder
          values.
        </li>
        <li>
          Apply reviewed migrations with <code>prisma migrate deploy</code>{" "}
          through a controlled release step.
        </li>
        <li>
          Verify login, one protected read, one authorized write, deep links,
          metadata, email, storage, and rate limits in the preview.
        </li>
        <li>
          Promote the verified build, then confirm the public URL in an
          incognito browser.
        </li>
      </ol>
      <h2>Release evidence</h2>
      <p>
        A public pre-release preview and repository are available. Final release
        documentation will still report demo access, complete workflow checks,
        screenshots, measured quality results, and a semantic tag only after
        each artifact has been verified; missing provider access is reported as
        a blocker instead of an invented result.
      </p>
    </DocsPage>
  );
}
