# HireTrack Lite Architecture

Status: **Approved target architecture; implemented incrementally by milestone**

Last updated: 2026-07-13

## Architectural overview

This document is the normative v1 target, not a claim that every boundary already ships. Milestone 1 implements the runnable public foundation, responsive shell, and documentation surfaces; later gated milestones add persistence, authentication, recruiting workflows, exports, and deployment evidence.

The approved release architecture targets a tenant-isolated Next.js application on Vercel. React Server Components will perform authorized reads close to PostgreSQL; focused client components will handle forms, charts, dialogs, commands, cross-cursor selection, and optimistic Kanban interaction. Server Actions will cover ordinary typed and confirmed bulk mutations. Route Handlers will own Auth.js, private file streams, and CSV/PDF downloads. Public documentation and FAQ routes are already statically generated for crawlability and emit visible-content-matched structured data.

PostgreSQL will be the source of truth for recruiting and authorization data. Every protected operation will resolve the authenticated user and load the active organization membership from PostgreSQL. Client-supplied roles, actor IDs, and organization IDs will be ignored. Private object storage will hold resume bytes, while PostgreSQL will store only validated metadata and a private storage key.

## Application architecture diagram

```mermaid
flowchart TB
    User[Recruiter / Admin / Viewer]
    Browser[Browser\nServer-rendered pages + client interaction islands]

    subgraph Vercel[Next.js application on Vercel]
        Edge[Next.js Proxy and security headers\ncoarse route/session check]
        Public[Static marketing, docs, and FAQ\nmetadata + JSON-LD]
        RSC[App Router layouts and React Server Components\nauthorized reads]
        UI[Client components\nforms, command palette, selection, optimistic Kanban]
        Actions[Server Actions\ntyped single/bulk domain mutations]
        Routes[Route Handlers\nAuth.js, resumes, CSV/PDF exports]
        Auth[Auth.js credentials + configured OAuth\nsecure cookie, user/session-version validation]
        Policy[Authorization policy\nverified user + active membership + role]
        Services[Domain services\nvalidation, transactions, audit logging]
        Queries[Organization-scoped query services\nsearch, filters, stable sort, keyset cursors, analytics]
        Prisma[Prisma ORM]
    end

    DB[(Managed PostgreSQL\nsource of truth)]
    Blob[(Private Vercel Blob\nresume objects)]
    Redis[(Upstash Redis\ndistributed rate limits)]
    Email[Resend\nverification/reset email]
    OAuth[Google / GitHub\noptional configured providers]

    User --> Browser
    Browser --> Edge
    Edge --> Public
    Public --> Browser
    Edge --> RSC
    RSC --> Browser
    Browser <--> UI
    UI --> Actions
    Browser --> Routes

    RSC --> Auth
    Actions --> Auth
    Routes --> Auth
    Auth --> Policy
    Auth --> Prisma
    Policy --> Prisma

    RSC --> Queries
    Actions --> Services
    Routes --> Services
    Queries --> Prisma
    Services --> Prisma
    Prisma --> DB

    Routes --> Blob
    Routes --> Redis
    Auth --> Redis
    Auth <--> OAuth
    Services --> Email
```

The future Next.js Proxy check will be deliberately coarse and exist for navigation behavior only. It will not be an authorization boundary. Server queries, actions, and handlers will independently enforce authentication, active membership, verified-email requirements, role permissions, and row ownership.

Authorization terminology follows the product brief: `ADMIN`, `RECRUITER`, and `VIEWER` are the persisted roles. This product-specific mapping supersedes generic role labels in the trial PDF without weakening its RBAC requirements.

## Entity relationship diagram

```mermaid
erDiagram
    ORGANIZATION {
        uuid id PK
        string name
        string slug UK
        datetime createdAt
        datetime updatedAt
    }

    USER {
        uuid id PK
        string name
        string email
        string emailNormalized UK
        string passwordHash "nullable for OAuth-only users"
        datetime emailVerifiedAt
        int sessionVersion
        datetime disabledAt
        datetime createdAt
        datetime updatedAt
    }

    AUTH_ACCOUNT {
        uuid id PK
        uuid userId FK
        string type
        string provider
        string providerAccountId
        datetime createdAt
        datetime updatedAt
    }

    MEMBERSHIP {
        uuid id PK
        uuid organizationId FK
        uuid userId FK
        Role role
        datetime deactivatedAt
        datetime createdAt
        datetime updatedAt
    }

    JOB {
        uuid id PK
        uuid organizationId FK
        uuid createdByMembershipId FK
        string title
        string department
        string location
        EmploymentType employmentType
        text description
        text requirements
        JobStatus status
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    CANDIDATE {
        uuid id PK
        uuid organizationId FK
        uuid createdByMembershipId FK
        string firstName
        string lastName
        string email
        string emailNormalized
        string phone
        string location
        string_array skills
        decimal experienceYears
        string resumeStorageKey
        string resumeFileName
        string resumeMimeType
        int resumeSizeBytes
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    APPLICATION {
        uuid id PK
        uuid organizationId FK
        uuid jobId FK
        uuid candidateId FK
        uuid createdByMembershipId FK
        ApplicationStage stage
        string source
        datetime hiredAt
        datetime rejectedAt
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    INTERVIEW {
        uuid id PK
        uuid organizationId FK
        uuid applicationId FK
        uuid interviewerMembershipId FK
        uuid createdByMembershipId FK
        InterviewType type
        datetime startsAt
        datetime endsAt
        string timeZone
        string meetingUrl
        InterviewStatus status
        text feedback
        int rating
        datetime createdAt
        datetime updatedAt
    }

    CANDIDATE_NOTE {
        uuid id PK
        uuid organizationId FK
        uuid candidateId FK
        uuid authorMembershipId FK
        uuid deletedByMembershipId FK
        text body
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid organizationId FK
        uuid actorMembershipId FK
        EntityType entityType
        uuid entityId
        AuditAction action
        json changes
        datetime createdAt
        datetime updatedAt
    }

    EMAIL_VERIFICATION_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
        datetime updatedAt
    }

    PASSWORD_RESET_TOKEN {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
        datetime updatedAt
    }

    ORGANIZATION_INVITATION {
        uuid id PK
        uuid organizationId FK
        uuid invitedByMembershipId FK
        string email
        string emailNormalized
        Role role
        string tokenHash UK
        datetime expiresAt
        datetime acceptedAt
        datetime revokedAt
        datetime createdAt
        datetime updatedAt
    }

    ORGANIZATION ||--o{ MEMBERSHIP : has
    USER ||--o{ MEMBERSHIP : joins
    USER ||--o{ AUTH_ACCOUNT : authenticates_with
    ORGANIZATION ||--o{ JOB : owns
    ORGANIZATION ||--o{ CANDIDATE : owns
    ORGANIZATION ||--o{ APPLICATION : scopes
    ORGANIZATION ||--o{ INTERVIEW : scopes
    ORGANIZATION ||--o{ CANDIDATE_NOTE : scopes
    ORGANIZATION ||--o{ ACTIVITY_LOG : records
    ORGANIZATION ||--o{ ORGANIZATION_INVITATION : issues

    MEMBERSHIP ||--o{ JOB : creates
    MEMBERSHIP ||--o{ CANDIDATE : creates
    MEMBERSHIP ||--o{ APPLICATION : creates
    MEMBERSHIP ||--o{ INTERVIEW : creates
    MEMBERSHIP ||--o{ INTERVIEW : conducts
    MEMBERSHIP ||--o{ CANDIDATE_NOTE : authors
    MEMBERSHIP o|--o{ CANDIDATE_NOTE : deletes
    MEMBERSHIP o|--o{ ACTIVITY_LOG : acts_in
    MEMBERSHIP ||--o{ ORGANIZATION_INVITATION : invites

    JOB ||--o{ APPLICATION : receives
    CANDIDATE ||--o{ APPLICATION : submits
    APPLICATION ||--o{ INTERVIEW : schedules
    CANDIDATE ||--o{ CANDIDATE_NOTE : has

    USER ||--o{ EMAIL_VERIFICATION_TOKEN : verifies_with
    USER ||--o{ PASSWORD_RESET_TOKEN : resets_with
```

## Data isolation and authorization flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Entry as Server Action / Query / Route Handler
    participant Session as Auth.js session resolver
    participant Policy as Authorization policy
    participant DB as PostgreSQL via Prisma

    Client->>Entry: Untrusted input + secure session cookie
    Entry->>Entry: Parse input with Zod
    Entry->>Session: Resolve authenticated user
    Session->>DB: Load user and check sessionVersion/disabledAt
    DB-->>Session: Current user state
    Session->>DB: Load active membership
    DB-->>Session: organizationId + current role
    Session-->>Entry: Trusted access context
    Entry->>Policy: Check verified email + required permission
    Policy-->>Entry: Allow or typed denial
    Entry->>DB: Query/mutate using id AND organizationId
    Note over Entry,DB: Domain mutation and ActivityLog share a transaction
    DB-->>Entry: Canonical record / not found / conflict
    Entry-->>Client: Safe discriminated result
```

For a viewer read, the verified-email write gate is not required, but the authenticated active membership and organization predicate remain mandatory. Cross-organization and missing resources use the same outward result where disclosing existence would be unsafe.

Auth.js always exposes credentials sign-in and registers Google/GitHub only when each provider's complete server-only configuration exists. OAuth callbacks require a provider-verified email; first-time OAuth users complete organization onboarding or a matching invitation. A provider email collision does not silently link an existing identity. Credentials/reset attempts are limited independently by privacy-safe IP and normalized-account keys to five attempts per 15 minutes, then exponential backoff applies with an accurate `Retry-After`; missing-account responses retain the same shape and approximate timing. Role changes and membership deactivation increment the affected user's `sessionVersion`, while live membership lookup makes the privilege change effective even before the stale cookie is rejected.

## Optimistic pipeline update

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter
    participant Board as Kanban client component
    participant Action as updateApplicationStage
    participant Policy as Auth + RBAC
    participant DB as PostgreSQL transaction

    Recruiter->>Board: Move application to INTERVIEW
    Board->>Board: Save prior state and render optimistic move
    Board->>Action: applicationId, targetStage, expectedUpdatedAt
    Action->>Policy: Resolve membership and require recruiting write
    Policy-->>Action: Trusted organization context
    Action->>DB: Update where id + organizationId + expectedUpdatedAt
    alt Current record and allowed update
        DB->>DB: Update stage/timestamps + insert ActivityLog
        DB-->>Action: Canonical updated application
        Action-->>Board: Success + updated record
        Board->>Board: Reconcile and announce success
    else Stale, forbidden, deleted, or database failure
        DB-->>Action: Conflict / denial / failure
        Action-->>Board: Safe actionable error
        Board->>Board: Restore prior state and announce rollback
    end
```

## Trust boundaries and security decisions

- **Browser:** entirely untrusted. It may suggest IDs, stages, filters, and optimistic versions but cannot establish role, tenant, actor, or verification state.
- **Next.js server:** application trust boundary. It validates input, resolves identity, enforces policy, scopes rows, redacts errors, and coordinates transactions.
- **PostgreSQL:** authoritative domain and membership state. Composite/partial unique constraints defend invariants against concurrent requests.
- **Private blob storage:** accepts server-authorized operations only. Random keys prevent meaningful enumeration; authorization is still required for retrieval.
- **Email provider:** receives only the destination and purpose-built link/template data. Raw tokens are never written to application logs.
- **OAuth providers:** untrusted external identity assertions are accepted only through Auth.js callback/state validation and only with a provider-verified email. Provider credentials/tokens remain server-side, and email equality alone never grants account linking.
- **Redis:** stores short-lived rate-limit counters with privacy-conscious keys, not business records.

The main defense-in-depth invariant is that a protected resource is never fetched by record ID alone. Its query includes trusted `organizationId`, active/deleted conditions, and any domain constraint required by the operation.

## Rendering and state strategy

- Server Components load authenticated list/detail/dashboard data and minimize browser bundles.
- URL search parameters are the canonical list state for query, filters, sort, one opaque `after`/`before` cursor, and `limit`; any query-shaping change resets the cursor.
- Interactive filters update the URL after a debounce; navigation causes a fresh organization-scoped server read.
- Mutable table reads use indexed keyset predicates over the selected stable sort tuple plus `id`, fetch `limit + 1`, and return next/previous cursors. Cursor payloads are versioned and tied to the normalized query so malformed, tampered, or stale-query cursors fail validation instead of falling back to offset pagination.
- Table selection has two explicit modes: selected IDs in the loaded cursor window, or all records matching the normalized filter with explicit exclusions. Confirmed bulk mutations rebuild and tenant-scope that predicate on the server, recheck role/state, enforce a cap, process bounded transactions, and return affected/skipped counts; a client-provided count is never authoritative.
- React Hook Form and shared Zod schemas manage complex forms. Server validation remains authoritative.
- Client state is limited to ephemeral interaction state: open dialogs, pending forms, current selection descriptors, command-palette/shortcut focus, local drag state, optimistic pipeline snapshots, and chart presentation.
- The Milestone 1 shortcut registry scopes `Ctrl/Cmd+K`, `G` route sequences, `/`, and `?` to eligible surfaces and suppresses them in editable controls or IME composition. List-specific `j`/`k` behavior will be introduced and advertised only with the corresponding list milestone. The cheat sheet is rendered with an accessible dialog and focus restoration.
- No business record uses `localStorage` as its database. Theme preference is UI-only state applied by the pre-hydration theme script so system or saved mode renders without a visible flash.
- Route-level Suspense/loading files use layout-matching skeletons. Error boundaries give a retry path; mutations return focused field/global errors and success feedback.

## Public content, exports, and release evidence

- `/docs`, predeclared `/docs/[slug]` routes, and `/faq` are statically generated, linked from crawlable navigation, and included in `sitemap.xml`. Docs/FAQ pages emit `BreadcrumbList` JSON-LD, and FAQ emits `FAQPage` JSON-LD generated from the exact visible question/answer source. The landing page retains `SoftwareApplication` JSON-LD.
- Candidate/job export handlers share the normalized authorization/filter/sort projection used by their table queries. CSV is streamed with formula neutralization; PDF is generated server-side with repeated headers, wrapping, page breaks, and the same visible-column order. Both formats are rate limited and capped.
- Repository evidence is versioned with the code: API/Server Action contract table, sourced competitive analysis, case study, portfolio pitch, demo-video link, and 3–5 real screenshots. Final release requires a public repository, public production URL, demo path/credentials, changelog entry, and pushed semantic tag; missing user-authorized provider access is a blocker, not permission to invent evidence.

## Transactions and consistency

- Registration transaction: user + organization + admin membership + verification token metadata.
- Stage-change transaction: concurrency-checked application update + stage timestamps + activity event.
- Password-reset transaction: consume token + update password hash + increment session version + invalidate remaining reset tokens.
- Invitation-acceptance transaction: consume matching, unexpired invitation + create/reactivate unique membership + append activity event.
- Member-role transaction: lock/check current admins + update role/status + increment the affected user's `sessionVersion` + activity event.
- Confirmed bulk transaction: rebuild authorized filter/ID selection + enforce cap/state + update a bounded batch + write per-record activity events carrying a shared batch ID; return explicit skipped/conflict counts rather than widening scope.
- Domain mutations generally update the record and append the audit event atomically.
- Upload bytes cannot share a database transaction. The flow uploads a private object, commits metadata, and deletes the object on database failure. Replaced/orphaned object cleanup is retried and logged.

## Database constraints and deletion behavior

- Active candidate uniqueness uses a PostgreSQL partial unique index on `(organizationId, emailNormalized)` where `deletedAt IS NULL`.
- Active application uniqueness uses a partial unique index on `(jobId, candidateId)` where `deletedAt IS NULL`.
- Auth provider identities use a unique `(provider, providerAccountId)` constraint and indexed `userId`; account linking is an explicit authenticated flow rather than an email-only upsert.
- Foreign-key indexes are explicit where PostgreSQL does not create them automatically.
- Recruiting entities use soft deletion when history/recovery is valuable. Product code does not hard-delete organizations, users, jobs, candidates, applications, memberships, or activity logs.
- Interview cancellation and note soft deletion preserve auditability.
- Exceptional operator-controlled tenant purge may cascade organization data; audit actor references may become null where required. That operation is not exposed in v1.

## Deployment topology

```mermaid
flowchart LR
    GitHub[Public GitHub repository]
    CI[GitHub Actions\nlint, typecheck, tests, build, E2E, Lighthouse]
    Preview[Vercel preview]
    Production[Vercel production]
    PreviewDB[(Preview PostgreSQL)]
    ProdDB[(Production PostgreSQL + backups)]
    PreviewServices[Preview Blob / Redis / Email]
    ProdServices[Production Blob / Redis / Email]
    PublicEvidence[Public repo + live demo\nscreenshots, video, case study, tagged release]

    GitHub --> CI
    CI --> Preview
    Preview --> PreviewDB
    Preview --> PreviewServices
    CI -->|required checks + reviewed migration| Production
    Production --> ProdDB
    Production --> ProdServices
    Production --> PublicEvidence
    GitHub --> PublicEvidence
```

Preview and production resources are isolated. `prisma migrate deploy` runs as a controlled release step using a direct database connection, while the application uses the provider's pooled connection. Vercel rollback handles application code; schema changes follow backward-compatible expand/migrate/contract practices and normally roll forward. Lighthouse CI gates the production build at mobile Performance 90, Accessibility 95, Best Practices 95, and SEO 95 for public content plus a seeded representative app route. The release is not complete until the authorized public deployment, public repository, evidence links, and pushed semantic tag are verifiable.

## Key quality attributes

| Attribute        | Architectural response                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant isolation | Trusted membership lookup plus `organizationId` predicate on every protected query/mutation                                                                                 |
| Authorization    | Central policy with server-loaded role; UI visibility is only a convenience                                                                                                 |
| Auditability     | Immutable activity records written transactionally with domain changes                                                                                                      |
| Accessibility    | Semantic server-rendered structure, shadcn/Radix primitives, keyboard pipeline alternative, scoped shortcuts/cheat sheet, chart text equivalents                            |
| Performance      | Server Components, indexed keyset queries, aggregate SQL, minimal client islands, Lighthouse CI budgets                                                                     |
| Reliability      | Database constraints, transactions, concurrency checks, compensating blob cleanup                                                                                           |
| Security         | Hashed passwords/tokens, verified OAuth assertions, secure cookies, IP+account backoff, live RBAC/session rotation, validation, origin checks, CSP/headers, private storage |
| Testability      | Thin framework entry points, injectable adapters, domain services, real PostgreSQL integration tests                                                                        |
| Operability      | Managed services, environment validation, structured redacted logs, idempotent seed, documented migrations                                                                  |

## Architectural decision records

`docs/decisions.md` records the following accepted target decisions:

1. Auth.js credentials/configured OAuth accounts plus encrypted JWT sessions and database-validated `sessionVersion`/membership.
2. One selected organization per session with a multi-membership-capable schema.
3. Soft deletion and PostgreSQL partial unique indexes.
4. Server Actions for domain mutations and Route Handlers for streams.
5. Private object storage for resumes with compensating cleanup.
6. URL-owned list state and indexed server-side keyset/cursor pagination.
7. Applications as the analytics pipeline unit.
8. Managed provider adapters for mail, rate limits, and storage.
9. All-matching bulk selection as a normalized server-rebuilt predicate with exclusions, caps, confirmation, and per-record audit events.
10. Static docs/FAQ structured-data generation and Lighthouse-gated public delivery evidence.

Implementation may refine file boundaries, but changes to these trust boundaries, entity relationships, permissions, or provider assumptions will be called out before the affected milestone begins.
