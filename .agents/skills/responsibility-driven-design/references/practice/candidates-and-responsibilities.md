# Candidate discovery and responsibility assignment

## Discovery stance

Do not extract nouns from requirements and call them objects. Candidate discovery is an act of design. Search for abstractions that support both the problem domain and the software's execution machinery.

A useful design has enough vivid abstractions to express its behavior, but not so many that every incidental variation becomes a type. Initial candidates are educated guesses. They prove their value only when they own coherent responsibilities and participate in credible collaborations.

Delay classes, schemas, endpoints, inheritance, and framework types. Begin with concrete candidate objects and roles; discover common roles after comparing several concrete cases.

## Write a design story

Write a rough synthesis, normally two short paragraphs. Include what is notable rather than every requirement:

- the system's purpose and how it supports its users;
- important domain concepts and external systems;
- qualities or constraints that shape the design;
- known mechanisms or precedents;
- what must make the design succeed;
- the hardest, least understood, or load-bearing parts;
- important certainty and uncertainty.

The story is the designer's integrated view, not a pasted specification. On a team, comparing independently written stories can expose hidden assumptions.

Extract three to seven **themes**: consequential design concerns such as eligibility policy, scarce-resource sharing, offline reconciliation, or configurable integration. A feature label such as "report page" is rarely a useful theme unless its design implications are explained.

## Search for candidates by theme

For each theme, use the perspectives that reveal something; do not force all six.

| Search perspective | Questions | Likely candidates |
| --- | --- | --- |
| Work the system performs | What calculations, transactions, transformations, or services exist? | Service providers, policies, operations, transaction objects |
| Things affected or connected | Which devices, systems, accounts, artifacts, or external resources does the software affect? | External representations, interfacers, resource objects |
| Information flowing through | Which meaningful requests, results, histories, messages, schedules, or facts move? | Information holders, domain values, messages |
| Decisions, control, coordination | Who decides, sequences, authorizes, arbitrates, retries, or delegates? | Policies, controllers, coordinators |
| Structures and groups | Which relationships, pools, registries, indexes, or composite structures matter? | Structurers, catalogs, pools, relationship objects |
| External-world concepts the software must know | Which users, assets, locations, products, or events change behavior? | Domain-facing participants |

Repeated support across themes increases confidence. A perspective that produces nothing can be skipped.

### Boundary rules

- Model a connection with an interfacer when protocols, trust, timing, formats, or vocabularies differ.
- Represent an external system as a candidate when internal participants request services from it or reason about its state.
- Represent a user only when identity, role, preferences, permissions, history, or continuity changes system behavior. User actions alone can enter through a user interfacer.
- Ask what the software needs to know about the outside world, not which real-world nouns exist.

## Name and characterize candidates

Every candidate needs:

- a clear name;
- a concise purpose: what kind of participant it is, what it principally knows/does/decides, and one distinguishing fact;
- one or more provisional stereotypes;
- clients or beneficiaries;
- themes, system responsibilities, or scenarios it supports;
- important exclusions, uncertainties, or pattern roles;
- a disposition: accepted, deferred, or rejected.

### Naming tests

- Include stable, client-relevant distinctions; hide mechanisms and pattern participation.
- Use a worker name or `Service` when it naturally communicates a service-provider role.
- Treat a broad name such as `Manager`, `Processor`, `System`, or `Handler` as a question, not an automatic defect: can its purpose and boundary be made precise?
- Prefer a name that leaves appropriate behavioral room. `Account` suggests more responsibility than `AccountRecord`.
- Choose a name valid for the participant's full lifetime, not only startup or one transient action.
- Avoid overloading one name with different meanings in the same design.
- Use domain-standard words and understood abbreviations; avoid clever invented jargon.
- If a general abstraction is proposed, compare at least three concrete cases when practical. Two cases often expose only accidental similarity.

Names influence responsibility assignment. Rename a candidate when its work changes rather than allowing name and behavior to drift apart.

## Defend, defer, merge, or reject

Accept a candidate when you can:

- define and stereotype it;
- connect it to a meaningful behavior, theme, or architectural boundary;
- assign one or two plausible responsibilities;
- explain how clients view it;
- state why it matters;
- distinguish it from nearby candidates.

Defer it when the idea may be useful but responsibility or distinction is not yet clear. Record the evidence or scenario that would decide it.

Reject or merge it when it is vague, outside the boundary, redundant with a better candidate, insignificant, gratuitously clever, too concrete, or adds no behavioral value.

Look for complementary candidates around a strong one: a history, policy, transaction, connection, relationship, or service may be missing. Stop discovery when it no longer creates useful contrasts; move to responsibility assignment and scenario work. There is no correct candidate count.

## Cluster and search for common roles

Arrange candidates by several lenses:

- application layer or architectural position;
- use case or scenario;
- stereotype;
- theme;
- abstraction level;
- object neighborhood.

First make candidates distinct; then deliberately search for common ground. Common responsibilities may justify:

- a shared role expressed as an interface or protocol;
- shared implementation in an abstract class or module;
- a separate provider of common behavior;
- collapsing multiple concrete candidates into one configurable participant.

A real-world category deserves a distinct software abstraction only when it has responsibilities that matter to this application. Retain concrete categories only when they behave differently here.

## Define responsibilities

A responsibility is a general obligation to:

- **do**: perform an action or deliver an outcome;
- **know**: maintain, derive, or provide coherent information;
- **decide**: make a consequential choice affecting other participants.

Responsibilities are promises, not implementation. "Determine whether the proposed schedule satisfies enrollment rules" is a responsibility. `validateSchedule(schedule): Result`, `prerequisites[]`, and `GET /eligibility` are possible implementations.

### Nine sources

Use these as overlapping search passes:

1. **Use cases and scenarios**: restate externally described behavior as internal obligations; decompose only as far as needed for ownership.
2. **Gaps in descriptions**: ask about state, timing, synchronization, feedback, lifecycle, missing policy, failure, resource reservation, and coordination.
3. **Themes and design story**: turn configurability, translation, merging, access control, or resource constraints into explicit duties.
4. **What-if/then/how chains**: follow a quality or risk concern until concrete responsibilities emerge.
5. **Role stereotypes**: infer typical knowing, doing, structuring, translating, coordinating, or deciding duties.
6. **Candidate's deeper nature**: identify public obligations first, then private responsibilities needed to fulfill them.
7. **Relationships**: replace vague `has`, `owns`, or `knows` with duties for maintaining, navigating, constraining, or explaining the relationship.
8. **Life events**: creation, activation, state transition, incoming event, elapsed time, shutdown, persistence, and resource release.
9. **Technical environment**: framework, protocol, library, runtime, or container obligations. Treat these as secondary roles after the application role is credible.

Track unresolved high-impact questions alongside discovered responsibilities. A missing answer is part of the design state.

## Write strong responsibility statements

- Stay above individual fields and operations.
- Use an outcome-oriented verb and a meaningful object: calculate, merge, authorize, reserve, schedule, reconcile, notify, preserve, select.
- A weaker verb may be correct when it has a precise domain meaning.
- Make a reusable role's responsibilities general enough for all realizations; make a concrete participant's responsibilities specific enough to reveal character.
- Record low-level examples as parenthetical hints or separate specifications rather than multiplying CRC entries.
- Separate **public responsibilities** offered to clients from relevant **private responsibilities** that explain how the promise is fulfilled.
- Give responsibilities stable IDs in a rigorous design so requirements, scenarios, contracts, and implementation can trace to them.

## Assign responsibilities

For each responsibility, compare three choices:

1. the participant performs all work itself;
2. it performs the overall responsibility and collaborates for subordinate work;
3. it delegates the entire request to a capable helper.

There may be several good allocations. Make a provisional choice, simulate its consequences, and revise.

### Assignment heuristics

#### Start with high-impact participants

Prioritize candidates that are central to the domain, bridge layers or neighborhoods, make consequential decisions, expose widely used services, structure important relationships, or perform complex work. Connectivity alone does not equal importance.

#### Detect overload accurately

A long responsibility list may be too detailed or truly overloaded. First raise its abstraction level. If incoherence remains, split the participant into collaborators with nameable roles.

#### Keep behavior with related information

Let the owner of authoritative information apply its own coherent rules when appropriate. Conversely, consider placing the information with the behavior that alone needs it. This reduces duplicated state and tell-ask-manipulate sequences.

#### Distribute intelligence by fit

Give collaborators the work they can responsibly handle. Avoid an omniscient controller operating on passive records. Equal distribution is not the goal; intelligible and coherent ownership is.

#### Keep one authoritative fact in one place

If several participants need the same information:

- create one shared information holder;
- assign ownership to the best-fitting existing participant and let others ask;
- or merge participants whose separation was artificial.

Do not duplicate mutable truth without an explicit consistency protocol.

#### Preserve coherence and domain direction

Every responsibility should contribute to the role's purpose. Keep lower, reusable domains independent of higher application concerns. When two domains must be bridged, use an upper-level participant or interfacer rather than teaching the lower concept about the higher one.

#### Reject convenience favors

Do not turn a familiar domain object into a navigation hub for every relationship. Assign nonintrinsic relationships to a focused structurer when valuable, but avoid a cloud of trivial glue objects.

#### Avoid overlapping semantic responsibility

Choose one owner for validation, policy, recovery, or invariant enforcement unless the requirement calls for redundancy. Different layers may check different properties; duplicate checks of the same meaning need justification.

## Getting unstuck

| Problem | Response |
| --- | --- |
| Responsibility is enormous | Treat it as a problem statement; decompose into coherent obligations and a sequencing responsibility |
| Responsibility is vague | Seek domain clarification or verify that specific assigned responsibilities already cover it |
| Several owners seem plausible | Make each provisional assignment and walk the neighborhood consequences |
| No candidate fits | Invent a candidate, or recognize that the item is an implementation detail rather than a CRC responsibility |
| Implementation anxiety | Remember that "knows" can mean stored, derived, or obtained through collaboration |
| Too many fragments | Recombine responsibilities or candidates until each participant has substantive character |

## CRC working model

During exploration, CRC means **Candidate, Responsibilities, Collaborators**.

For each card record:

- name and status;
- purpose and exclusions;
- primary role and stereotype blend;
- secondary domain or technical roles when relevant;
- public responsibilities and selected private responsibilities;
- collaborators by role, not every concrete instance;
- client population;
- unresolved questions and concerns;
- reason to keep, split, merge, or reject.

Keep unassigned responsibilities on a visible backlog. The point of CRC is cheap revision; polished formatting is not evidence of design quality.

## Mapping to implementation

Only after scenarios stabilize the responsibility model:

- map replaceable roles to interfaces, protocols, ports, or capability contracts;
- map complete participants to concrete classes, modules, services, processes, or agents;
- add technical secondary roles imposed by frameworks;
- distinguish shared client meaning from shared implementation;
- document when multiple roles intentionally share one realization;
- avoid designing inheritance hierarchies merely because names form a taxonomy.

## Quality tests and smells

### Per participant

- Does it stick to its purpose?
- Are responsibilities clear and at the correct level?
- Do they match the role and stereotype blend?
- Does it provide value to neighbors?
- Is its name consistent with its entire lifetime behavior?
- Does it do too much, too little, or unrelated favors?

### Neighborhood and system

- Does every major theme, core scenario, and risk trace to owned responsibilities?
- Does each fact, invariant, decision, relationship, and recovery action have an owner?
- Are deferred responsibilities and questions visible?
- Are responsibilities clustered into coherent neighborhoods?
- Are cross-neighborhood obligations deliberate and few?
- Can likely change be localized?
- Can scenarios be enacted without invented knowledge or magical helpers?

### High-value smells

- noun extraction or literal real-world mirroring;
- classes, tables, APIs, or frameworks selected before roles;
- passive records with all decisions centralized elsewhere;
- `Manager` or `Processor` participants with unbounded scope;
- duplicate facts, policies, validation, or recovery;
- fields and method names masquerading as responsibilities;
- categories different in reality but behaviorally identical in the application;
- many tiny candidates separated by incidental variation;
- cross-domain dependencies from reusable concepts into application concerns;
- neat CRC cards never tested through collaboration.

Do not call a candidate model sound until collaboration scenarios test it.

