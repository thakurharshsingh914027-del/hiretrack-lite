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
          Configure every variable documented in <code>.env.example</code> using
          Vercel environment settings.
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
      <h2>No fabricated deployment evidence</h2>
      <p>
        The repository keeps live URL fields marked as pending until a real
        public deployment exists. Provider access and public repository changes
        require owner authorization; release documentation will report that
        blocker instead of inventing a URL or passing result.
      </p>
    </DocsPage>
  );
}
