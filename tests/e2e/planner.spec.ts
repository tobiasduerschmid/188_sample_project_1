import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { makeFixture } from '../../src/fixtures/catalog';
import { fingerprint } from '../../src/domain/identity';

async function start(page: Page, name = 'Winter plan') {
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'Quarter', exact: true })
    .selectOption('synthetic-2026-winter');
  await expect(page.getByRole('heading', { name: 'Synthetic Winter 2026' })).toBeVisible();
  await page.getByLabel('Plan name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Create my plan' }).click();
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
}
async function add(page: Page, code: string, sections: Record<string, string>) {
  await page.getByLabel('Search courses').fill(code);
  await page.getByRole('button', { name: `Add ${code} to plan`, exact: true }).click();
  for (const [component, value] of Object.entries(sections))
    await page
      .getByRole('combobox', { name: `${code} ${component}`, exact: true })
      .selectOption(value);
}

test('complete a quarter plan, check evidence, download, copy and reopen without disclosure', async ({
  page,
  context,
}) => {
  const sent: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.origin !== 'http://127.0.0.1:4173' || url.search)
      sent.push(request.url());
  });
  await start(page);
  await add(page, 'TEST101', { lecture: 'TEST101-B', lab: 'TEST101-B1' });
  await add(page, 'TEST102', { lecture: 'TEST102-A' });
  await add(page, 'TEST104', { lecture: 'TEST104-A' });
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText('10');
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText(
    'Time check complete',
  );
  await page.getByRole('button', { name: 'Academic checks', exact: true }).click();
  await page.getByText('Set an optional unit target', { exact: true }).click();
  await page.getByLabel('Minimum units').fill('11');
  await page.getByLabel('Maximum units').fill('15');
  await page.getByRole('button', { name: 'Save unit target' }).click();
  await page.getByLabel('Course code or identity', { exact: true }).fill('TEST001');
  await page.getByLabel('Earned units (optional)').fill('4');
  await page.getByRole('button', { name: 'Add coursework record' }).click();
  await page.getByLabel('This history is complete').check();
  await page.getByLabel('Target name').fill('Explore three courses');
  await page.getByLabel('Required amount').fill('3');
  await page
    .getByLabel('Eligible course codes or identities')
    .fill('TEST101, TEST102, TEST103, TEST104');
  await page.getByRole('button', { name: 'Save academic target' }).click();
  await expect(
    page.getByText('Would be met if planned courses are completed', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('11–15 unit target · below', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download summary', exact: false }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Winter plan.txt');
  await page.getByRole('button', { name: 'Make a copy', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Plan name').fill('Alternative B');
  await page.getByRole('button', { name: 'Save copy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alternative B', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Winter plan Synthetic Winter/ }).click();
  await expect(page.getByRole('heading', { name: 'Winter plan', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText('10');
  await expect(page.getByText('This plan uses')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Quarter', exact: true })
    .selectOption('synthetic-2026-fall');
  await expect(page.getByRole('button', { name: /Winter plan Synthetic Winter/ })).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Quarter', exact: true })
    .selectOption('synthetic-2026-winter');
  await expect(page.getByRole('button', { name: /Winter plan Synthetic Winter/ })).toBeVisible();
  expect(sent).toEqual([]);
  const other = await context.browser()!.newContext();
  const fresh = await other.newPage();
  await fresh.goto('/');
  await expect(fresh.getByRole('button', { name: /Winter plan Synthetic Winter/ })).toHaveCount(0);
  await other.close();
});

test('all dated conflicts resolve at adjacent endpoints and personal time remains explicit', async ({
  page,
}) => {
  await start(page, 'Conflicts');
  await add(page, 'TEST101', { lecture: 'TEST101-A', lab: 'TEST101-A1' });
  await add(page, 'TEST102', { lecture: 'TEST102-A' });
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText('20');
  await page.getByRole('button', { name: 'Remove TEST102', exact: true }).click();
  await add(page, 'TEST103', { lecture: 'TEST103-A' });
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText(
    'No known time conflicts',
  );
  await page.getByRole('button', { name: 'Personal time', exact: true }).click();
  await page.getByLabel('Personal time label').fill('Appointment');
  await page.getByLabel('Start date', { exact: true }).fill('2026-01-09');
  await page.getByLabel('End date', { exact: true }).fill('2026-01-09');
  await page.getByLabel('Start time', { exact: true }).fill('09:30');
  await page.getByLabel('End time', { exact: true }).fill('10:30');
  await page.getByRole('button', { name: 'Add personal time', exact: true }).click();
  await page.getByRole('button', { name: 'Schedule & courses', exact: true }).click();
  await page.getByText('View all 1 dated conflicts', { exact: true }).click();
  await expect(page.getByText(/09:30–10:00/).last()).toBeVisible();
  await expect(page.getByText(/overlaps/).last()).toContainText('Appointment');
});

test('mobile checks are initially visible and ordinary content fits at increased text size', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  const summary = page.getByRole('region', { name: 'Current plan checks' });
  const box = await summary.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await page.getByRole('button', { name: 'Academic checks', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-academic.png', fullPage: true });
});

test('storage denial preserves editable inputs, offers download, guards switching, and recovers', async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    Object.assign(window, {
      restoreTestStorage: () => {
        IDBObjectStore.prototype.put = original;
      },
    });
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'plan_records') throw new DOMException('Test denial', 'SecurityError');
      return original.apply(this, args);
    };
  });
  await add(page, 'TEST104', { lecture: 'TEST104-A' });
  await expect(page.getByRole('region', { name: 'Save recovery' })).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Quarter', exact: true })
    .selectOption('synthetic-2026-fall');
  await expect(page.getByRole('dialog', { name: 'Keep your unsaved work?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'TEST104 lecture', exact: true })).toHaveValue(
    'TEST104-A',
  );
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download current inputs', exact: true }).click();
  const file = await downloaded;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf-8');
  expect(text).toContain('Changes not saved');
  expect(text).toContain('TEST104-A');
  await page.evaluate(() =>
    (window as unknown as { restoreTestStorage: () => void }).restoreTestStorage(),
  );
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
});

test('catalog failure uses retained data and first use offers a truthful retry', async ({
  page,
  browser,
}) => {
  await start(page);
  await page.route('**/catalog/**', (route) => route.abort());
  await page.reload();
  await page.getByRole('button', { name: /Winter plan Synthetic Winter/ }).click();
  await expect(page.getByRole('heading', { name: 'Winter plan', exact: true })).toBeVisible();
  await add(page, 'TEST104', { lecture: 'TEST104-A' });
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
  const fresh = await browser.newPage();
  await fresh.route('**/catalog/**', (route) => route.abort());
  await fresh.goto('/');
  await expect(fresh.getByText('No quarter catalog is available', { exact: true })).toBeVisible();
  await expect(fresh.getByRole('button', { name: 'Retry catalog', exact: true })).toBeVisible();
  await fresh.close();
});

test('reviewed catalog adoption preserves invalid fixed units and canceled components until corrected', async ({
  page,
}) => {
  await start(page);
  await add(page, 'TEST101', { lecture: 'TEST101-A', lab: 'TEST101-A1' });
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
  const updated = makeFixture();
  updated.version = 'fixture-v2';
  updated.courses.find((c) => c.id === 'TEST101')!.units = [5];
  updated.sections.find((s) => s.id === 'TEST101-A1')!.availability = 'canceled';
  const digest = await fingerprint(updated);
  await page.route('**/catalog/manifest.json', (route) =>
    route.fulfill({
      json: {
        schemaVersion: 1,
        quarters: [
          {
            id: updated.quarter.id,
            name: updated.quarter.name,
            version: updated.version,
            url: 'fixture-v2.json',
            digest,
          },
        ],
      },
    }),
  );
  await page.route('**/catalog/fixture-v2.json', (route) => route.fulfill({ json: updated }));
  await page.locator('details.provenance > summary').click();
  await page.getByRole('button', { name: 'Check for catalog updates', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review catalog update' })).toBeVisible();
  await expect(page.getByText(/chosen 4 units are no longer allowed/)).toBeVisible();
  await page.getByRole('button', { name: 'Apply reviewed catalog', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'TEST101 units', exact: true })).toHaveValue('4');
  await page.getByRole('combobox', { name: 'TEST101 units', exact: true }).selectOption('5');
  await page
    .getByRole('combobox', { name: 'TEST101 lecture', exact: true })
    .selectOption('TEST101-B');
  await page.getByRole('combobox', { name: 'TEST101 lab', exact: true }).selectOption('TEST101-B1');
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText('5');
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText(
    'Time check complete',
  );
});

test('keyboard core editing and download have accessible labels and contrast', async ({ page }) => {
  await start(page);
  // Focus a known starting control; every subsequent interaction uses the keyboard.
  await page.getByLabel('Search courses').focus();
  await page.keyboard.type('TEST101');
  await page.keyboard.press('Tab'); // Subject
  await page.keyboard.press('Tab'); // Availability
  await page.keyboard.press('Tab'); // Clear filters
  await page.keyboard.press('Tab'); // Course details
  await page.keyboard.press('Tab'); // Add course
  await expect(
    page.getByRole('button', { name: 'Add TEST101 to plan', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('combobox', { name: 'TEST101 lecture', exact: true }).focus();
  await page.keyboard.press('l');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('l');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Current plan checks' })).toContainText(
    'Time check complete',
  );
  const violations = (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  ).violations;
  expect(violations).toEqual([]);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download summary', exact: false }).focus();
  await page.keyboard.press('Enter');
  await download;
});

test('two tabs cannot silently replace a newer plan revision', async ({ page, context }) => {
  await start(page);
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: /Winter plan Synthetic Winter/ }).click();
  await add(page, 'TEST104', { lecture: 'TEST104-A' });
  await expect(page.getByText('Saved in this browser', { exact: false })).toBeVisible();
  await add(other, 'TEST105', { lecture: 'TEST105-A' });
  await expect(other.getByRole('region', { name: 'Save recovery' })).toBeVisible();
  await expect(
    other.getByText('Another tab changed or deleted this plan.', { exact: false }),
  ).toBeVisible();
  await other.getByRole('button', { name: 'Load newer revision', exact: true }).click();
  await other.getByRole('button', { name: 'Discard edits and load newer', exact: true }).click();
  await expect(other.getByRole('combobox', { name: 'TEST104 lecture', exact: true })).toHaveValue(
    'TEST104-A',
  );
  await expect(other.getByRole('combobox', { name: 'TEST105 lecture', exact: true })).toHaveCount(
    0,
  );
});
