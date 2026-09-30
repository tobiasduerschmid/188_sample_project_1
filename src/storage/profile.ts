import {
  fail,
  ok,
  type CatalogEnvelope,
  type CatalogRef,
  type Problem,
  type Result,
} from '../domain/types';
import { sameRef, stableStringify } from '../domain/identity';

export const STORES = [
  'plan_records',
  'quarter_name_index',
  'catalog_envelopes',
  'deletion_markers',
] as const;
export type StoreName = (typeof STORES)[number];
export interface ProfileTransaction {
  get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined>;
  getAll<T>(store: StoreName): Promise<T[]>;
  put(store: StoreName, key: IDBValidKey, value: unknown): Promise<void>;
  delete(store: StoreName, key: IDBValidKey): Promise<void>;
  count(store: StoreName): Promise<number>;
}
export interface RetainedCatalog {
  schemaVersion: 1;
  ref: CatalogRef;
  envelope: CatalogEnvelope;
  retainedAt: string;
}
export const catalogKey = (ref: CatalogRef): string => JSON.stringify([ref.quarterId, ref.version]);
/** A typed expected rejection aborts the transaction, preserving all prior records. */
export class StorageFault extends Error {
  readonly problem: Problem;
  constructor(code: string, message: string, field?: string) {
    super(message);
    this.name = 'StorageFault';
    this.problem = { code, message, field, recovery: ['retry', 'download_summary'] };
  }
}
export function storageFailure<T>(error: unknown): Result<T> {
  if (error instanceof StorageFault) return { ok: false, errors: [error.problem] };
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  if (name === 'QuotaExceededError')
    return fail(
      'storage_full',
      'Browser storage is full. Existing saved records were preserved; download your current inputs or free space and retry.',
    );
  if (['SecurityError', 'NotAllowedError', 'InvalidStateError'].includes(name))
    return fail(
      'storage_denied',
      'Browser storage is unavailable. Keep this tab open and download your current inputs.',
    );
  if (name === 'DataError' || name === 'DataCloneError' || name === 'VersionError')
    return fail(
      'storage_corrupt',
      'Stored data could not be read or written safely. Existing records were preserved.',
    );
  if (name === 'AbortError')
    return fail(
      'storage_aborted',
      'The storage transaction was aborted. No partial changes were saved; retry or download your current inputs.',
    );
  return fail(
    'interrupted_or_indeterminate',
    'The storage outcome could not be confirmed. Reconcile the saved receipt before retrying; keep your current inputs.',
  );
}
const request = <T>(req: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new DOMException('Storage request failed', 'UnknownError'));
  });

/** The adapter owns transaction completion. Operations must await only this transaction's requests. */
export class ProfileStorage {
  private database?: Promise<IDBDatabase>;
  constructor(readonly dbName = 'quarterly-class-planner') {}
  private connect(): Promise<IDBDatabase> {
    if (!this.database) {
      this.database = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
          reject(new DOMException('IndexedDB is unavailable', 'SecurityError'));
          return;
        }
        const opening = indexedDB.open(this.dbName, 1);
        let rejected = false;
        opening.onupgradeneeded = () => {
          for (const name of STORES)
            if (!opening.result.objectStoreNames.contains(name))
              opening.result.createObjectStore(name);
        };
        opening.onerror = () => {
          rejected = true;
          reject(opening.error);
        };
        opening.onblocked = () => {
          rejected = true;
          reject(
            new StorageFault(
              'storage_denied',
              'Another tab is blocking browser storage. Close the older tab and retry.',
            ),
          );
        };
        opening.onsuccess = () => {
          const db = opening.result;
          if (rejected) {
            db.close();
            return;
          }
          db.onversionchange = () => {
            db.close();
            this.database = undefined;
          };
          resolve(db);
        };
      });
      this.database.catch(() => {
        this.database = undefined;
      });
    }
    return this.database;
  }
  close(): void {
    const database = this.database;
    this.database = undefined;
    if (database) void database.then((db) => db.close()).catch(() => {});
  }
  async transact<T>(
    stores: StoreName[],
    mode: IDBTransactionMode,
    operation: (tx: ProfileTransaction) => Promise<T>,
  ): Promise<Result<T>> {
    try {
      const db = await this.connect();
      const transaction = db.transaction(stores, mode);
      const completion = new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onabort = () =>
          reject(
            transaction.error ?? new DOMException('Storage transaction aborted', 'AbortError'),
          );
      });
      // Handle abort even when the operation rejects before we reach the completion await.
      void completion.catch(() => {});
      const tx: ProfileTransaction = {
        get: <V>(store: StoreName, key: IDBValidKey) =>
          request<V | undefined>(transaction.objectStore(store).get(key)),
        getAll: <V>(store: StoreName) => request<V[]>(transaction.objectStore(store).getAll()),
        put: async (store, key, value) => {
          await request(transaction.objectStore(store).put(value, key));
        },
        delete: async (store, key) => {
          await request(transaction.objectStore(store).delete(key));
        },
        count: (store) => request(transaction.objectStore(store).count()),
      };
      let value: T;
      try {
        value = await operation(tx);
      } catch (error) {
        try {
          transaction.abort();
        } catch {
          /* A finished/aborted transaction cannot be aborted again. */
        }
        await completion.catch(() => {});
        return storageFailure(error);
      }
      await completion;
      return ok(value);
    } catch (error) {
      return storageFailure(error);
    }
  }
}

/** Immutable content is checked inside the same transaction that will pin it to a plan. */
export async function retainCatalog(
  tx: ProfileTransaction,
  envelope: CatalogEnvelope,
  ref: CatalogRef,
): Promise<void> {
  const key = catalogKey(ref);
  const prior = await tx.get<RetainedCatalog>('catalog_envelopes', key);
  if (prior) {
    if (prior.schemaVersion !== 1 || !prior.ref || !prior.envelope)
      throw new StorageFault(
        'storage_corrupt',
        'The retained catalog record is malformed. Its original bytes were preserved.',
      );
    if (!sameRef(prior.ref, ref) || stableStringify(prior.envelope) !== stableStringify(envelope))
      throw new StorageFault(
        'catalog_identity_conflict',
        'This catalog version already has different content. The retained version and saved plans were preserved.',
      );
    return;
  }
  await tx.put('catalog_envelopes', key, {
    schemaVersion: 1,
    ref,
    envelope,
    retainedAt: new Date().toISOString(),
  } satisfies RetainedCatalog);
}
