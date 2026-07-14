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

### Security

- Environment files are ignored by default while `.env.example` remains tracked.
- CI runs with read-only repository contents permission and no production credentials.
- Baseline CSP with same-origin production connections, conservative production HSTS, frame, referrer, MIME-sniffing, and permissions-policy headers; nonce hardening remains staged with protected dynamic routes.
- Server environment validation requires OAuth client identifiers and secrets to be configured as complete provider pairs.

Releases will be added here only after the corresponding milestone has passed its documented verification gate.
