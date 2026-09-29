# CRC card template

Use one card per provisional **candidate** (`CAN`) or explicit replaceable **role** (`ROL`), not per assumed class. Identify which kind the card represents. Keep the working card small enough to compare and move. Use the optional rigor fields only when the design element is central, boundary-crossing, stateful, failure-prone, or contested.

Responsibilities are obligations to **know/provide**, **do**, or **decide**. Do not list fields, getters, endpoints, method signatures, framework annotations, or implementation steps.

## Card identity

| Field | Entry |
| --- | --- |
| Card kind and ID | `[Candidate CAN-001 / Role ROL-001]` |
| Candidate or role name | `[singular, role-revealing name]` |
| Artifact status | `[conceptual / proposed / observed / implemented / hybrid]` |
| Design version/date | `[version and date]` |

## Front: character and reason to exist

**Purpose**

> A `[candidate name]` is a `[familiar kind of participant or role]` that `[principal contribution]`. It `[one salient fact about its behavior, knowledge, decisions, or clients]`.

| Prompt | Entry |
| --- | --- |
| Primary role | `[coherent responsibilities defining its character]` |
| Secondary role(s) | `[incidental domain or technical roles; omit if none]` |
| Stereotype blend | `[information holder / structurer / service provider / coordinator / controller / interfacer / justified custom stereotype]` |
| Themes or system responsibilities supported | `[THM and SYS IDs]` |
| Principal clients and promised outcomes | `[who values it and why]` |
| Architectural neighborhood | `[where it belongs and the neighborhood's collective purpose]` |
| Boundary position | `[core / user boundary / external-system boundary / internal neighborhood boundary]` |
| Important events or lifecycle | `[creation, activation, state changes, timeout, completion, disposal]` |
| Why this candidate exists | `[what becomes clearer, safer, or more changeable because it exists]` |
| Distinguishing facts | `[how it differs from nearby candidates]` |
| Explicit exclusions | `[what it does not own]` |

### Evidence for character claims

Do not assign one evidence state to the whole card. Record the basis of each consequential purpose, role, boundary, lifecycle, or exclusion claim separately. Preserve source IDs supplied by the design.

| Card field or claim | Claim kind | Source ID and precise locator | Evidence status | Design consequence |
| --- | --- | --- | --- | --- |
| `[purpose, role, boundary, lifecycle, distinction, or exclusion]` | `[observed fact / assumption / design decision / open question]` | `[EVD/ASM/QST/SCN/SYS/THM/CST/QUA/DEC ID and locator]` | `[observed / corroborated / inferred / claimed / missing / conflicting]` | `[what this permits, constrains, or leaves unresolved]` |
|  |  |  |  |  |

## Back: responsibilities and collaborators

### Responsibilities

Keep public obligations first. Add private supporting obligations only when they materially explain feasibility or risk.

| ID | Kind | Visibility | Responsibility statement | Stable trace/source IDs | Discovery lens | Client or outcome | Evidence/assumption/question IDs | Evidence status | Notes/invariant |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RSP-001` | `[know / do / decide]` | `[public / private]` | `[strong, outcome-level obligation]` | `[SYS/SCN/THM/EVD/QUA/CST/COL/CTL/CTR/POL/HOT/DEC IDs]` | `[use case or scenario / description gap / theme or design story / what-if chain / stereotype / deeper nature / relationship / life event / technical environment]` | `[beneficiary or result]` | `[EVD/ASM/QST IDs]` | `[observed / corroborated / inferred / claimed / missing / conflicting]` | `[constraint; not implementation]` |
|  |  |  |  |  |  |  |  |  |  |

Responsibility-quality check:

- [ ] Each statement is above the field/method level and uses a precise domain verb.
- [ ] Public responsibilities describe outcomes useful to clients.
- [ ] Private responsibilities directly support a public obligation.
- [ ] Knowing, doing, and deciding responsibilities form one coherent character.
- [ ] Consequential facts, invariants, policies, relationships, and recovery actions have one authoritative owner.
- [ ] The card is not hiding overload behind vague words such as *manage*, *handle*, or *process*.

### Collaborators

Record only collaborators required to fulfill advertised responsibilities. A static dependency with no request is not a collaboration.

| Collaborator role | Requested responsibility ID or outcome | Why help is needed | Acquisition path | Cardinality and lifetime | Boundary/cost | Failure obligation | Evidence/assumption IDs | Evidence status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `[ROL/CAN, not incidental class]` | `[RSP ID or advertised outcome]` | `[portion not performed locally]` | `[input / injection / create / result / discover / subscribe / owned reference]` | `[one/many; request/scenario/session/process/persistent]` | `[local/remote; trust or deployment crossing]` | `[balk/retry/recover/escalate/cleanup owner]` | `[EVD/ASM/QST/COL/CTR IDs]` | `[observed / corroborated / inferred / claimed / missing / conflicting]` |
|  |  |  |  |  |  |  |  |  |

Collaboration-quality check:

- [ ] Every receiver advertises the requested responsibility.
- [ ] Every sender can plausibly obtain and retain the receiver for the needed lifetime.
- [ ] Collaborations cross natural boundaries through purposeful roles.
- [ ] Remote or trust-crossing requests state timeout, ambiguity, retry safety, and externally relevant effects when needed.
- [ ] The candidate does not reveal a collaborator's private structure through message chains.

## Optional rigor annex

Complete only when consequence warrants it.

### Contract or invariant

| Contract field | Definition |
| --- | --- |
| Contract ID and request | `[CTR-001: outcome-level request]` |
| Invoked responsibility | `[RSP ID]` |
| Client role | `[ROL/CAN ID]` |
| Provider role | `[ROL/CAN/EXT ID]` |
| Trust/authority boundary | `[trust region, authority crossing, and authoritative source]` |
| Preconditions/client obligations | `[valid state, authority, inputs, timing, and other conditions of use]` |
| Postconditions/provider obligations | `[promised result and resulting state]` |
| Invariants preserved | `[facts or conditions that remain true]` |
| Permitted exceptional outcomes | `[typed non-success outcomes, communication, and resulting state]` |
| Observable side effects | `[state changes, events, external effects, or none]` |
| Timing/ordering/idempotency | `[semantics, bounds, or not applicable]` |
| Privacy/authorization/consistency | `[semantics, guarantees, or not applicable]` |
| Authoritative owner | `[ROL/CAN/EXT ID]` |
| Verification owner and evidence | `[ROL/CAN ID plus SCN/test/observation]` |

### Decision and information ownership

| Decision/fact | Authoritative owner | Consumers | Why ownership fits | Staleness or consistency rule | Evidence/assumption IDs | Evidence status |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

### Candidate or role defense

- **Best argument to keep it:** `[purpose, value, and evidence]`
- **Closest competing candidate/allocation:** `[alternative]`
- **Why responsibilities are not merged there:** `[behavioral distinction]`
- **Reason to split, merge, rename, or revisit:** `[trigger]`
- **Open questions:** `[question, impact, owner, due point]`

## Disposition and history

Complete this section for every candidate or role; it is not part of the optional rigor annex. This is the card's single canonical disposition register. Do not repeat a separate disposition in card identity. Keep prior rows when the disposition changes, and mark exactly one row as current. Preserve rejected, merged, split, and superseded records so later designers do not rediscover an unexplained dead end or reuse an ID.

| Effective version/date | Disposition | Current? | Target, successor, or resulting IDs | Responsibility movement | Rationale and evidence | Revisit trigger |
| --- | --- | --- | --- | --- | --- | --- |
| `[version/date]` | `[Accepted (retained) / Deferred / Rejected / Merged into CAN-### or ROL-### / Split into CAN-### or ROL-### IDs / Superseded by CAN-### or ROL-###]` | `[Yes/No; exactly one Yes]` | `[CAN/ROL IDs, unassigned backlog, or none]` | `[RSP IDs → new owners, or none]` | `[specific reason plus EVD/ASM/DEC/QST IDs]` | `[deciding evidence, scenario, date, or none]` |

## Realization notes — complete last

Do not let this section rewrite the conceptual card.

| Role/responsibility | Possible realization | Confidence | Technology-imposed secondary duties | Validation needed |
| --- | --- | --- | --- | --- |
|  | `[interface, class, module, service, function, process, workflow, or agent]` | `[low/medium/high]` | `[framework lifecycle, serialization, protocol, etc.]` | `[test/prototype/benchmark]` |
