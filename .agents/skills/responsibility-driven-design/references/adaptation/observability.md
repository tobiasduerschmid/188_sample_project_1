# Observability as a responsibility system

> **Provenance boundary - modern extension beyond the book:** The book discusses reporting, failure handling, design records, and understanding aftereffects, but does not develop contemporary logs, metrics, traces, service-level objectives, or audit telemetry as a responsibility system. This reference is an original extension and must not be attributed to Wirfs-Brock and McKean.

Read [modern-systems.md](modern-systems.md) first. Also read the adaptation file for the system being observed so telemetry is tied to semantic obligations rather than infrastructure alone.

## Assign observability responsibilities

Observability is not incidental instrumentation. For important collaborations, assign responsibilities to produce, correlate, retain, protect, and interpret evidence of behavior.

Possible observability participants include an instrumentation adapter, audit recorder, workflow monitor, service-level evaluator, alert policy, or operator-facing diagnostic view. They still need coherent obligations; “the monitoring stack” is not an owner.

For each core collaboration ask:

- Which outcome and invariant must be externally verifiable?
- Which correlation identity connects requests, messages, tool calls, and human actions?
- Which participant emits authoritative business evidence, and which emits operational symptoms?
- Who defines service-level indicators and thresholds?
- Who detects stuck, duplicated, reordered, anomalous, or partially completed work?
- Who receives an alert, what decision can they make, and what recovery can they invoke?
- Which sensitive data must be excluded, redacted, access-controlled, or deleted?
- What telemetry remains available across retries, deployments, and provider boundaries?

Logging that an error occurred is not recovery. A dashboard with no decision owner is not an operational collaboration. Avoid high-cardinality, privacy-invasive, or unbounded telemetry that creates more risk than evidence.

## Evidence by collaboration type

- **Remote operation:** preserve operation identity, attempt count, semantic outcome, ambiguity, and authoritative receipt without treating each transmission as a new business operation.
- **Event or workflow:** preserve correlation, causal predecessors, consumer outcome, lag, retries, dead-letter state, terminal business state, and correction history.
- **Offline-first:** preserve journal status, last confirmed revision, provisional state, sync attempt, conflict classification, authoritative receipt, offline-age limit, and reassignment decision.
- **AI agent:** preserve decision-relevant inputs, model/policy/tool versions, bounded trajectory, validations, approvals, side effects, and corrections without retaining forbidden content.

## Observability review

- Does each signal support a named operational or business decision?
- Can an operator distinguish symptom, cause hypothesis, authoritative fact, and stakeholder-visible outcome?
- Can evidence connect repeated transmissions to one operation and distinguish separate concurrent operations?
- Are trace and audit identifiers stable across asynchronous, offline, and human handoffs?
- Are alert recipient, decision authority, and recovery action explicit?
- Can the design verify the promised aftereffect without violating information hiding or privacy?
- Are retention, access, integrity, cost, and deletion responsibilities owned?
