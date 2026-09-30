import type {
  AcademicReport,
  PlanInputs,
  Rule,
  RuleReport,
  SelectionFacts,
  TargetReport,
} from '../domain/types';

type Evidence = true | false | null;
type HistoryGroup = SelectionFacts['history'][number];

/** Add the finite decimal values supplied by the catalog without binary rounding drift. */
function decimalSum(values: number[]): number {
  const parts = values.map((value) => {
    const [mantissa, exponent = '0'] = value.toString().split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    const scale = fraction.length - Number(exponent);
    return { integer: BigInt(`${whole}${fraction}`), scale };
  });
  const scale = Math.max(0, ...parts.map((part) => part.scale));
  const sum = parts.reduce(
    (total, part) => total + part.integer * 10n ** BigInt(scale - part.scale),
    0n,
  );
  return Number(`${sum}e-${scale}`);
}
function remaining(threshold: number, contribution: number): number {
  return Math.max(0, decimalSum([threshold, -contribution]));
}

export function evaluateAcademic(plan: PlanInputs, facts: SelectionFacts): AcademicReport {
  const selections = new Map(facts.selections.map((fact) => [fact.canonicalId, fact]));
  const history = new Map(
    facts.history
      .filter((group) => group.canonicalId !== null)
      .map((group) => [group.canonicalId!, group]),
  );
  const label = (id: string) => facts.courseNames[id] ?? id;
  const historyIssues = facts.history.flatMap((group) =>
    group.canonicalId === null
      ? [
          `Unmapped or removed coursework: ${group.records.map((record) => record.courseId).join(', ')}. Manual resolution is required.`,
        ]
      : group.ambiguous
        ? [
            `${label(group.canonicalId)}: equivalent coursework records disagree; completion and earned units are unverified until resolved.`,
          ]
        : [],
  );
  const completion = (id: string): Evidence => {
    const group = history.get(id);
    if (group?.ambiguous) return null;
    if (group?.records.length) return group.records[0].status === 'completed';
    return plan.historyComplete ? false : null;
  };
  const evaluateRule = (
    rule: Rule,
    concurrent: boolean,
  ): { truth: Evidence; conditions: string[] } => {
    const pending: { rule: Rule; reduce: boolean }[] = [{ rule, reduce: false }];
    const active = new Set<Rule>();
    const truths: Evidence[] = [];
    const conditions: string[] = [];
    while (pending.length) {
      const frame = pending.pop()!;
      const current = frame.rule;
      if (frame.reduce && (current.kind === 'all' || current.kind === 'any')) {
        const children = truths.splice(truths.length - current.rules.length, current.rules.length);
        truths.push(
          current.kind === 'all'
            ? children.includes(false)
              ? false
              : children.includes(null)
                ? null
                : true
            : children.includes(true)
              ? true
              : children.includes(null)
                ? null
                : false,
        );
        active.delete(current);
      } else if (current.kind === 'none') {
        truths.push(true);
        conditions.push('The catalog explicitly specifies no requirement.');
      } else if (current.kind === 'unknown' || current.kind === 'manual') {
        truths.push(null);
        conditions.push(
          current.kind === 'manual'
            ? `Manual review required: ${current.text}`
            : `Unknown academic rule${current.text ? `: ${current.text}` : '.'}`,
        );
      } else if (current.kind === 'course') {
        const completed = completion(current.courseId);
        const planned = selections.get(current.courseId);
        const supportedPlan = concurrent && planned?.complete && !planned.inactive;
        truths.push(completed === true || supportedPlan ? true : completed);
        const reason =
          completed === true
            ? 'completed in student-entered history'
            : supportedPlan
              ? 'depends on completing the selected course this quarter'
              : history.get(current.courseId)?.ambiguous
                ? 'equivalent history records disagree'
                : completed === null
                  ? 'completion is unknown because no complete history evidence was supplied'
                  : 'not completed in student-entered history';
        conditions.push(`${label(current.courseId)}: ${reason}.`);
      } else if (
        (current.kind === 'all' || current.kind === 'any') &&
        current.rules.length > 0 &&
        !active.has(current)
      ) {
        active.add(current);
        pending.push({ rule: current, reduce: true });
        for (let index = current.rules.length - 1; index >= 0; index--)
          pending.push({ rule: current.rules[index], reduce: false });
      } else {
        truths.push(null);
        conditions.push('Invalid or cyclic academic rule; manual review required.');
      }
    }
    return { truth: truths[0] ?? null, conditions };
  };
  const ruleReport = (rule: Rule, concurrent: boolean): RuleReport => {
    const completed = evaluateRule(rule, false);
    const result = completed.truth === true || !concurrent ? completed : evaluateRule(rule, true);
    const status =
      result.truth === true
        ? completed.truth === true
          ? 'met'
          : 'projected'
        : result.truth === false
          ? 'unmet'
          : 'unverified';
    return {
      status,
      explanation: `${status === 'projected' ? 'Conditional on planned coursework; ' : ''}checked using student-entered history${plan.historyComplete ? ' declared complete' : ' not declared complete'}. This does not guarantee eligibility.`,
      conditions: result.conditions,
    };
  };

  const units: AcademicReport['units'] = { known: 0, unresolved: [], excluded: [], range: 'unset' };
  const knownUnits: number[] = [];
  for (const selection of facts.selections) {
    if (selection.inactive || !selection.course)
      units.excluded.push(
        `${label(selection.canonicalId)}: excluded because a course or selected section is removed or canceled.`,
      );
    else if (selection.units === null)
      units.unresolved.push(
        `${label(selection.canonicalId)}: ${selection.unitReason ?? 'selected units are unresolved'}.`,
      );
    else knownUnits.push(selection.units);
  }
  units.known = decimalSum(knownUnits);
  units.range =
    plan.unitTarget === null
      ? 'unset'
      : units.unresolved.length
        ? 'incomplete'
        : units.known < plan.unitTarget.min
          ? 'below'
          : units.known > plan.unitTarget.max
            ? 'above'
            : 'within';

  const targets = facts.targets.map(({ target, canonicalIds, unresolvedIds }): TargetReport => {
    const contributions: TargetReport['contributions'] = [];
    const issues = [
      ...historyIssues,
      ...unresolvedIds.map((id) => `${id}: eligible course is no longer resolved in this catalog.`),
    ];
    let uncertain = !plan.historyComplete || historyIssues.length > 0 || unresolvedIds.length > 0;
    if (!plan.historyComplete)
      issues.push(
        'History is not declared complete. Remaining work may change when history is completed.',
      );
    const ids = [...new Set(canonicalIds)];
    if (target.kind === 'count' && target.threshold > ids.length + new Set(unresolvedIds).size)
      issues.push(
        `The count threshold ${target.threshold} exceeds the ${ids.length + new Set(unresolvedIds).size} distinct eligible courses.`,
      );
    for (const id of ids) {
      const group: HistoryGroup | undefined = history.get(id);
      const selected = selections.get(id);
      let completed = 0;
      let projected = 0;
      let reason = '';
      if (group?.ambiguous) {
        uncertain = true;
        reason =
          'Equivalent coursework records disagree. No completion or units can be inferred until they are resolved.';
        issues.push(`${label(id)}: ${reason}`);
      } else if (group?.records[0]?.status === 'completed') {
        const earnedUnits = group.records[0].earnedUnits;
        if (target.kind === 'count') completed = projected = 1;
        else if (earnedUnits === null) {
          uncertain = true;
          issues.push(`${label(id)}: completed earned units are unknown.`);
        } else completed = projected = earnedUnits;
        reason =
          earnedUnits === null && target.kind === 'units'
            ? 'Completed work has unknown earned units; planned retake units cannot substitute for earned units.'
            : 'Completed coursework contributes once; a selected retake adds no credit.';
      } else if (selected) {
        if (!selected.course || selected.inactive)
          reason = 'No projected credit: a selected course or section is removed or canceled.';
        else if (!selected.complete)
          reason = `No projected credit: the section bundle is incomplete${selected.issues.length ? ` (${selected.issues.join('; ')})` : ''}.`;
        else if (target.kind === 'count') {
          projected = 1;
          reason =
            'Conditional projected course credit if planned coursework is completed; units are not required for this count.';
        } else if (selected.units === null) {
          uncertain = true;
          reason = 'No known unit contribution: selected units are unresolved.';
          issues.push(`${label(id)}: ${reason}`);
        } else {
          projected = selected.units;
          reason = 'Conditional projected units if planned coursework is completed.';
        }
        const warnings = selected.sections.flatMap((entry) =>
          entry.section && entry.section.availability !== 'open'
            ? [`${entry.section.label}: ${entry.section.availability} availability`]
            : [],
        );
        if (warnings.length) reason += ` ${warnings.join('; ')}. No seat is reserved.`;
      } else if (group?.records[0]?.status === 'in_progress')
        reason =
          'In-progress coursework outside this selected plan contributes no projected credit.';
      else reason = 'No completed or eligible selected coursework contributes.';
      contributions.push({ courseId: id, label: label(id), completed, projected, reason });
    }
    const completed = decimalSum(contributions.map((item) => item.completed));
    const projected = decimalSum(contributions.map((item) => item.projected));
    const status =
      completed >= target.threshold
        ? 'completed'
        : projected >= target.threshold
          ? 'projected'
          : uncertain
            ? 'unverified'
            : 'not_met';
    return {
      id: target.id,
      name: target.name,
      kind: target.kind,
      threshold: target.threshold,
      completed,
      projected,
      completedRemaining: remaining(target.threshold, completed),
      projectedRemaining: remaining(target.threshold, projected),
      status,
      provisional: status === 'unverified',
      contributions,
      issues,
    };
  });
  return {
    eligibility: facts.selections.map((selection) => ({
      courseId: selection.canonicalId,
      label: label(selection.canonicalId),
      prerequisite: ruleReport(selection.prerequisite, false),
      corequisite: ruleReport(selection.corequisite, true),
    })),
    units,
    targets,
    historyIssues,
  };
}
