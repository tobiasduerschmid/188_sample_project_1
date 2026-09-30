import { describe, expect, it } from 'vitest';
import { evaluateAcademic } from '../src/assessment/academic';
import type {
  AcademicTarget,
  PlanInputs,
  Rule,
  SelectionFact,
  SelectionFacts,
} from '../src/domain/types';

const quarter = {
  id: 'q',
  name: 'Quarter',
  timezone: 'America/Los_Angeles',
  instructionStart: '2026-01-05',
  instructionEnd: '2026-03-13',
  examStart: '2026-03-16',
  examEnd: '2026-03-20',
};
function plan(): PlanInputs {
  return {
    schemaVersion: 1,
    id: 'p',
    name: 'Plan',
    quarterId: 'q',
    catalogRef: { quarterId: 'q', version: 'v1', digest: 'd' },
    selections: [],
    personalTimes: [],
    unitTarget: null,
    history: [],
    historyComplete: false,
    targets: [],
  };
}
function selection(id: string, extra: Partial<SelectionFact> = {}): SelectionFact {
  return {
    canonicalId: id,
    selections: [],
    course: {
      id,
      code: id,
      title: id,
      subject: 'TEST',
      description: id,
      units: [4],
      prerequisite: { kind: 'none' },
      corequisite: { kind: 'none' },
      requiredComponents: { lecture: 1 },
    },
    sections: [],
    complete: true,
    issues: [],
    inactive: false,
    units: 4,
    unitReason: null,
    prerequisite: { kind: 'none' },
    corequisite: { kind: 'none' },
    ...extra,
  };
}
function facts(extra: Partial<SelectionFacts> = {}): SelectionFacts {
  return {
    quarter,
    selections: [],
    history: [],
    targets: [],
    courseNames: { A: 'Course A', B: 'Course B', C: 'Course C' },
    ...extra,
  };
}
const course = (courseId: string): Rule => ({ kind: 'course', courseId });
const target = (kind: 'count' | 'units', threshold: number, ids = ['A', 'B']): AcademicTarget => ({
  id: 't',
  name: 'Target',
  kind,
  threshold,
  courseIds: ids,
});
const mapped = (
  id: string,
  status: 'completed' | 'not_completed' | 'in_progress',
  earnedUnits: number | null = 4,
) => ({
  canonicalId: id,
  records: [{ id: `history-${id}`, courseId: id, status, earnedUnits }],
  ambiguous: false,
});

describe('academic evidence', () => {
  it('distinguishes absent, incomplete, and completed history for prerequisites', () => {
    const p = plan();
    const f = facts({ selections: [selection('B', { prerequisite: course('A') })] });
    expect(evaluateAcademic(p, f).eligibility[0].prerequisite.status).toBe('unverified');
    p.historyComplete = true;
    expect(evaluateAcademic(p, f).eligibility[0].prerequisite.status).toBe('unmet');
    f.history = [mapped('A', 'in_progress')];
    expect(evaluateAcademic(p, f).eligibility[0].prerequisite.status).toBe('unmet');
    f.history = [mapped('A', 'completed')];
    expect(evaluateAcademic(p, f).eligibility[0].prerequisite.status).toBe('met');
  });
  it.each([
    ['all', 'completed', 'completed', 'met'],
    ['all', 'completed', 'not_completed', 'unmet'],
    ['all', 'completed', null, 'unverified'],
    ['all', 'not_completed', null, 'unmet'],
    ['all', null, null, 'unverified'],
    ['any', 'completed', null, 'met'],
    ['any', 'not_completed', null, 'unverified'],
    ['any', 'not_completed', 'not_completed', 'unmet'],
    ['any', null, null, 'unverified'],
  ] as const)('applies %s with %s and %s as %s', (kind, a, b, expected) => {
    const f = facts({
      selections: [selection('C', { prerequisite: { kind, rules: [course('A'), course('B')] } })],
      history: [...(a ? [mapped('A', a)] : []), ...(b ? [mapped('B', b)] : [])],
    });
    expect(evaluateAcademic(plan(), f).eligibility[0].prerequisite.status).toBe(expected);
  });
  it('prefers completed proof to concurrent proof while retaining unsupported branches', () => {
    const p = plan();
    const f = facts({
      selections: [
        selection('A'),
        selection('B', {
          corequisite: {
            kind: 'any',
            rules: [course('A'), { kind: 'manual', text: 'Instructor consent' }],
          },
        }),
      ],
    });
    expect(evaluateAcademic(p, f).eligibility[1].corequisite).toMatchObject({
      status: 'projected',
      conditions: expect.arrayContaining([expect.stringContaining('Instructor consent')]),
    });
    f.history = [mapped('A', 'completed')];
    expect(evaluateAcademic(p, f).eligibility[1].corequisite.status).toBe('met');
    f.history = [];
    f.selections[0].complete = false;
    expect(evaluateAcademic(p, f).eligibility[1].corequisite.status).toBe('unverified');
  });
  it('does not infer a favorable record from disagreeing alias history', () => {
    const f = facts({
      history: [
        {
          canonicalId: 'A',
          records: [
            ...mapped('A', 'completed').records,
            ...mapped('ALIAS', 'not_completed').records,
          ],
          ambiguous: true,
        },
      ],
      selections: [selection('B', { prerequisite: course('A') })],
    });
    const p = plan();
    p.historyComplete = true;
    const report = evaluateAcademic(p, f);
    expect(report.eligibility[0].prerequisite.status).toBe('unverified');
    expect(report.historyIssues.length).toBe(1);
  });
});

describe('selected units and target contributions', () => {
  it('sums decimal units exactly, counts incomplete drafts, and excludes an inactive course', () => {
    const p = plan();
    p.unitTarget = { min: 0.5, max: 3 };
    const report = evaluateAcademic(
      p,
      facts({
        selections: [
          selection('A', { units: 0.1, complete: false }),
          selection('B', { units: 0.2 }),
          selection('C', { units: 4, inactive: true }),
        ],
      }),
    );
    expect(report.units).toMatchObject({
      known: 0.3,
      range: 'below',
      excluded: [expect.stringContaining('Course C')],
    });
  });
  it('never classifies unresolved selected units against a target', () => {
    const p = plan();
    p.unitTarget = { min: 0, max: 10 };
    expect(
      evaluateAcademic(
        p,
        facts({ selections: [selection('A', { units: null, unitReason: 'Choose units' })] }),
      ).units,
    ).toMatchObject({ known: 0, range: 'incomplete' });
    p.unitTarget = null;
    expect(evaluateAcademic(p, facts()).units.range).toBe('unset');
  });
  it('includes completed work in projected contribution and excludes incomplete planned bundles', () => {
    const p = plan();
    p.historyComplete = true;
    const t = target('units', 8);
    const f = facts({
      targets: [{ target: t, canonicalIds: ['A', 'B'], unresolvedIds: [] }],
      history: [mapped('A', 'completed')],
      selections: [selection('B', { complete: false })],
    });
    expect(evaluateAcademic(p, f).targets[0]).toMatchObject({
      completed: 4,
      projected: 4,
      completedRemaining: 4,
      projectedRemaining: 4,
      status: 'not_met',
    });
    f.selections[0].complete = true;
    expect(evaluateAcademic(p, f).targets[0]).toMatchObject({
      completed: 4,
      projected: 8,
      projectedRemaining: 0,
      status: 'projected',
    });
  });
  it('retains unknown earned units on a retake instead of substituting planned units', () => {
    const p = plan();
    p.historyComplete = true;
    const t = target('units', 4, ['A']);
    const f = facts({
      targets: [{ target: t, canonicalIds: ['A'], unresolvedIds: [] }],
      history: [mapped('A', 'completed', null)],
      selections: [selection('A')],
    });
    expect(evaluateAcademic(p, f).targets[0]).toMatchObject({
      completed: 0,
      projected: 0,
      status: 'unverified',
      provisional: true,
    });
    f.targets[0].target = target('count', 1, ['A']);
    expect(evaluateAcademic(p, f).targets[0]).toMatchObject({
      completed: 1,
      projected: 1,
      status: 'completed',
    });
  });
  it('counts a complete variable-unit course without known units and gives known success precedence', () => {
    const t = target('count', 1, ['A']);
    const f = facts({
      targets: [{ target: t, canonicalIds: ['A'], unresolvedIds: [] }],
      selections: [selection('A', { units: null })],
      history: [
        { canonicalId: null, records: mapped('TRANSFER', 'completed').records, ambiguous: false },
      ],
    });
    expect(evaluateAcademic(plan(), f).targets[0]).toMatchObject({
      projected: 1,
      status: 'projected',
      provisional: false,
    });
    f.targets[0].target = target('units', 1, ['A']);
    expect(evaluateAcademic(plan(), f).targets[0].status).toBe('unverified');
  });
  it('allows independent reuse across targets and flags unmapped or removed evidence', () => {
    const p = plan();
    p.historyComplete = true;
    const t = target('count', 1, ['A']);
    const f = facts({
      history: [mapped('A', 'completed')],
      targets: [
        { target: t, canonicalIds: ['A'], unresolvedIds: [] },
        {
          target: { ...t, id: 't2', threshold: 2 },
          canonicalIds: ['A'],
          unresolvedIds: ['REMOVED'],
        },
      ],
    });
    const report = evaluateAcademic(p, f);
    expect(report.targets[0].completed).toBe(1);
    expect(report.targets[1]).toMatchObject({ completed: 1, projected: 1, status: 'unverified' });
  });
});

it('evaluates deeply nested supported rules without a call-stack limit', () => {
  let rule: Rule = { kind: 'course', courseId: 'A' };
  for (let i = 0; i < 5000; i++) rule = { kind: i % 2 === 0 ? 'all' : 'any', rules: [rule] };
  const f = facts({
    history: [mapped('A', 'completed')],
    selections: [selection('B', { prerequisite: rule })],
  });
  const result = evaluateAcademic(plan(), f).eligibility[0].prerequisite;
  expect(result.status).toBe('met');
  expect(result.conditions).toEqual(['Course A: completed in student-entered history.']);
});
