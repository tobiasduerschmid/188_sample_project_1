# Source map and provenance

## Primary source

This skill is grounded in the user-provided PDF:

Rebecca Wirfs-Brock and Alan McKean, *Object Design: Roles, Responsibilities, and Collaborations* (Addison-Wesley, 2003; first printing dated November 2002 in the file), `ResponsibiltyDrivenDesign.pdf`.

The skill paraphrases and reorganizes the book; it does not reproduce it. Page references below use the page number printed in the book and the one-based PDF page number shown by a PDF reader.

For Arabic-numbered body pages in this file:

`PDF page = printed book page + 25`

Example: Chapter 10 begins on printed page 355 and PDF page 380. The offset should not be applied mechanically to Roman-numbered front matter.

## Provenance labels

Interpret this skill's content in three categories:

1. **Book-grounded paraphrase:** A restatement of concepts, distinctions, techniques, examples, or cautions presented in the source. The source book remains authoritative.
2. **Original operational synthesis:** A procedure, checklist, rubric, template, gate, table, or terminology normalization assembled for agent use from several parts of the book. It is consistent with the book but is not presented as the authors' exact workflow or wording.
3. **Modern extension beyond the book:** New application guidance for technologies or operating concerns not treated directly in the source, including contemporary services, event brokers, functional/data-oriented realizations, distributed operation identity, offline-first synchronization, observability systems, and generative-AI agents. These extensions are explicitly labeled and must not be attributed to Wirfs-Brock or McKean.

Examples and system designs created for this skill are original applications unless explicitly identified as book examples. Review scores and numeric thresholds are original evaluation machinery, not grades defined by the authors.

## Chapter and page map

Ranges include every numbered page belonging to the chapter, including closing material and further reading. Unnumbered separator pages are excluded.

| Chapter | Title | Printed book pages | PDF pages | Primary contribution to this skill |
| --- | --- | ---: | ---: | --- |
| 1 | Design Concepts | 1-38 | 26-63 | Objects as responsible participants; roles and role stereotypes; responsibilities and collaborations; contracts and conditions of use/aftereffects; domain and application-specific objects; interfaces, classes, composition, inheritance, organizations, components, patterns, frameworks, architecture, control styles, and design descriptions |
| 2 | Responsibility-Driven Design | 39-75 | 64-100 | Iterative RDD process; project definition; early and analysis descriptions; multiple stakeholder perspectives; usage descriptions; exploratory design and CRC cards; patterns as inventions; refinement for flexibility, reliability, predictability, consistency, and comprehension |
| 3 | Finding Objects | 77-107 | 102-132 | Design stories and themes; candidate search strategies; naming; candidate descriptions and characterizations; connections, common ground, candidate defense, and discovery of missing participants |
| 4 | Responsibilities | 109-147 | 134-172 | Meaning and sources of responsibilities; assignment strategies; recording and initial allocation; getting unstuck; implementation considerations; candidate-quality tests |
| 5 | Collaborations | 149-194 | 174-219 | Collaboration meaning and options; control and trust questions; collaborator discovery from roles, responsibilities, tasks, patterns, and architecture; simulation; coupling and reachability; reliable collaborations; completion questions |
| 6 | Control Style | 195-238 | 220-263 | Centralized, delegated, and dispersed control; trade-offs; control centers; iterative case study and responsibility redistribution |
| 7 | Describing Collaborations | 239-276 | 264-301 | Collaboration stories; scope, depth, tone, detail, views, and forms; UML limitations; communication guidelines; organization, emphasis, progressive disclosure, and preservation |
| 8 | Reliable Collaborations | 277-314 | 302-339 | Failure consequences; trust regions; errors versus exceptions; object versus use-case exceptions; handling strategies and ownership; reliability design; policy recording; formal contracts; review |
| 9 | Flexibility | 315-353 | 340-378 | Degrees and costs of flexibility; requirements and recorded variations; impact, focus, and scope; templates, hooks, patterns, documentation and recipes; evolving a working system |
| 10 | On Design | 355-374 | 380-399 | Nature of design under uncertainty; core, revealing, and potentially wicked problems; problem framing; adaptive solution strategies; trade-offs, stopping points, responsible design, calibrated rigor, and the book's synthesis of RDD |

## High-value topic anchors

Use these narrower anchors when verifying an interpretation:

| Topic | Book location |
| --- | --- |
| Role stereotypes and core vocabulary | Ch. 1, pp. 2-8; PDF pp. 27-33 |
| Contracts, conditions of use, and aftereffects | Ch. 1, pp. 7-8; PDF pp. 32-33 |
| Architectural and control-style concepts | Ch. 1, pp. 27-36; PDF pp. 52-61 |
| Overall RDD process and multiple perspectives | Ch. 2, pp. 39-74; PDF pp. 64-99 |
| Design stories, themes, candidate discovery, and naming | Ch. 3, pp. 77-106; PDF pp. 102-131 |
| Responsibility sources, assignment, and quality | Ch. 4, pp. 109-146; PDF pp. 134-171 |
| Collaboration discovery, simulation, reachability, trust, and completion | Ch. 5, pp. 149-193; PDF pp. 174-218 |
| Control-style alternatives and trade-offs | Ch. 6, pp. 195-237; PDF pp. 220-262 |
| Collaboration-story views and preservation | Ch. 7, pp. 239-275; PDF pp. 264-300 |
| Reliability, trust, exceptions, recovery policies, and formal contracts | Ch. 8, pp. 277-312; PDF pp. 302-337 |
| Flexibility, hot spots, hooks, patterns, and extension recipes | Ch. 9, pp. 315-352; PDF pp. 340-377 |
| Core versus revealing versus the rest | Ch. 10, pp. 356-361; PDF pp. 381-386 |
| Wicked-problem characteristics and solution strategies | Ch. 10, pp. 365-369; PDF pp. 390-394 |
| Responsible design, trade-offs, stopping work, and final synthesis | Ch. 10, pp. 370-374; PDF pp. 395-399 |

## Secondary ideas credited by the book

Preserve the book's own intellectual attributions when teaching these ideas:

| Idea used by this skill | Attribution made in the book | Book location |
| --- | --- | --- |
| Wicked-problem characteristics | Horst Rittel and Melvin Webber | Ch. 10, pp. 365-366; PDF pp. 390-391 |
| Five problem-frame question sets | Michael Jackson's problem-frame work | Ch. 10, pp. 358-361; PDF pp. 383-386 |
| Generalize, specialize, use analogy, decompose, and recombine as problem-solving moves | George Polya | Ch. 10, pp. 367-369; PDF pp. 392-394 |

## Skill-file derivation map

“Primary source” names the strongest chapter basis, not the only influence. Files labeled operational synthesis deliberately combine material instead of pretending the book defines one fixed, linear procedure.

| Skill file | Primary source basis | Provenance and boundary |
| --- | --- | --- |
| `SKILL.md` | Chs. 1-2 and 10, with routing to Chs. 3-9 | Book-grounded distinctions plus an original operational workflow, evidence rules, output contract, and completion gates |
| `references/index.md` | Whole-book organization | Original progressive-disclosure router; not a book artifact |
| `references/foundations/core-model.md` | Ch. 1; supported by Chs. 5-6, 8-9 | Book-grounded vocabulary and reasoning reorganized as a compact conceptual model; decision tests and normalization tables are operational synthesis |
| `references/foundations/process-and-reasoning.md` | Chs. 2 and 10 | Book-grounded process, perspectives, and design-problem ideas. The independent-axis normalization, `routine` label, ledgers, and agent stopping gates are operational synthesis; named contemporary complementary practices and technology examples are explicitly modern extensions |
| `references/foundations/glossary.md` | Whole book, especially Chs. 1-5 and 8-10 | Book-grounded terminology with printed-page anchors; fast-distinction tables and modern realization notes are operational synthesis or explicitly modern adaptation |
| `references/practice/candidates-and-responsibilities.md` | Chs. 3-4; CRC context from Ch. 2 | Book-grounded discovery, candidate, responsibility, and quality practices reorganized into an executable reference |
| `references/practice/collaborations-and-control.md` | Chs. 5-6; architectural context from Ch. 1 | Book-grounded collaboration, simulation, reachability, trust, control-style, and control-center guidance; combined records and review prompts are operational synthesis; injection, registry/subscription, and distributed delivery semantics are labeled modern extensions |
| `references/practice/design-communication.md` | Ch. 7; design-description context from Ch. 1 | Book-grounded collaboration-story and view-selection guidance; artifact-selection prompts are operational synthesis |
| `references/practice/reliability-and-contracts.md` | Ch. 8; contract foundations from Ch. 1; connection framing from Ch. 10 | Book-grounded consequence, trust, error/exception, retry/recovery policy, and contract concepts. Security controls plus distributed timing, retry-safety, idempotency, consistency, privacy, and observability fields are modern extensions |
| `references/practice/flexibility-and-evolution.md` | Ch. 9; patterns and frameworks from Ch. 1 | Book-grounded variation, hot-spot, hook, pattern, documentation, and evolution concepts; ordered option ladders and review gates are operational synthesis; independently loaded realization lifecycle and operational failure guidance are modern extensions |
| `references/tasks/design-system.md` | Ch. 2 as process spine; Chs. 3-10 for specialist passes | Original task procedure synthesizing the whole book. Phase gates, evidence ledgers, and output schema are not claimed as the authors' canonical sequence |
| `references/tasks/review-design.md` | Completion/review material in Chs. 4-5 and 8; responsible design in Ch. 10; whole-book quality concepts | Original evidence-first review procedure derived from book principles |
| `references/rubrics/rdd-review-rubric.md` | Whole book, especially Chs. 3-10 | Original evaluation rubric. Scores, weights, severity rules, thresholds, and approval gates are not in the book; distributed timeout, ordering, idempotency, and partial-failure checks are modern extensions |
| `references/adaptation/modern-systems.md` | Conceptual anchors in Chs. 1, 5-6, 8-10 | Explicit modern extension beyond the book. Concise router, classic-term mapping, common conceptual boundary, workflow, and review prompts; it delegates realization detail to the child files below |
| `references/adaptation/services-distributed-offline.md` | Conceptual anchors in Chs. 1, 5-6, 8, and 10 | Explicit modern extension beyond the book for service boundaries, remote collaboration, operation identity, concurrency/causality distinctions, distributed contracts, durable journals, synchronization, and offline-first authority/conflict handling |
| `references/adaptation/events-and-workflows.md` | Conceptual anchors in Chs. 5-8 and 10 | Explicit modern extension beyond the book for message semantics, event streams, delivery, orchestration, choreography, asynchronous state, and long-running workflows |
| `references/adaptation/functional-data.md` | Conceptual anchors in Chs. 1 and 3-6 | Explicit modern extension beyond the book mapping participants, roles, stereotypes, responsibilities, and collaborations to functions, immutable data, reducers, actors, modules, state machines, and pipelines |
| `references/adaptation/observability.md` | Conceptual anchors in Chs. 5, 7-8, and 10 | Explicit modern extension beyond the book for logs, metrics, traces, audits, service-level evidence, correlation, privacy, diagnostic decisions, and recovery-oriented telemetry |
| `references/adaptation/ai-agents.md` | Conceptual anchors in Chs. 1, 5-6, 8-10 | Explicit modern extension beyond the book for generative models, tool-using agents, probabilistic trust, authority, validation, agent control styles, evaluation, governed memory, and human escalation |
| `references/examples/course-registration.md` | Domain/use-case seed from Ch. 4, pp. 113-117; applies techniques from Chs. 2-9 | The book supplies the course-registration seed. The participant model, reservation/timeout behavior, review slice, and other design decisions are original to this skill; modern implementation mapping is an extension |
| `assets/crc-card-template.md` | CRC practices in Ch. 2 and responsibility/collaboration detail in Chs. 4-5 | Original reusable scaffold based on book-grounded fields |
| `assets/collaboration-story-template.md` | Chs. 5 and 7 | Original reusable scaffold based on book-grounded collaboration-story concerns |
| `assets/hot-spot-template.md` | Ch. 9 | Original reusable scaffold based on book-grounded variation analysis |
| `assets/rdd-design-template.md` | Chs. 2-10 | Original deliverable template synthesizing the full process |
| `assets/rdd-review-template.md` | Chs. 4-5, 8, and 10 | Original review-output template; its structure and any ratings are not from the book |
| `agents/openai.yaml` | None | Invocation metadata only; it is not RDD knowledge derived from the source |

## Book examples versus skill-created examples

The source includes examples and case studies such as the Speak for Me software, control-style refinement for MessageBuilder, reliable collaborations, flexibility mechanisms, a telecommunications integration framework, and an optimizing compiler. When a reference paraphrases one of these cases, it should cite its chapter/page location and identify it as a book example.

The course-registration example reuses the book's small domain/use-case seed from Chapter 4, pp. 113–117. Its system boundary, roles, reservations, timeout handling, contracts, review, implementation mapping, and other design decisions are skill-created. Task schemas, evidence ledgers, scoring rubric, record formats, and modern architecture examples are also skill-created. They illustrate the book's reasoning but must not be represented as designs, terminology, or prescriptions written by the authors.

## Rules for future maintenance

- Preserve the conceptual distinctions even when terminology is modernized: role is not realization, responsibility is not operation, collaboration is not arbitrary dependency, and contract is not signature alone.
- Add a printed/PDF page anchor when introducing a new claim represented as book-grounded.
- Label an inference as operational synthesis when it turns prose across chapters into a fixed procedure, threshold, score, or schema.
- Label guidance as a modern extension when it depends on post-book technologies or concerns, especially distributed protocol guarantees, cloud operations, contemporary security controls, telemetry platforms, or generative AI.
- Do not retroactively attribute modern examples, scoring systems, templates, or terminology to the authors.
- If a modern extension conflicts with a book-grounded principle, state the tension and preserve the source distinction rather than silently rewriting RDD.
