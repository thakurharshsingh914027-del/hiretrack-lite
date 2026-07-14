# Contributing to HireTrack Lite

Thanks for helping improve HireTrack Lite. Contributions should preserve its central promise: a focused, accessible applicant tracking workspace with strict organization isolation and server-enforced permissions.

## Set up locally

Follow the [README quick start](README.md#quick-start) to install dependencies and create `.env.local`. Milestone-specific services, migrations, and seed steps are documented as they become available. Never use production credentials or production candidate data for local development.

## Choose an issue

- Search existing issues before opening a new one.
- Use the bug report or feature request form and include a narrow, reproducible scope.
- Discuss large product, schema, authentication, or provider changes before implementation because they may alter accepted architecture decisions.
- Do not publish credentials, tokens, private resumes, candidate details, or exploitable security reports in an issue.

## Create a branch

Branch from the latest `main` using a short kebab-case name:

| Change        | Pattern            | Example                    |
| ------------- | ------------------ | -------------------------- |
| Feature       | `feat/<scope>`     | `feat/candidate-search`    |
| Bug fix       | `fix/<scope>`      | `fix/pipeline-rollback`    |
| Documentation | `docs/<scope>`     | `docs/local-setup`         |
| Refactor      | `refactor/<scope>` | `refactor/access-policy`   |
| Tests         | `test/<scope>`     | `test/csv-escaping`        |
| Maintenance   | `chore/<scope>`    | `chore/update-lint-config` |

Keep each branch focused on one coherent outcome. Rebase or merge the latest `main` before requesting final review, and resolve conflicts on the branch.

## Make the change

- Follow strict TypeScript and do not introduce `any`.
- Keep framework entry points thin; separate validation, authorization, data access, and domain behavior.
- Validate untrusted input on the server and scope every protected data operation with the trusted organization ID.
- Add or update tests with behavior changes, including likely failures and permission boundaries.
- Preserve keyboard operation, visible focus, WCAG AA contrast, reduced motion, and the 320 px layout.
- Add a decision entry when a non-obvious architectural trade-off changes.
- Update the unreleased changelog when behavior visible to users or contributors changes.

## Commit clearly

Use small [Conventional Commits](https://www.conventionalcommits.org/) that state one purpose:

```text
feat: add server-side candidate filters
fix: roll back a rejected pipeline move
docs: explain local email capture
test: cover viewer export denial
refactor: centralize organization access checks
chore: update test tooling
```

Use the imperative mood, explain the reason in the body when the diff is not self-evident, and avoid bundling unrelated formatting or cleanup.

## Verify before pushing

Run the same checks as CI:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e -- --project=chromium
```

Also run the relevant focused tests while iterating. Playwright expects a successful production build and installs Chromium with `npx playwright install chromium` on a new machine. Database integration commands will be documented when the data-model milestone adds that infrastructure.

For UI changes, manually check keyboard-only use, 320 px width, light and dark themes, loading/empty/error/success states, and reduced motion. Include before/after screenshots in the pull request when they make the change easier to review.

## Open a pull request

Use the repository template and include:

- The user or engineering problem being solved.
- The chosen approach and any important trade-off.
- Exact verification commands and their outcome.
- Screenshots or a recording for visual changes.
- Schema, environment, security, privacy, accessibility, and deployment impact.
- The issue closed by the change, when one exists.

Keep the pull request reviewable. Address feedback with focused commits and leave the branch in a state where the full quality gate passes.

## Report a security issue

Do not open a public issue for a vulnerability or suspected data exposure. Contact the repository owner privately through the verified contact method on their GitHub profile and include only the minimum information needed to reproduce the issue safely.
