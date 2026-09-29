# Collaborations and control

## Collaboration model

A collaboration is a request from one participant to another for help fulfilling a larger responsibility. The collaboration model adds the dynamic **how, when, and with whom** to a roles-and-responsibilities model.

Every collaboration has two sides:

- **behavioral**: request, information, result, side effects, and control flow;
- **structural**: the reference, address, subscription, route, or discovery mechanism that makes the request possible.

A responsibility can be fulfilled internally or through many possible collaboration designs. Do not mistake the current path for the responsibility itself.

## Discover collaborators through overlapping passes

1. Examine the candidate's stereotype and what it normally needs or offers.
2. Examine every knowing, doing, and deciding responsibility.
3. Decompose complex responsibilities into subordinate obligations and sequencing.
4. Trace a specific scenario or event.
5. Apply architectural, framework, process, and deployment constraints.
6. simplify and regularize the communication paths.

The goal is a consistent, justifiable interaction style, not maximum connectivity.

## Questions by stereotype

| Stereotype | Collaboration questions |
| --- | --- |
| Information holder | Where does information originate? Is it told, derived, cached, refreshed, persisted, synchronized, or converted? Who performs those duties? |
| Structurer | Where do members come from? Who creates, visits, summarizes, constrains, persists, or removes them? Is organization private? Do members need a reverse link? |
| Service provider | Who supplies inputs and policy? Who configures it? Does volatile behavior belong in a collaborator? Are multiple provider variants expected? |
| Controller | Which information drives each decision? Who owns it? Which resulting actions should be delegated? Which intermediate results must be tracked? |
| Coordinator | How are work and notifications delegated? How are delegates found? How is progress, timeout, or completion known? |
| User interfacer | How are intentions translated? Which application roles are visible? Which UI state is local? How do listeners subscribe? |
| Internal interfacer | Which neighborhood services are exposed? Does it delegate, translate, select, or protect? How are internal providers located? |
| External interfacer | Who handles format/protocol conversion, connection lifecycle, authentication, timeouts, retry, and external failure? Should conversion and transport be separate roles? |

A knowing responsibility does not require local storage. The participant can preserve its public promise while privately collaborating with an authoritative source.

## Decompose complex responsibilities

When a responsibility is too large for one participant:

1. list the major subordinate responsibilities at a consistent abstraction level;
2. add a sequencing or coordination responsibility;
3. keep a subordinate duty with the original participant only when it fits the role;
4. otherwise assign it to a capable neighbor, invent a focused candidate, or leave it explicitly unassigned;
5. compare at least one alternative distribution for load-bearing work.

Do not over-decompose into single-method helpers. Each participant should have a meaningful character, not merely host a step.

## Design a scenario collaboration

For each core, risky, or unclear scenario answer:

- What intention-level event starts the work?
- Which participant first receives it, and why does its role fit?
- Which responsibility authorizes each request?
- What is the sequence and current locus of control?
- Which participants and information exist before the scenario? Which are created?
- Where are branches and decisions? Does each decision maker have the required knowledge?
- What information or meaningful objects cross each step?
- How does every sender obtain a reference to its receiver?
- How long is the reference retained and who owns its lifecycle?
- What externally meaningful result, state, or aftereffect marks completion?

After tracing several scenarios, revisit the model. Split overloaded roles, merge artificial fragments, introduce missing concepts, move decisions near knowledge, and simplify repetitive paths.

## Simulation protocol

Simulation is a design experiment, not mathematical proof.

### Plan

1. Choose a hard, uncertain, or architecturally central scenario.
2. State a learning goal: test control, locate a boundary, compare allocations, expose missing knowledge, or refine a neighborhood.
3. Set a clear start, stop, scope, and abstraction level.
4. Select provisional participants. Invent a provisional controller or coordinator if no one receives the initiating event.
5. Timebox the experiment and exclude irrelevant detail.

### Run

Start with an intention such as "student submits a proposed schedule," not "browser emits a click." At every request ask:

- Does the receiver advertise this responsibility?
- What did it need to know, and where did that knowledge come from?
- Does it act, partially collaborate, or fully delegate?
- How did the sender become aware of the receiver?
- Are request and response at the same abstraction level as surrounding steps?
- Does the path preserve boundaries and reach the promised postcondition?

Stop and update CRC cards whenever the simulation reveals a missing responsibility, collaborator, reference, candidate, or requirement. Try an alternative when the path is chatty, conditional, brittle, or surprising.

### Record

- scenario and learning goal;
- starting event and completion condition;
- stepwise responsibility/collaborator trace;
- reference provenance and lifetime;
- candidate and responsibility changes;
- hubs, visibility leaks, and boundary crossings;
- alternative trace and why it lost;
- unresolved questions and next experiment.

## Control style

Control is consequential decision making and selection of paths through the software. Identify important control centers rather than discussing "the system's control" as one undifferentiated property.

Common centers include user-initiated tasks, long-running processes, an object neighborhood, scheduled work, and control of external devices or systems.

### Styles form a continuum

| Style | Shape | Strength | Failure mode |
| --- | --- | --- | --- |
| Centralized | One or a few controllers decide and direct most actions | Decisions are easy to locate; few simple rules can be clear | Nested branching, passive workers, broad knowledge, procedural design |
| Clustered | Several related controllers divide state- or phase-specific decisions | Can isolate complex states while retaining a recognizable center | Control remains concentrated and can become a controller hierarchy |
| Delegated | A coordinator requests outcomes from capable domain and service participants | Moderately intelligent collaborators; less controller knowledge; local change | Overfactored helpers, excessive message traffic, hidden or scattered coordination |
| Dispersed | Decisions are spread with no obvious center | Local autonomy | Major decisions, failure recovery, and overall behavior become hard to trace |

Delegation is often a good balance, not a law. Centralized control is reasonable for a few simple, related decisions. Delegate when work separates into subresponsibilities with distinct semantics or local knowledge. Dispersed control is appropriate only when emergent behavior is intended and still governable.

### Control-center decision record

For each center capture:

1. initiating events and desired outcomes;
2. decisions and branches;
3. information required for each decision and its owner;
4. resulting actions and best owners;
5. sequencing, synchronization, timeout, and completion;
6. framework or architectural constraints;
7. styles considered and selected;
8. repeated collaboration pattern to preserve;
9. failure and recovery owner.

Similar control centers should work similarly only when their semantics and constraints genuinely match.

## Delegation transformations

Use these moves when a controller has too much work:

- move behavior to the information holder whose state or rules determine it;
- identify a common role and use polymorphic requests instead of type checks;
- encapsulate a specialized decision neighborhood behind one outcome-oriented service;
- isolate state-dependent behavior in state roles when discrete state truly drives it;
- let local policy participants evaluate their own applicability while a coordinator selects among results;
- reduce the controller to sequencing and exceptional coordination.

A pattern changes responsibility distribution. Consider what it prevents as well as what it enables.

## Collaboration smells and repairs

| Smell | Likely mechanism | Possible repair |
| --- | --- | --- |
| Many external links into one neighborhood | Internals are public and clients depend on organization | Add a purposeful interfacer or facade; expose fewer outcomes |
| Many low-level setup/accessor calls | Provider exposes mechanics instead of responsibility | Offer a higher-level request with sensible defaults |
| Type checks select collaborator behavior | Decision is far from polymorphic knowledge | Unify a role, move decision, or use justified double dispatch |
| Primitive values travel everywhere | Meaning and rules lack an owner | Introduce a meaningful information holder or value participant |
| One traffic hub is known by everyone | Responsibility and visibility concentration | Split roles, introduce neighborhoods, or move behavior outward |
| Every participant emits and listens to events | Control and dependencies are dispersed invisibly | Name event ownership, subscriptions, sequencing, and failure policy |
| A helper serves one client and one step | Over-decomposition | Merge unless the helper isolates true complexity or variation |
| Cross-boundary request chatters | Remote/local distinction ignored | Bundle a meaningful outcome, make fewer round trips, or move work |

## Visibility and Law of Demeter

The Law of Demeter advises a participant to call only itself, parameters, objects it creates, and its own subparts. Its intent is to avoid deep structural navigation and brittle knowledge of another participant's internals.

Treat it as a trade-off guideline:

- hide navigation when the structure is private or volatile;
- allow direct use when the returned collaborator is a meaningful public concept and forwarding would bloat or distort the structurer;
- review message chains for knowledge leakage, but never reject them mechanically;
- state whether structural hiding, role coherence, discoverability, or interface size matters more.

## Make every collaboration possible

Every request requires a path. For each collaborator record:

The requirement to make connections explicit is book-grounded. **Modern extension:** dependency injection, brokers, registries, subscriptions, process lifecycles, and hidden-global terminology below adapt that requirement to contemporary realizations.

- acquisition: create, receive as input, obtain as a result, inject, discover through a broker/registry, subscribe, or use a preexisting owned reference;
- cardinality: one, many, or variable;
- ownership and lifecycle: who creates, retains, refreshes, and disposes;
- duration: one request, one scenario, session, process, or persistent;
- identity need: exact participant versus any provider of a role;
- cost: local/remote, cheap/expensive, synchronous/asynchronous;
- failure: unavailable, stale, duplicated, or replaced.

Keep a collaborator only when repeated discovery is expensive, identity or accumulated state matters, or the relationship is intrinsic. Use a temporary helper for transient work. If capability matters more than provider identity, depend on a role and obtain it through an explicit provider-selection mechanism.

Avoid hidden global dependencies in modern systems. Make shared providers explicit enough to test, replace, and reason about.

## Local versus distant collaboration

Close-neighbor versus distant-collaboration reasoning is book-grounded. **Modern extension:** across a contemporary process, service, trust, or deployment boundary, add distributed timing and delivery semantics:

- use fewer, larger, intention-revealing messages;
- define timeout, partial failure, idempotency, ordering, and consistency expectations;
- avoid sharing mutable implementation objects;
- translate into a boundary contract;
- do not create a remote version of a chatty local object graph.

## Completion gate

A collaboration model is ready to leave exploration when:

- core scenarios reach externally meaningful results;
- every receiver owns the requested responsibility;
- every sender can plausibly reach its receiver;
- control centers are intelligible and styles justified;
- roles are coherent and moderately substantial;
- natural neighborhood boundaries remain intact;
- hard areas, trust assumptions, and major failure paths have been explored;
- interactions are consistent rather than arbitrary;
- candidate churn has slowed enough to make implementation mapping useful.

This does not mean design has ended. Contracts, variation hooks, code, tests, and refactoring continue to refine it.
