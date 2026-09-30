# Quarterly — Class Planner

A private browser app for exploring one quarter, choosing linked sections, checking dated conflicts and academic targets, and keeping alternatives. Implements the responsibility boundaries in [`design.yml`](design.yml) and the behavior in [`requirements.md`](requirements.md).

The included Winter and Fall 2026 catalogs are **fictional demonstration data**, not UCLA offerings. This app does not enroll students, reserve seats, fetch transcripts, or certify degree completion.

## Run locally

Use Node.js 22.18 or newer.

```sh
npm ci
npm run dev
```

Open the localhost address printed by Vite. Choose a quarter, name a plan, add courses, and select their lecture/lab components. Changes save automatically in IndexedDB in the current browser profile. Others using that profile can access its plans; clearing browser data may remove them.

```sh
npm run build
npm run preview
```

The production output in `dist/` can be served as a static site. No private-data backend, account service, remote font, analytics, or enrollment integration is used. Serve the app over HTTPS outside localhost so browser storage and Web Crypto are available. Use a consistent origin to retain access to the same profile's plans.

## Verify

```sh
npm test
npx playwright install chromium firefox
npm run test:e2e
```

The browser suite builds and serves the production app on `127.0.0.1:4173`. Unit/integration tests exercise the real domain modules and IndexedDB adapter through `fake-indexeddb`. Browser tests cover planning, export, recovery, catalog adoption, separate profiles, competing tabs, keyboard interaction, layout, and automated accessibility checks. See [`docs/verification.md`](docs/verification.md) for evidence and remaining human acceptance checks.

## Catalog maintenance

```sh
npm run catalog:validate -- path/to/catalog.json
npm run catalog:publish -- path/to/catalog.json public/catalog
```

Publication validates a complete snapshot, stages immutable version content, and atomically replaces the manifest. Invalid input leaves the previous active manifest intact. Run this command only as a maintainer with write authority over the catalog directory. There is no browser publication endpoint.

[`docs/catalog-format.md`](docs/catalog-format.md) documents the JSON representation, time precision, validation, examples, concurrency, and uncertain publication recovery. To publish updated content, supply a new version. Open plans retain their exact old catalog until the student reviews and applies an update.

## Code responsibilities

| Design participant  | Implementation                                  |
| ------------------- | ----------------------------------------------- |
| PlannerView         | `src/ui/`                                       |
| PlanSession         | `src/session/session.ts`                        |
| QuarterPlan         | `src/domain/plan.ts`                            |
| CatalogSnapshot     | `src/catalog/snapshot.ts`                       |
| CatalogBoundary     | `src/catalog/boundary.ts`, `scripts/catalog.ts` |
| CatalogLibrary      | `src/catalog/library.ts`                        |
| InstitutionCalendar | `src/domain/calendar.ts`                        |
| ScheduleEvaluator   | `src/assessment/schedule.ts`                    |
| AcademicEvaluator   | `src/assessment/academic.ts`                    |
| PlanAssessment      | `src/assessment/assessment.ts`                  |
| PlanRepository      | `src/storage/repository.ts`                     |
| ProfileStorage      | `src/storage/profile.ts`                        |
| PlanSummary         | `src/export/summary.ts`                         |

Domain values are immutable. The session accepts complete assessment results only for the current generation; transactional receipts identify the exact saved generation. Student history, personal times, and targets never enter public catalog requests or publication.

## Recovery

- **Save failure:** keep the tab open, retry, or download current inputs. Unsaved edits cannot be promised after closing the session.
- **Competing tab:** explicitly load the newer revision, save an independently named copy, or download current inputs.
- **Catalog outage:** retained catalogs remain usable with a visible freshness notice. First use without a retained catalog offers retry.
- **Changed catalog:** preview before adoption. Canceled/removed selections and invalid unit choices remain visible for correction.
- **Data limits:** 20 saved plans per profile; each plan supports 40 courses, 200 components, 100 personal intervals, 200 history records, and 50 targets. Capacity errors preserve existing data.

A UTF-8 summary includes complete reconstruction inputs and current checks, including unsaved/unresolved values. Import is outside this release.
