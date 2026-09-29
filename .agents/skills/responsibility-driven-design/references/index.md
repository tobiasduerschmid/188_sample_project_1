# RDD knowledge index

Use this file as a router. Load the smallest branch that supports the current task, then follow any conditional links from that branch.

## Task routes

| Request | Required reads | Conditional reads |
| --- | --- | --- |
| Design a system with RDD | [tasks/design-system.md](tasks/design-system.md), [foundations/core-model.md](foundations/core-model.md), [foundations/process-and-reasoning.md](foundations/process-and-reasoning.md), [practice/candidates-and-responsibilities.md](practice/candidates-and-responsibilities.md), [practice/collaborations-and-control.md](practice/collaborations-and-control.md) | Reliability, flexibility, design communication, and the [modern adaptation router](adaptation/modern-systems.md) when the task contains those concerns |
| Review an RDD design | [tasks/review-design.md](tasks/review-design.md), [rubrics/rdd-review-rubric.md](rubrics/rdd-review-rubric.md) | Read the practice file behind each material finding; use the [modern adaptation router](adaptation/modern-systems.md) for non-class realizations |
| Refine roles or CRC cards | [practice/candidates-and-responsibilities.md](practice/candidates-and-responsibilities.md) | [practice/collaborations-and-control.md](practice/collaborations-and-control.md) when role quality must be tested dynamically |
| Design collaborations or control flow | [practice/collaborations-and-control.md](practice/collaborations-and-control.md) | [practice/reliability-and-contracts.md](practice/reliability-and-contracts.md) for failure or trust concerns; [practice/design-communication.md](practice/design-communication.md) for a permanent design record |
| Design failure handling or contracts | [practice/reliability-and-contracts.md](practice/reliability-and-contracts.md) | [practice/collaborations-and-control.md](practice/collaborations-and-control.md) for control and connection mechanics |
| Design extension or configurability | [practice/flexibility-and-evolution.md](practice/flexibility-and-evolution.md) | [practice/candidates-and-responsibilities.md](practice/candidates-and-responsibilities.md) when variation exposes new roles |
| Explain or teach RDD | [foundations/core-model.md](foundations/core-model.md), [foundations/process-and-reasoning.md](foundations/process-and-reasoning.md) | [foundations/glossary.md](foundations/glossary.md) for precise terminology; the practice branch relevant to the lesson; [examples/course-registration.md](examples/course-registration.md) for a worked slice |
| Apply RDD to modern realizations | Relevant task and practice files, then [adaptation/modern-systems.md](adaptation/modern-systems.md) | Load only the matching children for [services/distributed/offline](adaptation/services-distributed-offline.md), [events/workflows](adaptation/events-and-workflows.md), [functions/data](adaptation/functional-data.md), [observability](adaptation/observability.md), or [AI agents](adaptation/ai-agents.md); reliability is usually relevant at remote, asynchronous, offline, probabilistic, or independently deployed boundaries |

Do not load every reference by default. A narrow responsibility question does not require a full reliability and flexibility treatise. A complete system design or exhaustive review may legitimately use most branches.

## Knowledge hierarchy

### Foundations

- [core-model.md](foundations/core-model.md): the RDD worldview, vocabulary, role stereotypes, contracts, neighborhoods, patterns, and architecture.
- [process-and-reasoning.md](foundations/process-and-reasoning.md): iterative process, stakeholder perspectives, design problem classification, framing, trade-offs, and stopping conditions.
- [glossary.md](foundations/glossary.md): precise book-grounded terminology and fast distinctions among concepts that are often collapsed.

### Practice

- [candidates-and-responsibilities.md](practice/candidates-and-responsibilities.md): design stories, themes, candidate discovery, naming, stereotypes, responsibility sources, assignment, CRC work, and quality tests.
- [collaborations-and-control.md](practice/collaborations-and-control.md): collaborator discovery, scenario simulation, control styles, visibility, reference lifecycle, coupling, trust, and completion.
- [reliability-and-contracts.md](practice/reliability-and-contracts.md): failure consequences, trust regions, errors versus exceptions, recovery policies, contracts, and reliability review.
- [flexibility-and-evolution.md](practice/flexibility-and-evolution.md): hot spots, variation focus and scope, hooks, patterns, recipes, cost controls, and evolving existing systems.
- [design-communication.md](practice/design-communication.md): collaboration stories, view selection, UML limits, precision, progressive disclosure, and preservation.

### Task procedures and evaluation

- [tasks/design-system.md](tasks/design-system.md): complete design workflow, gates, evidence ledger, and output contract.
- [tasks/review-design.md](tasks/review-design.md): evidence-first review workflow and finding format.
- [rubrics/rdd-review-rubric.md](rubrics/rdd-review-rubric.md): rating scale, weighted dimensions, red flags, and approval gates.

### Adaptation, example, and provenance

- [adaptation/modern-systems.md](adaptation/modern-systems.md): concise modern-extension router, common principles, classic-term mappings, and cross-cutting workflow.
  - [adaptation/services-distributed-offline.md](adaptation/services-distributed-offline.md): services, remote collaborations, operation identity, distributed contracts, synchronization, and offline-first responsibility design.
  - [adaptation/events-and-workflows.md](adaptation/events-and-workflows.md): messages, events, streams, orchestration, choreography, and asynchronous workflows.
  - [adaptation/functional-data.md](adaptation/functional-data.md): functional, immutable-data, reducer, actor, state-machine, module, and pipeline realizations.
  - [adaptation/observability.md](adaptation/observability.md): operational evidence, correlation, telemetry ownership, diagnostics, audit, and recovery-oriented observability.
  - [adaptation/ai-agents.md](adaptation/ai-agents.md): probabilistic and tool-using agents, model/runtime separation, authority, validation, evaluation, and human escalation.
- [examples/course-registration.md](examples/course-registration.md): worked design slice plus an RDD review example.
- [source-map.md](source-map.md): chapter and page map to the source book and provenance boundaries.

## Reusable assets

Use these as output scaffolds only when they add value:

- `assets/rdd-design-template.md`
- `assets/rdd-review-template.md`
- `assets/crc-card-template.md`
- `assets/hot-spot-template.md`
- `assets/collaboration-story-template.md`

Templates are not checklists that justify empty sections. Remove sections outside scope and add project-specific evidence where the design risk demands it.
