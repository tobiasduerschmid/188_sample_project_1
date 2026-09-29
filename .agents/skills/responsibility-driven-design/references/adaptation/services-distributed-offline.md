# Services, distributed collaboration, and offline-first systems

> **Provenance boundary - modern extension beyond the book:** This reference adapts the book's concepts of components, interfaces, collaborations, connection problems, trust, contracts, control, and reliability to contemporary independently deployed services, remote protocols, operation identity, and offline-first synchronization. Those realization details are original extensions and must not be attributed to Wirfs-Brock and McKean.

Read [modern-systems.md](modern-systems.md) first for the classic-to-modern mapping and shared adaptation rules. Also read [../practice/reliability-and-contracts.md](../practice/reliability-and-contracts.md) when failure consequences are material.

## Services and independently deployed components

A service can realize:

- one substantial participant;
- several roles belonging to one cohesive neighborhood;
- an interfacer protecting an external system;
- a control center for a long-running process; or
- an implementation boundary containing several internal participants.

Choose a service boundary because responsibilities, authoritative data, lifecycle, change cadence, scaling, reliability, security, or organizational ownership cohere there. Do not derive boundaries by converting every domain noun into a service.

For each service record:

`service | conceptual roles realized | clients | responsibilities | authoritative facts | owned policies | accepted requests/events | emitted outcomes/events | internal neighborhood | trust boundaries | failure owner | deployment rationale`

### Service design tests

- Does the service offer an outcome-oriented vocabulary, or merely remote getters and setters?
- Can it preserve its invariants without clients coordinating its internal records?
- Is each authoritative fact or policy owned in one place?
- Does a client need several chatty calls to assemble enough knowledge to make a decision the service should own?
- Is cross-service consistency actually required, and who owns the resulting process?
- Can the service evolve its internals without leaking storage layout, vendor protocol, or incidental workflow steps?
- Does operational independence justify the latency, versioning, partial-failure, and observability cost?

An endpoint is part of the request vocabulary. Name the responsibility first, then design one or more operations that let clients request it. A CRUD-shaped endpoint may be appropriate, but it is not evidence that responsibility ownership is coherent.

### Authoritative data and shared information

Assign one authoritative owner for each consequential fact or invariant. Other participants may hold projections, caches, search indexes, offline replicas, or analytical copies, but their status and permitted staleness must be explicit.

When no single service can legitimately own a cross-system fact, model the distinction instead of inventing false central authority. For example, one participant may own order intent, another fulfillment state, and a process manager the knowledge of whether the multi-party obligation has reached a terminal business outcome.

## Remote collaborations

A remote request is not a slower local call. The requester may not know whether a timeout means “not received,” “still running,” “completed but response lost,” or “partially completed.” For every consequential remote collaboration specify:

- semantic client and provider roles;
- transport and discovery mechanism;
- authentication, authorization, tenant, and data-handling boundary;
- request identity and correlation;
- deadline and cancellation semantics;
- retry eligibility, budget, backoff, and ownership;
- idempotency or deduplication key and retention window;
- result, permitted failure categories, and abstraction-level recasting;
- partial-effect detection and compensation limits;
- version compatibility and rollout policy;
- authoritative state and permitted consistency delay;
- evidence that lets clients or operators verify the aftereffect.

Prefer coarse, meaningful collaborations across a remote boundary. Repeated remote interrogation often means the provider has exported information while retaining the decision responsibility, forcing the client to reconstruct its internals.

## Distinguish operation identity, concurrency, and causality

Do not collapse all repeated-looking traffic into “duplicates.” A reliable design distinguishes at least these five cases:

| Case | Evidence | Required semantic decision |
| --- | --- | --- |
| Replay of the same operation | Same operation ID and same canonical content or content fingerprint | Do not apply the business effect twice. Continue the recorded attempt or return the previously recorded outcome according to the contract. |
| Distinct concurrent operations | Different operation IDs, possibly against the same target and from different actors | Treat each as a real request. Decide whether they commute, require serialization, compete under an invariant, or need explicit conflict resolution. Deduplication is incorrect. |
| Stale operation | It was validly created against an older revision, lease, assignment, policy, credential, or time window | Revalidate against current authority. Reject, rebase, merge, compensate, or obtain a new decision; do not silently accept merely because its ID is new. |
| Out-of-order dependent operation | One operation declares or implies a causal predecessor that has not been observed | Buffer, defer, request the missing predecessor, or reject according to a bounded policy. It is neither a duplicate nor ordinary concurrency. |
| Operation-ID reuse with changed content | Same operation ID but different canonical content, actor, target, or semantic fingerprint | Treat as a protocol integrity or security violation. Reject it, preserve evidence, and never return the first operation's result as if it applied to the changed request. |

Operation identity belongs to the business attempt, not an individual network transmission. Define who creates IDs, their uniqueness scope, how canonical content is fingerprinted, and how long the provider retains outcome and fingerprint records. The provider's deduplication window and the client's retry window must be compatible.

For state-changing operations, include applicable concurrency evidence such as an expected revision, entity tag, lease/assignment token, causal predecessor, vector or logical clock, or invariant-specific reservation. A timestamp alone rarely proves causality.

## Contracts for modern boundaries

Preconditions, postconditions, invariants, and client/provider obligations are book-grounded. The additional dimensions here are modern extensions for process, organizational, temporal, and distributed boundaries.

Keep two related layers:

- **Semantic contract:** responsibility requested, valid-use conditions, authoritative meaning, successful aftereffect, preserved invariants, and permitted business exceptions.
- **Interaction contract:** encoding, protocol, authentication, timing, delivery, ordering, retry, concurrency, versioning, observability, and operational limits.

Modern contract record:

`responsibility | client role | provider role | preconditions | postconditions | invariants | business exceptions | authority | side effects | protocol/schema | operation identity/content fingerprint | delivery | ordering/causality | deadline | cancellation | idempotency | concurrency | staleness | consistency | auth/privacy | versioning | compensation | evidence/telemetry | owner`

Add only fields that materially affect the collaboration. A low-risk pure function does not need a distributed protocol specification; a money-moving remote operation does.

Contract review questions:

- Does the contract promise a stakeholder-relevant result rather than mere transport receipt?
- Can the provider actually observe and guarantee the postcondition?
- Can a client safely repeat, cancel, or time out the request?
- Are replay, distinct concurrency, stale work, causal reordering, and changed-content ID reuse distinguished?
- Are transient, permanent, and ambiguous outcomes distinguishable?
- Are schema compatibility and semantic compatibility both addressed?
- Are consistency and staleness limits stated from the client's point of view?
- Can operators determine whether the promise was kept without inspecting private implementation details?

## Offline-first responsibility model

Offline-first is not simply a cache plus later upload. It is a temporary redistribution of authority, knowledge, and control while remote collaborators are unreachable.

Identify explicit roles for:

- the local actor and device/session authority;
- the local state owner;
- the durable operation journal;
- the synchronization coordinator;
- the authoritative remote participant;
- conflict policy or resolver;
- receipt/outcome store; and
- human higher authority for cases no algorithm can settle responsibly.

Classify every local datum as one of:

- **authoritative locally:** the local participant is legitimately allowed to establish the fact;
- **confirmed mirror:** last known authoritative remote fact, with revision and observation time;
- **provisional local:** a prediction of what will be true if queued operations are accepted;
- **derived:** recomputable from named source facts.

Never display provisional state as confirmed without an explicit product decision and visible semantics.

### Durable journal contract

Record enough to resume and adjudicate each attempt:

`operation ID | canonical content fingerprint | actor/device | target | intent | base revision | causal predecessors | lease/assignment token | creation time | authorization context | payload version | local effects | status | attempts | authoritative receipt/outcome`

Persist the journal entry before exposing a local effect that depends on eventual synchronization. Protect journal integrity and sensitive content. Define compaction only after the authoritative receipt and any dependent causal chain are durably known.

### Offline-first design subworkflow

1. **Allocate authority.** State which decisions remain legal offline, which are provisional, and which require the authoritative collaborator.
2. **Set the offline envelope.** Define maximum offline duration from business freshness, credential expiry, lease duration, schema compatibility, safety, and conflict cost. “Until connectivity returns” is not a bounded policy.
3. **Capture causal context.** Create a stable operation ID and content fingerprint; record base revision, causal predecessors, assignment or lease token, actor, and relevant policy/schema version.
4. **Journal before effect.** Durably append the operation before presenting its provisional local aftereffect. Make restart between any two steps safe.
5. **Reconstruct after restart.** Reload confirmed state, provisional projections, pending operations, receipts, and causal metadata. Resume attempts without issuing a new operation ID for the same intent.
6. **Synchronize deliberately.** Send operations with their original identity and causal context. Do not assume journal order alone equals business dependency.
7. **Classify each response or conflict.** Distinguish same-operation replay, distinct concurrency, staleness, missing causal predecessors, and changed-content operation-ID reuse.
8. **Apply authoritative receipts.** Persist the receipt and authoritative revision before marking an operation complete or pruning retry state. Reconcile provisional views with the accepted, rejected, merged, or compensated outcome.
9. **Resolve reassignment conflicts.** If a task, resource, account, or authority was reassigned while this device was offline, use the recorded assignment/lease token. Reject or escalate unauthorized stale work; merge only when business semantics permit it. Never use last-writer-wins to conceal a change in who was entitled to act.
10. **Converge or escalate.** Every pending operation must reach an accepted, rejected, superseded, compensated, expired, or human-review state. “Still syncing” cannot be an unbounded terminal category.
11. **Retain evidence.** Keep receipts and operation fingerprints at least as long as any client can replay, any dependent operation can arrive, or audit/recovery policy requires. Coordinate client journal pruning with server deduplication retention.
12. **Test the envelope.** Exercise crash before and after journal append, restart during sync, duplicate transmission, concurrent remote work, stale authorization, missing predecessor, out-of-order delivery, reassignment, maximum-offline expiry, schema upgrade, and lost receipt.

### Reassignment conflicts

Reassignment is more than an ordinary field conflict. It changes who owns the right or obligation to perform work. Model assignment or lease authority as a consequential fact with an authoritative owner. An offline operation should carry the authority token under which it was created.

Possible policies include:

- reject work performed after authority expired;
- accept work completed before a recorded cutoff;
- preserve the evidence but require a current assignee or supervisor to ratify it;
- merge nonexclusive observations while rejecting exclusive state changes;
- compensate an already exposed local side effect; or
- escalate when physical-world work cannot be undone.

Choose from domain consequences. A syntactic merge cannot decide legitimacy.

## Distributed and offline review

- Is the conceptual service boundary justified by cohesive responsibilities rather than deployment fashion?
- Are authoritative, mirrored, provisional, and derived states distinguishable?
- Does every remote operation have semantic identity independent of transmissions?
- Can the design distinguish all five replay/concurrency/causality cases?
- Are retry and deduplication retention windows compatible?
- Are ambiguous outcomes, partial effects, cancellation, and compensation owned?
- Can an offline client restart at every interruption point without duplicating intent or losing causal context?
- Is maximum offline duration explicit and enforceable?
- Are receipts retained long enough for retry, dependency, recovery, and audit needs?
- Are reassignment and expired-authority conflicts treated as responsibility problems rather than ordinary data merges?
- Does every queued operation eventually converge to a named outcome or higher authority?
