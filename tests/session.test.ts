import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { PlanSession } from '../src/session/session';
import { CatalogSnapshot } from '../src/catalog/snapshot';
import { CatalogLibrary } from '../src/catalog/library';
import { ProfileStorage } from '../src/storage/profile';
import { PlanRepository } from '../src/storage/repository';
import { makeFixture } from '../src/fixtures/catalog';
import { createPlan, editPlan } from '../src/domain/plan';
import { fingerprint } from '../src/domain/identity';
import { ok, fail, type CommitRequest, type Result, type SaveReceipt } from '../src/domain/types';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function context(commit: (r: CommitRequest) => Promise<Result<SaveReceipt>>) {
  const envelope = makeFixture();
  const ref = {
    quarterId: envelope.quarter.id,
    version: envelope.version,
    digest: await fingerprint(envelope),
  };
  const catalog = new CatalogSnapshot(envelope, ref);
  const made = createPlan('My quarter', catalog, 'plan-1');
  if (!made.ok) throw new Error('fixture plan');
  const repository: ConstructorParameters<typeof PlanSession>[0] = {
    commit,
    list: async () => ok([]),
    nameAvailable: async () => ok(true),
    open: async () => fail('missing', 'Not found'),
    delete: async () => ok(undefined),
    reconcile: async () => fail('indeterminate', 'Unknown'),
  };
  const library: ConstructorParameters<typeof PlanSession>[1] = {
    load: async () => ok({ snapshot: catalog, retained: false }),
    discover: async () => ok({ schemaVersion: 1 as const, quarters: [] }),
    preview: async () => {
      throw new Error('unused');
    },
  };
  const session = new PlanSession(repository, library);
  await session.selectQuarter(catalog.envelope.quarter.id);
  await session.create('My quarter');
  return { session, catalog, repository, library };
}

describe('PlanSession persistence ordering', () => {
  it('never calls an old equal-content receipt saved while a newer generation remains queued', async () => {
    const requests: CommitRequest[] = [];
    const pending: ((r: Result<SaveReceipt>) => void)[] = [];
    const { session } = await context((r) => {
      requests.push(r);
      return new Promise((resolve) => pending.push(resolve));
    });
    for (let i = 0; i < 20 && !pending.length; i++) await tick();
    await session.edit({ type: 'rename', name: 'B' });
    await session.edit({ type: 'rename', name: 'C' });
    await session.edit({ type: 'rename', name: 'B' });
    let revision = 0;
    while (pending.length || session.getSnapshot().saveState === 'saving') {
      if (!pending.length) {
        await tick();
        continue;
      }
      const resolve = pending.shift()!;
      const req = requests.shift()!;
      resolve(
        ok({
          planId: req.inputs.id,
          mutationId: req.mutationId,
          sessionId: req.sessionId,
          generation: req.generation,
          fingerprint: req.fingerprint,
          revision: ++revision,
          catalogRef: req.inputs.catalogRef,
        }),
      );
      await tick();
      if (revision < 4) expect(session.getSnapshot().saveState).not.toBe('saved');
    }
    expect(revision).toBe(4);
    expect(session.getSnapshot().plan?.name).toBe('B');
    expect(session.getSnapshot().saveState).toBe('saved');
  });

  it('keeps failed input, blocks navigation, and does not resume conflicted writes after an edit', async () => {
    let attempts = 0;
    const { session } = await context(async () => {
      attempts++;
      return fail('revision_conflict', 'Another tab saved this plan.');
    });
    for (let i = 0; i < 20 && session.getSnapshot().saveState === 'saving'; i++) await tick();
    await session.edit({ type: 'rename', name: 'Unsaved alternative' });
    await tick();
    expect(attempts).toBe(1);
    expect(session.getSnapshot().plan?.name).toBe('Unsaved alternative');
    expect(session.getSnapshot().saveState).toBe('revision_conflict');
    expect((await session.selectQuarter('another-quarter')).ok).toBe(false);
    expect(session.getSnapshot().plan?.name).toBe('Unsaved alternative');
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function saved(request: CommitRequest, revision = 1): Result<SaveReceipt> {
  return ok({
    planId: request.inputs.id,
    mutationId: request.mutationId,
    sessionId: request.sessionId,
    generation: request.generation,
    fingerprint: request.fingerprint,
    revision,
    catalogRef: request.inputs.catalogRef,
  });
}
async function settled(session: PlanSession) {
  for (let i = 0; i < 30 && session.getSnapshot().saveState === 'saving'; i++) await tick();
}

describe('PlanSession asynchronous recovery', () => {
  it('invalidates a pending quarter read when accepted input arrives', async () => {
    let deny = false;
    const { session, library, catalog } = await context(async (request) =>
      deny ? fail('storage_denied', 'Denied') : saved(request),
    );
    await settled(session);
    const load = deferred<Awaited<ReturnType<typeof library.load>>>();
    library.load = () => load.promise;
    const navigating = session.selectQuarter('next');
    deny = true;
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    await settled(session);
    load.resolve(ok({ snapshot: catalog, retained: false }));
    expect((await navigating).ok).toBe(false);
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    expect(session.getSnapshot().saveState).toBe('save_failed');
    expect(session.getSnapshot().loading).toBe(false);
  });

  it('serializes recovery so an older receipt cannot acknowledge the latest draft', async () => {
    let initial!: CommitRequest;
    let latest!: CommitRequest;
    const write = deferred<Result<SaveReceipt>>();
    const recovery = deferred<Result<SaveReceipt>>();
    const { session, repository } = await context(async (request) => {
      if (!initial) {
        initial = request;
        return fail('indeterminate', 'Unknown');
      }
      latest = request;
      return write.promise;
    });
    await settled(session);
    repository.reconcile = () => recovery.promise;
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    const first = session.retrySave();
    const second = session.retrySave();
    recovery.resolve(saved(initial));
    await tick();
    expect((await second).ok).toBe(false);
    expect(session.getSnapshot().saveState).toBe('saving');
    for (let i = 0; i < 30 && !latest; i++) await tick();
    write.resolve(saved(latest, 2));
    expect((await first).ok).toBe(true);
    expect(session.getSnapshot().saveState).toBe('saved');
  });

  it('does not advance its base from a recovery receipt for a different generation', async () => {
    let initial!: CommitRequest;
    const { session, repository } = await context(async (request) => {
      initial = request;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    repository.reconcile = async () =>
      ok({
        ...(saved(initial) as { ok: true; value: SaveReceipt }).value,
        generation: initial.generation + 1,
      });
    expect((await session.retrySave()).ok).toBe(false);
    expect(session.getSnapshot().saveState).toBe('reconciling');
    expect(session.getSnapshot().errors[0].code).toBe('receipt_mismatch');
  });

  it('retains an uncertain duplicate request and reconciles it without making another copy', async () => {
    let copied!: CommitRequest;
    let durableCopies = 0;
    const { session, repository } = await context(async (request) => {
      if (request.operation !== 'duplicate') return saved(request);
      copied = request;
      durableCopies++;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    await session.duplicate('Alternative');
    expect(session.getSnapshot().saveState).toBe('reconciling');
    expect(session.getSnapshot().plan?.name).toBe('My quarter');
    expect((await session.duplicate('Another')).ok).toBe(false);
    repository.reconcile = async () => saved(copied);
    expect((await session.retrySave()).ok).toBe(true);
    expect(session.getSnapshot().plan?.name).toBe('Alternative');
    expect(durableCopies).toBe(1);
  });

  it('preserves edits accepted while a duplicate is writing', async () => {
    let copied!: CommitRequest;
    const copyWrite = deferred<Result<SaveReceipt>>();
    const { session } = await context(async (request) => {
      if (request.operation !== 'duplicate') return saved(request, request.generation);
      copied = request;
      return copyWrite.promise;
    });
    await settled(session);
    const duplicating = session.duplicate('Alternative');
    for (let i = 0; i < 30 && !copied; i++) await tick();
    expect((await session.selectQuarter('other', true)).ok).toBe(false);
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    copyWrite.resolve(saved(copied));
    expect((await duplicating).ok).toBe(true);
    await settled(session);
    expect(session.getSnapshot().plan?.name).toBe('My quarter');
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    expect(session.getSnapshot().saveState).toBe('saved');
  });

  it('retries the latest corrected name after a rejected older rename', async () => {
    const rejected = deferred<Result<SaveReceipt>>();
    const { session } = await context(async (request) =>
      request.inputs.name === 'Taken' ? rejected.promise : saved(request, request.generation),
    );
    await settled(session);
    await session.edit({ type: 'rename', name: 'Taken' });
    await tick();
    await session.edit({ type: 'rename', name: 'Free' });
    rejected.resolve(fail('duplicate_name', 'Name taken'));
    await settled(session);
    expect((await session.retrySave()).ok).toBe(true);
    expect(session.getSnapshot().plan?.name).toBe('Free');
    expect(session.getSnapshot().saveState).toBe('saved');
  });
});

describe('PlanSession context integrity', () => {
  it('cancels a pending open before its late catalog response can overwrite input', async () => {
    let initial!: CommitRequest;
    const { session, repository, library, catalog } = await context(async (request) => {
      initial = request;
      return saved(request);
    });
    await settled(session);
    repository.open = async () =>
      ok({
        schemaVersion: 1,
        inputs: initial.inputs,
        revision: 1,
        receipt: (saved(initial) as { ok: true; value: SaveReceipt }).value,
        updatedAt: '2026-09-29T00:00:00Z',
      });
    const load = deferred<Awaited<ReturnType<typeof library.load>>>();
    library.load = () => load.promise;
    const opening = session.open(initial.inputs.id);
    await tick();
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    load.resolve(ok({ snapshot: catalog, retained: false }));
    expect((await opening).ok).toBe(false);
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    await settled(session);
  });

  it('cancels a pending create name check when the source changes', async () => {
    const { session, repository } = await context(async (request) => saved(request));
    await settled(session);
    const available = deferred<Result<boolean>>();
    repository.nameAvailable = () => available.promise;
    const creating = session.create('New alternative');
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    available.resolve(ok(true));
    expect((await creating).ok).toBe(false);
    expect(session.getSnapshot().plan?.name).toBe('My quarter');
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    await settled(session);
  });

  it('preserves the plan and clears loading when a catalog read throws', async () => {
    const { session, library } = await context(async (request) => saved(request));
    await settled(session);
    library.load = async () => {
      throw new Error('Read unavailable');
    };
    const result = await session.selectQuarter('other');
    expect(result.ok).toBe(false);
    expect(session.getSnapshot().plan?.name).toBe('My quarter');
    expect(session.getSnapshot().loading).toBe(false);
  });

  it('blocks navigation and editing during a confirmed deletion write', async () => {
    const { session, repository } = await context(async (request) => saved(request));
    await settled(session);
    const deleted = deferred<Result<void>>();
    repository.delete = () => deleted.promise;
    const deleting = session.deleteCurrent('My quarter');
    expect((await session.selectQuarter('other', true)).ok).toBe(false);
    expect((await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } })).ok).toBe(
      false,
    );
    deleted.resolve(ok(undefined));
    expect((await deleting).ok).toBe(true);
    expect(session.getSnapshot().plan).toBeNull();
  });

  it('retains a copy identity when its first reconciliation finds a superseding revision', async () => {
    let copied!: CommitRequest;
    const { session, repository } = await context(async (request) => {
      if (request.operation !== 'duplicate') return saved(request);
      copied = request;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    repository.reconcile = async () => fail('revision_conflict', 'Receipt superseded');
    expect((await session.duplicate('Alternative')).ok).toBe(false);
    expect(session.getSnapshot().saveState).toBe('reconciling');
    expect((await session.duplicate('Another alternative')).ok).toBe(false);
    repository.reconcile = async () => saved(copied);
    expect((await session.retrySave()).ok).toBe(true);
    expect(session.getSnapshot().plan?.name).toBe('Alternative');
  });

  it('reconciles an unexpectedly thrown save before replaying its request', async () => {
    let initial!: CommitRequest;
    let reconciled = false;
    const { session, repository } = await context(async (request) => {
      initial = request;
      if (!reconciled) throw new Error('Completion event failed');
      return saved(request);
    });
    await settled(session);
    expect(session.getSnapshot().saveState).toBe('reconciling');
    repository.reconcile = async () => {
      reconciled = true;
      return saved(initial);
    };
    expect((await session.retrySave()).ok).toBe(true);
    expect(session.getSnapshot().saveState).toBe('saved');
  });

  it('restores a rejected rename while preserving later unrelated accepted input', async () => {
    const rejected = deferred<Result<SaveReceipt>>();
    const { session } = await context(async (request) =>
      request.inputs.name === 'Taken' ? rejected.promise : saved(request, request.generation),
    );
    await settled(session);
    await session.edit({ type: 'rename', name: 'Taken' });
    await tick();
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    rejected.resolve(fail('duplicate_name', 'Name taken'));
    await settled(session);
    expect(session.getSnapshot().plan?.name).toBe('My quarter');
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    expect((await session.retrySave()).ok).toBe(true);
    expect(session.getSnapshot().saveState).toBe('saved');
  });
});

describe('PlanSession exact recovery boundaries', () => {
  it('keeps uncertain saves in recovery when receipt storage cannot be read', async () => {
    let first!: CommitRequest;
    const { session, repository } = await context(async (request) => {
      first = request;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    repository.reconcile = async () => fail('storage_denied', 'Receipt read denied');
    await session.retrySave();
    expect(session.getSnapshot().saveState).toBe('reconciling');
    repository.reconcile = async () => saved(first);
    expect((await session.retrySave()).ok).toBe(true);
  });

  it('does not replay an uncertain save after its initial receipt read fails definitely', async () => {
    let request!: CommitRequest;
    const { session, repository } = await context(async (input) => {
      request = input;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    // Start another generation after the first recovery so its commit uses this read failure.
    repository.reconcile = async () => saved(request);
    await session.retrySave();
    repository.reconcile = async () => fail('storage_denied', 'Receipt read denied');
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    await settled(session);
    expect(session.getSnapshot().saveState).toBe('reconciling');
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
  });

  it.each(['planId', 'mutationId', 'sessionId', 'fingerprint', 'catalogRef'] as const)(
    'rejects a recovery receipt with a mismatched %s',
    async (field) => {
      let request!: CommitRequest;
      const { session, repository } = await context(async (input) => {
        request = input;
        return fail('indeterminate', 'Unknown');
      });
      await settled(session);
      const receipt = (saved(request) as { ok: true; value: SaveReceipt }).value;
      const wrong = {
        ...receipt,
        [field]:
          field === 'catalogRef' ? { ...receipt.catalogRef, digest: 'different' } : 'different',
      };
      repository.reconcile = async () => ok(wrong);
      expect((await session.retrySave()).ok).toBe(false);
      expect(session.getSnapshot().saveState).toBe('reconciling');
      expect(session.getSnapshot().errors[0].code).toBe('receipt_mismatch');
    },
  );

  it('rejects a receipt with a non-advancing durable revision', async () => {
    let request!: CommitRequest;
    const { session, repository } = await context(async (input) => {
      request = input;
      return fail('indeterminate', 'Unknown');
    });
    await settled(session);
    repository.reconcile = async () =>
      ok({ ...(saved(request) as { ok: true; value: SaveReceipt }).value, revision: 0 });
    expect((await session.retrySave()).ok).toBe(false);
    expect(session.getSnapshot().saveState).toBe('reconciling');
  });

  it('downloads deeply nested supported catalog values into an independent captured snapshot', async () => {
    const { session, library } = await context(async (request) => saved(request));
    await settled(session);
    const envelope = makeFixture();
    let rule = envelope.courses[0].prerequisite;
    for (let i = 0; i < 5000; i++) rule = { kind: 'all', rules: [rule] };
    envelope.courses[0].prerequisite = rule;
    const catalog = new CatalogSnapshot(envelope, {
      quarterId: envelope.quarter.id,
      version: envelope.version,
      digest: await fingerprint(envelope),
    });
    library.load = async () => ok({ snapshot: catalog, retained: false });
    await session.selectQuarter(envelope.quarter.id);
    await session.create('Deep catalog');
    await settled(session);
    const exported = session.exportInput();
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.value.plan.name).toBe('Deep catalog');
    exported.value.plan.name = 'Download changed';
    expect(session.getSnapshot().plan?.name).toBe('Deep catalog');
    expect(
      exported.value.catalog.courses[0].prerequisite === catalog.envelope.courses[0].prerequisite,
    ).toBe(false);
  });
});

it('publishes each accepted draft with its unsaved status in the same snapshot', async () => {
  let held = false;
  let current!: CommitRequest;
  const write = deferred<Result<SaveReceipt>>();
  const { session } = await context(async (request) => {
    if (!held) return saved(request);
    current = request;
    return write.promise;
  });
  await settled(session);
  const statuses: string[] = [];
  session.subscribe(() => {
    if (session.getSnapshot().plan?.unitTarget) statuses.push(session.getSnapshot().saveState);
  });
  held = true;
  await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
  expect(statuses).not.toContain('saved');
  for (let i = 0; i < 30 && !current; i++) await tick();
  write.resolve(saved(current, 2));
  await settled(session);
  expect(session.getSnapshot().saveState).toBe('saved');
});

async function newerCatalog(old: CatalogSnapshot): Promise<CatalogSnapshot> {
  const envelope = makeFixture(old.envelope.source.publishedAt);
  envelope.version = 'fixture-v2';
  envelope.sections.find((section) => section.id === 'TEST102-A')!.availability = 'canceled';
  return new CatalogSnapshot(envelope, {
    quarterId: envelope.quarter.id,
    version: envelope.version,
    digest: await fingerprint(envelope),
  });
}

describe('PlanSession catalog review identity', () => {
  it.each(['discover', 'load', 'preview'] as const)(
    'discards an old %s response after reopening the same plan and generation',
    async (stage) => {
      let initial!: CommitRequest;
      const { session, library, repository, catalog } = await context(async (request) => {
        initial = request;
        return saved(request);
      });
      await settled(session);
      let record = {
        schemaVersion: 1 as const,
        inputs: initial.inputs,
        revision: 1,
        receipt: (saved(initial) as { ok: true; value: SaveReceipt }).value,
        updatedAt: '2026-09-29T00:00:00Z',
      };
      repository.open = async () => ok(record);
      await session.open(initial.inputs.id);
      expect(session.getSnapshot().generation).toBe(0);
      const updated = await newerCatalog(catalog);
      const gate = deferred<void>();
      let reached = false;
      const previewer = new CatalogLibrary(new ProfileStorage());
      library.discover = async () => {
        if (stage === 'discover') {
          reached = true;
          await gate.promise;
        }
        return ok({ schemaVersion: 1, quarters: [] });
      };
      library.load = async (_id, exactRef) => {
        if (exactRef) return ok({ snapshot: catalog, retained: false });
        if (stage === 'load') {
          reached = true;
          await gate.promise;
        }
        return ok({ snapshot: updated, retained: false });
      };
      library.preview = async (...args) => {
        if (stage === 'preview') {
          reached = true;
          await gate.promise;
        }
        return previewer.preview(...args);
      };
      const reviewing = session.checkCatalogUpdate();
      for (let i = 0; i < 30 && !reached; i++) await tick();
      const added = editPlan(record.inputs, { type: 'addCourse', courseId: 'TEST102' }, catalog);
      if (!added.ok) throw new Error('add fixture course');
      const selected = editPlan(
        added.value.plan,
        { type: 'setSection', courseId: 'TEST102', sectionId: 'TEST102-A' },
        catalog,
      );
      if (!selected.ok) throw new Error('select fixture section');
      record = { ...record, inputs: selected.value.plan, revision: 2 };
      await session.open(initial.inputs.id);
      expect(session.getSnapshot().generation).toBe(0);
      gate.resolve();
      expect((await reviewing).ok).toBe(false);
      expect(session.getSnapshot().adoption).toBeNull();
      expect(session.getSnapshot().plan?.selections[0].sectionIds).toEqual(['TEST102-A']);
      expect((await session.applyCatalogUpdate()).ok).toBe(false);
      expect(session.getSnapshot().catalog?.ref.version).toBe('fixture-v1');
    },
  );

  it('rejects applying a preview whose fingerprint does not match current accepted inputs', async () => {
    const { session, library, catalog } = await context(async (request) =>
      saved(request, request.generation),
    );
    await settled(session);
    const updated = await newerCatalog(catalog);
    const previewer = new CatalogLibrary(new ProfileStorage());
    library.load = async () => ok({ snapshot: updated, retained: false });
    library.preview = (...args) => previewer.preview(...args);
    await session.checkCatalogUpdate();
    const adoption = session.getSnapshot().adoption;
    if (!adoption) throw new Error('fixture preview');
    adoption.preview.fingerprint = 'different-inputs';
    expect((await session.applyCatalogUpdate()).ok).toBe(false);
    expect(session.getSnapshot().catalog?.ref.version).toBe('fixture-v1');
    expect(session.getSnapshot().errors[0].code).toBe('stale_preview');
  });

  it('rechecks draft identity after awaiting the fingerprint before adopting a catalog', async () => {
    const { session, library, catalog } = await context(async (request) =>
      saved(request, request.generation),
    );
    await settled(session);
    const updated = await newerCatalog(catalog);
    const previewer = new CatalogLibrary(new ProfileStorage());
    library.load = async () => ok({ snapshot: updated, retained: false });
    library.preview = (...args) => previewer.preview(...args);
    await session.checkCatalogUpdate();
    const applying = session.applyCatalogUpdate();
    await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
    expect((await applying).ok).toBe(false);
    expect(session.getSnapshot().catalog?.ref.version).toBe('fixture-v1');
    expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
    await settled(session);
  });
});

describe('PlanSession retry of proven aborted transactions', () => {
  it('allows a corrected copy name after a proven-aborted retry loses a name race, preserving source edits', async () => {
    const storage = new ProfileStorage(crypto.randomUUID());
    const real = new PlanRepository(storage);
    let unavailable = true;
    let rejected!: CommitRequest;
    try {
      const { session, repository } = await context(async (request) => {
        if (request.operation === 'duplicate' && unavailable) {
          rejected = request;
          return fail('indeterminate', 'Storage unavailable');
        }
        return real.commit(request);
      });
      await settled(session);
      repository.reconcile = (request) => real.reconcile(request);
      expect((await session.duplicate('Taken')).ok).toBe(false);
      const sourceId = session.getSnapshot().plan!.id;
      await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
      const competing = { ...rejected.inputs, id: crypto.randomUUID() };
      expect(
        (
          await real.commit({
            ...rejected,
            inputs: competing,
            mutationId: crypto.randomUUID(),
            fingerprint: await fingerprint(competing),
          })
        ).ok,
      ).toBe(true);
      unavailable = false;
      const retried = await session.retrySave();
      expect(retried.ok).toBe(false);
      if (!retried.ok) expect(retried.errors[0].code).toBe('duplicate_name');
      expect(session.getSnapshot().plan?.id).toBe(sourceId);
      expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
      expect((await session.duplicate('Different name')).ok).toBe(true);
      expect(session.getSnapshot().plan?.name).toBe('Different name');
      expect(session.getSnapshot().plan?.unitTarget).toEqual({ min: 12, max: 16 });
      const source = await real.open(sourceId);
      expect(source.ok).toBe(true);
      if (source.ok) expect(source.value.inputs.unitTarget).toEqual({ min: 12, max: 16 });
      const plans = await real.list();
      if (!plans.ok) throw new Error('Read fixture plans');
      expect(plans.value).toHaveLength(3);
      session.dispose();
    } finally {
      storage.close();
    }
  });

  it('reconciles an absent first create and commits its original request within one explicit retry', async () => {
    const storage = new ProfileStorage(crypto.randomUUID());
    const real = new PlanRepository(storage);
    let unavailable = true;
    let original!: CommitRequest;
    try {
      const { session, repository } = await context(async (request) => {
        if (unavailable) {
          original = request;
          return fail('indeterminate', 'Storage unavailable');
        }
        return real.commit(request);
      });
      await settled(session);
      repository.reconcile = (request) => real.reconcile(request);
      unavailable = false;
      expect((await session.retrySave()).ok).toBe(true);
      expect(session.getSnapshot().saveState).toBe('saved');
      const persisted = await real.open(original.inputs.id);
      expect(persisted.ok).toBe(true);
      if (persisted.ok) expect(persisted.value.receipt.mutationId).toBe(original.mutationId);
      session.dispose();
    } finally {
      storage.close();
    }
  });

  it('pauses an unchanged-base replacement after automatic reconciliation and retries the same mutation', async () => {
    const storage = new ProfileStorage(crypto.randomUUID());
    const real = new PlanRepository(storage);
    let unavailable = false;
    let rejected!: CommitRequest;
    try {
      const { session, repository } = await context(async (request) => {
        if (unavailable) {
          rejected = request;
          return fail('indeterminate', 'Storage unavailable');
        }
        return real.commit(request);
      });
      await settled(session);
      repository.reconcile = (request) => real.reconcile(request);
      unavailable = true;
      await session.edit({ type: 'setUnitTarget', target: { min: 12, max: 16 } });
      for (let i = 0; i < 30 && session.getSnapshot().saveState !== 'save_failed'; i++)
        await tick();
      expect(session.getSnapshot().saveState).toBe('save_failed');
      unavailable = false;
      expect((await session.retrySave()).ok).toBe(true);
      const persisted = await real.open(rejected.inputs.id);
      expect(persisted.ok).toBe(true);
      if (persisted.ok) {
        expect(persisted.value.revision).toBe(2);
        expect(persisted.value.receipt.mutationId).toBe(rejected.mutationId);
        expect(persisted.value.inputs.unitTarget).toEqual({ min: 12, max: 16 });
      }
      session.dispose();
    } finally {
      storage.close();
    }
  });

  it.each(['automatic', 'explicit'] as const)(
    'retries a copy proven aborted during %s recovery with its original plan and mutation identities',
    async (phase) => {
      const storage = new ProfileStorage(crypto.randomUUID());
      const real = new PlanRepository(storage);
      let unavailable = true;
      let rejected!: CommitRequest;
      try {
        const { session, repository } = await context(async (request) => {
          if (request.operation === 'duplicate' && unavailable) {
            rejected = request;
            return fail('indeterminate', 'Storage unavailable');
          }
          return real.commit(request);
        });
        await settled(session);
        if (phase === 'automatic') repository.reconcile = (request) => real.reconcile(request);
        expect((await session.duplicate('Alternative')).ok).toBe(false);
        expect(session.getSnapshot().saveState).toBe(
          phase === 'automatic' ? 'save_failed' : 'reconciling',
        );
        repository.reconcile = (request) => real.reconcile(request);
        expect(session.getSnapshot().plan?.name).toBe('My quarter');
        unavailable = false;
        expect((await session.retrySave()).ok).toBe(true);
        expect(session.getSnapshot().plan?.id).toBe(rejected.inputs.id);
        const persisted = await real.open(rejected.inputs.id);
        expect(persisted.ok).toBe(true);
        if (persisted.ok) expect(persisted.value.receipt.mutationId).toBe(rejected.mutationId);
        const plans = await real.list();
        if (!plans.ok) throw new Error('Read fixture plans');
        expect(plans.value).toHaveLength(2);
        session.dispose();
      } finally {
        storage.close();
      }
    },
  );
});
