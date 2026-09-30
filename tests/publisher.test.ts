import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { publishCatalog } from '../scripts/catalog';
import { makeFixture } from '../src/fixtures/catalog';
import type { Rule } from '../src/domain/types';
const directories: string[] = [];
async function directory() {
  const dir = await mkdtemp(join(tmpdir(), 'quarter-publish-'));
  directories.push(dir);
  return dir;
}
afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
describe('atomic public publication', () => {
  it('publishes immutable catalog content before activation and retains both quarters', async () => {
    const dir = await directory();
    const first = makeFixture();
    const result = await publishCatalog(first, dir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
    expect(manifest.quarters).toHaveLength(1);
    expect(JSON.parse(await readFile(join(dir, manifest.quarters[0].url), 'utf8'))).toEqual(first);
    const second = makeFixture();
    second.quarter.id = 'another-quarter';
    second.quarter.name = 'Another synthetic quarter';
    second.sections.forEach((s) => {
      s.quarterId = second.quarter.id;
    });
    expect((await publishCatalog(second, dir)).ok).toBe(true);
    expect(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')).quarters).toHaveLength(2);
  });
  it('leaves the prior manifest unchanged for invalid catalogs or changed content with a reused version', async () => {
    const dir = await directory();
    const first = makeFixture();
    await publishCatalog(first, dir);
    const before = await readFile(join(dir, 'manifest.json'), 'utf8');
    const bad = structuredClone(first);
    bad.sections[0].courseId = 'missing';
    expect((await publishCatalog(bad, dir)).ok).toBe(false);
    expect(await readFile(join(dir, 'manifest.json'), 'utf8')).toBe(before);
    first.courses[0].title = 'changed without version bump';
    const reused = await publishCatalog(first, dir);
    expect(reused.ok).toBe(false);
    if (!reused.ok) expect(reused.errors[0].code).toBe('version_reused');
    expect(await readFile(join(dir, 'manifest.json'), 'utf8')).toBe(before);
  });
  it('uses read-back after activation acknowledgment loss and rejects a stale manifest revision', async () => {
    const dir = await directory();
    const first = makeFixture();
    const initial = await publishCatalog(first, dir);
    expect(initial.ok).toBe(true);
    first.version = 'fixture-v2';
    const acknowledged = await publishCatalog(first, dir, {
      activate: async (stage, destination) => {
        await rename(stage, destination);
        throw new Error('Lost acknowledgment');
      },
    });
    expect(acknowledged.ok).toBe(true);
    first.version = 'fixture-v3';
    const stale = await publishCatalog(first, dir, {
      expectedRevision: initial.ok ? initial.value.manifestRevision : '',
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.errors[0].code).toBe('publication_conflict');
    expect(JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')).quarters[0].version).toBe(
      'fixture-v2',
    );
  });
  it('preserves the prior manifest after definite activation failure and admits no competing publisher', async () => {
    const dir = await directory();
    const first = makeFixture();
    await publishCatalog(first, dir);
    const before = await readFile(join(dir, 'manifest.json'), 'utf8');
    first.version = 'fixture-v2';
    const failed = await publishCatalog(first, dir, {
      activate: async () => {
        throw new Error('Disk unavailable');
      },
    });
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.errors[0].code).toBe('publication_failed');
    expect(await readFile(join(dir, 'manifest.json'), 'utf8')).toBe(before);
    await writeFile(join(dir, '.publish.lock'), 'someone else');
    const busy = await publishCatalog(first, dir);
    expect(busy.ok).toBe(false);
    if (!busy.ok) expect(busy.errors[0].code).toBe('publication_busy');
  });
  it('publishes supported deep rules without JSON serialization stack overflow', async () => {
    const dir = await directory();
    const f = makeFixture();
    let rule: Rule = { kind: 'course', courseId: 'TEST001' };
    for (let i = 0; i < 5000; i++) rule = { kind: 'all', rules: [rule] };
    f.courses[1].prerequisite = rule;
    expect((await publishCatalog(f, dir)).ok).toBe(true);
  });
});
