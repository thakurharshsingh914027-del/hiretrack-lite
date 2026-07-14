# HireTrack Lite product research

**Research date:** 2026-07-13  
**Milestone:** 1 — repository foundation and design system  
**Research mode:** Read-only review of official product, help-center, and developer documentation

## Purpose and guardrails

This document studies three established applicant-tracking products—Greenhouse Recruiting, Lever, and Ashby—to identify durable workflow and interaction principles for HireTrack Lite. They are useful benchmarks because each documents a mature approach to jobs, people, job-specific applications, pipeline movement, interviews, and reporting. This is not a market-ranking exercise and does not claim hands-on usability testing.

The goal is pattern research, not imitation. HireTrack will not reproduce a competitor's screen composition, component styling, proprietary wording, illustrations, marketing copy, or brand assets. Findings below are converted into requirements appropriate for a small team and an original visual system.

## Comparative snapshot

| Product    | Dominant product idea                                  | Model clue that matters most                                                                     | Most useful lesson for HireTrack                                                          |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Greenhouse | Structured hiring organized around each job's plan     | A candidate can have job-specific applications; an interview plan contains stages and interviews | Make the expected process and next action clear without exposing enterprise configuration |
| Lever      | Candidate-centric relationship management              | One person can have several job-specific applications/opportunities                              | Never store a single pipeline stage on the person record                                  |
| Ashby      | Integrated recruiting operations with strong analytics | A candidate has one or more job considerations; jobs, openings, and postings are distinct        | Preserve a clean domain model, but expose only the concepts a small team needs            |

## 1. Greenhouse Recruiting

### Onboarding and setup

Greenhouse presents implementation as an organizational rollout rather than a single account wizard. Its official implementation guide separates basic configuration (permissions, technical setup, privacy, and career-page integration), foundational practices (job templates, opening a job, and calendar integration), migration readiness, and launch/training. That sequence makes process decisions and ownership part of onboarding, not an afterthought. [Greenhouse implementation guide](https://support.greenhouse.io/hc/en-us/articles/8976662447515-Getting-started-with-implementation)

The configurable new-job flow then walks through job information and can include a hiring team, kickoff, scorecard, interview plan, approvals, job post, forms, notifications, and sourcing plan. The required job-information step establishes a stable starting point while optional steps support mature organizations. [Greenhouse job setup flow](https://support.greenhouse.io/hc/en-us/articles/204923599-Configure-the-new-job-setup-flow)

**HireTrack interpretation:** preserve the sense of a guided first success, but compress it to `create organization → create first job → add first candidate → create application`. Invitations and profile completion can remain available without blocking activation. Enterprise migration, approvals, scorecards, sourcing plans, and career-site configuration should not appear in the initial path.

### Core workflow

1. Configure a job and its hiring responsibilities.
2. Define an interview plan made of stages and interviews; Greenhouse starts candidate plans with Application Review and ends them with Offer, while allowing the middle to vary. [Greenhouse interview-plan overview](https://support.greenhouse.io/hc/en-us/articles/115002194903-Interview-plan-overview)
3. Review applicants and advance or reject them.
4. Use the candidate profile to review progress, schedule interviews, assign scorecards, collaborate through notes, and manage offers without leaving the record. [Greenhouse candidate-profile overview](https://support.greenhouse.io/hc/en-us/articles/30352015432987-Candidate-profile-redesign-overview)
5. Use the job pipeline to see stage distribution and outstanding actions, then drag an authorized candidate to a new stage. [Greenhouse visual candidate pipeline](https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline)

The workflow is deliberately structured: the job defines the evaluation process, and candidate activity happens in that context.

### Information architecture and data-model clues

- **Candidate** is the durable person record.
- **Application** associates a candidate with a job. The official Harvest API states this directly and exposes a candidate ID, job/stage information, source, timestamps, and status on the application. [Greenhouse Harvest API — applications](https://developers.greenhouse.io/harvest.html#applications)
- **Job** owns a hiring team, job post, openings, and an interview plan.
- **Interview plan** contains ordered stages, and stages can contain one or more interviews. [Greenhouse interview-plan overview](https://support.greenhouse.io/hc/en-us/articles/115002194903-Interview-plan-overview)
- **Candidate profile** aggregates documents, notes, reminders, tasks, applications to other jobs, stage history, scorecards, offer information, and activity. [Greenhouse candidate-profile guide](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile)

This separation validates HireTrack's proposed `Candidate → Application ← Job` relationship. Pipeline stage, hired/rejected timestamps, and interview context belong to the application, not to the candidate.

### Useful microinteractions

- The visual pipeline prioritizes cards by the type of outstanding work and also exposes time in stage. It distinguishes internal action, missing feedback, and no current internal action. [Greenhouse visual candidate pipeline](https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline)
- The candidate header keeps stage movement and hiring actions close to the person's identity; it minimizes on scroll to preserve working space. A collapsible side panel holds supporting details, notes, alerts, and reminders. [Greenhouse candidate-profile guide](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile)
- A private-mode toggle obscures sensitive information during screen sharing. This is a strong privacy affordance even though HireTrack's first release will rely on role-authorized views instead of a separate presentation mode. [Greenhouse candidate-profile overview](https://support.greenhouse.io/hc/en-us/articles/30352015432987-Candidate-profile-redesign-overview)
- `Ctrl/Cmd+K` opens search, the shortcut menu is discoverable, arrow keys move between candidates, and direct keys open the resume, reject, or move stage. [Greenhouse keyboard shortcuts](https://support.greenhouse.io/hc/en-us/articles/10737253281051-Keyboard-shortcuts-in-Greenhouse-Recruiting)
- Candidate-facing stage mapping can be previewed before publishing, keeping internal process labels separate from external communication. [MyGreenhouse stages](https://support.greenhouse.io/hc/en-us/articles/42201508536091-MyGreenhouse-Stages)

### Strengths

- A clear structured-hiring model aligns job definition, evaluation, interviews, and decisions.
- Candidate detail acts as a focused work surface rather than a static contact page.
- Visible next actions and time-in-stage signals make the pipeline operational.
- Keyboard help is both powerful and discoverable.

### Tradeoffs

- Configurable job setup, permissions, scorecards, approvals, interview kits, and stage automation create substantial setup cost for a small company.
- Job-specific configuration can produce terminology and reporting inconsistency if every team creates different stages.
- A dense candidate workspace requires careful progressive disclosure and can be intimidating for occasional hiring managers.

### Explicit non-copy design lessons for HireTrack

- **Adopt:** a guided first-job path, a candidate workspace with a persistent identity/stage summary, explicit next-action text, time-in-stage metadata, and a discoverable shortcut sheet.
- **Adapt:** use the fixed HireTrack stages (`Applied`, `Screening`, `Interview`, `Offered`, `Hired`, `Rejected`) in v1. This preserves structured hiring while avoiding an interview-plan builder.
- **Improve for accessibility:** pair every urgency color with an icon and written status; provide move controls alongside drag and drop.
- **Do not copy:** Greenhouse's column styling, color meanings, profile panel arrangement, icons, exact shortcut map, setup labels, or candidate-facing language.

## 2. Lever

### Onboarding and setup

Lever's official Getting Started collection separates guidance by admin, recruiter, hiring manager, interviewer, and scheduler, and includes a digital implementation plan plus keyboard guidance. That role-based documentation acknowledges that each participant needs a different first-use path. [Lever Getting Started](https://help.lever.co/hc/en-us/sections/20087131142173-Getting-Started)

Its career-site documentation describes launching the application flow as a critical implementation event and offers options ranging from a quick hosted link to a fully custom API integration. [Lever career-site options](https://help.lever.co/hc/en-us/articles/20087346449437-Lever-career-site-options)

**HireTrack interpretation:** tailor empty states and permitted actions by role, but keep one shared product shell. An admin should see setup/invite actions, a recruiter should see creation and pipeline actions, and a viewer should see a clear read-only explanation. Public career pages and migration choices remain out of scope for v1.

### Core workflow

1. Create and publish a job posting.
2. Add or receive a candidate, producing a job-specific application/opportunity.
3. Find people through global search or pipeline filters.
4. Move an opportunity through active stages, schedule interviews, add feedback and notes, create an offer, then archive as hired or with another disposition.
5. Use bulk actions for stage, archive, tags, sharing, email, ownership, and related operations when working with a cohort. [Lever candidate-management overview](https://help.lever.co/hc/en-us/categories/19925343235357-Candidate-Management)

Lever's product vocabulary expresses recruiting as an ongoing relationship with a person rather than a one-time row in a job pipeline.

### Information architecture and data-model clues

- Lever describes itself as **candidate-centric**: a person may exist without a posting and may have multiple applications.
- Each application belongs to a unique **Opportunity**, and an opportunity has no more than one application. Application creation can come from a posting, a team member, or a referral. [Lever API reference — applications](https://hire.lever.co/developer/documentation#applications)
- A **Posting** is the job-facing record associated with the application; owner and hiring-manager relationships are attached to it.
- **Stages** are organization-defined, with a few common endpoints, while archiving holds hired and other disposition outcomes. [Lever API FAQ](https://hire.lever.co/developer/support)
- Search spans both the active pipeline and archive, and results expose job, stage/archive reason, rating, recent interaction, owner, and a snippet showing why the record matched. [Lever candidate search](https://help.lever.co/hc/en-us/articles/20087317030685-Searching-the-database-for-candidates)

The exact Lever distinction among candidate, application, and opportunity is richer than HireTrack needs, but it reinforces the essential rule: a person can participate in several independent job journeys.

### Useful microinteractions

- Global search offers suggestions while the user types; advanced results use field chips and boolean operators and reveal the source of a text match. [Lever candidate search](https://help.lever.co/hc/en-us/articles/20087317030685-Searching-the-database-for-candidates)
- The bulk-action toolbar appears only after at least one opportunity is selected, keeping the default list quieter. Filters can narrow the cohort before select-all. [Lever bulk-action toolbar](https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar)
- Destructive deletion requires typing `Delete`, while unarchiving restores an opportunity to its prior pipeline location. [Lever bulk-action toolbar](https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar)
- `/` focuses search, arrow keys traverse adjacent candidate profiles, and `Esc` closes profile/resume contexts. [Lever keyboard shortcuts](https://help.lever.co/hc/en-us/articles/20087379303197-Keyboard-shortcuts-in-Lever)
- Pipeline analytics documents formulas, cohort definitions, chart units, and drill-down behavior rather than presenting unexplained totals. [Lever Pipeline dashboard](https://help.lever.co/hc/en-us/articles/20087349143581-Visual-Insights-Pipeline-dashboard)

### Strengths

- Candidate-centric structure supports repeat relationships and multiple job applications cleanly.
- Global search and contextual match evidence make a large talent database navigable.
- Selection reveals actions in context instead of permanently crowding the list.
- Reporting documentation makes metric definitions inspectable.

### Tradeoffs

- Candidate, application, opportunity, posting, requisition, stage, and archive terminology creates a learning burden.
- Highly capable bulk and search systems expose many controls and edge cases.
- Treating hired as an archive outcome is internally coherent but can be surprising to a new user.
- The relationship-management breadth extends far beyond a lightweight ATS.

### Explicit non-copy design lessons for HireTrack

- **Adopt:** candidate/application separation, search suggestions, match-context hints where practical, contextual bulk actions, and clearly defined analytics.
- **Adapt:** call the join record an **application**, a familiar term already used in HireTrack's plan. Use `Hired` and `Rejected` as visible terminal pipeline stages even if both also close an active application internally.
- **Simplify:** use straightforward search and a small filter set before considering boolean query builders, rediscovery, nurturing, or global talent CRM features.
- **Do not copy:** Lever's candidate/opportunity terminology, pipeline layout, chip treatment, toolbar composition, archive semantics, confirmation wording, or visual brand.

## 3. Ashby

### Onboarding and setup

Ashby provides dedicated admin onboarding and role-specific getting-started guides. The recruiter guide begins with personal settings and notifications, introduces the home page, candidate profile, cross-job pipeline, and job dashboard, and then follows common work from opening a job through interviews, offers, and HRIS handoff. [Ashby Admin Onboarding](https://docs.ashbyhq.com/ashby-admin-onboarding) [Ashby Getting Started for Recruiters](https://docs.ashbyhq.com/getting-started-for-recruiters)

Before creating a job, Ashby requires at least one department and location. Its job wizard then asks for core job information, an interview plan, and a hiring team, with further configuration available afterward. [Ashby departments and locations](https://docs.ashbyhq.com/set-up-departments-and-locations) [Ashby creating and opening jobs](https://docs.ashbyhq.com/creating-and-opening-jobs)

**HireTrack interpretation:** good defaults should make setup reversible and incremental. HireTrack can collect department and location inline while creating a job rather than forcing a trip to organization settings. Personal notification configuration and external integrations can wait.

### Core workflow

1. Configure organization basics and users.
2. Create a job, optionally from a template; assign its interview plan and hiring team; then mark it open.
3. Create one or more postings when applications need to be collected externally.
4. Review a cross-job or job-specific candidate pipeline, perform application review, schedule stage activities, collect feedback, advance or archive the job consideration, and create an offer.
5. Inspect ready-made dashboards for jobs, pipeline, interviews, offers, and sourcing. [Ashby candidate pipeline](https://docs.ashbyhq.com/candidate-pipeline) [Ashby core dashboards](https://docs.ashbyhq.com/core-dashboards)

### Information architecture and data-model clues

- **Candidate** is the person-level profile and can exist before being attached to a job.
- **Job consideration** is the job-specific recruiting journey. Ashby's migration glossary explicitly maps it to Greenhouse's Application and Lever's Opportunity. [Ashby migration glossary](https://docs.ashbyhq.com/migrations#glossary-of-terms-across-platforms)
- **Job**, **Opening**, and **Job posting** are separate. A job is the central role record, an opening represents headcount, and a posting is an internal/public advertisement; several postings can point to one job. [Ashby creating and opening jobs](https://docs.ashbyhq.com/creating-and-opening-jobs)
- The candidate profile offers a person overview plus job-consideration views with stage progress, activities, hiring team, source, interviews, resume, and feed. [Ashby candidate profile](https://docs.ashbyhq.com/candidate-profile)
- The feed collects notes, feedback, communication, referrals, and forms. Ashby's documentation notes that notes are person-level rather than tied to one job consideration, an explicit tradeoff that matters when a candidate has several jobs. [Ashby candidate feed](https://docs.ashbyhq.com/candidate-profile-candidate-feed)

This is the clearest validation of HireTrack's planned entities. HireTrack should keep notes tied to the candidate as specified, while the UI must show which application/interview context the user is viewing so a note is not mistaken for job-specific feedback.

### Useful microinteractions

- In the jobs view, filter criteria appear beside search and can be removed in place; filtered views can be saved as tabs. Key job metadata uses direct-edit or deep-link pills. [Ashby creating and opening jobs](https://docs.ashbyhq.com/creating-and-opening-jobs)
- A job cannot be opened until required information exists; the disabled choice explains what is missing. [Ashby creating and opening jobs](https://docs.ashbyhq.com/creating-and-opening-jobs)
- Pipeline card status communicates either outstanding activity or time in stage. Green/yellow/red correspond to current, waiting, and action-needed states, with text such as “Needs Decision” or “Waiting on Feedback.” [Ashby candidate pipeline](https://docs.ashbyhq.com/candidate-pipeline)
- Bulk work uses a review wizard that shows the criteria and number of matching records, escalates confirmation for destructive or large actions, can minimize while processing, and ends with a change log. [Ashby candidate pipeline](https://docs.ashbyhq.com/candidate-pipeline)
- Candidate profiles expose a lightweight follow-up control with an optional note and keep stage, email, archive, and interview actions close to the current job consideration. [Ashby candidate profile](https://docs.ashbyhq.com/candidate-profile)
- Ready-made dashboards provide immediate metrics before users learn a custom report builder. [Ashby core dashboards](https://docs.ashbyhq.com/core-dashboards)

### Strengths

- Recruiting workflow, scheduling, candidate management, and analytics share a coherent data model.
- Advanced filtering and saved views support operational teams with many concurrent roles.
- Attention states turn the pipeline into a task surface, not only a stage visualization.
- Bulk-action review and post-action logs make high-impact operations inspectable.

### Tradeoffs

- The breadth of configuration, analytics, automation, and permission levels creates a dense information architecture.
- Separating jobs, openings, postings, and job considerations is powerful but too much vocabulary for a small team's first release.
- Saved reports, advanced boolean filters, custom dashboards, sequences, and activities can distract from the basic hiring loop.
- Person-level notes can become contextually ambiguous when a candidate is in several processes.

### Explicit non-copy design lessons for HireTrack

- **Adopt:** visible prerequisites, reasoned disabled states, attention labels, filter state that is easy to clear, reviewed bulk operations, progress feedback, and ready-made analytics.
- **Adapt:** put filters in the URL instead of building saved-view infrastructure in v1. Use one job record with a status; openings and public postings remain deferred.
- **Clarify:** label person-wide notes as “Candidate notes” and keep interview feedback attached to interviews/applications.
- **Do not copy:** Ashby's pipeline card system, traffic-light palette, pills, saved-tab layout, bulk wizard screens, dashboard arrangements, terminology, or brand expression.

## Synthesis for HireTrack Lite

### What the three products agree on

Despite different vocabulary, all three converge on the same core model and workflow:

```text
Person (Candidate) ──< Job-specific journey (Application) >── Job
                              │
                              ├── current stage and stage history
                              ├── interviews and feedback
                              └── activity/audit events
```

They also converge on five interaction principles:

1. **The job defines context.** Hiring activity is intelligible only when the role and process are visible.
2. **The candidate profile is a work surface.** Identity, documents, current state, next actions, and collaboration belong together.
3. **The pipeline must express attention, not just position.** Time in stage, pending feedback, and next action make a board useful.
4. **Speed requires guardrails.** Shortcuts, drag and drop, search, and bulk actions work best with visible scope, confirmations, undo/rollback where possible, and an audit trail.
5. **Metrics need definitions.** A chart is trustworthy only when its population, period, and formula are understandable.

### Why HireTrack should stay focused

The benchmark products support large organizations through custom interview plans, job/opening/posting distinctions, sourcing CRM, sequences, approvals, automation, custom reports, numerous permission levels, integrations, and migration programs. Those capabilities are valuable at scale, but each adds setup decisions, vocabulary, UI density, and permission edge cases.

HireTrack's target is a 2–50 person organization moving away from spreadsheets. Its first success is not a perfectly configured recruiting operating system; it is one job and one candidate moving safely through a visible pipeline. A fixed stage model, three roles, one selected organization, ready-made analytics, and focused job/candidate/application/interview records are therefore product advantages, not missing enterprise features.

| Ship in the focused release                       | Defer until demonstrated need          | Deliberately avoid in v1                            |
| ------------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| Organization creation and invitations             | Custom pipeline stages                 | Competitor-style all-in-one recruiting CRM          |
| Jobs, candidates, applications, interviews, notes | Saved filter views                     | Openings/requisitions and multiple postings per job |
| Fixed six-stage pipeline with accessible movement | Scorecards and interview-plan builders | Outreach sequences and campaigns                    |
| Search, essential filters, cursor pagination      | Calendar and email-provider automation | Custom report builder                               |
| Explicit bulk selection and confirmation          | Candidate portal/public job board      | Configurable automation rules                       |
| Ready-made live analytics with definitions        | Fine-grained field privacy             | Enterprise permission taxonomy                      |
| Keyboard palette and discoverable shortcuts       | Resume parsing and AI ranking          | Color-only urgency or drag-only interaction         |

### Original interaction and visual identity

Research should influence behavior, not appearance. HireTrack's identity should communicate **calm operational clarity**: restrained tokens, strong typographic hierarchy, generous space around consequential actions, high-contrast focus treatment, plain-language status copy, and motion used only to preserve context. It should feel lighter and more deliberate than a mature enterprise console.

To remain recognizably original:

- Create a HireTrack-specific palette and semantic token names; do not reuse Greenhouse, Lever, or Ashby's recognizable brand or traffic-light systems.
- Develop original navigation proportions, card/table composition, icon choices, empty-state illustrations, and voice.
- Use a distinct application summary treatment that combines role, candidate, stage, and next action without reproducing any benchmark profile header.
- Treat urgency as a combination of text, icon, border/shape, and optional color so the system works in dark mode, high contrast, and without color perception.
- Keep motion within the planned 150–250 ms range, honor reduced motion, and announce pipeline changes to assistive technology.
- Use original empty-state copy centered on the user's permitted next step; viewers receive a useful read-only explanation rather than a disabled imitation of recruiter controls.

The resulting product can share category conventions—jobs, candidates, applications, pipelines, interviews, and analytics—while expressing them through HireTrack's own information density, language, tokens, components, and accessibility behavior.

## Research-backed Milestone 1 decisions

1. Establish the application shell around five stable destinations: Dashboard, Jobs, Candidates, Pipeline, and Interviews; admin-only member/audit areas can appear later when functional.
2. Provide a global command palette and a discoverable shortcut sheet, but register only actions that exist and are authorized.
3. Build reusable status, empty, loading, error, and confirmation primitives before domain pages are implemented.
4. Make filters URL-addressable and easy to clear; defer saved views.
5. Define semantic tokens for neutral, accent, success, warning, danger, focus, and data-series use without borrowing competitor values.
6. Design pipeline cards and list rows to accommodate stage, time-in-stage, and a future next-action label without relying on color.
7. Keep placeholder pages honest: explain what will live there and provide only non-domain demo/empty states until backed by real data.

## Official sources reviewed

All sources below are first-party documentation and were accessed on 2026-07-13.

### Greenhouse

- [Getting started with implementation](https://support.greenhouse.io/hc/en-us/articles/8976662447515-Getting-started-with-implementation)
- [Configure the new job setup flow](https://support.greenhouse.io/hc/en-us/articles/204923599-Configure-the-new-job-setup-flow)
- [Interview plan overview](https://support.greenhouse.io/hc/en-us/articles/115002194903-Interview-plan-overview)
- [Visual Candidate Pipeline](https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline)
- [Using the new candidate profile](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile)
- [Candidate profile redesign overview](https://support.greenhouse.io/hc/en-us/articles/30352015432987-Candidate-profile-redesign-overview)
- [Keyboard shortcuts in Greenhouse Recruiting](https://support.greenhouse.io/hc/en-us/articles/10737253281051-Keyboard-shortcuts-in-Greenhouse-Recruiting)
- [MyGreenhouse Stages](https://support.greenhouse.io/hc/en-us/articles/42201508536091-MyGreenhouse-Stages)
- [Harvest API](https://developers.greenhouse.io/harvest.html)

### Lever

- [Getting Started](https://help.lever.co/hc/en-us/sections/20087131142173-Getting-Started)
- [Lever Career Site Options](https://help.lever.co/hc/en-us/articles/20087346449437-Lever-career-site-options)
- [Candidate Management](https://help.lever.co/hc/en-us/categories/19925343235357-Candidate-Management)
- [Searching the Database for Candidates](https://help.lever.co/hc/en-us/articles/20087317030685-Searching-the-database-for-candidates)
- [Using the bulk action toolbar](https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar)
- [Keyboard shortcuts in Lever](https://help.lever.co/hc/en-us/articles/20087379303197-Keyboard-shortcuts-in-Lever)
- [Visual Insights: Pipeline dashboard](https://help.lever.co/hc/en-us/articles/20087349143581-Visual-Insights-Pipeline-dashboard)
- [Lever API reference](https://hire.lever.co/developer/documentation)
- [Lever API FAQ](https://hire.lever.co/developer/support)

### Ashby

- [Ashby Admin Onboarding](https://docs.ashbyhq.com/ashby-admin-onboarding)
- [Getting Started for Recruiters](https://docs.ashbyhq.com/getting-started-for-recruiters)
- [Set up Departments & Locations](https://docs.ashbyhq.com/set-up-departments-and-locations)
- [Creating & Opening Jobs](https://docs.ashbyhq.com/creating-and-opening-jobs)
- [Candidate Pipeline](https://docs.ashbyhq.com/candidate-pipeline)
- [Candidate Profile](https://docs.ashbyhq.com/candidate-profile)
- [Candidate Profile: Candidate Feed](https://docs.ashbyhq.com/candidate-profile-candidate-feed)
- [Core Dashboards](https://docs.ashbyhq.com/core-dashboards)
- [Migrations and cross-platform glossary](https://docs.ashbyhq.com/migrations)
