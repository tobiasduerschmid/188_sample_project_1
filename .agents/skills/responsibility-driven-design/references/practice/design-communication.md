# Describing RDD designs

## Collaboration stories

A collaboration story explains how responsible participants collectively fulfill an obligation. Early stories may be rough and evocative; permanent stories should be accurate, purposeful, and audience-specific.

No single view captures roles, topology, sequence, rationale, exceptions, adaptation, and implementation. Choose representations based on what the reader must understand.

## Story-development protocol

1. Name the audience and the decision or understanding the story must support.
2. Set scope, depth, precision, formality, and tone.
3. List what must be covered and what is intentionally excluded.
4. Select the view and representation.
5. Tell, draw, and explain; do not expect a diagram to carry all semantics.
6. Organize for the reader rather than preserving discovery order.
7. Revise for accuracy and comprehension; add depth only where it changes understanding.

## View selection

| View | Use it for | Usually omit |
| --- | --- | --- |
| Bird's-eye subsystem view | Architecture, neighborhoods, dependencies, public roles | Message-level sequence |
| Participants-only view | Candidate roles and potential collaboration topology | Timing and detailed requests |
| Interaction view | Temporal order or numbered message paths | Internal algorithms and full rationale |
| In-depth interaction | Guards, branches, iteration, timing, creation, destruction, asynchronous work | Unrelated participants |
| Focused interaction | One hard neighborhood while black-boxing UI or infrastructure | Internals outside the learning goal |
| Implementation view | Accurate current code or deployment relationships | Speculative design presented as fact |
| Adaptation view | Current behavior, hot spots, hooks, and extension recipe | Irrelevant fixed internals |
| Generalized collaboration | Reusable roles and how concrete realizations fill them | One-off incidental details |

Sequence diagrams emphasize temporal order. Collaboration/communication diagrams emphasize topology and relationships. Class or component diagrams emphasize static structure. Use prose, decision tables, state machines, pseudocode, code, examples, or storyboards when they express the behavior better.

## Limits of UML and diagrams

An interaction diagram rarely explains:

- why a decision is made;
- important invariants or side effects;
- semantic importance of one request over another;
- the full algorithm;
- failure policy and recovery ownership;
- omitted participants or unknown details.

Every arrow receives similar visual weight, so critical behavior can disappear. Pair diagrams with a short narrative that states purpose, decision rules, aftereffects, and exclusions.

Do not add a return, signature, guard, or timing fact merely because the notation permits it. Unsupported precision is misinformation.

## Accuracy and density

- **Do not overdraw**: show representative cases and explain differences.
- **Do not overstate**: mark proposed, inferred, implemented, and unknown elements distinctly.
- **Omit needless detail**: primitive operations, caching, lazy initialization, standard-library calls, and preexisting component internals belong only when they affect the story.
- **Do not be breezy**: if a hard issue affects the design, explain it instead of hiding it behind a sketch.
- **One abstraction level per view**: do not mix business outcomes with loop mechanics unless the contrast is the point.
- **One point of view per artifact**: tell the reader whose behavior and concern are being shown.

**Local presentation heuristic:** a single interaction view often becomes difficult beyond roughly ten participants, twenty-five messages, or significant branching. These are not book rules or validity limits. Split a necessary larger story into overview and focused sub-stories rather than deleting essential behavior.

## Progressive realization

Use a layered narrative:

1. problem facts, actors, constraints, and promised outcome;
2. participants, purposes, and responsibilities;
3. normal collaboration;
4. control decisions and key contracts;
5. exceptional paths;
6. alternatives, variation, and implementation detail.

State the important conclusion early and link to supporting detail. If several diagrams differ only in one branch, name the difference rather than asking the reader to find it.

## Collaboration story record

For a permanent story include:

- story ID, name, status, audience, and purpose;
- source scenario or system responsibility;
- starting event, preconditions, and completion condition;
- participants and roles;
- numbered requests with sender, receiver, invoked responsibility, information, and result;
- control center and style;
- boundary crossings and contracts;
- important state changes and aftereffects;
- exceptional variants or links to separate stories;
- design rationale, rejected alternative, and unresolved questions;
- implementation status and last validation date when applicable.

Use `assets/collaboration-story-template.md` as a starting form.

## Proposed versus implemented

Label artifacts explicitly:

- **proposed**: intended design not yet validated in implementation;
- **observed**: reconstructed from code or runtime evidence;
- **implemented**: a proposed design verified as the current implementation;
- **hybrid**: current implementation plus planned change;
- **conceptual**: omits realization details intentionally.

Never title a reconstructed class diagram "the design" without stating evidence and omissions.

## Exceptional and variation stories

Keep the happy path readable. Show one or two important exceptions in a focused story; use a policy table for families handled alike. An exception signal without a handler and resulting state is incomplete.

For variation, show:

- hot spot and fixed context;
- shared role or contract;
- current concrete cases;
- selection or configuration owner;
- hook/factory/adapter path;
- recipe and verification.

Use `assets/hot-spot-template.md` when the variation decision, lifecycle, or extension contract needs a durable record.

## Preservation

Working sketches are disposable. Preserve stories that retain value beyond code:

- load-bearing collaboration and control rationale;
- boundary and trust assumptions;
- failure handling and recovery policy;
- variation points and extension recipes;
- non-obvious constraints or rejected alternatives.

Update an archival story when responsibilities move, central participants or contracts change, or the scenario outcome changes. Do not force it to mirror every signature edit.

## Communication review

- Is audience and purpose explicit?
- Is status proposed, conceptual, observed, implemented, or hybrid?
- Does precision reflect evidence?
- Is the representation appropriate to topology, sequence, algorithm, failure, or adaptation?
- Are responsibility and invoked service traceable?
- Is one abstraction level maintained?
- Are important omissions and black boxes stated?
- Are rationale and aftereffects visible where diagrams cannot express them?
- Can a new implementer or reviewer follow the story without guessing?
- Is the artifact valuable enough to maintain?
