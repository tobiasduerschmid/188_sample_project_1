# Events, asynchronous collaboration, and workflows

> **Provenance boundary - modern extension beyond the book:** This reference adapts the book's collaboration, control-style, connection-problem, trust, reliability, and collaboration-story concepts to event brokers, streams, choreography, process managers, and long-running asynchronous work. Those realization details are original extensions and must not be attributed to Wirfs-Brock and McKean.

Read [modern-systems.md](modern-systems.md) first. Read [services-distributed-offline.md](services-distributed-offline.md) when messages cross independently operated boundaries or carry offline operations.

## Events and streams

Distinguish message intent:

- A **command** asks a known logical role to fulfill a responsibility.
- An **event** states that a meaningful fact or state transition occurred.
- A **query** asks a role to supply information without requesting a state change.
- A **signal** announces that something may deserve attention but may not establish an authoritative fact.

Do not call every message an event. Do not publish commands disguised in past tense to avoid naming a control owner.

An asynchronous collaboration still has semantic participants even when the publisher does not know concrete consumers. Record:

`message | kind | semantic producer | authority for the fact | intended consumer role(s) | why they need it | schema owner | delivery/ordering assumptions | idempotency owner | retention/replay | privacy | correction policy | observability owner`

### Event responsibility allocation

Explicitly assign who:

- decides that the event is true and may be emitted;
- commits business state and publication, including atomicity or outbox policy;
- owns its semantic name and schema evolution;
- routes, retains, retries, dead-letters, or replays it;
- detects duplicates, gaps, excessive lag, and poison messages;
- makes consumer effects idempotent when redelivery is possible;
- corrects or supersedes an erroneous event;
- owns the business outcome after independent reactions occur.

The broker owns transport mechanics only if that responsibility is actually assigned to it. It does not own the domain truth or the consumer's outcome.

## Orchestration and choreography

Map event flow back to control style:

- **Centralized or orchestrated:** a process manager or workflow controller knows the goal, current process state, and next required collaboration.
- **Delegated:** a control center assigns substantial sub-outcomes to capable participants that decide their own local work.
- **Dispersed or choreographed:** participants react to facts without one participant directing the whole process.

Choreography is not “no control”; it distributes control. Use it when local reactions and eventual outcomes remain intelligible. Introduce an explicit control center when no participant can answer what the process is trying to achieve, whether it is complete, or who must recover it. Avoid an omniscient orchestrator that makes decisions belonging with domain participants.

## Asynchronous and long-running collaboration

Separate at least three moments:

1. **Accepted:** the provider has durably accepted responsibility for attempting the work.
2. **Completed:** the promised business aftereffect has occurred.
3. **Observed:** the client, operator, or downstream participant has reliable evidence of the outcome.

An acknowledgement of receipt is not the postcondition of the business responsibility.

For long-running work identify:

- workflow or process-state owner;
- correlation identity and lifecycle;
- valid states, transitions, invariants, and terminal outcomes;
- who owns clocks, deadlines, timeout decisions, and cancellation;
- ordering, causality, concurrency, duplicate, and stale-message policies;
- progress and completion signals;
- recovery after restart, redelivery, or lost response;
- compensation when effects cannot be rolled back;
- human intervention for ambiguous or irrecoverable states;
- retention, archival, replay, and deletion policies.

Write asynchronous collaboration stories as stateful narratives. Include elapsed-time assumptions, durable checkpoints, repeated or reordered messages, and what each participant can truthfully know at each step.

When a message requests a state-changing operation, apply the five distinctions from [services-distributed-offline.md](services-distributed-offline.md): same-operation replay, distinct concurrency, stale operation, out-of-order causal dependency, and operation-ID reuse with changed content.

## Event and workflow review

- Are commands, events, queries, and signals semantically distinguished?
- Is the producer authoritative for the fact it publishes?
- Are schema meaning, correction, retention, replay, and privacy owned?
- Does each consumer own idempotent effects where delivery can repeat?
- Is distributed control understandable, including who knows whether the overall obligation completed?
- Are acceptance, business completion, and observation separate?
- Do state, clocks, deadlines, cancellation, compensation, and failed recovery have owners?
- Can collaboration stories survive restart, duplicate, delay, reordering, missing predecessors, and human escalation?
