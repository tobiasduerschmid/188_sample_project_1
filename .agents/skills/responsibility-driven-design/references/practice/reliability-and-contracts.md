# Reliable collaborations and contracts

Unless marked **Modern extension**, this file paraphrases the book's reliability model. Modern additions preserve the same responsibility-first logic but extend contracts for contemporary distributed, adversarial, or probabilistic boundaries.

## Start from consequences

Reliability is an economic and ethical design decision. Do not design for every imaginable failure. Scale effort to consequence, likelihood, exposure, and the system's ability to recover.

The book's criticality scale is:

1. loss of comfort;
2. loss of discretionary money;
3. loss of essential money;
4. loss of life.

Unattended operation, integration software, plug-in components, public infrastructure, and consumer products may justify added reliability even below safety-critical levels.

For each core scenario state:

- what failure means to the actor and organization;
- whether work, money, data, authority, safety, or trust can be lost;
- how long the effect persists and whether it is reversible;
- the reliability budget justified by that consequence;
- which collaboration is the weakest relevant link.

Do not make one peripheral object extremely defensive while the critical chain remains brittle.

## Map trust regions

A trust region is a part of the design in which collaborators intentionally rely on one another to satisfy assigned obligations. Trust is mainly a design-time allocation of responsibility, not a runtime identity label.

Typical boundaries:

- user input to application core;
- application to external system or device;
- outside to inside a neighborhood;
- architectural layer or abstraction-level transition;
- first-party to third-party code;
- separately deployed or independently owned component;
- **Modern extension:** deterministic to probabilistic or human collaborator.

### Trusted collaboration

Within a valid trust region, the designated participant normally validates once; others need not repeat the same semantic check. Intentional redundancy remains appropriate for defense in depth, independent integrity checks, or a stated safety requirement. Clients send well-formed, timely requests; providers make the promised attempt and communicate legitimate exceptions. Trust does not mean nothing can fail. A valid request can encounter an out-of-stock condition or unavailable resource.

### Untrusted collaboration

Untrusted means local assumptions cannot safely be made, not necessarily that the collaborator is defective or hostile. Possible boundary duties include:

- validate form, authority, relevance, and timeliness;
- copy or translate mutable data into a trusted representation;
- restrict the offered interface;
- verify important aftereffects;
- recast external failures into domain-level results;
- preserve enough context for recovery;
- **Modern extension:** rate-limit, authenticate, authorize, or isolate when adversarial use is plausible.

Do not make every participant defensive. Put boundary responsibilities in a clear owner so the protected core can remain simpler.

Separate three cases because they assign different duties:

- **Receiving an untrusted request:** an inbound interfacer validates form, authority, relevance, freshness, and safe translation before trusted participants act.
- **Calling an untrusted provider:** an outbound interfacer or client-side boundary owner constrains the request, verifies consequential aftereffects, translates provider failures, and retains recovery context.
- **Serving unknown library or framework clients:** the provider protects its invariants, checks stated preconditions at its public boundary, and rejects invalid use predictably rather than assuming every caller follows local conventions.

For each important boundary record:

`source | destination | trust assumptions | validator | translator | authoritative data owner | permitted requests | effect verification | failure policy`

## Distinguish errors and exceptions

- An **error** is something fundamentally wrong for the current recovery envelope: corrupt state, malformed data that should have been impossible, a logic defect, or broken infrastructure with no meaningful local continuation.
- An **exception** is an infrequent but anticipated condition the design intends to accommodate.

This classification is policy- and context-dependent. A mistyped password is an exception when recovery is expected. A hardware fault may be treated as an error in an ordinary application and as a recoverable condition in a life-critical one.

Do not read "ordinary software may not recover from errors" as permission to swallow defects. Detect, contain, report, fail safely, restart, or escalate according to risk. The point is not to pretend every invalid state has a meaningful continuation.

### Use-case versus object exception

- A **use-case exception** diverts or ends an actor's scenario.
- An **object exception** means one participant cannot fulfill one request.

One scenario step can involve many object exceptions. Map low-level conditions to the stakeholder-visible outcome; there is no one-to-one correspondence.

Handling means returning the system to a predictable state and enabling an intended continuation, alternate outcome, or safe stop. Detection or logging alone is not handling.

## Communicate exceptional conditions

Options include:

- raise or throw an exception;
- return a typed result or status;
- retain status and expose a query;
- **Modern extension:** emit a domain event for asynchronous resolution.

Choose based on language, process boundary, control owner, and whether failure is part of the normal decision vocabulary. Returned results make the immediate requester's obligation explicit. Exceptions can unwind to a more knowledgeable handler but can also surprise unprepared callers. **Modern extension:** events decouple time but require ownership, delivery, ordering, and idempotency policies.

Guidelines:

- define few, semantically meaningful exception categories;
- distinguish categories by responsibility and recovery behavior, not only error-code values;
- name a condition after what happened, not who raised it;
- include decision-relevant context and preserve the original cause when useful;
- recast low-level conditions at abstraction or neighborhood boundaries;
- handle close to the problem when the participant has enough knowledge;
- otherwise propagate to a controller, coordinator, or higher authority that can decide;
- let interfacers hide external protocol and recovery detail from core clients.

## Failure-handling policies

| Policy | Meaning | Key trade-off |
| --- | --- | --- |
| Inaction | Detect inability and intentionally ignore the request | Client remains uninformed; valid only when the effect is immaterial |
| Balk | Refuse and report failure | Caller must decide the next course |
| Guarded suspension | Wait until required conditions hold | Delay can be unbounded; cancellation and timeout matter |
| Provisional action | Work tentatively; commit only when success is assured | Requires staged state and clear commit semantics |
| Recovery | Perform a semantically acceptable alternative | Alternative must preserve the actual user obligation |
| Higher authority | Escalate to a human or more knowledgeable role | Latency and operational ownership must be explicit |
| Rollback | Undo partial effects | Compensation may be incomplete or impossible |
| Retry | Attempt again after recovery or delay | Only justified when future success is plausible; bound attempts and backoff |

Unconditional action despite missing success conditions is normally irresponsible. Real policies may combine techniques: retry transient failure, then balk and escalate; provisionally reserve resources, then commit or compensate.

State the resulting system state for both successful recovery and failed recovery. Include failure *during* recovery.

## Allocate responsibility for success

For every condition identify:

- who prevents invalid requests when prevention is possible;
- who validates at the boundary;
- who detects the exceptional condition;
- who communicates and translates it;
- who decides recovery policy;
- who executes recovery and cleanup;
- who handles failed recovery;
- who informs the actor or operator;
- who verifies the final aftereffect.

### Client prechecks

Before making the client ask "can you do this?" consider:

- Is readiness easy and cheap to check?
- Can it change between check and action?
- Should check and reservation be atomic?
- Is checking more expensive than attempting?
- Does checking itself have side effects?

A separate check can create a time-of-check/time-of-use race. Prefer one responsibility that validates and acts atomically when needed.

### Provider recovery

Before assigning recovery to the provider ask:

- Are delays acceptable and bounded?
- Is the missing resource likely to become available?
- Is an alternative semantically equivalent enough?
- Can the provider detect whether the intended effect occurred?
- Which downstream dependencies determine its reliability?

### Shared recovery facilities

Do not let every client invent a different retry, alert, or compensation policy. Centralize common mechanics when the semantics are genuinely shared, while keeping domain-specific decisions with the role that understands their consequence.

## Reliability-design workflow

1. Set criticality and the justified reliability budget.
2. Map trust regions and the assumptions allowed inside them.
3. Select one core use case, neighborhood, interfacer, or control-center slice.
4. Enumerate failures: invalid or unauthorized input, untimely request, timeout, dropped or duplicated communication, unavailable equipment, inconsistent data, missing file, resource exhaustion, deadline miss, and failed dependency.
5. Mark each common, plausible, uncertain, improbable, or explicitly out of scope.
6. Classify error versus exception at the relevant abstraction level and map object conditions to use-case outcomes.
7. Take one important unhappy path at a time; state assumptions and exclusions.
8. Allocate the full detection-to-recovery lifecycle.
9. Compare policies against timing, cost, side effects, concurrency, and state consistency.
10. Define successful and failed recovery states.
11. Generalize a policy only after concrete cases demonstrate shared semantics.
12. Formalize consequential boundary contracts.
13. Review secondary failures, incomplete mappings, duplicate checks, and unprepared callers.

Use this record in rigorous mode:

`condition | level | error/exception | consequence | likelihood | detector | communication | handler | policy | recovered state | failed-recovery policy | recasting boundary | actor-visible outcome | exclusions`

## Contracts

A contract expresses obligations and benefits on both sides.

- **Precondition**: client obligation and provider benefit; when the request is valid.
- **Postcondition**: provider obligation and client benefit; what will be true after successful completion.
- **Invariant**: a condition preserved across valid operations.
- **Permitted exceptional outcome**: a predictable non-success result and resulting state.

State what happens when a client violates a precondition. The provider may reject the request and withhold its normal postcondition, but the contract should still define invariant preservation, failure communication, and any safe-state guarantee. Do not load clients with strong preconditions while promising only weak aftereffects unless that imbalance is justified; it makes the service hard to use safely and shifts knowledge outward.

**Modern extension:** in distributed or asynchronous systems, extend the book's core contract with timing, retry safety, ordering, idempotency, consistency, privacy, authorization, observability, and partial-failure semantics when relevant.

Contract record:

`request | client role | provider role | trust boundary | preconditions | postconditions | invariants | permitted exceptions | side effects | timing | authoritative owner | verification owner`

Formalize where precision pays: external systems, independently implemented components, state-changing operations, high criticality, and requests for which prechecking would be stale or non-atomic.

## Documentation

Keep the normal collaboration readable. Use a separate exceptional story, a policy table, or running commentary rather than crowding every failure into one sequence diagram.

Document:

- exceptions considered and excluded;
- detector, signal, handler, and recovery owner;
- recasting across abstraction levels;
- final state and actor-visible outcome;
- cases handled by common policy;
- cases requiring human judgment.

An exception arrow alone does not show who handles it. Diagrams should show only the exceptional paths whose sequence matters; prose and tables usually communicate families of policy more effectively.

## Reliability review

Look for:

- exception-handling actions that can fail with no secondary policy;
- incomplete error-code or protocol-status mappings;
- exceptions propagated to unprepared clients;
- "logged" incorrectly equated with "handled";
- identical semantic validation in several participants;
- checks with no reliability benefit or a false sense of safety;
- embellished recovery that retries, logs, alerts, and escalates without consequence-based justification;
- unbounded retry, retry storms, or non-idempotent retry;
- recovery whose delay or side effects violate the client's contract;
- a highly reliable local participant surrounded by a brittle critical chain;
- no predictable post-recovery state;
- untrusted input entering the core without an explicit boundary owner.

A reliability design passes only when actions are proportionate, cost-effective, likely to change outcomes, and leave understood state.
