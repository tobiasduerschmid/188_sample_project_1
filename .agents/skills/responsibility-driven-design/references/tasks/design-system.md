# Design a system with Responsibility-Driven Design

Use this task to create a new conceptual design or substantially reshape an existing one. The result is a defensible model of roles, responsibilities, neighborhoods, and collaborations. It is not merely a class list, schema, API inventory, or diagram.

Read these references before doing the work:

- [../foundations/core-model.md](../foundations/core-model.md)
- [../foundations/process-and-reasoning.md](../foundations/process-and-reasoning.md)
- [../practice/candidates-and-responsibilities.md](../practice/candidates-and-responsibilities.md)
- [../practice/collaborations-and-control.md](../practice/collaborations-and-control.md)

Read these when the corresponding concern is material:

- [../practice/reliability-and-contracts.md](../practice/reliability-and-contracts.md) for failure consequences, trust boundaries, independently implemented parts, external systems, concurrency, or state-changing operations.
- [../practice/flexibility-and-evolution.md](../practice/flexibility-and-evolution.md) for configuration, extension, recurring change, multiple deployments, replaceable providers, or runtime variation.
- [../practice/design-communication.md](../practice/design-communication.md) when preparing a permanent design record or choosing diagrams and views.
- Start with [../adaptation/modern-systems.md](../adaptation/modern-systems.md) when participants will be realized as modules, services, processes, workflows, event consumers, offline clients, tools, or AI agents rather than primarily as in-process objects. Then load only the matching child references:
  - [../adaptation/services-distributed-offline.md](../adaptation/services-distributed-offline.md) for services, APIs, remote calls, operation identity, distributed contracts, synchronization, or offline-first behavior.
  - [../adaptation/events-and-workflows.md](../adaptation/events-and-workflows.md) for commands, events, streams, asynchronous processing, choreography, orchestration, or long-running workflows.
  - [../adaptation/functional-data.md](../adaptation/functional-data.md) for functions, immutable data, reducers, modules, state machines, actors, or pipelines.
  - [../adaptation/observability.md](../adaptation/observability.md) when important outcomes, invariants, retries, workflows, or side effects need operational evidence.
  - [../adaptation/ai-agents.md](../adaptation/ai-agents.md) for generative models, tool-using agents, multi-agent control, governed memory, evaluation, or human approval.

Copy [../../assets/rdd-design-template.md](../../assets/rdd-design-template.md) when a durable design artifact is useful. Remove sections that are genuinely outside scope. Do not populate empty sections with invented complexity.

## Task contract

Start with stakeholder-visible behavior and whole-system obligations. Move to internal participants only after the purpose, boundary, and at least one meaningful scenario are understood. Keep roles and conceptual responsibilities separate from committed implementation mapping until scenario simulation demonstrates that the model works. Early code, spikes, or prototypes may be used as experiments; record what they reveal and keep their realization choices provisional.

The workflow is intentionally iterative:

1. propose a small coherent slice;
2. simulate it;
3. expose omissions or awkward responsibility placement;
4. move, split, merge, invent, defer, or reject participants;
5. simulate again;
6. widen the slice only when doing so adds evidence.

Do not claim completion because every heading has text or every requirement has a noun-shaped candidate. A design earns confidence through traceable responsibility ownership and executable collaboration stories.

## Stable identifier scheme

Assign stable identifiers as soon as an item enters the working model. Do not renumber items after deletion; mark them superseded, rejected, or retired. References in tables and prose must use the same IDs.

| Prefix | Item |
| --- | --- |
| EVD | Supplied or observed evidence |
| ASM | Assumption |
| QST | Open question |
| CST | Constraint |
| QUA | Quality-attribute scenario |
| ACT | Human or organizational actor |
| EXT | External system, device, or independent party |
| SCN | Usage, failure, or change scenario |
| SYS | Whole-system responsibility |
| THM | Design theme |
| CAN | Candidate design participant |
| ROL | Interchangeable role |
| NBR | Object or participant neighborhood |
| RSP | Participant-level responsibility |
| COL | Collaboration story |
| CTL | Control center or control-style decision |
| EXC | Exceptional condition |
| POL | Failure or recovery policy |
| CTR | Collaboration contract |
| HOT | Hot spot or planned variation |
| DEC | Design decision |
| RSK | Residual design risk |
| IMP | Implementation realization mapping |

Use three-digit numbering by default, for example SYS-001. A large program may add a stable domain prefix, but avoid encoding current package, team, or deployment structure into conceptual IDs.

## Evidence and uncertainty discipline

Maintain a small evidence ledger throughout the task.

- **Evidence** records what the user, specification, existing system, experiment, regulation, or authoritative source actually establishes.
- **Assumptions** fill gaps temporarily. State their design consequence and how they can be verified.
- **Constraints** limit acceptable designs and name their source.
- **Decisions** are choices made by the designer. State alternatives and consequences when the choice is load-bearing.
- **Questions** are unresolved facts or choices that could change responsibility ownership, system boundary, control, trust, or an externally visible outcome.

Never promote an assumption into a requirement because it makes the design more sophisticated. Never disguise a design preference as evidence.

If source artifacts conflict, record both pieces of evidence, identify the affected responsibilities and scenarios, and ask for resolution when the conflict changes the core design. If a reasonable reversible assumption permits useful progress, proceed and label it.

## Select a depth profile

Choose the smallest profile that matches the consequences of error and the requested use of the design. State the selected profile and why.

### Sketch

Use for early exploration, low-risk features, teaching slices, or when major requirements are still fluid.

Minimum useful result:

- purpose, boundary, evidence, assumptions, and the principal quality concern;
- brief design story and consequential themes;
- core system responsibilities;
- candidate disposition and a focused CRC model;
- at least one end-to-end core collaboration;
- an explicit control choice where coordination is nontrivial;
- reliability and flexibility screens, even if the outcome is "no extra mechanism justified";
- unresolved questions, risks, and the next experiment.

A sketch is provisional. Label unexamined scenarios and omitted refinements rather than implying coverage.

### Standard

Use by default for a feature, subsystem, ordinary application, or design handoff.

Add:

- representative normal and exceptional scenarios, plus a change scenario when a credible change driver is known;
- rationale for every candidate disposition actually used, preserving rejected, deferred, split, or merged decisions when they are consequential;
- roles and neighborhoods with public paths and hidden internals;
- a responsibility assignment matrix and traceability to scenarios;
- collaboration stories for core and risky behavior;
- creation, visibility, lifetime, state, and aftereffect reasoning;
- explicit control-center decisions;
- proportionate trust, failure, and recovery design;
- evidenced hot spots and costed flexibility decisions;
- conceptual-to-implementation mapping kept in a separate section;
- validation-gate results and residual risks.

### Rigorous

Use when failure has high monetary, safety, legal, privacy, security, or operational consequences; when remote, concurrent, probabilistic, independently deployed, or independently implemented behavior is load-bearing; or when the user requests exhaustive design. A Standard design may instead apply rigorous analysis to one high-risk slice without inflating the entire artifact.

Add:

- source-backed responsibility coverage for every core scenario and boundary;
- precise quality-attribute scenarios and measurable acceptance conditions;
- systematic failure enumeration and secondary-failure analysis;
- trust-region map and contracts for consequential crossings;
- preconditions, postconditions, invariants, permitted exceptional outcomes, and authoritative owners;
- concurrency, timing, idempotency, ordering, cancellation, partial failure, and lifecycle analysis where applicable;
- alternatives for every load-bearing allocation, control, reliability, and flexibility decision;
- change-impact analysis for each supported hot spot and at least one invalid extension;
- independent-implementation seams, conformance scenarios, and verification ownership;
- explicit evidence coverage, review triggers, and stakeholder acceptance still required.

Rigorous does not mean infinite detail. Stop when the defined gates pass at the justified precision, remaining risks are visible, and additional modeling would not change a current decision or test.

## Phase 0: establish the design mandate

### Inputs

Collect or infer:

- system purpose and intended users or beneficiaries;
- in-scope and out-of-scope behavior;
- actors, external systems, devices, and independent organizations;
- normal outcomes and important alternate outcomes;
- constraints and ranked quality attributes;
- implementation or architectural context that is fixed rather than merely preferred;
- existing artifacts, prototypes, code, incidents, or prior decisions;
- failure consequences and expected lifetime;
- known variations and change history;
- intended audience and deliverable depth.

### Clarification rule

Ask for clarification when the system purpose, boundary, or any core scenario is genuinely unavailable. Prefer one compact set of no more than three high-leverage questions. Otherwise proceed with explicit assumptions.

Do not block on details that scenario exploration can reveal. Do block before making a high-consequence, difficult-to-reverse decision whose governing requirement or authority is unknown.

### Gate G0: mandate

Pass when all are true:

- there is a clear purpose;
- at least one actor goal or system outcome is known;
- a provisional boundary can be drawn;
- the design depth and audience are stated;
- missing information that could change the core is visible.

If G0 fails, stop with a concise evidence request. Do not invent an internal model.

## Phase 1: define context, boundary, and qualities

1. Write a one-sentence purpose in stakeholder language.
2. List what the system is responsible for and what remains the responsibility of actors, external systems, operators, or other teams.
3. Identify inbound events, outbound effects, information exchanged, and authority exercised at each boundary.
4. Record constraints with their evidence source.
5. Express important quality attributes as scenarios: stimulus, operating condition, expected response, and measure where known.
6. Mark trust as trusted, partially trusted, untrusted, or unknown. Treat trust as a design claim, not a property inferred from network location.
7. Identify facts for which an external party remains authoritative.

### Outputs

- purpose and scope;
- actor and external-system inventory;
- boundary and authority notes;
- constraints and quality-attribute scenarios;
- evidence, assumption, and question ledgers.

### Loop triggers

Return here whenever a proposed participant absorbs work that belongs outside the system, a scenario introduces a new external authority, or a collaboration assumes a quality requirement that was never established.

### Gate G1: context integrity

Pass when core external outcomes, authorities, and consequential constraints are distinguishable from internal design decisions.

## Phase 2: write the design story and themes

Write a rough synthesis, normally two short paragraphs:

- what is notable about the system;
- how it helps actors;
- the central domain and execution concerns;
- qualities and constraints shaping the design;
- what is known from evidence;
- what is uncertain;
- what must go right for the design to succeed.

Derive three to seven consequential themes when the system warrants them. A useful theme directs candidate search or responsibility allocation, such as policy ownership, scarce-resource coordination, offline reconciliation, or privacy-preserving audit. A feature label with no design consequence is not a useful theme.

Classify the work on two independent axes:

- **Consequence:** core or non-core. If fudging the item would cause project failure or invalidate major parts of the design, it is core.
- **Epistemic character:** routine, revealing, or potentially wicked. A revealing problem changes understanding when explored; a wicked problem lacks a definitive formulation or objectively final solution.

### Outputs

- design story;
- themes with evidence and affected scenarios;
- problem classification;
- initial core-design work queue.

### Gate G2: search frame

Pass when candidate discovery can be evaluated against something more meaningful than coverage of nouns.

## Phase 3: define scenarios and whole-system responsibilities

### Scenario selection

Start with a thin vertical slice:

- a core normal scenario;
- the most consequential or likely unhappy path;
- a change scenario if adaptability is important.

Expand according to the depth profile. Include startup, shutdown, timeout, cancellation, concurrency, resumption, and administrative scenarios only when they affect responsibilities.

For every scenario record:

- trigger and initiating actor or event;
- preconditions and authoritative input;
- normal steps stated without internal design;
- alternate and exceptional outcomes;
- externally observable result;
- state or obligations that persist afterward;
- applicable constraints and quality measures;
- evidence and assumptions.

### Derive system responsibilities

Restate required behavior as whole-system obligations to:

- perform an action;
- know, retain, derive, or provide information;
- make and enforce a consequential decision.

Use strong, outcome-oriented wording. Keep UI layout, tables, methods, endpoints, and framework mechanisms out of these statements.

Break an obligation down only when the parts:

- have distinct semantics;
- require different knowledge or authority;
- vary independently;
- fail independently;
- belong to different trust or deployment regions;
- need separate acceptance evidence.

Give each SYS item a source scenario, acceptance condition, criticality, and status. Keep an explicit unassigned list; do not force an arbitrary owner to make the table look complete.

### Gate G3: behavioral coverage

Pass when:

- each selected scenario step is supported by one or more system responsibilities;
- each system responsibility traces to evidence, a scenario, or an explicitly labeled design-enabling obligation;
- acceptance conditions describe observable outcomes;
- contradictions and unassigned obligations remain visible.

## Phase 4: discover and disposition candidates

Search theme by theme using only productive perspectives:

- work the system performs;
- things it affects or connects to;
- meaningful information flowing through it;
- decisions, control, and coordination;
- structures and relationships;
- external-world concepts the software must know.

Include execution machinery when behavior requires it: policies, transaction objects, interfacers, schedulers, registries, resource pools, monitors, translators, and coordinators can be legitimate candidates. Do not add them by default.

For every candidate record:

- name and concise purpose;
- provisional stereotype blend;
- clients or beneficiaries;
- themes, system responsibilities, and scenarios supported;
- one or two plausible responsibilities;
- important exclusions;
- evidence, assumptions, and questions;
- disposition and rationale.

Use these dispositions:

- **Accepted:** currently earns a place in the model.
- **Deferred:** potentially valuable; name the deciding evidence or scenario.
- **Rejected:** adds no behavioral value, is outside scope, vague, redundant, or unjustifiably clever.
- **Merged into CAN-x:** distinction is not behaviorally meaningful.
- **Split into CAN-x and CAN-y:** original responsibilities lack coherence or vary independently.
- **Superseded:** later model preserves its intent differently.

Do not equate a candidate with a class. Do not generate candidates by underlining nouns. Model a user only when identity, permission, preferences, history, or continuity changes behavior.

### Loop triggers

Return to system responsibilities when no candidate can coherently own an obligation. Invent a new candidate only after checking whether the obligation is too broad, too low-level, outside scope, or already implicit in another responsibility.

### Gate G4: candidate merit

An accepted candidate must be nameable, purposeful, distinguishable, behaviorally relevant, provisionally responsible, and useful to at least one client or scenario.

## Phase 5: form roles and neighborhoods

### Roles

Identify a role when a replaceable slot is defined by a coherent set of responsibilities and more than one kind of participant could plausibly fulfill it. Keep concrete candidates while searching for commonality; do not erase meaningful differences to create an elegant abstraction.

For every role record:

- purpose and client vocabulary;
- related public responsibilities;
- expected collaborators and contract;
- candidates that can play it;
- whether interchangeability is required now, anticipated from evidence, or merely conceptual.

One candidate may play several roles. Several candidates may play one role. Several stereotypes can describe one role. Preserve these distinctions.

### Neighborhoods

Group participants that collaborate closely toward a collective responsibility. For every neighborhood record:

- purpose and collective obligations;
- contained roles and candidates;
- public entry roles or services;
- hidden participants and information;
- allowed inbound and outbound paths;
- authoritative information and invariants;
- control centers;
- trust assumptions;
- change and failure boundaries.

Prefer few, purposeful paths between neighborhoods. Consider a facade or interfacer only when it protects a meaningful boundary; do not create a passive forwarding layer solely for symmetry.

### Gate G5: structural coherence

Pass when each neighborhood has a coherent purpose, its internals can change without gratuitously affecting outsiders, and every public path represents a real responsibility.

## Phase 6: assign participant responsibilities

Create participant-level RSP items and assign them to roles or candidates.

### Assignment order

1. Assign public obligations: what clients can legitimately ask or expect.
2. Assign authoritative knowledge and consequential decisions.
3. Decide whether the participant:
   - performs the work itself;
   - retains the main obligation and asks helpers for parts;
   - delegates the entire request to a role whose purpose fits it.
4. Add private responsibilities only when needed to explain how public obligations are fulfilled.
5. Revisit candidate purpose, stereotypes, roles, and neighborhood membership.

### Assignment tests

- Does the responsibility use a strong verb and express an obligation rather than an implementation operation?
- Does it fit the owner's purpose and role?
- Is behavior located with the information, invariant, or authority it governs?
- Is there one authoritative owner for each consequential fact and decision?
- Are validation and recovery owned once unless intentional redundancy is required?
- Is the owner being given a favor unrelated to its role?
- Does a controller know domain details that a capable collaborator should own?
- Has a relationship responsibility overloaded either endpoint when a structurer would be clearer?
- Does the assignment cross an abstraction or domain boundary in the wrong direction?
- Are responsibilities all at a comparable level of abstraction?

### Common repairs

- Split a participant that has several unrelated reasons to change.
- Merge fragments that share the same information and purpose but accomplish almost nothing separately.
- Move operations to the authoritative information holder.
- Introduce a policy role for consequential rules that vary or require distinct authority.
- Introduce a structurer for a meaningful many-to-many or lifecycle relationship.
- Reduce an all-knowing controller to sequencing and high-level decisions.
- Consolidate duplicate information or validation.
- Reword method-shaped responsibilities more generally.

### Gate G6: responsibility integrity

Pass when every core SYS item has an accountable primary owner or is explicitly unresolved, every accepted participant has a coherent reason to exist, and no consequential ownership is accidental or duplicated.

## Phase 7: design and simulate collaborations

Create one COL story for each selected scenario or difficult subproblem. Use prose, a step table, or a compact sequence diagram according to the communication need.

For each story record:

- scope and design question;
- trigger, preconditions, and postconditions;
- participants by role;
- controlling participant at each consequential decision;
- ordered requests and results;
- the receiver responsibility authorizing every request;
- information passed and authoritative source;
- state changes and aftereffects;
- how collaborators become visible;
- creation, reuse, lifetime, release, and cancellation;
- trust and process or network crossings;
- alternate and exceptional continuations;
- unresolved hand-waving.

### Simulation protocol

Start from an initiating event. At every step ask:

1. Who receives the event or request?
2. Does that participant own a matching public responsibility?
3. What must it know or decide?
4. Does it possess that knowledge, derive it, or ask an authoritative collaborator?
5. How can it obtain the collaborator?
6. Is the request at an appropriate semantic level?
7. What changes, returns, persists, or fails?
8. Who controls the next step?
9. Does the path preserve neighborhood and trust boundaries?
10. Can the story reach the promised external outcome?

Do not permit magical visibility, implicit global state, unnamed decision makers, invisible side effects, or "the system validates" without an owner.

### Refactor after simulation

Simulation is expected to change the model. Record material changes:

- responsibility moved, split, or consolidated;
- candidate added, rejected, merged, or split;
- role generalized or narrowed;
- control style changed;
- boundary or authority corrected;
- contract or failure policy added;
- requirement or assumption exposed.

Repeat until the selected story is coherent. Test hard or uncertain stories before spending time polishing ordinary ones.

### Gate G7: collaboration executability

Pass when representative stories reach their externally meaningful results without undeclared work, every request maps to a responsibility, every collaborator is obtainable, and lifecycle and aftereffects are credible.

## Phase 8: choose control style intentionally

Identify each important control center: the participants that receive consequential events, sequence work, and decide among paths.

For every CTL item compare applicable styles:

- **Centralized:** a controller retains most important decisions and sequencing.
- **Clustered:** related controllers divide a bounded control problem.
- **Delegated:** a coordinator decides what must happen while capable collaborators decide how.
- **Dispersed:** decisions emerge across many participants with no obvious center.

Evaluate:

- decision complexity and stability;
- who owns the required information;
- number and semantic level of messages;
- coupling to controlled participants;
- ease of tracing behavior;
- independent implementation and testing;
- framework or architectural constraints;
- failure and recovery ownership;
- consistency with genuinely similar control centers.

Prefer moderately intelligent collaborators when that preserves responsibility coherence. Use centralized control when decisions are few, closely related, and easier to verify together. Avoid both a god controller and gratuitously dispersed micro-decisions.

### Gate G8: control clarity

Pass when important decisions have named owners, control paths are understandable, and the chosen style follows from the problem rather than a universal preference.

## Phase 9: refine reliability and trust

Perform a reliability screen in every profile:

- What are the consequences of failure?
- Where do requests or facts cross a trust, authority, process, team, or technology boundary?
- Which exceptions are anticipated?
- Which participant detects, communicates, decides, recovers, cleans up, verifies, and reports?
- What predictable state remains when recovery succeeds or fails?

If the answer changes the design, read the reliability reference and expand the work.

### Reliability procedure

1. Set criticality and justified effort.
2. Draw trust regions and authoritative sources.
3. Choose one important unhappy path at a time.
4. Enumerate plausible invalid input, unauthorized action, untimely request, timeout, duplication, loss, resource failure, inconsistent state, deadline miss, and dependency failure.
5. Distinguish anticipated exception from error at the relevant abstraction level.
6. Map object-level conditions to actor-visible outcomes.
7. Allocate prevention, validation, detection, signaling or return, recasting, policy decision, recovery, cleanup, failed-recovery handling, notification, and verification.
8. Choose and justify balk, suspension, provisional action, recovery, escalation, rollback, retry, or deliberate inaction.
9. Bound retries and waits; address idempotency and compensation when relevant.
10. Define the resulting state and residual risk.
11. Formalize consequential crossings with a CTR contract.

Do not equate detection or logging with handling. Do not repeat identical semantic validation across several participants for comfort. Do not rely on a check whose result can become stale before action.

### Contract minimum

Record:

- request and client/provider roles;
- trust and authority boundary;
- preconditions and client obligations;
- postconditions and provider obligations;
- invariants and side effects;
- permitted exceptional outcomes;
- timing, ordering, idempotency, privacy, or consistency semantics when relevant;
- authoritative owner and verification owner.

### Gate G9: reliable collaboration

Pass when reliability effort is proportional, consequential failures have complete responsibility chains, trust assumptions are explicit, and normal or failed recovery leaves a predictable state.

## Phase 10: design only justified flexibility

Perform a flexibility screen:

- What concrete behavior is expected to vary?
- Who changes it, and when?
- Is this an established requirement, a recurring historical change, or a speculative possibility?
- What would direct implementation cost now and later?

If no valuable variation is evidenced, state that no flexibility mechanism is justified.

### Hot-spot procedure

1. Create a HOT item naming the semantic variation, not a pattern.
2. Give at least two concrete examples that reveal similarity and difference.
3. Before generalizing, test against a third tangible case. If delay is unusually costly and only one or two cases exist, label generalization as an explicit, time-boxed bet with a discard trigger.
4. Identify changing actor and change time: compile, deployment, startup, runtime, or end-user action.
5. Map focus: directly varying responsibilities.
6. Map scope: every affected participant, collaboration, neighborhood, test, and operational procedure.
7. Compare direct implementation, configuration, role substitution, factory/provider selection, hook/template, adapter, and justified patterns.
8. Choose the simplest sufficient mechanism.
9. State fixed behavior, variable behavior, invariants, selection owner, lifecycle, compatibility, failure behavior, and unsupported variations.
10. Provide an atomic configuration operation when related changes must move together.
11. Define a test knob or conformance scenario.
12. Simulate every concrete case and one invalid extension.

Never use Strategy, Adapter, Mediator, Template Method, or another pattern without naming the hot spot, forces, alternatives, responsibility movement, and complexity cost.

### Gate G10: earned flexibility

Pass when every flexibility mechanism serves an evidenced variation, focus and scope are understood, the changing actor and time are explicit, and verification is easier than an ad hoc change.

## Phase 11: map the stable conceptual model to implementation

After the conceptual slice has been tested, map roles and candidates to classes, interfaces, modules, components, services, functions, processes, workflows, event handlers, tools, or agents. If an early prototype already supplied a mapping, reassess it here rather than treating it as settled.

For each IMP mapping record:

- conceptual role and responsibilities;
- selected realization and why;
- public protocol or interface;
- state and authority location;
- deployment and lifecycle;
- independently implemented parties;
- persistence or messaging implications;
- conformance tests;
- compromises introduced by the technology or framework.

Do not force one candidate to one class or service. A class may implement several roles; a role may have several implementations; one conceptual participant may require a small implementation ensemble. Keep technical responsibilities distinct from the participant's primary application role.

For independent implementation, ensure each team or coding agent can learn from its assigned artifact:

- what it owns and does not own;
- requests it accepts and results it promises;
- collaborators it may use;
- preconditions, postconditions, invariants, and failure semantics;
- authoritative sources and forbidden shortcuts;
- conformance scenarios and integration assumptions.

### Gate G11: implementation readiness

Pass when implementation choices preserve the conceptual responsibility model or explicitly document each compromise. If an unresolved domain policy would make realization speculative, mark affected IMP items `Deferred`, name the policy decision and revisit trigger, and keep the design provisional rather than inventing a mapping.

## Phase 12: validate traceability and quality

Build a traceability matrix:

SYS responsibility → source evidence and scenarios → owning RSP and role/candidate → collaborators and COL stories → contracts/policies/hot spots → acceptance or conformance tests → implementation mapping.

### Required validation gates

Record Pass, Fail, Deferred, or Not applicable with evidence.

| Gate | Question |
| --- | --- |
| V1 Context | Are purpose, boundary, authority, constraints, and assumptions explicit? |
| V2 Coverage | Does every core system responsibility have one accountable owner or an explicit unresolved status? |
| V3 Coherence | Do accepted participants and roles have cohesive, non-duplicative responsibilities? |
| V4 Dynamics | Can representative normal, exceptional, and any relevant evidence-backed change scenarios execute without hand-waving? |
| V5 Reachability | Can every requester obtain every collaborator for the required lifetime? |
| V6 Control | Are consequential decisions and sequencing understandable and intentionally placed? |
| V7 Boundaries | Do neighborhoods and interfaces hide appropriate detail and avoid gratuitous dependencies? |
| V8 Reliability | Are trust, validation, exceptions, recovery, failed recovery, and aftereffects proportionate and owned? |
| V9 Flexibility | Does each extension mechanism serve a characterized variation and include verification? |
| V10 Traceability | Can claims be traced from evidence through responsibility and collaboration to tests? |
| V11 Handoff | Can implementers act without inventing ownership, policy, or failure semantics? |

### Stress prompts

Use those relevant to the system:

- Add a new rule, provider, actor type, deployment, or output.
- Remove or replace a collaborator.
- Run two requests concurrently.
- Deliver an event twice, late, or out of order.
- Lose a dependency halfway through state change.
- Cancel or time out while work is provisional.
- Restart after a partial effect.
- Supply malformed, unauthorized, stale, or contradictory information.
- Change an external protocol without changing the core vocabulary.
- Ask a new team or agent to implement one neighborhood independently.

Do not score success by diagram quantity. Record which scenario or evidence supports each pass.

## Stop conditions

### Stop and ask for direction

Pause before a decisive design choice when:

- purpose or the core actor outcome is unknown;
- system boundary or authority is disputed in a way that changes ownership;
- two requirements governing the same core responsibility contradict each other;
- a safety-, legal-, privacy-, security-, or essential-money decision lacks the necessary domain authority;
- an irreversible architecture choice depends on an unverified assumption;
- the requested scope would require inventing external permissions, commitments, or policies.

Return the exact blocker, affected IDs, work that remains valid, and the smallest question needed to continue.

### Deliver a provisional design

Stop the current iteration and label the design provisional when:

- the chosen slice passes its gates but other scenarios remain unexplored;
- a revealing problem needs evidence, experiment, stakeholder judgment, or soak time;
- several acceptable allocations remain and a reversible implementation experiment can decide;
- only speculative change cases remain;
- further detail would not change current ownership, collaboration, test, or implementation decisions.

Include revisit triggers and the next experiment.

### Advance to implementation

The conceptual design is ready to advance when:

- the mandate and context gates pass;
- all core system responsibilities are owned or explicitly accepted as unresolved;
- representative normal, exceptional, and relevant evidence-backed change stories work at the selected depth;
- every collaboration is responsibility-backed and reachable;
- important control, trust, recovery, and aftereffects are explicit;
- flexibility mechanisms are justified rather than ornamental;
- implementation mapping preserves the role model;
- residual risks, deferred decisions, and stakeholder acceptance needs are visible.

Ready does not mean immutable. State what evidence would invalidate the design.

## Final deliverable

Lead with the design outcome:

- the community of participants and how work is divided;
- the dominant collaboration and control shape;
- the load-bearing decisions;
- the largest residual uncertainty.

Then provide only the artifacts justified by the selected depth:

1. metadata, scope, evidence, assumptions, and questions;
2. purpose, boundary, actors, external systems, constraints, and qualities;
3. design story, themes, and problem classification;
4. scenarios and system-responsibility catalog;
5. candidate disposition, roles, neighborhoods, and CRC cards;
6. responsibility assignments;
7. collaboration stories and control decisions;
8. trust map, exception policies, and selected contracts;
9. hot spots and variation mechanisms;
10. design decisions and alternatives;
11. conceptual-to-implementation mapping;
12. traceability, validation-gate results, residual risks, and next experiments.

For a conversational response, summarize these artifacts compactly and expose only gates that fail, defer work, or control readiness; keep the complete gate ledger as working reasoning. For a durable handoff or when the user asks for the full model, use the design template and retain the complete ledgers. Do not omit a load-bearing contract, responsibility owner, or unresolved risk merely to be concise.

Preserve rejected and deferred ideas when their rationale prevents future designers from repeating the same exploration. Keep the normal story readable; place exceptional and implementation detail in focused sections rather than burying the design's main shape.
