# HireTrack Lite Architecture Decision Log

Status: Accepted for the v1 implementation plan; each decision is verified in the milestone that introduces it.

Last updated: 2026-07-14

This log records decisions that are easy to lose in code review but materially affect security, data integrity, operations, or product behavior. The system context and diagrams are in [architecture.md](architecture.md); the release contract is in [../plan.md](../plan.md).

Milestone 1 uses a static baseline CSP that limits production connections to the same origin. Next.js bootstrap and pre-paint theme scripts still require inline-script allowance on these statically rendered routes; Milestone 3 will move protected dynamic routes to a per-request nonce policy and explicit provider origins. Production HSTS intentionally omits `includeSubDomains` and `preload` until the final owned domain and HTTPS coverage are verified.

## Decision index

| ID      | Decision                                                             | Status   |
| ------- | -------------------------------------------------------------------- | -------- |
| ADR-001 | Auth.js encrypted JWT sessions with live database checks             | Accepted |
| ADR-002 | One selected organization per session over a multi-membership schema | Accepted |
| ADR-003 | Soft deletion with PostgreSQL partial unique indexes                 | Accepted |
| ADR-004 | Server Actions for domain mutations and Route Handlers for streams   | Accepted |
| ADR-005 | Private object storage for resumes with compensating cleanup         | Accepted |
| ADR-006 | URL-owned list state with indexed keyset/cursor pagination           | Accepted |
| ADR-007 | Applications are the pipeline analytics unit                         | Accepted |
| ADR-008 | Provider-neutral adapters around managed infrastructure              | Accepted |
| ADR-009 | All-matching bulk selection is rebuilt and authorized on the server  | Accepted |
| ADR-010 | Static structured docs and Lighthouse-gated public delivery evidence | Accepted |
| ADR-011 | Prisma 7 data foundation with tenant-consistent foreign keys         | Accepted |

## ADR-001: Auth.js encrypted JWT sessions with live database checks

### Context

HireTrack Lite needs credentials authentication, optional Google/GitHub sign-in, immediate revocation after security events, and organization roles that may change while a browser session remains valid. Putting role or organization authority only in a long-lived cookie would make demotion, deactivation, and membership changes stale. Automatically linking an OAuth identity by an asserted email would create an account-takeover risk when provider evidence is incomplete.

### Decision

Auth.js owns credentials sign-in, configured Google/GitHub providers, and an encrypted, signed, `httpOnly` session cookie. A provider appears only when its client ID and secret are both configured; callbacks require a verified provider email and do not silently link an existing credentials identity. The token contains only the minimum identity and session-version hints; it does not establish a role. Every protected server entry point loads the user, validates `sessionVersion` and account status, then loads the selected active membership from PostgreSQL. Password reset, privilege changes, and other global revocation events increment `sessionVersion`.

### Consequences

- Sensitive authorization changes take effect on the next protected request.
- A database read is required for protected access, trading a small latency cost for current authorization state.
- Next.js Proxy may improve navigation behavior but cannot be the security boundary; each query, action, and handler enforces access again.
- Session payloads stay small and do not expose membership detail to the browser.
- OAuth is optional by deployment configuration; credentials sign-in remains available without third-party keys.
- Explicit provider-linking and onboarding cases require dedicated integration and callback tests.

## ADR-002: One selected organization per session over a multi-membership schema

### Context

The initial product is optimized for a small team operating in one workspace. Invitations may still make one user a member of more than one organization, and baking a single organization directly into the user record would prevent a safe future workspace switcher.

### Decision

Users and organizations have a many-to-many relationship through membership records. The v1 interface works in one selected organization at a time. Any organization ID carried by the session is only a hint and must resolve to a current active membership before use. Invitation acceptance may select the invited organization; a general workspace switcher is deferred.

### Consequences

- The common v1 experience remains simple while the data model can support later switching.
- Every organization-owned record carries `organizationId`, and every protected query uses the trusted membership value rather than browser input.
- Cross-organization reads and writes use non-disclosing not-found or forbidden responses.
- Selection behavior needs explicit testing when invitation acceptance is added.

## ADR-003: Soft deletion with PostgreSQL partial unique indexes

### Context

Recruiting history, attribution, and audit records must survive an accidental archive. At the same time, archived candidates and applications should not block a legitimate new active record forever. Application-level duplicate checks alone do not protect concurrent requests.

### Decision

Jobs, candidates, applications, memberships, and notes use lifecycle fields such as `deletedAt` or `deactivatedAt` instead of ordinary product hard deletion. PostgreSQL partial unique indexes enforce active-only invariants, including candidate email uniqueness within an organization, one active application for a candidate/job pair, one pending invitation per organization/email, and one active verification/reset token per user. Product reads exclude archived rows by default, while explicit restore paths detect conflicts. Token issuance invalidates the previous unused token transactionally because expiration cannot safely be encoded with `now()` in a partial-index predicate.

### Consequences

- Historical relations and audit context remain intact and recovery is possible.
- Raw migration SQL for partial indexes must be reviewed and committed because Prisma schema syntax cannot express every PostgreSQL condition.
- All query services need consistent active-row predicates; accidental omission is a review and test concern.
- Exceptional tenant purge remains an operator-controlled action, not a v1 user interface feature.

## ADR-004: Server Actions for domain mutations and Route Handlers for streams

### Context

Most changes originate in forms or focused UI interactions and benefit from typed, colocated mutation entry points. Authentication callbacks, file transfers, and CSV/PDF exports require HTTP semantics or streaming that do not fit normal action responses.

### Decision

Thin Server Actions handle ordinary domain mutations such as jobs, candidates, application stages, interviews, notes, members, and profile preferences. Route Handlers own Auth.js, resume upload/download, and streamed exports. Both delegate validation, authorization, data access, and transactional behavior to shared server-only services.

### Consequences

- Framework entry points remain small and domain behavior can be integration tested directly.
- Actions can return discriminated, form-friendly results and revalidate narrowly.
- Route Handlers must explicitly enforce content type, allowed origin, authorization, and safe response headers where applicable.
- Logic shared by an action and an HTTP route belongs in a service, not duplicated entry-point code.

## ADR-005: Private object storage for resumes with compensating cleanup

### Context

Resumes contain personal data, may exceed practical database row sizes, and must never be exposed through a public static directory. Object storage operations cannot participate in the same transaction as PostgreSQL metadata updates.

### Decision

Validated PDF and DOCX bytes up to 5 MiB are stored in private Vercel Blob through a storage adapter. PostgreSQL stores only randomized storage keys and verified metadata. Downloads are authorized server-side and then streamed or represented by a short-lived signed URL. An upload is removed if the database update fails; replaced or orphaned objects enter retryable cleanup when immediate deletion fails.

### Consequences

- Database backups do not contain resume bytes, so storage retention and backup policy must be managed separately.
- The system needs structured, privacy-safe logging and retry behavior for cleanup failures.
- File extension, declared MIME, detected type, size, and authorization are all server-side checks.
- The adapter makes a later provider change possible without changing candidate domain services.

## ADR-006: URL-owned list state with indexed keyset/cursor pagination

### Context

Jobs and candidates can grow beyond a safe browser-side array. Recruiters also expect filters to survive refresh, be shareable, and behave correctly with browser back/forward navigation. Offset pages drift when records are inserted, archived, or reordered and degrade on large offsets.

### Decision

Search text, allow-listed filters, sort key, direction, one opaque `after` or `before` cursor, and `limit` live in URL search parameters. Inputs update them after a short debounce and reset the cursor whenever the query shape changes. Server query services validate and version the cursor, bind it to the normalized query, and perform indexed keyset traversal over the selected sort tuple plus `id`. Lists fetch `limit + 1`, use a default limit of 25 and a hard maximum of 100, and return opaque next/previous cursors. Search, selection, counting, and CSV/PDF export share the same organization-scoped predicate and ordering.

### Consequences

- List views are bookmarkable and render correctly on first server response.
- Invalid, malformed, tampered, or query-incompatible cursors are rejected instead of reaching the ORM unchecked.
- The UI must distinguish no data from no filter matches and provide a reset path.
- Forward/backward traversal avoids offset drift for unchanged records and stays index-friendly at larger data volumes.
- Arbitrary page-number jumps are intentionally unavailable; navigation uses next/previous cursors and query resets.

## ADR-007: Applications are the pipeline analytics unit

### Context

A candidate may apply for more than one job and be at a different stage in each process. A single candidate-level stage would lose that distinction and make job-specific pipeline reporting ambiguous.

### Decision

Pipeline columns and stage analytics count active applications, not deduplicated people. Hires are derived from application stage and `hiredAt`; moving away from `HIRED` clears that timestamp. User-facing chart labels and help text state the definition.

### Consequences

- One person can appear more than once in an organization-wide stage count when applying to multiple jobs.
- Job-specific pipeline data remains correct and application history is explicit.
- Analytics tests must cover multi-job candidates, archived records, and stage reversals.
- A future unique-candidate metric must use a separate, clearly named aggregation rather than silently changing this definition.

## ADR-008: Provider-neutral adapters around managed infrastructure

### Context

Vercel Blob, Resend, and Upstash Redis fit the deployment target, but domain code should not depend directly on vendor response shapes. Automated tests also need deterministic behavior without network calls or production credentials.

### Decision

Storage, mail, and rate limiting are represented by small server-only interfaces. Production uses Vercel Blob, Resend, and Upstash implementations; tests use deterministic in-process fakes. Provider clients are created only in the infrastructure layer, and secrets remain server-only environment variables.

### Consequences

- Domain services can be tested without external network access.
- Provider failures map to consistent application errors and privacy-safe logs.
- Adapters add a small amount of code but limit vendor lock-in and simplify local development.
- Production-like integration smoke tests are still required because fakes cannot prove provider configuration.

## ADR-009: All-matching bulk selection is rebuilt and authorized on the server

### Context

The trial requires bulk actions and selection across paginated results. Sending every matching ID to the browser is inefficient and stale, while trusting a browser-provided count, filter, role, or organization would make a bulk endpoint an authorization bypass.

### Decision

Job and candidate tables expose two explicit selection modes: a bounded set of IDs from loaded cursor windows, or all records matching a normalized filter with explicit exclusions. Before mutation, the UI shows the action, estimated matching count, and exclusions in a confirmation dialog. The server reparses the selection descriptor, rebuilds the current organization-scoped predicate, rechecks role and record state, applies an operation-specific cap, processes bounded transactions, and returns affected/skipped counts. Each changed record receives the required audit event; client-provided counts are informational only.

### Consequences

- “Select all matching” can span cursor windows without transferring every identifier to the browser.
- Concurrent data changes may produce skipped records, so results and user copy must report affected and skipped counts honestly.
- Bulk actions need the same tenant, role, validation, lifecycle, and audit guarantees as their single-record equivalents.
- Viewer attempts, tampered filters, oversized selections, and exclusion edge cases require integration and end-to-end tests.

## ADR-010: Static structured docs and Lighthouse-gated public delivery evidence

### Context

The trial evaluates discoverability, documentation, performance, and portfolio evidence—not only authenticated product behavior. Client-only documentation, structured data that differs from visible copy, placeholder screenshots, or a fabricated live URL would fail that standard.

### Decision

Public `/docs`, predeclared `/docs/[slug]`, and `/faq` routes are statically generated, linked through crawlable navigation, and included in the sitemap. Documentation/FAQ breadcrumbs produce matching `BreadcrumbList` JSON-LD; the FAQ's single content source produces both visible answers and `FAQPage` JSON-LD. The landing page emits `SoftwareApplication` data without invented reviews. Lighthouse CI gates the production build at mobile Performance 90, Accessibility 95, Best Practices 95, and SEO 95 for the public surfaces and a representative seeded app route.

Final acceptance additionally requires a user-authorized public repository and deployment, demo access, real screenshots, case study, demo video, changelog entry, and pushed semantic tag. Missing provider or repository authority is reported as a blocker; placeholders remain visibly labeled during development.

### Consequences

- Documentation content must remain compatible with static generation and metadata validation.
- Structured data is derived from visible content to prevent drift and misleading search output.
- Lighthouse is a measured release gate rather than an unverified README badge or claim.
- Public evidence artifacts are versioned or linked from the repository and must be smoke-tested before release.

## ADR-011: Prisma 7 data foundation with tenant-consistent foreign keys

### Context

An `organizationId` column is useful for query scoping but does not, by itself, prevent an application from referencing a job, candidate, or member belonging to another tenant. The first migration also needs to remain compatible with the future Auth.js Prisma adapter and with pooled serverless PostgreSQL connections without making static builds depend on a live database.

### Decision

Milestone 2 pins Prisma ORM 7.8 and `@prisma/adapter-pg`. Prisma commands load `.env.local` and then `.env` without overriding shell values; the CLI reads the direct migration connection from `DIRECT_URL`, while the lazy runtime client validates only pooled `DATABASE_URL` when a data path requests it. Migration and seed-only values are parsed by separate contracts and are not required by application runtime code. When neither database variable exists, the config uses an intentionally unreachable generate-only URL so dependency installation can generate the client without risking an accidental local migration. Generated client code is recreated during installation and is not committed.

Organization-owned attribution and domain relations use composite foreign keys such as `(organizationId, membershipId)` and `(organizationId, jobId)`, backed by composite unique targets. Activity attribution uses PostgreSQL's column-specific `ON DELETE SET NULL (actor_membership_id)` action so an exceptional membership purge preserves the tenant and audit event. The Prisma schema records the `SetNull` semantic but cannot express the narrowed column list, so validation emits the documented required-field warning and the reviewed SQL migration is authoritative. Named PostgreSQL checks enforce versions, normalized identities, lifecycle timestamps, interview ranges/ratings, resume metadata coherence and size, token hashes, note deletion state, and object-shaped audit summaries. Prisma model `Account` and `User.emailVerified` retain standard Auth.js adapter-facing names while physical tables and columns use explicit mappings. JWT sessions intentionally do not add a database session table.

### Consequences

- Cross-tenant inserts fail at PostgreSQL even if an application bug omits a relationship check; protected reads must still include the trusted organization predicate.
- Schema checks and partial indexes live in reviewed migration SQL and require real-PostgreSQL integration tests because mocks and SQLite cannot prove them.
- `version` fields provide atomic optimistic-concurrency tokens independently of client-managed `updatedAt` timestamps.
- The idempotent seed hashes its configured admin password with the approved Argon2id policy, upgrades legacy/weak hashes, and never logs it. Only disposable plaintext values exist in tests/CI; recruiter/viewer fixtures are verified but passwordless until an explicit authentication flow owns them.
- Ordinary product deletion remains archival/deactivation. Cascading organization/user foreign keys exist only for an exceptional operator-controlled purge and are never exposed as a v1 mutation.

## Changing a decision

A pull request that reverses or materially changes an accepted decision must update this file, describe migration and rollback impact, and identify affected security and data-isolation tests. Superseded entries remain in the log with a link to the replacement so the repository preserves the reasoning history.
