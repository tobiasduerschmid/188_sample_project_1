# Responsibility-Driven Design glossary

This glossary uses the terminology of Rebecca Wirfs-Brock and Alan McKean's *Object Design: Roles, Responsibilities, and Collaborations*. It defines concepts by their design meaning, not merely by how a particular language implements them. **Modern extension:** realizations may be classes and objects, but also modules, services, processes, functions, workflows, or agents when they preserve the same roles, responsibilities, collaborations, and contracts.

Page anchors refer to the printed book pages.

## Fast distinctions

| Do not collapse | Distinction |
| --- | --- |
| **Role / class** | A role is a client-visible, context-specific set of related responsibilities and may have several interchangeable realizations. A class is one implementation mechanism and may realize several roles. |
| **Responsibility / method** | A responsibility states an obligation to know, do, or decide. A method is code behind one operation; several methods may fulfill one responsibility, and one method may contribute to several. |
| **Collaboration / call** | A collaboration is the design relationship or cooperative episode in which one participant asks another to fulfill a responsibility. A call or message is a concrete interaction within it. |
| **Controller / coordinator** | A controller gathers information, makes consequential decisions, and directs resulting action. A coordinator primarily routes requests, passes information, and facilitates work already determined. The difference is one of degree. |
| **Information holder / structurer** | An information holder owns coherent facts. A structurer owns relationships among participants and answers questions about the organization. |
| **Trust region / trust boundary** | A trust region is a set of collaborators designed to share assumptions. A trust boundary is where those assumptions stop and validation, translation, or defensive responsibilities must be assigned. |
| **Error / exception** | In the book's design vocabulary, an error is a fundamentally wrong condition from which ordinary continuation is often unreasonable; an exception is an abnormal but anticipated condition for which the design should define a response. This is not a programming-language type hierarchy. |
| **Hot spot / hook** | A hot spot describes what must vary and gives concrete cases. A hook is a designed adaptation point that realizes some or all of that variation. One hot spot may need several hooks. |
| **Pattern / framework** | A pattern is reusable design knowledge: problem, forces, context, adaptable solution, and consequences. A framework is reusable executable structure with defined extension points and inversion of control. |
| **Proposed / realized design** | A proposed design expresses an intended solution not yet shown to be implemented. A realized or working design describes what the implementation actually does. Label views so readers know which they are seeing. |
| **Interface / contract** | An interface names available requests. A contract adds valid-use conditions, client and provider obligations, guarantees, and externally relevant effects. |
| **Candidate / realization** | A candidate is a provisional design idea. A realization is a concrete mapping of a sufficiently stable role or candidate to interfaces, classes, components, or code. |
| **Domain object / application-specific object** | A domain object represents a concept needed from the stakeholder's domain. An application-specific object is invented software machinery for coordination, translation, control, persistence, or other execution needs. |

## Alphabetical glossary

### Abstraction

The act of forming a participant, role, or organization that preserves the essential design meaning while suppressing irrelevant detail. In RDD, abstraction is the primary design tool: the goal is a useful software reality, not a literal copy of the real world. An abstraction earns its place by clarifying responsibilities, collaborations, or variation.

*Book anchors: Preface pp. xix–xx; ch. 1 pp. 1–3; ch. 2 pp. 40–43.*

### Actor

A person, administrator, external program, or device outside the system boundary that takes initiative and interacts with the system. Actor descriptions orient system responsibilities to an external point of view. An actor is not automatically an internal object or class.

*Book anchors: ch. 2 pp. 50–52.*

### Aftereffect guarantee

The part of a contract that states what is observably true after a responsibility has been fulfilled: returned information, state transitions, externally visible side effects, or preserved conditions. It says what mark the service leaves, not how the provider produces it. “Postcondition” is a closely related formal term.

*Book anchors: ch. 1 pp. 7–8; ch. 5 pp. 155–157.*

### Application

A community of interacting participants that collectively fulfills system responsibilities. Treating an application only as a repository, deployable, database schema, or list of classes omits its defining behavior.

*Book anchors: ch. 1 pp. 2–6.*

### Application-specific object

A participant invented because executable software needs it, even though no corresponding concept is familiar in the stakeholder's domain. Typical purposes include interpreting input, coordinating a task, applying control policy, translating formats, starting the application, connecting to a database or device, and handling failures.

*Book anchors: ch. 1 pp. 10–12.*

### Architecture

A collection of significant system behaviors and descriptions of how components, subsystems, layers, or objects affect one another. A useful architecture states responsibilities, legal collaboration paths, control conventions, failure and resource assumptions, performance expectations, and contracts. A boxes-and-lines structure alone is not an architecture in this sense.

*Book anchors: ch. 1 pp. 27–30.*

### Architectural style

A recurring organization of components and interactions, such as layered, pipes-and-filters, or blackboard, or a recurring allocation of control. A style constrains possible collaborations and may support qualities such as maintainability or performance; selecting it does not guarantee those qualities.

*Book anchors: ch. 1 pp. 28–36.*

### Boundary

A deliberate separation between a system and its environment or between responsible neighborhoods inside a system. A boundary should clarify which side owns which responsibilities, what may cross, and under what contract. A system boundary, neighborhood boundary, process boundary, and trust boundary may coincide, but they are not synonyms.

*Book anchors: ch. 2 pp. 49–51; ch. 5 pp. 154–157; ch. 8 pp. 280–285.*

### Candidate

A provisional object or role proposed during exploratory design. A candidate must demonstrate a useful purpose, coherent responsibilities, and credible collaborations; it may be renamed, split, merged, generalized, demoted to an attribute, or discarded. Do not commit candidates mechanically to classes.

*Book anchors: ch. 2 pp. 58–63; ch. 3 pp. 78–106.*

### Candidate model

The deliberately changeable model of provisional candidates, responsibilities, and collaborators used during exploration. Its uncertainty is a feature: formalizing it too early raises the cost of revising weak ideas.

*Book anchors: ch. 2 pp. 60–63; ch. 5 pp. 150–152.*

### Class

A software definition that supplies the structure and method implementations used by its instances. The book gives a class two possible roles: factory for instances and independent provider of class-level services. A class is not the same as a role: it may realize several roles, and one role may be realized by multiple classes.

*Book anchors: ch. 1 pp. 13–17.*

### Client

A participant that requests an advertised responsibility from a provider. “Client” is relative to one collaboration, not a permanent stereotype: the same participant may be client in one interaction and provider in another. Client obligations belong in the contract.

*Book anchors: ch. 1 pp. 5–8; ch. 5 pp. 150–157.*

### Collaboration

A request from one participant or role to another for help fulfilling a larger responsibility. It is both behavioral—request, information, result, effects, and control—and structural—the visibility path that makes the request possible. A collaboration is not merely any dependency, data flow, or method call.

*Book anchors: ch. 1 pp. 3–7; ch. 5 pp. 149–157.*

### Collaboration model

A description of how, when, and with whom participants interact to fulfill system behavior. It adds dynamic behavior and connection paths to a roles-and-responsibilities model. It may be expressed with CRC cards during exploration, scenario traces, collaboration stories, sequence diagrams, code, or a combination.

*Book anchors: ch. 5 pp. 149–152, 166–192.*

### Collaboration story

A selective narrative or diagram that explains how participants cooperate for a meaningful purpose. It should maintain a consistent abstraction level and emphasize the facts its audience needs. It is not required to enumerate every call or implementation detail.

*Book anchors: ch. 3 pp. 80–84; ch. 7 pp. 239–276.*

### Collaborator

A participant or role whose responsibilities another participant uses while fulfilling its own. Record the meaningful role, not every concrete instance or low-level library object. A collaborator is justified by a responsibility, not by structural proximity alone.

*Book anchors: ch. 2 pp. 61–63; ch. 5 pp. 150–152.*

### Component

A packaged design element intended to expose well-defined services while hiding its interior. Components can support replacement, independent evolution, configuration, or medium-grained reuse. A component still needs responsibilities, contracts, and collaboration behavior; packaging alone does not make it well designed.

*Book anchors: ch. 1 p. 18; ch. 8 pp. 284–285.*

### Composition

The runtime assembly of participants through references and collaboration. An object can extend its capability by delegating to composed helpers, and collaborators may be replaced while the program runs. Contrast with inheritance, which combines class definitions statically.

*Book anchors: ch. 1 p. 16.*

### Conceptual object

A stakeholder-recognizable concept used as an initial bridge from requirements to object design. It is a candidate, not a promise of one-to-one implementation. Design often enriches, splits, or replaces conceptual objects with execution-oriented participants.

*Book anchors: ch. 2 pp. 58–61.*

### Conditions-of-use guarantee

The part of a contract that specifies the circumstances under which a provider guarantees its work: valid input, required state, timing, ordering, authority, available collaborators, or other contextual conditions. “Precondition” is a closely related formal term. Invoking a service outside these conditions releases the provider from the stated guarantee.

*Book anchors: ch. 1 pp. 7–8; ch. 5 pp. 155–157.*

### Contract

An agreement governing a collaboration. It identifies the advertised responsibility, client-supplied information and obligations, conditions of valid use, provider guarantees, aftereffects, and relevant exceptional outcomes while hiding private implementation. A signature or type declaration is only part of a contract.

*Book anchors: ch. 1 pp. 7–8, 12; ch. 5 pp. 155–157; ch. 8 pp. 307–310.*

### Control

Consequential decision making and selection of paths through the software. Control includes interpreting events, choosing what should happen, sequencing work, and deciding how to respond to exceptional outcomes. It is broader than thread scheduling or process orchestration.

*Book anchors: ch. 5 pp. 155–156; ch. 6 pp. 195–236.*

### Control center

A recognizable locus of related control responsibilities, such as a user-initiated task, long-running process, domain decision neighborhood, or external-device interaction. A control center may contain one controller or several controllers and coordinators. It is a design focus, not necessarily one object.

*Book anchors: ch. 6 pp. 195–236.*

### Control style

The characteristic distribution of decision-making, sequencing, and delegation responsibilities within a control center or system. Styles lie on a continuum:

- **Centralized:** a few controllers make most decisions and direct relatively passive workers.
- **Clustered:** related controllers divide phase-, state-, or area-specific decisions while retaining a recognizable center.
- **Delegated:** controllers decide outcomes and delegate meaningful work and local decisions to capable participants.
- **Dispersed:** decision making is spread broadly with no clear center.

Delegated control is often a useful balance, not a universal rule. Select a style for the actual decision complexity and repeat it where similar semantics warrant consistency.

*Book anchors: ch. 1 pp. 30–33; ch. 6 pp. 195–236.*

### Controller

A role stereotype that gathers information, makes decisions, selects paths, and directs others' actions. Its focus is deciding rather than performing every resulting action. A controller becomes unhealthy when it knows collaborators' internals, contains most domain logic, or micromanages low-level steps.

**Contrast with coordinator:** a controller figures out what should happen; a coordinator is more often told the desired work and facilitates it. Real roles may blend both.

*Book anchors: ch. 1 p. 4; ch. 4 pp. 121, 135–138; ch. 5 pp. 163–164.*

### Conversation

A usage description pairing actor actions and inputs with corresponding system responsibilities, usually in parallel columns and successive rounds. Conversations are valuable sources of responsibilities but deliberately omit the internal object solution.

*Book anchors: ch. 2 pp. 54–57.*

### Coordinator

A role stereotype that facilitates cooperative work by holding connections, passing information, routing requests, and asking others to act. A coordinator should make few substantive decisions beyond those needed to route or sequence the work.

**Contrast with structurer:** both may hold references, but a coordinator manages action among workers while a structurer manages and explains an organization of members.

*Book anchors: ch. 1 p. 4; ch. 4 p. 121; ch. 5 pp. 163–164.*

### Core design problem

A problem that must be solved well for the application to meet essential needs or withstand actual use. “Core” describes consequence, not novelty or technical difficulty. Give core work sustained attention and do not classify everything as core.

*Book anchors: ch. 10 pp. 355–361.*

### CRC card

An inexpensive exploratory record for a **Candidate**, its **Responsibilities**, and its **Collaborators**. The front may state purpose, stereotypes, and pattern roles; the reverse records knowing, doing, and deciding responsibilities plus meaningful collaborators. Its low cost makes revision and disposal easy. Commit to classes later.

*Book anchors: ch. 2 pp. 61–63; ch. 5 pp. 150–152.*

### Delegation

A responsibility-allocation move in which a participant asks a collaborator to perform meaningful subordinate work. The delegator remains responsible for its own advertised outcome unless the public contract explicitly transfers ownership. Delegation should reduce inappropriate knowledge or isolate coherent work, not create trivial one-method helpers.

*Book anchors: ch. 1 pp. 5–7, 16; ch. 5 pp. 153–155; ch. 6 pp. 195–236.*

### Design description

Any artifact used to communicate a design: a story, sketch, CRC card, responsibility table, scenario trace, contract, UML view, code, or other selected representation. No single description tells the whole design. Produce the views that answer real audience questions, and label abstraction, scope, omissions, and status.

*Book anchors: ch. 1 pp. 36–37; ch. 7 pp. 239–276.*

### Design pattern

Reusable design knowledge that relates a recurring problem and forces to a contextual, adaptable solution and its consequences. Applying a pattern changes responsibilities and collaborations; merely naming it is not an argument that it fits. Patterns provide vocabulary and expertise, not executable code.

*Book anchors: ch. 1 pp. 18–25; ch. 5 pp. 170–172.*

### Design realization

The mapping of stable candidates and roles into concrete interfaces, classes, components, relationships, methods, and code. A role may have several realizations; one class may realize several roles; a broad candidate may require a neighborhood. Realization decisions should follow enough behavioral exploration to justify commitment.

*Book anchors: ch. 1 pp. 13–18, 36; ch. 3 pp. 79–80.*

### Domain model

A selective model of the domain information, services, structures, and policies required for intended application scenarios. It is not an inventory of the whole real world. Its participants embody application semantics and provide common language with domain experts.

*Book anchors: ch. 1 pp. 8–10.*

### Domain object

A participant representing a concept familiar to stakeholders in the relevant domain and needed by the application. Domain familiarity makes it useful for communication; it does not make the participant automatically worthy, purely informational, or identical to a database entity.

*Book anchors: ch. 1 pp. 8–10.*

### Error

In the book's reliability vocabulary, a condition indicating that something is wrong—such as malformed data, faulty logic, a bad program, or broken hardware—and for which ordinary recovery and continuation may be unreasonable. Design effort should be proportional to criticality; fault-tolerant systems may deliberately handle conditions ordinary systems classify as errors.

**Contrast with exception:** an exception is abnormal but expected enough that the design defines detection and response. Do not equate this conceptual distinction with a language's `Error` and `Exception` classes.

*Book anchors: ch. 8 pp. 277–280, 287–288.*

### Exception

An abnormal but anticipated condition that makes an actor, system, object, or component leave its normal path. The design should decide who detects it, how it is communicated, who handles or recasts it, the state after handling, and what happens if recovery fails. An exception may be signaled through a language mechanism or reported in a result; the design responsibility is independent of that choice.

*Book anchors: ch. 8 pp. 285–310.*

### Exception handling

The responsibilities that move the system from an exceptional condition to a defined, predictable outcome. Handling may retry, substitute, compensate, ask an actor for help, abort the current task safely, escalate, or restore a stable state. Detecting or logging an exception is not necessarily handling it.

*Book anchors: ch. 8 pp. 288–310.*

### Framework

An executable generalized design that supplies classes or components, defines collaboration and lifecycle conventions, and leaves selected application behavior to extension points. A framework can improve efficiency, richness, consistency, and predictability, but imposes complexity, constraints, and inversion of control.

**Contrast with pattern:** a pattern explains an adaptable design idea; a framework embodies a reusable partial implementation. **Contrast with library:** ordinary client code typically calls a library, whereas a framework commonly calls application-supplied hooks.

*Book anchors: ch. 1 pp. 25–27.*

### Fudging

Consciously leaving an area imprecise while concentrating on what matters now. Fudging is responsible only when the omission is visible, its risk is understood, and the design returns to it before the uncertainty becomes load-bearing. It is not permission to conceal an unresolved contradiction.

*Book anchors: ch. 2 pp. 44–48, 68–70; ch. 10 pp. 355–374.*

### Gatekeeper

A participant that presents a limited public face for a larger object organization or neighborhood. It protects internal organization and reduces external collaboration paths. A gatekeeper should expose meaningful collective responsibilities rather than become an all-purpose pass-through or god controller.

*Book anchors: ch. 1 pp. 17–18.*

### Hook

A specific point in a design intended to support adaptation. A hook may enable, disable, replace, augment, add, or configure behavior. Hooks require a clear contract: what remains fixed, what may vary, who supplies the variation, when selection occurs, and which invariants must hold.

**Contrast with hot spot:** the hot spot describes the required variation; hooks are mechanisms introduced to support it. Several hooks may realize one broad hot spot.

*Book anchors: ch. 1 pp. 26–27; ch. 9 pp. 318–319, 330–333.*

### Hook method

A placeholder method called at a designated step so a subclass or other extension can insert varying behavior without changing the fixed algorithm. A hook method is one kind of hook, not the definition of all hooks.

*Book anchors: ch. 9 pp. 330–333.*

### Hot spot

A characterized point of required or credible variation. A useful hot-spot description gives the variation's name, general semantics, at least two concrete cases, desired degree of flexibility, and relevant change time or actor. It states what varies before prescribing how.

*Book anchors: ch. 2 pp. 71–72; ch. 9 pp. 324–328.*

### Hot-spot card

A low-cost artifact recording a hot-spot name, a general description of the variable behavior, and at least two specific examples. It is for discovering similarities and differences, not prematurely embedding a design solution.

*Book anchors: ch. 2 pp. 71–72; ch. 9 pp. 324–327.*

### Information hiding

Concealing private structure, algorithms, and volatile decisions so clients depend only on public responsibilities and contracts. Information hiding does not conceal conditions, effects, limitations, or exceptional outcomes that clients need for correct collaboration.

*Book anchors: ch. 1 pp. 7, 12; ch. 5 pp. 153–157.*

### Information holder

A role stereotype responsible for maintaining and supplying coherent information. A good information holder may validate, derive, update, or use its information to answer meaningful questions; it need not be a passive record.

**Contrast with structurer:** an information holder owns facts; a structurer owns organization and relationships among members. One participant may blend both when the responsibilities form one coherent role.

*Book anchors: ch. 1 pp. 4–6; ch. 4 pp. 120–121; ch. 5 pp. 159–160.*

### Inheritance

A static relationship in which a subclass assumes superclass responsibilities and adds or specializes behavior. It can share implementation or define a family of realizations, but it should not be confused with a client-visible role. Composition and collaboration provide dynamic alternatives.

*Book anchors: ch. 1 pp. 16–17.*

### Instance

A concrete runtime object manufactured according to a class definition. Instances of a class share defined structure and methods but may behave differently because of private state or different collaborators.

*Book anchors: ch. 1 pp. 13–16.*

### Interface

The public vocabulary through which clients request a participant's services. It advertises what can be asked, but an interface alone may omit valid-use conditions and effects; those belong in the contract. A language interface is one possible realization of a role, not the role itself.

*Book anchors: ch. 1 pp. 12–13.*

### Interfacer

A role stereotype that transforms information or requests between distinct parts of a system. It may face a user, another internal neighborhood, or an external system. Its responsibility is translation, adaptation, mediation across an abstraction or protocol boundary, and often boundary protection—not merely forwarding.

*Book anchors: ch. 1 pp. 4, 10–12; ch. 4 p. 121; ch. 5 pp. 164–166.*

### Invariant

A condition that must remain true across the relevant lifetime or operation of a participant or collaboration. Invariants support contracts and safe hooks by separating behavior that must remain fixed from behavior allowed to vary.

*Book anchors: ch. 5 pp. 155–157; ch. 9 pp. 330–333.*

### Inversion of control

The framework arrangement in which framework code owns the lifecycle and calls application-supplied implementations at defined hooks. The application fills prescribed roles rather than directing the framework as it would a conventional library.

*Book anchors: ch. 1 pp. 26–27.*

### Layer

An architectural grouping with characteristic responsibilities and constrained neighboring layers. In the book's illustrative information-system architecture, presentation, application services, domain services, and technical services contain different role mixes; requests tend to flow down and results up. This is an example, not a universal architecture.

*Book anchors: ch. 1 pp. 28–36.*

### Message or request

A concrete communication asking a participant to perform an advertised responsibility or provide information. A message may map to a method call, event, command, protocol exchange, or asynchronous signal. Messages realize collaborations; they are not themselves the high-level responsibility.

*Book anchors: ch. 1 pp. 2–7; ch. 5 pp. 149–157.*

### Method

Executable code implementing an operation defined by a class or equivalent realization. Method names and signatures are lower-level than responsibilities. Do not generate one method per responsibility mechanically: a responsibility may require several private and public methods plus collaborators.

*Book anchors: ch. 1 pp. 12–16; ch. 4 pp. 140–145.*

### Neighborhood

A coherent organization of collaborating participants with a nameable collective purpose and responsibilities. Outsiders should usually interact through a small public face so internal structure can change without broad ripple effects. “Subsystem” and “confederation” are related terms; neighborhood emphasizes the collaboration community rather than packaging alone.

*Book anchors: ch. 1 pp. 17–18; ch. 5 pp. 150–157.*

### Object

A runtime participant that encapsulates behavior and relevant knowledge, responds to requests, plays one or more roles, and collaborates within a community. RDD evaluates an object by its purpose, responsibilities, and value to its neighborhood—not by whether it resembles a real-world thing.

*Book anchors: ch. 1 pp. 1–7.*

### Object exception

An exceptional condition in which an object cannot complete a requested operation. It may be handled locally, raised, recast at a higher abstraction, or reported in a result. Thousands of object requests may support one use-case step, so object exceptions do not map one-to-one to use-case exceptions.

*Book anchors: ch. 8 pp. 288–294.*

### Object organization

A higher-scale design element—such as a neighborhood, subsystem, or confederation—whose participants collectively provide responsibilities no individual supplies alone. It should form a useful abstraction, not merely a bag of objects.

*Book anchors: ch. 1 pp. 17–18.*

### Pattern role

A responsibility-bearing position defined by a design pattern, such as Command, Strategy, or Mediator. An application participant may play a pattern role in addition to its application or domain role. Name both when doing so clarifies why its responsibilities exist.

*Book anchors: ch. 1 pp. 18–25; ch. 2 pp. 62–66.*

### Policy

A business, application, reliability, or control rule that constrains permitted behavior and decisions. Policies should be explicit and assigned to participants capable of applying them consistently. A policy is not the same as a mechanism used to enforce it.

*Book anchors: ch. 2 pp. 56–58; ch. 8 pp. 302–303.*

### Proposed design

A description of an intended solution that has not yet been represented as a verified working implementation. A proposed diagram can be precise, but precision does not make it realized. Label it so reviewers do not mistake aspiration for evidence.

*Book anchors: ch. 7 p. 254.*

### Protocol

The conventions governing an interaction: available requests, expected sequencing, supplied information, and observable responses. An interface contributes vocabulary; a contract adds the obligations and guarantees that make the protocol safe to use.

*Book anchors: ch. 1 pp. 6–8, 12.*

### Purpose

The concise reason a participant or neighborhood exists and the value it supplies to clients. Purpose bounds responsibility assignment. A candidate with no nameable purpose, or several unrelated purposes, is likely weak or overloaded.

*Book anchors: ch. 1 pp. 3–7; ch. 2 pp. 61–63; ch. 3 pp. 88–98.*

### Realized or working design

A design as actually embodied in code or another executable implementation. A realized design view should accurately reflect significant implemented participants, requests, branches, and results while still selecting detail for its audience. It is not necessarily exhaustive or identical to generated code structure.

**Contrast with design realization:** realization is the mapping act or implementation choice; a realized design is its working result.

*Book anchors: ch. 3 pp. 79–80; ch. 7 p. 254.*

### Recoverable exception

An exception for which handling can restore a predictable state and permit the system or actor to continue, possibly along an altered path. Recovery need not mean the original operation succeeds.

### Unrecoverable exception

An anticipated exceptional outcome for which the current operation or use case cannot complete, even though the application may remain stable and continue serving other work. “Unrecoverable” is relative to the current responsibility and recovery policy, not necessarily equivalent to process failure.

*Book anchors for both terms: ch. 8 pp. 287–294.*

### Reference and visibility

The structural means by which one participant can reach another to collaborate. Visibility may arise from composition, a parameter, a returned result, creation, lookup, subscription, or another discovery mechanism, and may be temporary or retained. Knowing that a reference exists does not explain the collaboration's semantics.

*Book anchors: ch. 1 pp. 15–16; ch. 5 pp. 150–158, 166–169.*

### Requirement

A needed behavior, quality, constraint, policy, or environmental fact stated from a stakeholder or system perspective. Requirements motivate system responsibilities but do not prescribe the internal object solution unless a real constraint requires one.

*Book anchors: ch. 2 pp. 44–60.*

### Responsibility

A general obligation assigned to a participant: an action it performs, knowledge it maintains or provides, or a major decision it makes that affects others. Responsibilities state intent at a higher level than attributes, accessors, algorithms, or methods.

Good responsibility statements are cohesive, meaningful to the participant's purpose, and at a consistent abstraction level. They may be decomposed into subordinate responsibilities, but should not be fragmented into implementation steps prematurely.

*Book anchors: ch. 1 pp. 3–7; ch. 4 pp. 109–146.*

### Revealing design problem

A problem whose investigation changes the team's understanding through surprise, discovery, invention, or reframing. Difficulty alone does not make a problem revealing. It may also be core, but “revealing” describes how knowledge develops rather than how consequential the problem is.

*Book anchors: ch. 10 pp. 355–356, 361–369.*

### Role

A context-specific, client-visible set of related responsibilities that defines a replaceable slot in the software machinery. Different participants can play the same role if they honor the same relevant contract. A participant can play several roles, and a role may later become a language interface, class family, component API, or other realization.

**Contrast with class:** role describes expected behavior in context; class describes an implementation. **Contrast with stereotype:** a stereotype is a broad characterization used to reason about a role, not the role's complete contract.

*Book anchors: ch. 1 pp. 3–5, 13–17; ch. 3 pp. 79–80.*

### Role stereotype

A purposeful oversimplification used to focus a role's characteristic contribution. The six stereotypes are:

- **Information holder:** knows and supplies information.
- **Structurer:** maintains relationships and knowledge about them.
- **Service provider:** performs work or computation.
- **Coordinator:** facilitates cooperative work and delegates requests.
- **Controller:** makes decisions and directs action.
- **Interfacer:** translates between distinct parts or abstraction levels.

Stereotypes are not exclusive types. A coherent role may blend them; the blend should clarify responsibilities, not excuse an incoherent collection.

*Book anchors: ch. 1 pp. 4–5; ch. 3 pp. 93–98; ch. 4 pp. 120–121.*

### Scenario

A concrete path through a use case or another behavior description, including a particular sequence and conditions. Scenarios test whether responsibilities, collaborators, visibility, decisions, contracts, and outcomes form a credible design. One scenario is evidence, not complete coverage.

*Book anchors: ch. 2 pp. 52–56; ch. 5 pp. 169–170, 176–192.*

### Service provider

A role stereotype that performs a coherent service or computation for clients. A provider should advertise an outcome-oriented responsibility and hide incidental mechanics. It may hold the information or collaborators needed to perform the work; that does not automatically create a separate role.

*Book anchors: ch. 1 pp. 4–6; ch. 4 pp. 120–121; ch. 5 p. 162.*

### Smart object

A participant that uses its own relevant knowledge to perform coherent work rather than forcing clients to extract information and reconstruct its decisions. “Smart” means locally responsible and useful, not omniscient, highly coupled, or universally capable. Make it only as smart as the application needs.

*Book anchors: ch. 1 pp. 5–7, 15; ch. 4 pp. 110–111, 135–138.*

### Structurer

A role stereotype responsible for maintaining a collection, network, hierarchy, or other relationships among participants and answering questions about that organization. It may add, remove, traverse, summarize, or constrain members.

**Contrast with information holder:** a structurer's defining knowledge concerns relationships and collective organization, not merely facts. **Contrast with coordinator:** it manages the grouping; a coordinator manages cooperative action.

*Book anchors: ch. 1 p. 4; ch. 4 pp. 120–121; ch. 5 pp. 160–164.*

### Subsystem

A logical object organization with collective responsibilities and a limited public interface. It is conceptually similar to a neighborhood or confederation at a larger scale. A subsystem boundary is valuable when it hides internal collaboration and corresponds to a stable responsibility, change, deployment, or trust separation.

*Book anchors: ch. 1 pp. 17–18; ch. 7 pp. 241–250.*

### System responsibility

An obligation of the application as a whole, stated before deciding which internal participants fulfill it. System responsibilities are mined from actor goals, use cases, conversations, policies, quality requirements, and environmental constraints, then decomposed and assigned during design.

**Contrast with object responsibility:** the system statement describes externally required behavior; object responsibilities describe the internal allocation that realizes it. The mapping is usually many-to-many.

*Book anchors: ch. 2 pp. 40–60, 68–70; ch. 4 pp. 111–119.*

### Template method

A fixed algorithm skeleton that defines the order of steps and defers selected steps to hook methods or other variable operations. The template protects invariant sequencing while permitting named variation. It is one flexibility mechanism, not the solution to every hot spot.

*Book anchors: ch. 9 pp. 330–333.*

### The rest

Necessary design work that is neither system-defining core work nor currently revealing. It still requires completion, but should not consume the focused attention reserved for core or discovery-heavy problems. Classification is contextual and may change as consequences become clearer.

*Book anchors: ch. 10 pp. 355–356, 369–371.*

### Trust boundary

The edge between regions that cannot safely share the same collaboration assumptions. At this edge, assign responsibility for validating requests and results, translating representations, protecting state, handling timing and communication failure, and recasting exceptions. Trust boundaries may occur at users, external systems, libraries, components, layers, processes, or independently designed neighborhoods.

**Contrast with system boundary:** a system boundary says what is inside the product; a trust boundary says where collaboration assumptions change. **Contrast with trust region:** the region is the cooperating set; the boundary is its defensive edge.

*Book anchors: ch. 8 pp. 280–285, 299–303.*

### Trust region

A set of participants deliberately designed to collaborate under shared assumptions. Within a trust region, the designated party can validate a condition once and peers may rely on that work, avoiding redundant defensive checks. Trust is a design decision about obligations and guarantees, not normally a runtime identity test and not a promise that exceptions cannot occur.

*Book anchors: ch. 8 pp. 280–285.*

### Trusted collaboration

A collaboration in which client and provider are designed to honor agreed conditions and guarantees, allowing requests to be accepted without repeated validation at every step. A trusted provider may still fail for legitimate exceptional reasons.

### Untrusted collaboration

A collaboration across which requests, data, timing, state, or provider behavior cannot be accepted at face value. The responsible edge may copy data, validate before or after a request, constrain capabilities, translate results, retry, or escalate. Defensive behavior has cost and should be placed deliberately rather than duplicated everywhere.

*Book anchors for both terms: ch. 5 pp. 155–157; ch. 8 pp. 280–285.*

### Use case

A behaviorally related set of interactions that describes a meaningful system capability from an external actor's point of view. Use cases describe what the system must support, not which internal objects or technologies perform it.

### Use-case narrative

A concise natural-language overview of a use case's general capability. A scenario elaborates one concrete path; a conversation emphasizes the actor/system dialogue. Keep the actor's point of view rather than rewriting the narrative as internal implementation steps.

*Book anchors for both terms: ch. 2 pp. 50–54.*

### Use-case exception

An exceptional path in which an actor or the system cannot continue the current use case in the normal way. It may allow an alternate path or end the task while the application continues. It is coarser than an object exception and does not map to one implementation signal.

*Book anchors: ch. 2 pp. 56–57; ch. 8 pp. 286–289.*

### Variation

A meaningful difference in required behavior across circumstances, configurations, users, environments, or future extensions. Characterize its examples, focus, scope, changing actor, and change time before selecting machinery. Flexibility is justified only for variations worth supporting.

*Book anchors: ch. 2 pp. 71–72; ch. 9 pp. 315–345.*

### Visibility

See **Reference and visibility**. Visibility answers how a sender can reach a receiver; collaboration answers why and under which responsibility it does so. A class relationship may describe potential visibility without proving that any meaningful request occurs.

### Whole-system behavior

The externally and architecturally significant behavior produced by the coordinated responsibilities of the participant community. It includes normal outcomes, qualities, failure behavior, and system-level effects that no one object owns alone. RDD begins here before distributing obligations internally.

*Book anchors: ch. 1 pp. 2–7, 27–30; ch. 2 pp. 40–60.*
