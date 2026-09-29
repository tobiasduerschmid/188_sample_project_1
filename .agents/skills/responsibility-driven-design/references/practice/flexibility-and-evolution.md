# Flexibility and evolution

Unless marked **Modern extension**, this file paraphrases the book's flexibility guidance. Modern additions extend its hot-spot, hook, and responsibility reasoning to contemporary lifecycle, compatibility, and operational concerns.

## Flexibility is intentional

Object-oriented structure is not inherently flexible. Flexibility is how readily software adapts along named design parameters. A flexible design includes explicit places prepared for change: configurable information, replaceable collaborators, roles, hooks, templates, factories, adapters, or other controlled mechanisms.

Distinguish:

- **adaptable behavior**: current code handles several hardwired cases;
- **flexible design**: a mechanism makes an anticipated class of future change predictable.

State who changes the behavior and when:

- developer at compile or deployment time;
- installer or operator at configuration/startup;
- end user while using the system;
- the running system reacting dynamically.

Do not implement runtime flexibility when deployment-time selection satisfies the need.

## When to invest

Favor flexibility when:

- a tangible requirement or recurring change justifies it;
- the environment has a history of the variation;
- the system must serve materially different deployments or users;
- stakeholders value predictable extension;
- the mechanism does not compromise more important goals.

Flexibility is usually a design option, not the underlying need. State the real need: add pricing policies without changing checkout; support three sensor families; let institutions configure enrollment rules.

Compare the future with and without the mechanism, estimate the cost, and validate incrementally. Reject speculative framework machinery that supports imagined change.

### Flexibility disease

Warning signs:

- extension requires many fragile steps;
- correctness depends on numerous conventions;
- configuration burdens both provider and every client;
- abstractions and patterns obscure responsibility ownership;
- learning cost exceeds expected change benefit;
- placeholders and hooks lack concrete users;
- runtime dynamism is added for a static variation.

The alternative to overengineering is not rigid design. Concentrate flexibility at evidenced hot spots.

## Record hot spots

A **hot spot** names a function or responsibility expected to vary. Record:

- name;
- semantic description of what varies;
- at least two concrete examples showing similarity and difference;
- underlying requirement or change driver;
- who changes it and when;
- expected frequency and lifetime;
- constraints and non-goals.

Describe the variation, not the solution. Do not put "use Strategy" on the hot-spot card.

Two examples are enough to expose a possible variation. Before committing to a generalized mechanism, test it against at least three tangible cases. **Pragmatic extension:** if only one or two cases exist but delay is unusually costly, either implement directly or record generalization as an explicit, time-boxed bet with a discard trigger.

For a consequential variation, use `assets/hot-spot-template.md` to preserve evidence, alternatives, lifecycle, and the decision gate.

## Focus and scope

- **Focus**: responsibilities directly implementing the variation.
- **Scope**: how much of the design is affected.

A narrow focus can have broad scope when many clients depend directly on it. Broad scope may require moving, subdividing, or encapsulating responsibilities. It is not automatically proof of a bad design.

Classify the change:

- minor tweak, modest investment, or major effort;
- extension, modification, or new behavior;
- one-time, occasional, or recurring;
- local, neighborhood-wide, or cross-system.

List every affected responsibility and collaborator before selecting a mechanism.

## Choose the simplest sufficient realization

Consider alternatives in increasing machinery:

1. direct implementation for one stable case;
2. parameter or focused configuration value;
3. cohesive configuration/information holder;
4. replaceable collaborator behind a role;
5. factory or provider-selection mechanism;
6. hook or template method;
7. adapter around an external variation;
8. strategy, mediator, or another justified pattern;
9. generalized framework or, as a **Modern extension**, an interpreted model.

The ordering is not mandatory; it is a complexity prompt. Choose based on who changes what, when, and at what scope.

For each proposed mechanism specify:

- frozen behavior and invariants;
- permitted variable behavior;
- changing actor and change time;
- mechanism and lifecycle;
- compatibility and failure contract;
- complexity cost;
- test or verification path;
- unsupported variation.

## Templates and hooks

A template defines fixed algorithm structure and defers selected steps. It can use:

- concrete methods for fixed/default behavior;
- language primitives;
- factories that supply varying collaborators;
- hook methods or callbacks that fill specific steps.

A hook may enable, disable, replace, augment, add, or configure behavior. One hot spot may require several coordinated hooks.

Hook contract:

`hot spot | frozen steps | permitted variation | hook owner | change time | ordering | failure behavior | compatibility | verification`

Protect invariant steps. A hook that can arbitrarily violate the template's contract is not a safe extension point.

## Configuration, placeholders, and knobs

### Configuration holders

Group related values and rules into cohesive information holders rather than scattering flags. Split a miscellaneous global configuration object into responsibility-aligned groups. Define valid values, dependencies, ownership, update timing, and rollback.

### Placeholders

A placeholder reserves a location where credible future responsibilities can accrue. It should localize a known direction, not host speculative behavior. Record the evidence and delete it if the anticipated role fails to appear.

### Knobs

A knob makes supported change safe and obvious:

- setter or configuration operation;
- atomic operation applying related changes;
- validated configuration tool;
- example implementation;
- compatibility test or "test knob."

If several hooks must change together or in order, provide one master operation rather than relying on an undocumented script.

## Lifecycle and failure of variation mechanisms

**Modern extension:** runtime and independently deployed variation require an explicit lifecycle. Assign ownership for:

1. discovering or registering a realization;
2. validating compatibility and configuration;
3. selecting and creating or loading it;
4. initializing and activating it;
5. using it under the shared contract;
6. replacing or reconfiguring it while work may be in flight;
7. allowing or forbidding old and new versions to coexist;
8. deactivating, disposing, or unregistering it.

For each stage identify invalid realization, selection or load failure, initialization failure, partial coordinated update, failure during use, fallback failure, and cleanup failure when relevant. Name the detector, decision owner, policy, resulting state, and failed-recovery policy. A configurable or replaceable collaborator is not safely flexible if the design explains only its successful selection.

Define compatibility across every period in which realizations coexist. State whether in-flight work retains the realization with which it began, switches atomically, or may be canceled. Preserve stable semantic obligations even when type, protocol, schema, or deployment versions differ.

## Complexity budget and removal

Every flexibility mechanism spends complexity. Give the decision an owner and a validation horizon, then budget added roles, indirection, configuration, test combinations, runtime cost, documentation, operational work, and misuse risk. Compare that cost with the expected cumulative cost of direct change.

Set observable evolution triggers and discard or simplification criteria. Remove or reduce a mechanism when the expected variation does not arrive by the stated horizon, known cases converge, extension cost exceeds benefit, hooks remain unused, the mechanism obscures responsibility ownership, or a better-evidenced abstraction supersedes it. Preserve the decision and learning, not unused machinery.

## Patterns and their variation axes

Patterns support specific kinds of flexibility, not generic flexibility.

### Strategy

Factors a variable algorithm or policy into an interchangeable role. Adding a compatible strategy should not change clients. Selection may belong to the client, a coordinator, configuration, or a provider role.

### Mediator

Routes interactions through a participant that knows the collaboration roles. It reduces direct coupling but centralizes interaction knowledge and can become a control bottleneck.

### Adapter

Translates an unsuitable external interface into the protected design's vocabulary. It keeps external concepts and protocol detail from leaking into the core.

### Template Method

Keeps algorithm order fixed and exposes specific variable steps. It is appropriate when stable skeleton and controlled subclass or callback variation are genuine.

### Composition and delegation

Depending on a role and replacing a collaborator often enables runtime variation without changing the client. The extra indirection is worthwhile only when substitution is a real requirement.

Before applying any pattern ask which hot spot it serves, which responsibilities move, which new participant owns selection, and why a simpler option fails.

## Document the variation

Readers must know:

- what is complete versus intentionally partial;
- what is fixed versus variable;
- which roles, responsibilities, and collaborations participate;
- how to perform the supported change;
- how to test it and what not to attempt.

Provide audience-specific views:

- conceptual hot-spot and boundary view;
- implementation view of roles, hooks, factories, and concrete realizations;
- developer recipe;
- end-user or operator procedure.

Developer recipe:

1. **Name**: normally "How to ..."
2. **Intent**: why and when to use it.
3. **Design description**: relevant roles, responsibilities, collaborations, invariants, and views.
4. **Related recipes**: alternatives or sub-recipes.
5. **Steps**: exact supported extension procedure.
6. **Discussion**: hazards, limits, compatibility, rollback, and verification.

Write what the developer making the adaptation needs to know, not everything the original designer knows.

## Evolve an existing system

Analyze a proposed change by:

- focus and scope;
- degree of definition;
- effects on users, requirements, use cases, operations, documentation, and tests;
- frequency and similarity to prior changes.

An expected but ill-defined change does not justify detailed machinery. Build only the stable seam supported by known cases.

A one-time small patch may be reasonable. A broad change should trigger comparison of direct implementation and redesign. When the third or fourth related patch reveals a stable pattern, consider refactoring into an explicit hot spot. Repeated patches obscure responsibility ownership and make later flexibility harder.

## Flexibility-design workflow

1. State the actual change need.
2. Identify who changes behavior and when.
3. Record hot spots with concrete examples.
4. Gather a third case or explicitly acknowledge the generalization bet.
5. Rank by value, recurrence, history, and project fit.
6. Map focus, scope, and affected responsibilities.
7. Compare direct code, configuration, role substitution, hooks, adapters, and patterns.
8. Select the simplest mechanism meeting the required degree.
9. State fixed behavior, variable behavior, and invariants.
10. Define every hook, knob, selection owner, and compatibility contract.
11. Provide atomic configuration when changes are coordinated.
12. Provide a test knob or compatibility scenario.
13. Simulate every concrete example and at least one invalid extension.
14. Write conceptual and implementation views plus the appropriate recipe.
15. Reassess whether complexity still earns its cost after each increment.
16. Assign lifecycle and failure responsibilities when realizations can load, change, coexist, or fail independently.
17. Set a complexity budget, validation horizon, evolution triggers, and discard criteria.

## Flexibility review

- Which concrete change does each mechanism support?
- Are enough meaningful cases present before generalization?
- Are changing actor and change time explicit?
- Is runtime dynamism actually required?
- Are focus and scope correct and localized?
- Do clients depend on roles where replacement is intended?
- Are fixed algorithm steps protected?
- Can related changes be applied atomically?
- Is configuration cohesive rather than global miscellany?
- Does every placeholder have evidence and an evolution trigger?
- Does every pattern solve a named hot spot?
- Does a mediator reduce total coupling without becoming a god controller?
- Do adapters protect the core vocabulary?
- Are partial views labeled as partial?
- Can the intended user perform and test the variation from the recipe?
- Is complexity lower than the likely cumulative cost of direct changes?
