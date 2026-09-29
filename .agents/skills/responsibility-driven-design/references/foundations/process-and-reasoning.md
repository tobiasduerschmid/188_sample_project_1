# RDD process and design reasoning

## Informal, iterative, and opportunistic

RDD is a clarification process, not a prescribed waterfall. Designers move among requirements, usage descriptions, object discovery, responsibility assignment, collaboration simulation, implementation, tests, and refinement as new information appears.

The stable thread is responsibility:

1. Understand what the system is obligated to accomplish.
2. Describe that behavior from stakeholder perspectives.
3. Invent roles and participants that can carry the obligations.
4. test responsibility assignments through collaboration.
5. refine for quality, trust, failure, variation, and implementation.

Plan pauses to reexamine assumptions, incorporate feedback, and realign the design. A clean final artifact should not erase uncertainty, rejected alternatives, or the path by which load-bearing decisions were justified.

## Process map

Use only activities that add insight or reduce risk.

| Stage | Activities | Possible artifacts |
| --- | --- | --- |
| Project definition | Establish purpose, scope, benefits, project values, participants, approach, and expected outcomes | Concise project statement, scope, plan |
| System definition | Draw the system boundary; identify actors, external systems, high-level architecture, system concepts, responsibilities, constraints, assumptions, and dependencies | Context/boundary view, glossary, quality and risk notes |
| Detailed description | Describe representative tasks, scenarios, policies, dynamics, interfaces, and special requirements | Use-case narratives, conversations, scenarios, rules, UI or protocol notes |
| Object analysis | Identify domain-familiar concepts and initial responsibility-bearing candidates | Candidate inventory, CRC fronts, glossary |
| Exploratory design | Add execution machinery, assign responsibilities, form neighborhoods, simulate collaborations, and compare alternatives | CRC model, scenario traces, rough collaboration views, prototype |
| Design refinement | Choose control style, formalize visibility and contracts, improve reliability and flexibility, apply justified patterns, and map roles to implementation | Decision records, contracts, refined diagrams, implementation mapping, code and tests |

Progress is uneven. A prototype may clarify a requirement; a failed simulation may invalidate a candidate; a technical constraint may force boundary revision. Returning to an earlier activity is expected.

## Multiple stakeholder perspectives

An object model is a solution description. It does not retain every reason the solution exists. Preserve:

- actor goals and task language;
- business and domain policies;
- quality attributes and failure consequences;
- operational and environmental constraints;
- architecture and platform obligations;
- planned variations and exclusions;
- stakeholder disagreements and unresolved questions.

Use the representation appropriate to each audience. A user cares about task outcomes; a business analyst cares about policy; a tester cares about observable behavior and boundaries; implementers care about roles, contracts, and references. Do not force all perspectives into one diagram.

## Usage descriptions as responsibility sources

- An **actor** is an external user, administrator, program, or device that takes initiative and interacts with the system.
- A **use-case narrative** summarizes a meaningful capability from an actor's point of view.
- A **scenario** gives one concrete path.
- A **conversation** pairs actor actions with corresponding system responsibilities and is especially useful for mining obligations.

Keep the actor's point of view. "Student submits a proposed schedule" is more useful than "UI posts JSON to the schedule endpoint." Technology details can be added later when they constrain the design.

Use cases intentionally omit internal design. Translate system behavior into responsibilities, identify gaps, and then decide who owns them. Keep policies, exceptions, and design notes separate enough that the main usage flow remains comprehensible.

## Classify design work on independent axes

**Operational synthesis:** The book discusses core problems, revealing problems, the rest, and possible wickedness as overlapping ideas. For agent use, this skill normalizes them into two independent questions below. The axis structure and the label **routine** are not the authors' formal taxonomy.

### Consequence: core versus the rest

The **core** contains aspects without which the system will not meet essential user needs or withstand actual use. Test a proposed core item:

- If this is merely adequate or left vague, could the project fail?
- Would other parts of the design be severely affected?
- Is it load-bearing for a required quality or external commitment?

If yes, treat it as core. Not everything can be core. "The rest" still requires completion, but should not consume the focus reserved for system-defining behavior.

### Epistemic character: routine versus revealing

A **revealing problem** changes understanding. It produces surprise, invention, experimentation, or revision of what the team thought was fundamental. Difficulty alone is not enough. Revealing work advances through concentrated investigation, experiments, reflection, and return.

Track:

- current formulation and competing hypotheses;
- experiments and what each is meant to reveal;
- discoveries, dead ends, and changed assumptions;
- bounded compromises and unsupported cases;
- next experiment and revisit trigger.

### Wickedness

A revealing problem may also be wicked: unstable formulation, no objective completion rule, stakeholder value conflict, unforeseen consequences, unique context, and no enumerable solution set. For wicked work, expose competing formulations and residual uncertainty. Human acceptance of a bounded compromise replaces a claim of objective optimality.

The book presents wicked-problem characteristics with explicit credit to Horst Rittel and Melvin Webber (Chapter 10, pp. 365–366).

Core and revealing are not peers. One describes consequence; the other describes how knowledge develops. A problem can be core and routine, core and revealing, or revealing but peripheral.

## Frame the problem before choosing machinery

Large systems contain connected subproblems. These five problem frames are useful question generators:

The book introduces this framing approach through Michael Jackson's problem-frame work (Chapter 10, pp. 358–361).

| Frame | Design questions |
| --- | --- |
| Control | How is an external state changed? How is the effect verified? How are device and software failures distinguished? |
| Connection | What delay, loss, corruption, duplication, divergent state, or recovery can occur across the connection? |
| Information display | How fresh, complete, historical, precise, and timely must answers be? |
| Workpiece | What artifact does the user manipulate? What invariants and interactions make the tool usable? |
| Transformation | Which rules convert input to output? What constraints exist on performance, memory, reversibility, or information loss? |

A system may contain several frames. State the problem strategy before the implementation mechanism. "Preserve authoritative ownership while tolerating delayed synchronization" is a strategy; **modern extension example:** "use Kafka" is machinery.

## Solution strategies

When the first design is awkward, vary the problem intelligently:

- **generalize** to expose a common role or invariant;
- **specialize** to isolate a difficult concrete case;
- use **analogy** to import tested reasoning without assuming the cases are identical;
- **decompose** a large responsibility into coherent subordinate obligations;
- **recombine** responsibilities or merge fragments whose separation creates friction;
- **reframe** the problem by imagining the desired world and reasoning backward;
- **synthesize** a solution from the strengths of several imperfect alternatives.

The book draws the generalize, specialize, analogy, decompose, and recombine moves from George Polya's problem-solving strategies (Chapter 10, pp. 367–369); the agent-oriented framing above is an operational synthesis.

Do not repeat a failed attempt without changing a hypothesis. Prefer a simple solution until evidence shows its inadequacy. If a complex design is chosen, name the requirement or failure of the simpler alternative that makes the complexity necessary.

## Trade-offs and responsible design

Every method emphasizes some concerns and de-emphasizes others. Maintain an explicit **fudging ledger** for anything intentionally left imprecise:

| De-emphasized item | Why now | Consequence if wrong | Compensating practice | Owner | Revisit trigger |
| --- | --- | --- | --- | --- | --- |

RDD is not a substitute for every practice. **Modern extension:** add formal specification or contracts, model checking, threat modeling, performance testing, usability research, data governance, or domain-specific analysis when consequences warrant them.

Bounded support and human intervention can be responsible outcomes. Do not claim universal automation when external systems cannot be controlled, completed work cannot be reversed, or expert judgment is necessary.

## Stopping conditions

Use differentiated gates:

- **Core:** essential responsibilities, collaborations, failure behavior, and quality risks have evidence-backed solutions; no known project-failure path is left unowned.
- **Revealing:** decisive experiments have been run; the current solution is adequate for present goals; no known fatal contradiction remains; residual cases and revisit triggers are recorded.
- **Wicked:** stakeholders accept a bounded compromise with visible consequences and uncertainty.
- **Routine:** the agreed risk-appropriate definition of done is met without gold-plating.
- **Exploratory model:** roles fit, collaborations are nonarbitrary, natural boundaries are preserved, hard areas have been explored, and candidate changes have slowed enough to map to implementation.
- **Interrupted design episode:** record a restart capsule containing current state, decisions, evidence, open questions, next experiment, and exact next action.

Documentation is complete when it communicates what its audience needs and remains maintainable. Preserve critical rationale, boundary assumptions, failure policies, and variation points. Discard disposable sketches after they have served their purpose.
