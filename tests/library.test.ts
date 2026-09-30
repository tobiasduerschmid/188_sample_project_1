import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CatalogEnvelope, CatalogManifest, PlanInputs, Result } from '../src/domain/types';
import { fingerprint } from '../src/domain/identity';
import {
  ProfileStorage,
  catalogKey,
  type ProfileTransaction,
  type StoreName,
} from '../src/storage/profile';
import { CatalogLibrary } from '../src/catalog/library';
import { CatalogSnapshot } from '../src/catalog/snapshot';
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
const storages: ProfileStorage[] = [];
const makeStorage = () => {
  const storage = new ProfileStorage(crypto.randomUUID());
  storages.push(storage);
  return storage;
};
const value = <T>(r: Result<T>): T => {
  expect(r.ok, JSON.stringify(r)).toBe(true);
  if (!r.ok) throw Error('expected success');
  return r.value;
};
const code = (r: Result<unknown>) => (r.ok ? 'success' : r.errors[0].code);
async function source(envelope = catalog) {
  const digest = await fingerprint(envelope);
  const manifest: CatalogManifest = {
    schemaVersion: 1,
    quarters: [
      { id: 'fall', name: 'Fall 2026', version: envelope.version, digest, url: './fall.json' },
    ],
  };
  const fetcher = vi.fn<typeof fetch>(
    async (url) =>
      new Response(JSON.stringify(String(url).endsWith('manifest.json') ? manifest : envelope), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  return { fetcher, manifest, ref: { quarterId: 'fall', version: envelope.version, digest } };
}
const offline: typeof fetch = async () => {
  throw new TypeError('offline');
};
afterEach(() => {
  storages.forEach((s) => s.close());
  storages.length = 0;
  vi.useRealTimers();
});

describe('CatalogLibrary public retrieval and retention', () => {
  it('retains validated public content and serves exact bytes offline with a visible notice', async () => {
    const storage = makeStorage();
    const { fetcher, ref } = await source();
    const first = value(
      await new CatalogLibrary(storage, fetcher, 'https://planner.test/catalog/manifest.json').load(
        'fall',
      ),
    );
    expect(first.snapshot.ref).toEqual(ref);
    expect(first.retained).toBe(false);
    const recovered = value(await new CatalogLibrary(storage, offline).load('fall', ref));
    expect(recovered.snapshot.envelope).toEqual(catalog);
    expect(recovered.retained).toBe(true);
    expect(recovered.warning).toBeTruthy();
  });
  it('discovers retained quarters when the manifest is unavailable and reports first-use failure', async () => {
    const storage = makeStorage();
    expect(code(await new CatalogLibrary(storage, offline).discover())).toBe('catalog_unavailable');
    const { fetcher } = await source();
    value(
      await new CatalogLibrary(storage, fetcher, 'https://planner.test/catalog/manifest.json').load(
        'fall',
      ),
    );
    const manifest = value(await new CatalogLibrary(storage, offline).discover());
    expect(manifest.quarters.map((q) => q.id)).toEqual(['fall']);
    expect(manifest.retained).toBe(true);
    expect(manifest.warning).toBeTruthy();
  });
  it('never substitutes the latest public version for a missing exact saved catalog', async () => {
    const storage = makeStorage();
    const { fetcher, ref } = await source({ ...catalog, version: 'v2' });
    const result = await new CatalogLibrary(
      storage,
      fetcher,
      'https://planner.test/catalog/manifest.json',
    ).load('fall', { ...ref, version: 'v1' });
    expect(code(result)).toBe('catalog_unavailable');
  });
  it('bounds an unresponsive fetch to ten seconds and permits an explicit new attempt', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const storage = makeStorage();
    const fetcher = vi.fn<typeof fetch>(() => new Promise(() => {}));
    const library = new CatalogLibrary(storage, fetcher);
    const pending = library.discover();
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await pending;
    expect(code(result)).toBe('catalog_unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
    const retry = library.discover();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(code(await retry)).toBe('catalog_unavailable');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('reports retention denial while allowing the validated public snapshot for this session', async () => {
    class DeniedRetention extends ProfileStorage {
      override transact<T>(
        names: StoreName[],
        mode: IDBTransactionMode,
        operation: (tx: ProfileTransaction) => Promise<T>,
      ): Promise<Result<T>> {
        return mode === 'readwrite'
          ? Promise.resolve({ ok: false, errors: [{ code: 'storage_denied', message: 'Denied' }] })
          : super.transact(names, mode, operation);
      }
    }
    const storage = new DeniedRetention(crypto.randomUUID());
    storages.push(storage);
    const { fetcher } = await source();
    const loaded = value(
      await new CatalogLibrary(storage, fetcher, 'https://planner.test/catalog/manifest.json').load(
        'fall',
      ),
    );
    expect(loaded.warning).toMatch(/retain|save|storage/i);
  });
  it('refuses a reused public version identity without replacing retained bytes', async () => {
    const storage = makeStorage();
    const original = await source();
    value(
      await new CatalogLibrary(
        storage,
        original.fetcher,
        'https://planner.test/catalog/manifest.json',
      ).load('fall'),
    );
    const changed = await source({
      ...catalog,
      source: { ...catalog.source, name: 'Replaced bytes' },
    });
    expect(
      code(
        await new CatalogLibrary(
          storage,
          changed.fetcher,
          'https://planner.test/catalog/manifest.json',
        ).load('fall'),
      ),
    ).toBe('catalog_identity_conflict');
    expect(
      value(await new CatalogLibrary(storage, offline).load('fall', original.ref)).snapshot.envelope
        .source.name,
    ).toBe('Tests');
  });
  it('reports malformed retained content without erasing it', async () => {
    const storage = makeStorage();
    const { ref } = await source();
    const corrupt = { schemaVersion: 1, ref, envelope: { broken: true } };
    value(
      await storage.transact(['catalog_envelopes'], 'readwrite', (tx) =>
        tx.put('catalog_envelopes', catalogKey(ref), corrupt),
      ),
    );
    expect(code(await new CatalogLibrary(storage, offline).load('fall', ref))).toBe(
      'storage_corrupt',
    );
    expect(
      value(
        await storage.transact(['catalog_envelopes'], 'readonly', (tx) =>
          tx.get('catalog_envelopes', catalogKey(ref)),
        ),
      ),
    ).toEqual(corrupt);
  });
  it('fetches only same-origin public URLs without credentials, private input, or redirects', async () => {
    const storage = makeStorage();
    const { fetcher, manifest } = await source();
    manifest.quarters[0].url = 'https://unrelated.test/private';
    const refused = await new CatalogLibrary(
      storage,
      fetcher,
      'https://planner.test/catalog/manifest.json',
    ).load('fall');
    expect(code(refused)).toBe('catalog_unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
    const options = fetcher.mock.calls[0][1];
    expect(options).toMatchObject({
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    });
    expect(options?.body).toBeUndefined();
  });
  it('binds adoption impact to the exact draft and identifies changed rules, units, sections and unresolved identities', async () => {
    const base = structuredClone(catalog);
    base.courses = [
      {
        id: 'TEST101',
        subject: 'TEST',
        code: '101',
        title: 'Course',
        description: null,
        units: [4],
        prerequisite: { kind: 'none' },
        corequisite: { kind: 'none' },
        requiredComponents: { lecture: 1 },
      },
    ];
    base.sections = [
      {
        id: 'lec',
        courseId: 'TEST101',
        quarterId: 'fall',
        component: 'lecture',
        label: 'Lec 1',
        instructors: null,
        location: null,
        modality: null,
        availability: 'open',
        compatibleWith: null,
        meetings: [{ id: 'm', kind: 'tba' }],
        exams: null,
      },
    ];
    const next = structuredClone(base);
    next.version = 'v2';
    next.courses[0].units = [5];
    next.courses[0].prerequisite = { kind: 'unknown' };
    next.sections[0].availability = 'canceled';
    next.sections[0].meetings = [{ id: 'm', kind: 'async' }];
    const oldRef = { quarterId: 'fall', version: 'v1', digest: await fingerprint(base) };
    const newRef = { quarterId: 'fall', version: 'v2', digest: await fingerprint(next) };
    const plan: PlanInputs = {
      schemaVersion: 1,
      id: 'p',
      name: 'Plan',
      quarterId: 'fall',
      catalogRef: oldRef,
      selections: [{ courseId: 'TEST101', sectionIds: ['lec'], units: 4, lastKnown: null }],
      personalTimes: [],
      unitTarget: null,
      history: [{ id: 'h', courseId: 'MISSING', status: 'completed', earnedUnits: 4 }],
      historyComplete: false,
      targets: [],
    };
    const preview = await new CatalogLibrary(makeStorage(), offline).preview(
      plan,
      7,
      new CatalogSnapshot(base, oldRef),
      new CatalogSnapshot(next, newRef),
    );
    expect(preview).toMatchObject({
      planId: 'p',
      generation: 7,
      oldRef,
      newRef,
      fingerprint: await fingerprint(plan),
    });
    expect(preview.changes.join(' ')).toMatch(/units/i);
    expect(preview.changes.join(' ')).toMatch(/prerequisite/i);
    expect(preview.changes.join(' ')).toMatch(/canceled/i);
    expect(preview.changes.join(' ')).toMatch(/meeting/i);
    expect(preview.changes.join(' ')).toContain('MISSING');
  });
  it('rejects malformed retention metadata as a typed failure', async () => {
    const storage = makeStorage();
    const { ref } = await source();
    value(
      await storage.transact(['catalog_envelopes'], 'readwrite', (tx) =>
        tx.put('catalog_envelopes', catalogKey(ref), { schemaVersion: 1, ref, envelope: catalog }),
      ),
    );
    expect(code(await new CatalogLibrary(storage, offline).load('fall', ref))).toBe(
      'storage_corrupt',
    );
  });

  it('invokes injected public fetch without an incompatible method receiver', async () => {
    const storage = makeStorage();
    const { fetcher } = await source();
    const browserLikeFetch: typeof fetch = async function (this: unknown, ...args) {
      if (this !== undefined) throw new TypeError('Illegal invocation');
      return fetcher(...args);
    };
    expect(
      value(
        await new CatalogLibrary(
          storage,
          browserLikeFetch,
          'https://planner.test/catalog/manifest.json',
        ).load('fall'),
      ).snapshot.ref.version,
    ).toBe('v1');
  });
  it('aborts outstanding public reads on disposal and does not start further retrievals', async () => {
    const fetcher = vi.fn<typeof fetch>(() => new Promise(() => {}));
    const library = new CatalogLibrary(makeStorage(), fetcher);
    const pending = library.discover();
    const signal = fetcher.mock.calls[0][1]?.signal;
    library.dispose();
    expect(signal?.aborted).toBe(true);
    expect(code(await pending)).toBe('catalog_disposed');
    expect(code(await library.discover())).toBe('catalog_disposed');
    expect(code(await library.load('fall'))).toBe('catalog_disposed');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('keeps removed stored identities unresolved even when their text becomes a different display code', async () => {
    const before = structuredClone(catalog);
    before.courses = [
      {
        id: 'OLD',
        subject: 'TEST',
        code: '101',
        title: 'Original',
        description: null,
        units: [4],
        prerequisite: { kind: 'none' },
        corequisite: { kind: 'none' },
        requiredComponents: { lecture: 1 },
      },
    ];
    const after = structuredClone(before);
    after.version = 'v2';
    after.courses[0] = { ...before.courses[0], id: 'NEW', code: 'OLD' };
    const oldRef = { quarterId: 'fall', version: 'v1', digest: await fingerprint(before) };
    const newRef = { quarterId: 'fall', version: 'v2', digest: await fingerprint(after) };
    const plan: PlanInputs = {
      schemaVersion: 1,
      id: 'p',
      name: 'Plan',
      quarterId: 'fall',
      catalogRef: oldRef,
      selections: [],
      personalTimes: [],
      unitTarget: null,
      history: [
        { id: 'h', courseId: 'OLD', status: 'completed', earnedUnits: 4 },
        { id: 'u', courseId: 'NEW', status: 'completed', earnedUnits: 4, unmapped: true },
      ],
      historyComplete: false,
      targets: [{ id: 't', name: 'Target', kind: 'count', threshold: 1, courseIds: ['OLD'] }],
    };
    const preview = await new CatalogLibrary(makeStorage(), offline).preview(
      plan,
      1,
      new CatalogSnapshot(before, oldRef),
      new CatalogSnapshot(after, newRef),
    );
    expect(
      preview.changes.some(
        (change) =>
          change.includes('Coursework history') &&
          change.includes('OLD') &&
          /unresolved/.test(change),
      ),
    ).toBe(true);
    expect(
      preview.changes.some(
        (change) =>
          change.includes('Target') && change.includes('OLD') && /unresolved/.test(change),
      ),
    ).toBe(true);
    expect(
      preview.changes.some(
        (change) =>
          change.includes('Coursework history') &&
          change.includes('NEW') &&
          /unmapped|unresolved/.test(change),
      ),
    ).toBe(true);
    expect(preview.changes.some((change) => /OLD now resolves to NEW/.test(change))).toBe(false);
  });

  it('reuses an immutable admitted snapshot after checking retained bytes again, and rejects later corruption', async () => {
    const storage = makeStorage();
    const { fetcher, ref } = await source();
    const library = new CatalogLibrary(
      storage,
      fetcher,
      'https://planner.test/catalog/manifest.json',
    );
    const first = value(await library.load('fall')).snapshot;
    const second = value(await library.load('fall', ref)).snapshot;
    expect(second).toBe(first);
    expect(Object.isFrozen(second.envelope.source)).toBe(true);
    value(
      await storage.transact(['catalog_envelopes'], 'readwrite', async (tx) => {
        const retained = await tx.get<any>('catalog_envelopes', catalogKey(ref));
        await tx.put('catalog_envelopes', catalogKey(ref), {
          ...retained,
          envelope: {
            ...retained.envelope,
            source: { ...retained.envelope.source, name: 'Changed bytes' },
          },
        });
      }),
    );
    expect(code(await library.load('fall', ref))).toBe('storage_corrupt');
    expect(first.envelope.source.name).toBe('Tests');
  });
});
