# HireTrack Lite Case Study

Status: **Pre-release working draft**

No public repository URL, live URL, demo credentials, product screenshots, user results, Lighthouse scores, or production metrics are available yet. This document provides the case-study structure and records decisions that already exist; its result section will be completed only from verifiable release evidence.

## One-paragraph pitch

HireTrack Lite is a focused applicant tracking workspace for small companies that have outgrown spreadsheets but do not need an enterprise ATS. It gives admins, recruiters, and read-only hiring stakeholders one organization-scoped place to manage jobs, candidate profiles, applications, interviews, notes, activity history, and live hiring analytics. The product emphasizes quick orientation, safe collaboration, accessible workflows, and an audit trail for sensitive recruiting changes.

## Problem

Small hiring teams often split one recruiting process across a spreadsheet, email threads, calendars, and private notes. That fragmentation makes it difficult to answer basic operational questions: who owns the next step, which candidates are stalled, whether an interview was completed, and who changed an application stage. It also spreads personal candidate data across tools with inconsistent access controls.

The target organization has roughly 2–50 members, tens of open jobs, and hundreds to low thousands of candidates. It needs more structure and accountability than a spreadsheet, while avoiding the setup burden and breadth of a large enterprise platform.

## Approach

### Product scope

The v1 is deliberately narrow: organization onboarding, three roles, jobs, candidates, applications, a fixed hiring pipeline, interviews, internal notes, member administration, cursor-based tables, confirmed bulk actions, CSV/PDF exports, and live analytics. Credentials are always available; Google/GitHub sign-in appears only when a deployment configures a complete provider pair. Public job boards, billing, calendar synchronization, automated email campaigns, AI ranking, and customizable fields or stages are deferred. This keeps the critical job-to-candidate-to-interview flow testable end to end.

### Information and interaction design

The interface is planned around a responsive application shell, server-rendered list and detail views, URL-synchronized filters/opaque cursors, and small interactive islands. Tables support one-window selection plus explicit all-matching selection with exclusions and confirmation. Every asynchronous route or workflow is designed for loading, empty, error, and success states. The pipeline supports pointer movement and explicit keyboard move controls, charts include textual equivalents instead of relying on color, and a discoverable command palette/shortcut registry keeps keyboard behavior consistent.

The visual system uses a restrained token set, a 4 px base spacing scale, clear typographic hierarchy, visible keyboard focus, AA contrast, 44 px touch targets, system-aware dark mode, and reduced-motion behavior. Original naming, copy, colors, and assets avoid copying an existing ATS brand.

### Target data and security model

PostgreSQL will be the source of truth. Users will join organizations through memberships, and organization-owned records will carry an explicit organization ID. Every protected server operation will resolve the current membership and role from the database, validate input, and scope the query with that trusted organization ID. The browser will never establish tenant, role, actor, or ownership.

Soft deletion will preserve recruiting history, while partial unique indexes will protect active-only invariants under concurrency. Sensitive tokens will be random, hashed at rest, expiring, and single-use. Resume bytes will live in private object storage and require server authorization to retrieve. Domain changes and redacted activity events will share a transaction where atomicity matters.

See [architecture.md](architecture.md) for diagrams and [decisions.md](decisions.md) for the trade-offs behind these boundaries.

### Delivery strategy

Implementation is split into gated milestones: foundation, data model, authentication, jobs, candidates, pipeline, interviews, analytics, hardening, and public delivery. Each milestone pairs implementation with relevant tests, runs lint/typecheck/test/build, reviews the diff, updates documentation, and pauses before expanding scope. The foundation also preserves sourced product research and statically generated public docs; final verification adds critical Playwright coverage and measured Lighthouse gates. This makes incomplete work visible and keeps generated breadth from outrunning review depth.

## Key trade-offs

- **One selected workspace in v1:** the membership schema supports multiple organizations, but a general workspace switcher is deferred to keep navigation and authorization state simple.
- **Fixed pipeline stages:** six stages cover the core recruiting flow; configurable pipelines would add schema, migration, analytics, and accessibility complexity before the primary workflow is proven.
- **Managed infrastructure behind adapters:** PostgreSQL, private blob storage, email, and distributed rate limiting reduce operational load, while small interfaces keep domain logic testable and limit provider coupling.
- **Applications as the analytics unit:** one candidate may be in different stages for different jobs, so pipeline counts represent active applications and are labeled accordingly.
- **Keyset traversal over page numbers:** mutable job/candidate tables use versioned query-bound cursors for stable indexed forward/backward traversal; arbitrary page jumps are traded away to avoid offset drift.
- **Server-rebuilt bulk selection:** “all matching” sends a normalized filter and exclusions rather than a trusted browser count; the server rebuilds tenant scope, caps the action, and reports affected/skipped records.
- **Server-first reads:** authenticated pages favor server components and direct authorized queries; client state is reserved for ephemeral interaction such as forms, dialogs, and optimistic movement.

## Result

Release results are **not yet available**. The following evidence must exist before this section is rewritten in the past tense:

- A public GitHub repository, pushed semantic release tag, and public HTTPS deployment that pass link and incognito smoke checks.
- A verified demo account documented in the README after the auth and seed milestones.
- Three to five screenshots captured from real application states.
- A 60–90 second recording of login, job creation, candidate creation, application creation, and a persisted pipeline move.
- Passing CI output for lint, strict typecheck, automated tests, a production build, critical Playwright coverage, and Lighthouse gates.
- Production accessibility, responsive-layout, console, security-header, metadata, and Open Graph checks.
- Measured Lighthouse and Core Web Vitals results reported with date, environment, and limitations.

Planning evidence currently lives in [../plan.md](../plan.md), and architecture evidence lives in [architecture.md](architecture.md). Neither is presented as proof that the product workflows have shipped.

## What I have learned so far

The planning phase made four constraints especially clear. First, tenant isolation is a data-access invariant, not a middleware feature: every relation, query signature, and test fixture has to make organization scope difficult to omit. Second, a pipeline that merely looks instant is not sufficient; an optimistic move also needs concurrency detection, a canonical server response, rollback, and an accessible announcement. Third, cross-cursor bulk selection cannot trust a count or organization sent by the browser; the server has to rebuild the filter and authorize every affected state. Fourth, scope discipline is part of product quality. Deferring customizable workflows and integrations creates room to finish authentication, failure states, keyboard behavior, and auditability properly.

This section will grow with specific implementation lessons and incidents as milestones are completed. It will not be replaced with generic retrospective claims.

## What comes next

1. Use the verified repository foundation, responsive shell, command palette, static docs/FAQ, sourced competitive analysis, environment validation, tests, and CI as the base for later milestones.
2. Commit and test the PostgreSQL schema, constraints, migrations, factories, and idempotent demo seed.
3. Implement credentials/optional OAuth, email verification, recovery, invitations, and the complete authorization matrix.
4. Deliver the job, candidate, application, pipeline, interview, and analytics vertical slices, including cursor traversal, bulk actions, and both export formats.
5. Complete security, accessibility, performance, critical-path end-to-end, and Lighthouse review.
6. Publish the repository and deployment with user-authorized access, capture real evidence, publish demo access, record the walkthrough, and push v1.0.0.

## Release evidence

| Evidence                            | Status    | Location                                                 |
| ----------------------------------- | --------- | -------------------------------------------------------- |
| Public repository                   | Pending   | Public URL plus pushed semantic release tag              |
| Live application                    | Pending   | URL will replace the README placeholder after deployment |
| Demo credentials                    | Pending   | README after authentication and seed verification        |
| Product screenshots                 | Pending   | `docs/screenshots/`                                      |
| Competitive analysis                | Available | `docs/competitive-analysis.md`                           |
| Demo video                          | Pending   | Public link after final workflow recording               |
| CI verification                     | Pending   | GitHub Actions workflow runs                             |
| Accessibility and Lighthouse report | Pending   | Release notes or linked verification artifact            |

## Credit

This project originated from the **Digital Heroes Full Stack Developer Trial**, founded by Prasun Anand. The case study will remain an honest record of the repository's own implementation and evidence.
