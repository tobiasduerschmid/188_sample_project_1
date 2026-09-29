# RDD hot-spot worksheet

Use this worksheet for a consequential variation point. Describe the change need before proposing a hook or pattern. Keep at least two concrete examples; prefer three before committing to a generalized mechanism. Remove sections that truly do not apply, but do not omit a consequential lifecycle, failure, compatibility, scope, or contract question without stating why. Every explicit generalization bet is a **time-boxed bet** with a fixed validation horizon and observable discard trigger; an unbounded “provisional,” “experimental,” or “reviewable” bet is not an allowed decision state.

## 1. Identity and decision state

| Field | Entry |
| --- | --- |
| Hot-spot ID and name | `HOT-001: [name]` |
| Lifecycle status | proposed / validated / implemented / retired |
| Mechanism decision | direct / deferred / time-boxed bet / mechanism selected / retired |
| Decision owner | |
| Participants in the decision | |
| Related requirement, scenario, or change case | [EVD/SCN/SYS/QUA IDs] |
| Related design decision and collaboration stories | [DEC/COL IDs] |
| Affected design version and release | |
| Last validated | |
| Next review trigger or date | |

Keep the three states distinct: **lifecycle status** tracks the hot spot's maturity, **mechanism decision** tracks whether and how the variation is realized, and the final **gate result** records the current review decision. A typical path is `proposed + deferred` → `validated + direct/mechanism selected` → `implemented`; `retired` ends either path when evidence or value disappears.

**One-sentence variation statement:**  
_State the responsibility or behavior that changes without naming a solution._

**Fixed context:**  
_State the surrounding outcome, rules, and responsibilities that must remain stable._

**Non-goals and unsupported variation:**

- 

## 2. Need and evidence

**Actual need:**  
_What recurring change, deployment difference, user choice, or environmental condition must the design accommodate? “Be flexible” is not a need._

**Stakeholder-visible benefit:**  
_What becomes faster, safer, cheaper, or more predictable?_

**Future without a prepared variation point:**  
_Describe the likely repeated edits, coupling, risk, or operational work._

**Future with a prepared variation point:**  
_Describe the concrete improvement and its limits._

| Evidence ID | Source or observation | Fact, assumption, or forecast | Confidence | Decision implication |
| --- | --- | --- | --- | --- |
| EVD-001 or ASM-001 | | | | |
| | | | | |

| Demand characteristic | Entry |
| --- | --- |
| Expected frequency of change | |
| Expected lifetime of variation | |
| Number of known realizations | |
| Cost or consequence of direct change | |
| History of similar changes or patches | |
| Uncertainty that could invalidate the need | |

## 3. Concrete variation examples

Record at least two examples to establish a possible hot spot. Prefer a third distinct example before generalizing a mechanism. If only one or two cases are known, keep the design direct or defer it unless early generalization is recorded as a time-boxed bet. Calling the choice provisional, experimental, pilot, trial, or reviewable does not exempt it from the mandatory bet record below.

| # | Situation and trigger | Shared semantic responsibility | What specifically varies | Who changes or selects it | When it changes | Required result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 preferred | | | | | | |

**Similarity that justifies one hot spot:**

- 

**Differences the mechanism must preserve rather than erase:**

- 

**Counterexample or invalid extension:**  
_Give one plausible case that must be rejected, handled elsewhere, or shown not to fit the abstraction._

**Generalization decision:** direct implementation / defer / generalize now with sufficient cases / time-boxed bet

**Rationale:**

### Mandatory record for every time-boxed bet

Complete this record whenever either the mechanism decision or generalization decision is a bet, experiment, pilot, trial, or provisional early generalization. A bet is invalid—and the decision gate cannot pass—unless every field is complete. The discard trigger must be observable and must require a named removal, simplification, or reversion action; “review later,” “reconsider,” or an ownerless date is not a discard trigger.

| Bet ID | Decision owner (ROL/CAN/person) | Start date/release | Fixed validation horizon (date or release) | Evidence and success threshold required by horizon | Observable discard trigger | Mandatory discard/simplification action | Decision record/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DEC-001/BET-001` | | | | | | | proposed / validated / discarded |

## 4. RDD focus and scope

### Focus — responsibilities directly supporting the variation

| RSP ID and responsibility | Current owner or role | Why it is in focus | Information needed | Collaborators |
| --- | --- | --- | --- | --- |
| | | | | |

### Scope — design area affected by a change

Map every concrete variation or change case across all impact categories. Each cell must contain stable IDs or an exact existing-record locator. Use `None — [reason]` only after checking that category; a blank cell means the scope analysis is incomplete.

| Variation/change case (example/EVD/SCN) | Affected responsibilities (RSP) | Affected participants, roles, and neighborhoods (CAN/ROL/NBR) | Affected collaboration stories and contracts (COL/CTR) | Affected tests, test knobs, or conformance suites | Affected operational procedures (configuration, deployment, migration, monitoring, recovery, support) | Direct or ripple effect | Required change or containment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

### Scope coverage check

Use this ledger to ensure the detailed rows above cover each required dimension without grouping away ownership.

| Required scope category | IDs or exact record/procedure locators | Impact owner | Verification that scope is complete |
| --- | --- | --- | --- |
| Responsibilities | `RSP-*` | | |
| Participants, roles, and neighborhoods | `CAN-*`, `ROL-*`, `NBR-*` | | |
| Collaboration stories and contracts | `COL-*`, `CTR-*` | | |
| Tests, test knobs, and conformance suites | Test IDs, commands, or exact suite locators | | |
| Operational procedures | Runbook, configuration, deployment, migration, monitoring, recovery, or support locators | | |

| Scope characterization | Entry |
| --- | --- |
| Size | local / neighborhood / subsystem / cross-system |
| Nature | extension / modification / new behavior |
| Investment | minor / modest / major |
| Recurrence | one-time / occasional / recurring |
| Trust or ownership boundaries crossed | |
| Responsibilities that should move, split, or be encapsulated | |
| Collaboration or contract updates required | |
| Test and conformance updates required | |
| Operational procedure updates required | |

**Scope conclusion:**  
_Explain whether the variation is localized, why it ripples, and whether responsibility reassignment should precede any new mechanism._

## 5. Required degree of flexibility

| Question | Decision |
| --- | --- |
| Who makes the change? | developer / deployer / operator / end user / running system |
| Earliest time it must change | compile / build / deployment / startup / between operations / during an operation |
| How often can it change? | |
| Must in-flight work retain its starting behavior? | |
| Must multiple adjustments take effect atomically? | |
| Is restart or redeployment acceptable? | |
| Must old and new realizations coexist? | |
| Required compatibility window | |

**Why a simpler change time is insufficient:**  
_Required only when runtime or user-directed variation is proposed._

## 6. Simplest sufficient realization

Compare plausible mechanisms. Do not treat the order as mandatory; use it to expose added machinery.

| Alternative | How it would work | Fits known examples? | Added participants or indirection | Benefits | Costs and risks | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Direct implementation | | | | | | |
| Parameter or focused value | | | | | | |
| Cohesive configuration holder | | | | | | |
| Replaceable collaborator behind a role | | | | | | |
| Factory or selection provider | | | | | | |
| Hook, callback, or template | | | | | | |
| Adapter at a boundary | | | | | | |
| Named design pattern | | | | | | |
| General framework or interpreted model | | | | | | |

**Selected mechanism:**

**Why it is the simplest sufficient option:**

**Why the next simpler option fails:**

**Why more elaborate options are not currently earned:**

**New or changed responsibility owners:**

| RSP ID and responsibility | Assigned role or participant (ROL/CAN) | Reason for assignment |
| --- | --- | --- |
| | | |

## 7. Frozen behavior and variation contract

**Invariant or frozen behavior:**

- 

**Permitted variable behavior:**

- 

**Shared role or service contract:**

Choose one mode:

- **New contract:** create a `CTR-*` record here and complete every field below. Use `Not applicable — [reason]` only when a field truly cannot affect this collaboration.
- **Existing complete contract:** give the existing `CTR-*` ID and exact artifact/section locator. Confirm in the last row that the linked record already contains every required field; do not create a partial shadow contract here.
- **No contract required:** state why no collaboration or boundary contract is introduced. Do not assign a new `CTR-*` ID.

Any new `CTR-*` record is incomplete unless it explicitly covers timing, ordering, idempotency, privacy, authorization, consistency, authoritative ownership, and verification ownership in addition to ordinary semantic terms.

| Contract element | Definition |
| --- | --- |
| Record mode | new complete CTR / linked existing complete CTR / no CTR required |
| Contract ID | `CTR-001`, linked existing `CTR-*`, or none |
| Existing contract locator | Exact artifact and section/anchor when linking; otherwise `Not applicable — new record` |
| Responsibility/request | Outcome-oriented request and related `RSP-*` IDs |
| Client role | |
| Provider or realization role | |
| Selection or configuration owner | |
| Preconditions and client obligations | |
| Postconditions and promised aftereffects | |
| Invariants | |
| Permitted exceptional outcomes | |
| Observable side effects | |
| Timing, deadlines, timeout, and cancellation | |
| Ordering and causality | |
| Idempotency, replay, and duplicate semantics | |
| Consistency, staleness, and convergence | |
| Privacy and data-handling limits | |
| Authentication and authorization | |
| Compatibility, schema, and versioning | |
| Authoritative fact/policy owner | `ROL/CAN/EXT` and the facts or decisions owned |
| Verification owner and evidence | `ROL/CAN` plus test, query, receipt, audit, or conformance evidence |
| Existing-record completeness confirmation | When linking: locator for all required fields; otherwise `Not applicable — new record completed above` |

### Hook and knob inventory

Use one row per intentional extension or configuration point. If no hook is needed, state that explicitly.

| Hook, knob, or factory | Owner (ROL/CAN) | Enables, disables, replaces, augments, adds, or configures | Allowed variation | Preconditions | Postconditions | Ordering or atomicity | Failure behavior | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | |

**Coordination rule:**  
_If several hooks must change together, identify the master operation or protocol that keeps them consistent._

**Extension recipe location:**

## 8. Configuration design

Complete this section when values, policies, providers, or features are configurable.

| Configuration concern | Decision |
| --- | --- |
| Authoritative owner | |
| Cohesive information holder | |
| Schema, valid values, and defaults | |
| Cross-field dependencies | |
| Source and loading mechanism | |
| Validation owner and time | |
| Selection precedence | |
| Update and activation boundary | |
| Atomic grouping | |
| Persistence and audit | |
| Access and authorization | |
| Versioning and migration | |
| Rollback or last-known-good behavior | |

**Why configuration is cohesive rather than scattered:**

## 9. Realization lifecycle

| Stage | Responsible participant | Trigger | Required state or action | Failure or concurrency concern |
| --- | --- | --- | --- | --- |
| Discover or register | | | | |
| Validate | | | | |
| Select | | | | |
| Create or load | | | | |
| Initialize | | | | |
| Activate | | | | |
| Use | | | | |
| Replace or reconfigure | | | | |
| Deactivate | | | | |
| Dispose or unregister | | | | |

**In-flight work policy:**  
_Explain what happens when selection or configuration changes while work is executing._

**Coexistence and version policy:**

## 10. Failure and recovery

| EXC ID and failure condition | Detector (ROL/CAN/EXT) | Detection RSP | Communication | Decision owner (ROL/CAN/EXT) | POL ID and policy | Resulting state | Failed-recovery policy | Actor or operator outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXC-001 Invalid realization or configuration | | | | | | | | |
| No compatible realization available | | | | | | | | |
| Selection or loading failure | | | | | | | | |
| Initialization failure | | | | | | | | |
| Partial coordinated update | | | | | | | | |
| Failure during use | | | | | | | | |
| Rollback or fallback failure | | | | | | | | |

**Safe default, fallback, or fail-closed behavior:**

**Conditions under which the system must reject rather than adapt:**

## 11. Verification and test knob

| Verification | Evidence or planned test | Pass condition |
| --- | --- | --- |
| Every concrete example fits the shared contract | | |
| Counterexample is rejected or routed correctly | | |
| Frozen invariants cannot be bypassed | | |
| Configuration validation and defaults | | |
| Selection and replacement | | |
| Lifecycle and cleanup | | |
| Coordinated or atomic update | | |
| In-flight behavior during change | | |
| Failure, fallback, and failed recovery | | |
| Backward and cross-version compatibility | | |
| Responsibility and collaboration simulation | | |

**Test knob or conformance suite:**  
_Name the single command, scenario, or harness an adapter uses to verify a new realization._

**Acceptance evidence required before activation:**

## 12. Complexity budget

| Cost dimension | Added cost | Allowed ceiling | Evidence or estimate | Owner |
| --- | --- | --- | --- | --- |
| New roles or participants | | | | |
| Interfaces, hooks, and indirection | | | | |
| Configuration and migration | | | | |
| Runtime, latency, or resource overhead | | | | |
| Build and deployment work | | | | |
| Test matrix | | | | |
| Documentation and recipe maintenance | | | | |
| Developer learning and misuse risk | | | | |
| Operational and support burden | | | | |

**Expected avoided cost over the decision horizon:**

**Time or release box for validating the mechanism:**  
_For any bet, this must exactly match the fixed validation horizon in the mandatory bet record; it cannot be “ongoing,” “later,” or eventless._

**Complexity-budget verdict:** earned / uncertain / exceeds benefit

## 13. Evolution triggers

Record observable signals that justify revisiting the mechanism.

| Trigger | Threshold or evidence (EVD/SCN/RSK) | Revisit action | Decision owner (ROL/CAN) |
| --- | --- | --- | --- |
| A third or materially different concrete case appears | | generalize or revise abstraction | |
| A direct edit repeats | | extract or strengthen the variation point | |
| Scope expands across a neighborhood or boundary | | revisit responsibility placement | |
| Change time moves earlier or later | | simplify or add lifecycle support | |
| Compatibility window changes | | revise contract and test matrix | |
| Failure consequence increases | | strengthen validation and recovery | |
| Extension procedure becomes fragile | | add a master knob, tool, or recipe | |
| Mechanism sees no real use | | simplify or remove | |

## 14. Discard or simplify criteria

Remove or reduce the mechanism when one or more agreed conditions occur:

- the expected variation does not appear by the stated release or date;
- known cases converge and no longer require different behavior;
- direct implementation remains cheaper across the decision horizon;
- hooks, placeholders, or configuration options remain unused;
- extension or operating cost exceeds the complexity budget;
- the mechanism obscures responsibility ownership or weakens invariants;
- a broader, evidenced hot spot supersedes this abstraction;
- stakeholder value or the underlying requirement disappears.

**Project-specific discard threshold:**

_Mandatory for every bet. Copy or link the observable trigger from the mandatory bet record and state the required removal, simplification, or reversion action. A review date without a threshold and action is insufficient._

**Removal, migration, or simplification plan:**

**Evidence to retain after discard:**  
_Preserve the decision and learning; do not preserve unused machinery merely as documentation._

## 15. Decision gate

- [ ] The real change need is stated independently of a solution.
- [ ] Evidence distinguishes facts, assumptions, and forecasts.
- [ ] At least two concrete examples are recorded.
- [ ] A third distinct example supports generalization, or the mandatory time-boxed bet record is complete.
- [ ] Every bet, experiment, pilot, trial, or provisional early generalization has a fixed date/release horizon, decision owner, evidence threshold, observable discard trigger, and mandatory discard/simplification action; no differently named unbounded bet remains.
- [ ] Similarities, important differences, and one invalid extension are visible.
- [ ] Focus and scope explicitly map affected `RSP` responsibilities, `CAN/ROL/NBR` participants and neighborhoods, `COL/CTR` collaborations and contracts, tests/conformance suites, and operational procedures; every category has IDs/locators or a reasoned `None`.
- [ ] The required actor and change time are explicit.
- [ ] The selected realization is the simplest sufficient mechanism.
- [ ] Frozen behavior, variable behavior, and ownership are unambiguous.
- [ ] Every new `CTR` record includes timing, ordering, idempotency, privacy, authorization, consistency, authoritative owner, and verification owner; any reused contract has an exact locator confirming those fields. Hook, configuration, compatibility, and lifecycle terms are complete where relevant.
- [ ] Failure, fallback, failed recovery, and resulting states are defined.
- [ ] A conformance or test path covers all examples and an invalid extension.
- [ ] Complexity fits an explicit budget.
- [ ] Evolution triggers and discard criteria are observable.

**Decision record ID and gate result:** `DEC-001` — approve / revise / defer / reject / retire

**Decision summary and rationale:**

**Residual risks and unresolved questions:**

- 

**Next experiment or evidence needed:**
