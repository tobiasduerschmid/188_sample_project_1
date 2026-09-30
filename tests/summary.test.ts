import { expect, it } from 'vitest';
import { makeFixture } from '../src/fixtures/catalog';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { createPlan } from '../src/domain/plan';
import { renderSummary } from '../src/export/summary';

it('exports raw reconstruction inputs and explicitly labels unavailable checks and unsaved edits', () => {
  const envelope = makeFixture();
  const catalog = new CatalogSnapshot(envelope, {
    quarterId: envelope.quarter.id,
    version: envelope.version,
    digest: 'test',
  });
  const result = createPlan('Unsaved study plan', catalog);
  if (!result.ok) throw new Error('fixture');
  const plan = {
    ...result.value,
    history: [{ id: 'h', courseId: 'UNMAPPED 7', status: 'completed' as const, earnedUnits: null }],
    historyComplete: false,
  };
  const text = renderSummary({
    plan,
    catalog: envelope,
    assessment: null,
    assessmentStatus: 'failed',
    saveState: 'save_failed',
    capturedAt: '2026-09-29T00:00:00Z',
  });
  expect(text).toContain('Unsaved study plan');
  expect(text).toContain('Changes not saved');
  expect(text).toContain('UNMAPPED 7');
  expect(text).toContain('earnedUnits');
  expect(text).toContain('No unit target specified');
  expect(text).toContain('failed');
  expect(text).toContain('America/Los_Angeles');
  expect(text).toContain('not enrollment confirmation');
});
