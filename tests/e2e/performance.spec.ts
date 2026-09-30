import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { cpus, totalmem, platform, arch } from 'node:os';
import { maximumWorkload } from '../fixtures/workload';

type Operation = 'search' | 'edit' | 'open';
type Observation = { milliseconds: number; complete: boolean };
declare global {
  interface Window {
    workloadTiming?: { start?: number; observation?: Observation };
  }
}

/** Start at the browser input/click event, end after completed DOM is committed and two paint opportunities. */
async function arm(page: Page, operation: Operation, expected: string | boolean) {
  await page.evaluate(
    ({ operation, expected }) => {
      const timing = (window.workloadTiming = {} as NonNullable<Window['workloadTiming']>);
      let active = false;
      let completeFrames = 0;
      let sawLoading = false;
      const handler = (event: Event) => {
        const target = event.target as HTMLElement;
        const matches =
          operation === 'search'
            ? target.matches('input[type="search"]')
            : operation === 'edit'
              ? target.matches('input[type="checkbox"]')
              : !!target.closest('.saved-plans button');
        if (!matches) return;
        document.removeEventListener(operation === 'search' ? 'input' : 'click', handler, true);
        timing.start = performance.now();
        active = true;
        requestAnimationFrame(check);
      };
      const loading = () =>
        [...document.querySelectorAll('.notice[role="status"]')].some((element) =>
          element.textContent?.includes('Loading your planning space'),
        );
      const observer = new MutationObserver(() => {
        if (active && loading()) sawLoading = true;
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      const check = () => {
        if (!active) return;
        const summary = document.querySelector('[aria-label="Current plan checks"]');
        const summaryText = summary?.textContent ?? '';
        const checksComplete =
          summaryText.includes('40–40 target · within') &&
          summaryText.includes('No known time conflicts') &&
          summaryText.includes('Time check complete') &&
          !summaryText.includes('—');
        let done = false;
        if (operation === 'search')
          done =
            (document.querySelector('input[type="search"]') as HTMLInputElement)?.value ===
              expected &&
            document.querySelector('.result-count')?.textContent?.startsWith('1 course found') ===
              true &&
            document.querySelectorAll('.catalog-course').length === 1 &&
            checksComplete;
        if (operation === 'edit') {
          const state = expected ? 'unmet' : 'unverified';
          const targetState = expected ? 'not_met' : 'unverified';
          done =
            (document.querySelector('input[type="checkbox"]') as HTMLInputElement)?.checked ===
              expected &&
            checksComplete &&
            document.querySelectorAll(
              `.eligibility-card .rule-result:first-of-type .status.${state}`,
            ).length === 40 &&
            document.querySelectorAll(`.target-report .status.${targetState}`).length === 50;
        }
        if (operation === 'open')
          done =
            sawLoading &&
            !loading() &&
            checksComplete &&
            document.querySelector('h1')?.textContent === 'Maximum plan 0' &&
            document.querySelectorAll('.selected-course').length === 40 &&
            document.querySelectorAll('.selected-course select').length === 200 &&
            !!document.querySelector('.week-grid') &&
            document.querySelectorAll('.selected-course .positive').length === 40;
        completeFrames = done ? completeFrames + 1 : 0;
        if (completeFrames >= 2) {
          timing.observation = { milliseconds: performance.now() - timing.start!, complete: true };
          active = false;
          observer.disconnect();
        } else requestAnimationFrame(check);
      };
      document.addEventListener(operation === 'search' ? 'input' : 'click', handler, true);
    },
    { operation, expected },
  );
}
async function measured(page: Page) {
  await page.waitForFunction(() => !!window.workloadTiming?.observation, undefined, {
    timeout: 30_000,
  });
  return page.evaluate(() => window.workloadTiming!.observation!);
}
function stats(observations: Observation[], threshold: number) {
  const sorted = observations.map((item) => item.milliseconds).sort((a, b) => a - b);
  return {
    samples: observations.length,
    thresholdMs: threshold,
    withinThreshold: sorted.filter((ms) => ms <= threshold).length,
    complete: observations.filter((item) => item.complete).length,
    p50Ms: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maxMs: sorted.at(-1),
    timingsMs: observations.map((item) => Math.round(item.milliseconds * 100) / 100),
  };
}

async function prepareMaximum(page: Page) {
  const workload = await maximumWorkload();
  expect(workload.dimensions).toMatchObject({
    courses: 5000,
    sections: 20000,
    selectedCourses: 40,
    selectedComponents: 200,
    personalIntervals: 100,
    courseworkRecords: 200,
    academicTargets: 50,
    savedPlans: 20,
    quarterDays: 140,
  });
  await page.route('**/catalog/manifest.json', (route) =>
    route.fulfill({ json: workload.manifest }),
  );
  await page.route('**/catalog/maximum.json', (route) =>
    route.fulfill({ json: workload.envelope }),
  );
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Quarter', exact: true })).toContainText(
    'Maximum Workload Quarter',
  );
  await page.evaluate(
    async (data) => {
      await new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open('quarterly-class-planner', 1);
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const tx = db.transaction(
            ['plan_records', 'catalog_envelopes', 'quarter_name_index', 'deletion_markers'],
            'readwrite',
          );
          for (const store of [
            'plan_records',
            'catalog_envelopes',
            'quarter_name_index',
            'deletion_markers',
          ])
            tx.objectStore(store).clear();
          tx.objectStore('catalog_envelopes').put(data.retained, data.catalogKey);
          for (const record of data.records) {
            tx.objectStore('plan_records').put(record, record.inputs.id);
            tx.objectStore('quarter_name_index').put(
              record.inputs.id,
              JSON.stringify([
                record.inputs.quarterId,
                record.inputs.name.toLocaleLowerCase('en-US'),
              ]),
            );
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => reject(tx.error);
        };
      });
    },
    { records: workload.records, retained: workload.retained, catalogKey: workload.catalogKey },
  );
  await page.reload();
  const open = page.getByRole('button', {
    name: 'Maximum plan 0 Maximum Workload Quarter',
    exact: true,
  });
  await expect(open).toBeVisible();
  await open.click();
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText(
    'Time check complete',
    { timeout: 30_000 },
  );
  await expect(page.locator('.week-grid .meeting.class')).toHaveCount(200);
  await expect(page.locator('.week-grid .meeting.personal')).toHaveCount(80);
  return { workload, open };
}

test('maximum workload schedule renders every occurrence in the selected week', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const { open } = await prepareMaximum(page);
  await arm(page, 'open', 'Maximum plan 0');
  await open.click();
  await measured(page);
  await expect(page.locator('.week-grid .meeting.class')).toHaveCount(200);
  await expect(page.locator('.week-grid .meeting.personal')).toHaveCount(80);
});

test('maximum workload: 100 complete searches, edits and saved-plan openings', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(900_000);
  const { workload, open } = await prepareMaximum(page);
  const results: Record<Operation, Observation[]> = { search: [], edit: [], open: [] };
  for (let index = 0; index < 100; index++) {
    const suffix = String(index).padStart(4, '0');
    const query =
      index % 3 === 0
        ? `PERF${suffix}`
        : index % 3 === 1
          ? `Workload course ${suffix}`
          : `Instructor ${suffix}`;
    await arm(page, 'search', query);
    await page.getByLabel('Search courses').fill(query);
    results.search.push(await measured(page));
    await expect(page.locator('.catalog-course .course-code')).toHaveText(`PERF${suffix}`);
  }
  await page.getByRole('button', { name: 'Academic checks', exact: true }).click();
  for (let index = 0; index < 100; index++) {
    const complete = index % 2 === 0;
    await arm(page, 'edit', complete);
    await page.getByLabel('This history is complete').setChecked(complete);
    results.edit.push(await measured(page));
    // Isolate the next sample from an in-flight autosave; acknowledgment is not used as the edit endpoint.
    await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible({
      timeout: 30_000,
    });
  }
  await page.getByRole('button', { name: 'Schedule & courses', exact: true }).click();
  for (let index = 0; index < 100; index++) {
    await arm(page, 'open', 'Maximum plan 0');
    await open.click();
    results.open.push(await measured(page));
  }
  await expect(page.locator('.week-grid .meeting.class')).toHaveCount(200);
  await expect(page.locator('.week-grid .meeting.personal')).toHaveCount(80);
  const report = {
    measuredAt: new Date().toISOString(),
    browser: testInfo.project.name,
    browserVersion: browser.version(),
    headless: true,
    productionBuild: true,
    environment: {
      platform: platform(),
      arch: arch(),
      cpu: cpus()[0].model,
      logicalCpuCount: cpus().length,
      memoryGiB: totalmem() / 1024 ** 3,
      userAgent: await page.evaluate(() => navigator.userAgent),
      hardwareConcurrency: await page.evaluate(() => navigator.hardwareConcurrency),
    },
    dimensions: workload.dimensions,
    search: stats(results.search, 1000),
    edit: stats(results.edit, 1000),
    open: stats(results.open, 2000),
  };
  const resultPath = testInfo.outputPath('performance.json');
  await writeFile(resultPath, JSON.stringify(report, null, 2));
  await testInfo.attach('maximum-workload-performance', {
    path: resultPath,
    contentType: 'application/json',
  });
  console.log(`PERFORMANCE ${JSON.stringify(report)}`);
  expect(
    report.search.withinThreshold,
    'QR-01 complete searches within 1 second',
  ).toBeGreaterThanOrEqual(95);
  expect(
    report.edit.withinThreshold,
    'QR-01 complete edits within 1 second',
  ).toBeGreaterThanOrEqual(95);
  expect(
    report.open.withinThreshold,
    'QR-02 complete openings within 2 seconds',
  ).toBeGreaterThanOrEqual(95);
});
