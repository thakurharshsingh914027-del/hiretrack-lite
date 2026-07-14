# HireTrack Lite — Product and Implementation Plan

Status: **Milestone 1 verified on 2026-07-13; awaiting approval for Milestone 2**

Approval phrase: `APPROVE PLAN`

Planning date: 2026-07-13

This document is the implementation contract for HireTrack Lite. The user approved implementation with “yes isko create karo according to this pdf” on 2026-07-13. Work proceeds one milestone at a time, with verification and a pause after every major milestone.

## 1. Product problem and target users

### Problem

Small companies often coordinate hiring through spreadsheets, email threads, and calendars. That makes ownership unclear, duplicates candidate data, hides pipeline bottlenecks, and creates inconsistent access to sensitive recruiting information. Full enterprise applicant tracking systems are often too expensive or complex for a small team.

HireTrack Lite provides a focused, organization-scoped workspace for jobs, candidates, applications, interviews, notes, and hiring analytics. It prioritizes quick setup, a clear pipeline, safe collaboration, and reliable auditability.

### Target users

- **Company administrators:** create the organization workspace, manage member access, oversee all recruiting data, inspect audit history, and view analytics.
- **Recruiters and hiring leads:** manage jobs and candidates, advance applications, coordinate interviews, leave internal notes, and monitor hiring outcomes.
- **Hiring managers and observers:** inspect jobs, candidates, interviews, notes, pipeline state, and analytics without changing records.
- **Primary organization profile:** a small company or recruiting team with one organization, approximately 2–50 members, tens of open jobs, and hundreds to low thousands of candidates.

### Product goals

- Make the current state and next step of each application obvious.
- Keep every read and write isolated to the authenticated user's organization.
- Let recruiters finish common workflows without leaving the product.
- Provide useful live analytics without a separate reporting system.
- Remain straightforward to deploy, operate, test, and contribute to.

### Out of scope for the initial release

- General multi-organization switching in the UI (accepting an invitation into a second organization selects that organization for the invitation flow; a full workspace switcher is deferred).
- Public job board and candidate self-service portal.
- Automated email campaigns, calendar provider synchronization, or video meeting creation.
- Resume parsing, AI ranking, or candidate scoring.
- Custom pipeline stages, custom fields, billing, SSO, and SCIM.
- Permanent organization deletion from the application UI.

## 2. User stories

### Visitor and authentication

- As a visitor, I can create an account and an organization so I can start recruiting.
- As a visitor, I can use email/password or a configured Google or GitHub OAuth provider; OAuth remains hidden when its provider credentials are not configured.
- As a new user, I can verify my email so that write access is enabled.
- As a registered user, I can sign in and sign out using secure cookie-based authentication.
- As a user who forgot a password, I can request a single-use, expiring reset link without revealing whether an account exists.
- As a user, I can reset my password, invalidating prior reset links and existing sessions.

### Administrator

- As an admin, I can view organization members and change their roles.
- As an admin, I can invite a member by email with an initial recruiter or viewer role and revoke a pending invitation.
- As an admin, I can remove a member while preserving the audit history of their actions.
- As an admin, I can perform every recruiter workflow.
- As an admin, I can view organization audit logs.
- As an admin, I cannot remove or demote the final active admin.

### Recruiter

- As a recruiter, I can create, edit, close, reopen, and archive jobs.
- As a recruiter, I can add, edit, archive, and restore candidates.
- As a recruiter, I can search, filter, sort, and move forward/backward through jobs and candidates with cursor-based pagination.
- As a recruiter, I can attach a validated resume to a candidate.
- As a recruiter, I can connect a candidate to a job only once while the application is active.
- As a recruiter, I can move an application through the pipeline and see the change immediately.
- As a recruiter, I receive a rollback and actionable error if a pipeline update fails.
- As a recruiter, I can schedule, complete, or cancel interviews and record feedback and rating.
- As a recruiter, I can add and delete internal candidate notes.
- As a recruiter, I can select rows, explicitly select every result matching the current filters across cursor pages, and run a permitted bulk action only after reviewing a confirmation summary.
- As a recruiter, I can export the current filtered job or candidate table as CSV or PDF.
- As a recruiter, I can view live pipeline and hiring analytics.

### Viewer

- As a viewer, I can read organization recruiting records and analytics.
- As a viewer, I do not see enabled mutation controls and cannot mutate data even if I call the server directly.
- As a viewer, I cannot export data, because exporting bulk personal data is treated as a write-adjacent privileged operation.

### All members

- As a member, I see only data belonging to my organization.
- As a member, I can navigate core workflows with a keyboard and on a 320 px-wide screen.
- As a member, I can open a command palette, use `j`/`k` to move through list items, press `/` to focus the current list search, and open an in-product shortcut cheat sheet.
- As a member, I see useful loading, empty, error, and success feedback for asynchronous work.

## 3. Functional requirements

### Authentication and organization onboarding

- Email/password registration creates a `User`, an `Organization`, and an `ADMIN` `Membership` in one transaction.
- Email addresses are normalized before lookup and uniqueness checks; passwords are hashed with Argon2id.
- Verification and reset tokens are cryptographically random, stored only as SHA-256 hashes, single-use, and expire.
- Sign-in is denied until email verification; the verification page can resend a rate-limited verification message.
- Auth.js owns credentials authentication, optional Google/GitHub OAuth, authentication cookies, and protected-session resolution. A provider is registered only when its complete server-side configuration is present; otherwise its control is not rendered.
- OAuth callbacks accept only a provider-verified email. An OAuth-only user completes organization onboarding (or a matching invitation) before entering the app, and an email collision never silently links accounts without proof through the existing account.
- Cookies are `httpOnly`, `secure` in production, `sameSite=lax`, and use an appropriate host-only prefix in production.
- Password reset revokes all active authentication by increasing a server-checked `sessionVersion` on the user.
- Credential sign-in and password-reset requests default to five attempts per 15 minutes for both the privacy-safe IP key and normalized account key. Distributed counters apply exponential backoff, return an accurate `Retry-After`, and use the same outward response/timing whether or not the account exists.
- Auth UI distinguishes valid generic no-match responses from transport/offline failures without exposing account existence, preserves safe form state, and gives a retry path when connectivity returns.
- A seeded, verified demo admin account is documented in `README.md`; production demo credentials are supplied through server-only environment variables.

### Dashboard

- Show total active candidates, active/open jobs, future scheduled interviews, and hired applications.
- Show candidates/applications grouped by pipeline stage with Recharts.
- Show a keyset-paginated recent activity feed with actor, action, entity, and timestamp.
- Derive all values from the current organization and exclude soft-deleted records.

### Jobs

- CRUD fields: title, department, location, employment type, description, requirements, and status (`DRAFT`, `OPEN`, `CLOSED`).
- List supports debounced text search, status/department/employment filters, stable sorting, and server-side keyset pagination with an opaque cursor and a default limit of 25.
- Detail shows job metadata, application counts by stage, and associated applications.
- “Delete” performs a soft archive. Restore is available to admin/recruiter. Existing application history remains intact.
- The table supports selection in the currently loaded cursor window plus an explicit “select all matching” mode spanning every cursor window. Bulk status/archive/restore actions show the action, matching count, and exclusions in a confirmation dialog before a server-authorized mutation.
- CSV and PDF exports respect the same validated filters, visible columns, and stable ordering as the table.

### Candidates

- CRUD fields: first name, last name, email, phone, location, skills, years of experience, and resume metadata.
- Candidate email is normalized and must be unique among active candidates in one organization.
- Skills are normalized as trimmed, unique strings with a documented upper bound.
- Resume upload accepts only PDF and DOCX, checks extension and detected/declared MIME type, enforces a 5 MiB limit, uses randomized storage keys, and stores only metadata/key in PostgreSQL.
- Resume download is authorized server-side and delivered using a short-lived signed URL or streamed response.
- Replacing or archiving a resume schedules safe storage cleanup without breaking the database transaction.
- Candidate detail shows applications, interviews, notes, and relevant activity.
- Search/filter/sort/keyset pagination and CSV/PDF export are server-side and URL-synchronized.
- The table supports selection in the currently loaded cursor window, explicit selection of all matching results across cursor windows, exclusions, and confirmed bulk archive/restore actions.

### Applications and pipeline

- A candidate can have one active application per job.
- Stages are `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFERED`, `HIRED`, and `REJECTED`.
- The Kanban board groups applications by stage and supports keyboard-accessible move controls in addition to pointer drag and drop.
- A stage mutation includes the record's `updatedAt` (or version) for optimistic concurrency control.
- The client applies an optimistic move, disables duplicate moves, then commits or rolls back based on the server result.
- The server rechecks membership, role, organization ownership, allowed stage, and concurrency before updating.
- Every successful stage change and application lifecycle action writes an `ActivityLog` in the same database transaction.
- Moving to `HIRED` records `hiredAt`; moving away clears it. Moving to `REJECTED` records `rejectedAt`; moving away clears it.

### Interviews

- Create and update interview type, scheduled start/end, time zone, interviewer membership, optional meeting URL, and status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
- Validate end time after start time, URL protocol, interviewer membership, and application ownership.
- Completion can include private feedback and an integer rating from 1–5.
- Cancelling retains the record for history; scheduled dashboard counts exclude cancelled/completed interviews.
- Dates are stored in UTC and rendered in the viewer's browser time zone with the selected time zone displayed.

### Candidate notes

- Organization members can read notes; admin/recruiter can create notes.
- An admin may delete any note. A recruiter may delete their own note only.
- Deletion is soft deletion so author/timestamp and audit history can be preserved without exposing deleted content.
- Notes are rendered as plain text; no raw HTML rendering is used.

### Members and authorization

- Admins can list memberships, invite members by email as `RECRUITER` or `VIEWER`, revoke pending invitations, change `RECRUITER`/`VIEWER` roles, and deactivate members.
- Invitations use a cryptographically random, hashed, single-use token with an expiration. The accepting account email must match the normalized invited email.
- An existing verified user can accept an invitation after authentication. A new user sets a password, verifies their email, and then accepts; membership creation is transactional and idempotent.
- Role input is allow-listed but never trusted; current role is always read from the database.
- The final active admin cannot be demoted or removed.
- Role changes and membership deactivation take effect from the live database immediately and rotate/revoke the affected user's active session version; the next request must establish a fresh session with the new privilege state.

### Analytics

- Candidates/applications by stage.
- Active applications grouped by job.
- Hires grouped by calendar month for a selected recent range.
- Interview completion rate: completed divided by completed plus cancelled plus past-due scheduled interviews in the selected period; the UI displays the definition.
- Analytics queries are organization-scoped and return empty datasets rather than static samples.

### Export and audit

- Candidate/job table views export the same authorized, filtered, stably ordered result set as either CSV or PDF. CSV uses streaming output, formula-injection escaping, and UTF-8; PDF uses a server-generated paginated table with repeated headers and readable wrapping. Both use safe filenames and a maximum row count.
- Export routes are admin/recruiter only and rate-limited per membership/organization.
- Bulk inputs use either an explicit ID set or an `allMatching` descriptor containing the normalized filter/sort snapshot and explicit exclusions. The server rebuilds the organization-scoped predicate, enforces an operation-specific cap and role, and reports affected/skipped counts; client-supplied counts are informational only.
- Destructive or status-changing bulk actions always require an accessible confirmation dialog and write per-record audit events (plus a shared batch identifier) in bounded transactions.
- Audit logs capture actor, organization, entity type, entity ID, action, timestamp, and a redacted structured change summary.
- Audit metadata never stores passwords, tokens, entire resumes, or other secrets.

### Cross-cutting UI behavior

- The responsive application shell provides side navigation on desktop and an accessible drawer on small screens.
- Search inputs debounce updates and replace URL query parameters; filters, sort, opaque `after`/`before` cursor, and `limit` are shareable/bookmarkable. Changing search, filters, sort, or limit clears the cursor.
- The application shell exposes a `Ctrl/Cmd+K` command palette for navigation/actions. On supported lists, `/` focuses search and `j`/`k` moves the active row/card; shortcuts are ignored while typing or composing text, and `?` opens a discoverable cheat sheet.
- Route-level `loading.tsx`, error boundaries, not-found states, form submission states, toasts, and layout-matching skeletons cover asynchronous workflows.
- Empty states explain the state and offer the primary permitted action; viewers get a non-mutating explanation.
- Dark mode defaults to the system preference, can be overridden by the user in a cookie, and is applied before paint to avoid a flash.
- Transitions last 150–250 ms and are removed/reduced under `prefers-reduced-motion`.

## 4. Non-functional requirements

### Security and privacy

- Every protected query and mutation resolves the session and active membership on the server, then includes `organizationId` in its database predicate.
- Mutations additionally enforce the required role using a centralized authorization policy.
- No client-provided organization ID, role, author ID, or actor ID is authoritative.
- Zod validates route params, search params, forms, JSON, file metadata, bulk selection descriptors, and CSV/PDF export filters on the server.
- Prisma uses parameterized queries; raw SQL is limited to reviewed migrations/aggregations with parameter binding.
- Auth.js CSRF protections cover auth operations. Server Actions use Next.js origin checks and same-site cookies; state-changing Route Handlers additionally verify allowed origin and content type where applicable.
- Set CSP, HSTS in production, frame restrictions, referrer policy, MIME sniffing protection, and permissions policy. Generate CSP nonces where required.
- Secrets stay in server-only environment variables; `.env*` is ignored except `.env.example`.
- Logs redact credentials, tokens, cookies, candidate note content, and personal data not needed for diagnostics.

### Accessibility

- Target WCAG 2.2 AA for contrast and interaction.
- Exactly one `main` and one visible `h1` per route; use semantic landmarks and heading order.
- All controls have accessible names, visible `focus-visible` rings, at least 44×44 px touch targets, and no color-only status meaning.
- Dialogs/menus use accessible shadcn/Radix primitives with focus trapping, focus restoration, Escape handling, and keyboard navigation.
- Kanban has non-drag move controls and live-region announcements.
- Charts have text summaries/tables and do not rely on color alone.
- No horizontal page scrolling at 320 px; wide data tables switch to cards or contained scrolling with labels.

### Performance and reliability

- Prefer React Server Components for reads and client components only for interactive islands.
- Paginate unbounded collections with indexed keyset/cursor queries; use a default limit of 25 and hard maximum of 100 records per request. Offset/page-number pagination is not used for mutable recruiting tables.
- Add indexes for organization-scoped filters, foreign keys, statuses, timestamps, normalized email, and stable sort tie-breakers.
- Use `id` as the final sort key so cursor ordering is deterministic; opaque cursors encode the normalized sort tuple, direction, and version and are rejected when malformed or incompatible with the active query.
- Avoid N+1 reads by selecting needed relations and using grouped aggregate queries.
- Cache only public/static content. Authenticated data is dynamic and never shared across users.
- Target good Core Web Vitals on representative mobile hardware; keep client JavaScript focused.
- Lighthouse CI runs against the production build for the public landing/docs routes and a representative seeded application route. Minimum mobile scores are Performance 90, Accessibility 95, Best Practices 95, and SEO 95; regressions fail CI unless an evidenced, time-bounded exception is documented.
- Database writes that must stay consistent use Prisma transactions.

### Maintainability and quality

- TypeScript strict mode; no explicit or implicit `any`.
- Clear separation among UI, validation, authorization, data access, and domain services.
- Reusable Zod schemas define client-compatible inputs while server-only schemas add trusted context.
- ESLint, Prettier, typecheck, Vitest, Playwright, and production build run locally and in CI.
- No TODOs, dead files, unused exports, generated filler comments, or unverified completion claims.

### Compatibility and observability

- Support current stable Chrome, Firefox, Safari, and Edge, plus responsive mobile layouts.
- Structured server logs include request/correlation ID, event name, and non-sensitive identifiers.
- Vercel runtime logs and database/provider dashboards are the initial operational telemetry; error monitoring can be added through a provider-neutral adapter.

## 5. Acceptance criteria

### Release-wide acceptance

- A fresh clone can be configured from `.env.example`, migrated, seeded, tested, built, and run using documented commands.
- An unverified account cannot perform protected writes.
- Anonymous users are redirected away from application routes; authenticated users cannot use auth-only pages unnecessarily.
- Cross-organization reads and writes return not-found/forbidden without revealing record existence.
- Viewer mutation attempts fail server-side with a typed authorization error.
- Admin/recruiter workflows return the canonical updated record after mutation.
- Every required list uses server-side search, filters, stable sorting, and cursor/keyset pagination with URL state; changing the query resets its cursor and repeated traversal does not duplicate or omit unchanged records.
- Job and candidate tables support row selection, explicit select-all-matching across cursor pages, exclusions, confirmation for bulk mutations, and authorized CSV/PDF export parity with the current filters and ordering.
- The command palette, `j`/`k`, `/`, and shortcut cheat sheet are keyboard operable, discoverable, and do not fire from editable controls.
- Required asynchronous states, responsive layout, dark mode, reduced motion, keyboard operation, and focus behavior pass manual review.
- No candidate/job chart or metric is backed by static product data.
- Security headers, token hashing/expiry, upload validation, auth/export rate limits, and CSV injection protection are verified by automated tests where practical.
- CI passes lint, strict typecheck, tests, and a production build.
- Lighthouse CI meets the documented score gates on the production build.
- Public docs are statically rendered, crawlable, present in the sitemap, and emit valid `BreadcrumbList` JSON-LD; the FAQ emits valid `FAQPage` JSON-LD matching visible content.
- README and repository support files meet the trial specification and reflect commands actually executed.
- Final public delivery includes a live demo, public repository, real screenshots, a concise pitch, case study, demo-video link, changelog entry, and a tagged release; unavailable external credentials are reported as a delivery blocker rather than replaced with fabricated URLs.

### Critical workflow acceptance

Given a seeded verified admin, the Playwright critical flow can:

1. Log in.
2. Create an open job.
3. Create a candidate.
4. Add that candidate to the job.
5. Open the pipeline.
6. Move the application from `APPLIED` to `INTERVIEW`.
7. Observe the updated column and activity entry after reload.

### Feature-specific acceptance checks

- Duplicate active candidate email in one organization is rejected but the same email can exist in another organization.
- A candidate cannot be actively added to the same job twice.
- A stale pipeline mutation is rejected and the optimistic UI rolls back with an actionable message.
- A PDF/DOCX within 5 MiB uploads; an executable, spoofed MIME type, or oversized file is rejected.
- A reset token works once before expiration, never appears in logs/database plaintext, and revokes earlier sessions after success.
- The last admin guard holds under concurrent role-change requests.
- A malformed/tampered cursor is rejected; forward/backward keyset traversal preserves the selected stable sort without leaking another organization’s rows.
- Select-all-matching applies the server-reconstructed current filter across cursor pages, honors exclusions and caps, requires confirmation, and cannot mutate viewer or cross-organization records.
- CSV and PDF output include only authorized, filtered organization records; both preserve table ordering, and CSV neutralizes cells beginning with `=`, `+`, `-`, or `@`.
- Google/GitHub sign-in appears only for configured providers, rejects unverified provider email, and does not silently link an existing email/password identity.
- Interview completion rate matches its documented formula, including the zero-denominator state.

## 6. Application routes

### Public and authentication routes

| Route              | Purpose                                                                               | Access                                               |
| ------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `/`                | Product landing page with SoftwareApplication JSON-LD                                 | Public                                               |
| `/login`           | Email/password sign-in                                                                | Signed-out                                           |
| `/signup`          | Account and organization registration                                                 | Signed-out                                           |
| `/verify-email`    | Verification result/resend UI                                                         | Public with token/member context                     |
| `/forgot-password` | Request reset link                                                                    | Signed-out                                           |
| `/reset-password`  | Validate token and set password                                                       | Public with token                                    |
| `/accept-invite`   | Accept an organization invitation or continue to signup/login                         | Public with token; final acceptance authenticated    |
| `/onboarding`      | Create/select an organization after first OAuth sign-in or continue an invitation     | Authenticated account without an active organization |
| `/demo`            | Demo details and sign-in entry point                                                  | Public                                               |
| `/docs`            | Statically generated, crawlable documentation index with breadcrumbs                  | Public                                               |
| `/docs/[slug]`     | Statically generated product/setup documentation with `BreadcrumbList` JSON-LD        | Public                                               |
| `/faq`             | Statically generated visible FAQ with matching `FAQPage` and `BreadcrumbList` JSON-LD | Public                                               |

### Protected application routes

| Route                                | Purpose                                             | Allowed roles            |
| ------------------------------------ | --------------------------------------------------- | ------------------------ |
| `/app`                               | Dashboard                                           | ADMIN, RECRUITER, VIEWER |
| `/app/jobs`                          | Searchable jobs list                                | ADMIN, RECRUITER, VIEWER |
| `/app/jobs/new`                      | Create job                                          | ADMIN, RECRUITER         |
| `/app/jobs/[jobId]`                  | Job detail/applications                             | ADMIN, RECRUITER, VIEWER |
| `/app/jobs/[jobId]/edit`             | Edit job                                            | ADMIN, RECRUITER         |
| `/app/candidates`                    | Searchable candidates list                          | ADMIN, RECRUITER, VIEWER |
| `/app/candidates/new`                | Create candidate                                    | ADMIN, RECRUITER         |
| `/app/candidates/[candidateId]`      | Candidate overview, notes, applications, interviews | ADMIN, RECRUITER, VIEWER |
| `/app/candidates/[candidateId]/edit` | Edit candidate                                      | ADMIN, RECRUITER         |
| `/app/pipeline`                      | Job-filtered Kanban pipeline                        | ADMIN, RECRUITER, VIEWER |
| `/app/interviews`                    | Interview schedule/list                             | ADMIN, RECRUITER, VIEWER |
| `/app/analytics`                     | Hiring analytics                                    | ADMIN, RECRUITER, VIEWER |
| `/app/settings/profile`              | Current user profile                                | ADMIN, RECRUITER, VIEWER |
| `/app/settings/members`              | Member roles/status                                 | ADMIN                    |
| `/app/settings/audit-log`            | Searchable audit events                             | ADMIN                    |

### Framework and machine routes

| Route                        | Purpose                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| `/api/auth/[...nextauth]`    | Auth.js handlers                                                       |
| `/api/uploads/resumes`       | Authorized validated upload/replace operation                          |
| `/api/resumes/[candidateId]` | Authorized resume retrieval/redirect                                   |
| `/api/exports/candidates`    | Rate-limited filtered candidate CSV/PDF selected by validated `format` |
| `/api/exports/jobs`          | Rate-limited filtered job CSV/PDF selected by validated `format`       |
| `/robots.txt`                | Next.js metadata route                                                 |
| `/sitemap.xml`               | Public canonical routes only                                           |
| `/opengraph-image`           | 1200×630 generated/static OG image                                     |
| `/favicon.ico`               | Custom product favicon                                                 |
| `not-found`                  | Polished global 404 experience                                         |

Route groups such as `(marketing)`, `(auth)`, and `(dashboard)` organize layouts without affecting URLs. Protected layouts improve UX, but each data function still performs its own server authorization.

## 7. Database entities and relationships

### General conventions

- PostgreSQL with Prisma ORM and checked-in migrations.
- UUID primary keys generated by the database or Prisma consistently.
- All mutable domain records include `createdAt` and `updatedAt`; tokens also retain both timestamps for traceability.
- Enums live in the Prisma schema for role, job status, employment type, application stage, interview status/type, and audit action/entity.
- Email fields use a normalized lowercase comparison value. Display casing may be stored separately where useful.
- `deletedAt` implements soft deletion for recovery-worthy records. Default data access helpers exclude deleted rows.

### Entities

#### Organization

- `id`, `name`, unique `slug`, `createdAt`, `updatedAt`.
- Owns memberships, jobs, candidates, applications (denormalized organization key for safe scoping), interviews, notes, and activity logs.
- Organization hard deletion is an operator-only action; foreign keys cascade only as part of an explicit full tenant purge.

#### User

- `id`, `name`, `email`, unique `emailNormalized`, optional `passwordHash` (OAuth-only accounts), `emailVerifiedAt`, `sessionVersion`, `createdAt`, `updatedAt`, optional `disabledAt`.
- Owns memberships and token records. Password hash is never selected into ordinary view models.
- User removal is deactivation in the app. Historical audit actor references use `SET NULL` rather than losing audit events.

#### AuthAccount

- `id`, `userId`, `type`, `provider`, `providerAccountId`, and only the provider fields required by the Auth.js adapter.
- Unique `(provider, providerAccountId)` with an index on `userId`; the relation cascades only on an exceptional user hard purge.
- Provider tokens are not exposed to the client or logs and are not persisted unless required; any persisted provider credential is encrypted at rest. Account linking requires explicit proof and never relies only on an email collision.

#### Membership

- `id`, `organizationId`, `userId`, `role`, `createdAt`, `updatedAt`, optional `deactivatedAt`.
- Unique `(organizationId, userId)`; indexes on `(userId, deactivatedAt)` and `(organizationId, role, deactivatedAt)`.
- Foreign keys to organization/user cascade only on an explicit hard purge.
- Author/interviewer attribution points to membership when organization context matters; removal deactivates rather than deletes the row.

#### Job

- `id`, `organizationId`, `title`, `department`, `location`, `employmentType`, `description`, `requirements`, `status`, `createdByMembershipId`, `createdAt`, `updatedAt`, `deletedAt`.
- Indexes: `(organizationId, deletedAt, status, createdAt, id)`, department, title/search support.
- Organization and creator relations use `RESTRICT` during normal operation. Soft deletion preserves applications.

#### Candidate

- `id`, `organizationId`, `firstName`, `lastName`, `email`, `emailNormalized`, `phone`, `location`, `skills` (PostgreSQL text array), `experienceYears`, resume key/name/MIME/size fields, `createdByMembershipId`, `createdAt`, `updatedAt`, `deletedAt`.
- A custom PostgreSQL partial unique index enforces `(organizationId, emailNormalized) WHERE deletedAt IS NULL`.
- Indexes support organization/name/date/location search and stable ordering.
- Soft deletion preserves applications, interviews, note attribution, and audit history.

#### Application

- `id`, `organizationId`, `jobId`, `candidateId`, `stage`, `source`, optional `hiredAt`, optional `rejectedAt`, `createdByMembershipId`, `createdAt`, `updatedAt`, optional `deletedAt`.
- Custom partial unique index enforces one active `(jobId, candidateId)` application.
- Indexes: `(organizationId, jobId, stage, updatedAt, id)`, `(organizationId, candidateId, createdAt, id)`, and hired date.
- Job/candidate deletion is restricted at the database layer; application is archived first or retained behind soft-deleted parents.

#### Interview

- `id`, `organizationId`, `applicationId`, `interviewerMembershipId`, `type`, `startsAt`, `endsAt`, `timeZone`, optional `meetingUrl`, `status`, optional `feedback`, optional `rating`, `createdByMembershipId`, `createdAt`, `updatedAt`.
- Indexes: `(organizationId, status, startsAt, id)`, application, interviewer/date.
- Application and organization are `RESTRICT`; deactivated interviewer membership remains referentially available.

#### CandidateNote

- `id`, `organizationId`, `candidateId`, `authorMembershipId`, `body`, `createdAt`, `updatedAt`, optional `deletedAt`, optional `deletedByMembershipId`.
- Index: `(organizationId, candidateId, deletedAt, createdAt, id)`.
- Candidate/author relations are retained; content is excluded after soft deletion.

#### ActivityLog

- `id`, `organizationId`, optional `actorMembershipId`, `entityType`, `entityId`, `action`, optional `changes` JSON, `createdAt`, `updatedAt`.
- Immutable through product APIs; no delete/update mutation is exposed.
- Indexes: `(organizationId, createdAt, id)`, entity lookup, and actor/date.
- Actor uses nullable `SET NULL` only for exceptional hard purge; organization cascades only during tenant purge.

#### EmailVerificationToken

- `id`, `userId`, unique `tokenHash`, `expiresAt`, optional `usedAt`, `createdAt`, `updatedAt`.
- Indexed by user/expiration. User hard purge cascades tokens.
- New issuance invalidates unused older verification tokens for that user.

#### PasswordResetToken

- `id`, `userId`, unique `tokenHash`, `expiresAt`, optional `usedAt`, `createdAt`, `updatedAt`.
- Indexed by user/expiration. User hard purge cascades tokens.
- Successful consumption atomically marks the token used, changes the password, increments `sessionVersion`, and invalidates other unused reset tokens.

#### OrganizationInvitation

- `id`, `organizationId`, `email`, `emailNormalized`, `role` (`RECRUITER` or `VIEWER` only), `tokenHash`, `invitedByMembershipId`, `expiresAt`, optional `acceptedAt`, optional `revokedAt`, `createdAt`, `updatedAt`.
- Unique token hash plus a custom partial unique index for one pending invitation per `(organizationId, emailNormalized)`.
- Organization hard purge cascades invitations; inviter membership remains available through deactivation. Expired/revoked invitations are retained for audit history and excluded from pending lists.

### Additional persistence

- Auth.js uses credentials plus optionally configured Google/GitHub OAuth and an encrypted, signed JWT session in a secure `httpOnly` cookie. The JWT contains only user ID, session version, and expiry—not organization role. Role/membership is loaded from PostgreSQL for every protected operation.
- Auth.js-managed session expiry/refresh supplies rolling session rotation; `sessionVersion` enables immediate server-side invalidation after password, security, or privilege-change events.
- Rate limits are stored in Upstash Redis (production) with deterministic expirations; rate-limit data is operational and not part of the relational domain model.
- Resume bytes are stored in private Vercel Blob storage; PostgreSQL stores storage keys and validated metadata.

## 8. Authorization matrix

Legend: `R` read, `C` create, `U` update, `D` archive/delete, `X` export, `—` denied. Every allowed operation also requires active membership, verified email for writes, and matching organization ownership.

| Resource/action       | ADMIN            | RECRUITER        | VIEWER           | Anonymous   |
| --------------------- | ---------------- | ---------------- | ---------------- | ----------- |
| Dashboard             | R                | R                | R                | —           |
| Jobs                  | R/C/U/D/X        | R/C/U/D/X        | R                | —           |
| Candidates/resumes    | R/C/U/D/X        | R/C/U/D/X        | R/download       | —           |
| Applications/pipeline | R/C/U/D          | R/C/U/D          | R                | —           |
| Interviews/feedback   | R/C/U/D          | R/C/U/D          | R                | —           |
| Candidate notes       | R/C/D any        | R/C/D own        | R                | —           |
| Analytics             | R                | R                | R                | —           |
| Members               | R/C/U/D          | —                | —                | —           |
| Roles                 | R/U              | —                | —                | —           |
| Audit log             | R                | —                | —                | —           |
| Profile               | R/U own          | R/U own          | R/U own          | —           |
| Auth/signup/reset     | As account owner | As account owner | As account owner | C/use token |

Additional policy rules:

- `ADMIN` and `RECRUITER` are equivalent for recruiting domain mutations, except note deletion ownership and member/audit administration.
- A `VIEWER` can download an individual resume because it is part of candidate read access, but cannot bulk export.
- User profile updates cannot change role, organization, verification, password hash, or session version through generic input.
- Missing, deleted, or cross-organization resources produce a generic not-found result where existence disclosure is risky.
- Role changes lock/check the organization admin set transactionally so at least one active admin remains.

## 9. API and Server Action design

### Shared execution pattern

All protected functions follow this order:

1. Parse untrusted input with Zod.
2. Resolve Auth.js session and server-validated user ID/session version.
3. Load active membership and verification state from PostgreSQL.
4. Enforce the permission policy.
5. Query by both resource ID and `organizationId` (and `deletedAt: null` where applicable).
6. Execute mutation plus `ActivityLog` in a transaction.
7. Return a typed discriminated result containing the canonical updated view model or a safe error.
8. Revalidate the smallest relevant paths/tags and let the client announce success/failure.

### Server Actions

Colocate thin action entry points near route features; domain logic lives in server-only services so it can be integration tested directly.

- Auth/onboarding: `signUp`, `completeOAuthOnboarding`, `resendVerification`, `requestPasswordReset`, `resetPassword`, `acceptOrganizationInvitation`, `signOut` (Auth.js handles credential and configured OAuth sign-in through its handler).
- Jobs: `createJob`, `updateJob`, `archiveJob`, `restoreJob`, `bulkUpdateJobs`.
- Candidates: `createCandidate`, `updateCandidate`, `archiveCandidate`, `restoreCandidate`, `bulkUpdateCandidates`.
- Applications: `createApplication`, `archiveApplication`, `updateApplicationStage`.
- Interviews: `createInterview`, `updateInterview`, `cancelInterview`, `completeInterview`.
- Notes: `createCandidateNote`, `deleteCandidateNote`.
- Members: `inviteMember`, `revokeInvitation`, `updateMemberRole`, `deactivateMember`.
- Profile/preferences: `updateProfile`, `setThemePreference`.

Action results use a form-friendly shape such as `{ ok: true, data } | { ok: false, code, message, fieldErrors? }`; exceptions and Prisma errors are mapped centrally and never leak internals.

### Query services

- `getDashboardSummary`, `getRecentActivity`.
- `listJobs`, `getJob`, `getJobFilterOptions`.
- `listCandidates`, `getCandidate`, `getCandidateFilterOptions`.
- `getPipeline`, `listCandidateApplications`.
- `listInterviews`, `getInterview`.
- `getAnalytics`.
- `listMembers`, `listAuditEvents`.

Each list accepts a Zod-normalized query object containing `q`, filter values, `sort`, `direction`, one opaque `after` or `before` cursor, and `limit`. It returns `{ items, pageInfo: { nextCursor, previousCursor, hasNext, hasPrevious }, filters }`. The query uses a sort-value/`id` keyset predicate plus `limit + 1`; selection previews/counts and rows reuse the same filter predicate, and changing the predicate invalidates the cursor.

### Route Handlers

- Auth.js credentials and configured Google/GitHub handlers at `/api/auth/[...nextauth]`.
- Resume upload and authorized download, because file streams do not fit ordinary form action responses cleanly.
- Candidate/job CSV and PDF exports, because streamed/generated downloads and content-disposition headers require Route Handlers.
- Metadata routes for robots, sitemap, and OG output use Next.js route conventions.

Route Handlers apply method checks, origin/content-type validation for state changes, authorization, rate limits where specified, safe cache headers, and structured error responses.

### Validation modules

- One schema module per domain, including form input and query-string schemas.
- Limits cover string length, normalized whitespace, enum values, numeric ranges, URL protocols, cursor shape/version, request limit, bulk selection descriptors/exclusions, export format, date consistency, and array cardinality.
- Client reuse improves form feedback; authorization and organization context remain server-only.

### API and Server Action documentation contract

Implementation maintains the following table in `docs/api.md`, adding exact schemas, result/error codes, rate limits, and examples as each milestone lands. It documents the callable contract without exposing secrets or making client-supplied tenant/role values authoritative.

| Surface                       | Operations                                                                  | Validated input                                               | Authorization                                               | Result/side effects                                                               |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Auth.js handler               | credentials sign-in; optional Google/GitHub OAuth; sign-out/callback        | Auth.js provider payload, origin, provider email              | Signed-out/account owner; provider enabled by server config | Secure session rotation or generic typed denial; auth throttling where applicable |
| Auth/onboarding actions       | signup, OAuth onboarding, verify/resend, reset, invitation acceptance       | Form/token schemas                                            | Public token flow or authenticated account owner            | Transactional user/org/membership/token changes; safe discriminated result        |
| Job actions                   | create, update, archive/restore, confirmed bulk update                      | Job schema, expected version, selection descriptor            | `ADMIN`/`RECRUITER`, active organization                    | Canonical records/counts plus transactional audit events                          |
| Candidate/note actions        | candidate CRUD/bulk; note create/delete                                     | Candidate/note schema, expected version, selection descriptor | Role policy plus own-note rule                              | Canonical records/counts, storage compensation where needed, audit events         |
| Application/interview actions | application lifecycle/stage; interview lifecycle                            | Domain IDs, expected version, stage/date/status schema        | `ADMIN`/`RECRUITER`, active organization                    | Canonical record; transactional timestamps and activity                           |
| Member/profile actions        | invite/revoke, role/deactivate, profile/theme                               | Membership/profile schemas                                    | `ADMIN` for membership changes; account owner otherwise     | Last-admin check, affected-user session rotation, audit event                     |
| Query services                | dashboard, jobs, candidates, pipeline, interviews, analytics, members/audit | Filter/sort/cursor/limit schema                               | Active membership plus resource read policy                 | Organization-scoped view models and keyset page info                              |
| Resume handlers               | upload/replace/download                                                     | File metadata/content and candidate ID                        | Per authorization matrix                                    | Private object operation plus safe metadata/stream response                       |
| Export handlers               | jobs/candidates CSV or PDF                                                  | Same filter/sort schema plus `format`                         | `ADMIN`/`RECRUITER`; rate limited                           | Capped organization-scoped attachment with safe headers                           |

## 10. Proposed file and folder structure

```text
hiretrack-lite/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── config.yml
│   ├── pull_request_template.md
│   └── workflows/ci.yml
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── case-study.md
│   ├── competitive-analysis.md
│   ├── decisions.md
│   ├── demo-video.md
│   ├── pitch.md
│   └── screenshots/
│       └── .gitkeep
├── e2e/
│   ├── auth.spec.ts
│   └── critical-hiring-flow.spec.ts
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── screenshots/
│   └── brand/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/app/
│   │   │   ├── analytics/
│   │   │   ├── candidates/
│   │   │   ├── interviews/
│   │   │   ├── jobs/
│   │   │   ├── pipeline/
│   │   │   └── settings/
│   │   ├── (marketing)/
│   │   │   ├── docs/[slug]/
│   │   │   ├── docs/
│   │   │   └── faq/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── exports/
│   │   │   ├── resumes/
│   │   │   └── uploads/resumes/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── opengraph-image.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── analytics/
│   │   ├── candidates/
│   │   ├── command-palette/
│   │   ├── forms/
│   │   ├── jobs/
│   │   ├── layout/
│   │   ├── pipeline/
│   │   └── ui/
│   ├── features/
│   │   ├── applications/
│   │   ├── auth/
│   │   ├── candidates/
│   │   ├── interviews/
│   │   ├── jobs/
│   │   ├── members/
│   │   └── notes/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── email/
│   │   ├── env.ts
│   │   ├── errors/
│   │   ├── rate-limit/
│   │   ├── storage/
│   │   ├── utils/
│   │   └── validation/
│   ├── server/
│   │   ├── actions/
│   │   ├── authorization/
│   │   ├── queries/
│   │   └── services/
│   ├── types/
│   └── proxy.ts
├── tests/
│   ├── integration/
│   ├── unit/
│   └── setup.ts
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── auth.ts
├── components.json
├── eslint.config.mjs
├── lighthouserc.json
├── next.config.ts
├── package.json
├── plan.md
├── playwright.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

Exact route-local files will be introduced only when their milestone requires them. Server-only modules use `server-only` guards. Tests may sit beside small pure modules when that is clearer, while integration suites remain under `tests/`.

## 11. Edge cases

### Authentication and membership

- Registration races for the same normalized email or organization slug.
- Unicode/whitespace email normalization and case-insensitive lookup.
- Login enumeration and timing leakage; all failures use a generic response.
- Google/GitHub is partially configured, provider email is absent/unverified, callback state fails, OAuth is cancelled/offline, or an OAuth email collides with an existing identity; do not silently link accounts.
- Expired, already-used, malformed, or superseded verification/reset token.
- Expired, revoked, reused, or email-mismatched organization invitation; concurrent invitation acceptance; invitation for an existing member.
- Reset requests for nonexistent email return the same response and approximate timing.
- Repeated auth attempts hit either the IP or account threshold, exponential backoff grows, and `Retry-After` remains truthful across instances.
- Session valid in the cookie but user disabled, membership deactivated, version revoked, or organization unavailable.
- Role/deactivation changes occur in another tab while a privileged request is pending; live authorization wins and the stale session is rotated/rejected.
- Two admins concurrently try to demote/remove each other or the final admin.
- User opens a stale form after their role is downgraded.

### Jobs, candidates, and applications

- Empty/very long search, invalid enum/query params, malformed/wrong-query cursor, cursor at either boundary, unsupported sort key, or oversized request limit.
- Rows are inserted, archived, or have their active sort value changed between cursor requests; unchanged records retain deterministic keyset traversal without offset drift.
- Duplicate candidate email under case/whitespace variation and concurrent creation.
- Recreate a previously archived candidate with the same email; restore conflicts with a newer active record.
- Archive a job/candidate that still has applications or future interviews.
- Concurrent edits overwrite each other; high-risk stage moves detect stale `updatedAt`.
- Candidate/job archived between opening the application form and submission.
- Duplicate application requests race.
- Pipeline has no selected job, no applications, a very large column, or a record moved by another recruiter.
- Invalid stage transition input; all enum values are server allow-listed.

### Uploads and exports

- Missing file, zero-byte file, oversized file, renamed executable, mismatched extension/MIME, unsupported DOC format, unsafe filename, or storage-provider failure.
- Database succeeds but old blob cleanup fails, or upload succeeds but database mutation fails; use compensating cleanup and structured logging.
- Unauthorized direct blob access and guessed candidate IDs.
- CSV values contain quotes, newlines, Unicode, delimiter characters, or spreadsheet formulas.
- PDF rows contain long Unicode text, missing values, many columns, or enough records for repeated headers/page breaks.
- Export filter produces zero rows or exceeds maximum allowed rows.
- Client disconnects during streaming export.
- Select-all-matching becomes stale after confirmation, exclusions are duplicated/invalid, the cap is exceeded, or a record changes authorization/state mid-batch; re-scope and report affected/skipped results safely.

### Interviews, notes, and analytics

- End at/before start, daylight-saving transition, browser/server time-zone disagreement, past schedule, invalid meeting URL.
- Interviewer is deactivated after scheduling.
- Completed/cancelled interview edited to inconsistent status/feedback.
- Empty/whitespace-only or oversized note, double delete, delete someone else's note.
- Analytics with no data, deleted parents, zero denominator, month boundaries, and UTC/local date display.
- Hired application later moved away from `HIRED` or candidate/job archived.

### UI, accessibility, and networking

- Slow/offline mutation, duplicate submission, server timeout, optimistic rollback, stale router cache.
- Offline auth/reset/export requests preserve safe user input, distinguish connectivity failure from a valid generic server response, and provide retry without leaking account state.
- Dialog closes during submission, focus restoration after deletion, and toast announcement for assistive technology.
- A command shortcut fires while focus is in an input/contenteditable, during IME composition, inside a modal, or when no active list item exists; shortcut scopes and focus restoration remain deterministic.
- Long names/emails/locations, narrow 320 px screen, browser zoom at 200%, reduced motion, dark system theme before hydration.
- Chart unavailable to screen reader or color-blind user; always provide text/table alternative.

## 12. Testing strategy

### Unit tests (Vitest)

- Zod authentication, job, candidate, application, interview, cursor-list-query, bulk-selection, upload, and CSV/PDF export validation.
- Email normalization, password policy, token hash/expiry helpers, cursor encode/decode/query fingerprinting, CSV escaping, PDF table mapping, date calculations, analytics rate formula, and stable sort mapping.
- Authorization policy matrix for every role/action, verified-email gate, own-note deletion, and final-admin rule.
- Error mapping and safe action-result serialization.

### Integration tests (Vitest + isolated PostgreSQL test database)

- Authentication registration/verification/reset/invitation flow, optional OAuth account/onboarding rules, token single use, exact rate-limit/backoff/`Retry-After` behavior, privilege-change session-version rotation, and generic no-match reset response.
- RBAC for admin/recruiter/viewer plus anonymous, disabled, unverified, and cross-organization cases.
- Job CRUD/archive/restore, organization isolation, search/filter/sort/keyset traversal in both directions, confirmed bulk selection across cursor pages, and audit writes.
- Candidate CRUD, normalized duplicate prevention, archive/restore conflict, and resume metadata authorization.
- Application creation uniqueness and application-stage update including timestamps and activity transaction.
- Interview status/feedback and interviewer membership constraints.
- Notes read/create/delete ownership policies.
- Analytics queries against known fixtures.
- CSV/PDF export authorization, filter/order/visible-column parity, row cap, PDF page/layout behavior, and CSV formula-injection protection.

Database integration tests run against real PostgreSQL rather than mocking Prisma. Each test uses transaction rollback or isolated schemas/workers to prevent leakage.

### Component/accessibility tests

- React Testing Library with Vitest for forms, error summaries, keyset navigation, row/all-matching selection and confirmations, command palette/shortcut scoping/cheat sheet, empty states, dialogs, and non-drag pipeline controls.
- `jest-axe` (or equivalent Vitest-compatible axe integration) for representative component accessibility checks.
- Manual keyboard, screen reader smoke, zoom, 320 px width, dark mode, and reduced-motion checklist documented before release.

### End-to-end tests (Playwright)

- Required critical flow: login → create job → create candidate → add application → move to `INTERVIEW` → verify persistence/activity.
- Sign-up/verification can use a test email adapter.
- Viewer read-only UI and direct mutation denial.
- Password reset happy path and token reuse failure.
- Candidate search/cursor URL synchronization, cross-page bulk selection confirmation, and authenticated CSV/PDF downloads.
- Configured-provider visibility and mocked Google/GitHub callback/onboarding cases; no live third-party credentials are used in CI.
- Resume validation with safe fixtures.
- Run desktop Chromium in CI; run Chromium/Firefox/WebKit and mobile projects before release as time permits.

### Security and quality checks

- ESLint and strict `tsc --noEmit`.
- Dependency audit reviewed during milestones without treating noisy advisory output as an automatic pass/fail substitute.
- Tests assert safe headers and cookie attributes where the framework test boundary permits.
- Review generated Prisma migration SQL, especially partial unique indexes and cascade behavior.
- Staff-level diff review after each milestone: tenant scoping, authorization, validation, concurrency, data leakage, accessibility, and dead code.
- Lighthouse CI assertions for the public landing/docs surfaces and a seeded representative application route using the production build.

### CI order

1. Install pinned dependencies with a lockfile.
2. Start/provision PostgreSQL service and set test-only environment variables.
3. Generate Prisma client and apply migrations.
4. Run lint.
5. Run TypeScript typecheck.
6. Run Vitest unit/integration tests.
7. Build the production Next.js application.
8. Install Playwright browser and run the critical E2E suite against the built app.
9. Run Lighthouse CI and enforce the documented category thresholds.

The explicit trial requirement (lint, typecheck, tests, build) is always met; the critical E2E test is also part of CI unless runtime constraints require a separately required E2E job.

## 13. Deployment plan

### Production services

- **Application:** Vercel, Node.js runtime for auth, export, Prisma, and upload handlers.
- **Database:** managed PostgreSQL compatible with Prisma (recommended Neon for pooled/serverless connections), with a separate direct URL for migrations.
- **Private resume storage:** Vercel Blob with server-authorized upload/download flow.
- **Email:** Resend through a provider-neutral mail adapter for verification and reset links.
- **Distributed rate limiting:** Upstash Redis.
- **Source/CI:** public GitHub repository and GitHub Actions.
- **OAuth (optional by configuration):** Auth.js Google and/or GitHub provider credentials; credentials sign-in remains available when neither provider is configured.

### Environment management

- Validate environment variables at startup with a server-only Zod schema.
- Document `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, optional Google/GitHub client IDs and secrets, mail credentials/from address, blob token, Redis URL/token, public app URL, and seed demo settings in `.env.example` and README.
- Only non-secret browser-safe values use `NEXT_PUBLIC_`; no secret has that prefix.
- Preview and production use separate databases, storage, Redis namespaces, and email configuration.

### Release flow

1. CI must pass on the pull request.
2. Vercel creates an isolated preview deployment.
3. Apply reviewed migrations using a controlled CI/release command (`prisma migrate deploy`) against the target environment; do not run destructive development migrations in production.
4. Run a smoke test for credentials login, each configured OAuth provider, dashboard, one read, one authorized write, bulk confirmation, both export formats, and headers.
5. Promote to production and verify canonical URL, static docs/FAQ, structured data, metadata, robots/sitemap, OG image, storage, mail, and rate limits.
6. Seed the demo environment idempotently; never place production credentials in source.
7. Run Lighthouse CI against the production build/deployment and satisfy its release thresholds.
8. Record the release in `CHANGELOG.md`, create and push a semantic Git tag, and verify the tag/release is visible in the public repository.

### Backups, rollback, and operations

- Enable managed PostgreSQL point-in-time recovery/backups and provider retention.
- Prefer backward-compatible expand/migrate/contract schema changes.
- Roll back application deployment through Vercel; roll forward database migrations unless a reviewed reversible migration is safe.
- Keep resume objects private; define retention/cleanup for replaced/orphaned objects.
- Monitor failed auth spikes, export throttling, storage/email errors, 5xx rate, and database saturation through provider logs/dashboards.

### SEO/repository delivery

- Configure canonical production base URL, unique titles/descriptions, OG/Twitter metadata, 1200×630 image, favicon, `robots.txt`, `sitemap.xml`, semantic headings, and custom 404.
- Pre-render crawlable `/docs`, `/docs/[slug]`, and `/faq` routes. Emit schema-valid `BreadcrumbList` JSON-LD on docs/FAQ pages and `FAQPage` JSON-LD whose questions and answers exactly match visible FAQ content; retain `SoftwareApplication` JSON-LD on the landing page.
- Produce a dated, sourced `docs/competitive-analysis.md` comparing relevant lightweight ATS products and translating findings into explicitly original product/design decisions; do not copy competitor UI or marketing language.
- Capture 3–5 real, polished application screenshots after the UI is complete, place them in the documented screenshot directories, and use them in README/case-study presentation.
- Publish a concise portfolio pitch, an evidence-based case study (problem, constraints, decisions, implementation, validation, and outcomes), and a short narrated demo video; store/link them through the documented artifacts without claiming unmeasured outcomes.
- Final acceptance requires an accessible public repository, public production deployment, demo credentials/path, pushed tagged release, and working evidence links. Placeholders are allowed during implementation only. If repository/deployment/provider authority or credentials are unavailable, report final delivery as blocked and request access; never fabricate a URL or claim completion.

## 14. Milestone-by-milestone implementation plan

For every implementation milestone, the execution loop is: explain scope → list files → add/update tests → implement → run lint/typecheck/tests/build → fix all errors → review diff → summarize → propose conventional commit → pause for approval before the next major milestone.

### Milestone 0 — Planning (complete)

- Create this product/engineering plan.
- Create `docs/architecture.md` with ER and system diagrams.
- Review coverage against the specification.
- **Gate:** wait for `APPROVE PLAN`; no application code before approval.

### Milestone 1 — Repository foundation and design system (complete)

- Scaffold Next.js App Router with strict TypeScript, Tailwind CSS, shadcn/ui, lint/format/test/build tooling.
- Establish original HireTrack visual identity, fonts/tokens, responsive shell primitives, dark-mode bootstrap, focus/motion defaults, command palette, shortcut registry, and cheat-sheet dialog.
- Add repository governance files, MIT license, docs skeleton, API-contract table, dated/sourced competitive analysis, environment validation shell, base metadata, favicon/OG placeholder, 404, robots/sitemap, and statically generated docs/FAQ routes with validated breadcrumb/FAQ structured data.
- Add CI foundation and smoke/unit tests for environment and base UI.
- Keep all pages runnable using non-domain placeholder/empty states only.

### Milestone 2 — Data model, migrations, and seed

- Add Prisma/PostgreSQL schema (including Auth.js provider accounts), enums, constraints, relations, indexes, partial unique migration SQL, client singleton, test database setup, and factories.
- Add deterministic idempotent seed organization, verified demo admin, recruiter/viewer fixtures, jobs/candidates/applications/interviews/activity suitable for a demo.
- Test schema constraints, tenant uniqueness, and seed idempotency.
- Document data decisions in `docs/decisions.md` and setup commands.

### Milestone 3 — Authentication and security baseline

- Implement Auth.js credentials flow plus configuration-gated Google/GitHub OAuth, safe account collision/linking policy, OAuth organization onboarding, signup/org transaction, verification, login/logout, forgot/reset password, secure organization invitation/acceptance, secure token handling, privilege-change session invalidation/rotation, protected layouts, mail adapter, and distributed IP+account rate limiting (five attempts/15 minutes, exponential backoff, `Retry-After`).
- Add centralized session/membership resolver, authorization policy, origin checks, security headers/CSP, safe error/logging helpers.
- Add authentication and invitation validation/integration tests and full RBAC matrix tests.
- Document demo credentials and all auth/security environment variables.

### Milestone 4 — Jobs vertical slice

- Implement job list/detail/create/edit/archive/restore with React Hook Form, shared Zod validation, URL filters/search/sort/keyset cursors, `j`/`k` and `/` shortcuts, row/all-matching selection, confirmed/capped bulk actions, server authorization, activity logging, and CSV/PDF export.
- Add loading skeletons, empty/error/success states, responsive views, viewer read-only behavior, and metadata.
- Add job CRUD, tenant isolation, cursor traversal, cross-page bulk selection, both export formats, shortcut, and accessibility tests.

### Milestone 5 — Candidates, resumes, and notes

- Implement candidate list/detail/create/edit/archive/restore, normalized duplicate enforcement, filters/search/sort/keyset cursors, `j`/`k` and `/` shortcuts, row/all-matching selection, confirmed/capped bulk archive/restore, and skills/experience fields.
- Implement private PDF/DOCX resume upload/download/replace and cleanup with type/size validation.
- Implement candidate notes and ownership-aware deletion.
- Implement filtered candidate CSV/PDF export with table parity.
- Add candidate CRUD, duplicate, upload, notes, cursor/bulk behavior, both export formats, authorization, shortcut, and accessibility tests.

### Milestone 6 — Applications and Kanban pipeline

- Implement application creation/archive and job-filtered pipeline.
- Implement optimistic drag-and-drop plus accessible move controls, concurrency protection, rollback, live announcements, and transactional stage activity logs.
- Add required stage update integration test and component tests for optimistic success/failure and keyboard workflow.

### Milestone 7 — Interviews

- Implement interview schedule/list/edit/complete/cancel workflows, interviewer assignment, UTC/time-zone handling, meeting URL, feedback, and rating.
- Surface interviews on dashboard and candidate/application detail.
- Add validation, authorization, state-transition, date/time, responsive, and accessibility tests.

### Milestone 8 — Dashboard, analytics, audit, and members

- Replace all dashboard placeholders with real aggregate queries and recent activity.
- Add Recharts visualizations with accessible text/table alternatives for stage distribution, applications by job, hires over time, and interview completion.
- Implement admin member role/deactivation UI with last-admin protection and audit log explorer.
- Add aggregation correctness, zero-data, member concurrency, and audit authorization tests.

### Milestone 9 — End-to-end hardening and delivery

- Implement/finish required Playwright critical workflow plus authentication/OAuth configuration, viewer, cursor/bulk, responsive, and CSV/PDF export smoke coverage.
- Complete accessibility, keyboard, mobile, dark mode, reduced motion, error/empty/loading, security, privacy, and performance review.
- Finalize README, contributing guide, changelog, API table, architecture/decision docs, issue/PR templates, 3–5 real screenshots, competitive analysis, portfolio pitch, case study, demo video, roadmap, trial credit, demo credentials, and deployment instructions.
- Run the complete CI-equivalent suite, production build, and Lighthouse CI gates; inspect dependency/migration output and final diff.
- With user-authorized repository/provider access, publish the repository and production deployment, smoke-test every public evidence link, push the tagged release, and hand off the live URL/repository/tag. Missing authority blocks final acceptance and is surfaced explicitly; a deployment-ready handoff alone is not the PDF-required final delivery.

## 15. Explicit assumptions and open questions

### Assumptions proposed for approval

1. **One selected organization per session in v1.** The schema and invitation flow support multiple memberships. The authenticated session stores a selected organization ID only as a hint and validates it against live membership; invitation acceptance can select the invited organization. A general workspace switcher is deferred.
2. **Signup creates an organization.** The first user becomes its verified-pending `ADMIN`; verification is required before any recruiting write.
3. **Member invitations are included.** Admins can invite recruiter/viewer roles; invitees must prove control of the invited email. Admin promotion happens only after membership creation and is protected by current-admin authorization.
4. **Viewer resume access is allowed, export is not.** Viewing a resume is part of candidate read access; bulk extraction is restricted to admin/recruiter.
5. **Private storage uses Vercel Blob.** Resume bytes never live in PostgreSQL or the public directory. The implementation uses an adapter to ease provider changes.
6. **Email uses Resend.** Verification/reset emails use a provider adapter and safe development capture/logging that never prints raw production tokens.
7. **Rate limiting uses Upstash Redis in deployed environments.** Tests use an injected deterministic adapter; production does not rely on process memory.
8. **Credentials and configured OAuth sessions use Auth.js encrypted JWT cookies.** Google/GitHub controls appear only with complete provider configuration. Role and organization are never trusted from the token; they are loaded from the database on protected operations. Session version provides immediate revocation, including privilege changes.
9. **Passwords use Argon2id.** Minimum 12 characters and maximum byte length are enforced; no arbitrary composition rule is added.
10. **Candidate emails are required.** Duplicate prevention is based on normalized email within an organization.
11. **Resume limit is 5 MiB, PDF/DOCX only.** Legacy `.doc`, images, and external resume URLs are out of scope.
12. **Notes and audit logs are internal.** Candidate-facing access is not provided.
13. **Job/candidate/application “delete” is archival.** Notes use soft deletion; interviews use cancellation; historical activity is immutable.
14. **Analytics use applications as the pipeline unit.** “Candidates by stage” counts active applications, so a candidate applying to two jobs can appear twice; the UI labels this definition clearly.
15. **Final delivery requires a public repository and production deployment on Vercel plus managed services.** Publishing requires repository/provider credentials and user authorization; missing authority blocks completion, and no live URL will be fabricated.
16. **The product UI is English-only in v1.** Dates/times use locale-aware formatting, and all stored timestamps are UTC.
17. **Current stable compatible package versions will be pinned at implementation time.** Exact versions will be selected after checking official compatibility among Next.js, Auth.js, Prisma, Tailwind, Vitest, and React.
18. **The product brief's roles are authoritative.** HireTrack uses `ADMIN`, `RECRUITER`, and `VIEWER`; this product-specific mapping supersedes any generic role labels or examples in the trial PDF while preserving its RBAC expectations.
19. **Mutable tables use keyset pagination.** “Pagination” elsewhere in this plan means opaque cursor-based forward/backward traversal, not offset/page-number queries.

### Open questions (defaults above allow implementation after approval)

- Should viewers be permitted to download individual resumes, given the sensitivity of candidate data?
- Are Vercel Blob, Resend, Neon, and Upstash acceptable managed providers, or are provider accounts already chosen?
- Is 5 MiB sufficient for resumes, and should PDF-only be preferred over PDF/DOCX?
- Should “candidates by stage” deduplicate people across jobs, or count applications as proposed?
- What production app/domain name should replace the live demo and canonical URL placeholders?
- Which user-authorized public GitHub organization/account and Vercel team/project should receive the mandatory final repository and deployment?

Unless feedback changes them, `APPROVE PLAN` approves the stated assumptions and starts Milestone 1 only.
