import { link, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fingerprint, stableStringify } from '../src/domain/identity';
import { validateCatalog } from '../src/catalog/boundary';
import { fail, ok, type CatalogManifest, type CatalogRef, type Result } from '../src/domain/types';
export interface PublicationOptions {
  expectedRevision?: string;
  activate?: (stage: string, destination: string) => Promise<void>;
}
export interface PublicationReceipt {
  ref: CatalogRef;
  manifest: CatalogManifest;
  manifestRevision: string;
  url: string;
}

const isMissing = (error: unknown): boolean => (error as NodeJS.ErrnoException)?.code === 'ENOENT';
async function optionalRead(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}
async function durableWrite(path: string, content: string): Promise<void> {
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}
function acceptedManifest(text: string | null): CatalogManifest {
  if (text === null) return { schemaVersion: 1, quarters: [] };
  const raw = JSON.parse(text) as CatalogManifest;
  if (raw?.schemaVersion !== 1 || !Array.isArray(raw.quarters))
    throw new Error('Existing manifest is malformed; repair it before publishing.');
  const ids = new Set<string>();
  for (const q of raw.quarters) {
    if (
      !q ||
      ![q.id, q.name, q.version, q.url].every((v) => typeof v === 'string' && v.trim()) ||
      !/^[a-f0-9]{64}$/.test(q.digest) ||
      ids.has(q.id)
    )
      throw new Error('Existing manifest contains invalid or duplicate quarter entries.');
    ids.add(q.id);
  }
  return {
    schemaVersion: 1,
    quarters: raw.quarters.map((q) => ({
      id: q.id,
      name: q.name,
      version: q.version,
      url: q.url,
      digest: q.digest,
    })),
  };
}

/** The Node-only publication capability is never imported into the browser. */
export async function publishCatalog(
  raw: unknown,
  directory = 'public/catalog',
  options: PublicationOptions = {},
): Promise<Result<PublicationReceipt>> {
  const accepted = validateCatalog(raw);
  if (!accepted.ok) return accepted;
  const envelope = accepted.value;
  const dir = resolve(directory);
  const manifestPath = join(dir, 'manifest.json');
  const lockPath = join(dir, '.publish.lock');
  let ownsLock = false;
  const cleanup: string[] = [];
  try {
    await mkdir(dir, { recursive: true });
    try {
      await durableWrite(lockPath, `${process.pid}\n`);
      ownsLock = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'EEXIST')
        return fail(
          'publication_busy',
          'Another catalog publisher holds the publication lock. Retry after it finishes. If it crashed, verify it has stopped before removing .publish.lock.',
        );
      throw error;
    }
    const priorText = await optionalRead(manifestPath);
    const prior = acceptedManifest(priorText);
    const priorRevision = priorText === null ? 'absent' : await fingerprint(prior);
    if (options.expectedRevision !== undefined && options.expectedRevision !== priorRevision)
      return fail(
        'publication_conflict',
        'The manifest changed since it was reviewed. Read the active manifest and retry; no active version was changed.',
      );
    const digest = await fingerprint(envelope);
    const ref = { quarterId: envelope.quarter.id, version: envelope.version, digest };
    // A hash of identity, not user-controlled path fragments, prevents traversal and filename limits.
    const filename = `${await fingerprint([ref.quarterId, ref.version])}.json`;
    const url = `versions/${filename}`;
    await mkdir(join(dir, 'versions'), { recursive: true });
    const versionPath = join(dir, url);
    const existing = await optionalRead(versionPath);
    if (existing !== null) {
      let unchanged = false;
      try {
        unchanged = (await fingerprint(JSON.parse(existing))) === digest;
      } catch {
        /* Preserve corrupt immutable bytes for maintainer inspection. */
      }
      if (!unchanged)
        return fail(
          'version_reused',
          `Quarter ${ref.quarterId} version ${ref.version} already exists with different content. Publish a new version; the existing version and manifest were preserved.`,
        );
    } else {
      const stagedVersion = join(dir, 'versions', `.stage-${crypto.randomUUID()}.json`);
      cleanup.push(stagedVersion);
      await durableWrite(stagedVersion, `${stableStringify(envelope)}\n`);
      await link(stagedVersion, versionPath); // Exclusive creation; a published version is never overwritten.
    }
    const entry = {
      id: ref.quarterId,
      name: envelope.quarter.name,
      version: ref.version,
      url,
      digest,
    };
    const manifest: CatalogManifest = {
      schemaVersion: 1,
      quarters: [...prior.quarters.filter((q) => q.id !== ref.quarterId), entry].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    };
    const manifestRevision = await fingerprint(manifest);
    const receipt = { ref, manifest, manifestRevision, url };
    const stagedManifest = join(dir, `.manifest-${crypto.randomUUID()}.json`);
    cleanup.push(stagedManifest);
    await durableWrite(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`);
    // All participating publishers hold the lock. This comparison also detects intervening external edits.
    if ((await optionalRead(manifestPath)) !== priorText)
      return fail(
        'publication_conflict',
        'The active manifest changed while staging. The new immutable content is retained, but activation was not attempted. Re-read before retrying.',
      );
    try {
      await (options.activate ?? rename)(stagedManifest, manifestPath);
    } catch (error) {
      try {
        const observed = await optionalRead(manifestPath);
        if (
          observed !== null &&
          stableStringify(acceptedManifest(observed)) === stableStringify(manifest)
        )
          return ok(receipt);
        if (observed === priorText)
          return fail(
            'publication_failed',
            `Activation failed and read-back confirmed the previous manifest remains active: ${error instanceof Error ? error.message : String(error)}`,
          );
      } catch {
        /* Unknown activation outcome must not be advertised as unchanged. */
      }
      return fail(
        'activation_indeterminate',
        'Activation could not be confirmed. Keep this quarter/version unchanged and inspect manifest.json to verify its digest before retrying. Do not publish a substitute version.',
      );
    }
    // A receipt follows read-back, not merely a successful rename call.
    try {
      if (
        stableStringify(acceptedManifest(await optionalRead(manifestPath))) ===
        stableStringify(manifest)
      )
        return ok(receipt);
    } catch {
      /* Returned below as an explicit indeterminate activation. */
    }
    return fail(
      'activation_indeterminate',
      'Activation completed but the active manifest could not be verified. Inspect manifest.json before another publication.',
    );
  } catch (error) {
    return fail(
      'publication_failed',
      `Catalog publication did not activate a new manifest: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    for (const path of cleanup)
      try {
        await unlink(path);
      } catch {
        /* Temporary-file cleanup does not alter activation truth. */
      }
    if (ownsLock)
      try {
        await unlink(lockPath);
      } catch {
        /* A stale lock is an explicit retry condition. */
      }
  }
}

async function main(): Promise<void> {
  const [command, input, directory, expectedRevision] = process.argv.slice(2);
  if (!['validate', 'publish'].includes(command) || !input) {
    console.error(
      'Usage: npm run catalog:validate -- input.json\n       npm run catalog:publish -- input.json [public/catalog] [expected-manifest-digest]',
    );
    process.exitCode = 2;
    return;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(resolve(input), 'utf8'));
  } catch (error) {
    console.error(`catalog_input: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }
  const result =
    command === 'validate'
      ? validateCatalog(raw)
      : await publishCatalog(raw, directory, { expectedRevision });
  if (!result.ok) {
    for (const error of result.errors) console.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
  } else if (command === 'validate') console.log('Catalog valid. No public files were changed.');
  else console.log(JSON.stringify(result.value, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  void main();
