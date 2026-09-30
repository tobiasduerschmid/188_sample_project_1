import { describe, it, expect } from 'vitest';
import { makeFixture } from '../src/fixtures/catalog';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { evaluateSchedule } from '../src/assessment/schedule';
import type { PlanInputs } from '../src/domain/types';
function plan(): PlanInputs {
  const f = makeFixture();
  return {
    schemaVersion: 1,
    id: 'p',
    name: 'Plan',
    quarterId: f.quarter.id,
    catalogRef: { quarterId: f.quarter.id, version: f.version, digest: 'test' },
    selections: [],
    personalTimes: [],
    history: [],
    historyComplete: false,
    targets: [],
    unitTarget: null,
  };
}
function selected(courseId: string, sectionIds: string[]) {
  return { courseId, sectionIds, units: null, lastKnown: null };
}
describe('dated schedule evaluation', () => {
  it('finds every Mon/Wed overlap, keeps touching endpoints clear and ignores personal-personal pairs', () => {
    const p = plan();
    const c = new CatalogSnapshot(makeFixture(), p.catalogRef);
    p.selections = [
      selected('TEST101', ['TEST101-A', 'TEST101-A1']),
      selected('TEST102', ['TEST102-A']),
    ];
    const overlap = evaluateSchedule(p, c.facts(p));
    expect(overlap.conflicts).toHaveLength(20);
    expect(
      overlap.conflicts.every(
        (x) => x.localStart.endsWith('09:30:00') && x.localEnd.endsWith('10:00:00'),
      ),
    ).toBe(true);
    p.selections[1] = selected('TEST103', ['TEST103-A']);
    expect(evaluateSchedule(p, c.facts(p)).conflicts).toHaveLength(0);
    p.personalTimes = ['a', 'b'].map((id) => ({
      id,
      label: id,
      meeting: { id, kind: 'once', start: '2026-01-05T09:15', end: '2026-01-05T09:45' },
    }));
    const personal = evaluateSchedule(p, c.facts(p));
    expect(personal.conflicts).toHaveLength(2);
    expect(new Set(personal.conflicts.map((x) => x.id)).size).toBe(2);
  });
  it('reports TBA, unknown exams, incomplete bundles, async activities and availability independently', () => {
    const p = plan();
    const f = makeFixture();
    f.sections.find((s) => s.id === 'TEST101-A')!.availability = 'full';
    f.sections.find((s) => s.id === 'TEST104-A')!.exams = null;
    p.selections = [
      selected('TEST101', ['TEST101-A']),
      selected('TEST104', ['TEST104-A']),
      selected('TEST105', ['TEST105-A']),
    ];
    const r = evaluateSchedule(p, new CatalogSnapshot(f, p.catalogRef).facts(p));
    expect(r.conflicts).toHaveLength(0);
    expect(r.incomplete).toHaveLength(3);
    expect(r.unscheduled.map((s) => s.kind).sort()).toEqual(['async', 'tba']);
    expect(r.availability[0].message).toMatch(/full/);
  });
  it('includes exams and overnight conflicts within a course and excludes canceled occurrences', () => {
    const p = plan();
    const f = makeFixture();
    p.selections = [selected('TEST101', ['TEST101-A', 'TEST101-A1'])];
    const lecture = f.sections.find((s) => s.id === 'TEST101-A')!;
    const lab = f.sections.find((s) => s.id === 'TEST101-A1')!;
    lecture.exams = [
      { id: 'exam', kind: 'once', start: '2026-03-16T23:00', end: '2026-03-17T01:00' },
    ];
    lab.exams = [
      { id: 'lab-exam', kind: 'once', start: '2026-03-17T00:30', end: '2026-03-17T01:30' },
    ];
    expect(
      evaluateSchedule(p, new CatalogSnapshot(f, p.catalogRef).facts(p)).conflicts,
    ).toHaveLength(1);
    lab.availability = 'canceled';
    const canceled = evaluateSchedule(p, new CatalogSnapshot(f, p.catalogRef).facts(p));
    expect(canceled.conflicts).toHaveLength(0);
    expect(canceled.occurrences.every((o) => o.ownerId !== lab.id)).toBe(true);
    expect(canceled.incomplete.length).toBeGreaterThan(0);
  });
});
