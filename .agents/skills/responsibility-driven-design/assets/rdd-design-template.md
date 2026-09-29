# [System name] — Responsibility-Driven Design

> Reusable design-workbook template. Replace bracketed prompts, duplicate repeatable blocks as needed, and delete sections outside the justified depth. Do not turn empty headings into invented requirements or mechanisms.

## Document control

| Field | Value |
| --- | --- |
| System | [Name] |
| Design status | [Exploratory / Provisional / Ready for implementation / Superseded] |
| Depth profile | [Sketch / Standard / Rigorous] |
| Version | [Version] |
| Date | [YYYY-MM-DD] |
| Prepared by | [People or agent] |
| Intended audience | [Decision makers, designers, implementers, reviewers] |
| Evidence baseline | [Artifact versions, dates, repository revision, or conversation state] |
| Supersedes | [Prior design version or none] |

## Design outcome

[In a short paragraph, state the resulting community of participants, how the principal work is divided, the dominant collaboration/control shape, and the largest unresolved issue.]

### Load-bearing decisions

- **DEC-[001]: [Decision].** [Why it matters and what evidence supports it.]
- **DEC-[002]: [Decision].** [Why it matters and what evidence supports it.]

### Current stopping condition

[Why this iteration is complete enough, provisional, blocked, or ready to implement.]

## Identifier legend

| Prefix | Item |
| --- | --- |
| EVD | Evidence |
| ASM | Assumption |
| QST | Open question |
| CST | Constraint |
| QUA | Quality-attribute scenario |
| ACT | Actor |
| EXT | External system/device/party |
| SCN | Scenario |
| SYS | Whole-system responsibility |
| THM | Design theme |
| CAN | Candidate participant |
| ROL | Interchangeable role |
| NBR | Neighborhood |
| RSP | Participant responsibility |
| COL | Collaboration story |
| CTL | Control center/decision |
| EXC | Exceptional condition |
| POL | Failure/recovery policy |
| CTR | Collaboration contract |
| HOT | Hot spot |
| DEC | Design decision |
| RSK | Residual risk |
| IMP | Implementation mapping |

Keep IDs stable. Mark deleted items retired, rejected, superseded, split, or merged; do not reuse their identifiers.

## 1. Mandate and scope

### Purpose

[One sentence in stakeholder language.]

### Success outcomes

- [Externally meaningful outcome]
- [Externally meaningful outcome]

### In scope

- [Behavior, responsibility, or boundary]

### Out of scope

- [Behavior or responsibility retained by another party]

### Design depth rationale

[Why Sketch, Standard, or Rigorous is appropriate for the consequences and intended use.]

## 2. Evidence, assumptions, and questions

### Evidence ledger

| ID | Evidence or observed fact | Source | Date/version | Design consequence | Confidence |
| --- | --- | --- | --- | --- | --- |
| EVD-[001] | [What is established] | [Source] | [Date/version] | [What it constrains or supports] | [High/Medium/Low] |

### Assumption ledger

| ID | Assumption | Why needed | Affected IDs | Consequence if false | Verification/revisit trigger |
| --- | --- | --- | --- | --- | --- |
| ASM-[001] | [Temporary belief] | [Gap being bridged] | [SYS/ROL/COL/etc.] | [Impact] | [How or when to verify] |

### Open questions

| ID | Question | Why it matters | Affected IDs | Owner/source needed | Blocking? |
| --- | --- | --- | --- | --- | --- |
| QST-[001] | [Question] | [Decision it could change] | [IDs] | [Person/artifact/experiment] | [Yes/No] |

## 3. Context and boundary

### Actors

| ID | Actor | Goal | Authority/knowledge | Trust | Relevant scenarios |
| --- | --- | --- | --- | --- | --- |
| ACT-[001] | [Actor] | [Goal] | [What remains authoritative] | [Trusted/Partial/Untrusted/Unknown] | [SCN IDs] |

### External systems, devices, and independent parties

| ID | External participant | Service or interaction | Authority | Protocol/timing concerns | Trust | Interfacer owner |
| --- | --- | --- | --- | --- | --- | --- |
| EXT-[001] | [External participant] | [Interaction] | [Authoritative facts/actions] | [Concern] | [Level] | [ROL/CAN or unresolved] |

### Boundary statement

[Describe what enters the system, what leaves it, which effects it may cause, and what responsibilities remain outside.]

### Boundary interactions

| Trigger/input | Source | System obligation | Result/effect | Destination | Authority or trust note |
| --- | --- | --- | --- | --- | --- |
| [Input] | [ACT/EXT] | [SYS ID] | [Output/effect] | [ACT/EXT] | [Note] |

## 4. Constraints and quality attributes

### Constraints

| ID | Constraint | Source/evidence | Affected design area | Fixed or negotiable |
| --- | --- | --- | --- | --- |
| CST-[001] | [Constraint] | [EVD/requirement] | [IDs or area] | [Fixed/Negotiable/Unknown] |

### Quality-attribute scenarios

| ID | Quality | Stimulus and condition | Required response | Measure/acceptance | Priority | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| QUA-[001] | [Reliability/Performance/etc.] | [When and under what condition] | [Expected system response] | [Measure] | [Critical/High/Normal] | [EVD/ASM] |

### Failure criticality

[Comfort / discretionary money / essential money / safety, plus project-specific consequences and justified reliability effort.]

## 5. Design story and search frame

### Design story

[Paragraph 1: purpose, users, domain, and notable behavior.]

[Paragraph 2: qualities, constraints, execution machinery, hard parts, certainty, and uncertainty.]

### Themes

| ID | Theme | Why consequential | Evidence/scenarios | Candidate-search implications |
| --- | --- | --- | --- | --- |
| THM-[001] | [Theme] | [Design consequence] | [EVD/SCN] | [What to search for] |

### Design-problem classification

| Problem | Consequence | Character | Why | Planned treatment / stop condition |
| --- | --- | --- | --- | --- |
| [Problem] | [Core/Non-core] | [Routine/Revealing/Potentially wicked] | [Evidence] | [Action] |

## 6. Usage, failure, and change scenarios

### Scenario catalog

| ID | Scenario | Type | Trigger | Actor/event | Observable outcome | Criticality | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCN-[001] | [Name] | [Normal/Exceptional/Change/Operational] | [Trigger] | [ACT/EXT/event] | [Outcome] | [Core/Supporting] | [Modeled/Deferred] |

### SCN-[001]: [Scenario name]

**Goal:** [Actor or system goal]

**Evidence:** [EVD IDs]

**Assumptions:** [ASM IDs or none]

**Preconditions:** [Conditions true before the scenario]

**Authoritative inputs and owners:** [Input/fact → ACT/EXT/ROL/CAN authority]

**Trigger:** [Initiating event]

**Design-free narrative:**

1. [Actor/system step without internal implementation]
2. [Step]
3. [Externally meaningful completion]

**Alternative and exceptional outcomes:**

- [Condition] → [Required actor-visible outcome]

**Postconditions and persistent obligations:**

- [State, record, notification, or obligation remaining]

**Applicable constraints/qualities:** [CST/QUA IDs]

## 7. Whole-system responsibilities

| ID | System responsibility | Kind | Source | Acceptance condition | Criticality | Primary owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SYS-[001] | [Perform/know/decide an outcome] | [Do/Know/Decide] | [EVD/SCN/QUA/CST or labeled design-enabling source] | [Observable acceptance] | [Core/Supporting] | [ROL/CAN or Unassigned] | [Assigned/Unassigned/Deferred] |

### Unassigned or disputed system responsibilities

| SYS ID | Why unassigned/disputed | Plausible owners | Deciding evidence or experiment | Blocking? |
| --- | --- | --- | --- | --- |
| SYS-[...] | [Reason] | [ROL/CAN IDs] | [Needed evidence] | [Yes/No] |

## 8. Candidate discovery and disposition

| ID | Candidate | Purpose | Stereotype blend | Clients/beneficiaries | Supports | Initial responsibilities | Explicit exclusions | Evidence/assumptions/questions | Current disposition | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CAN-[001] | [Name] | [What kind of participant, principal obligation, distinguishing fact] | [Information holder/Structurer/Service provider/Coordinator/Controller/Interfacer] | [Actors/roles] | [THM/SYS/SCN] | [RSP IDs or short provisional statements] | [Work it must not own] | [EVD/ASM/QST] | [Accepted / Deferred / Rejected / Merged into CAN-### / Split into CAN-### and CAN-### / Superseded by CAN-### or ROL-###] | [Why, including deciding evidence or revisit trigger] |

### Candidate changes during simulation

Use this as the lineage history. Preserve prior rows; do not reuse retired IDs. The latest row for a candidate must agree with its current disposition above.

| Iteration/version | Source candidate IDs | Change | Target/resulting canonical IDs | Triggering story/evidence | Responsibilities affected or moved | Result/current state |
| --- | --- | --- | --- | --- | --- | --- |
| [1/version] | [CAN IDs] | [Added/Renamed/Merged/Split/Rejected/Deferred/Superseded] | [CAN IDs; ROL only when explicitly superseded by a role; or none] | [COL/EVD/DEC IDs] | [RSP IDs → new owners, or none] | [Current disposition or resulting model state] |

## 9. Role catalog

| ID | Role | Purpose | Client vocabulary | Public responsibilities | Expected collaborators | Contract links | Players/realizations | Interchangeability basis |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ROL-[001] | [Role name] | [Replaceable slot] | [Outcome-oriented requests clients use] | [RSP IDs] | [ROL/CAN IDs] | [CTR IDs or deferred] | [CAN IDs] | [Required now/Evidenced future/Conceptual only] |

### Role distinctions and overlaps

[Explain cases where one candidate plays several roles, several candidates play one role, or similar-looking responsibilities intentionally remain distinct.]

## 10. Neighborhoods

| ID | Neighborhood | Purpose/collective obligations | Contained participants | Public entry roles | Hidden participants | Allowed external paths | Authority/invariants | Control centers | Trust region | Change/failure boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NBR-[001] | [Name] | [SYS IDs and purpose] | [ROL/CAN IDs] | [ROL/CAN] | [ROL/CAN] | [From/to NBR/EXT] | [Facts/rules owned] | [CTL IDs] | [Trust note] | [What changes/fails independently] |

### Neighborhood map

[Describe or diagram the few meaningful communication paths. Label partial views as partial.]

### Boundary leakage or disputed placement

| Design element | Concern | Affected neighborhoods | Decision/next experiment |
| --- | --- | --- | --- |
| [ROL/CAN/RSP ID; this is the subject, not an owner] | [Concern] | [NBR IDs] | [DEC/QST] |

## 11. Responsibility model

### Responsibility assignments

| ID | Owner | Responsibility | Kind | Public/private | Design source | Fulfillment choice | Rationale | Collaborators | Acceptance/conformance evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RSP-[001] | [ROL/CAN] | [Strong obligation statement] | [Do/Know/Decide] | [Public/Private] | [SYS/COL/CTL/CTR/POL/HOT or labeled source] | [Self-perform/Partial collaboration/Full delegation] | [Why this owner and choice fit] | [ROL/CAN] | [SCN/test] |

### Authoritative knowledge and decisions

| Fact, invariant, policy, or decision | Authoritative owner | Consumers | Update/decision path | Duplicate copies/checks permitted? |
| --- | --- | --- | --- | --- |
| [Item] | [ROL/CAN/EXT] | [IDs] | [COL/RSP] | [No, or justified redundancy] |

### Responsibility concerns

| Concern | Evidence | Affected IDs | Proposed repair | Status |
| --- | --- | --- | --- | --- |
| [Too broad/overlap/favor/wrong level/etc.] | [COL/EVD] | [IDs] | [Move/split/merge/reword] | [Open/Resolved/Accepted] |

## 12. CRC and role cards

### [CAN or ROL ID]: [Name]

**Purpose:** [Concise purpose]

**Primary role:** [ROL ID or description]

**Secondary roles:** [ROL IDs or none]

**Stereotypes:** [Blend]

**Clients:** [ACT/ROL/CAN IDs]

**Public responsibilities:**

- **RSP-[...]:** [Responsibility]

**Relevant private responsibilities:**

- **RSP-[...]:** [Responsibility]

**Collaborators:**

- [ROL/CAN ID] — [Why collaboration is required]

**Knows or governs authoritatively:** [Facts, invariants, policies, or none]

**Explicitly does not own:** [Important exclusion]

**Lifecycle/visibility:** [Creation, acquisition, retention, release]

**Open questions:** [QST IDs]

## 13. Collaboration stories

### Collaboration catalog

| ID | Story | Scenario/design question | Scope | Control style | Trust crossings | Status |
| --- | --- | --- | --- | --- | --- | --- |
| COL-[001] | [Name] | [SCN or question] | [Participants/neighborhoods] | [CTL ID] | [CTR/EXT/NBR] | [Works/Provisional/Blocked] |

### COL-[001]: [Collaboration story name]

**Purpose/question:** [What this story proves or explores]

**Source scenario:** [SCN ID]

**Scope and exclusions:** [Included participants and intentionally ignored detail]

**Trigger:** [Event]

**Preconditions:** [Conditions]

**Postconditions:** [Externally meaningful result and state]

**Participants:** [ACT/EXT/ROL/CAN IDs]

**Controlling participant(s):** [CTL and ROL/CAN IDs]

| Step | Sender | Request/event | Receiver | Receiver responsibility | Information/authority | Result/state change | Visibility/lifecycle | Trust note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | [ACT/ROL/CAN] | [Request] | [ROL/CAN] | [RSP ID] | [Input and owner] | [Result] | [How receiver is reachable] | [Boundary] |

**Decision points:**

| Decision | Owner | Required knowledge | Alternatives | Consequence |
| --- | --- | --- | --- | --- |
| [Decision] | [ROL/CAN/EXT] | [Authoritative fact] | [Paths] | [Effect] |

**Exceptional continuation:** [EXC/POL/COL IDs or none]

**Simulation findings:**

- [Responsibility or candidate change exposed]

**Remaining hand-waving:** [QST/RSK IDs or none]

## 14. Control centers and style

| ID | Control center/task | Event owner | Style | Decision distribution | Alternatives considered | Why selected | Failure/control concerns |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CTL-[001] | [Task] | [ROL/CAN] | [Centralized/Clustered/Delegated/Dispersed] | [Who decides what] | [Alternatives] | [Forces and evidence] | [Concern] |

### Control consistency

[Explain which control centers intentionally work alike and where material differences justify another style.]

### Intelligence-distribution check

- [Why controllers are not doing domain work better owned elsewhere.]
- [Why delegation has not fragmented work into trivial participants.]
- [How a maintainer can locate consequential decisions.]

## 15. Reliability, trust, and contracts

### Trust regions

| Region/boundary | Participants | Trusted assumptions | Untrusted or unknown inputs/effects | Boundary owner |
| --- | --- | --- | --- | --- |
| [NBR/EXT crossing] | [IDs] | [Assumptions] | [Risks] | [ROL/CAN] |

### Exceptional-condition catalog

| ID | Condition | Level | Error/exception | Consequence | Likelihood | Detector participant | Detection RSP | Communication/recast | Handler/decision participant | Handling RSP | Policy | Recovered state | Failed-recovery policy | Actor-visible outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXC-[001] | [Condition] | [Use case/Object/Boundary] | [Classification] | [Impact] | [Common/Plausible/Uncertain/Improbable] | [ROL/CAN/EXT] | [RSP ID] | [Exception/result/event and boundary] | [ROL/CAN/EXT] | [RSP ID] | [POL ID] | [State] | [Policy] | [Outcome] |

### Failure and recovery policies

| ID | Conditions covered | Policy | Retry/wait/cancellation bounds | Cleanup/compensation | Verification owner | Residual risk |
| --- | --- | --- | --- | --- | --- | --- |
| POL-[001] | [EXC IDs] | [Balk/Suspend/Provisional/Recover/Escalate/Rollback/Retry/Inaction] | [Bounds] | [Action] | [ROL/CAN] | [RSK ID] |

### Collaboration contract

#### CTR-[001]: [Request]

| Field | Definition |
| --- | --- |
| Client role | [ROL/CAN] |
| Provider role | [ROL/CAN/EXT] |
| Trust/authority boundary | [Boundary] |
| Preconditions/client obligations | [Conditions] |
| Postconditions/provider obligations | [Aftereffects] |
| Invariants | [Preserved facts] |
| Permitted exceptional outcomes | [Typed outcomes and resulting state] |
| Side effects | [Effects] |
| Timing/ordering/idempotency | [Semantics or not applicable] |
| Privacy/authorization/consistency | [Semantics or not applicable] |
| Authoritative owner | [ROL/CAN/EXT] |
| Verification owner and evidence | [Owner/test] |

## 16. Flexibility and evolution

### Flexibility screen

[State concrete expected variations, who changes them, when, and whether an explicit mechanism is justified. If none, say so.]

### Hot spots

For a consequential, runtime, independently loaded, or operationally complex hot spot, complete the [standalone hot-spot worksheet](hot-spot-template.md); the embedded record below is the minimum summary.

| ID | Variation need | Driver/evidence | Changing actor/time | Focus | Scope | Concrete cases | Mechanism status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HOT-[001] | [What varies semantically] | [EVD/SCN/history] | [Developer/operator/user/system; compile/deploy/start/runtime] | [RSP IDs] | [Affected IDs] | [At least two; three before generalizing unless an explicit time-boxed bet] | [Direct/Deferred/Time-boxed bet/Mechanism selected/Retired] |

### HOT-[001]: [Hot-spot name]

**General variation:** [What changes without naming the solution]

**Concrete cases:**

1. [Case and behavior]
2. [Case and behavior]
3. [Third case, or explicit time-boxed generalization bet with discard trigger]

**Fixed behavior/invariants:** [What may not change]

**Affected responsibilities and collaborations:** [RSP/COL IDs]

**Alternatives considered:** [Direct implementation, configuration, role substitution, factory, hook, adapter, pattern]

**Selected mechanism:** [Mechanism and responsibility movement]

**Selection/configuration owner:** [ROL/CAN]

**Lifecycle and atomicity:** [When installed or changed; coordinated change]

**Lifecycle owners:** [Discover/validate/select/create/activate/replace/deactivate/dispose → ROL/CAN]

**Failure/compatibility contract:** [Expected failures, recovery, failed-recovery state, coexistence/version rules, and unsupported variation]

**Complexity cost:** [Extra participants, conventions, code, operations, learning]

**Validation horizon and decision owner:** [Release/date/evidence threshold → ROL/CAN]

**Evolution triggers:** [Observable evidence that reopens or expands the decision]

**Discard/simplification criteria:** [When unused or over-costly machinery must be removed]

**Test knob/conformance scenario:** [SCN/test]

**Invalid extension tested:** [Case and expected rejection]

## 17. Design decisions and alternatives

### DEC-[001]: [Decision title]

**Status:** [Proposed/Accepted/Superseded]

**Decision:** [Chosen option]

**Affected IDs:** [IDs]

**Evidence and assumptions:** [EVD/ASM]

**Forces:** [Competing goals and constraints]

**Alternatives:**

| Alternative | Benefits | Costs/risks | Scenario evidence |
| --- | --- | --- | --- |
| [Option] | [Benefit] | [Cost] | [SCN/COL] |

**Rationale:** [Why selected]

**Consequences:** [Positive and negative]

**Invalidation/revisit trigger:** [Evidence or change that reopens it]

## 18. Conceptual-to-implementation mapping

> Keep this section separate from the conceptual model. Omit it when implementation realization is intentionally deferred.

| ID | Conceptual participant/role | Responsibilities | Realization | Public protocol | State/authority location | Persistence/messaging implications | Deployment/lifecycle | Independently implementing party | Conformance tests | Compromise/technical responsibilities |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IMP-[001] | [ROL/CAN] | [RSP IDs] | [Class/interface/module/service/process/workflow/agent/etc.] | [Protocol] | [Authoritative state and location] | [Persistence ownership/schema/retention and message/event delivery/ordering, or N/A with reason] | [Creation, deployment, activation, replacement, disposal] | [Team/agent/vendor/operator, or N/A; name each independent party when a boundary exists] | [SCN/test] | [Trade-off and technology-imposed secondary duties] |

### Independent-implementation handoff details

Use only when an `IMP` row needs additional cross-party detail. Key each row by `IMP` ID; the authoritative party is recorded in the mapping above and must not be redefined here.

| IMP ID | Owns | Does not own | Permitted collaborators | Contracts/failure semantics | Integration/conformance evidence |
| --- | --- | --- | --- | --- | --- |
| IMP-[...] | [ROL/RSP] | [Explicit exclusions] | [ROL/EXT] | [CTR/POL] | [SCN/test] |

## 19. Traceability

| System responsibility | Evidence/scenarios | Primary owner | Participant responsibilities | Collaboration stories | Contracts/policies/hot spots | Acceptance/conformance tests | Implementation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SYS-[001] | [EVD/SCN] | [ROL/CAN] | [RSP] | [COL] | [CTR/POL/HOT or none] | [Test/acceptance] | [IMP or deferred] |

### Orphan check

- System responsibilities without owners: [IDs or none]
- Participant responsibilities without a system/design source: [IDs or none]
- Accepted candidates without responsibilities: [IDs or none]
- Collaboration requests without receiver responsibilities: [IDs or none]
- Roles without players or justified future use: [IDs or none]
- Flexibility mechanisms without hot spots: [IDs or none]
- Contracts or policies not exercised by a scenario: [IDs or none]

## 20. Validation gates

| Gate | Status | Evidence | Failure/defer reason | Required next action |
| --- | --- | --- | --- | --- |
| V1 Context: purpose, boundary, authority, constraints, assumptions | [Pass/Fail/Deferred/N/A] | [IDs] | [Reason] | [Action] |
| V2 Coverage: each core SYS has one owner or explicit unresolved status | [Status] | [IDs] | [Reason] | [Action] |
| V3 Coherence: cohesive, non-duplicative roles/responsibilities | [Status] | [IDs] | [Reason] | [Action] |
| V4 Dynamics: normal, exceptional, and relevant evidence-backed change stories execute | [Status] | [IDs] | [Reason] | [Action] |
| V5 Reachability: collaborators can be obtained for required lifetimes | [Status] | [IDs] | [Reason] | [Action] |
| V6 Control: decisions and sequencing are intentional and traceable | [Status] | [IDs] | [Reason] | [Action] |
| V7 Boundaries: neighborhoods hide detail and constrain dependencies | [Status] | [IDs] | [Reason] | [Action] |
| V8 Reliability: trust, recovery, failed recovery, aftereffects owned | [Status] | [IDs] | [Reason] | [Action] |
| V9 Flexibility: mechanisms serve characterized variations | [Status] | [IDs] | [Reason] | [Action] |
| V10 Traceability: evidence to responsibility to collaboration to test | [Status] | [IDs] | [Reason] | [Action] |
| V11 Handoff: implementers need not invent ownership or policy | [Status] | [IDs] | [Reason] | [Action] |

## 21. Scenario and stress-validation log

| Run | Scenario/stress | Model version | Outcome | Design issue exposed | Changes made | Remaining risk |
| --- | --- | --- | --- | --- | --- | --- |
| [1] | [SCN or stress prompt] | [Version] | [Pass/Fail/Partial] | [Issue] | [IDs changed] | [RSK] |

## 22. Residual risks, deferrals, and next experiments

### Residual risks

| ID | Risk | Evidence/assumption | Consequence | Current mitigation | Acceptance owner | Revisit trigger |
| --- | --- | --- | --- | --- | --- | --- |
| RSK-[001] | [Risk] | [EVD/ASM] | [Impact] | [Mitigation] | [Stakeholder/role] | [Trigger] |

### Deferred work

| Item | Why deferred | What remains valid | Evidence needed | Target/revisit trigger |
| --- | --- | --- | --- | --- |
| [IDs/area] | [Reason] | [Stable conclusions] | [Evidence] | [Trigger] |

### Next experiments

1. [Prototype, simulation, stakeholder decision, load test, threat model, usability study, or other evidence-gathering step]
2. [Next step]

### Required complementary analyses

- [Formal specification / threat modeling / performance model / data model / usability research / none]

## 23. Readiness and acceptance

### Ready to advance when

- [Project-specific condition]
- [Project-specific condition]

### Evidence that would invalidate this design

- [New requirement, failure, scale, change case, or authority fact]

### Acceptance still required

| Decision/risk | Required approver or stakeholder | Evidence supplied | Status |
| --- | --- | --- | --- |
| [DEC/RSK] | [Role/person] | [EVD/artifact] | [Pending/Accepted/Rejected] |

## 24. Revision record

| Version/date | Material responsibility, role, boundary, or collaboration change | Reason/evidence | Superseded IDs |
| --- | --- | --- | --- |
| [Version] | [Change] | [EVD/SCN/experiment] | [IDs or none] |
