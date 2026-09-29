# Worked RDD slice: course registration

This example extends the course-registration problem used to discover responsibilities in *Object Design*, Chapter 4, pp. 113–117. It is a compact conceptual design, not a claim about a particular university's implementation.

## 1. Context and boundary

**Slice:** an authenticated student submits a proposed term schedule, receives policy results and nonblocking time-conflict warnings, receives a temporary all-or-nothing seat reservation, and confirms it before expiry.

**In scope:** schedule evaluation, seat reservation, confirmation, result presentation, timeout cleanup, and an ambiguous remote-reservation outcome.

**Outside the slice:** authentication, wait-list ranking, tuition/payment, advisor exception approval, add/drop after registration, degree audit, catalog authoring, and the internals of institutional record and roster systems.

**Exercise evidence:**

| ID | Established premise | Source |
| --- | --- | --- |
| `EVD-REG-001` | A student submits a term schedule and needs an intelligible registration outcome. | Course-registration seed in the source book, Chapter 4, pp. 113–117 |
| `EVD-REG-002` | Blocking policy rules, nonblocking conflict warnings, provisional all-or-none seat reservation, confirmation, and status recovery define this worked slice. | Skill-created exercise brief |

**Assumptions:**

| ID | Assumption | Design consequence | Revisit trigger |
| --- | --- | --- | --- |
| `ASM-REG-001` | The actor is authenticated and authorized to act for one student. | Authentication stays outside the slice; the Portal must preserve identity binding. | Delegated or shared registration is added. |
| `ASM-REG-002` | Time conflicts warn; prerequisites, credit load, holds, and required approvals block. | Schedule owns warnings; Policy owns blocking decisions. | Registrar supplies different semantics. |
| `ASM-REG-003` | Seat capacity is authoritative in a separately operated roster system. | No core participant copies seat authority. | Roster ownership changes. |
| `ASM-REG-004` | The roster can reserve all requested seats atomically for a short time or reserve none. | The core may promise an all-or-none provisional offer. | Provider contract disproves atomic reservation. |
| `ASM-REG-005` | Policy facts can be read consistently enough for one evaluation attempt. | One versioned evaluation snapshot is meaningful. | Consistency limits or policy changes invalidate the snapshot. |
| `ASM-REG-006` | A registrar or program administrator approves the program/term policy configuration before registration opens. | Policy-selection authority is visible without adding policy authoring to this runtime slice. | Governance assigns configuration approval to another role or permits runtime changes. |

### Actors, external systems, and authority

| ID | Element | Boundary status and authority | System-facing path | Evidence/assumption |
| --- | --- | --- | --- | --- |
| `ACT-REG-001` | Student | External initiating actor. Owns schedule and confirmation intent; does not establish eligibility, seat availability, or roster membership. | Uses `CAN-REG-001`; authenticated identity is supplied under `ASM-REG-001`. | `EVD-REG-001`, `ASM-REG-001` |
| `ACT-REG-002` | Registrar or program administrator | External configuration authority for the approved program/term policy set; not a participant in an individual registration attempt. | Supplies approved configuration to `CAN-REG-008` before the term opens. | `ASM-REG-006`, `HOT-REG-001` |
| `EXT-REG-001` | Institutional academic-record system | External authority for standing, transcript, holds, and recorded approvals. | Reached only through `CAN-REG-005`; the core consumes versioned snapshots. | `ASM-REG-005` |
| `EXT-REG-002` | Institutional course-catalog system | External authority for section identity, meeting patterns, credits, capacity identity, and prerequisites. | Reached only through `CAN-REG-006`; catalog protocols remain outside the core. | `EVD-REG-002`, `ASM-REG-005` |
| `EXT-REG-003` | Institutional roster system | Separately operated external authority for provisional reservations and committed roster membership. | State-changing requests and status queries cross `CAN-REG-007`; no other participant writes seat state. | `ASM-REG-003`, `ASM-REG-004` |

## 2. System story and themes

### Design story

Students build schedules interactively, but registration must preserve institutional rules and scarce seat capacity. A submitted proposal should produce an understandable answer: blocking policy failures, nonblocking time-conflict warnings, or a temporary offer whose seats are held long enough for confirmation. The student must never be told registration succeeded when only part of the schedule was committed.

The difficult parts are keeping policy decisions separate from coordination, crossing unreliable institutional boundaries without duplicating authoritative facts, and handling the interval between evaluation and confirmation. Enrollment rules vary by program and term; seat capacity and final roster membership remain owned by the roster system. The design should localize those variations and leave each failed attempt in a predictable state.

### Themes

| ID | Theme | Consequence for the search |
| --- | --- | --- |
| `THM-REG-001` | Explainable eligibility | Look for a policy decision role, not conditionals in a workflow controller. |
| `THM-REG-002` | Scarce-seat integrity | Give atomic reservation and commit to the authoritative roster boundary. |
| `THM-REG-003` | Provisional lifecycle | Represent proposal, reservation, expiry, and confirmation explicitly. |
| `THM-REG-004` | Institutional boundaries | Protect the core from record, catalog, and roster protocols and failures. |
| `THM-REG-005` | Rule variation | Isolate program/term policy without making the entire workflow configurable. |

## 3. Design-free scenario catalog

| ID | Scenario | Trigger | Required actor-visible outcome | Evidence/assumptions |
| --- | --- | --- | --- | --- |
| `SCN-REG-001` | Evaluate a proposed schedule | Authenticated `ACT-REG-001` submits one term's selections. | Warnings plus either explained ineligibility, unavailable seats, or an expiring all-or-none offer. | `EVD-REG-001`, `EVD-REG-002`, `ASM-REG-001`–`005` |
| `SCN-REG-002` | Blocking policy failure | Evaluation finds a violated blocking rule. | Student receives stable rule identifiers and explanations; no seat mutation occurs. | `ASM-REG-002` |
| `SCN-REG-003` | Seats unavailable | Eligible proposal cannot reserve every requested seat. | No partial hold is presented as success; unavailable result is explicit. | `ASM-REG-003`, `ASM-REG-004` |
| `SCN-REG-004` | Confirm an active offer | `ACT-REG-001` confirms before expiry. | Roster membership commits once and the student receives an authoritative result. | `EVD-REG-002` |
| `SCN-REG-005` | Ambiguous remote outcome | Reservation or commit times out after the provider may have acted. | The system resolves status or reports pending resolution; it never guesses or duplicates the effect. | `ASM-REG-003`, `ASM-REG-004` |
| `SCN-REG-006` | Recover a lost presentation result | A committed result is not delivered to `ACT-REG-001`'s session. | The student can query and receive the authoritative attempt status without repeating registration. | `EVD-REG-002` |

These are stakeholder-facing scenarios. The `COL-REG-*` stories later describe the internal design that fulfills them.

## 4. System responsibilities

Each system obligation has one accountable conceptual owner. Supporting collaborators remain visible in the RSP and traceability columns; they do not dilute accountability.

| ID | System obligation | Source/evidence | Observable acceptance condition | Criticality | Accountable owner | Owning/supporting RSP | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SYS-REG-001` | Accept an authenticated student's proposed schedule for one term. | `SCN-REG-001`, `EVD-REG-001`, `ASM-REG-001` | A valid submission creates or reuses one attempt bound to authenticated identity, student, and term; malformed input is rejected before core work or seat mutation. | Core | `CAN-REG-001` | `RSP-REG-001`, `RSP-REG-003` | Assigned |
| `SYS-REG-002` | Identify and explain blocking eligibility failures. | `SCN-REG-002`, `ASM-REG-002` | The result is eligible or contains stable failed-rule identifiers and explanations; a blocking failure causes no reservation request. | Core | `CAN-REG-004` | `RSP-REG-012`, `RSP-REG-013`; supported by `RSP-REG-014`, `RSP-REG-015`, `RSP-REG-020` | Assigned |
| `SYS-REG-003` | Identify time conflicts as warnings without silently converting them into blockers. | `SCN-REG-001`, `ASM-REG-002` | Every overlap in the versioned selection snapshot is reported as a warning, and warning presence alone does not make the proposal ineligible. | Supporting | `CAN-REG-002` | `RSP-REG-005`; supported by `RSP-REG-015` | Assigned |
| `SYS-REG-004` | Provisionally reserve every requested seat as one unit or reserve none. | `SCN-REG-003`, `ASM-REG-003`, `ASM-REG-004` | The authoritative result contains a reservation covering every requested section with an expiry, or an explicit none-reserved outcome; no partial offer is exposed. | Core | `ROL-REG-002` played by `CAN-REG-007` | `RSP-REG-016` | Assigned |
| `SYS-REG-005` | Commit an active reservation exactly once when the student confirms. | `SCN-REG-004`, `EVD-REG-002` | One active reservation produces one authoritative committed membership result; replay returns that canonical result without a second enrollment effect. | Core | `ROL-REG-002` played by `CAN-REG-007` | `RSP-REG-017`; coordinated by `RSP-REG-009` | Assigned |
| `SYS-REG-006` | Release or expire abandoned reservations and contain partial or ambiguous outcomes. | `SCN-REG-005`, `ASM-REG-003`, `ASM-REG-004` | An abandoned attempt ends released/expired, or remains explicitly `pending-resolution` while authoritative status is queried; the core never guesses, exposes a partial success, or blindly repeats a state-changing request. | Core | `CAN-REG-003` | `RSP-REG-011`; supported by `RSP-REG-018`, `RSP-REG-019` | Assigned |
| `SYS-REG-007` | Return an intelligible result and a predictable final state for every supported outcome. | `SCN-REG-001`–`006`, `EVD-REG-002` | Every supported path ends in a named attempt state and an actor-visible result that preserves domain meaning, including an explicit pending state when authority is unresolved. | Core | `CAN-REG-003` | `RSP-REG-010`, `RSP-REG-021`; presented through `RSP-REG-002` | Assigned |
| `SYS-REG-008` | Preserve authoritative ownership of academic facts, course facts, and seat state. | `EVD-REG-002`, `ASM-REG-003`–`005`, `EXT-REG-001`–`003` | Decisions retain source/version provenance; only `EXT-REG-003` changes reservation or membership state, and no core replica is presented as institutional authority. | Core | `CAN-REG-003` | `RSP-REG-023`; supported by `RSP-REG-014`–`RSP-REG-019` | Assigned |
| `SYS-REG-009` | Let the student recover the authoritative outcome of an existing attempt without resubmitting it. | `SCN-REG-006`, `EVD-REG-002` | A status query returns the stored terminal result or resolves/returns the explicit pending state without invoking reserve or commit. | Core | `CAN-REG-003` | `RSP-REG-021`; presented through `RSP-REG-022` | Assigned |

## 5. Candidate disposition

### Accepted

| ID | Candidate | Purpose and stereotype blend | Why it survives |
| --- | --- | --- | --- |
| `CAN-REG-001` | Registration Portal | Translates student intentions and presents results; **user interfacer**. | Protects the core from UI/session vocabulary without owning registration policy. |
| `CAN-REG-002` | Proposed Schedule | Represents one student's term selections and legal lifecycle; **information holder, structurer, service provider**. | Keeps selection-related behavior and lifecycle invariants with the information they govern. |
| `CAN-REG-003` | Registration Coordinator | Sequences evaluation, reservation, confirmation, and cleanup; **coordinator**. | One event-driven control center is useful, but it delegates policy and capacity decisions. |
| `CAN-REG-004` | Enrollment Policy | Decides whether a proposal satisfies blocking rules and explains failures; **service provider, controller**. | Owns a cohesive, explainable decision and the primary hot spot. |
| `CAN-REG-005` | Academic Record Source | Supplies an authoritative academic-standing snapshot from `EXT-REG-001`; **external interfacer, information provider**. | Prevents policy code from depending on record-system protocols or copied facts. |
| `CAN-REG-006` | Course Catalog | Supplies authoritative section, meeting, prerequisite, and credit facts from `EXT-REG-002`; **information holder, external interfacer**. | Gives course facts one system-facing boundary owner and shields the core from catalog representation. |
| `CAN-REG-007` | Seat Reservation Gateway | Provisionally reserves, commits, releases, and resolves status at `EXT-REG-003`; **external interfacer, service provider**. | Encapsulates the state-changing trust boundary and its atomicity/idempotency contract without claiming roster authority. |
| `CAN-REG-008` | Enrollment Policy Selector | Supplies the policy realization approved by `ACT-REG-002` for a program and term; **information holder, service provider**. | Gives hot-spot selection one owner and rejects missing or invalid configuration instead of choosing an arbitrary default. |

### Rejected or deferred

| ID | Disposition | Candidate | Reason | Responsibilities moved or trigger to revisit |
| --- | --- | --- | --- | --- |
| `CAN-REG-009` | Rejected | `RegistrationManager` | Name and purpose are vague; it would combine policy, capacity, coordination, UI, and recovery. | Split among `CAN-REG-003`, `CAN-REG-004`, `CAN-REG-007`, and `CAN-REG-001`. |
| `CAN-REG-010` | Rejected | Rich `Student` object | This slice needs authenticated identity and an academic snapshot, not a complete model of a person. | Identity is input; academic facts come from `CAN-REG-005`. Revisit if student-owned behavior appears. |
| `CAN-REG-011` | Rejected | `TimeConflictChecker` | One small helper would separate behavior from the schedule information it evaluates. | `CAN-REG-002` owns conflict reporting using catalog section facts. |
| `CAN-REG-012` | Rejected | Active `Course` and `Section` objects | No distinct behavior is required in this slice beyond authoritative catalog facts. | Use meaningful immutable section facts from `CAN-REG-006`; revisit if course/section behavior appears. |
| `CAN-REG-013` | Deferred | `Wait-list Coordinator` | Wait-list semantics, fairness, and lifecycle are explicitly out of scope. | Revisit with a separate story and policy when requirements exist. |
| `CAN-REG-014` | Deferred | `Approval Workflow` | Exceptions requiring advisor/dean approval occur outside ordinary registration. | Revisit when approval states, actors, and timing are specified. |
| `CAN-REG-015` | Deferred | `Notification Dispatcher` | The slice promises an on-screen/queryable result only. | Add if durable email/SMS delivery becomes a requirement. |

### Role catalog

| ID | Role | Client vocabulary and public responsibilities | Players | Interchangeability basis |
| --- | --- | --- | --- | --- |
| `ROL-REG-001` | Enrollment Policy Provider | Decide and explain blocking eligibility (`RSP-REG-012`, `RSP-REG-013`) under `CTR-REG-004`. | `CAN-REG-004` represents the current policy family; concrete program/term realizations remain implementation choices. | Three evidenced program/term cases vary while preserving one decision contract. |
| `ROL-REG-002` | Seat Reservation Provider | Reserve, commit, release, and resolve authoritative roster status (`RSP-REG-016`–`019`). | `CAN-REG-007` | The core depends on the institutional responsibility contract, not its transport or vendor protocol. |

## 6. Responsibility model

| ID | Owner | Kind | Responsibility |
| --- | --- | --- | --- |
| `RSP-REG-001` | Registration Portal | Do | Translate valid student input into a proposed-schedule submission or confirmation intention. |
| `RSP-REG-002` | Registration Portal | Do | Present offers, warnings, policy failures, pending outcomes, and confirmed results without changing their meaning. |
| `RSP-REG-003` | Registration Portal | Decide | Reject malformed boundary requests and preserve the binding among authenticated identity, attempt ID, student, and term. |
| `RSP-REG-004` | Proposed Schedule | Know | Maintain student, term, selections, grading options, and current registration-attempt state as one coherent proposal. |
| `RSP-REG-005` | Proposed Schedule | Do | Report time overlaps among selected section facts as nonblocking warnings. |
| `RSP-REG-006` | Proposed Schedule | Decide | Permit only valid lifecycle transitions: proposed → evaluated → reserved → confirmed, or a named failed/expired state. |
| `RSP-REG-007` | Proposed Schedule | Know | Provide a stable evaluation snapshot and retain the resulting decision and reservation reference for this attempt. |
| `RSP-REG-008` | Registration Coordinator | Do | Coordinate proposal enrichment, schedule assessment, eligibility evaluation, and provisional reservation. |
| `RSP-REG-009` | Registration Coordinator | Do | Coordinate confirmation of an unexpired reservation and report the final result. |
| `RSP-REG-010` | Registration Coordinator | Decide | Select the next path from typed policy, seat, timeout, and status outcomes. |
| `RSP-REG-011` | Registration Coordinator | Do | Coordinate expiration, ambiguous-outcome resolution, release, and escalation for an attempt. |
| `RSP-REG-012` | Enrollment Policy | Decide | Determine whether an evaluation snapshot satisfies the applicable blocking enrollment rules. |
| `RSP-REG-013` | Enrollment Policy | Know | Explain each failed rule in institutional vocabulary and identify any approval requirement. |
| `RSP-REG-014` | Academic Record Source | Know | Supply an authoritative, versioned snapshot of standing, transcript, holds, and recorded approvals relevant to one term. |
| `RSP-REG-015` | Course Catalog | Know | Supply authoritative section facts for the requested term, including meeting patterns, credits, capacity identity, and prerequisites. |
| `RSP-REG-016` | Seat Reservation Gateway | Do | Provisionally reserve all requested seats for an attempt or reserve none. |
| `RSP-REG-017` | Seat Reservation Gateway | Do | Commit an active reservation exactly once and return the authoritative registration result. |
| `RSP-REG-018` | Seat Reservation Gateway | Do | Release or expire a provisional reservation without altering a committed registration. |
| `RSP-REG-019` | Seat Reservation Gateway | Know | Resolve the authoritative status of an attempt after a timeout or duplicate request. |
| `RSP-REG-020` | Enrollment Policy Selector | Decide | Supply the approved `ROL-REG-001` realization for the proposal's program and term, or reject unavailable/invalid selection. |
| `RSP-REG-021` | Registration Coordinator | Know/Do | Resolve and provide the authoritative current outcome for an existing registration attempt without resubmitting it. |
| `RSP-REG-022` | Registration Portal | Do | Accept an attempt-status query and present the authoritative result without initiating registration again. |
| `RSP-REG-023` | Registration Coordinator | Do | Preserve institutional authority by obtaining versioned academic and catalog facts and roster outcomes only through their designated boundary roles, retaining provenance with the attempt. |

### Ownership summary

| Consequential item | Authoritative owner |
| --- | --- |
| Proposal selections and attempt lifecycle | `CAN-REG-002` |
| Academic standing/transcript/holds | `EXT-REG-001` through `CAN-REG-005` |
| Course and meeting facts | `EXT-REG-002` through `CAN-REG-006` |
| Eligibility decision semantics | `CAN-REG-004` |
| Seat reservation and roster membership | `EXT-REG-003` through `CAN-REG-007` |
| Scenario sequencing and recovery choice | `CAN-REG-003` |
| Presentation meaning | `CAN-REG-001`, constrained not to reinterpret domain outcomes |
| Program/term policy approval and selection | `ACT-REG-002` approves; `CAN-REG-008` supplies `ROL-REG-001` |
| Current attempt outcome exposed to the actor | `CAN-REG-003` through `RSP-REG-021`; presented by `CAN-REG-001` through `RSP-REG-022` |

## 7. Compact CRC model

| Candidate | Purpose | Responsibilities | Collaborators and requested help |
| --- | --- | --- | --- |
| Registration Portal | User-facing translation boundary | `RSP-REG-001`–`RSP-REG-003`, `RSP-REG-022` | Coordinator: evaluate/confirm/query; receives results for presentation. |
| Proposed Schedule | Coherent proposal and lifecycle owner | `RSP-REG-004`–`RSP-REG-007` | Catalog facts supplied during enrichment; no knowledge of external protocols. |
| Registration Coordinator | Delegated control center | `RSP-REG-008`–`RSP-REG-011`, `RSP-REG-021`, `RSP-REG-023` | Catalog: describe sections; Policy: decide eligibility; Seats: reserve/commit/status/release; Schedule: warnings/state. |
| Enrollment Policy | Explainable blocking-rule decision | `RSP-REG-012`, `RSP-REG-013` | Academic Record Source: authoritative student facts; consumes the schedule/catalog snapshot. |
| Academic Record Source | Record-system boundary | `RSP-REG-014` | `EXT-REG-001` is authoritative and private behind this role. |
| Course Catalog | Catalog boundary and course-fact owner | `RSP-REG-015` | `EXT-REG-002` storage and protocol are private. |
| Seat Reservation Gateway | Roster mutation and ambiguity boundary | `RSP-REG-016`–`RSP-REG-019` | `EXT-REG-003` is authoritative; Coordinator supplies attempt identity and requested sections. |
| Enrollment Policy Selector | Approved policy-selection owner | `RSP-REG-020` | Supplies one `ROL-REG-001` player from configuration approved by `ACT-REG-002`; rejects invalid selection. |

## 8. Neighborhoods and visibility

| ID | Neighborhood | Collective responsibility | Contained participants | Public face and allowed paths | Authority, trust, and hidden internals |
| --- | --- | --- | --- | --- | --- |
| `NBR-REG-001` | Interaction | Translate `ACT-REG-001` intent and present outcomes without changing their meaning. | `CAN-REG-001` | `ACT-REG-001` → Portal → `NBR-REG-002`; the Portal may request evaluate, confirm, or status only. | Browser input is untrusted. Web events, formatting, and session state are hidden; authentication remains outside the slice. |
| `NBR-REG-002` | Registration core | Turn a proposal into an eligibility, reservation, confirmation, or recovery outcome. | `CAN-REG-002`, `CAN-REG-003`, `CAN-REG-004`, `CAN-REG-008` | Portal requests enter through `CAN-REG-003`; the Coordinator alone calls the three public boundary roles in `NBR-REG-003`. `ACT-REG-002` may supply approved configuration to `CAN-REG-008` before runtime. | Owns proposal lifecycle, eligibility semantics, policy selection, and scenario control; it does not own institutional record, catalog, or roster facts. |
| `NBR-REG-003` | Institutional boundaries | Translate authoritative facts and state-changing roster operations across institutional-system boundaries. | `CAN-REG-005`, `CAN-REG-006`, `CAN-REG-007` | `NBR-REG-002` → Record Source → `EXT-REG-001`; → Course Catalog → `EXT-REG-002`; → Seat Gateway → `EXT-REG-003`. No other cross-boundary path is permitted in this slice. | External systems retain authority. Protocols, schemas, credentials, retries, and system-specific failures are hidden and recast into typed core outcomes. |

The Portal knows the Coordinator role, not Policy or Seat Gateway. The Coordinator knows boundary roles but not their transport or schema. The Policy can obtain academic facts through `CAN-REG-005`; it does not mutate the proposal or roster. These restrictions make the authority claims in `SYS-REG-008` testable.

## 9. Collaboration stories

### `COL-REG-001` Evaluate and reserve a proposed schedule

**Source:** `SCN-REG-001`–`SCN-REG-003`.

**Start:** authenticated `ACT-REG-001` submits section choices through `NBR-REG-001`.

**Precondition:** the registration window is open; the proposal identifies one student and term.

**Completion:** the student receives either explained policy failure, seat-unavailable result, or an expiring registration offer with warnings.

**Control style:** delegated. `CAN-REG-003` retains sequence, timeout, and branch selection; `CAN-REG-002`, `CAN-REG-004`, and `CAN-REG-007` own their local decisions.

| Step | Sender → receiver | Request and responsibility | Result/aftereffect |
| --- | --- | --- | --- |
| 1 | Portal → Coordinator | After boundary validation, evaluate this proposal (`RSP-REG-001`, `RSP-REG-003`, `RSP-REG-008`). | Authenticated identity, student, term, and attempt ID remain bound to the request. |
| 2 | Coordinator → Course Catalog | Describe selected sections for this term (`RSP-REG-015`); `CAN-REG-006` crosses to `EXT-REG-002`. | Versioned section facts or a typed unavailable/invalid-section result. |
| 3 | Coordinator → Proposed Schedule | Attach the evaluation snapshot, report time conflicts, and verify lifecycle eligibility (`RSP-REG-005`–`RSP-REG-007`). | Nonblocking warnings plus a stable proposal snapshot. |
| 4 | Coordinator → Policy Selector | Supply the approved policy provider for program and term (`RSP-REG-020`). | One `ROL-REG-001` provider or an explicit unavailable/invalid-configuration result. |
| 5 | Coordinator → Enrollment Policy Provider | Decide blocking eligibility (`RSP-REG-012`). | Policy obtains `RSP-REG-014` through `CAN-REG-005` from `EXT-REG-001`; returns eligible or explained failures (`RSP-REG-013`). |
| 6 | Coordinator → Seat Gateway | If eligible, reserve all selected seats under the attempt ID (`RSP-REG-016`) at `EXT-REG-003`. | Reservation token and expiry, or none reserved with a reason. |
| 7 | Coordinator → Proposed Schedule | Record evaluated/reserved or failed outcome (`RSP-REG-006`, `RSP-REG-007`). | Attempt enters a named state. |
| 8 | Coordinator → Portal | Return offer/failure and warnings (`RSP-REG-010`, `RSP-REG-002`). | Student sees an outcome without UI reinterpretation. |

**Reference paths:** `NBR-REG-001` receives a Coordinator role for the request/session; the Coordinator is configured with the Catalog, Policy Selector, and Seat Gateway roles; the Selector supplies the approved `ROL-REG-001` player; that provider is configured with an Academic Record Source. `NBR-REG-003` owns every path to `EXT-REG-001`–`003`, and the Coordinator owns the proposal reference for the attempt lifetime.

### `COL-REG-002` Confirm an active offer

**Source:** `SCN-REG-004`.

| Step | Sender → receiver | Request and responsibility | Result/aftereffect |
| --- | --- | --- | --- |
| 1 | Portal → Coordinator | Confirm offer identified by attempt ID (`RSP-REG-001`, `RSP-REG-009`). | Coordinator retrieves the active proposal. |
| 2 | Coordinator → Proposed Schedule | Decide whether confirmation is permitted now (`RSP-REG-006`). | Active reservation reference or typed expired/invalid-state result. |
| 3 | Coordinator → Seat Gateway | Commit the reservation exactly once (`RSP-REG-017`). | Authoritative committed result, expired result, or ambiguous timeout. |
| 4 | Coordinator → Proposed Schedule | Record confirmed or named non-success state (`RSP-REG-006`, `RSP-REG-007`). | Proposal state agrees with resolved roster state. |
| 5 | Coordinator → Portal | Present confirmation/result (`RSP-REG-002`). | Student can distinguish confirmed, expired, and pending-resolution outcomes. |

### `COL-REG-003` Ambiguous reservation timeout

**Source:** `SCN-REG-005`.

If `RSP-REG-016` or `RSP-REG-017` times out, the Coordinator must not assume failure and repeat a potentially state-changing request blindly.

1. `CAN-REG-003` asks `CAN-REG-007` to resolve the attempt status (`RSP-REG-019`).
2. If the attempt is reserved or committed, the Coordinator records and reports that authoritative state.
3. If it is absent, the Coordinator may make one bounded idempotent retry under the same attempt ID.
4. If status remains unknown, the proposal enters `pending-resolution`; confirmation is unavailable. The reservation expires at the roster boundary, and the student is told to check again rather than being shown success.

This path is intentionally less convenient than guessing: predictable state and no duplicate/partial registration are more important.

### `COL-REG-004` Recover the current attempt outcome

**Source:** `SCN-REG-006`.

1. `ACT-REG-001` asks the Portal for an existing attempt's status (`RSP-REG-022`); this is not a new submission.
2. The Portal asks the Coordinator to resolve and provide the current outcome (`RSP-REG-021`).
3. If the proposal already has a terminal result, the Coordinator returns it.
4. If the proposal is pending resolution, the Coordinator asks the Seat Gateway for authoritative status (`RSP-REG-019`) under `CTR-REG-005`, then records any resolved transition through `RSP-REG-006` and `RSP-REG-007`.
5. The Portal presents confirmed, expired, failed, or still-pending status without repeating reservation or commit.

## 10. Control decision — `CTL-REG-001`

The design uses a **delegated** control center.

- `CAN-REG-003` owns event sequencing, branching on typed results, timeout progress, and scenario completion.
- `CAN-REG-004` owns eligibility decisions because it has the policy vocabulary and can obtain academic facts.
- `CAN-REG-002` owns lifecycle validity and time-overlap behavior because it owns the proposal information.
- `CAN-REG-007` owns seat atomicity, idempotency, reservation expiry, and authoritative roster status.

A centralized alternative would let a `RegistrationManager` fetch all data, evaluate rules, edit rosters, and retry failures. It makes one path easy to draw but gives the controller broad domain and protocol knowledge, duplicates authoritative logic, and turns policy or roster change into controller change. Fully dispersed control was also rejected because confirmation and recovery need an intelligible scenario owner.

## 11. Trust, contracts, and reliability

### Trust regions

| Crossing/region | Assumption and authoritative fact | Boundary owner | Validation, translation, and effect verification |
| --- | --- | --- | --- |
| `ACT-REG-001` → `NBR-REG-001` | Student/browser input is untrusted and may be stale, malformed, duplicated, or replayed; the authentication assertion is supplied under `ASM-REG-001`. | `CAN-REG-001` | Validate request shape and preserve the identity/attempt/student/term binding; authentication itself remains outside scope. |
| Within `NBR-REG-002` | Typed, normalized requests are trusted, but no copied institutional fact is authoritative indefinitely. | `CAN-REG-003` | Retain source/version provenance through `RSP-REG-023`; domain participants validate their own invariants. |
| `NBR-REG-002` → `EXT-REG-001` | `EXT-REG-001` is authoritative for academic facts but may be unavailable or schema-incompatible. | `CAN-REG-005` | Translate protocol/schema, return a versioned snapshot, and recast unavailable or invalid responses. |
| `NBR-REG-002` → `EXT-REG-002` | `EXT-REG-002` is authoritative for catalog facts but may be unavailable, stale, or schema-incompatible. | `CAN-REG-006` | Translate and attach freshness/version evidence; reject invalid section facts before policy or reservation. |
| `NBR-REG-002` → `EXT-REG-003` | `EXT-REG-003` is the sole authority for reservations and membership; outcomes may be delayed or ambiguous. | `CAN-REG-007` | Preserve attempt identity, translate results, resolve authoritative status, and verify state-changing aftereffects. |
| `ACT-REG-002` → `CAN-REG-008` | Approved policy configuration is trusted only after program/term validation; runtime student requests cannot select arbitrary policies. | `CAN-REG-008` | Validate configuration identity/version and fail closed on missing or invalid selection. |

### Consequential contracts

| ID/request | Client → provider | Trust/authority boundary | Preconditions | Provider aftereffect and side effects | Invariant | Permitted non-success/resulting state | Verification owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CTR-REG-001` Reserve all (`RSP-REG-016`) | Coordinator → `ROL-REG-002` | Core → authoritative roster | Unique attempt ID; valid term/sections; no conflicting terminal result | Every requested seat is held until stated expiry or none is; identical replay returns the canonical result. | No partial caller-visible reservation; one attempt identity denotes one request. | unavailable/invalid/timeout-unknown → not reserved or pending resolution | Seat Gateway verifies roster status; Coordinator verifies typed result. |
| `CTR-REG-002` Commit (`RSP-REG-017`) | Coordinator → `ROL-REG-002` | Core → authoritative roster | Active unexpired reservation bound to attempt/student | Roster membership commits exactly once; duplicate commit returns the same result. | No duplicate enrollment and no partial schedule commit. | expired/released/timeout-unknown → expired or pending resolution | Seat Gateway, with status resolution by Coordinator. |
| `CTR-REG-003` Release/expire (`RSP-REG-018`) | Coordinator → `ROL-REG-002` | Core → authoritative roster | Reservation is not committed. | No active hold remains; committed membership is unchanged. | Release cannot undo a committed registration. | timeout-unknown → pending resolution | Seat Gateway. |
| `CTR-REG-004` Decide eligibility (`RSP-REG-012`, `RSP-REG-013`) | Coordinator → `ROL-REG-001` | Selected policy and authoritative academic facts | Versioned proposal/catalog/record snapshots and a valid program/term policy selection | Returns eligible or stable rule IDs and explanations; does not mutate proposal or seats. | Identical governed facts and policy version have one semantic decision. | missing/invalid policy or facts → evaluation unavailable, no seat request | Policy conformance suite and Coordinator. |
| `CTR-REG-005` Resolve attempt status (`RSP-REG-019`) | Coordinator → `ROL-REG-002` | Core → authoritative roster | Stable attempt ID | Returns authoritative absent/reserved/committed/released/expired status without creating a new effect. | Query does not reserve or commit. | unavailable/unknown → remains pending resolution | Coordinator records and Portal exposes the result through `COL-REG-004`. |

### Failure allocation

| EXC ID/condition | Detector | Handler/decision owner | POL ID and policy | Predictable result |
| --- | --- | --- | --- | --- |
| `EXC-REG-001` Invalid section/catalog unavailable | Course Catalog | Coordinator | `POL-REG-001` Balk before policy/reservation; present corrective or retryable result. | No seat mutation; proposal remains proposed/failed with reason. |
| `EXC-REG-002` Academic facts unavailable | Academic Record Source | Coordinator | `POL-REG-002` Balk; never treat missing facts as eligibility. | No seat mutation; retryable failure. |
| `EXC-REG-003` Blocking policy failure | Enrollment Policy Provider | Coordinator/Portal | `POL-REG-003` Return explanations; do not request reservation. | Evaluated-ineligible. |
| `EXC-REG-004` One or more seats unavailable | Seat Gateway | Coordinator | `POL-REG-004` Accept all-or-none failure and report unavailable sections. | Not reserved; no partial hold. |
| `EXC-REG-005` Reservation/commit timeout | Seat Gateway/transport | Coordinator | `POL-REG-005` Query `RSP-REG-019`; bounded idempotent retry only if absent; otherwise stay pending. | State agrees with roster or remains explicitly unknown. |
| `EXC-REG-006` Student does not confirm before expiry | Seat Gateway clock/status | Gateway; Coordinator on later query | `POL-REG-006` Expire/release; forbid late commit. | Expired. |
| `EXC-REG-007` Result presentation fails after commit | Portal/session | Portal | `POL-REG-007` Preserve valid registration and expose `COL-REG-004`; never re-register to recover display. | Registration remains confirmed; delivery/query can be retried. |

## 12. Flexibility hot spot

### `HOT-REG-001` Enrollment rules by program and term

- **What varies:** blocking credit-load, prerequisite, standing, hold, and recorded-approval rules.
- **Concrete cases:** undergraduate fall registration permits up to 18 credits; graduate registration uses a different load rule; an honors program accepts a recorded overload approval while preserving prerequisite checks.
- **Fixed context:** input is a versioned proposal/catalog snapshot plus authoritative academic snapshot; output is an eligibility decision containing stable rule identifiers and explanations; the Policy never reserves seats.
- **Changing actor/time:** `ACT-REG-002` selects/configures an approved rule set before a term opens, not per student request.
- **Expected recurrence:** at least termly, with occasional program-specific changes.
- **Chosen mechanism:** clients depend on `ROL-REG-001`; `CAN-REG-008` supplies one approved policy realization or cohesive rule configuration through `RSP-REG-020`. Selection failure closes registration evaluation rather than using an arbitrary default.
- **Non-goals:** student-authored rules, arbitrary runtime scripts, wait-list policy, advisor workflow, or a general rules framework.
- **Verification:** shared contract tests for the three cases, explanation stability, invalid configuration, boundary credit values, and preservation of the rule that Policy cannot mutate proposal or roster state.
- **Validation horizon and discard trigger:** validate before the next term configuration freeze; if the three cases converge to one stable rule set for two terms, simplify the role/selector rather than retaining unused machinery.

This seam is justified by concrete variation. The remainder of the workflow is intentionally not generalized.

## 13. Realization mapping — deliberately last

This is one possible implementation, not the conceptual design itself. A SYS ID marked **primary** is accountable through that realization; **supports** identifies a collaborator and does not create a second accountable owner.

| IMP ID | Conceptual candidate/role | Explicit SYS/RSP coverage | Possible realization | Secondary technical obligations |
| --- | --- | --- | --- | --- |
| `IMP-REG-001` | `CAN-REG-001` Registration Portal | Primary `SYS-REG-001`; supports `SYS-REG-007`, `SYS-REG-009`; `RSP-REG-001`–`003`, `RSP-REG-022` | HTTP/UI adapter and presenter | Authentication-context propagation, request parsing, response rendering |
| `IMP-REG-002` | `CAN-REG-002` Proposed Schedule | Primary `SYS-REG-003`; supports `SYS-REG-007`; `RSP-REG-004`–`007` | Domain entity/aggregate plus immutable section-fact values | Persistence mapping, optimistic version, serialization |
| `IMP-REG-003` | `CAN-REG-003` Registration Coordinator | Primary `SYS-REG-006`, `SYS-REG-007`, `SYS-REG-008`, and `SYS-REG-009`; supports `SYS-REG-005`; `RSP-REG-008`–`011`, `RSP-REG-021`, `RSP-REG-023` | Application service or workflow component | Transaction demarcation, timeout scheduling, correlation IDs, observability |
| `IMP-REG-004` | `ROL-REG-001` and current player `CAN-REG-004` | Primary `SYS-REG-002`; `RSP-REG-012`, `RSP-REG-013` | Interface/protocol with configured rule-set implementations | Configuration validation and contract-test participation |
| `IMP-REG-005` | `CAN-REG-008` Policy Selector | Supports `SYS-REG-002`, `SYS-REG-008`; `RSP-REG-020` | Validated configuration holder/provider | Program/term selection, configuration versioning, safe missing-policy failure |
| `IMP-REG-006` | `CAN-REG-005` Academic Record Source | Supports `SYS-REG-002`, `SYS-REG-008`; `RSP-REG-014` | Port plus `EXT-REG-001` adapter | Authentication, schema translation, timeout, snapshot/version metadata |
| `IMP-REG-007` | `CAN-REG-006` Course Catalog | Supports `SYS-REG-002`, `SYS-REG-003`, `SYS-REG-008`; `RSP-REG-015` | Port plus `EXT-REG-002` adapter/cache | Schema translation, freshness/version policy |
| `IMP-REG-008` | `ROL-REG-002` and current player `CAN-REG-007` | Primary `SYS-REG-004`, `SYS-REG-005`; supports `SYS-REG-006`, `SYS-REG-008`, `SYS-REG-009`; `RSP-REG-016`–`019` | Port plus `EXT-REG-003` adapter | Idempotency keys, retry/status protocol, secure transport, metrics |

An implementation may combine some realizations in one process or class. It must not erase the separate conceptual ownership or let framework lifecycle duties become primary domain responsibilities.

### Traceability slice

The acceptance condition, criticality, and assignment status for each row are defined in Section 4. Each row below retains that single accountable owner and names implementation support separately.

| SYS obligation | Source scenario/evidence | Accountable owner and owning RSP | Collaboration | Contract/policy/hot spot | Explicit implementation and test evidence |
| --- | --- | --- | --- | --- | --- |
| `SYS-REG-001` | `SCN-REG-001`, `EVD-REG-001`, `ASM-REG-001` | `CAN-REG-001`; `RSP-REG-001`, `RSP-REG-003` | `COL-REG-001` step 1 | Portal boundary policy | `IMP-REG-001`; malformed-input, identity-binding, and stable-attempt-ID tests |
| `SYS-REG-002` | `SCN-REG-002`, `ASM-REG-002` | `CAN-REG-004`; `RSP-REG-012`, `RSP-REG-013` | `COL-REG-001` steps 4–5 | `CTR-REG-004`, `HOT-REG-001` | `IMP-REG-004`; supported by `IMP-REG-005`–`007`; blocking-rule, explanation, and invalid-policy tests |
| `SYS-REG-003` | `SCN-REG-001`, `ASM-REG-002` | `CAN-REG-002`; `RSP-REG-005` | `COL-REG-001` steps 2–3 | Nonblocking-warning invariant | `IMP-REG-002`; supported by `IMP-REG-007`; overlap and warning-does-not-block tests |
| `SYS-REG-004` | `SCN-REG-003`, `ASM-REG-003`, `ASM-REG-004` | `ROL-REG-002` played by `CAN-REG-007`; `RSP-REG-016` | `COL-REG-001` step 6 | `CTR-REG-001`, `POL-REG-004` | `IMP-REG-008`; all-or-none, unavailable-seat, and duplicate-reserve tests |
| `SYS-REG-005` | `SCN-REG-004`, `EVD-REG-002` | `ROL-REG-002` played by `CAN-REG-007`; `RSP-REG-017` | `COL-REG-002` step 3 | `CTR-REG-002` | `IMP-REG-008`; supported by `IMP-REG-003`; duplicate-confirm and expired-reservation tests |
| `SYS-REG-006` | `SCN-REG-005`, `ASM-REG-003`, `ASM-REG-004` | `CAN-REG-003`; `RSP-REG-011` | `COL-REG-003`; Seat Gateway supplies `RSP-REG-018`, `RSP-REG-019` | `CTR-REG-003`, `CTR-REG-005`, `POL-REG-005`, `POL-REG-006` | Accountable realization `IMP-REG-003`; boundary support `IMP-REG-008`; timeout, lost-response, failed-status-query, retry-bound, release, and expiry tests |
| `SYS-REG-007` | `SCN-REG-001`–`006`, `EVD-REG-002` | `CAN-REG-003`; `RSP-REG-010`, `RSP-REG-021` | `COL-REG-001`–`004` | `POL-REG-001`–`007` as applicable | `IMP-REG-003`; presentation support `IMP-REG-001`; one named-state/result test for every supported outcome |
| `SYS-REG-008` | `EVD-REG-002`, `ASM-REG-003`–`005`, `EXT-REG-001`–`003` | `CAN-REG-003`; `RSP-REG-023` | Authority crossings in `COL-REG-001`–`004` | `CTR-REG-001`–`005` | Accountable realization `IMP-REG-003`; boundary support `IMP-REG-006`–`008`; provenance, staleness, and forbidden-direct-write tests |
| `SYS-REG-009` | `SCN-REG-006`, `EVD-REG-002` | `CAN-REG-003`; `RSP-REG-021` | `COL-REG-004` | `CTR-REG-005`, `POL-REG-007` | `IMP-REG-003`; Portal support `IMP-REG-001`, status support `IMP-REG-008`; result-loss/query-recovery-without-resubmission test |

## 14. Mini-review of a flawed alternative

### Submitted alternative

The three submitted statements below are preserved as stable review locators:

- `SUB-REG-001` — “`RegistrationManager` receives a form, loads `Student`, `Course`, and `Section` records, checks every rule with nested conditionals, decrements seat counts, writes rosters, sends confirmation email, and retries any exception three times.”
- `SUB-REG-002` — “The other objects expose getters and setters.”
- `SUB-REG-003` — “Program-specific behavior is added through more flags on the manager.”

These locators identify the complete submitted design evidence for the mini-review; no scenario, diagram, contract, code, or test accompanies them.

### Review decision

| Field | Decision |
| --- | --- |
| Approval verdict | **Not assessable** |
| Known design disposition | **Revisions required** |
| Controlling basis | `G1`, `G2`, and `G3` are `NOT EVALUABLE`; `G4`, `G5`, and `G7` independently `FAIL`. |
| Evidence coverage | Below 60: the complete submission is `SUB-REG-001`–`003` and supplies no reviewable collaboration trace, reachability/lifetime evidence, or contract. |
| Confidence | High in the demonstrated blocker findings and known disposition; no overall approval-quality claim is made. |
| Authority | Review plus bounded repair planning for this teaching example. The preceding worked design is a separately developed comparison, not a silent rewrite of the submission. |

The approval verdict is **Not assessable** because approval-critical gates cannot be evaluated from the three submitted statements. Independently, `SUB-REG-001`–`003` and the exercise's explicit roster-authority boundary demonstrate systemic defects across control, domain behavior, external authority, recovery, and variation. Those direct defects justify the separate known disposition **Revisions required**; supplying the missing evidence alone would not make the submitted allocation acceptable.

### Mini-review hard gates

| Gate | State | Precise evidence/finding | Required action or evidence |
| --- | --- | --- | --- |
| `G1` Core responsibility coverage | `NOT EVALUABLE` | Complete submission `SUB-REG-001`–`003` contains no system-responsibility catalog, completion conditions, or ownership ledger. | Supply core obligations, accountable owners, and actor-visible completion conditions. |
| `G2` Representative end-to-end trace | `NOT EVALUABLE` | Complete submission `SUB-REG-001`–`003` contains no ordered normal or failure trace. | Supply at least one normal registration trace and the ambiguous-timeout trace. |
| `G3` Collaboration reachability | `NOT EVALUABLE` | `SUB-REG-001` names loaded records and actions but no receiver responsibilities, acquisition paths, cardinality, or lifetimes. | Supply reference acquisition and lifetime evidence for every consequential request. |
| `G4` Intelligible control and authority | `FAIL` | `SUB-REG-001` assigns policy, proposal processing, roster mutation, presentation, and retry to one manager; `SUB-REG-002` leaves the information holders passive. See `RDD-REG-001`, `RDD-REG-002`. | Reallocate decisions to coherent information, policy, boundary, and coordination owners. |
| `G5` Consequential failure and trust ownership | `FAIL` | `SUB-REG-001` directly writes roster state and blindly retries, conflicting with `ASM-REG-003` and the `EXT-REG-003` authority row. See `RDD-REG-003`, `RDD-REG-004`. | Supply an authoritative roster contract, ambiguity resolution, and bounded retry ownership. |
| `G6` Evidence integrity | `PASS` | The artifact is explicitly treated as a three-statement conceptual submission; missing evidence and direct defects are classified separately. | Preserve this evidence-status separation in the resumed review. |
| `G7` Known blocker disposition | `FAIL` | Open blocker findings `RDD-REG-001` and `RDD-REG-003` remain demonstrated by `SUB-REG-001` plus the exercise boundary. | Replace the systemic responsibility allocation before seeking approval. |

The controlling evidence is the manager's simultaneous ownership of policy, lifecycle, seat mutation, presentation, and generic recovery; passive records; and an attempt to own roster state that the exercise defines as externally authoritative. Missing traces are recorded as gaps rather than filled in.

| ID | Class/status | Dimension/gate | Priority/confidence | Claim and precise evidence locator(s) | Consequence | Bounded repair/evidence direction | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `RDD-REG-001` | defect/open | D3, D5 / G4 | blocker / high | `SUB-REG-001`, clauses “checks every rule,” “decrements seat counts,” “writes rosters,” “sends confirmation email,” and “retries any exception,” assigns unrelated domain and execution work to `RegistrationManager`; `SUB-REG-002` makes the remaining objects passive. | Unrelated changes and decisions converge on one all-knowing controller. | Retain only cohesive scenario coordination; identify authoritative participants for policy, proposal lifecycle, seat work, and presentation before choosing classes. | Ownership ledger plus one normal trace shows distinct decision owners and an intelligible control center. |
| `RDD-REG-002` | defect/open | D2, D3 / G1 | high / high | `SUB-REG-001`, clause “loads `Student`, `Course`, and `Section` records,” together with `SUB-REG-002`, “expose getters and setters,” directly locates interpretation in the manager rather than the information holders. | Behavior and invariants are separated from the information they govern; the core responsibilities lack credible local owners. | Assign proposal lifecycle/conflict behavior and authoritative source responsibilities at obligation level. | CRC cards and responsibility statements show who knows, does, and decides without method-shaped lists. |
| `RDD-REG-003` | defect/open | D3, D6 / G5 | blocker / high | `SUB-REG-001`, clauses “decrements seat counts” and “writes rosters,” conflicts with Section 1 `ASM-REG-003` and the `EXT-REG-003` authority row, which make the separately operated roster the sole seat authority. | Conflicting seat authority can create partial or divergent registration state. | Give the roster boundary sole reservation/commit authority and state an all-or-none aftereffect contract. | `SCN-REG-003` and `SCN-REG-004` traces plus a boundary contract demonstrate one authoritative outcome. |
| `RDD-REG-004` | risk/open | D6 / G5 | high / high | `SUB-REG-001`, clause “retries any exception three times,” supplies the retry rule; Section 3 `SCN-REG-005` establishes the relevant timeout in which the provider may already have acted. | Under an ambiguous outcome and absent idempotency/reconciliation, a retry can duplicate an effect. This is a conditional risk, not proof of duplication. | Distinguish definitive failure from unknown outcome; assign status resolution and retry eligibility. | `SCN-REG-005` demonstrates lost response, canonical status resolution, bounded retry, and predictable failed-recovery state. |
| `RDD-REG-005` | defect/open | D7 | high / high | `SUB-REG-003` puts program-specific flags on the manager; Section 2 `THM-REG-005` and Section 12 `HOT-REG-001` identify program/term policy as the evidenced variation. | Branch growth couples termly policy change to unrelated coordination and recovery. | Characterize the variation and assign policy selection plus policy decision to explicit roles; do not prescribe a pattern before those responsibilities are clear. | Three concrete program/term cases fit one contract and an invalid configuration fails safely. |
| `RDD-REG-006` | risk/open | D3, D6 | medium / medium | `SUB-REG-001`, clause “sends confirmation email,” places delivery in the same manager action as roster mutation; the complete submission `SUB-REG-001`–`003` contains no separate delivery aftereffect or failure policy. | If delivery failure re-enters the action, a valid registration may be retried or rolled back; the exact behavior is not documented. | Separate authoritative registration aftereffect from result delivery and expose status recovery. | `SCN-REG-006` and a trace demonstrate query recovery without resubmission. |
| `RDD-REG-007` | evidence-gap/open | D4, D6 / G1, G2, G3, G5 | blocker / high | Complete submitted evidence `SUB-REG-001`–`003` contains no system-responsibility ledger, scenario trace, collaborator-acquisition/lifetime path, trust map, contract, or recovery state. | Approval cannot establish responsibility coverage, reachability, completion, or the required state after failure. | Supply one normal trace, the ambiguous-timeout trace, reference lifecycles, accountable SYS owners/completion conditions, and the roster contract; do not infer their design. | Review resumes with exact artifact locators and gate evidence. |

**Finding evidence status:** `RDD-REG-001`–`005` cite exact submitted locators plus named exercise-boundary IDs; `RDD-REG-006` is explicitly conditional; `RDD-REG-007` is absence across the complete submitted evidence `SUB-REG-001`–`003`, not a claim that no hidden design exists.

**Minimum next evidence:** responsibility ownership ledger, `SCN-REG-001`, `SCN-REG-004`, and `SCN-REG-005` traces, roster conditions/aftereffects and idempotency semantics, reference acquisition/lifetime, proposal state transitions, and the three program/term policy cases.

The preceding reference design illustrates one authorized repair direction and its traceability. It is not the only acceptable design. Wait-list behavior, approval workflow, and exact institutional consistency guarantees remain unresolved and must not be invented.
