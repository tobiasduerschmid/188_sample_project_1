import {
  fail,
  ok,
  type Result,
  type CatalogManifest,
  type CatalogEnvelope,
  type CatalogRef,
  type PlanInputs,
  type AdoptionPreview,
  type Course,
  type Section,
} from '../domain/types';
import { fingerprint, sameRef, stableStringify } from '../domain/identity';
import {
  ProfileStorage,
  catalogKey,
  retainCatalog,
  type RetainedCatalog,
} from '../storage/profile';
import { CatalogSnapshot } from './snapshot';
import { validateCatalog } from './boundary';

type CatalogAccess = { snapshot: CatalogSnapshot; retained: boolean; warning?: string };
const disposed = <T>(): Result<T> => fail('catalog_disposed', 'This catalog session has closed.');
const unavailable = <T>(): Result<T> =>
  fail(
    'catalog_unavailable',
    'Catalog data is unavailable. Retry the public catalog request; no usable retained version was found.',
  );
const validRef = (ref: unknown): ref is CatalogRef => {
  if (!ref || typeof ref !== 'object') return false;
  const r = ref as CatalogRef;
  return (
    typeof r.quarterId === 'string' &&
    !!r.quarterId &&
    typeof r.version === 'string' &&
    !!r.version &&
    typeof r.digest === 'string' &&
    /^[a-f0-9]{64}$/.test(r.digest)
  );
};
function manifestResult(raw: unknown): Result<CatalogManifest> {
  if (!raw || typeof raw !== 'object') return unavailable();
  const candidate = raw as CatalogManifest;
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.quarters)) return unavailable();
  const ids = new Set<string>();
  for (const quarter of candidate.quarters) {
    if (
      !quarter ||
      !validRef({ quarterId: quarter.id, version: quarter.version, digest: quarter.digest }) ||
      typeof quarter.name !== 'string' ||
      !quarter.name.trim() ||
      typeof quarter.url !== 'string' ||
      !quarter.url ||
      ids.has(quarter.id)
    )
      return unavailable();
    ids.add(quarter.id);
  }
  // Freshness flags are local observations, never trusted from the public document.
  return ok({ schemaVersion: 1, quarters: structuredClone(candidate.quarters) });
}

/** Public GET requests contain no plan inputs. Student data never crosses this boundary. */
export class CatalogLibrary {
  private readonly manifestUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly pending = new Map<string, AbortController>();
  private disposed = false;
  // One admitted snapshot per library bounds memory independently of retained storage.
  private admittedSnapshot?: CatalogSnapshot;
  constructor(
    private readonly storage: ProfileStorage,
    fetcher: typeof fetch = fetch,
    manifestUrl = '/catalog/manifest.json',
  ) {
    this.fetcher = fetcher;
    this.manifestUrl = new URL(
      manifestUrl,
      typeof location === 'undefined' ? 'http://localhost/' : location.href,
    ).href;
  }
  dispose(): void {
    this.disposed = true;
    for (const controller of this.pending.values()) controller.abort();
    this.pending.clear();
    this.admittedSnapshot = undefined;
  }
  private snapshot(envelope: CatalogEnvelope, ref: CatalogRef): CatalogSnapshot {
    // Callers must verify these bytes against ref.digest before consulting this memo.
    if (this.admittedSnapshot && sameRef(this.admittedSnapshot.ref, ref))
      return this.admittedSnapshot;
    return (this.admittedSnapshot = new CatalogSnapshot(envelope, ref));
  }
  private async publicJson(url: string, requestKey: string): Promise<Result<unknown>> {
    if (this.disposed) return disposed();
    this.pending.get(requestKey)?.abort();
    const controller = new AbortController();
    this.pending.set(requestKey, controller);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const target = new URL(url, this.manifestUrl);
      const source = new URL(this.manifestUrl);
      if (
        !['http:', 'https:'].includes(target.protocol) ||
        target.origin !== source.origin ||
        target.username ||
        target.password
      )
        return unavailable();
      const canceled = new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener(
          'abort',
          () => reject(new DOMException('Catalog read canceled or timed out', 'AbortError')),
          { once: true },
        );
        timer = setTimeout(() => controller.abort(), 10_000);
      });
      const response = (async () => {
        const fetcher = this.fetcher;
        const fetched = await fetcher(target.href, {
          method: 'GET',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
          cache: 'no-cache',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!fetched.ok) throw new Error(`Public catalog response ${fetched.status}`);
        return fetched.json() as Promise<unknown>;
      })();
      return ok(await Promise.race([response, canceled]));
    } catch {
      return this.disposed ? disposed() : unavailable();
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      if (this.pending.get(requestKey) === controller) this.pending.delete(requestKey);
    }
  }
  private async retained(exactRef?: CatalogRef): Promise<Result<RetainedCatalog[]>> {
    if (this.disposed) return disposed();
    const read = await this.storage.transact(['catalog_envelopes'], 'readonly', async (tx) => {
      if (exactRef) {
        const value = await tx.get<RetainedCatalog>('catalog_envelopes', catalogKey(exactRef));
        return value === undefined ? [] : [value];
      }
      return tx.getAll<RetainedCatalog>('catalog_envelopes');
    });
    if (this.disposed) return disposed();
    if (!read.ok) return read;
    const valid: RetainedCatalog[] = [];
    let malformed = false;
    for (const record of read.value) {
      if (
        !record ||
        record.schemaVersion !== 1 ||
        typeof record.retainedAt !== 'string' ||
        !Number.isFinite(Date.parse(record.retainedAt)) ||
        !validRef(record.ref)
      ) {
        malformed = true;
        continue;
      }
      try {
        // Hash every physical read, including memo hits: a reused reference must never hide altered storage bytes.
        if (
          (await fingerprint(record.envelope)) !== record.ref.digest ||
          record.envelope?.quarter?.id !== record.ref.quarterId ||
          record.envelope?.version !== record.ref.version ||
          ((!this.admittedSnapshot || !sameRef(this.admittedSnapshot.ref, record.ref)) &&
            !validateCatalog(record.envelope).ok)
        ) {
          malformed = true;
          continue;
        }
      } catch {
        malformed = true;
        continue;
      }
      if (exactRef && !sameRef(record.ref, exactRef))
        return fail(
          'catalog_identity_conflict',
          'A different catalog has the requested immutable version identity. Its original retained bytes were preserved.',
        );
      valid.push(record);
    }
    if (malformed && (!valid.length || exactRef))
      return fail(
        'storage_corrupt',
        'Retained catalog content is malformed or incomplete. Its original bytes were preserved; retry public retrieval.',
      );
    return ok(
      valid.sort(
        (a, b) =>
          Date.parse(b.envelope.source.publishedAt) - Date.parse(a.envelope.source.publishedAt) ||
          Date.parse(b.retainedAt) - Date.parse(a.retainedAt),
      ),
    );
  }
  private access(
    record: RetainedCatalog,
    prefix = 'Using retained catalog data.',
  ): Result<CatalogAccess> {
    if (this.disposed) return disposed();
    return ok({
      snapshot: this.snapshot(record.envelope, record.ref),
      retained: true,
      warning: `${prefix} Published ${record.envelope.source.publishedAt}; this version may be older than the current public catalog. Retry to check for updates.`,
    });
  }
  async discover(): Promise<Result<CatalogManifest>> {
    if (this.disposed) return disposed();
    const response = await this.publicJson(this.manifestUrl, 'manifest');
    if (this.disposed) return disposed();
    const manifest = response.ok ? manifestResult(response.value) : response;
    if (manifest.ok) return manifest;
    const retained = await this.retained();
    if (this.disposed) return disposed();
    if (!retained.ok || !retained.value.length) return unavailable();
    const quarters: CatalogManifest['quarters'] = [];
    const ids = new Set<string>();
    for (const item of retained.value) {
      if (ids.has(item.ref.quarterId)) continue;
      ids.add(item.ref.quarterId);
      quarters.push({
        id: item.ref.quarterId,
        name: item.envelope.quarter.name,
        version: item.ref.version,
        digest: item.ref.digest,
        url: '',
      });
    }
    return ok({
      schemaVersion: 1,
      quarters,
      retained: true,
      warning:
        'The public catalog list could not be loaded. Showing previously retained quarters; their versions may be older. Retry to check for updates.',
    });
  }
  async load(quarterId: string, exactRef?: CatalogRef): Promise<Result<CatalogAccess>> {
    if (this.disposed) return disposed();
    if (exactRef && (!validRef(exactRef) || exactRef.quarterId !== quarterId))
      return fail(
        'catalog_identity_conflict',
        'The requested exact catalog does not match this quarter.',
      );
    if (exactRef) {
      const local = await this.retained(exactRef);
      if (this.disposed) return disposed();
      if (
        !local.ok &&
        ['storage_corrupt', 'catalog_identity_conflict'].includes(local.errors[0].code)
      )
        return local;
      if (local.ok && local.value[0])
        return this.access(local.value[0], 'Using the exact catalog pinned to this saved plan.');
    }
    const manifest = await this.discover();
    if (this.disposed) return disposed();
    if (manifest.ok) {
      const entry = manifest.value.quarters.find((quarter) => quarter.id === quarterId);
      const ref = entry
        ? { quarterId: entry.id, version: entry.version, digest: entry.digest }
        : undefined;
      if (entry && ref && (!exactRef || sameRef(exactRef, ref)) && !manifest.value.retained) {
        const response = await this.publicJson(entry.url, `catalog:${quarterId}`);
        if (this.disposed) return disposed();
        if (response.ok) {
          const accepted = validateCatalog(response.value);
          if (
            accepted.ok &&
            accepted.value.quarter.id === quarterId &&
            accepted.value.version === ref.version &&
            (await fingerprint(accepted.value)) === ref.digest
          ) {
            if (this.disposed) return disposed();
            const retention = await this.storage.transact(
              ['catalog_envelopes'],
              'readwrite',
              (tx) => retainCatalog(tx, accepted.value, ref),
            );
            if (this.disposed) return disposed();
            if (!retention.ok && retention.errors[0].code === 'catalog_identity_conflict')
              return retention;
            const warning = retention.ok
              ? undefined
              : 'This catalog is available in this session, but browser storage could not retain it for later recovery. Saving a plan may fail; keep this tab open and use summary download if needed.';
            return ok({ snapshot: this.snapshot(accepted.value, ref), retained: false, warning });
          }
        }
      }
    }
    const fallback = await this.retained(exactRef);
    if (this.disposed) return disposed();
    if (!fallback.ok)
      return fallback.errors[0].code === 'storage_corrupt' ||
        fallback.errors[0].code === 'catalog_identity_conflict'
        ? fallback
        : unavailable();
    const item = fallback.value.find((record) => record.ref.quarterId === quarterId);
    return item
      ? this.access(item, 'Public retrieval failed. Using retained catalog data.')
      : unavailable();
  }
  async preview(
    plan: PlanInputs,
    generation: number,
    oldCatalog: CatalogSnapshot,
    newCatalog: CatalogSnapshot,
  ): Promise<AdoptionPreview> {
    const captured = structuredClone(plan);
    const changes: string[] = [];
    const changed = (a: unknown, b: unknown): boolean => stableStringify(a) !== stableStringify(b);
    const seenCourses = new Set<string>();
    const newIdentities = new Map<string, string[]>();
    for (const selection of captured.selections) {
      const id = selection.courseId;
      const previous = oldCatalog.course(id);
      const next = newCatalog.course(id);
      const label = previous ? `${previous.subject} ${previous.code} (${id})` : id;
      if (!next)
        changes.push(
          `${label}: course identity is removed or unresolved; preserve all selections for review.`,
        );
      else {
        const canonical = newCatalog.resolveId(id)!;
        const group = newIdentities.get(canonical) ?? [];
        group.push(id);
        newIdentities.set(canonical, group);
        if (oldCatalog.resolveId(id) !== canonical)
          changes.push(`${label}: canonical course identity changed to ${canonical}.`);
        const fields: { key: keyof Course; label: string }[] = [
          { key: 'units', label: 'allowed units' },
          { key: 'prerequisite', label: 'prerequisite rule' },
          { key: 'corequisite', label: 'corequisite rule' },
          { key: 'requiredComponents', label: 'required component structure' },
        ];
        if (!seenCourses.has(canonical))
          for (const field of fields)
            if (changed(previous?.[field.key], next[field.key]))
              changes.push(`${label}: ${field.label} changed.`);
        seenCourses.add(canonical);
        if (selection.units !== null && !next.units.includes(selection.units))
          changes.push(
            `${label}: chosen ${selection.units} units are no longer allowed and remain visible as unresolved.`,
          );
      }
      for (const sectionId of selection.sectionIds) {
        const before = oldCatalog.envelope.sections.find((section) => section.id === sectionId);
        const after = newCatalog.envelope.sections.find((section) => section.id === sectionId);
        if (!after) {
          changes.push(
            `${label}, section ${sectionId}: removed; preserve its identity and last known details.`,
          );
          continue;
        }
        const fields: { key: keyof Section; label: string }[] = [
          { key: 'meetings', label: 'class meetings' },
          { key: 'exams', label: 'examination meetings' },
          { key: 'compatibleWith', label: 'section compatibility links' },
          { key: 'component', label: 'component type' },
          { key: 'courseId', label: 'course identity' },
          { key: 'quarterId', label: 'quarter identity' },
          { key: 'instructors', label: 'instructors' },
          { key: 'location', label: 'location' },
          { key: 'modality', label: 'modality' },
        ];
        for (const field of fields)
          if (changed(before?.[field.key], after[field.key]))
            changes.push(`${label}, section ${sectionId}: ${field.label} changed.`);
        if (before?.availability !== after.availability)
          changes.push(
            `${label}, section ${sectionId}: availability changed from ${before?.availability ?? 'unresolved'} to ${after.availability}.`,
          );
      }
    }
    for (const [identity, group] of newIdentities)
      if (group.length > 1)
        changes.push(
          `${group.join(', ')} now resolve to the same course ${identity}; retain original choices for reconciliation.`,
        );
    const checkIdentity = (id: string, context: string, unmapped = false) => {
      const before = oldCatalog.resolveId(id);
      const after = newCatalog.resolveId(id);
      if (unmapped || !after)
        changes.push(`${context}: ${id} is unresolved in the new catalog and will be retained.`);
      else if (before !== after)
        changes.push(
          `${context}: ${id} now resolves to ${after}; its original identity will be retained.`,
        );
    };
    for (const history of captured.history)
      checkIdentity(
        history.courseId,
        'Coursework history',
        history.unmapped ||
          (history.unmapped === undefined && oldCatalog.resolveId(history.courseId) === null),
      );
    for (const target of captured.targets)
      for (const id of target.courseIds) checkIdentity(id, `Target ${target.name}`);
    return {
      planId: captured.id,
      generation,
      oldRef: structuredClone(oldCatalog.ref),
      newRef: structuredClone(newCatalog.ref),
      fingerprint: await fingerprint(captured),
      changes: [...new Set(changes)],
    };
  }
}
