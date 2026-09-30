# Implementation verification

The behavioral authority is `requirements.md`; responsibility allocation follows `design.yml`. The application and both public catalogs are runnable locally. Public catalogs are visibly synthetic.

## Verified results — September 29, 2026

- **152 unit/integration tests passed** across 13 files.
- **16 browser acceptance journeys passed** across Chromium 153.0.8010.12 and Firefox 155.0, including automated WCAG checks, keyboard editing/download, recovery, and competing tabs.
- Both browsers passed **100 searches, 100 edits, and 100 maximum-size plan openings** within their specified thresholds. Separate rendering checks verified all 200 class and 80 personal occurrences in the selected week. See [measurement conditions and raw observations](performance-results.md).
- TypeScript checking and the production build passed. The build emits a bundle-size advisory for the approximately 514 kB JavaScript bundle (153 kB gzip); this is not a build failure.

## Automated coverage

| Requirement / design concern                                                                               | Evidence                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| FR-01–05: discovery, attribution, complete admission, exact search, details                                | `catalog.test.ts`, `library.test.ts`, `publisher.test.ts`, browser catalog-outage and adoption journeys                   |
| FR-06–13: immutable valid edits, linked components, duplicates, units, personal times, undo, fixed quarter | `plan.test.ts`, `calendar.test.ts`, `session.test.ts`, browser planning and conflict journeys                             |
| FR-14–18: dated occurrences, exhaustive overlaps, incomplete checks, availability                          | `calendar.test.ts`, `schedule.test.ts`, visible viewport summary and browser conflict journeys                            |
| FR-19–23: entered history, three-valued rules, independent targets and unit totals                         | `academic.test.ts`, `plan.test.ts`, complete browser planning journey                                                     |
| FR-24–28: atomic saves, alternatives, failure recovery, reviewed adoption, competing tabs                  | `repository.test.ts`, `library.test.ts`, `session.test.ts`, browser storage-denial, catalog-adoption and two-tab journeys |
| FR-29: readable export including current unsaved inputs                                                    | `summary.test.ts`, browser download and failed-save recovery                                                              |
| QR-01/02: initialized maximum-workload response time                                                       | Reproducible browser performance test and `performance-results.md`                                                        |
| QR-03/04: accessible controls, diagnostic announcements, responsive layout                                 | Keyboard browser journey, axe WCAG checks, 390×844 viewport checks, increased text-size inspection                        |
| QR-05: profile isolation and private input staying local                                                   | Browser separate-profile and request inspection; public GET-only library contract tests                                   |
| QR-06/07: preserved acknowledged state and retained exact catalog                                          | Transaction-abort/race/corruption tests and browser recovery/offline-catalog journeys                                     |

Tests use the real domain/evaluation modules. IndexedDB unit tests substitute only the physical browser database with `fake-indexeddb`; browser journeys use the browser's actual IndexedDB. Expected academic totals and dates are independently asserted from the acceptance fixture.

Independent review exposed and repaired stale navigation completion, concurrent receipt reconciliation, uncertain duplication, rejected queued renames, stable-identity reuse after catalog updates, invalid fixed-unit correction, malformed stored statuses, complete grouped undo, deep rule evaluation, catalog time-precision handling, overnight rendering, stale catalog review contexts, and aborted-copy name recovery. Each repaired behavior has a targeted regression test or browser journey.

## Reproduce

```sh
npm ci
npm test
npx playwright install chromium firefox
npm run test:e2e
npm run build
```

The browser suite builds the production output before serving it. Development hot reload is excluded from acceptance timing and competing-tab tests. Publication tests use temporary directories and verify the old active manifest after rejection, atomic activation, and read-back of uncertain activation.

## Human acceptance still required

- **QR-08:** recruit five representative first-time undergraduate users. After an introduction of at most one minute, at least four must finish the specified journey independently within ten minutes. No user study was conducted by generating or testing this code.
- **QR-03:** complete AT-01, AT-02, AT-06, and AT-08 with a documented screen-reader/browser combination and a full keyboard-only pass. Automated accessible-name/contrast checks and a keyboard smoke journey are useful evidence, not a substitute for this review.
- **QR-04:** inspect all recovery and planning states at actual browser 200% zoom. Automated narrow-viewport and increased-text-size checks cover representative states.
- **QR-01/02:** repeat the recorded performance procedure on the specified four-core/8 GB reference client and the stable browser releases used for acceptance. Local instrumented measurements document their actual environment and do not certify a different machine.

## Operational boundaries

Saving depends on browser storage being available. Deliberate data clearing, device loss, and closing a failed unsaved session are outside the recovery promise. The retained catalog supports editing when catalog retrieval fails; a full offline app launch is not promised. Unsupported stored schemas are reported and preserved rather than automatically cleared.

Catalog time input has millisecond precision, documented in the input format; finer timestamps are rejected rather than silently rounded. Supported compound academic expressions have no application-imposed depth limit. A browser's physical structured-clone/storage limits can still result in an explicit typed save failure for unusually deep input; no false saved acknowledgment is issued.
