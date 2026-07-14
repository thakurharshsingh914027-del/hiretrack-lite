# Changelog

All notable changes to HireTrack Lite are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Product requirements, acceptance criteria, milestone plan, and system architecture diagrams.
- Repository governance files, contribution guidance, issue forms, and pull request template.
- MIT license and an environment-variable contract with safe placeholder values.
- Initial GitHub Actions quality gate for linting, strict type checking, tests, and production builds.
- Pre-release case study structure that reserves all outcome claims for verified evidence.
- Next.js 16 App Router foundation with strict TypeScript, Tailwind CSS, shadcn-compatible accessible primitives, and pinned dependencies.
- Original responsive HireTrack Lite landing page and workspace shell with system-aware dark mode, reduced-motion support, and 320 px layouts.
- Keyboard command palette, shortcut guide, semantic navigation, route-matching loading/empty/error/success states, and polished 404 handling.
- Crawlable getting-started, feature, architecture, deployment, and FAQ pages with canonical metadata and shared navigation.
- SoftwareApplication, FAQPage, and BreadcrumbList structured data plus sitemap, preview-aware robots policy, manifest, custom icon, and generated 1200×630 Open Graph image.
- Sourced competitive analysis, browser-callable API contract, and a real Milestone 1 hero screenshot.
- Vitest component/environment/structured-data coverage and Playwright smoke coverage for the landing flow, keyboard palette, and 320 px overflow.
- Prisma 7/PostgreSQL schema for organizations, users, provider accounts, memberships, recruiting records, invitations, tokens, and audit history.
- Reviewed initial migration with named checks, active-row partial unique indexes, explicit foreign-key/query indexes, and optimistic-concurrency versions.
- Lazy server-only Prisma client plus deterministic, idempotent demo seed with an Argon2id-hashed verified admin and coherent recruiter/viewer recruiting fixtures.
- Real-PostgreSQL integration factories and tests for tenant isolation, lifecycle constraints, active uniqueness, token/invitation rules, and seed idempotency.
- PostgreSQL-backed GitHub Actions setup that validates the schema, applies committed migrations, verifies the seed command, and runs database tests before the production build.
- Auth.js JWT credentials authentication with configuration-gated Google/GitHub providers, normalized collision-safe Prisma adapter, verified-email enforcement, and secure host-only cookies.
- Transactional signup, fragment-delivered verification/reset/invitation links, Argon2id password recovery with session-version revocation, organization onboarding, and invitation acceptance.
- Protected workspace layout with live database membership resolution, centralized RBAC policy/final-admin primitive, safe auth actions, Resend/capture mail adapters, and Upstash/deterministic rate limiting with `Retry-After`.

### Security

- Environment files are ignored by default while `.env.example` remains tracked.
- CI runs with read-only repository contents permission and no production credentials.
- Production CSP disallows arbitrary inline scripts while retaining conservative HSTS, frame, referrer, MIME-sniffing, and permissions-policy headers.
- Server environment validation requires OAuth client identifiers and secrets to be configured as complete provider pairs.
- Composite tenant foreign keys prevent cross-organization attribution and domain references at the database boundary.
- Demo passwords are never persisted to PostgreSQL or logged; only disposable CI/test inputs live in source. Seed placeholders are rejected, passwords use Argon2id, plaintext authentication tokens never enter PostgreSQL, and token tables accept SHA-256 digests with explicit lifecycle state.
- Candidate and invitation normalized identities are tied to their source emails at the database boundary, destructive integration tests require a disposable-database guard, legacy demo hashes are upgraded to the approved Argon2id policy, and the audited Prisma development-server dependency is pinned to its patched release.

Releases will be added here only after the corresponding milestone has passed its documented verification gate.
