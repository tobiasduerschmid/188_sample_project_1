# RDD for modern systems

> **Provenance boundary - modern extension beyond the book:** This adaptation branch applies the book's roles-responsibilities-collaborations model to technologies and operating conditions that it does not treat directly: independently deployed services, event streams, functional/data-oriented implementations, distributed and offline execution, production observability, and generative-AI agents. The classic concepts below come from the book; all realization mappings and operational guidance in this branch are original extensions. Do not attribute them to Wirfs-Brock and McKean.

Use this file as a router and shared conceptual bridge. Load only the child references that match the system.

## Route the realization concern

| Concern | Read |
| --- | --- |
| Services, APIs, independently deployed components, remote calls, distributed operation identity, contracts, synchronization, or offline-first behavior | [services-distributed-offline.md](services-distributed-offline.md) |
| Commands, events, streams, brokers, choreography, orchestration, asynchronous processing, or long-running workflows | [events-and-workflows.md](events-and-workflows.md) |
| Pure functions, immutable data, reducers, actors, state machines, modules, or data pipelines | [functional-data.md](functional-data.md) |
| Logs, metrics, traces, audits, service-level evidence, workflow monitoring, or operator diagnostics | [observability.md](observability.md) |
| Generative models, tool-using agents, multi-agent systems, model providers, governed memory, or human approval | [ai-agents.md](ai-agents.md) |

Load multiple children when concerns cross. An event-driven offline AI workflow, for example, needs the service/distributed, event/workflow, observability, and AI-agent references.

## Preserve the conceptual layer

Modern infrastructure changes how participants communicate, fail, and evolve. It does not change the central RDD questions:

- Which stakeholder-visible or system obligation is being fulfilled?
- Which role owns the decision, knowledge, action, invariant, or recovery?
- Which participant asks for help, and why can it not fulfill the obligation alone?
- How does it reach the collaborator?
- What may each side assume, and what result or aftereffect is promised?
- Where does control reside, and is that control style intentional?
- Which facts and policies are authoritative?
- Which variation is real enough to justify indirection?

Keep two models visible:

1. **Conceptual RDD model:** roles, obligations, authoritative knowledge, collaborations, contracts, control, trust, and variation.
2. **Realization model:** services, endpoints, functions, data types, topics, queues, processes, databases, journals, agents, tools, and deployment boundaries.

Never infer a conceptual participant solely from a deployment box. Never force one conceptual participant into one deployable unit.

## Mapping classic RDD terms

The mappings are many-to-many examples, not equivalences.

| Classic RDD term | Possible modern realization | Meaning that must survive the mapping | Invalid shortcut |
| --- | --- | --- | --- |
| Responsible participant or object | Class instance, module, actor, state machine, service, process, function plus governed state, workflow, AI agent, or human-in-the-loop role | A coherent owner that knows, does, or decides something on behalf of clients | Every container, table, service, or model is an object |
| Role | Language interface, protocol, port, service capability, event-consumer expectation, function type, tool contract, or policy-governed agent capability | A context-specific, replaceable slot defined by related responsibilities | A role is a job title, service name, or framework annotation |
| Responsibility | Domain capability, policy decision, information obligation, invariant, coordination outcome, translation, or recovery obligation | An outcome-oriented obligation, independent of its implementation operations | A method, endpoint, queue job, or prompt step is itself the responsibility |
| Collaboration | In-process request, function call, RPC, command, event notification, stream subscription, tool invocation, shared-data publication, or human work item | One participant relies on another's advertised responsibility | Any dependency, import, data movement, or topic edge is a collaboration |
| Contract | Semantic service contract, API protocol, event schema plus meaning, function contract, tool policy, or agent operating agreement | Client and provider obligations, valid-use conditions, aftereffects, and permitted non-success outcomes | A schema, type signature, OpenAPI file, or prompt alone is the contract |
| Interfacer | Adapter, anti-corruption layer, API gateway policy, serializer, device driver, identity boundary, model gateway, or human-facing presenter | Translates vocabularies and protects assumptions across a boundary | A transparent forwarding proxy with no translation or protection responsibility |
| Neighborhood | Cohesive module, bounded context, actor group, service cluster, workflow slice, or agent team | A group whose collaborators have a collective purpose and intelligible internal vocabulary | An arbitrary package, repository, namespace, or Kubernetes namespace |
| Control center | Application service, orchestrator, workflow engine, state machine, process manager, supervisor, or planning agent | Owns consequential sequencing or decisions without absorbing unrelated domain work | The busiest component or a controller named by a framework |
| Trust region | In-process collaboration region, bounded context, independently owned service, security zone, third-party boundary, offline/online authority boundary, or deterministic/probabilistic boundary | A deliberate allocation of which assumptions are locally safe | Network location alone proves trust |
| Collaboration story | Scenario trace, sequence narrative, example-based test, workflow history, distributed trace, offline-sync history, or agent trajectory | An initiating event followed through responsible participants to a meaningful result | A topology diagram or raw trace without responsibility reasoning |
| Hot spot or variation point | Replaceable provider, plug-in, policy strategy, configuration group, schema version seam, model provider, prompt/policy bundle, or feature rule | A characterized, valuable variation with fixed behavior and explicit invariants | Every abstraction or environment variable is flexibility |

## Common adaptation workflow

1. Complete the conceptual RDD slice: system obligation, roles, responsibilities, collaborations, contracts, control, trust, and variation.
2. Identify which boundaries are in-process, remote, asynchronous, independently owned, offline, human, or probabilistic.
3. Load the relevant child references from the routing table.
4. Compare plausible realizations without assuming one role per class, service, function, topic, workflow, or agent.
5. Add only the boundary semantics demanded by consequence: timing, identity, delivery, causality, consistency, authority, privacy, recovery, versioning, and observability.
6. Assign authoritative data and policy ownership separately from replicas, projections, provisional state, prompts, and caches.
7. Simulate normal, failure, delay, replay, distinct concurrency, stale work, causal reordering, restart, upgrade, and change stories proportional to risk.
8. Confirm every asynchronous, offline, remote, or probabilistic branch has a completion, correction, expiration, or escalation owner.
9. Show the implementation mapping separately and record any responsibility split or merge introduced by the chosen technology.

## Common modern-adaptation review

- Are conceptual roles clear before technology boxes appear?
- Does every service, function group, workflow, topic, journal, and agent earn its existence through responsibilities?
- Is the owner of each fact, policy, process outcome, operation identity, and correction explicit?
- Are remote, asynchronous, offline, and probabilistic assumptions made visible in contracts and collaboration stories?
- Is distributed control understandable, including choreography and human intervention?
- Does observability support an owned decision or recovery rather than merely produce telemetry?
- Does the realization preserve information hiding, coherent responsibilities, and purposeful collaborations?
- Are all additions beyond the book identified as modern extensions rather than attributed to it?
