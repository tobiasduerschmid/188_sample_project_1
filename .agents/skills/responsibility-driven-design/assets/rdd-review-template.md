# RDD design review: [system or design name]

> Remove sections outside the review scope. Do not fill missing evidence with plausible design content.

## Review decision

| Field | Result |
| --- | --- |
| Approval verdict | [Approved / Approved with conditions / Revision required / Reject current design / Not assessable] |
| Known design disposition | [None / Conditions remain / Revisions required; when approval is Not assessable but direct evidence proves material defects, use Revisions required] |
| Confidence | [High / Medium / Low] |
| Weighted quality | [0–100 or NE] based on [rated weight]/100 |
| Evidence coverage | [0–100] |
| Controlling gates | [gate IDs and states] |
| Review date/version | [date, reviewed artifact version or commit] |
| Reviewed artifact maturity | [conceptual / proposed / implemented / observed reconstruction / hybrid / unknown] |
| Authority | [review only / review plus repair planning / review plus redesign] |

### Decision basis

[Two to five sentences: outcome first, strongest evidence, controlling gate, and why missing evidence is or is not decisive.]

### Conditions or minimum evidence to resume

- [Owned condition, evidence request, or `None`]

## Scope and evidence basis

### Review question

[Decision this review is intended to support.]

### In scope

- [Subsystem, scenarios, qualities, or design claims]

### Out of scope

- [Explicit exclusions]

### Evidence register

| Source ID or review locator | Artifact/source | Version/date | Artifact status | Precise scope used | Authority/conflict notes |
| --- | --- | --- | --- | --- | --- |
| [Submitted EVD ID, other source ID, or REV-EVD-001] | [name] | [version] | [conceptual/proposed/implemented/observed/hybrid/unknown] | [section, diagram, symbols, tests] | [notes] |

Preserve submitted IDs. Use a `REV-` alias only when the source supplies none, and record the original locator; reviewer-local IDs never replace submitted identifiers.

### Claim-level evidence ledger

| Review claim ID | Claim | Source ID and precise locator | Evidence status | Alternatives/conflict | Used by |
| --- | --- | --- | --- | --- | --- |
| REV-CLM-001 | [One factual review claim] | [submitted ID or REV-EVD + section/symbol] | [observed/corroborated/inferred/claimed/missing/conflicting] | [competing interpretation or none] | [dimension/gate/finding] |

### Assumptions

| ID | Assumption | Why needed | Owner | Validation/expiry |
| --- | --- | --- | --- | --- |
| [Submitted ASM ID or REV-ASM-001] | [assumption] | [blocked inference] | [owner] | [probe or date] |

## Design reconstructed as submitted

> Describe what the evidence says, not the design the reviewer would prefer.

### Purpose, actors, boundary, and outcomes

[Neutral reconstruction with evidence IDs.]

### System responsibilities

| Submitted SYS ID or review alias | System responsibility | Source ID/locator | Completion condition | Evidence status |
| --- | --- | --- | --- | --- |
| [SYS-001 or REV-SYS-001] | [obligation] | [submitted requirement/SCN/locator] | [externally meaningful result] | [status] |

### Participants and roles

| Submitted ID/name | Submitted kind | Stated purpose | Role interpretation | Stereotype blend | Responsibilities | Clients/collaborators | Evidence status/source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [CAN/ROL/class/service/name] | [candidate/role/implementation construct/unclear] | [stated purpose or missing] | [stated role; or labeled reviewer inference, not assumed from class] | [stereotypes] | [submitted RSP IDs or know/do/decide obligations] | [participants and reasons] | [status and locator] |

### Responsibility ownership ledger

| Submitted RSP ID or review alias | Responsibility | Source | Authoritative owner | Collaborators | Completion/aftereffect | Ownership issue | Record status | Evidence status/source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [RSP-001 or REV-RSP-001] | [obligation] | [submitted SYS/SCN/COL/locator] | [owner/unassigned/conflicting] | [who and why] | [observable result] | [none/duplicate/partial/missing] | [submitted status or unknown] | [observed/claimed/inferred/missing/conflicting and locator] |

### Neighborhoods and public paths

| Submitted NBR ID or review alias | Neighborhood | Collective purpose | Internal participants | Public interfacer/path | Boundary concerns | Record status | Evidence status/source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [NBR-001 or REV-NBR-001] | [name] | [purpose] | [submitted participant IDs] | [submitted role/request IDs] | [visibility/cost/trust] | [submitted status or unknown] | [observed/claimed/inferred/missing/conflicting and locator] |

### Control centers

| Submitted CTL ID or review alias | Center | Initiating events | Decisions and knowledge owners | Style | Sequencing/completion | Failure authority | Record status | Evidence status/source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [CTL-001 or REV-CTL-001] | [name] | [events] | [decisions/owners] | [centralized/clustered/delegated/dispersed] | [coordination] | [submitted owner/RSP/POL IDs or missing] | [submitted status or unknown] | [observed/claimed/inferred/missing/conflicting and locator] |

### Trust boundaries

| Submitted boundary/EXT/NBR ID | Crossing and trust claim | Boundary owner | Validation/translation/effect verification | Evidence status/source |
| --- | --- | --- | --- | --- |
| [ID or review alias] | [source → destination; trusted/untrusted/unknown assumptions] | [submitted owner or missing] | [responsibilities/policies or missing] | [status and locator] |

### Contracts and failure policies

| Submitted CTR/POL ID | Request/condition | Client/provider or policy owner | Conditions, aftereffects, resulting state | Evidence status/source |
| --- | --- | --- | --- | --- |
| [ID or review alias] | [request/failure] | [roles/owners] | [pre/post/invariants/exceptions/recovery] | [status and locator] |

### Variation

| Submitted HOT ID | Change driver and concrete cases | Focus/scope | Mechanism/selection owner | Evidence status/source |
| --- | --- | --- | --- | --- |
| [ID or review alias] | [variation evidence] | [affected RSP/COL/NBR] | [mechanism and owner or missing] | [status and locator] |

### Conceptual-to-implementation mapping

| Submitted IMP ID or review alias | Conceptual role | Implementation construct(s) | Mapping status | Evidence status/source | Coupling or loss of role information |
| --- | --- | --- | --- | --- | --- |
| [IMP-001 or REV-IMP-001] | [submitted ROL/CAN/RSP IDs] | [class/module/service/agent/etc.] | [proposed/implemented/observed/hybrid/unknown] | [observed/claimed/inferred/missing/conflicting and locator] | [notes] |

## Scenario traces and probes

### Trace [REV-TRC-001]: [scenario name]

- Type: [normal / alternate / boundary / failure / change / timing / lifecycle]
- Submitted source: [SCN/COL/use-case ID and locator, or missing]
- Hypothesis: [what this probe tests]
- Initiating condition: [intention-level event]
- Expected outcome: [externally meaningful result]
- Result: [completed / broke at step N / evidence ends at step N / conflicting]

| Step | Event/request | Receiver and authorizing responsibility | Needed knowledge and owner | Action/delegation | Reachability/lifetime | Contract/aftereffect | Evidence |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | [event] | [receiver/responsibility] | [knowledge/owner] | [action] | [path/lifetime] | [terms/result] | [locator/status] |

#### Probe implication

[Finding IDs, demonstrated strength, defect, risk, conflict, or exact evidence gap.]

## Rubric results

| ID | Dimension | Weight | Quality 0–4/NE | Coverage 0–4 | Confidence | Key evidence and finding IDs |
| --- | --- | ---: | ---: | ---: | --- | --- |
| D1 | Purpose, boundary, and system obligations | 12 | [ ] | [ ] | [ ] | [ ] |
| D2 | Roles and candidate model | 14 | [ ] | [ ] | [ ] | [ ] |
| D3 | Responsibility ownership and coherence | 18 | [ ] | [ ] | [ ] | [ ] |
| D4 | Collaborations, visibility, and reachability | 16 | [ ] | [ ] | [ ] | [ ] |
| D5 | Control centers and neighborhoods | 12 | [ ] | [ ] | [ ] | [ ] |
| D6 | Trust, reliability, and contracts | 12 | [ ] | [ ] | [ ] | [ ] |
| D7 | Change, variation, and design economy | 8 | [ ] | [ ] | [ ] | [ ] |
| D8 | Communication, implementation mapping, and validation | 8 | [ ] | [ ] | [ ] | [ ] |
|  | **Total/result** | **100** | **[quality]/100 on [rated weight]** | **[coverage]/100** | **[overall]** |  |

## Hard gates

| Gate | State | Evidence/finding | Required action or evidence |
| --- | --- | --- | --- |
| G1 Core responsibility coverage | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G2 Representative end-to-end trace | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G3 Collaboration reachability | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G4 Intelligible control and authority | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G5 Consequential failure and trust ownership | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G6 Evidence integrity | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |
| G7 Known blocker disposition | [PASS/FAIL/NOT EVALUABLE] | [locator/finding] | [action] |

## Findings

Record a consequential strength that needs a stable `RDD-###` identifier as a full-schema finding with class `strength`. A short unnumbered strengths summary may be included in the decision basis, but do not create abbreviated `RDD` findings outside this schema.

### RDD-[###]: [one-sentence claim]

| Field | Value |
| --- | --- |
| Class | [defect / risk / evidence-gap / conflict / strength] |
| Dimension | [D# and name] |
| Gate | [G# / none] |
| Priority | [blocker / high / medium / low / informational] |
| Confidence | [high / medium / low] |
| Status | [open / accepted / deferred / resolved] |
| Claim | [one falsifiable sentence, no stronger than the evidence] |
| Criterion | [responsibility-level expectation] |
| Scenario effect | [trace/probe and observed, credible, or blocked effect] |
| Impact | [concrete consequence] |
| Repair direction | [smallest responsibility, collaboration, contract, decision, or evidence change] |
| Verification | [bounded observable closure evidence] |
| Authority note | [review boundary or authorization] |

Evidence:

- `[source ID: precise locator]` — [observed/corroborated/inferred/claimed/conflicting] — [factual observation]
- `[source ID: precise locator]` — [status] — [second observation or conflicting claim]

## Evidence gaps and conflicts

> Keep these separate from demonstrated defects even when they block approval.

| Finding ID | Missing/conflicting evidence | Decision blocked | Priority | Minimum evidence or authority needed |
| --- | --- | --- | --- | --- |
| RDD-[###] | [gap/conflict] | [gate/verdict/dimension] | [priority] | [specific trace, artifact, contract, test, or decision] |

## Prioritized follow-up

| Order | Finding/condition | Owner | Bounded action | Verification | Redesign authorization needed? |
| ---: | --- | --- | --- | --- | --- |
| 1 | [ID] | [owner] | [responsibility-level repair or evidence request] | [closure evidence] | [yes/no] |

## Residual risks and complementary review

- [Accepted/deferred RDD risk, owner, and revisit trigger]
- [Threat model, performance model, usability study, formal method, data analysis, or other complementary practice needed—and why]

## Reviewer boundary

[Confirm that the review did or did not redesign or modify the submitted system. If redesign is authorized, mark the review complete first, record the authorizing person/decision, and identify a separate follow-on design artifact; never blend the replacement into the reconstruction above.]

**Redesign transition:** [Not authorized / authorized by and decision date → separate artifact ID or link]
