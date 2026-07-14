# HireTrack Lite API and Server Action Contracts

Status: foundation contract; exact Zod schemas, examples, and error codes are added with each feature milestone.

HireTrack Lite uses Server Actions for ordinary form/domain mutations and Route Handlers for authentication, private file streams, and streamed exports. Public framework routes are documented here because all browser-callable boundaries require explicit input, output, authorization, and rate-limit behavior.

## Contract conventions

- Inputs are untrusted and parsed on the server with Zod.
- Protected calls resolve the current Auth.js session and load live membership/role data from PostgreSQL.
- Organization, role, actor, verification, and author identifiers supplied by a client are never authoritative.
- Domain mutations return the canonical updated view model.
- Action results use `{ ok: true, data }` or `{ ok: false, code, message, fieldErrors? }`.
- Route errors use an appropriate status, a stable safe code/message, and `Retry-After` on rate-limit responses.
- Missing and cross-organization records use the same outward result where revealing existence would be unsafe.

## Route Handlers

| Method        | Path                         | Input                                                                            | Success output                               | Authentication / authorization                            | Rate limit                                                                      | Milestone |
| ------------- | ---------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- | --------- |
| `GET`, `POST` | `/api/auth/[...nextauth]`    | Auth.js protocol payload                                                         | Auth.js response and secure cookie           | Depends on operation; credentials/OAuth through Auth.js   | Login: approximately 5 attempts per 15 minutes per IP and account, with backoff | 3         |
| `POST`        | `/api/uploads/resumes`       | Multipart PDF/DOCX up to 5 MiB plus candidate ID                                 | Canonical validated resume metadata          | Verified ADMIN/RECRUITER in candidate organization        | Sensitive-route token bucket                                                    | 5         |
| `GET`         | `/api/resumes/[candidateId]` | Candidate route ID                                                               | Authorized stream or short-lived private URL | Active organization member with candidate read permission | Standard protected-route limit                                                  | 5         |
| `GET`         | `/api/exports/candidates`    | Validated filters, cursor-independent all-matching selection, `csv`/`pdf` format | Streamed attachment                          | Verified ADMIN/RECRUITER in active organization           | Export token bucket; `429` plus `Retry-After`                                   | 5         |
| `GET`         | `/api/exports/jobs`          | Validated filters, cursor-independent all-matching selection, `csv`/`pdf` format | Streamed attachment                          | Verified ADMIN/RECRUITER in active organization           | Export token bucket; `429` plus `Retry-After`                                   | 4         |

## Server Actions

| Action                                            | Input                                                                             | Success output                         | Required access                                            | Important errors                                 | Milestone |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ | --------- |
| `signUp`                                          | Name, email, password, organization name                                          | Verification-pending account summary   | Anonymous                                                  | Validation, duplicate email, throttled           | 3         |
| `resendVerification`                              | Normalized email                                                                  | Generic accepted response              | Anonymous/account owner                                    | Throttled; no account enumeration                | 3         |
| `requestPasswordReset`                            | Normalized email                                                                  | Generic accepted response              | Anonymous                                                  | Throttled; no account enumeration                | 3         |
| `resetPassword`                                   | Raw token, new password                                                           | Success; prior sessions revoked        | Valid single-use token                                     | Invalid, expired, used, throttled                | 3         |
| `acceptOrganizationInvitation`                    | Raw invite token                                                                  | Current membership view                | Verified matching user                                     | Invalid, expired, revoked, email mismatch        | 3         |
| `inviteMember` / `revokeInvitation`               | Email, initial role / invitation ID                                               | Canonical invitation state             | ADMIN                                                      | Conflict, final policy, rate limit               | 3         |
| `updateMemberRole` / `deactivateMember`           | Membership ID, role/version                                                       | Canonical membership                   | ADMIN                                                      | Final-admin guard, stale write, not found        | 8         |
| `createJob` / `updateJob`                         | Shared job schema plus version on update                                          | Canonical job                          | Verified ADMIN/RECRUITER                                   | Validation, conflict, not found                  | 4         |
| `archiveJob` / `restoreJob`                       | Job ID plus version                                                               | Canonical job                          | Verified ADMIN/RECRUITER                                   | Conflict, restore uniqueness, not found          | 4         |
| `bulkArchiveJobs` / `bulkRestoreJobs`             | Explicit IDs or validated all-matching selection with exclusions and confirmation | Affected count plus canonical failures | Verified ADMIN/RECRUITER                                   | Cap exceeded, stale selection, partial conflict  | 4         |
| `createCandidate` / `updateCandidate`             | Shared candidate schema plus version on update                                    | Canonical candidate                    | Verified ADMIN/RECRUITER                                   | Duplicate normalized email, validation, conflict | 5         |
| `archiveCandidate` / `restoreCandidate`           | Candidate ID plus version                                                         | Canonical candidate                    | Verified ADMIN/RECRUITER                                   | Restore duplicate, stale write, not found        | 5         |
| `bulkArchiveCandidates` / `bulkRestoreCandidates` | Explicit IDs or validated all-matching selection with exclusions and confirmation | Affected count plus canonical failures | Verified ADMIN/RECRUITER                                   | Cap exceeded, stale selection, partial conflict  | 5         |
| `createApplication` / `archiveApplication`        | Candidate/job IDs / application ID                                                | Canonical application                  | Verified ADMIN/RECRUITER                                   | Duplicate active application, archived parent    | 6         |
| `updateApplicationStage`                          | Application ID, target stage, expected update version                             | Canonical updated application          | Verified ADMIN/RECRUITER                                   | Stale version, invalid stage, not found          | 6         |
| `createInterview` / `updateInterview`             | Interview schema plus version                                                     | Canonical interview                    | Verified ADMIN/RECRUITER                                   | Invalid dates/interviewer/state, conflict        | 7         |
| `cancelInterview` / `completeInterview`           | Interview ID, version, completion feedback/rating where applicable                | Canonical interview                    | Verified ADMIN/RECRUITER                                   | Invalid transition, stale write, not found       | 7         |
| `createCandidateNote` / `deleteCandidateNote`     | Candidate/body / note ID                                                          | Canonical note or deletion state       | Create: ADMIN/RECRUITER; delete: ADMIN or recruiter author | Empty/oversized note, ownership denial           | 5         |

## Query contracts

List queries use validated `q`, AND-combined filters, allow-listed indexed sort/direction, `after`/`before` opaque cursors, and a page size default of 25 with a hard cap of 100. Responses return items plus `pageInfo` cursors and flags. A stable ID tie-breaker is part of every cursor. Filtered no-match responses differ from true empty-workspace responses and include a reset path.

Exact schemas and examples are intentionally introduced with their implementation rather than guessed in advance. The product plan remains authoritative for the full permission matrix and transaction behavior.
