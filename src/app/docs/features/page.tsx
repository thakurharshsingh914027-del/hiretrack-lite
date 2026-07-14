import { DocsPage } from "@/components/marketing/docs-page";
import { createMetadata } from "@/lib/site";

export const metadata = createMetadata({
  title: "Planned applicant tracking features",
  description:
    "Preview the jobs, candidates, pipeline, interview, analytics, and role-based access workflows planned for later HireTrack Lite development milestones.",
  path: "/docs/features",
});

export default function FeaturesPage() {
  return (
    <DocsPage
      title="Product features"
      description="The approved v1 workflow, presented as a release plan rather than functionality already shipped in the Milestone 1 foundation."
      path="/docs/features"
    >
      <h2>Planned core workflow</h2>
      <p>
        Later milestones will implement and verify the following connected
        recruiting flow with persisted, organization-scoped data.
      </p>
      <ol>
        <li>
          <strong>Open a job.</strong> The release will capture the role,
          department, location, employment type, description, requirements, and
          hiring status.
        </li>
        <li>
          <strong>Add a candidate.</strong> It will keep contact details,
          skills, experience, a private resume, notes, and application history
          together.
        </li>
        <li>
          <strong>Connect the application.</strong> Recruiters will add a
          candidate to a job once and move the application through a clear
          six-stage pipeline.
        </li>
        <li>
          <strong>Coordinate interviews.</strong> Teams will assign an
          interviewer, time, type, meeting link, feedback, rating, and outcome.
        </li>
        <li>
          <strong>Learn from the flow.</strong> Authorized members will review
          real pipeline distribution, hiring activity, interview completion, and
          an immutable activity trail.
        </li>
      </ol>
      <h2>Planned data controls</h2>
      <p>
        Search, AND-combined filters, stable indexed sorting, and cursor
        pagination will be processed on the server and mirrored into the URL.
        Recruiters will be able to select a loaded window or an explicitly
        capped all-matching result set, confirm bulk actions, and export the
        same authorized view as CSV or PDF.
      </p>
      <h2>Planned access and privacy</h2>
      <ul>
        <li>
          <strong>Admins</strong> manage members, recruiting data, analytics,
          and audit history.
        </li>
        <li>
          <strong>Recruiters</strong> manage recruiting records and analytics
          without organization-role administration.
        </li>
        <li>
          <strong>Viewers</strong> have server-enforced read-only access.
        </li>
      </ul>
      <p>
        Every protected query will use the current database membership and
        organization scope. A role, actor, or organization identifier submitted
        by a browser will never be trusted.
      </p>
    </DocsPage>
  );
}
