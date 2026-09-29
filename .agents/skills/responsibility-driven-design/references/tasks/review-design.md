# Review an RDD design

Use this procedure to critique, score, compare against an approval bar, or decide whether an existing design is ready to advance. Read the [RDD review rubric](../rubrics/rdd-review-rubric.md) before scoring. Load the practice reference behind each material finding rather than relying on a principle name alone.

## Review contract

The default authority is **review, not redesign**.

- Reconstruct the submitted design before judging it. Do not silently improve missing roles, responsibilities, collaborations, contracts, or scenarios and then review the improved version.
- Preserve the stated system purpose, boundary, requirements, quality priorities, technology constraints, and implementation status.
- Distinguish a conceptual RDD defect from a later implementation concern.
- Recommend the smallest responsibility-level repair direction that addresses a demonstrated issue. Do not replace the design, select a new architecture, rewrite artifacts, or implement changes unless the user explicitly authorizes that work.
- If the user asks for both review and redesign, finish the evidence-based review first. Mark the transition to redesign and keep the submitted design, findings, and proposed replacement separate.

Lead with the verdict and the facts that control it. A score is supporting evidence, not the verdict by itself.

## Finding classes

Use these classes consistently:

| Class | Meaning | What the reviewer may conclude |
| --- | --- | --- |
| **Defect** | Direct evidence shows the design cannot fulfill a responsibility, violates an explicit constraint, creates contradictory ownership, or fails a justified RDD criterion. | State the failed expectation, observed design behavior, consequence, and bounded repair direction. |
| **Risk** | The design can work, but evidence shows a plausible failure, change cost, coupling burden, or ambiguity whose consequence matters. | State likelihood conditions, impact, and what would reduce or accept the risk. |
| **Evidence gap** | Available artifacts do not establish whether a criterion is satisfied. | State exactly what is missing, which decision is blocked, and the smallest probe or artifact that would resolve it. Never call the unseen design defective. |
| **Conflict** | Two sources make incompatible claims about the design. | Cite both claims and identify the authority or experiment needed to resolve them. |
| **Strength** | Concrete evidence demonstrates an effective responsibility or collaboration choice. | State why it works and what future change should preserve. |

Absence of evidence is not evidence of bad design. A missing failure story is an evidence gap; a supplied failure trace with no owner for cleanup is a defect. A class diagram that omits runtime reference acquisition is an evidence gap; a sequence that requires a sender to reach an explicitly hidden participant without any route is a defect.

## Inputs and review framing

Before evaluating, record:

- review question and decision to be made;
- artifacts, versions, dates, and implementation status;
- stated system purpose, actors, boundary, core scenarios, requirements, and quality priorities;
- review scope and explicitly excluded concerns;
- whether the design is conceptual, proposed implementation, or observed implementation;
- authority granted: review only, review plus repair planning, or review plus redesign;
- material assumptions and which party owns their validation.

Ask for clarification only when a missing item prevents a meaningful decision. Otherwise continue with labeled assumptions and evidence gaps. If the artifacts conflict, do not choose the convenient interpretation silently.

Calibrate review depth:

- **Focused:** one question, slice, or concern. Evaluate only applicable dimensions and gates, run at least one representative probe, and use compact findings.
- **Standard:** default whole-design review using all applicable dimensions, representative normal and non-normal probes, weighted scoring, and every approval-critical gate.
- **Rigorous:** high-consequence or independently implemented design. Add corroborated evidence, systematic failure/trust probes, alternative hypotheses, contract checks, and explicit verification ownership.

The distinction between defect, risk, evidence gap, conflict, and strength is mandatory at every depth. Ceremony is not: do not build a full scorecard for a user who asked one narrow responsibility question unless a decision standard requires it.

## Evidence ledger

Give every consequential claim an evidence status:

| Status | Use |
| --- | --- |
| **Observed** | Explicitly present in a supplied artifact, code, trace, test, or stakeholder statement identified as authoritative. |
| **Corroborated** | Supported by more than one independent artifact or by an artifact plus a scenario probe. |
| **Inferred** | Reasonably reconstructed from indirect evidence; include the inference and alternatives. |
| **Claimed** | Asserted by the design but not demonstrated by a trace, contract, or implementation evidence. |
| **Missing** | Required to answer the review question but absent. |
| **Conflicting** | Sources disagree. |

Use precise locators: artifact name, section, role/card, diagram message, requirement ID, code symbol, test, or stakeholder decision. Avoid citations such as “the architecture document” without a location.

## Review workflow

### 1. Reconstruct the design as submitted

Build a neutral, compact model from the evidence. Mark each reconstructed element as observed, inferred, claimed, missing, or conflicting.

Capture:

1. system purpose, actors, boundary, and externally meaningful outcomes;
2. whole-system responsibilities and important quality obligations;
3. candidates or participants, purposes, roles, stereotype blends, and clients;
4. knowing, doing, and deciding responsibilities;
5. neighborhoods and their public collaboration paths;
6. control centers, initiating events, decisions, sequencing, and selected control styles;
7. collaborations, request intent, result or aftereffect, and reference acquisition/lifetime;
8. trust regions, failure policies, contracts, and authoritative owners;
9. characterized variations and mechanisms intended to support them;
10. conceptual-role to implementation mapping, kept visibly separate.

Do not invent an owner for an unassigned responsibility. Do not turn a class name into a role, a method into a responsibility, or a likely association into a demonstrated collaboration.

### 2. Create a responsibility ownership ledger

For every core obligation, record:

- source requirement or scenario;
- responsibility statement;
- authoritative owner;
- collaborators and why each is needed;
- evidence locator;
- duplicate, partial, conditional, or absent ownership;
- externally visible completion condition.

Use this ledger to detect actual gaps, conflicting owners, passive records, overloaded controllers, and artificial fragmentation. A responsibility can be shared only when the split and coordination obligations are explicit.

### 3. Reconstruct scenario traces

Trace representative scenarios from an intention-level event to an externally meaningful result. Do not start from a method merely because it appears in a diagram.

For every step, record:

| Trace field | Question |
| --- | --- |
| Event/request | What intention or condition advances the scenario? |
| Receiver | Which participant receives it? |
| Authorization | Which advertised responsibility makes that receiver appropriate? |
| Needed knowledge | What facts, policy, or state are required, and who owns them? |
| Action/delegation | What does the receiver do itself and what does it request? |
| Reachability | How can it obtain each collaborator, and for how long? |
| Contract/aftereffect | What must be true before and after the request? |
| Evidence | Where is this step demonstrated? |

Stop the trace where the evidence stops. Label the remaining path as an evidence gap instead of completing it from design intuition.

### 4. Run scenario probes

Choose probes according to consequence and uncertainty. At minimum, review one representative core scenario. Add probes where the design claims reliability, adaptability, concurrency, distribution, security, or unusual scale.

Useful probe families:

- **normal**: the representative path reaches its promised outcome;
- **alternate**: a legitimate branch uses different policy, data, or participant type;
- **boundary**: work crosses a neighborhood, process, deployment, trust, or external-system boundary;
- **failure**: a collaborator is unavailable, rejects a request, times out, or completes only partially;
- **change**: a stated requirement or characterized variation changes;
- **timing/concurrency**: events overlap, arrive late, duplicate, reorder, or outlive their initiator;
- **lifecycle**: participants are created, replaced, refreshed, disconnected, or disposed.

For each probe, state the hypothesis, initiating condition, expected outcome, reconstructed path, observed break or uncertainty, and review implication. Scenario probes are thought experiments over supplied evidence unless the user authorizes executable tests.

Do not manufacture hypothetical flexibility or reliability requirements. A change or failure probe must tie to a stated quality goal, a credible boundary, or a consequential project risk.

### 5. Inspect RDD quality by dimension

Apply the rubric dimension by dimension. Pay particular attention to:

- role clarity versus implementation naming;
- coherent and uniquely accountable responsibilities;
- decisions located with the knowledge that governs them;
- meaningful collaboration requests rather than raw-data plumbing;
- plausible reference acquisition and lifecycle;
- deliberate control style and intelligible control centers;
- natural neighborhood boundaries and restricted visibility;
- trust, failure, recovery, and aftereffect ownership;
- flexibility mechanisms justified by characterized variation;
- traceable design communication at an appropriate precision.

Classify a finding only after comparing the criterion, evidence, and scenario effect. Do not use “violates SOLID,” “breaks Law of Demeter,” “use Strategy,” or another label as a self-sufficient finding.

### 6. Rate quality and evidence separately

For every weighted dimension record:

- a **quality rating** from 0–4, or `NE` when available evidence cannot support any quality judgment;
- an **evidence coverage rating** from 0–4;
- evidence locators;
- material strengths, defects, risks, gaps, and conflicts;
- confidence in the quality rating.

Never assign quality `0` solely because evidence is missing. Use `NE` plus an evidence gap. Do not award quality `4` unless coverage is at least `3`. Calculate quality and coverage as defined in the rubric and evaluate every hard gate independently.

### 7. Form the verdict

Apply hard gates before score thresholds. A gate may be `PASS`, `FAIL`, or `NOT EVALUABLE`:

- `FAIL` requires direct evidence of a design failure.
- `NOT EVALUABLE` identifies a gate-blocking evidence gap.
- A high average cannot compensate for a failed gate.

Use the rubric's verdict definitions exactly. Determine the **approval verdict** separately from the disposition of already demonstrated problems. If approval is blocked by evidence, the verdict must say **Not assessable**, not **Revision required** or **Reject**. When direct evidence also proves material defects, add **Known design disposition: revisions required** and report those findings; do not imply that supplying the missing evidence alone could make the design approvable.

### 8. Write actionable findings

Each material finding must conform to this schema:

```yaml
id: RDD-###
class: defect | risk | evidence-gap | conflict | strength
dimension: <rubric dimension ID and name>
gate: <gate ID or none>
priority: blocker | high | medium | low | informational
confidence: high | medium | low
status: open | accepted | deferred | resolved
claim: <one-sentence conclusion>
criterion: <the responsibility-level expectation>
evidence:
  - locator: <artifact and precise location>
    observation: <what the source actually establishes>
scenario_effect: <scenario/probe and observed or blocked effect>
impact: <stakeholder, quality, change, or operational consequence>
repair_direction: <smallest responsibility-level change or decision needed>
verification: <specific trace, contract, artifact, test, or decision that would close the finding>
authority_note: <review-only boundary or authorization for further work>
```

Rules for the fields:

- `claim` must not be stronger than the evidence.
- For a defect, `criterion`, `evidence`, and `scenario_effect` must show a failed expectation.
- For an evidence gap, `repair_direction` names the missing evidence or decision, not an assumed design fix.
- For a conflict, cite both incompatible claims and identify the resolving authority.
- `impact` must explain why the issue matters; avoid generic “maintainability” assertions.
- `repair_direction` should relocate, clarify, split, merge, delegate, constrain, or assign a responsibility before naming any pattern.
- `verification` must be observable and bounded.
- Use one finding per independently resolvable issue. Link related findings rather than combining several causes.

For a Focused review, a compact table may combine fields, but every material issue must still preserve `id`, `class`, `claim`, precise `evidence`, consequence or blocked decision, bounded repair/evidence direction, and `verification`.

### 9. Prioritize without redesigning

Order follow-up work as:

1. gate-blocking evidence requests and conflicts;
2. blocker and high defects affecting core responsibilities;
3. high risks and systemic responsibility/collaboration issues;
4. bounded medium issues;
5. local clarity or polish.

Where several repairs are plausible, state the decision criteria and at most a small set of bounded options. Do not choose a new architecture or produce replacement CRC cards unless authorized.

## Output contract

Use [the RDD review template](../../assets/rdd-review-template.md) when a structured artifact is useful. A complete review includes:

1. approval verdict, any known design disposition, confidence, controlling gates, weighted quality score, and evidence coverage;
2. scope, authority, artifacts, exclusions, and assumptions;
3. neutral reconstruction of the submitted design;
4. responsibility ownership ledger and scenario traces;
5. scenario-probe results;
6. dimension ratings and hard-gate states;
7. concrete strengths worth preserving;
8. findings using the schema above;
9. evidence requests kept separate from design defects;
10. prioritized repairs or decisions and bounded verification steps;
11. residual risks and any need for complementary review methods.

For a narrow review, omit irrelevant sections but retain evidence status, finding class, and authority boundary.

## Stop conditions

Stop and return **Not assessable** when the decision depends on unavailable core requirements, an unknown system boundary, no reviewable design evidence, or unresolved artifact conflicts. State the minimum evidence needed to resume.

Stop at findings and repair directions when review-only authority was granted. Ask before producing a replacement design, editing source artifacts, implementing code, or making external changes.
