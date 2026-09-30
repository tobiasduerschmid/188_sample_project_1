import { describe, it, expect } from 'vitest';
import { validateCatalog } from '../src/catalog/boundary';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { makeFixture } from '../src/fixtures/catalog';
import type { PlanInputs, Rule } from '../src/domain/types';

export function fixturePlan(): PlanInputs {
  return {
    schemaVersion: 1,
    id: 'plan',
    name: 'Test',
    quarterId: 'synthetic-2026-winter',
    catalogRef: { quarterId: 'synthetic-2026-winter', version: 'fixture-v1', digest: 'test' },
    selections: [],
    personalTimes: [],
    unitTarget: null,
    history: [],
    historyComplete: false,
    targets: [],
  };
}
describe('public catalog admission', () => {
  it('supplies the exact synthetic acceptance data with explicit unknown/no-exam meaning', () => {
    const fixture = makeFixture('2026-09-29T12:00:00Z');
    expect(fixture).toMatchObject({
      version: 'fixture-v1',
      source: {
        name: 'Synthetic acceptance catalog',
        publishedAt: '2026-09-29T12:00:00Z',
        demo: true,
      },
      quarter: {
        instructionStart: '2026-01-05',
        instructionEnd: '2026-03-13',
        examEnd: '2026-03-20',
        timezone: 'America/Los_Angeles',
      },
    });
    expect(fixture.courses).toHaveLength(6);
    expect(fixture.sections).toHaveLength(8);
    expect(validateCatalog(fixture).ok).toBe(true);
  });
  it('returns record-specific errors for malformed nested fields without throwing', () => {
    const fixture = makeFixture();
    fixture.courses[0].units = [-1];
    fixture.sections[0].courseId = 'missing';
    fixture.sections[1].meetings = [null as never];
    const result = validateCatalog(fixture);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === 'courses[0].units')).toBe(true);
      expect(result.errors.some((e) => e.field === 'sections[0].courseId')).toBe(true);
      expect(result.errors.some((e) => e.field === 'sections[1].meetings[0]')).toBe(true);
    }
    for (const raw of [undefined, null, [], 42, { courses: [null], sections: [{}] }])
      expect(() => validateCatalog(raw)).not.toThrow();
  });
  it('rejects duplicates, absent classifications, bad links, empty rules and private fields', () => {
    const cases = [
      (f: ReturnType<typeof makeFixture>) => f.courses.push(f.courses[0]),
      (f: ReturnType<typeof makeFixture>) => {
        f.courses[0].prerequisite = { kind: 'all', rules: [] };
      },
      (f: ReturnType<typeof makeFixture>) => {
        f.sections[0].compatibleWith = ['missing'];
      },
      (f: ReturnType<typeof makeFixture>) => {
        f.sections[0].meetings = [];
      },
      (f: ReturnType<typeof makeFixture>) => {
        (f as unknown as Record<string, unknown>).history = [];
      },
      (f: ReturnType<typeof makeFixture>) => {
        delete (f.sections[0] as Partial<(typeof f.sections)[0]>).exams;
      },
    ];
    for (const mutate of cases) {
      const f = makeFixture();
      mutate(f);
      expect(validateCatalog(f).ok).toBe(false);
    }
  });
  it('accepts explicit unknown metadata and unsupported rules as manual review source text', () => {
    const f = makeFixture();
    f.courses[0].prerequisite = { kind: 'minimum-grade', text: 'At least C in TEST001' } as never;
    f.sections[0].instructors = null;
    f.sections[0].location = null;
    f.sections[0].modality = null;
    f.sections[0].exams = null;
    const result = validateCatalog(f);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value.courses[0].prerequisite).toEqual({
        kind: 'manual',
        text: 'At least C in TEST001',
      });
  });
  it('rejects out-of-quarter replacements and exams, alias chains, asymmetric links and over-capacity quarters', () => {
    const mutators = [
      (f: ReturnType<typeof makeFixture>) => {
        f.sections[0].exams = [
          {
            id: 'outside',
            kind: 'once' as const,
            start: '2026-03-21T09:00',
            end: '2026-03-21T10:00',
          },
        ];
      },
      (f: ReturnType<typeof makeFixture>) => {
        const m = f.sections[0].meetings[0];
        if (m.kind === 'weekly')
          m.replacements.push({
            id: 'outside',
            kind: 'once',
            start: '2026-03-21T09:00',
            end: '2026-03-21T10:00',
          });
      },
      (f: ReturnType<typeof makeFixture>) => {
        f.courses[0].canonicalId = 'TEST101';
        f.courses[1].canonicalId = 'TEST102';
      },
      (f: ReturnType<typeof makeFixture>) => {
        f.sections[1].compatibleWith = ['TEST101-B'];
      },
      (f: ReturnType<typeof makeFixture>) => {
        f.quarter.examEnd = '2026-07-01';
      },
    ];
    for (const mutate of mutators) {
      const f = makeFixture();
      mutate(f);
      expect(validateCatalog(f).ok).toBe(false);
    }
  });
  it('rejects cyclic meeting values without throwing', () => {
    const f = makeFixture();
    const meeting = f.sections[0].meetings[0];
    if (meeting.kind === 'weekly') meeting.replacements.push(meeting as never);
    expect(() => validateCatalog(f)).not.toThrow();
    expect(validateCatalog(f).ok).toBe(false);
    for (const value of [1n, { value: 1 }, null, undefined]) {
      const g = makeFixture();
      const m = g.sections[0].meetings[0];
      if (m.kind === 'weekly') {
        m.endDayOffset = value as never;
        m.weekdays = [value as never];
      }
      expect(() => validateCatalog(g)).not.toThrow();
      expect(validateCatalog(g).ok).toBe(false);
    }
  });
  it('rejects padded course identity tokens that would be ambiguous when resolved', () => {
    const f = makeFixture();
    f.courses[0].id = ' TEST001 ';
    f.courses[0].code = ' TEST001 ';
    f.courses.find((c) => c.id === 'TEST102')!.prerequisite = {
      kind: 'course',
      courseId: ' TEST001 ',
    };
    expect(validateCatalog(f).ok).toBe(false);
  });
  it('enforces the stated catalog capacities without imposing arbitrary unit increments', () => {
    const f = makeFixture();
    f.courses[0].units = [0, 0.1, 1.25, 100];
    expect(validateCatalog(f).ok).toBe(true);
    f.courses = Array.from({ length: 5001 }, (_, i) => ({
      ...f.courses[0],
      id: `CAP${i}`,
      code: `CAP${i}`,
    }));
    f.sections = [];
    const courses = validateCatalog(f);
    expect(courses.ok).toBe(false);
    if (!courses.ok)
      expect(
        courses.errors.some((e) => e.code === 'catalog_capacity' && e.field === 'courses'),
      ).toBe(true);
    const g = makeFixture();
    g.sections = Array.from({ length: 20001 }, (_, i) => ({ ...g.sections[6], id: `section${i}` }));
    const sections = validateCatalog(g);
    expect(sections.ok).toBe(false);
    if (!sections.ok)
      expect(
        sections.errors.some((e) => e.code === 'catalog_capacity' && e.field === 'sections'),
      ).toBe(true);
  });
  it('admits and interprets deeply nested supported rules without a hidden depth limit', () => {
    const f = makeFixture();
    let deep: Rule = { kind: 'course', courseId: 'TEST001' };
    for (let i = 0; i < 5000; i++) deep = { kind: 'all', rules: [deep] };
    f.courses[1].prerequisite = deep;
    const admitted = validateCatalog(f);
    expect(admitted.ok).toBe(true);
    const p = fixturePlan();
    p.selections = [{ courseId: 'TEST101', sectionIds: [], units: null, lastKnown: null }];
    expect(() => new CatalogSnapshot(f, p.catalogRef).facts(p)).not.toThrow();
  });
});
describe('catalog interpretation', () => {
  it('searches only offerings, case-insensitively, and requires instructor and availability on one section', () => {
    const f = makeFixture();
    f.sections[0].instructors = ['Professor Full'];
    f.sections[0].availability = 'full';
    const catalog = new CatalogSnapshot(f, fixturePlan().catalogRef);
    expect(catalog.search(' introductory ')).toEqual([]);
    expect(catalog.search(' FOUNDATIONS ')[0]?.id).toBe('TEST101');
    expect(catalog.search('Professor Full', 'TEST', 'open')).toEqual([]);
    expect(catalog.search('Professor Full', 'TEST', 'full').map((c) => c.id)).toEqual(['TEST101']);
  });
  it('interprets linkage and cancellations while retaining all active components and fixed units in drafts', () => {
    const f = makeFixture();
    const p = fixturePlan();
    p.selections = [
      { courseId: 'TEST101', sectionIds: ['TEST101-A'], units: null, lastKnown: null },
    ];
    const catalog = new CatalogSnapshot(f, p.catalogRef);
    expect(catalog.facts(p).selections[0]).toMatchObject({
      complete: false,
      units: 4,
      inactive: false,
    });
    p.selections[0].sectionIds.push('TEST101-B1');
    expect(catalog.facts(p).selections[0].issues.join(' ')).toMatch(/incompatible/i);
    p.selections[0].sectionIds = ['TEST101-A', 'TEST101-A1'];
    expect(catalog.facts(p).selections[0].complete).toBe(true);
    f.sections.find((s) => s.id === 'TEST101-A1')!.availability = 'canceled';
    expect(new CatalogSnapshot(f, p.catalogRef).facts(p).selections[0]).toMatchObject({
      complete: false,
      inactive: true,
    });
    expect(catalog.facts(p).selections[0].complete).toBe(true);
  });
  it('groups direct aliases, preserves conflicting original history and choices, and never guesses equivalence', () => {
    const f = makeFixture();
    const p = fixturePlan();
    f.courses.push({
      ...f.courses.find((c) => c.id === 'TEST101')!,
      id: 'ALIAS101',
      code: 'ALIAS101',
      canonicalId: 'TEST101',
    });
    const catalog = new CatalogSnapshot(f, p.catalogRef);
    expect(catalog.resolve('alias101')).toBe('TEST101');
    expect(catalog.resolve('Foundations')).toBe(null);
    expect(catalog.sectionsFor('ALIAS101')).toHaveLength(4);
    p.history = [
      { id: 'h1', courseId: 'ALIAS101', status: 'completed', earnedUnits: 4 },
      { id: 'h2', courseId: 'TEST101', status: 'not_completed', earnedUnits: null },
    ];
    p.selections = ['TEST101', 'ALIAS101'].map((courseId, index) => ({
      courseId,
      sectionIds: index ? ['TEST101-B', 'TEST101-B1'] : ['TEST101-A', 'TEST101-A1'],
      units: null,
      lastKnown: null,
    }));
    const facts = catalog.facts(p);
    expect(facts.history).toHaveLength(1);
    expect(facts.history[0].ambiguous).toBe(true);
    expect(facts.history[0].records).toHaveLength(2);
    expect(facts.selections).toHaveLength(1);
    expect(facts.selections[0].complete).toBe(false);
    expect(facts.selections[0].selections).toHaveLength(2);
  });
  it('does not reinterpret removed stable identities as the display code of another course', () => {
    const f = makeFixture();
    const p = fixturePlan();
    f.courses[0].id = 'REPLACEMENT';
    f.courses.find((c) => c.id === 'TEST102')!.prerequisite = { kind: 'none' };
    p.selections = [{ courseId: 'TEST001', sectionIds: [], units: 4, lastKnown: null }];
    p.history = [{ id: 'old', courseId: 'TEST001', status: 'completed', earnedUnits: 4 }];
    p.targets = [
      { id: 't', name: 'Old identity', kind: 'count', threshold: 1, courseIds: ['TEST001'] },
    ];
    const c = new CatalogSnapshot(f, p.catalogRef);
    const facts = c.facts(p);
    expect(c.resolve('TEST001')).toBe('REPLACEMENT'); // Explicit user input still searches codes.
    expect(facts.selections[0].course).toBe(null);
    expect(facts.history[0].canonicalId).toBe(null);
    expect(facts.targets[0].unresolvedIds).toEqual(['TEST001']);
  });
  it('keeps unresolved history keys separate from valid IDs with reserved-looking text', () => {
    const f = makeFixture();
    f.courses.push({ ...f.courses[0], id: 'unresolved:external', code: 'EXTERNAL' });
    const p = fixturePlan();
    p.history = [
      { id: 'known', courseId: 'unresolved:external', status: 'completed', earnedUnits: 4 },
      { id: 'unknown', courseId: 'external', status: 'completed', earnedUnits: 4 },
    ];
    const facts = new CatalogSnapshot(f, p.catalogRef).facts(p);
    expect(facts.history).toHaveLength(2);
    expect(facts.history.map((h) => h.canonicalId)).toEqual(['unresolved:external', null]);
  });
});
