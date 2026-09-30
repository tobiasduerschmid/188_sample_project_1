import { fingerprint, sameRef, stableStringify, clonePlain } from '../domain/identity';
import { restorePlan, validateName } from '../domain/plan';
import {
  fail,
  ok,
  type Result,
  type PlanListItem,
  type StoredPlan,
  type CommitRequest,
  type SaveReceipt,
  type CatalogEnvelope,
  type CatalogRef,
} from '../domain/types';
import { validateCatalog } from '../catalog/boundary';
import { CatalogSnapshot } from '../catalog/snapshot';
import {
  ProfileStorage,
  StorageFault,
  STORES,
  retainCatalog,
  storageFailure,
  catalogKey,
  type RetainedCatalog,
} from './profile';

interface DeletionMarker {
  schemaVersion: 1;
  planId: string;
  revision: number;
  mutationId: string;
  expectedRevision: number;
  deletedAt: string;
}
const nameKey = (quarter: string, name: string): string =>
  JSON.stringify([quarter, name.trim().toLocaleLowerCase('en-US')]);
function stored(raw: unknown): StoredPlan {
  if (!raw || typeof raw !== 'object')
    throw new StorageFault(
      'storage_corrupt',
      'The saved plan is malformed. Original records were preserved.',
    );
  const record = raw as StoredPlan;
  const inputs = restorePlan(record.inputs);
  if (
    record.schemaVersion !== 1 ||
    !inputs.ok ||
    !Number.isInteger(record.revision) ||
    record.revision < 1 ||
    typeof record.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(record.updatedAt)) ||
    !record.receipt
  )
    throw new StorageFault(
      'storage_corrupt',
      'The saved plan schema or inputs are invalid. Original records were preserved.',
    );
  const receipt = record.receipt;
  if (
    receipt.planId !== record.inputs.id ||
    receipt.revision !== record.revision ||
    !receipt.catalogRef ||
    !sameRef(receipt.catalogRef, record.inputs.catalogRef) ||
    typeof receipt.mutationId !== 'string' ||
    !receipt.mutationId ||
    typeof receipt.sessionId !== 'string' ||
    !Number.isInteger(receipt.generation) ||
    receipt.generation < 0 ||
    !/^[a-f0-9]{64}$/.test(receipt.fingerprint)
  )
    throw new StorageFault(
      'storage_corrupt',
      'The saved receipt does not identify this complete plan revision. Original records were preserved.',
    );
  return record;
}
function deletion(raw: unknown): DeletionMarker | undefined {
  if (raw === undefined) return undefined;
  const marker = raw as DeletionMarker;
  if (
    !marker ||
    marker.schemaVersion !== 1 ||
    typeof marker.planId !== 'string' ||
    !Number.isInteger(marker.revision) ||
    typeof marker.mutationId !== 'string' ||
    !Number.isInteger(marker.expectedRevision)
  )
    throw new StorageFault(
      'storage_corrupt',
      'A deletion marker is malformed. Original records were preserved.',
    );
  return marker;
}
function matches(receipt: SaveReceipt, req: CommitRequest): boolean {
  return (
    receipt.mutationId === req.mutationId &&
    receipt.fingerprint === req.fingerprint &&
    receipt.planId === req.inputs.id &&
    receipt.sessionId === req.sessionId &&
    receipt.generation === req.generation &&
    sameRef(receipt.catalogRef, req.inputs.catalogRef) &&
    receipt.revision === (req.expectedRevision ?? 0) + 1
  );
}
async function verified(
  req: CommitRequest,
  snapshot: (catalog: CatalogEnvelope, ref: CatalogRef) => CatalogSnapshot,
): Promise<Result<CommitRequest>> {
  try {
    const frozen = clonePlain(req);
    if (
      !restorePlan(frozen.inputs).ok ||
      !['create', 'replace', 'duplicate'].includes(frozen.operation) ||
      !frozen.mutationId ||
      !frozen.sessionId ||
      !Number.isInteger(frozen.generation) ||
      frozen.generation < 0
    )
      return fail(
        'invalid_plan',
        'The complete plan and mutation identity are required before saving.',
      );
    if (
      frozen.operation === 'replace'
        ? !Number.isInteger(frozen.expectedRevision) || (frozen.expectedRevision ?? 0) < 1
        : frozen.expectedRevision !== null
    )
      return fail('revision_conflict', 'This operation has an invalid saved revision.');
    // Hashing finishes before starting an IndexedDB transaction so it cannot auto-close while waiting for Web Crypto.
    if ((await fingerprint(frozen.inputs)) !== frozen.fingerprint)
      return fail(
        'fingerprint_mismatch',
        'The save request no longer matches its captured inputs. Nothing was saved.',
      );
    // CatalogLibrary admitted this envelope. Persistence verifies identity without repeating every public meeting expansion on each autosave.
    const ref = frozen.inputs.catalogRef;
    if (
      ref.quarterId !== frozen.inputs.quarterId ||
      ref.quarterId !== frozen.catalog.quarter.id ||
      ref.version !== frozen.catalog.version ||
      ref.digest !== (await fingerprint(frozen.catalog))
    )
      return fail(
        'catalog_identity_conflict',
        'The saved plan must identify the exact catalog content supplied with it.',
      );
    const restored = restorePlan(frozen.inputs, snapshot(frozen.catalog, ref));
    if (!restored.ok) return restored;
    return ok(frozen);
  } catch (error) {
    return storageFailure(error);
  }
}

export class PlanRepository {
  // Retain one admitted interpretation; every commit/open still verifies the catalog bytes.
  private admittedSnapshot?: CatalogSnapshot;
  private snapshot = (envelope: CatalogEnvelope, ref: CatalogRef): CatalogSnapshot => {
    if (this.admittedSnapshot && sameRef(this.admittedSnapshot.ref, ref))
      return this.admittedSnapshot;
    return (this.admittedSnapshot = new CatalogSnapshot(envelope, ref));
  };
  constructor(private readonly storage: ProfileStorage) {}
  async list(): Promise<Result<PlanListItem[]>> {
    return this.storage.transact(['plan_records'], 'readonly', async (tx) => {
      const records = (await tx.getAll<unknown>('plan_records')).map(stored);
      return records
        .map((record) => ({
          id: record.inputs.id,
          name: record.inputs.name,
          quarterId: record.inputs.quarterId,
          revision: record.revision,
          updatedAt: record.updatedAt,
        }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
    });
  }
  async open(id: string): Promise<Result<StoredPlan>> {
    const result = await this.storage.transact(
      ['plan_records', 'deletion_markers', 'catalog_envelopes'],
      'readonly',
      async (tx) => {
        if (deletion(await tx.get('deletion_markers', id)))
          throw new StorageFault(
            'deleted_plan',
            'This plan was deleted in another tab. Preserve current inputs as a new plan or download them.',
          );
        const raw = await tx.get('plan_records', id);
        if (!raw) throw new StorageFault('plan_not_found', 'This saved plan could not be found.');
        const record = stored(raw);
        if (record.inputs.id !== id)
          throw new StorageFault(
            'storage_corrupt',
            'The saved identity does not match its storage key.',
          );
        const retained = await tx.get<RetainedCatalog>(
          'catalog_envelopes',
          catalogKey(record.inputs.catalogRef),
        );
        return { record, retained };
      },
    );
    if (!result.ok) return result;
    const { record, retained } = result.value;
    try {
      if (
        (await fingerprint(record.inputs)) !== record.receipt.fingerprint ||
        !retained ||
        retained.schemaVersion !== 1 ||
        !retained.ref ||
        !sameRef(retained.ref, record.inputs.catalogRef) ||
        (await fingerprint(retained.envelope)) !== retained.ref.digest ||
        ((!this.admittedSnapshot || !sameRef(this.admittedSnapshot.ref, retained.ref)) &&
          !validateCatalog(retained.envelope).ok)
      )
        return fail(
          'storage_corrupt',
          'The saved plan or its exact retained catalog is incomplete or corrupted. Original records were preserved.',
        );
      const restored = restorePlan(record.inputs, this.snapshot(retained.envelope, retained.ref));
      if (!restored.ok)
        return fail(
          'storage_corrupt',
          'The saved inputs no longer satisfy their exact catalog constraints. Original records were preserved.',
        );
      return ok({ ...record, inputs: restored.value });
    } catch {
      return fail(
        'storage_corrupt',
        'The saved plan or catalog could not be verified. Original records were preserved.',
      );
    }
  }
  async nameAvailable(
    name: string,
    quarterId: string,
    exceptId?: string,
  ): Promise<Result<boolean>> {
    const checked = validateName(name);
    if (!checked.ok) return checked;
    return this.storage.transact(['plan_records'], 'readonly', async (tx) => {
      const records = (await tx.getAll<unknown>('plan_records')).map(stored);
      return !records.some(
        (record) =>
          record.inputs.id !== exceptId &&
          nameKey(record.inputs.quarterId, record.inputs.name) ===
            nameKey(quarterId, checked.value),
      );
    });
  }
  async commit(request: CommitRequest): Promise<Result<SaveReceipt>> {
    const checked = await verified(request, this.snapshot);
    if (!checked.ok) return checked;
    const req = checked.value;
    return this.storage.transact([...STORES], 'readwrite', async (tx) => {
      const id = req.inputs.id;
      if (deletion(await tx.get('deletion_markers', id)))
        throw new StorageFault(
          'deleted_plan',
          'This plan was deleted. Saving requires a new identity and name; current inputs remain in this tab.',
        );
      const raw = await tx.get('plan_records', id);
      const current = raw === undefined ? undefined : stored(raw);
      if (current && current.inputs.id !== id)
        throw new StorageFault(
          'storage_corrupt',
          'The saved identity does not match its storage key.',
        );
      if (current?.receipt.mutationId === req.mutationId) {
        if (!matches(current.receipt, req))
          throw new StorageFault(
            'mutation_conflict',
            'A mutation identifier was reused for different inputs or a different generation.',
          );
        if (stableStringify(current.inputs) !== stableStringify(req.inputs))
          throw new StorageFault(
            'storage_corrupt',
            'The saved inputs no longer match their acknowledged receipt. Original records were preserved.',
          );
        return current.receipt;
      }
      if (
        (req.operation === 'replace' && (!current || current.revision !== req.expectedRevision)) ||
        (req.operation !== 'replace' && current)
      )
        throw new StorageFault(
          'revision_conflict',
          'Another tab changed this plan. Load the newer revision, preserve a separately named copy, or download your current inputs.',
        );
      if (current && current.inputs.quarterId !== req.inputs.quarterId)
        throw new StorageFault(
          'quarter_mismatch',
          'A saved plan cannot change its original quarter.',
        );
      const records = (await tx.getAll<unknown>('plan_records')).map(stored);
      if (records.some((record) => record.receipt.mutationId === req.mutationId))
        throw new StorageFault(
          'mutation_conflict',
          'This mutation identifier already belongs to a different saved operation.',
        );
      const key = nameKey(req.inputs.quarterId, req.inputs.name);
      if (
        records.some(
          (record) =>
            record.inputs.id !== id && nameKey(record.inputs.quarterId, record.inputs.name) === key,
        )
      )
        throw new StorageFault(
          'duplicate_name',
          'A plan with this name already exists in this quarter. Choose another name.',
          'name',
        );
      const owner = await tx.get<string>('quarter_name_index', key);
      if (owner !== undefined && owner !== id)
        throw new StorageFault(
          'duplicate_name',
          'A plan with this name already exists in this quarter. Choose another name.',
          'name',
        );
      if (!current && (await tx.count('plan_records')) >= 20)
        throw new StorageFault(
          'plan_capacity',
          'This browser profile already has 20 saved plans. Download your current inputs or delete an unwanted saved plan before creating a copy.',
        );
      await retainCatalog(tx, req.catalog, req.inputs.catalogRef);
      const revision = (current?.revision ?? 0) + 1;
      const receipt: SaveReceipt = {
        planId: id,
        mutationId: req.mutationId,
        sessionId: req.sessionId,
        generation: req.generation,
        fingerprint: req.fingerprint,
        revision,
        catalogRef: req.inputs.catalogRef,
      };
      const record: StoredPlan = {
        schemaVersion: 1,
        inputs: req.inputs,
        revision,
        receipt,
        updatedAt: new Date().toISOString(),
      };
      if (current)
        await tx.delete(
          'quarter_name_index',
          nameKey(current.inputs.quarterId, current.inputs.name),
        );
      await tx.put('quarter_name_index', key, id);
      await tx.put('plan_records', id, record);
      return receipt;
    });
  }
  async delete(id: string, expectedRevision: number, mutationId: string): Promise<Result<void>> {
    if (!id || !mutationId || !Number.isInteger(expectedRevision) || expectedRevision < 1)
      return fail('revision_conflict', 'Deletion requires the currently displayed saved revision.');
    return this.storage.transact([...STORES], 'readwrite', async (tx) => {
      const marker = deletion(await tx.get('deletion_markers', id));
      if (marker) {
        if (marker.mutationId === mutationId && marker.expectedRevision === expectedRevision)
          return;
        throw new StorageFault('deleted_plan', 'This plan was already deleted.');
      }
      const raw = await tx.get('plan_records', id);
      if (!raw) throw new StorageFault('plan_not_found', 'This saved plan no longer exists.');
      const current = stored(raw);
      if (current.revision !== expectedRevision)
        throw new StorageFault(
          'revision_conflict',
          'Another tab saved a newer version. Review it before confirming deletion again.',
        );
      await tx.delete('plan_records', id);
      await tx.delete('quarter_name_index', nameKey(current.inputs.quarterId, current.inputs.name));
      await tx.put('deletion_markers', id, {
        schemaVersion: 1,
        planId: id,
        revision: expectedRevision + 1,
        expectedRevision,
        mutationId,
        deletedAt: new Date().toISOString(),
      } satisfies DeletionMarker);
    });
  }
  async reconcile(request: CommitRequest): Promise<Result<SaveReceipt>> {
    const checked = await verified(request, this.snapshot);
    if (!checked.ok) return checked;
    const req = checked.value;
    type Observation =
      { kind: 'committed'; receipt: SaveReceipt } | { kind: 'aborted'; prior?: StoredPlan };
    const read = await this.storage.transact<Observation>(
      ['plan_records', 'deletion_markers'],
      'readonly',
      async (tx) => {
        if (deletion(await tx.get('deletion_markers', req.inputs.id)))
          throw new StorageFault(
            'deleted_plan',
            'This plan has been deleted. Do not repeat its prior save.',
          );
        const raw = await tx.get('plan_records', req.inputs.id);
        if (raw === undefined) {
          if (req.expectedRevision === null) return { kind: 'aborted' };
          throw new StorageFault(
            'interrupted_or_indeterminate',
            'The expected saved revision is missing without a deletion marker. Keep the current inputs and download them; no write was automatically repeated.',
          );
        }
        const current = stored(raw);
        if (current.inputs.id !== req.inputs.id)
          throw new StorageFault(
            'storage_corrupt',
            'The saved identity does not match its storage key. Original records were preserved.',
          );
        if (current.receipt.mutationId === req.mutationId) {
          if (!matches(current.receipt, req))
            throw new StorageFault(
              'mutation_conflict',
              'The durable receipt belongs to different inputs or a different generation.',
            );
          if (stableStringify(current.inputs) !== stableStringify(req.inputs))
            throw new StorageFault(
              'storage_corrupt',
              'The saved inputs no longer match their acknowledged receipt. Original records were preserved.',
            );
          return { kind: 'committed', receipt: current.receipt };
        }
        if (current.revision !== req.expectedRevision)
          throw new StorageFault(
            'revision_conflict',
            'The saved revision has changed and the uncertain receipt is no longer available. Preserve current inputs separately or load the saved revision.',
          );
        return { kind: 'aborted', prior: current };
      },
    );
    if (!read.ok) return read;
    if (read.value.kind === 'committed') return ok(read.value.receipt);
    // Physical read completion established absence or the unchanged base. Hash outside the transaction;
    // a subsequent retry must still compare that same expected revision atomically.
    try {
      if (
        read.value.prior &&
        (await fingerprint(read.value.prior.inputs)) !== read.value.prior.receipt.fingerprint
      )
        return fail(
          'storage_corrupt',
          'The unchanged saved revision has corrupted inputs. Original records were preserved.',
        );
    } catch {
      return fail(
        'storage_corrupt',
        'The unchanged saved revision could not be verified. Original records were preserved.',
      );
    }
    return fail(
      'known_aborted',
      'The completed storage read confirms this save did not commit. Retry the exact original request with the same mutation identifier and expected revision.',
    );
  }
}
