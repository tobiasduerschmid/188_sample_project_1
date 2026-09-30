# Quarterly Class Planner Implementation Plan

**Goal:** Implement the complete private quarter planning application described by `design.yml`.

**Architecture:** A browser composition root injects immutable catalog and plan domain modules, independent schedule and academic evaluators, a session coordinator, and transactional IndexedDB persistence. A separate local maintainer command validates immutable public JSON snapshots and atomically activates their manifest.

**Tech Stack:** TypeScript, React, Vite, Temporal polyfill, IndexedDB, Vitest, fake-indexeddb, and Playwright.

**Spec:** `design.yml`; observable acceptance authority: `requirements.md`.

## Global constraints

- No enrollment, accounts, third-party analytics, automatic scheduling, or live institutional integration.
- Private input stays in the browser profile. Public demo data is explicitly labeled.
- Catalog limits: 5,000 courses, 20,000 sections, quarter span at most 20 weeks.
- Per-plan limits: 40 courses, 200 components, 100 personal intervals, 200 history records, 50 targets. Profile limit: 20 saved plans.
- Preserve incomplete drafts and unknown evidence. Match assessment and save receipts to exact generations.
- Existing requirements and design remain the authority; code must not weaken them.

## Review focus

1. DST/overnight meetings and exceptions: test exact dated overlaps and rejection of ambiguous/nonexistent local times.
2. Partial information and canonical aliases: test three-valued rules, completed retakes, and adoption collisions.
3. Competing tabs and save failures: test atomic revision/capacity checks, deleted identities, and old equal-content acknowledgments.
4. Catalog and storage interruption: test retained exact versions and previous active state after failed validation/publication.
5. Accessible recovery and reconstruction: test keyboard forms, mobile layout, export of unsaved and unresolved input, and source strings as text.

## Shared interfaces and ownership

`src/domain/types.ts` defines wire/domain values. Expected failures use `Result<T>` and `Problem`. The implementation owner for a module also owns its unit tests; shared interface changes are coordinated before editing.

### Task 1 — Catalog and institution time

Files: `src/catalog/{boundary,snapshot}.ts`, `src/domain/calendar.ts`, `src/assessment/schedule.ts`, `src/fixtures/catalog.ts`, `scripts/catalog.ts`, `public/catalog/**`, `tests/{catalog,calendar,schedule,publisher}.test.ts`.

Produces `validateCatalog(raw): Result<CatalogEnvelope>`, `CatalogSnapshot`, `expandMeeting(meeting, quarter, owner): Result<Occurrence[]>`, `evaluateSchedule(plan,facts): ScheduleReport`, `makeFixture(now?)`. Catalog facts own canonical resolution and bundle interpretation. Manifest publication uses staging and atomic replacement.

- [x] Write and observe failing tests for search, admission, linked bundles, dated overlap, DST, and publication preservation.
- [x] Implement catalog, calendar, schedule, fixture, and command.
- [x] Run focused tests and review against FR-01–05, FR-14–18 and T-001/002/004.

### Task 2 — Plan and academic assessment

Files: `src/domain/plan.ts`, `src/assessment/{academic,assessment}.ts`, `tests/{plan,academic,assessment}.test.ts`.

Produces `createPlan`, `editPlan`, `adoptCatalog`, `copyPlan`, `evaluateAcademic(plan,facts)` and `assessPlan(plan,catalog,generation)`. Consumes catalog facts and calendar validation. No DOM, network, or storage.

- [x] Write and observe failing tests for invalid edit preservation, limits, incomplete bundles, truth tables, retakes, and target precedence.
- [x] Implement immutable edits and complete generation-tagged assessments.
- [x] Run focused tests and review FR-06–13/19–23/27 and T-003/005/008/011.

### Task 3 — Private persistence and catalog retention

Files: `src/storage/{profile,repository}.ts`, `src/catalog/library.ts`, `tests/{repository,library}.test.ts`.

Produces `ProfileStorage`, `PlanRepository`, `CatalogLibrary`. Commit requests include revision, mutation ID, session, generation, fingerprint, inputs, and validated catalog. Transactions own serialization, receipt identity, capacity, name uniqueness, and deletion markers.

- [x] Write and observe failing tests for two-tab races, duplicate names, capacity, tombstones, retained catalogs, and failed reads/writes.
- [x] Implement IndexedDB transactions, repository arbitration, and abortable bounded public catalog reads.
- [x] Run focused tests and review FR-24–28 and T-006/007/013.

### Task 4 — Session and accessible planner

Files: `src/session/session.ts`, `src/export/summary.ts`, `src/ui/**`, `src/main.tsx`, `tests/{session,summary}.test.ts`, `tests/e2e/**`.

Consumes the prior tasks through their public interfaces. Session serializes saves, rejects stale assessment results, guards navigation and adoption, and supplies frozen export input. React renders all four check categories without owning domain rules.

- [x] Test generation ordering, failure recovery, undo expiration, guarded transitions, and full summary inputs.
- [x] Implement quarter selection, alternatives, catalog search/detail, component choices, calendar/list, personal blocks, history, targets, update review, and recovery.
- [x] Run browser acceptance journeys, keyboard and responsive checks, build, all automated tests, and independent review.

### Task 5 — Delivery and evidence

Files: `README.md`, `docs/catalog-format.md`, `docs/verification.md`.

- [x] Document setup, publisher authority and format, responsibility mapping, tests, and measured results.
- [x] Record outstanding empirical validation honestly: representative-user study and formal reference hardware/browser/screen-reader acceptance cannot be inferred from automated tests.
- [x] Open local preview and deliver runnable code with concise test results.

## Execution decisions

- The user's reviewed design and direct implementation request authorize proceeding through this plan without another approval gate.
- Use the existing clean checkout on a feature branch so the resulting code remains in the user's workspace.
- Parallelize Tasks 1–3 with disjoint files after defining shared interfaces. Root owns integration and Task 4.
- Keep a single lockfile and dependency owner. Do not commit or push during implementation; user can review the finished result first.
