# RDD core model

## Governing perspective

Responsibility-Driven Design treats software as a community of responsible participants. Each participant plays one or more roles, owns a coherent part of the system's obligations, and collaborates with others to achieve results none can achieve alone.

The primary design move is **invention through abstraction**. Do not copy the real world literally. Invent a software reality whose participants make the required behavior clear, manageable, and changeable. Domain concepts are useful when the application needs to know or act on them; execution-oriented participants are equally legitimate when they coordinate work, translate boundaries, manage resources, apply policies, or recover from failure.

The central model is:

```text
application = interacting participants
participant = implementation of one or more roles
role = related responsibilities usable as a replaceable slot
responsibility = obligation to know, do, or decide
collaboration = request between participants or roles
contract = terms governing a collaboration
```

This model is behavioral. A structural inventory without obligations and interactions is not an RDD design.

## Vocabulary and distinctions

| Term | Meaning | Common confusion to reject |
| --- | --- | --- |
| Application | A community of interacting participants | A deployment unit or repository only |
| Object | A responsible participant that encapsulates behavior and relevant knowledge | Automatically a class instance or database entity |
| Role | A context-specific, replaceable slot defined by related responsibilities | A job title, class name, or stereotype alone |
| Candidate | A provisional participant or role in exploratory design | A committed implementation type |
| Responsibility | A high-level obligation to act, know/provide, or decide | A field, getter, method signature, or task checklist |
| Collaboration | One participant asks another to fulfill an advertised responsibility | Any static dependency or data-flow arrow |
| Contract | Client/provider obligations, valid-use conditions, and externally relevant effects | A type signature alone |
| Neighborhood | A coherent group of collaborators with a collective purpose | An arbitrary package or layer |
| Interface | The public vocabulary used to request responsibilities | A complete description of valid use and effects |

### Role versus object versus realization

- When only one kind of participant ever fills a role, role and object may appear identical.
- When multiple kinds can fulfill the same responsibilities, the role is a replaceable slot and should be expressed independently of each implementation.
- One participant may play multiple roles. Distinguish a blended role serving one client purpose from separate roles serving different client populations or purposes.
- Candidates earn implementation commitment only after their responsibilities and collaborations demonstrate value.
- Candidates do not map mechanically one-to-one to classes. A role may become an interface; multiple roles may be realized by one class; one broad candidate may become several collaborators.

## The six role stereotypes

Stereotypes are purposeful oversimplifications that prompt design questions. They are not an exclusive taxonomy.

| Stereotype | Characteristic contribution | First questions |
| --- | --- | --- |
| Information holder | Knows and supplies coherent information | What is authoritative? Where does it originate? What can be derived? |
| Structurer | Maintains relationships and knowledge about them | Why does the relationship exist? Who navigates it? What collective questions matter? |
| Service provider | Performs work or computation | Who requests it? What inputs, policy, or variants does it require? |
| Coordinator | Reacts to events and delegates cooperative work | What starts the work? Which outcomes are delegated? How is progress tracked? |
| Controller | Makes decisions and closely directs actions | Which decisions belong here? What knowledge drives them? Is it becoming omniscient? |
| Interfacer | Transforms requests or information across a boundary | Which vocabularies, trust assumptions, formats, or timing models differ? |

An object may blend stereotypes. An Account can be an information holder and service provider if it maintains its balance and applies its own rules. A coordinator can also interface with an external event source. Use the blend to sharpen the role, never to excuse incoherence.

Interfacers may face users, external systems, or another internal neighborhood. Their essential responsibility is translation or boundary protection, not merely forwarding.

## Responsibility systems

An application implements a system of responsibilities. Whole-system obligations are decomposed and assigned to roles; roles collaborate to fulfill larger obligations. Responsibility assignment always changes the neighborhood:

- work given to one participant is work removed from another;
- placing a fact near a decision may reduce collaboration;
- splitting an overloaded participant introduces a collaboration;
- centralizing a policy may improve consistency but create a dependency hub;
- delegating can reduce controller knowledge but may scatter control beyond comprehension.

Judge a participant in context:

- Does it offer a useful, outcome-oriented service?
- Are its clients required to know incidental details?
- Does it constantly ask others for small pieces of help?
- Are its side effects and guarantees appropriate?
- How many exact collaborator types or structural details does it assume?
- Could it use its own knowledge to perform more of its coherent work?

"Smarter" means locally responsible, not globally powerful. The goal is moderately intelligent collaborators, not a god object.

## Contracts and information hiding

A responsible collaboration states more than the request name. For important services, specify:

1. **Advertised responsibility**: the outcome the provider offers.
2. **Client-supplied information**: inputs and context.
3. **Conditions of use**: preconditions, required state, call ordering, authority, timing, and other circumstances under which the provider promises to act.
4. **Aftereffects**: result, state transition, externally visible side effects, invariants preserved, and permitted exceptional outcomes.
5. **Private implementation**: how the provider fulfills the obligation; clients should not depend on it.

Information hiding hides the method, structure, and volatile decision. It does not hide constraints or effects that clients need to collaborate correctly.

A useful contract balances obligations and benefits. Strong client preconditions paired with weak provider guarantees indicate a low-value service. Formalize contracts selectively for high-risk, boundary-crossing, independently implemented, state-changing, or failure-prone collaborations.

## Domain and execution-oriented participants

### Domain-facing participants

Represent stakeholder-recognizable concepts only to the degree the application needs. A complete model of the real world is neither possible nor useful. Retain domain vocabulary because it anchors stakeholder intent and policies.

### Application-specific machinery

Invent participants for work absent from the real world, including:

- interpreting input and external events;
- coordinating tasks and long-running processes;
- applying policies and making decisions;
- translating formats, protocols, or abstraction levels;
- managing scarce resources, sessions, or persistence;
- presenting information;
- detecting, reporting, and recovering from failures.

Healthy designs connect the stakeholder view to the execution view without letting either erase the other.

## Neighborhoods, components, and architecture

A neighborhood has a coherent collective responsibility. Its internal collaborators may communicate freely; outsiders should normally use a small public face. The neighborhood is valuable when it:

- hides internal organization and change;
- limits cross-boundary collaboration paths;
- has a nameable collective role;
- preserves a natural domain, trust, deployment, or change boundary;
- avoids leaking obligations into unrelated areas.

Architecture is behavioral as well as structural. A useful architectural account includes responsibilities, collaboration and control conventions, failure assumptions, resource use, performance expectations, and contracts. A boxes-and-lines diagram alone is incomplete.

Styles such as layers, pipes and filters, or blackboard arrangements constrain legal collaborations and preserve opportunities for qualities; they do not guarantee those qualities. Follow framework-imposed lifecycle and control conventions deliberately, while keeping application roles visible.

## Patterns, frameworks, and realization

Patterns provide vocabulary, reusable reasoning, forces, an adaptable solution, and consequences. Apply one only when the problem and forces fit. Always ask:

- Which responsibilities move or appear?
- Which collaborations become simpler or more complex?
- Which variation does the pattern support?
- Which coupling or control trade-off does it introduce?
- What simpler alternative exists?

Frameworks are executable generalized designs. They can provide consistency, efficiency, and rich behavior, but impose inversion of control, learning cost, constraints, and a solution style. Treat framework roles as secondary technical roles layered onto a credible application design.

At realization time:

- use an interface or protocol for a role with multiple plausible implementations;
- use a concrete class or module for a complete implementation;
- use an abstract class only when shared implementation is real and useful;
- use composition and collaboration to assemble behavior dynamically;
- use inheritance to share or specialize implementation without confusing ancestry with client-visible role.

Keep conceptual equivalence separate from implementation equivalence. Two participants may share a client-visible responsibility while implementing it differently; superficially similar responsibility wording may still require distinct client contracts.

