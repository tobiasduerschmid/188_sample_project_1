import { describe, expect, it } from 'vitest';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { makeFixture } from '../src/fixtures/catalog';
import {
  adoptCatalog,
  copyPlan,
  createPlan,
  editPlan,
  restorePlan,
  restoreRemoval,
} from '../src/domain/plan';
import type { CatalogEnvelope, PlanInputs, PlanCommand, Result } from '../src/domain/types';

function value<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.value;
}
function catalog(envelope: CatalogEnvelope = makeFixture()): CatalogSnapshot {
  return new CatalogSnapshot(envelope, {
    quarterId: envelope.quarter.id,
    version: envelope.version,
    digest: envelope.version,
  });
}
function edit(plan: PlanInputs, c: CatalogSnapshot, command: PlanCommand): PlanInputs {
  return value(editPlan(plan, command, c)).plan;
}

describe('immutable plan edits', () => {
  it('validates trimmed names and leaves invalid rename unchanged', () => {
    const c = catalog();
    const p = value(createPlan('  Winter choice  ', c, 'p'));
    expect(p.name).toBe('Winter choice');
    expect(p.unitTarget).toBeNull();
    expect(createPlan(' ', c).ok).toBe(false);
    expect(createPlan('a'.repeat(81), c).ok).toBe(false);
    expect(editPlan(p, { type: 'rename', name: ' ' }, c).ok).toBe(false);
    expect(p.name).toBe('Winter choice');
  });
  it('adds aliases as a no-op focus and retains incomplete course drafts', () => {
    const envelope = makeFixture();
    envelope.courses.push({
      ...envelope.courses[1],
      id: 'ALIAS',
      code: 'OTHER101',
      canonicalId: 'TEST101',
    });
    const c = catalog(envelope);
    const p = edit(value(createPlan('Plan', c)), c, { type: 'addCourse', courseId: 'TEST101' });
    const result = value(editPlan(p, { type: 'addCourse', courseId: 'OTHER101' }, c));
    expect(result.plan).toBe(p);
    expect(result.focusCourseId).toBe('TEST101');
    expect(p.selections).toHaveLength(1);
    expect(p.selections[0].sectionIds).toEqual([]);
  });
  it('rejects incompatible explicit additions but preserves old labs when replacing a lecture', () => {
    const c = catalog();
    let p = edit(value(createPlan('Plan', c)), c, { type: 'addCourse', courseId: 'TEST101' });
    p = edit(p, c, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-A' });
    expect(
      editPlan(p, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-B1' }, c).ok,
    ).toBe(false);
    p = edit(p, c, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-A1' });
    const previous = p;
    p = edit(p, c, {
      type: 'setSection',
      courseId: 'TEST101',
      sectionId: 'TEST101-B',
      replaceId: 'TEST101-A',
    });
    expect(p.selections[0].sectionIds).toEqual(['TEST101-B', 'TEST101-A1']);
    expect(previous.selections[0].sectionIds).toEqual(['TEST101-A', 'TEST101-A1']);
    expect(c.facts(p).selections[0].complete).toBe(false);
    p = edit(p, c, {
      type: 'setSection',
      courseId: 'TEST101',
      sectionId: 'TEST101-B1',
      replaceId: 'TEST101-A1',
    });
    expect(c.facts(p).selections[0].complete).toBe(true);
  });
  it('requires permitted variable units but does not restrict catalog values to half units', () => {
    const e = makeFixture();
    e.courses[1].units = [0.1, 0.2, 1.25];
    const c = catalog(e);
    let p = edit(value(createPlan('Plan', c)), c, { type: 'addCourse', courseId: 'TEST101' });
    expect(p.selections[0].units).toBeNull();
    expect(editPlan(p, { type: 'setUnits', courseId: 'TEST101', units: 0.5 }, c).ok).toBe(false);
    p = edit(p, c, { type: 'setUnits', courseId: 'TEST101', units: 1.25 });
    expect(p.selections[0].units).toBe(1.25);
    expect(editPlan(p, { type: 'setUnitTarget', target: { min: 1.25, max: 10 } }, c).ok).toBe(
      false,
    );
    p = edit(p, c, { type: 'setUnitTarget', target: { min: 1.5, max: 10 } });
    p = edit(p, c, { type: 'setUnitTarget', target: null });
    expect(p.unitTarget).toBeNull();
    expect(p.selections[0].units).toBe(1.25);
  });
  it('rejects canceled new sections and preserves a previous personal interval on invalid edit', () => {
    const e = makeFixture();
    e.sections[0].availability = 'canceled';
    const c = catalog(e);
    let p = edit(value(createPlan('Plan', c)), c, { type: 'addCourse', courseId: 'TEST101' });
    expect(
      editPlan(p, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-A' }, c).ok,
    ).toBe(false);
    const time = {
      id: 'busy',
      label: '',
      meeting: {
        id: 'busy-time',
        kind: 'once' as const,
        start: '2026-01-09T09:00',
        end: '2026-01-09T10:00',
      },
    };
    p = edit(p, c, { type: 'upsertPersonalTime', value: time });
    expect(
      editPlan(
        p,
        {
          type: 'upsertPersonalTime',
          value: { ...time, meeting: { ...time.meeting, end: '2026-01-09T08:00' } },
        },
        c,
      ).ok,
    ).toBe(false);
    expect(p.personalTimes[0].meeting).toEqual(time.meeting);
  });
  it('captures complete removals, restores them, and copies inputs independently', () => {
    const c = catalog();
    let p = edit(value(createPlan('Plan', c, 'p')), c, { type: 'addCourse', courseId: 'TEST101' });
    p = edit(p, c, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-A' });
    const removed = value(editPlan(p, { type: 'removeCourse', courseId: 'TEST101' }, c));
    expect(removed.plan.selections).toHaveLength(0);
    expect(value(restoreRemoval(removed.plan, removed.removed!, c)).plan.selections).toEqual(
      p.selections,
    );
    const copied = value(copyPlan(p, 'Alternative', 'copy'));
    expect(copied.id).toBe('copy');
    const changed = edit(copied, c, {
      type: 'removeSection',
      courseId: 'TEST101',
      sectionId: 'TEST101-A',
    });
    expect(changed.selections[0].sectionIds).toEqual([]);
    expect(p.selections[0].sectionIds).toEqual(['TEST101-A']);
  });
  it('enforces the distinct course limit without changing existing inputs', () => {
    const e = makeFixture();
    e.courses = Array.from({ length: 41 }, (_, index) => ({
      ...e.courses[1],
      id: `C${index}`,
      code: `C${index}`,
    }));
    e.sections = [];
    const c = catalog(e);
    let p = value(createPlan('Large', c));
    for (let index = 0; index < 40; index++)
      p = edit(p, c, { type: 'addCourse', courseId: `C${index}` });
    const result = editPlan(p, { type: 'addCourse', courseId: 'C40' }, c);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].message).toContain('40');
    expect(p.selections).toHaveLength(40);
  });
});

describe('history, targets, and catalog adoption', () => {
  it('preserves the explicitly selected alias identity when a later catalog changes its equivalence', () => {
    const envelope = makeFixture();
    envelope.courses.push({
      ...envelope.courses[1],
      id: 'ALIAS',
      code: 'OTHER101',
      canonicalId: 'TEST101',
    });
    const old = catalog(envelope);
    const plan = edit(value(createPlan('Alias choice', old)), old, {
      type: 'addCourse',
      courseId: 'OTHER101',
    });
    expect(plan.selections[0].courseId).toBe('ALIAS');
    envelope.version = 'alias-changed';
    envelope.courses.find((course) => course.id === 'ALIAS')!.canonicalId = 'TEST104';
    const updated = catalog(envelope);
    const adopted = value(adoptCatalog(plan, old, updated)).plan;
    expect(adopted.selections[0].courseId).toBe('ALIAS');
    expect(updated.facts(adopted).selections[0].canonicalId).toBe('TEST104');
  });
  it('rejects duplicate canonical history and invalid earned units while preserving unmapped records', () => {
    const e = makeFixture();
    e.courses.push({ ...e.courses[1], id: 'ALIAS', code: 'OTHER101', canonicalId: 'TEST101' });
    const c = catalog(e);
    let p = value(createPlan('Plan', c));
    p = edit(p, c, {
      type: 'upsertHistory',
      value: { id: 'h', courseId: 'TEST101', status: 'completed', earnedUnits: 4 },
    });
    expect(
      editPlan(
        p,
        {
          type: 'upsertHistory',
          value: { id: 'h2', courseId: 'OTHER101', status: 'completed', earnedUnits: 4 },
        },
        c,
      ).ok,
    ).toBe(false);
    expect(
      editPlan(
        p,
        {
          type: 'upsertHistory',
          value: { id: 'h', courseId: 'TEST101', status: 'completed', earnedUnits: 4.25 },
        },
        c,
      ).ok,
    ).toBe(false);
    p = edit(p, c, {
      type: 'upsertHistory',
      value: {
        id: 'transfer',
        courseId: 'Unknown transfer code',
        status: 'completed',
        earnedUnits: null,
      },
    });
    expect(p.history[1].courseId).toBe('Unknown transfer code');
  });
  it('validates targets yet permits a count threshold larger than the eligible set', () => {
    const c = catalog();
    let p = value(createPlan('Plan', c));
    const t = {
      id: 't',
      name: ' Core ',
      kind: 'count' as const,
      threshold: 3,
      courseIds: ['TEST101'],
    };
    const changed = value(editPlan(p, { type: 'upsertTarget', value: t }, c));
    p = changed.plan;
    expect(p.targets[0].name).toBe('Core');
    expect(changed.warnings.length).toBeGreaterThan(0);
    expect(
      editPlan(p, { type: 'upsertTarget', value: { ...t, id: 't2', name: 'CORE' } }, c).ok,
    ).toBe(false);
    expect(
      editPlan(
        p,
        { type: 'upsertTarget', value: { ...t, id: 't2', name: 'New', courseIds: ['unknown'] } },
        c,
      ).ok,
    ).toBe(false);
    expect(editPlan(p, { type: 'upsertTarget', value: { ...t, courseIds: [] } }, c).ok).toBe(false);
  });
  it('adopts new facts without discarding removed choices, invalid units, history, or target members', () => {
    const old = catalog();
    let p = edit(value(createPlan('Plan', old)), old, { type: 'addCourse', courseId: 'TEST101' });
    p = edit(p, old, { type: 'setSection', courseId: 'TEST101', sectionId: 'TEST101-A' });
    p = edit(p, old, {
      type: 'upsertHistory',
      value: { id: 'h', courseId: 'TEST001', status: 'completed', earnedUnits: 4 },
    });
    p = edit(p, old, {
      type: 'upsertTarget',
      value: { id: 't', name: 'History', kind: 'count', threshold: 1, courseIds: ['TEST001'] },
    });
    const e = makeFixture();
    e.version = 'v2';
    e.sections = e.sections.filter((section) => section.id !== 'TEST101-A');
    e.courses = e.courses.filter((course) => course.id !== 'TEST001');
    e.courses.find((course) => course.id === 'TEST101')!.units = [5];
    const updated = catalog(e);
    const adopted = value(adoptCatalog(p, old, updated)).plan;
    expect(adopted.catalogRef.version).toBe('v2');
    expect(adopted.selections[0].sectionIds).toEqual(['TEST101-A']);
    expect(adopted.selections[0].units).toBe(4);
    expect(
      adopted.selections[0].lastKnown?.sections.some((section) => section.id === 'TEST101-A'),
    ).toBe(true);
    expect(adopted.history).toEqual(p.history);
    expect(adopted.targets).toEqual(p.targets);
    expect(p.catalogRef.version).toBe('fixture-v1');
    expect(restorePlan(JSON.parse(JSON.stringify(adopted))).ok).toBe(true);
    expect(adoptCatalog(p, updated, old).ok).toBe(false);
  });
  it('rejects corrupted restored inputs without rejecting unresolved identities', () => {
    const c = catalog();
    const p = value(createPlan('Plan', c));
    expect(restorePlan({ ...p, schemaVersion: 9 }).ok).toBe(false);
    expect(restorePlan({ ...p, historyComplete: 'yes' }).ok).toBe(false);
    expect(restorePlan({ ...p, unitTarget: { min: 5, max: 2 } }).ok).toBe(false);
    expect(
      restorePlan({
        ...p,
        selections: [{ courseId: 'REMOVED', sectionIds: ['REMOVED-A'], units: 4, lastKnown: null }],
      }).ok,
    ).toBe(true);
    expect(
      restorePlan({
        ...p,
        selections: [{ courseId: 'REMOVED', sectionIds: ['A', 'A'], units: 4, lastKnown: null }],
      }).ok,
    ).toBe(false);
  });
});

describe('capacity and collision recovery', () => {
  it('permits explicitly aligning existing alias-collision history but rejects a third record', () => {
    const e = makeFixture();
    e.courses.push({ ...e.courses[1], id: 'OTHER', code: 'OTHER' });
    const old = catalog(e);
    let p = value(createPlan('Plan', old));
    p = edit(p, old, {
      type: 'upsertHistory',
      value: { id: 'a', courseId: 'TEST101', status: 'completed', earnedUnits: 4 },
    });
    p = edit(p, old, {
      type: 'upsertHistory',
      value: { id: 'b', courseId: 'OTHER', status: 'not_completed', earnedUnits: null },
    });
    e.version = 'merged';
    e.courses.find((course) => course.id === 'OTHER')!.canonicalId = 'TEST101';
    const merged = catalog(e);
    p = value(adoptCatalog(p, old, merged)).plan;
    expect(merged.facts(p).history[0].ambiguous).toBe(true);
    p = edit(p, merged, {
      type: 'upsertHistory',
      value: { id: 'b', courseId: 'OTHER', status: 'completed', earnedUnits: 4 },
    });
    expect(merged.facts(p).history[0].ambiguous).toBe(false);
    expect(p.history).toHaveLength(2);
    expect(
      editPlan(
        p,
        {
          type: 'upsertHistory',
          value: { id: 'c', courseId: 'OTHER', status: 'completed', earnedUnits: 4 },
        },
        merged,
      ).ok,
    ).toBe(false);
  });
  it('allows 40 effective courses after adoption retains two originals in one canonical group', () => {
    const e = makeFixture();
    e.courses = Array.from({ length: 41 }, (_, i) => ({
      ...e.courses[1],
      id: `C${i}`,
      code: `C${i}`,
    }));
    e.sections = [];
    const old = catalog(e);
    let p = value(createPlan('Plan', old));
    for (let i = 0; i < 40; i++) p = edit(p, old, { type: 'addCourse', courseId: `C${i}` });
    e.version = 'merged';
    e.courses[1].canonicalId = 'C0';
    const updated = catalog(e);
    p = value(adoptCatalog(p, old, updated)).plan;
    p = edit(p, updated, { type: 'addCourse', courseId: 'C40' });
    expect(p.selections).toHaveLength(41);
    expect(updated.facts(p).selections).toHaveLength(40);
  });
  it.each([
    [
      'personal intervals',
      'personal_capacity',
      (p: PlanInputs) => ({
        ...p,
        personalTimes: Array.from({ length: 100 }, (_, i) => ({
          id: `p${i}`,
          label: '',
          meeting: {
            id: `m${i}`,
            kind: 'once' as const,
            start: '2026-01-09T09:00',
            end: '2026-01-09T10:00',
          },
        })),
      }),
      {
        type: 'upsertPersonalTime',
        value: {
          id: 'extra',
          label: '',
          meeting: {
            id: 'extra',
            kind: 'once',
            start: '2026-01-09T09:00',
            end: '2026-01-09T10:00',
          },
        },
      },
    ],
    [
      'history',
      'history_capacity',
      (p: PlanInputs) => ({
        ...p,
        history: Array.from({ length: 200 }, (_, i) => ({
          id: `h${i}`,
          courseId: `TRANSFER${i}`,
          status: 'completed' as const,
          earnedUnits: null,
        })),
      }),
      {
        type: 'upsertHistory',
        value: { id: 'extra', courseId: 'Extra transfer', status: 'completed', earnedUnits: null },
      },
    ],
    [
      'targets',
      'target_capacity',
      (p: PlanInputs) => ({
        ...p,
        targets: Array.from({ length: 50 }, (_, i) => ({
          id: `t${i}`,
          name: `Target ${i}`,
          kind: 'count' as const,
          threshold: 1,
          courseIds: ['TEST101'],
        })),
      }),
      {
        type: 'upsertTarget',
        value: { id: 'extra', name: 'Extra', kind: 'count', threshold: 1, courseIds: ['TEST101'] },
      },
    ],
  ] as const)(
    'preserves %s at capacity with a specific failure',
    (_name, code, populate, command) => {
      const c = catalog();
      const p = value(restorePlan(populate(value(createPlan('Plan', c)))));
      expect(editPlan(p, command as PlanCommand, c)).toMatchObject({
        ok: false,
        errors: [{ code }],
      });
      expect(restorePlan(p).ok).toBe(true);
    },
  );
  it('rejects a 201st component without changing the 200 accepted components', () => {
    const e = makeFixture();
    e.courses[1].requiredComponents = { lecture: 201 };
    e.sections = Array.from({ length: 201 }, (_, i) => ({
      ...e.sections[0],
      id: `S${i}`,
      compatibleWith: null,
    }));
    const c = catalog(e);
    const p = value(
      restorePlan({
        ...value(createPlan('Plan', c)),
        selections: [
          {
            courseId: 'TEST101',
            sectionIds: Array.from({ length: 200 }, (_, i) => `S${i}`),
            units: 4,
            lastKnown: null,
          },
        ],
      }),
    );
    expect(
      editPlan(p, { type: 'setSection', courseId: 'TEST101', sectionId: 'S200' }, c),
    ).toMatchObject({ ok: false, errors: [{ code: 'component_capacity' }] });
    expect(p.selections[0].sectionIds).toHaveLength(200);
  });
});

it('binds recognized entered course codes to stable history and target identities', () => {
  const e = makeFixture();
  e.courses[0].code = 'INTRO 001';
  const old = catalog(e);
  let p = value(createPlan('Plan', old));
  p = edit(p, old, {
    type: 'upsertHistory',
    value: { id: 'h', courseId: 'INTRO 001', status: 'completed', earnedUnits: 4 },
  });
  p = edit(p, old, {
    type: 'upsertTarget',
    value: { id: 't', name: 'Intro', kind: 'count', threshold: 1, courseIds: ['INTRO 001'] },
  });
  e.version = 'new-code';
  e.courses[0].code = 'RENAMED INTRO';
  const updated = catalog(e);
  p = value(adoptCatalog(p, old, updated)).plan;
  expect(updated.facts(p).history[0].canonicalId).toBe('TEST001');
  expect(updated.facts(p).targets[0].canonicalIds).toEqual(['TEST001']);
});

it('restores and edits deeply nested retained course rules without inventing a depth cap', () => {
  const c = catalog();
  const p = value(createPlan('Plan', c));
  const course = { ...c.envelope.courses[1] };
  let rule = course.prerequisite;
  for (let i = 0; i < 5000; i++) rule = { kind: 'all', rules: [rule] };
  course.prerequisite = rule;
  const restored = value(
    restorePlan({
      ...p,
      selections: [
        { courseId: 'TEST101', sectionIds: [], units: 4, lastKnown: { course, sections: [] } },
      ],
    }),
  );
  expect(value(editPlan(restored, { type: 'rename', name: 'Nested' }, c)).plan.name).toBe('Nested');
});

it('restores every original choice removed from an adopted canonical group in its original position', () => {
  const e = makeFixture();
  e.courses.push({ ...e.courses[1], id: 'OTHER', code: 'OTHER' });
  const old = catalog(e);
  let p = value(createPlan('Plan', old));
  for (const courseId of ['TEST101', 'TEST104', 'OTHER'])
    p = edit(p, old, { type: 'addCourse', courseId });
  e.version = 'merged';
  e.courses.find((course) => course.id === 'OTHER')!.canonicalId = 'TEST101';
  const updated = catalog(e);
  p = value(adoptCatalog(p, old, updated)).plan;
  const removed = value(editPlan(p, { type: 'removeCourse', courseId: 'TEST101' }, updated));
  expect(removed.plan.selections.map((selection) => selection.courseId)).toEqual(['TEST104']);
  expect(value(restoreRemoval(removed.plan, removed.removed!, updated)).plan.selections).toEqual(
    p.selections,
  );
});

it('rejects non-string coursework statuses instead of coercing them into valid input', () => {
  const c = catalog();
  const p = value(createPlan('Plan', c));
  expect(
    restorePlan({
      ...p,
      history: [{ id: 'h', courseId: 'TEST101', status: ['completed'], earnedUnits: 4 }],
    }).ok,
  ).toBe(false);
});

it('keeps an unmapped entered code unresolved after a later catalog adds the code until explicitly edited', () => {
  const old = catalog();
  let p = value(createPlan('Plan', old));
  p = edit(p, old, {
    type: 'upsertHistory',
    value: { id: 'h', courseId: 'FUTURE101', status: 'completed', earnedUnits: 4 },
  });
  expect(p.history[0].unmapped).toBe(true);
  const e = makeFixture();
  e.version = 'future';
  e.courses.push({ ...e.courses[0], id: 'FUTURE', code: 'FUTURE101' });
  const updated = catalog(e);
  p = value(adoptCatalog(p, old, updated)).plan;
  expect(updated.facts(p).history[0].canonicalId).toBeNull();
  p = edit(p, updated, { type: 'upsertHistory', value: { ...p.history[0] } });
  expect(updated.facts(p).history[0].canonicalId).toBe('FUTURE');
});

it('does not reinterpret unchanged removed identities as reused display codes while editing other fields', () => {
  const old = catalog();
  let p = value(createPlan('Plan', old));
  p = edit(p, old, {
    type: 'upsertHistory',
    value: { id: 'h', courseId: 'TEST001', status: 'completed', earnedUnits: 4 },
  });
  p = edit(p, old, {
    type: 'upsertTarget',
    value: { id: 't', name: 'Intro', kind: 'count', threshold: 1, courseIds: ['TEST001'] },
  });
  const e = makeFixture();
  e.version = 'removed';
  e.courses = e.courses.filter((course) => course.id !== 'TEST001');
  e.courses.find((course) => course.id === 'TEST104')!.code = 'TEST001';
  const updated = catalog(e);
  p = value(adoptCatalog(p, old, updated)).plan;
  p = edit(p, updated, { type: 'upsertHistory', value: { ...p.history[0], earnedUnits: 5 } });
  p = edit(p, updated, {
    type: 'upsertTarget',
    value: { ...p.targets[0], name: 'Renamed target' },
  });
  expect(p.history[0].courseId).toBe('TEST001');
  expect(p.targets[0].courseIds).toEqual(['TEST001']);
  expect(updated.facts(p).history[0].canonicalId).toBeNull();
  expect(updated.facts(p).targets[0].unresolvedIds).toEqual(['TEST001']);
});
