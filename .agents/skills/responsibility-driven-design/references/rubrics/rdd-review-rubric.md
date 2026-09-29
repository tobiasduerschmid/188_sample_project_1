# RDD review rubric

Use this rubric with [the review workflow](../tasks/review-design.md). It measures two different things:

1. **Design quality**: what the available evidence demonstrates about the design.
2. **Evidence coverage**: how completely and directly the artifacts support that judgment.

Never convert missing evidence into a design defect. Report both scores, the hard-gate states, and the findings that control the verdict.

## Quality rating scale

| Rating | Label | Meaning |
| ---: | --- | --- |
| **4** | Robust | Clear, coherent, traceable choices survive relevant scenario probes; important trade-offs and consequences are explicit; no material weakness is demonstrated. Requires evidence coverage of at least 3. |
| **3** | Sound | The design fulfills the criterion with minor or bounded weaknesses; representative scenarios work; remaining concerns do not undermine the dimension. |
| **2** | Mixed | Some choices work, but material ambiguity, inconsistency, coupling, or incomplete responsibility allocation creates credible risk. |
| **1** | Major weakness | Direct evidence shows a substantial problem affecting important responsibilities or scenarios, although a recognizable design exists. |
| **0** | Nonviable or absent | Direct evidence shows the criterion is absent, contradictory, or unable to support the required behavior. Do not use 0 merely because documentation is missing. |
| **NE** | Not evaluable | Evidence is too incomplete or conflicting to support a quality judgment. Exclude it from the quality denominator and reflect the gap in coverage and gates. |

## Evidence coverage scale

| Rating | Label | Meaning |
| ---: | --- | --- |
| **4** | Demonstrated | Multiple precise sources and relevant scenario probes establish normal and consequential non-normal behavior. |
| **3** | Direct | Primary design evidence directly covers the criterion and at least one representative scenario; some secondary detail may remain. |
| **2** | Partial | Evidence covers important parts but relies on inference, omits a material scenario, or does not connect static declarations to runtime behavior. |
| **1** | Claimed | The criterion is asserted or suggested by a fragment, naming convention, or diagram, but not traceably demonstrated. |
| **0** | Missing/conflicting | No usable evidence exists, or unresolved conflicts prevent reliance on it. |

Coverage describes confidence in assessment, not quality. A promising claim with coverage 1 can remain `NE`; a clearly bad trace can receive quality 0 or 1 with coverage 3 or 4.

## Weighted dimensions

| ID | Dimension | Weight | A rating of 4 demonstrates |
| --- | --- | ---: | --- |
| **D1** | Purpose, boundary, and system obligations | **12** | Actors, boundary, externally meaningful outcomes, core requirements, quality priorities, and whole-system responsibilities are distinct from design choices and traceable into the model. |
| **D2** | Roles and candidate model | **14** | Participants have clear purposes, role-level identities, justified stereotype blends, clients, and reasons to exist; candidates were not prematurely equated with classes or infrastructure. |
| **D3** | Responsibility ownership and coherence | **18** | Consequential knowing, doing, deciding, invariants, policy, and recovery obligations have coherent authoritative owners; shared work has explicit coordination; no important duplication or unowned responsibility remains. |
| **D4** | Collaborations, visibility, and reachability | **16** | Requests are intention-revealing, role-authorized, and appropriately grained; every sender can obtain its receiver; reference provenance, lifecycle, boundary cost, and aftereffects are credible; visibility is limited without dogmatic indirection. |
| **D5** | Control centers and neighborhoods | **12** | Important control centers, decisions, information sources, sequencing, completion, and failure owners are intelligible; centralized, clustered, delegated, or dispersed styles are intentional; natural boundaries are preserved. |
| **D6** | Trust, reliability, and contracts | **12** | Important trust regions and failure consequences have owners; conditions of use, externally relevant aftereffects, cleanup, recovery, timeout, consistency, and error reporting are proportionate and traceable. |
| **D7** | Change, variation, and design economy | **8** | Flexibility responds to characterized, valuable variation; stable cores and hot spots are explicit; hooks or patterns earn their complexity; relevant change probes preserve role coherence. |
| **D8** | Communication, implementation mapping, and validation | **8** | Collaboration stories use suitable views and honest precision; proposed versus implemented design is explicit; role-to-implementation mapping remains separate; representative traces, open questions, and stopping conditions are visible. |
|  | **Total** | **100** |  |

### Dimension-specific review prompts

#### D1 — Purpose, boundary, and system obligations

- Can the reviewer tell what the system owes actors without reading internal class names?
- Are requirements, assumptions, constraints, and decisions distinguished?
- Does every core scenario terminate in an externally meaningful outcome?

#### D2 — Roles and candidate model

- Does each participant have a purpose beyond hosting data or one method?
- Are roles replaceable responsibility bundles rather than implementation types?
- Are split, merged, deferred, and rejected candidates visible where consequential?

#### D3 — Responsibility ownership and coherence

- Does each important fact, decision, invariant, policy, and recovery action have one authoritative owner?
- Do responsibilities describe obligations rather than method lists?
- Is behavior located with the information or policy it governs?
- Are controllers surrounded by capable collaborators rather than passive records?

#### D4 — Collaborations, visibility, and reachability

- Does every request correspond to a responsibility advertised by its receiver?
- Are collaborations outcome-oriented rather than raw-data or accessor conversations?
- Can every collaboration occur at runtime, with plausible acquisition and lifetime?
- Are deep navigation, traffic hubs, chatty boundaries, primitive data flow, and hidden globals justified?

#### D5 — Control centers and neighborhoods

- Are initiating events, decisions, sequence, synchronization, and completion explicit?
- Is control style appropriate to decision complexity and knowledge location?
- Can major behavior and failure recovery be found, or is control excessively scattered?
- Do similar centers behave similarly only when their semantics support it?

#### D6 — Trust, reliability, and contracts

- Are expected failures distinguished from programming errors and exceptional conditions?
- Are preconditions, result guarantees, side effects, cleanup, retry, compensation, and reporting owned?
- **Modern extension:** across remote or untrusted boundaries, are timeout, duplication, ordering, idempotency, and partial failure addressed when relevant?

#### D7 — Change, variation, and design economy

- Is each variation mechanism tied to a credible change?
- Does the design avoid both speculative indirection and brittle hard-coding at known hot spots?
- Do patterns improve the responsibility distribution rather than substitute for reasoning?

#### D8 — Communication, implementation mapping, and validation

- Is each artifact suited to its purpose: responsibilities, topology, sequence, algorithms, exceptions, or adaptation?
- Does documentation avoid unsupported precision and mixed abstraction levels?
- Are scenario evidence, unresolved issues, and archival design rationale maintained?

## Scoring

### Weighted quality score

For dimensions with numeric quality ratings:

```text
quality_score =
  sum(weight_i * quality_rating_i / 4)
  ------------------------------------------------- * 100
  sum(weight_i for numerically rated dimensions)
```

Because the numerator already uses percentage weights, an equivalent calculation is `sum(weight × rating/4) / rated_weight × 100`.

Do not assign a numeric rating to an unevaluable dimension merely to complete the arithmetic. Report the **rated weight** next to the score. A quality score based on less than 60 rated weight cannot support approval.

### Weighted evidence coverage

All dimensions receive a 0–4 coverage rating:

```text
coverage_score = sum(weight_i * coverage_rating_i / 4)
```

Weights total 100, so the result is already a percentage.

### Confidence

Report overall confidence separately:

- **High**: coverage at least 85, no critical conflict, and core scenario evidence is corroborated.
- **Medium**: coverage 70–84 with no gate-blocking gap.
- **Low**: coverage below 70, material inference, or unresolved conflict.

Confidence does not change the design score. It changes how strongly the verdict can be stated.

## Hard gates

Rate every gate `PASS`, `FAIL`, or `NOT EVALUABLE`. A gate passes only with direct evidence; a plausible assertion is not enough.

| Gate | Approval condition | `FAIL` means | `NOT EVALUABLE` means |
| --- | --- | --- | --- |
| **G1 Core responsibility coverage** | Every core system responsibility has a coherent owner and completion condition. | Direct evidence shows a core responsibility is unowned, contradictory, or impossible to complete. | Core responsibilities, owners, or completion conditions are not documented well enough to judge. |
| **G2 Representative end-to-end trace** | At least one representative core scenario reaches an externally meaningful result without hand-waving. | A supplied trace demonstrably breaks, loops, contradicts roles, or cannot reach its result. | No sufficiently complete core trace exists. |
| **G3 Collaboration reachability** | Every consequential request in reviewed core traces has a credible receiver, reference path, and lifecycle. | A required sender demonstrably cannot reach its receiver or relies on a prohibited/contradictory route. | Static artifacts omit the runtime path or lifecycle. |
| **G4 Intelligible control and authority** | Major decisions, sequencing, control transfer, completion, and failure authority can be located. | Direct evidence shows conflicting controllers, uncontrolled sequencing, or decision making detached from required knowledge. | Control behavior or decision ownership is absent from the evidence. |
| **G5 Consequential failure and trust ownership** | For project-relevant high-consequence failures or trust boundaries, detection, containment, recovery/reporting, and externally relevant aftereffects have owners. | A demonstrated relevant failure leaves inconsistent state, duplicates authority, or has no responsible participant. | Relevant failure/trust behavior is claimed or omitted but not traceable. |
| **G6 Evidence integrity** | The reviewer has explicitly classified proposed, implemented, observed, inferred, and assumed elements, and no unresolved conflict controls the decision. The classification may come from the source or a labeled review assumption. | The review evidence directly contradicts a material design claim or misrepresents implementation status. | Sources conflict without a resolving authority, or unknown artifact status materially changes the decision. |
| **G7 Known blocker disposition** | No demonstrated blocker-class defect remains open. Unknown design quality is handled by G1-G6 and must not be treated as a hidden blocker here. | One or more demonstrated blocker defects remain open. | A demonstrated potential blocker exists, but conflicting status or resolution evidence prevents deciding whether it remains open. |

`NOT EVALUABLE` is not a softer failure. It blocks approval while preserving the crucial distinction between missing evidence and a demonstrated defect.

## Priority and confidence for findings

### Priority

| Priority | Use |
| --- | --- |
| **Blocker** | Prevents a core responsibility, violates a non-negotiable constraint, creates unacceptable integrity/safety exposure, or fails a hard gate. |
| **High** | Materially compromises a core scenario, authoritative ownership, control, boundary, recovery, or a stated quality priority. |
| **Medium** | Creates a bounded but important change, testability, clarity, or operational risk. |
| **Low** | Local weakness with limited consequence. |
| **Informational** | Strength, observation, or optional improvement. |

For evidence gaps, priority means the importance of the **decision blocked**, not the severity of an unproven defect.

### Finding confidence

- **High**: direct evidence and a scenario effect establish the claim.
- **Medium**: direct evidence exists but consequence or scope requires some inference.
- **Low**: indirect evidence suggests a concern; normally classify as a risk or evidence gap, not a defect.

## Verdicts

Apply gates first, then thresholds. Use judgment where the review decision defines a stricter bar, but never relax these minimums silently.

| Verdict | Minimum conditions |
| --- | --- |
| **Approved** | All gates pass; quality score at least 80; rated weight at least 85; coverage at least 80; no open blocker or high defect; residual risks are accepted or low. |
| **Approved with conditions** | All gates pass; quality score at least 70; rated weight at least 75; coverage at least 70; no blocker; any high issue has a bounded, owned condition and verification step. |
| **Revision required** | At least one gate fails, or sufficient evidence demonstrates material defects that prevent conditional approval. State which responsibilities must change; do not redesign without authorization. |
| **Reject current design** | Strong evidence demonstrates systemic failure across multiple core responsibilities or an unrecoverable conflict with non-negotiable constraints. Use sparingly; quality is ordinarily below 45 with multiple failed gates. |
| **Not assessable** | Any approval-critical gate is `NOT EVALUABLE`, rated weight is below 60, coverage is below 60, or unresolved evidence conflicts control the decision. List the minimum evidence needed to resume; do not infer quality from missing evidence. If direct evidence separately proves material defects, add **Known design disposition: revisions required** and list them so the reader does not mistake evidence collection for the only remaining work. |

An organization may impose a higher threshold. Record it before review. Never select a more favorable verdict by excluding a poorly evidenced dimension from the quality denominator; the coverage score, rated weight, and gates prevent that distortion.

## Precise finding schema

Every material finding uses the following fields:

| Field | Required | Content rule |
| --- | --- | --- |
| `id` | Yes | Stable identifier such as `RDD-001`. |
| `class` | Yes | `defect`, `risk`, `evidence-gap`, `conflict`, or `strength`. |
| `dimension` | Yes | Dimension ID and name. |
| `gate` | Yes | Gate ID affected, or `none`. |
| `priority` | Yes | `blocker`, `high`, `medium`, `low`, or `informational`. |
| `confidence` | Yes | `high`, `medium`, or `low`. |
| `status` | Yes | `open`, `accepted`, `deferred`, or `resolved`. |
| `claim` | Yes | One falsifiable sentence, no stronger than the evidence. |
| `criterion` | Yes | Responsibility-level expectation or explicit requirement. |
| `evidence[]` | Yes | Precise locator plus factual observation; include both sides of a conflict. |
| `scenario_effect` | Defect/risk/gap | Named trace or probe and the observed effect, credible exposure, or blocked conclusion. |
| `impact` | Yes | Concrete stakeholder, quality, change, or operational consequence. |
| `repair_direction` | Yes | Smallest responsibility allocation, collaboration, contract, evidence, or decision change. No unrequested replacement design. |
| `verification` | Yes | Bounded observable evidence needed to close the finding. |
| `authority_note` | Yes | Confirms review-only boundary or cites authorization for further work. |

### Finding validity rules

A **defect** is invalid unless it contains a direct observation, a violated criterion, and a demonstrated scenario or responsibility consequence.

An **evidence gap** is invalid unless it names the missing evidence and the review decision it blocks. It must not prescribe a design correction as though the defect were known.

A **risk** is invalid unless it names the condition under which the risk materializes and its consequence.

A **repair direction** is invalid when it only names a pattern or principle. “Use Strategy” is not actionable; “move fee-selection policy from CheckoutController to a replaceable FeePolicy role because the policy owns the relevant rules” is responsibility-level guidance.

A finding is not resolved by agreement alone. Resolution requires the stated verification evidence or an explicit risk acceptance by the appropriate owner.
