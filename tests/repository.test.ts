import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { fingerprint } from '../src/domain/identity';
import type { CatalogEnvelope, CommitRequest, PlanInputs, Result } from '../src/domain/types';
import { ProfileStorage, type ProfileTransaction, type StoreName } from '../src/storage/profile';
import { PlanRepository } from '../src/storage/repository';

const catalog: CatalogEnvelope = {
  schemaVersion: 1,
  version: 'v1',
  source: {
    name: 'Tests',
    reference: 'https://example.edu/catalog',
    publishedAt: '2026-09-01T00:00:00Z',
    demo: true,
  },
  quarter: {
    id: 'fall',
    name: 'Fall 2026',
    timezone: 'America/Los_Angeles',
    instructionStart: '2026-09-28',
    instructionEnd: '2026-12-04',
    examStart: '2026-12-07',
    examEnd: '2026-12-11',
  },
  courses: [],
  sections: [],
};
const stores: ProfileStorage[] = [];
function repository(db: string = crypto.randomUUID()) {
  const storage = new ProfileStorage(db);
  stores.push(storage);
  return { storage, repo: new PlanRepository(storage), db };
}
afterEach(() => {
  stores.forEach((s) => s.close());
  stores.length = 0;
});
function value<T>(result: Result<T>): T {
  expect(result.ok, JSON.stringify(result)).toBe(true);
  if (!result.ok) throw Error('Expected success');
  return result.value;
}
async function request(
  id: string = crypto.randomUUID(),
  name: string = id,
  overrides: Partial<CommitRequest> = {},
): Promise<CommitRequest> {
  const inputs: PlanInputs = {
    schemaVersion: 1,
    id,
    name,
    quarterId: 'fall',
    catalogRef: { quarterId: 'fall', version: 'v1', digest: await fingerprint(catalog) },
    selections: [],
    personalTimes: [],
    unitTarget: null,
    history: [],
    historyComplete: false,
    targets: [],
  };
  const req = {
    operation: 'create' as const,
    inputs,
    expectedRevision: null,
    mutationId: crypto.randomUUID(),
    sessionId: 'session-a',
    generation: 0,
    fingerprint: '',
    catalog,
    ...overrides,
  };
  req.fingerprint = await fingerprint(req.inputs);
  return req;
}
function code(result: Result<unknown>) {
  return result.ok ? 'success' : result.errors[0].code;
}

describe('PlanRepository durable transactions', () => {
  it('reopens complete acknowledged inputs and keeps the pinned catalog in the same transaction', async () => {
    const { repo, db, storage } = repository();
    const req = await request('one', 'Plan One');
    const receipt = value(await repo.commit(req));
    expect(receipt).toMatchObject({
      planId: 'one',
      revision: 1,
      mutationId: req.mutationId,
      generation: 0,
    });
    expect(value(await repository(db).repo.open('one')).inputs).toEqual(req.inputs);
    expect(
      value(
        await storage.transact(['catalog_envelopes'], 'readonly', (tx) =>
          tx.getAll('catalog_envelopes'),
        ),
      ),
    ).toHaveLength(1);
  });
  it('serializes two-tab replacement races without losing the winning revision', async () => {
    const a = repository();
    const b = repository(a.db);
    const initial = await request('one', 'Original');
    value(await a.repo.commit(initial));
    const next = await Promise.all(
      ['Alpha', 'Beta'].map((name, i) =>
        request('one', name, { operation: 'replace', expectedRevision: 1, generation: i + 1 }),
      ),
    );
    const results = await Promise.all([a.repo.commit(next[0]), b.repo.commit(next[1])]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.map(code)).toContain('revision_conflict');
    const saved = value(await a.repo.open('one'));
    expect(saved.revision).toBe(2);
    expect(saved.inputs.name).toBe(next[results.findIndex((r) => r.ok)].inputs.name);
  });
  it('checks quarter-local case-insensitive names atomically across tabs', async () => {
    const a = repository();
    const b = repository(a.db);
    const results = await Promise.all([
      request('one', 'My Plan').then((r) => a.repo.commit(r)),
      request('two', 'my plan').then((r) => b.repo.commit(r)),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.map(code)).toContain('duplicate_name');
    expect(value(await a.repo.list())).toHaveLength(1);
  });
  it('admits exactly one of two simultaneous creates at the 20-plan boundary', async () => {
    const a = repository();
    const b = repository(a.db);
    for (let n = 0; n < 19; n++) value(await a.repo.commit(await request(`plan-${n}`)));
    const results = await Promise.all([
      request('twenty').then((r) => a.repo.commit(r)),
      request('twenty-one').then((r) => b.repo.commit(r)),
    ]);
    expect(results.map(code).sort()).toEqual(['plan_capacity', 'success']);
    expect(value(await a.repo.list())).toHaveLength(20);
  });
  it('tombstones deleted identities and frees their name while refusing stale resurrection', async () => {
    const { repo } = repository();
    const req = await request('one', 'Reusable');
    value(await repo.commit(req));
    expect(code(await repo.delete('one', 0, 'wrong-delete'))).toBe('revision_conflict');
    value(await repo.delete('one', 1, 'delete'));
    value(await repo.delete('one', 1, 'delete'));
    expect(code(await repo.open('one'))).toBe('deleted_plan');
    expect(value(await repo.list())).toEqual([]);
    expect(code(await repo.commit(req))).toBe('deleted_plan');
    expect(code(await repo.commit(await request('one', 'Resurrect')))).toBe('deleted_plan');
    value(await repo.commit(await request('two', 'Reusable')));
  });
  it('replays an identical mutation once but rejects identity reuse with different content or generation', async () => {
    const { repo } = repository();
    const req = await request('one');
    const receipt = value(await repo.commit(req));
    expect(value(await repo.commit(req))).toEqual(receipt);
    const altered = { ...req, inputs: { ...req.inputs, name: 'Changed' } };
    altered.fingerprint = await fingerprint(altered.inputs);
    expect(code(await repo.commit(altered))).toBe('mutation_conflict');
    expect(code(await repo.commit({ ...req, generation: 2 }))).toBe('mutation_conflict');
    expect(value(await repo.open('one')).revision).toBe(1);
  });
  it('reconciles only the exact retained receipt and never repeats a superseded write', async () => {
    const { repo } = repository();
    const req = await request('one');
    value(await repo.commit(req));
    expect(value(await repo.reconcile(req)).revision).toBe(1);
    value(
      await repo.commit(
        await request('one', 'Newer', { operation: 'replace', expectedRevision: 1, generation: 1 }),
      ),
    );
    expect(code(await repo.reconcile(req))).toBe('revision_conflict');
    expect(value(await repo.open('one')).inputs.name).toBe('Newer');
  });
  it('refuses mismatched input digests and immutable catalog version collisions before changing plans', async () => {
    const { repo } = repository();
    const initial = await request('one');
    expect(code(await repo.commit({ ...initial, fingerprint: 'wrong' }))).toBe(
      'fingerprint_mismatch',
    );
    value(await repo.commit(initial));
    const changedCatalog = { ...catalog, source: { ...catalog.source, name: 'Changed content' } };
    const req = await request('two', 'Other', { catalog: changedCatalog });
    req.inputs.catalogRef.digest = await fingerprint(changedCatalog);
    req.fingerprint = await fingerprint(req.inputs);
    expect(code(await repo.commit(req))).toBe('catalog_identity_conflict');
    expect(value(await repo.list())).toHaveLength(1);
  });
  it('aborts complete plan/catalog writes if storage fails before transaction completion', async () => {
    class AbortAfterWrites extends ProfileStorage {
      override transact<T>(
        names: StoreName[],
        mode: IDBTransactionMode,
        operation: (tx: ProfileTransaction) => Promise<T>,
      ): Promise<Result<T>> {
        return super.transact(names, mode, async (tx) => {
          const result = await operation(tx);
          if (mode === 'readwrite') throw new DOMException('Quota exceeded', 'QuotaExceededError');
          return result;
        });
      }
    }
    const db = crypto.randomUUID();
    const storage = new AbortAfterWrites(db);
    stores.push(storage);
    expect(code(await new PlanRepository(storage).commit(await request('one')))).toBe(
      'storage_full',
    );
    const fresh = repository(db);
    expect(value(await fresh.repo.list())).toEqual([]);
    expect(
      value(
        await fresh.storage.transact(['catalog_envelopes'], 'readonly', (tx) =>
          tx.getAll('catalog_envelopes'),
        ),
      ),
    ).toEqual([]);
  });
  it('reports corrupted records without deleting or replacing their original bytes', async () => {
    const { repo, storage } = repository();
    value(await repo.commit(await request('one')));
    const corrupt = { schemaVersion: 200, inputs: { id: 'one' }, revision: 1 };
    value(
      await storage.transact(['plan_records'], 'readwrite', (tx) =>
        tx.put('plan_records', 'one', corrupt),
      ),
    );
    expect(code(await repo.open('one'))).toBe('storage_corrupt');
    expect(code(await repo.list())).toBe('storage_corrupt');
    expect(
      value(
        await storage.transact(['plan_records'], 'readonly', (tx) => tx.get('plan_records', 'one')),
      ),
    ).toEqual(corrupt);
  });
  it('refuses a receipt replay if stored inputs no longer match the acknowledged content', async () => {
    const { repo, storage } = repository();
    const req = await request('one', 'Original');
    value(await repo.commit(req));
    const saved = value(await repo.open('one'));
    value(
      await storage.transact(['plan_records'], 'readwrite', (tx) =>
        tx.put('plan_records', 'one', { ...saved, inputs: { ...saved.inputs, name: 'Tampered' } }),
      ),
    );
    expect(code(await repo.commit(req))).toBe('storage_corrupt');
    expect(code(await repo.reconcile(req))).toBe('storage_corrupt');
  });
  it('does not accept an already-used active mutation identity for a different plan', async () => {
    const { repo } = repository();
    const one = await request('one');
    value(await repo.commit(one));
    const two = await request('two', 'Another', { mutationId: one.mutationId });
    expect(code(await repo.commit(two))).toBe('mutation_conflict');
    expect(value(await repo.list())).toHaveLength(1);
  });
  it('checks name collisions against saved records even when the derived index is missing', async () => {
    const { repo, storage } = repository();
    value(await repo.commit(await request('one', 'Original')));
    value(
      await storage.transact(['quarter_name_index'], 'readwrite', (tx) =>
        tx.delete('quarter_name_index', JSON.stringify(['fall', 'original'])),
      ),
    );
    expect(code(await repo.commit(await request('two', 'ORIGINAL')))).toBe('duplicate_name');
  });
  it('uses the same character-count name rule as plan creation', async () => {
    const { repo } = repository();
    expect(value(await repo.nameAvailable('😀'.repeat(80), 'fall'))).toBe(true);
    value(await repo.commit(await request('one', '😀'.repeat(80))));
    expect(value(await repo.nameAvailable('😀'.repeat(80), 'fall'))).toBe(false);
  });

  it('validates the effective course limit against the exact catalog while preserving adopted identity collisions', async () => {
    const { repo } = repository();
    const large = structuredClone(catalog);
    large.courses = Array.from({ length: 41 }, (_, i) => ({
      id: `C${i}`,
      subject: 'TEST',
      code: String(i),
      title: `Course ${i}`,
      description: null,
      units: [4],
      prerequisite: { kind: 'none' },
      corequisite: { kind: 'none' },
      requiredComponents: { lecture: 1 },
    }));
    const req = await request('one', 'Many courses', { catalog: large });
    req.inputs.catalogRef.digest = await fingerprint(large);
    req.inputs.selections = large.courses.map((course) => ({
      courseId: course.id,
      sectionIds: [],
      units: 4,
      lastKnown: null,
    }));
    req.fingerprint = await fingerprint(req.inputs);
    expect(code(await repo.commit(req))).toBe('course_capacity');
    large.courses[40].canonicalId = 'C0';
    req.inputs.catalogRef.digest = await fingerprint(large);
    req.fingerprint = await fingerprint(req.inputs);
    value(await repo.commit(req));
    expect(value(await repo.open('one')).inputs.selections).toHaveLength(41);
  });

  it('checks retained catalog bytes again after an earlier successful open', async () => {
    const { repo, storage } = repository();
    const req = await request('one');
    value(await repo.commit(req));
    value(await repo.open('one'));
    const key = JSON.stringify(['fall', 'v1']);
    value(
      await storage.transact(['catalog_envelopes'], 'readwrite', async (tx) => {
        const retained = await tx.get<any>('catalog_envelopes', key);
        await tx.put('catalog_envelopes', key, {
          ...retained,
          envelope: {
            ...retained.envelope,
            source: { ...retained.envelope.source, name: 'Tampered' },
          },
        });
      }),
    );
    expect(code(await repo.open('one'))).toBe('storage_corrupt');
  });

  it.each(['create', 'replace'] as const)(
    'recognizes an uncommitted %s after a failed attempt and allows the identical mutation to be retried',
    async (operation) => {
      class InterruptedStorage extends ProfileStorage {
        interruptWrite = false;
        interruptRead = false;
        override transact<T>(
          names: StoreName[],
          mode: IDBTransactionMode,
          action: (tx: ProfileTransaction) => Promise<T>,
        ): Promise<Result<T>> {
          if (mode === 'readwrite' && this.interruptWrite) {
            this.interruptWrite = false;
            return Promise.resolve({
              ok: false,
              errors: [
                {
                  code: 'interrupted_or_indeterminate',
                  message: 'Interrupted before transaction started',
                },
              ],
            });
          }
          if (mode === 'readonly' && this.interruptRead) {
            this.interruptRead = false;
            return Promise.resolve({
              ok: false,
              errors: [
                { code: 'interrupted_or_indeterminate', message: 'Read outcome unavailable' },
              ],
            });
          }
          return super.transact(names, mode, action);
        }
      }
      const storage = new InterruptedStorage(crypto.randomUUID());
      stores.push(storage);
      const repo = new PlanRepository(storage);
      if (operation === 'replace') value(await repo.commit(await request('one', 'Original')));
      const req = await request('one', 'Current', {
        operation,
        expectedRevision: operation === 'replace' ? 1 : null,
        generation: 1,
      });
      storage.interruptWrite = true;
      expect(code(await repo.commit(req))).toBe('interrupted_or_indeterminate');
      storage.interruptRead = true;
      expect(code(await repo.reconcile(req))).toBe('interrupted_or_indeterminate');
      expect(code(await repo.reconcile(req))).toBe('known_aborted');
      expect(value(await repo.list()).map((plan) => plan.name)).toEqual(
        operation === 'replace' ? ['Original'] : [],
      );
      const receipt = value(await repo.commit(req));
      expect(receipt).toMatchObject({
        mutationId: req.mutationId,
        generation: 1,
        revision: operation === 'replace' ? 2 : 1,
      });
      expect(value(await repo.open('one')).inputs.name).toBe('Current');
    },
  );
  it('never classifies a missing replacement, a newer revision, or a deletion as known aborted', async () => {
    const { repo } = repository();
    const pending = await request('one', 'Pending', {
      operation: 'replace',
      expectedRevision: 1,
      generation: 1,
    });
    expect(code(await repo.reconcile(pending))).toBe('interrupted_or_indeterminate');
    value(await repo.commit(await request('one', 'Original')));
    value(
      await repo.commit(
        await request('one', 'Other tab', {
          operation: 'replace',
          expectedRevision: 1,
          generation: 1,
        }),
      ),
    );
    expect(code(await repo.reconcile(pending))).toBe('revision_conflict');
    value(await repo.delete('one', 2, 'delete'));
    expect(code(await repo.reconcile(pending))).toBe('deleted_plan');
  });
  it.each([null, false, 0, ''])(
    'does not mistake malformed stored value %s for an absent first-create record',
    async (malformed) => {
      const { repo, storage } = repository();
      const req = await request('one');
      value(
        await storage.transact(['plan_records'], 'readwrite', (tx) =>
          tx.put('plan_records', 'one', malformed),
        ),
      );
      expect(code(await repo.reconcile(req))).toBe('storage_corrupt');
    },
  );
  it('does not classify a corrupted unchanged baseline as a safely aborted replacement', async () => {
    const { repo, storage } = repository();
    value(await repo.commit(await request('one', 'Original')));
    const saved = value(await repo.open('one'));
    value(
      await storage.transact(['plan_records'], 'readwrite', (tx) =>
        tx.put('plan_records', 'one', {
          ...saved,
          inputs: { ...saved.inputs, name: 'Altered without receipt' },
        }),
      ),
    );
    const pending = await request('one', 'Pending', {
      operation: 'replace',
      expectedRevision: 1,
      generation: 1,
    });
    expect(code(await repo.reconcile(pending))).toBe('storage_corrupt');
  });
});
