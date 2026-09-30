import { expect, it, vi } from 'vitest';
import { assessPlan } from '../src/assessment/assessment';
import { createPlan, editPlan } from '../src/domain/plan';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { makeFixture } from '../src/fixtures/catalog';
import type { Result } from '../src/domain/types';
const value = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.errors[0].message);
  return result.value;
};
function setup() {
  const envelope = makeFixture();
  const catalog = new CatalogSnapshot(envelope, {
    quarterId: envelope.quarter.id,
    version: envelope.version,
    digest: 'digest',
  });
  return { catalog, plan: value(createPlan('Plan', catalog, 'plan-id')) };
}
it('returns schedule and academic results bound to one complete generation key', async () => {
  const { catalog, plan } = setup();
  const selected = value(editPlan(plan, { type: 'addCourse', courseId: 'TEST105' }, catalog)).plan;
  const complete = value(
    editPlan(
      selected,
      { type: 'setSection', courseId: 'TEST105', sectionId: 'TEST105-A' },
      catalog,
    ),
  ).plan;
  const result = value(await assessPlan(complete, catalog, 17));
  expect(result.key).toEqual({
    planId: 'plan-id',
    generation: 17,
    catalogRef: { quarterId: 'synthetic-2026-winter', version: 'fixture-v1', digest: 'digest' },
  });
  expect(result.schedule.incomplete.length).toBeGreaterThan(0);
  expect(result.academic.units.known).toBe(2);
});
it('rejects a mismatched digest even when quarter and version match', async () => {
  const { catalog, plan } = setup();
  const wrong = { ...plan, catalogRef: { ...plan.catalogRef, digest: 'wrong' } };
  expect(await assessPlan(wrong, catalog, 1)).toMatchObject({
    ok: false,
    errors: [{ code: 'assessment_key_mismatch' }],
  });
  expect(await assessPlan(plan, catalog, Number.NaN)).toMatchObject({
    ok: false,
    errors: [{ code: 'invalid_generation' }],
  });
});
it('contains evaluator failures without returning a partial assessment', async () => {
  const { catalog, plan } = setup();
  vi.spyOn(catalog, 'facts').mockImplementation(() => {
    throw new Error('injected evaluator failure');
  });
  const result = await assessPlan(plan, catalog, 2);
  expect(result).toMatchObject({ ok: false, errors: [{ code: 'assessment_failed' }] });
  expect('value' in result).toBe(false);
});
