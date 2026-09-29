---
name: responsibility-driven-design
description: Design or review software systems using Responsibility-Driven Design (RDD), including roles, responsibilities, collaborations, CRC models, control style, trust boundaries, contracts, and explicit variation. Use for RDD/CRC design, responsibility assignment, design refinement, or an RDD-focused critique; do not use for generic code review or class diagramming without an RDD goal.
---

# Responsibility-Driven Design

Design software as a community of responsible participants. Start from stakeholder-visible behavior and system obligations; discover roles and candidates; assign coherent responsibilities; then test and refine the model through collaborations. Keep conceptual roles distinct from implementation constructs. Provisional code or prototypes may reveal design facts, but must remain labeled and revisable until the responsibility model stabilizes.

This skill is grounded in Rebecca Wirfs-Brock and Alan McKean's *Object Design: Roles, Responsibilities, and Collaborations*. Modern extensions are marked as such in the references.

## Non-negotiable RDD distinctions

- An **object** is a responsible design participant, not automatically a language instance, table, service, or class.
- A **role** is a replaceable slot defined by related responsibilities.
- A **candidate** is provisional and may be split, merged, renamed, or rejected.
- A **class or other implementation construct** is a later realization choice.
- A **responsibility** is an obligation to know, do, or decide; it is not a field, getter, endpoint, or method list.
- A **collaboration** is a request for another participant's help. It must have a reason, a reachable collaborator, and understood terms.
- A **contract** states client and provider obligations, including conditions of use and externally relevant aftereffects.

Never collapse these layers merely to make the answer look concrete. Prematurely treating a realization as settled can hide useful alternatives; keep exploratory concreteness labeled and revisable.

## Route the request

Read [references/index.md](references/index.md), then load only the routed material.

- To create a new design or substantially redesign a system, follow [references/tasks/design-system.md](references/tasks/design-system.md).
- To critique, score, or approve an existing design, follow [references/tasks/review-design.md](references/tasks/review-design.md).
- To explain or teach RDD without performing a full task, read the relevant foundations or practice reference selected by the index.
- For modules, services, distributed or offline operation, event-driven systems, workflows, observability, or AI agents, read the router in [references/adaptation/modern-systems.md](references/adaptation/modern-systems.md), then load only its matching adaptation children.

Use the templates in `assets/` when a durable or structured design artifact is useful. Adapt them to the problem; do not manufacture empty sections.

## Operating method

1. Establish purpose, actors, system boundary, important qualities, constraints, and available evidence. Preserve stakeholder intent outside the object model.
2. Identify whole-system responsibilities and representative scenarios before proposing internal participants.
3. Write a brief design story and derive consequential themes. Use them to search for both domain-facing concepts and execution machinery.
4. Form candidates with a name, purpose, stereotype blend, initial responsibilities, clients, and a reason to exist. Keep each explored candidate's disposition visible; preserve deferred and rejected alternatives when their rationale matters.
5. Assign responsibilities at the obligation level. Compare self-perform, partial collaboration, and full delegation; keep an explicit backlog of unassigned obligations and questions.
6. Organize participants into coherent neighborhoods. Design control centers and choose centralized, delegated, or dispersed control intentionally.
7. Simulate representative scenarios from an initiating event to an externally meaningful result. Record who receives each request, why, what they need to know, whom they ask, and how they can reach that collaborator.
8. Refine high-risk collaborations for trust, failure, recovery, and contracts. Characterize variation before adding hooks or patterns.
9. Stress the model with change, failure, timing, concurrency, lifecycle, and boundary cases proportional to project risk.
10. Map sufficiently tested roles to interfaces, classes, modules, components, services, functions, processes, workflows, or agents. When early code or a prototype preceded the model, treat it as evidence and feed its discoveries back into the conceptual design.

Treat this as an iterative clarification loop, not a waterfall. Move responsibilities, invent or discard participants, revisit requirements, and compare alternatives whenever a scenario exposes awkwardness.

## Evidence and uncertainty

- Separate requirements and observed facts from assumptions, design decisions, alternatives, and unresolved questions.
- Ask for clarification when system purpose, boundary, or a core scenario is genuinely missing. Otherwise proceed with labeled assumptions.
- Do not invent a flexibility, reliability, scale, security, or technology requirement merely to make the design sophisticated.
- **Operational synthesis:** classify design work by consequence (**core** versus the rest) separately from epistemic character (**routine**, **revealing**, or potentially **wicked**). The source discusses overlapping categories; this skill's two-axis normalization prevents them from being conflated.
- **Modern extension:** when risks warrant rigor beyond RDD, say which complementary practice is needed: formal specification, threat modeling, performance modeling, usability research, data modeling, or another domain-specific method.

## Design quality rules

- Keep behavior with the information and decisions it naturally governs.
- Give each consequential fact, invariant, policy, decision, relationship, and recovery action an authoritative owner.
- Prefer moderately intelligent collaborators over an all-knowing controller surrounded by passive records.
- Avoid duplicate ownership, validation, checking, or recovery unless explicit redundancy is required.
- Limit visibility and deep structural knowledge. A participant should know few, well-chosen collaborators.
- Preserve natural boundaries with narrow, purposeful collaboration paths.
- Use patterns only after naming the problem, forces, alternatives, and consequences. A pattern name is not a design argument.
- Add flexibility only for characterized, valuable variations. Show why the extra mechanism earns its complexity.
- Prefer consistent collaboration styles, but never force uniformity across materially different problems.

## Output contract

Lead with the design outcome or review verdict. Use the smallest set of artifacts that makes the reasoning inspectable. A full design normally includes:

- context, boundary, evidence, assumptions, and core risks;
- design story, themes, and system responsibilities;
- candidate disposition and neighborhood map;
- CRC model with roles, stereotypes, responsibilities, and collaborators;
- scenario collaboration stories and control-style decisions;
- trust boundaries, failure policies, and selected contracts;
- justified hot spots and variation mechanisms;
- implementation mapping kept separate from conceptual RDD;
- alternatives, trade-offs, unresolved items, validation, and next experiments.

A review must cite concrete design evidence, distinguish missing documentation from demonstrated design flaws, and give responsibility-level repairs. Do not merely recommend a pattern, principle, or rewrite.

## Completion standard

Do not call a design complete because the candidate list looks plausible. It is ready to advance only when:

- core responsibilities have owners;
- representative collaborations reach their goals without hand-waving;
- participants can obtain every needed collaborator;
- roles remain coherent under normal, exceptional, and relevant evidence-backed change scenarios;
- important boundaries, failure policies, and aftereffects are explicit;
- unresolved risks and intentionally deferred detail are visible;
- the selected level of precision matches the project's consequences.

For a revealing or wicked problem, use a bounded stopping condition: record the best current compromise, decisive evidence, residual cases, stakeholder acceptance needed, and revisit triggers. Never manufacture certainty.
