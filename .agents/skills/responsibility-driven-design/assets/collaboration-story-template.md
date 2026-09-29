# Collaboration story template

Use this form to explain how responsible participants collectively fulfill one system obligation. Keep one abstraction level per story. Split a large story into an overview and focused sub-stories rather than compressing consequential decisions or failures into an unreadable trace.

## Identifier and record rules

Reuse identifiers from the parent design. Keep them stable across revisions; mark a retired, split, merged, or superseded record instead of reusing its ID. When this story discovers a new item, allocate the next canonical ID in the parent design before referring to it here.

| Prefix | Canonical item |
| --- | --- |
| `COL` | Collaboration story |
| `CTL` | Control center or consequential control decision |
| `CTR` | Collaboration contract |
| `EXC` | Exceptional condition |
| `POL` | Failure or recovery policy |
| `SCN`, `SYS`, `QUA`, `CST`, `HOT` | Source scenario, system responsibility, quality/constraint, or variation hot spot |
| `ACT`, `EXT`, `NBR`, `ROL`, `CAN` | Actor, external participant, neighborhood, role, or candidate participant |
| `RSP` | Participant responsibility invoked in a trace or owned by a participant |
| `EVD`, `ASM`, `QST`, `DEC`, `RSK`, `IMP` | Evidence, assumption, question, decision, residual risk, or implementation mapping |

Record each fact once and link to it elsewhere. The `COL` record owns story scope and sequence; `CTL` owns control distribution; `CTR` owns client/provider obligations; `EXC` owns detection and routing of a condition; `POL` owns recovery action and bounds. Trace rows reference these IDs rather than restating their contents.

## Story metadata

| Field | Entry |
| --- | --- |
| Story ID and name | `[COL-001: outcome-oriented name]` |
| Design maturity | `[conceptual / proposed / observed / hybrid / implemented]` |
| Record lifecycle | `[working / validated / superseded]` |
| Version, date, and owner | `[version; YYYY-MM-DD; responsible maintainer]` |
| Audience | `[designer / implementer / reviewer / operator / stakeholder]` |
| Purpose or decision supported | `[what the reader should understand or decide]` |
| Source IDs | `[SCN, SYS, QUA, CST, HOT, EVD, or QST IDs]` |
| Learning goal | `[test control / find missing owner / test boundary / compare allocation / refine recovery / explain implementation]` |
| Scope and abstraction level | `[included behavior]` |
| Explicit black boxes and exclusions | `[participants or detail intentionally omitted]` |
| Evidence, assumptions, and questions | `[EVD, ASM, and QST IDs; do not blend their epistemic status]` |

## Promise of the story

- **Starting intention/event:** `[stakeholder- or system-level event, not a UI gesture]`
- **Preconditions:** `[authority, state, timing, resources, and facts required]`
- **Completion condition:** `[externally meaningful result]`
- **Successful aftereffects:** `[state changes, external effects, preserved invariants]`
- **Permitted non-success outcomes:** `[named outcomes and resulting state]`

## Participants

| Participant ID and name | Participant kind | Purpose in this story | Stereotype(s) | Invoked responsibility IDs | Exists before/created during | Neighborhood/trust region | Evidence/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `[ACT/EXT/ROL/CAN ID: name]` | `[actor / external / role / candidate / implementation construct if mapping is explicit]` | `[contribution]` | `[stereotype blend]` | `[RSP IDs]` | `[preexisting/created at COL step]` | `[NBR/EXT ID and trust note]` | `[EVD/ASM/IMP ID; status]` |
|  |  |  |  |  |  |  |  |

## Control-center record

Use the existing `CTL` record when the parent design already defines this control center. Repeat this block only when the story contains more than one distinct control center.

| Field | Entry |
| --- | --- |
| Control center ID and name | `[CTL-001: task or decision center]` |
| Controlling participant/neighborhood | `[ROL/CAN and NBR IDs]` |
| Source and evidence | `[SCN/SYS/COL/EVD/ASM IDs]` |
| Record status | `[working / selected / validated / superseded]` |
| Initiating events and desired outcome | `[events → outcome]` |
| Chosen style | `[centralized / clustered / delegated / dispersed]` |
| Decisions retained by the control center | `[sequencing, branch, timeout, completion]` |
| Decisions delegated and their owners | `[decision → knowledgeable owner]` |
| Completion, cancellation, and timeout knowledge | `[who knows and how]` |
| Failure and recovery authority | `[ROL/CAN owner, RSP ID, and governing POL IDs]` |
| Alternatives considered | `[DEC IDs or style/allocation and consequence]` |
| Rationale | `[why this distribution fits the problem]` |

## Normal collaboration trace

Each request must invoke an advertised responsibility. Record meaningful objects or information, not parameter trivia. Put request obligations in `CTR`, exception meaning in `EXC`, and recovery behavior in `POL`; link those records here.

| Step | Sender | Request/intention | Receiver | Responsibility ID | Information and authority owner | Result or aftereffect | Reachability summary | Control/timing | Governing IDs | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1` | `[ACT/EXT/ROL/CAN]` | `[outcome-level request]` | `[ROL/CAN/EXT]` | `[RSP ID]` | `[decision-relevant information → authoritative ACT/EXT/ROL/CAN]` | `[meaningful result/state]` | `[input/injected/created/discovered/owned; audit below]` | `[CTL ID; sync/async; who acts next]` | `[CTR/EXC/POL IDs or none]` | `[EVD/ASM/IMP ID and locator]` |
|  |  |  |  |  |  |  |  |  |  |  |

### Narrative and rationale

`[Explain why the sequence and responsibility distribution work. State any important algorithm, invariant, or domain decision that a trace cannot show. Do not merely repeat the rows.]`

## Branches and state changes

| Decision/transition | Control ID | Decision owner and RSP | Knowledge used and authoritative owner | Trigger | Resulting COL step/state | Invariants and governing IDs | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `[DEC ID or named transition]` | `[CTL ID]` | `[ROL/CAN and RSP ID]` | `[fact/policy → ACT/EXT/ROL/CAN]` | `[condition/event]` | `[step/state]` | `[invariant; CTR/EXC/POL IDs]` | `[EVD/ASM ID]` |

## Collaboration contracts

Complete one record for each consequential request across a trust, authority, process, service, device, or independently implemented boundary. A contract may also be useful for a high-consequence local request. Repeat the block for each `CTR` ID; use `not applicable — [reason]` instead of leaving a consequential semantic field ambiguous.

### CTR-001: [outcome-level request]

| Field | Contract definition |
| --- | --- |
| Contract ID and status | `[CTR-001; proposed / validated / superseded]` |
| Source and trace links | `[COL step, RSP, SCN/SYS/QUA/CST, and EVD/ASM IDs]` |
| Client role | `[ROL/CAN ID]` |
| Provider role | `[ROL/CAN/EXT ID]` |
| Trust and authority boundary | `[NBR/EXT crossing; what each side is authoritative for; trust assumptions]` |
| Preconditions / client obligations | `[authority, valid state, information, timing, resources]` |
| Postconditions / provider obligations | `[successful result, state, and externally relevant aftereffects]` |
| Invariants preserved | `[facts that remain true across success and permitted non-success]` |
| Side effects | `[persistent state, external action, event, notification, resource effect, or none]` |
| Permitted exceptional outcomes | `[EXC IDs; typed outcome and resulting state]` |
| Timing, ordering, duplication, and idempotency | `[semantics and bounds, or not applicable with reason]` |
| Consistency and authoritative-state semantics | `[source of truth, staleness, atomicity/visibility, reconciliation, or not applicable with reason]` |
| Privacy, authentication, and authorization semantics | `[data exposure and authority checks, or not applicable with reason]` |
| Authoritative owner(s) | `[fact/invariant/effect → ACT/EXT/ROL/CAN owner]` |
| Verification owner and evidence | `[ROL/CAN/EXT owner; test/probe/monitor/EVD ID]` |
| Residual questions and risks | `[QST/RSK IDs or none]` |

## Exceptional conditions and recovery policies

Keep the normal story readable. Include one or two important cases here and link to a policy table or separate story for a larger family.

### Exceptional-condition catalog

`EXC` records own condition classification, detection, communication, and routing. Recovery behavior belongs in the linked `POL` record.

#### EXC-001: [exceptional condition]

| Field | Condition definition |
| --- | --- |
| Exception ID and status | `[EXC-001; proposed / validated / superseded]` |
| Source and trace links | `[COL step, SCN/QUA/CST/CTR, and EVD/ASM IDs]` |
| Condition | `[observable condition, not its recovery action]` |
| Level | `[use case / participant / neighborhood / boundary]` |
| Classification | `[expected non-success / error / exception / external failure / programming defect]` |
| Consequence | `[state, stakeholder, quality, financial, safety, or operational impact]` |
| Likelihood | `[common / plausible / uncertain / improbable, with evidence]` |
| Detector participant | `[ROL/CAN/EXT ID]` |
| Detection responsibility | `[RSP ID]` |
| Signal and recasting boundary | `[typed result/event; CTR/NBR/EXT ID; translation or preservation of meaning]` |
| Recovery decision participant | `[ROL/CAN/EXT ID]` |
| Handling responsibility | `[RSP ID]` |
| Governing policy | `[POL IDs]` |
| State before recovery decision | `[known, unknown, partial, provisional, inconsistent, etc.]` |
| Actor-visible outcome before/without recovery | `[reported/pending/unavailable/etc.]` |
| Evidence, assumptions, and questions | `[EVD/ASM/QST IDs]` |

### Failure and recovery policy catalog

`POL` records own the recovery decision, executor behavior, bounds, and failure-during-recovery result. One policy may cover several `EXC` records.

#### POL-001: [failure or recovery policy]

| Field | Policy definition |
| --- | --- |
| Policy ID and status | `[POL-001; proposed / validated / accepted / superseded]` |
| Conditions covered | `[EXC IDs]` |
| Source and rationale | `[SCN/QUA/CST/CTR/EVD/ASM/DEC IDs]` |
| Policy | `[Balk / Suspend / Provisional / Recover / Escalate / Rollback / Retry / Inaction]` |
| Recovery decision owner | `[ROL/CAN/EXT ID and RSP ID]` |
| Executor | `[ROL/CAN/EXT ID and RSP ID]` |
| Retry, wait, and cancellation bounds | `[attempt/time/backoff/deadline/cancel bounds or not applicable with reason]` |
| Cleanup, compensation, or reconciliation | `[action, authoritative owner, ordering, and failure signal]` |
| Successful recovered state | `[predictable state and actor-visible outcome]` |
| Failed-recovery policy and state | `[next POL/escalation; final state and actor-visible outcome]` |
| Consistency/idempotency implications | `[preserved invariant and duplicate/partial/unknown-outcome semantics, or not applicable with reason]` |
| Verification owner and evidence | `[ROL/CAN/EXT owner; test/probe/monitor/EVD ID]` |
| Residual risk and revisit trigger | `[RSK/QST IDs; acceptance owner and trigger]` |

Exception trace when order matters:

| Step | EXC ID | Sender | Request/signal | Receiver | Responsibility ID | Governing CTR/POL IDs | Resulting state/aftereffect | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `E1` | `[EXC-001]` | `[ROL/CAN/EXT]` | `[typed request/signal]` | `[ROL/CAN/EXT]` | `[RSP ID]` | `[CTR/POL IDs]` | `[state/effect]` | `[EVD/ASM/IMP ID]` |

## Reference and lifecycle audit

This is the authoritative record for runtime reachability. Trace rows contain only a summary.

| Relationship and trace links | Acquisition path | Reference/lifecycle owner | Cardinality | Lifetime | Refresh/disposal | Unavailable/stale/replaced behavior | Boundary/cost | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `[sender → receiver; COL steps; CTR ID]` | `[input / injection / create / result / discover / subscribe / owned reference]` | `[ROL/CAN/EXT]` | `[one/many/variable]` | `[request/scenario/session/process/persistent]` | `[when/how/by whom]` | `[EXC/POL IDs]` | `[NBR/EXT; local/remote; sync/async]` | `[EVD/ASM/IMP ID]` |

## Scenario findings

- **Responsibilities added, moved, split, or clarified:** `[RSP IDs and changes]`
- **Candidates or roles added, merged, renamed, deferred, or rejected:** `[CAN/ROL IDs and changes]`
- **Control changes:** `[CTL/DEC IDs and changes]`
- **Contract, exception, or recovery changes:** `[CTR/EXC/POL IDs and changes]`
- **Visibility leaks or chatty paths found:** `[affected COL/NBR/EXT IDs; finding and bounded repair]`
- **Boundary/trust findings:** `[affected CTR/NBR/EXT IDs; finding and bounded repair]`
- **Residual questions and risks:** `[QST/RSK IDs; impact; evidence/experiment needed]`

## Alternative trace

- **Decision ID:** `[DEC ID]`
- **Alternative allocation or sequence:** `[brief trace]`
- **What it improves:** `[quality or simplicity]`
- **What it worsens:** `[coupling, control, risk, cost]`
- **Decision evidence and revisit trigger:** `[EVD/ASM/QST IDs and evidence that would change it]`

## Traceability index

Include every consequential record introduced or materially exercised by this story. Link to the canonical parent-design record rather than copying its definition.

| Item ID | Kind | Source/derivation | Used at | Verification/evidence | Status |
| --- | --- | --- | --- | --- | --- |
| `[CTL/CTR/EXC/POL/RSP/etc.]` | `[canonical kind]` | `[SCN/SYS/QUA/CST/HOT/EVD/ASM/QST IDs]` | `[COL steps/section]` | `[owner and EVD/test/probe/monitor]` | `[working/proposed/validated/superseded/accepted]` |

## Realization and validation — complete last

| IMP ID | Conceptual role/responsibility | Current or proposed realization | Evidence/status | Verification owner | Test, prototype, monitor, or observation validating the story |
| --- | --- | --- | --- | --- | --- |
| `IMP-001` | `[ROL/RSP IDs]` | `[class/module/service/function/process/workflow/agent]` | `[EVD ID; proposed/implemented/observed]` | `[ROL/CAN/EXT]` | `[evidence and result]` |

### Completion check

- [ ] The initiating event and completion condition are externally meaningful.
- [ ] Every receiver advertises the invoked responsibility.
- [ ] Every sender can reach its receiver for the required lifetime.
- [ ] Each consequential decision sits with a role that has or can obtain the needed knowledge.
- [ ] Every control center has a stable `CTL` ID, deliberate style, decision distribution, and failure authority.
- [ ] Every consequential boundary request has a `CTR` record with client/provider obligations, invariants, side effects, authority/trust, applicable consistency/privacy semantics, and a verification owner.
- [ ] Every material exceptional condition and recovery rule has stable `EXC` and `POL` IDs; detection, routing, decision, execution, recovered state, and failed recovery remain distinct.
- [ ] Neighborhood, deployment, and trust boundaries remain visible and purposeful.
- [ ] Success and important non-success paths leave predictable state.
- [ ] Recovery actions have an owner and failure-during-recovery is addressed.
- [ ] The story exposes no private structural knowledge without a stated trade-off.
- [ ] Conceptual responsibilities remain distinct from implementation mechanics.
- [ ] Canonical IDs link sources, responsibilities, traces, contracts, exceptions, policies, decisions, implementation mappings, and validation without renumbering or duplicate definitions.
- [ ] Assumptions, omissions, unresolved risks, evidence status, and verification ownership are explicit.
