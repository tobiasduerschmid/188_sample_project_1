# Quarterly Class Planner — Requirements

**Version:** 1.0

**Date:** September 29, 2026

**Status:** Draft

**Primary user:** A UCLA undergraduate student planning classes for one academic quarter.

## 1. Purpose

A student needs to choose a workable set of classes for a quarter, fit all required class meetings around personal commitments, understand academic constraints, and retain alternatives before enrolling through the institution's registration system.

The system shall support that planning process. Its output is a saved quarter plan with selected courses and sections, a dated schedule, unit totals, and explanations of conflicts, academic checks, and unresolved information.

### 1.1 Scope and assumptions

| ID | Scope or assumption | Consequence |
| --- | --- | --- |
| A-01 | UCLA undergraduates, one-quarter planning, course search, conflicts, prerequisites, student-stated academic requirements, and no enrollment. | Does not assume access to UCLA systems or establish UCLA-specific academic policies. |
| A-02 | An authorized catalog maintainer supplies a versioned catalog snapshot. A live institutional integration is not assumed. | The student can identify the data source and its age. Demonstration data must be visibly labeled. |
| A-03 | Students manually select courses and sections. | Automatic schedule generation and ranking are outside this release. |
| A-04 | Completed coursework and academic targets are entered by the student. | Results describe those inputs; they are not an official transcript evaluation or degree audit. |
| A-05 | Plans are personal to one browser profile on one device. No account or cross-device synchronization is required. | Persistence and privacy promises are limited accordingly and must be explained before the first save. |
| A-06 | Capacity and quality thresholds in this document define acceptance targets. | They are not institutional service commitments. |

These assumptions apply throughout this version. Changes require corresponding updates to requirements and acceptance cases.

## 2. Users, needs, and priorities

| Need | User and context | Desired outcome | Priority |
| --- | --- | --- | --- |
| N-01 | A student choosing among offerings for a quarter | Find relevant courses and understand the complete section commitment. | P0 |
| N-02 | A student balancing classes with other commitments | Identify a schedule with no known meeting or personal-time conflicts. | P0 |
| N-03 | A student checking readiness and academic progress | Understand prerequisites, unit load, progress toward stated targets, and what remains unverified. | P0 |
| N-04 | A student revising a plan before enrollment | Preserve work and retain alternative plans without accidentally changing another plan. | P0 |
| N-05 | A student using a keyboard, assistive technology, or a small screen | Complete the same planning tasks and understand the same warnings. | P0 |
| N-06 | A student consulting an adviser or registering elsewhere | Obtain an understandable summary of the selected plan. | P1 |
| N-07 | A catalog maintainer publishing changed offerings | Supply usable, attributable data without silently destroying student choices. | P0 |

**P0** means essential to trustworthy planning. **P1** means supporting functionality. Both are required for acceptance of this version; priority determines implementation order, not whether a requirement is optional. Catalog identity, section relationships, dated meetings, uncertainty handling, and persistence have the greatest consequences for subsequent implementation decisions.

## 3. Scope

### Included

- Select a quarter and browse a supplied course catalog.
- Search offerings, inspect courses, and choose lectures and required linked sections.
- Build and edit named plans, including personal unavailable times and a target unit range.
- View actual dated meetings, examination meetings when supplied, and unscheduled activities.
- Detect conflicts, incomplete section selections, unknown meeting times, and unavailable sections.
- Check supported prerequisite and corequisite rules against student-entered coursework.
- Show completed and projected progress toward student-defined academic targets.
- Save, duplicate, reopen, and delete plans; download a readable planning summary.
- Validate and publish catalog snapshots through a documented maintainer procedure.

### Excluded

- Enrolling, dropping, joining waitlists, reserving seats, paying fees, or changing institutional records.
- Certifying degree completion, interpreting every degree rule, or guaranteeing enrollment eligibility.
- Automatic transcript access, automatic transfer-credit evaluation, and grade prediction.
- Multi-quarter optimization, automatic schedule generation, course recommendations, and instructor ratings.
- Travel-time estimation between buildings, automatic calendar synchronization, shared editing, and cross-device synchronization.

The planner must label its output as a **plan**, and direct students to the institution's official systems for enrollment and authoritative academic decisions.

## 4. Vocabulary and observable rules

### 4.1 Planning entities

| Term | Meaning |
| --- | --- |
| Quarter | A stable quarter identifier, display name, first and last instructional dates, applicable exam dates, and an institution timezone. |
| Course | A stable academic identity with a code, title, description, units, and academic rules. A course can exist in the catalog without being offered in the selected quarter. |
| Section | A quarter-specific offering of one course component, such as a lecture, laboratory, or discussion. It has a stable identifier, instructors, meeting information, and an availability status. |
| Section bundle | One allowed combination of sections that fulfills all required components of a course offering. The catalog identifies required components and allowed linkages. |
| Plan | A named collection for one quarter containing selected courses/sections, selected variable-unit amounts, unavailable times, a target unit range, coursework history, and academic targets. |
| Meeting occurrence | One dated interval with a start time and end time in the quarter's timezone. Recurring meetings expand to occurrences using their date bounds and supplied exceptions. |
| Unavailable time | A student-entered one-time or recurring interval during which the student does not want class meetings. |
| Academic target | A student-defined target that names eligible courses and requires either a minimum number of distinct courses or a minimum number of units. |

### 4.2 Catalog information

Each published snapshot shall provide a source name, source reference, version, retrieval/publication timestamp, quarter metadata, and the following information:

- **Courses:** identity, subject, code, title, description, fixed or selectable units, and prerequisite/corequisite rules or an explicit unknown status.
- **Offerings:** course identity, quarter, section identifiers and component types, required component counts, allowed linkages, instructors, location/modality, and availability (`open`, `full`, `waitlist`, `canceled`, or `unknown`).
- **Meetings:** either dated/recurring timed meetings, explicitly asynchronous activities, or `time to be announced`. Recurrence includes weekdays, start/end times, date range, and known exceptions. Exam information explicitly states supplied meetings, no exam, or unknown.
- **Equivalences:** canonical course identity for any aliases or cross-listed course codes the source declares equivalent. Equivalence must never be guessed from similar titles.

A blank field is not proof that no restriction, meeting, or examination exists. Source metadata, quarter metadata, course identity/subject/code/title/unit choices, section identity/course/quarter/component relationships, and each required meeting's classification must contain usable values. A timed meeting additionally requires valid dated or recurring intervals. These fields cannot be unknown. Description, instructor, location, modality, availability, academic rules, and exam information may instead carry an explicit unknown value, which is displayed to the student. Equivalence declarations are optional; no declaration means no automatic equivalence.

Every supplied occurrence, including replacements and exams, must lie within the quarter's instruction/exam span. Missing mandatory fields, empty `all of` / `any of` rule expressions, invalid references, and out-of-quarter occurrences reject publication. Unsupported academic rules may be published as source text with a `manual review required` classification.

The maintainer procedure shall document the accepted input representation, required fields, validation failures, and publication result. This document specifies their meaning without choosing an internal representation or a transport technology.

### 4.3 Time and conflict semantics

1. All student-visible times and date inputs use the selected quarter's institution timezone, displayed beside the schedule. The viewing device's timezone does not change class times.
2. A recurring class starts only on matching weekdays within its inclusive first/last dates, excluding supplied cancellations and including explicitly supplied replacement meetings. Recurrence preserves institution-local clock time across daylight-saving changes. Start and end include dates; an overnight interval can end on the following date. Invalid local times or ambiguous daylight-saving times without an explicit offset are rejected with a correction request.
3. An occurrence occupies **[start, end)**. Two intervals conflict exactly when their dated times satisfy `startA < endB` and `startB < endA`, including intervals crossing midnight. Meetings that touch at an endpoint do not conflict.
4. Required lecture, lab, discussion, and supplied exam meetings all participate in conflict detection. A course's required components can conflict with each other.
5. Every active selected class occurrence is checked against every other active selected class occurrence and every personal unavailable interval. Canceled or removed sections retain their last known identifiers/details for explanation but produce no active occurrences. A required canceled or removed component makes the course bundle incomplete until replaced; other active components remain visible and participate in checks. Overlap between two personal intervals alone is not a class conflict.
6. Asynchronous activities contribute units but no timed intervals. A `time to be announced` meeting or unknown exam schedule makes the corresponding time check **unverified**; it does not produce an invented conflict or an all-clear result.
7. Conflicting, full, waitlisted, or incomplete choices may remain in a draft plan. The system flags them and never silently removes or substitutes a student choice.

### 4.4 Academic evaluation semantics

- A coursework record identifies a course, a status (`completed`, `in progress`, or `not completed`), and earned units when completed. A student may mark the list complete for the checks in this plan. Until then, absence of a record means unknown completion, not failure.
- Supported prerequisite rules are explicit `all of` / `any of` expressions over completed course identities. A planned or in-progress course does not satisfy a prerequisite that must have been completed earlier.
- A supported corequisite is satisfied by a completed course or a course selected in this same quarter with a complete section bundle whose sections still exist and are not canceled. Its satisfaction is labeled projected when it depends on the plan.
- For `all of`, any false operand makes the expression unmet; otherwise any unknown operand makes it unverified; otherwise it is met. For `any of`, any true operand makes it met; otherwise any unknown operand makes it unverified; otherwise it is unmet. An explicit `no prerequisite` / `no corequisite` declaration is met. A missing rule is unverified. Empty logical expressions are invalid catalog data.
- For compound corequisites, first evaluate using completed work alone. If that proves the rule, report met. Otherwise evaluate with supported concurrent planned work included; if that proves the rule, report projected. If neither proves the rule, report the unmet or unverified result of the latter evaluation. Each individual unresolved or manual-review condition remains inspectable even if another branch satisfies an `any of` expression.
- Minimum grades, placement scores, instructor consent, academic standing, restrictions, and unrecognized transfer equivalences require manual review unless a future version specifies their input and evaluation rules. The source rule remains visible.
- Each academic target chooses a positive integer count or positive unit threshold and a nonempty set of eligible course identities. Targets apply to completed coursework plus this quarter's selected work; they do not represent an entire degree unless that complete rule set has independently been supplied and is within the supported semantics.
- For each target, **completed contribution** uses completed coursework only. **Projected contribution** includes completed coursework plus eligible selected courses with complete bundles whose sections still exist and are not canceled. A unit target additionally requires resolved units to count that course's units. A count target does not require known unit values. **Remaining** is `max(0, threshold − contribution)`, reported separately for completed and projected work.
- Count each canonical course at most once within a target, even when cross-listed or present in both history and the plan. For a completed course also selected again, use the completed record and its earned units. Retakes do not add projected credit in this release.
- A course may contribute independently to multiple targets. The editor must state this rule before the student saves targets. Institutional rules restricting credit reuse require manual review and cannot be certified by these targets.
- In-progress coursework outside the selected plan is listed but contributes no projected credit. Unmapped history cannot earn credit automatically and remains visible for manual resolution. Relevant missing earned units and unresolved selected units must be shown as unresolved, rather than silently treated as zero.
- Determine each target's status in this order: **met by completed work** if known completed contribution reaches the threshold; otherwise **would be met if planned courses are completed** if known projected contribution reaches it; otherwise **unverified** if history is not declared complete, any history remains unmapped, or relevant missing unit values could affect the result; otherwise **not met**. For an unverified result, show known contributions and label remaining work as provisional. Projected counts are conditional on completing the courses and do not override conflict, availability, or prerequisite warnings.

## 5. Functional requirements and acceptance criteria

Each row is a normative requirement. The acceptance condition supplies the observable pass/fail check, in addition to the shared rules above. “Shall” denotes required behavior.

### 5.1 Quarter and catalog

| ID / need | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-01 / N-01 | On opening the planner, the system shall show available quarters and require quarter selection before creating a plan. | Given two available quarters, selecting one shows only its offerings. With no published quarter, show `No quarter catalog is available` and a retry action; no fictitious courses appear. |
| FR-02 / N-01, N-07 | The system shall show the active catalog source, version, timestamp, and whether data are demonstration data. | A student can inspect these values from the catalog and plan. If the snapshot is more than 24 hours old, a visible notice identifies its age and states that offerings and availability may have changed. |
| FR-03 / N-07 | A catalog maintainer shall be able to validate and publish a complete snapshot without partially replacing the active snapshot. | Duplicate identities, broken links, impossible date/time intervals, invalid units, or missing mandatory fields produce record-specific errors and leave the previous snapshot active. A valid submission becomes one identifiable version. |
| FR-04 / N-01 | The system shall let the student search the selected quarter by course code, title, or instructor and filter by subject and availability status. | Trim the query and use case-insensitive substring matching. A course must match the subject filter and have at least one section satisfying the availability filter and either the query on course code/title or the query on that same section's instructor. Unset filters and an empty query impose no restriction. Order results by course code then stable identity. No matches show `No courses found` and an action to clear filters. |
| FR-05 / N-01, N-03 | Selecting an offering shall reveal its units, all components and permitted section linkages, meeting/exam details, instructors, availability, prerequisites/corequisites, and unknown information. | A course with a lecture and required lab shows both before selection. Each unknown field is labeled; canceled sections remain identifiable but cannot be newly selected. |

### 5.2 Plan construction

| ID / need | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-06 / N-02, N-04 | The student shall be able to create and rename a quarter plan using a nonblank name of 1–80 characters after trimming surrounding whitespace. | Valid input creates an empty plan for the chosen quarter. Blank, oversized, or case-insensitively duplicate names within that quarter receive a field-specific error with no existing plan changed. |
| FR-07 / N-01, N-02 | The student shall be able to add a course and select or replace each required component using only catalog-permitted section combinations. | Adding a lecture with no required lab yet creates an incomplete draft and identifies the missing lab. Choosing an incompatible lab is rejected with its reason. Replacing a lecture retains compatible components and identifies incompatible components for student resolution; it does not silently choose replacements. |
| FR-08 / N-02 | The system shall prevent duplicate course credit and duplicate section selection within a plan. | Re-adding the same course or a catalog-declared alias focuses the existing selection without changing course count or units. A component replacement changes that component rather than creating a second copy. |
| FR-09 / N-02, N-03 | The student shall be able to choose a permitted unit value for a variable-unit course and set, edit, or clear an inclusive target unit range. | A value outside the catalog's permitted values is rejected. A target requires `0 ≤ minimum ≤ maximum ≤ 60`, with values in increments of 0.5. New plans have no unit target; show `No unit target specified` until one is entered. An unresolved variable-unit choice is identified and the total is labeled incomplete. |
| FR-10 / N-03 | After a course or unit change, the system shall show selected units and, when a target is specified, whether the resolved total is below, within, or above its range. | Count each selected course once, including full/waitlisted sections and drafts with unresolved component selection. Exclude a course when any of its selected sections is canceled or removed, explaining the exclusion. Show known units plus unresolved-unit course names when necessary, and do not classify an incomplete total as below/within/above the range. |
| FR-11 / N-02 | The student shall be able to add, edit, and remove personal unavailable intervals with an optional label. | Accept a dated interval or a weekly recurrence bounded by dates in the quarter. Require start before end and dates within the quarter's instruction/exam span. Invalid input shows the failing field and preserves the previous interval. Changes immediately affect conflict results. |
| FR-12 / N-02, N-04 | The student shall be able to remove a selected course, including all its components, without changing unrelated selections. | Removing a course updates meetings, totals, and academic checks together. A visible undo action remains available until the next plan edit or until the plan is closed; undo restores the removed selection and recomputes its checks. |
| FR-13 / N-02 | The system shall keep each plan bound to its original quarter. | Choosing another quarter opens that quarter's plan list and preserves saved plans for the original quarter. No section is silently carried to another quarter. Unsaved edits receive the save-failure protection in FR-26. |

### 5.3 Schedule and diagnostics

| ID / need | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-14 / N-02, N-05 | The system shall provide a weekly schedule and an equivalent chronological text view for every week that contains instruction or supplied exams. | Both views show the same course/component identifiers, dates, times, locations/modalities, and personal intervals. The student can navigate all relevant weeks. Asynchronous and unknown-time activities appear in a separate labeled list. |
| FR-15 / N-02 | After every relevant plan edit, the system shall identify all known conflicts using §4.3. | Every conflicting pair is reported with both names and the affected dates and overlap interval. Repeated occurrences may be grouped only if their dates remain inspectable. Resolving or removing an interval removes its obsolete conflict. |
| FR-16 / N-02, N-05 | The system shall expose a schedule-check summary before the student scrolls the plan, with access to every diagnostic. | At 390×844 and 1280×800 CSS-pixel viewports at 100% zoom, the initial plan viewport shows the conflict count and unverified/incomplete count. Each diagnostic identifies its selections. It uses text or a symbol with a text label, not color alone. |
| FR-17 / N-02, N-03 | The system shall distinguish a completed time check from a check that lacks information. | Show `No known time conflicts` only alongside explicit verification status. Any TBA meeting, unknown exam schedule, or missing component produces `Time check incomplete` and identifies what is missing, even when the known conflict count is zero. |
| FR-18 / N-01, N-03 | The system shall warn about full, waitlisted, canceled, and unknown-availability selections without implying that a seat is reserved. | Full and waitlisted sections can be planned with their status visible. Canceled sections are not newly selectable. A selected section canceled by an update remains visible as unavailable and is excluded from projected credit until replaced. |

### 5.4 Academic inputs and checks

| ID / need | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-19 / N-03 | The student shall be able to add, edit, and delete coursework records and explicitly confirm whether the supplied history is complete for this plan. | Duplicate canonical course records require editing the existing record. Earned units must be nonnegative multiples of 0.5 up to 30; missing units remain unknown. Unrecognized course codes remain visible as unmapped and do not silently match another course. |
| FR-20 / N-03 | The system shall evaluate each selected course's prerequisite and corequisite rules using §4.4 and explain the result. | Each rule reports `met`, `unmet`, `projected`, or `unverified`, names the relevant courses or missing information, and indicates that student-entered history was used. See AT-05 for completed, concurrent, and unsupported-rule cases. |
| FR-21 / N-03 | The student shall be able to create, edit, and delete academic targets with a name, eligible course set, and either a course-count or unit threshold. | Names follow the same length/blank rules as plan names and are unique within the plan. Reject an empty course set or nonpositive threshold. Course-count thresholds must be integers; unit thresholds use increments of 0.5. A count threshold exceeding the number of distinct eligible canonical courses shows that discrepancy and may still be saved. Do not reject a target merely because the current plan fails to meet it. |
| FR-22 / N-03 | The system shall display each target's completed contribution, projected contribution, remaining work, and status according to §4.4. | The student can inspect which courses contributed and why another selected course did not contribute. Conflicted/full courses may appear as conditional projected contributions with their warnings retained; canceled or incomplete bundles do not contribute projected credit. |
| FR-23 / N-03 | The system shall keep separate results for time feasibility, course eligibility checks, unit-range checks, and academic targets. | Passing one category does not clear another category's warning. If no targets exist, show `No academic targets specified`. No state claims that all degree requirements are satisfied or that enrollment is guaranteed. |

### 5.5 Retention, updates, and handoff

| ID / need | Requirement | Acceptance condition |
| --- | --- | --- |
| FR-24 / N-04 | The system shall preserve an edited plan automatically and show whether the latest revision is saving, saved, or unsaved. | A successful edit receives a visible saved acknowledgment within 2 seconds under the reference conditions in §6. After that acknowledgment, closing and reopening the same browser profile restores the latest acknowledged plan, including history and targets. |
| FR-25 / N-04 | The student shall be able to list, reopen, duplicate, and delete saved plans. | Duplicating asks for a valid new name and copies all plan inputs. Edits to either copy leave the other unchanged. Deletion requires confirmation naming the plan; cancellation changes nothing. Successful deletion removes that plan from the list and subsequent normal reopening. |
| FR-26 / N-04 | On a save failure, the system shall preserve the current in-session inputs, display `Changes not saved`, explain the available recovery action, and offer retry and summary download. | A simulated storage denial produces no saved acknowledgment. Switching plans/quarters or deleting the affected plan requires an explicit choice to retry or discard unsaved edits. Do not promise recovery after the user closes a failed session. |
| FR-27 / N-04, N-07 | When a new catalog version becomes available, the system shall present its effect on the open plan before applying it to that plan. | Show changed/removed selected sections, meetings, units, and rules. The student may keep the saved version with a visible older-version notice or apply the new version. Applying retains selection identities, flags missing or incompatible components, and recomputes all checks without silent substitutions. A previously selected unit value that is no longer allowed remains visible as invalid and contributes no known unit value until corrected. Retain removed coursework/target identities as unresolved; do not silently delete their history or target membership. |
| FR-28 / N-04 | The system shall detect competing edits to the same saved plan from separate tabs in the same browser profile. | If one tab has saved a newer revision, an older tab cannot silently overwrite it. Offer to load the newer revision, download the current inputs, or preserve them as a separately named plan. At the saved-plan capacity limit, explain why another copy cannot be saved and retain download as recovery. Loading the newer revision requires confirmation that current unsaved edits will be discarded. |
| FR-29 / N-04, N-06 | The student shall be able to download a UTF-8 text summary of the current plan, including unsaved inputs. | Include the plan name, quarter, timezone, catalog source/version/timestamp, course/section identities and codes, component choices including unresolved choices, variable-unit selections, units, meeting patterns/exceptions, unavailable intervals, unit target or its unset state, all coursework records/statuses/earned units, history-completeness declaration, academic-target definitions and eligible sets, check results, unresolved items, and save state. The summary enables manual reconstruction of the inputs and labels the result as a plan, not enrollment confirmation. Import is outside this version. |

## 6. Quality requirements

**Reference workload:** Up to 5,000 catalog courses and 20,000 sections for a quarter; 40 distinct courses, 200 selected components, 100 personal intervals, 200 coursework records, and 50 academic targets per plan; 20 saved plans per browser profile. A quarter spans at most 20 weeks including exams. Values beyond these limits must produce a specific capacity error and preserve existing data. The limits are acceptance boundaries, not a recommended academic workload.

**Reference client:** A laptop with four CPU cores and 8 GB RAM, using the current stable Chrome or Firefox release at acceptance time; record the tested versions. If a tested operation requires a network, test at 20 Mbps downstream, 5 Mbps upstream, and 100 ms round-trip latency. Browser extensions are disabled. An initialized session has already loaded the selected catalog.

| ID / need | Requirement | Verification |
| --- | --- | --- |
| QR-01 / N-01, N-02 | At least 95% of search/filter operations and plan edits shall show their completed visible results within 1 second in an initialized session at the reference workload. | Time action-to-visible-result across 100 searches and 100 edits, including conflict and academic recomputation. At least 95 of each 100 must meet the threshold; show a pending state until all displayed checks describe the same revision. |
| QR-02 / N-02, N-04 | At least 95% of saved-plan openings shall show the complete schedule and diagnostic summary within 2 seconds after initialization. | Open a maximum-size saved plan 100 times; at least 95 must meet the threshold. An empty/loading placeholder is not a completed result. |
| QR-03 / N-05 | All planning, error recovery, and summary-download actions shall be operable with a keyboard and expose understandable names, states, and errors to assistive technology. | Complete AT-01, AT-02, AT-06, and AT-08 without a pointing device, then with one documented screen-reader/browser combination. Focus remains visible and logical, errors are associated with their input, and updated diagnostics are announced without moving focus away from the edit. |
| QR-04 / N-05 | Planning content shall remain readable and usable at 200% zoom and at a 390 CSS-pixel viewport width; ordinary text shall have at least 4.5:1 contrast against its background. | Inspect all planning and recovery states. Controls and text do not overlap or disappear. A time grid may scroll horizontally, but the equivalent chronological view and all forms require no horizontal scrolling. |
| QR-05 / N-04 | Plans and entered academic information shall not be discoverable through another browser profile, included in public catalog data, or transmitted to an unrelated third party without a student-initiated action. | Create identifiable sample data in profile A and verify it is absent in profile B. Inspect network activity during the acceptance journeys for unauthorized disclosure. The user-facing save explanation states that others using the same browser profile can access its plans and that clearing browser data may remove them. |
| QR-06 / N-04 | A failed edit, catalog update, or save shall not corrupt a previously acknowledged plan revision. | Interrupt each operation before its success acknowledgment, reopen the planner, and verify that the last acknowledged revision or a complete newer acknowledged revision is recoverable, never a mixture of revisions. This promise excludes deliberate browser-data clearing and device loss. |
| QR-07 / N-01, N-02, N-03 | If required catalog data cannot be obtained, the system shall offer retry and use a previously retained snapshot when available, with its age visible. | Simulate catalog failure on first use and after successful use. First use shows the unavailable state. Subsequent use permits inspection/editing against retained data without presenting it as current. |
| QR-08 / N-05 | At least 4 of 5 representative undergraduate first-time users shall independently complete the core planning journey in 10 minutes after at most a one-minute introduction. | Using the supplied acceptance catalog, each finds three named courses, completes their bundles, identifies and resolves one conflict, checks a target, saves, and reopens the plan. Record task completion and errors; the moderator gives no task-specific hints. This is a validation target, not a claimed study result. |

## 7. Acceptance scenarios

These scenarios supplement, rather than replace, the per-requirement acceptance conditions. All identifiers below are **synthetic test data**, not claims about real UCLA courses or offerings.

### 7.1 Shared fixture

Use a fictional quarter in `America/Los_Angeles` with instruction from January 5 through March 13, 2026, and exams from March 16 through March 20. All recurring meetings below span the instructional dates. All courses have fixed units, open availability, known component rules, and explicitly no exam unless overridden by a scenario.

Use source `Synthetic acceptance catalog`, version `fixture-v1`, and a timestamp equal to the test's start time unless testing stale data. All courses have subject `TEST`. Unless a scenario overrides them, instructors are `Instructor Example`, locations are `Room Example`, timed meetings are in person, and no prerequisite, corequisite, or meeting exception applies beyond the rules listed below. Course descriptions equal their synthetic titles. TEST001 has no quarter offering; the open-availability default applies only to listed offerings.

| Course | Units | Components and rules |
| --- | --- | --- |
| TEST101 — Foundations | 4 | Lecture A: Mon/Wed 09:00–10:00; required lab A1: Fri 09:00–10:00. Lecture B: Tue/Thu 09:00–10:00; required lab B1: Fri 10:00–11:00. Only A+A1 and B+B1 are valid bundles. No prerequisites. |
| TEST102 — Methods | 4 | Lecture: Mon/Wed 09:30–10:30. Prerequisite TEST001 completed. |
| TEST103 — Practice | 3 | Lecture: Mon/Wed 10:00–11:00. Corequisite TEST101. |
| TEST104 — Independent Study | 2 | Explicitly asynchronous; no prerequisite. |
| TEST105 — Seminar | 2 | Required meeting time TBA; no prerequisite. |
| TEST001 — Introductory Work | 4 | Catalog course used in completion history; not offered this quarter. |

### AT-01 — Complete the planning journey

**Given** the fixture, a new plan with an 11–15-unit target, completed TEST001 for 4 units, a complete history declaration, and an academic target of 3 distinct courses from TEST101/102/103/104.

**When** the student searches by code/title/instructor, selects TEST101 B+B1, TEST102, and TEST104, and saves.

**Then** the plan contains three distinct courses and 10 selected units, reports below the unit target, has no known time conflicts with a complete time check, reports TEST102's prerequisite met, and reports the academic target would be met if planned courses are completed. Reopening restores those exact inputs and results. The asynchronous course appears outside the time grid.

### AT-02 — Distinguish overlap, adjacency, and date boundaries

**Given** TEST101 A+A1 and TEST102, **then** report conflicts on every shared Mon/Wed date from 09:30 to 10:00.

**When** TEST102 is replaced by TEST103, **then** the 10:00 endpoint creates no lecture conflict.

**When** an unavailable interval is added on January 9 from 09:30 to 10:30, **then** report its overlap with lab A1 from 09:30 to 10:00 on that date only.

**When** two same-weekday meetings are changed to nonoverlapping date ranges, **then** report no conflict between them. An explicit canceled meeting creates no occurrence. An overlapping supplied exam creates a conflict even when the teaching-week schedule is clear.

### AT-03 — Resolve required components and duplicates

**Given** TEST101 A without a lab, **then** identify the missing component and exclude TEST101 from projected target credit.

**When** the student selects B1, **then** reject that incompatible pairing.

**When** A1 is selected, **then** include the complete course once in units and projected credit. Re-adding TEST101 or a declared alias does not duplicate it. Replacing A with B flags A1 for resolution until the student chooses B1.

### AT-04 — Avoid false assurance from unknown data

**Given** TEST104 and TEST105, **then** count four selected units, place TEST104 in the asynchronous list, place TEST105 in the TBA list, and show `Time check incomplete`.

**When** a known course's exam data are changed to unknown, **then** identify that exam uncertainty.

**When** the catalog is older than 24 hours, **then** show its age without inventing updated availability. Neither an empty prerequisite field nor a missing transfer equivalence becomes a passed academic check.

### AT-05 — Evaluate academic rules without certifying a degree

**Given** TEST102 and a complete history declaration but no completed TEST001, **then** its prerequisite is unmet. With no complete-history declaration, it is unverified. Marking TEST001 in progress does not satisfy it; marking it completed does.

**Given** TEST103 with a complete TEST101 bundle in the plan, **then** its corequisite is projected. Removing TEST101 makes it unmet when history is declared complete and contains no completed TEST101.

**Given** an `all of` rule with one unmet and one unknown condition, **then** report unmet. For an `any of` rule with one met condition, report met despite another unknown condition. A minimum-grade rule without supported grade inputs requires manual review.

**Given** a target requiring 8 units from TEST001/101 and completed TEST001, **then** show 4 completed units and 4 remaining. Adding a complete TEST101 bundle changes projected units to 8 and projected remaining to 0. Adding an alias does not increase either value. A conflict in TEST101 retains its warning alongside the conditional academic projection.

### AT-06 — Preserve work during failures and competing edits

**Given** an acknowledged saved plan, **when** the next edit cannot be saved, **then** show `Changes not saved`, retain the edited in-session inputs, and keep the last acknowledged revision recoverable. A summary download contains the unsaved edit and labels it unsaved.

**When** a second tab saves a newer revision, **then** the older tab cannot overwrite it silently and can preserve its version as a new plan. At the 20-plan limit, summary download still preserves all inputs for manual reconstruction before the student chooses to discard them. Duplicate-plan edits leave the original intact. Canceling deletion preserves the plan; confirming deletion removes it.

### AT-07 — Handle catalog changes and timezone differences

**Given** a saved plan and an updated snapshot that cancels a selected section and changes another meeting, **when** the student reviews the update, **then** show both changes before adoption. Keeping the older version preserves its results with an older-version notice. Applying the update retains and marks the canceled choice, removes its active occurrences and the course's projected credit, marks the bundle incomplete, and recalculates conflicts from the new meeting. The canceled section produces no stale conflict warning.

**When** the same plan is viewed from a device set to another timezone, **then** institution-local times remain unchanged. Recurring 09:00 meetings stay at 09:00 across the fixture's daylight-saving transition.

### AT-08 — Handle empty, invalid, and capacity states

**Given** an empty plan, **then** show zero units, no selected courses, no targets specified, and instructions for adding the first course; do not claim academic completion.

**When** a search has no result, a name is blank, an unavailable interval has end before start, or a variable-unit input is outside allowed values, **then** show the relevant specified error and preserve other inputs.

**When** adding a 41st distinct course or a 21st saved plan, **then** name the capacity limit and preserve the existing selections/plans. A malformed catalog publication leaves the previous catalog usable.

An instructor query combined with an `open` filter must not match a course solely because that instructor has a full section and a different instructor has an open section. Clearing a unit target restores `No unit target specified` without changing selected units, and that unset state survives reopening.

## 8. Acceptance, validation, and change control

The version is accepted when every FR and QR acceptance condition passes, AT-01 through AT-08 pass, and the user validation in QR-08 meets its threshold. Record catalog fixture versions, browser versions, measurement conditions, and failures.

Before institutional deployment, validate A-01 through A-06 with representative students and the catalog owner, including available catalog fields, acceptable freshness interval, and the suitability of student-defined academic targets. The specified defaults remain in effect until revised.

Feedback enters this file first. Preserve requirement IDs, record the reason for a behavior change, update affected acceptance cases, and retire superseded requirements explicitly. Keep architectural decisions in a separate design document. An implementation or generated artifact must not silently redefine a requirement.
