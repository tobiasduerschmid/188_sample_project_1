# Requirements, design, and implementation conformance review

**Date:** September 29, 2026 (America/Los_Angeles)

**Reviewed commit:** `8de9008f452ec97f77a6d89f2be490e58e643412`

**Status:** Open findings; recommended changes have not been implemented.

## Verdict and scope

The implementation is not fully consistent with `requirements.md` and `design.yml`. The audit identified nine behavioral defects, three design-document updates, and outstanding acceptance evidence. Preserve the requirements as the governing specification, repair the behavioral discrepancies, and update the design to accurately describe the implemented responsibilities and verification status.

The requirements SHA-256 matches the baseline recorded in `design.yml`: `c1f68230f0bae6092bcb7a4d4dd88c73fb0f2ebcf2954f0b3d92a57a5fda7214`. The review used the code, existing tests, executable domain/storage probes, React rendering probes, and an isolated Chromium interaction check. All **152 existing unit/integration tests passed** during the audit. Additional probes reproduced the defects below, demonstrating gaps in the existing regression coverage.

This document records findings and proposed repairs. It does not change the requirements, design, application behavior, or acceptance thresholds. Source line references identify the reviewed commit. Every finding below remains open.

## Behavioral changes needed

### CON-001 — Superseded copy receipts leave the session trapped in recovery

**Class:** Defect · **Priority:** High · **Confidence:** High

**Contract:** FR-28; `design.yml` CTR-006 receipt-supersession recovery.

- **Evidence:** [session.ts](../src/session/session.ts), lines 573–576 and 712–715, retain `copyRecovery` and set `reconciling` after reconciliation returns `revision_conflict` or `deleted_plan`. The guards at lines 148–155 and 660–667 then block navigation and new copies. [repository.ts](../src/storage/repository.ts), lines 424–428, cannot recover an earlier receipt after a newer revision replaces it. [App.tsx](../src/ui/App.tsx), lines 305–308, exposes loading the newer revision only for `revision_conflict`.
- **Reproduction:** Commit a duplicate but lose its acknowledgment. In another tab, save a newer revision of that copy before the original tab reconciles. Reconciliation returns `revision_conflict`. Repeated retry, loading a newer revision, making another copy, and switching quarters with explicit discard all remain blocked.
- **Impact:** The student cannot complete the promised competing-edit recovery or leave the session normally, although the source inputs and saved copy still exist.
- **Required change:** Give `PlanSession` an actionable terminal-conflict path that retains the copied identity and source edits, exposes explicit recovery choices, and never replays the superseded write.
- **Verification:** Add a regression using the real repository adapter: lose the copy acknowledgment, advance or delete the copy, reconcile, and complete a supported recovery action while preserving the source draft. Replace the unrealistic recovery assumption in [session.test.ts](../tests/session.test.ts), lines 314–328, where the superseded original receipt later becomes available again.

### CON-002 — Unit uncertainty incorrectly invalidates course-count credit and time checks

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** Requirements §4.4, FR-22, FR-23; `design.yml` line 594 permits count contribution with unresolved units.

- **Evidence:** [snapshot.ts](../src/catalog/snapshot.ts), lines 163–180, includes unit disagreement in general selection issues and makes any issue invalidate bundle completeness. [academic.ts](../src/assessment/academic.ts), lines 210–215, excludes the selection before reaching count-target evaluation. [schedule.ts](../src/assessment/schedule.ts), line 45, also treats the unit-only issue as time-check incompleteness.
- **Reproduction:** Select TEST104 and TEST105 with permitted unit choices 1 and 2. Adopt a catalog making TEST105 equivalent to TEST104. Resolve both retained section alternatives to the same valid TEST104-A bundle while retaining the conflicting units. A target requiring one TEST104 reports projected contribution 0 and `not_met`, with an incomplete-bundle explanation.
- **Impact:** A valid complete course bundle loses count-target contribution and concurrent-course eligibility, and unrelated time checks become incomplete.
- **Required change:** Let `CatalogSnapshot` distinguish component completeness from unit uncertainty. Preserve both original unit choices and their warning while allowing count credit, supported concurrent-course evidence, and complete time checks when the actual bundle is valid.
- **Verification:** Exercise an equivalence merge with matching resolved sections and conflicting units. Assert that count contribution and corequisite projection remain available, unit contribution remains unresolved, and no unit-only time-incompleteness warning appears.

### CON-003 — Reused display codes hide removed-selection diagnostics

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** Requirements §4.3(5), FR-27; `design.yml` line 612 requires preserved unresolved identities.

- **Evidence:** [PlanCourses.tsx](../src/ui/PlanCourses.tsx), line 55, and [CatalogPanel.tsx](../src/ui/CatalogPanel.tsx), line 60, use `resolve`, which also accepts display codes, on stored identities. A missing fact falls through to “Complete section bundle” in `PlanCourses.tsx`, line 97.
- **Reproduction:** Select TEST104/TEST104-A. Adopt a catalog removing that course and section while assigning TEST105 the display code `TEST104`. Domain facts correctly contain removal issues, but rendered output omits them, labels the removed selection complete, and marks unrelated TEST105 as “In plan.”
- **Impact:** The displayed selection state contradicts the preserved identity and the domain assessment.
- **Required change:** Resolve stored references with `resolveId` in both views and avoid interpreting a missing selection fact as completeness.
- **Verification:** Render the adopted plan and catalog after code reuse. Assert that removed-course/section diagnostics remain visible and the unrelated course remains available to add.

### CON-004 — Alias details can contradict the facts used for planning

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** FR-05; `CatalogSnapshot` owns attributable operational course facts.

- **Evidence:** [boundary.ts](../src/catalog/boundary.ts), around line 430, validates the alias reference without reconciling its operational metadata. [snapshot.ts](../src/catalog/snapshot.ts), lines 48 and 58, uses canonical facts for planning but returns raw alias records for search. [CatalogPanel.tsx](../src/ui/CatalogPanel.tsx), lines 167–180, displays the raw alias units, components, and rules.
- **Reproduction:** Add ALIAS → TEST101 with 9 units, one lecture, and instructor permission. Canonical TEST101 has 4 units, lecture plus lab, and no prerequisite. Admission succeeds. The listing shows the alias metadata, but adding the course applies the canonical metadata.
- **Impact:** Students cannot rely on the course details shown before making a selection.
- **Required change:** Document the alias operational-field policy in `design.yml` and apply it consistently. Either reject contradictory operational fields during catalog admission or display canonical operative facts while preserving the alias's identifying code/title.
- **Verification:** Publish or reject the contradictory-alias fixture according to the chosen policy. For every accepted alias, assert agreement between displayed details and the units, bundle requirements, and academic rules actually evaluated.

### CON-005 — Catalog identity conflicts bypass usable retained fallback

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** QR-07; `design.yml` CTR-002 retained-fallback behavior.

- **Evidence:** [library.ts](../src/catalog/library.ts), lines 285–286, immediately returns `catalog_identity_conflict`, bypassing retained fallback at lines 295–305.
- **Reproduction:** Retain valid quarter/version V. Serve different valid content under the same quarter/version with a matching new digest. `load(quarter)` fails, although `load(quarter, originalRef)` still returns the intact retained snapshot.
- **Impact:** Normal quarter selection cannot use available known-good data when the public catalog violates immutable-version identity.
- **Required change:** Keep rejecting the replacement bytes, preserve immutable storage, and offer the applicable retained snapshot with an explicit identity-conflict/freshness warning. Exact-version requests must continue to honor the requested reference.
- **Verification:** Extend [library.test.ts](../tests/library.test.ts), lines 149–175, to verify usable retained fallback and unchanged retained bytes, rather than only expecting outright failure.

### CON-006 — Catalog previews omit the proposed changed values

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** FR-27; `CatalogLibrary`'s complete adoption-impact responsibility.

- **Evidence:** [library.ts](../src/catalog/library.ts), lines 334–343 and 359–372, emits category notices such as “class meetings changed” and “prerequisite rule changed.” [App.tsx](../src/ui/App.tsx), lines 439–442, renders only those strings.
- **Reproduction:** Change TEST102's meeting to January 5, 14:00–15:00, and remove its prerequisite. The preview identifies the two changed categories but does not expose the proposed date/time or new prerequisite declaration before adoption.
- **Impact:** The student must apply the catalog to learn the actual effect on the plan.
- **Required change:** Have `CatalogLibrary` supply structured before/after facts and have `PlannerView` display relevant meeting/exam, unit, rule, and linkage changes before confirmation. Preserve the existing preview identity/fingerprint safeguards.
- **Verification:** Assert actual proposed values in the preview and rendered UI. Verify that keeping the old catalog preserves the current plan and that applying uses the exact reviewed version.

### CON-007 — Empty recurrence expansion bypasses offset and interval validation

**Class:** Defect · **Priority:** Medium · **Confidence:** High

**Contract:** FR-03, FR-11; institution-calendar validation of valid local times and start-before-end intervals.

- **Evidence:** [calendar.ts](../src/domain/calendar.ts), lines 161–170, strips offsets for clock validation and skips the ordering check when offsets are present. Full validation occurs only when an occurrence is added at line 196.
- **Reproduction:** Define a Monday recurrence bounded to Tuesday, January 6, 2026. Either `09:00-08:00 → 08:00-08:00` or `09:00+99:00 → 10:00+99:00` returns success with no occurrences. Personal-time editing and catalog admission both accept it.
- **Impact:** Invalid input is accepted because no occurrence happens to trigger validation.
- **Required change:** Validate offset syntax and interval ordering independently of recurrence expansion. Preserve valid daylight-saving fall-back intervals whose different offsets make a reversed wall-clock interval positive.
- **Verification:** Reject both malformed examples without changing the prior plan or active catalog. Retain valid empty recurrences and valid offset-disambiguated daylight-saving intervals.

### CON-008 — Multi-day weekly meetings display the wrong end-day offset

**Class:** Defect · **Priority:** Low · **Confidence:** High

**Contract:** FR-05 and the institution-local meeting-detail semantics.

- **Evidence:** [shared.tsx](../src/ui/shared.tsx), line 136, renders every positive `endDayOffset` as `(+1 day)`.
- **Reproduction:** An admitted weekly meeting starts January 5 at 09:00 with `endDayOffset: 2` and end time 10:00. The calendar correctly expands it through January 7 at 10:00, while the details say `(+1 day)`.
- **Impact:** The displayed duration contradicts the actual dated interval used for scheduling.
- **Required change:** Render the actual offset, including appropriate singular/plural wording, for every accepted value.
- **Verification:** Compare details with expanded occurrences for offsets 0, 1, and 2, including a meeting crossing a displayed week boundary.

### CON-009 — Repeated duplicate-course actions fail to move focus

**Class:** Defect · **Priority:** Low · **Confidence:** High

**Contract:** FR-08 requires re-adding an existing course or alias to focus its selection.

- **Evidence:** [PlanCourses.tsx](../src/ui/PlanCourses.tsx), lines 21–26, triggers focus only when `focusId` changes.
- **Reproduction:** Add TEST101, then activate “Focus TEST101 in plan.” Focus moves to its selected-course article. Move focus back to search and activate the same button again without an intervening accepted edit. Focus remains on the button. This was reproduced in an isolated Chromium session.
- **Impact:** An explicitly labeled focus action becomes ineffective after its first use.
- **Required change:** Represent focus requests as repeatable events, for example with a request sequence, rather than relying only on a changed course identity.
- **Verification:** Activate the same focus action repeatedly and through an alias. Every activation must focus the existing selected course without changing plan contents.

## Design-document changes needed

### DOC-001 — Update implementation and verification status

**Class:** Documentation conflict · **Priority:** Medium

`design.yml` still says implementation/runtime verification have not occurred at [line 998](../design.yml), says runtime tests have not run at line 1306, and describes corresponding risks as awaiting an implementation at lines 1375–1385.

Update the current realization and verification status, identify the implementation commit and actual stack, and link [verification evidence](verification.md) and [performance results](performance-results.md). Preserve the historical scope of the original design review and distinguish completed automated checks from outstanding acceptance work. Do not mark the product accepted while the behavioral findings and required validation remain open.

**Completion check:** Every current-status statement agrees with the implementation and dated evidence; historical review statements are clearly identified as historical.

### DOC-002 — Reconcile the collaborator graph and responsibility allocation

**Class:** Documentation/implementation conflict · **Priority:** Medium

The dependency rule in `design.yml`, line 133, permits only declared collaborators. `PlannerView` lists only `PlanSession` at line 149, and the session is documented as owning the exporter collaboration at line 177. Actual views call `CatalogSnapshot` directly, while [App.tsx](../src/ui/App.tsx), lines 54–67, calls `downloadSummary` and handles download errors. The view also computes source age at lines 76–79, while the design assigns catalog freshness knowledge and an injected clock to `CatalogLibrary`.

Document these actual read-only catalog and export collaborations, the ownership of freshness presentation, and the static versus injected capabilities in the composition. Alternatively, move the implementation behind the currently declared boundaries. Update affected responsibilities and collaboration stories together; retain domain judgments in their authoritative modules.

**Completion check:** Trace catalog search, freshness display, summary capture, download, and download failure. Each actual call and decision has a declared collaborator and owner.

### DOC-003 — Correct the search-index implementation claim

**Class:** Documentation conflict · **Priority:** Low

`design.yml`, line 1061, states that normalized search indexes are built once after catalog admission. [snapshot.ts](../src/catalog/snapshot.ts), lines 58–77, scans course records and normalizes strings during each search. Identity and offering indexes do exist.

Describe the implemented search strategy accurately, or implement and verify the proposed normalized search index. Preserve FR-04's same-section instructor/availability matching and deterministic ordering.

**Completion check:** The design's performance-mechanism description agrees with the code and the measured workload.

## Acceptance evidence still needed

These are evidence gaps. They do not independently establish that the implementation fails the associated quality requirement.

| ID      | Requirement  | Missing evidence and completion condition                                                                                                                                                                                                                                                                                                                                      |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| VER-001 | FR-24        | Measure user-action-to-visible-durable-save acknowledgment against the two-second requirement at the reference workload. The current [performance test](../tests/e2e/performance.spec.ts), lines 232–235, waits up to 30 seconds for a saved label outside the edit timing endpoint. Add a dedicated timing assertion and record results, including failure/recovery behavior. |
| VER-002 | QR-01, QR-02 | Repeat timing acceptance on the specified four-core, 8 GB client with documented stable Chrome/Firefox versions and applicable network conditions. Existing measurements use an M4 Max with 36 GiB RAM and explicitly identified test-browser builds.                                                                                                                          |
| VER-003 | QR-03        | Complete AT-01, AT-02, AT-06, and AT-08 with keyboard-only interaction and a documented screen-reader/browser combination. Record focus, names/states, error associations, and announcements. Existing keyboard smoke and automated accessibility checks cover only part of this obligation.                                                                                   |
| VER-004 | QR-04        | Inspect every planning and recovery state at actual 200% browser zoom and at 390 CSS-pixel width. Record readability, contrast, and overflow. Increased root text size is only partial evidence.                                                                                                                                                                               |
| VER-005 | QR-08        | Run the specified study with five representative first-time undergraduate users: at most a one-minute introduction, no task-specific hints, and at least four independent completions within ten minutes. Record times, completions, and errors.                                                                                                                               |

## Recommended repair sequence

1. Repair CON-001's blocked recovery path and add a real-repository regression.
2. Repair canonical identity, unit/category separation, and alias operational-fact consistency in CON-002 through CON-004.
3. Repair retained fallback and reviewable adoption details in CON-005 and CON-006.
4. Repair temporal validation, meeting text, and repeated focus in CON-007 through CON-009.
5. Update DOC-001 through DOC-003 to describe the resulting implementation and preserve its requirements baseline.
6. Add the missing save-acknowledgment timing check, rerun affected tests and browser journeys, and collect VER-002 through VER-005 acceptance evidence.

Close each finding only after its stated verification succeeds. Any proposed change to externally visible scope or acceptance thresholds must first follow the change-control process in `requirements.md`; changing the documents to excuse a reproduced defect is not a repair.
