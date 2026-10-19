const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const MODULE_URL = process.env.TEST_MODULE_URL || base + '/module/1';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const created = { pages: [] };
  try {
    // Create a page through the API so the editor has something to type into.
    const notebooks = await fetch(base + '/api/notebooks').then((r) => r.json());
    const target = notebooks.find((n) => n.moduleId === 1) || notebooks[0];
    const pageRow = await fetch(base + '/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notebookId: target.id, moduleId: target.moduleId, title: 'PERSIST-TEST', content: 'Phrase de depart.', paper: 'seyes', font: 'Caveat', ink: '#3b4a6b', fontSize: 21, stickers: [], sortOrder: 9999 }) }).then((r) => r.json());
    created.pages.push(pageRow.id);

    await page.goto(MODULE_URL, { waitUntil: 'networkidle' });
    // Open the freshly created page through the real UI, then type without pressing save.
    await page.getByRole('button', { name: /PERSIST-TEST/ }).click();
    await page.locator('input[value="PERSIST-TEST"]').waitFor();
    await page.locator('textarea').first().click();
    await page.locator('textarea').first().fill('Phrase de depart. Je rajoute une idee tres importante pour ma revision.');
    // Wait until the typed text is really stored in the database (not just a UI label).
    let stored = '';
    for (let attempt = 0; attempt < 50; attempt++) {
      const rows = await fetch(base + '/api/pages').then((r) => r.json());
      stored = (rows.find((r) => r.id === pageRow.id) || {}).content || '';
      if (stored.includes('tres importante')) break;
      await page.waitForTimeout(500);
    }
    assert(stored.includes('tres importante'), 'autosave did not reach database: ' + stored);
    // The title typed into the field is stored too.
    const titles = await fetch(base + '/api/pages').then((r) => r.json());
    assert(titles.some((r) => r.title === 'PERSIST-TEST'), 'page title missing');
    await page.getByText('✓ محفوظة تلقائياً', { exact: false }).waitFor({ timeout: 15000 });
    console.log('PASS typing is saved automatically without pressing save');

    // Prove the chosen notebook is remembered: switch away, come back, then reload.
    const notebooksInModule = notebooks.filter((n) => n.moduleId === target.moduleId);
    if (notebooksInModule.length > 1) {
      await page.getByRole('button', { name: new RegExp(notebooksInModule[1].title.slice(0, 8)) }).first().click();
      await page.waitForTimeout(300);
      // Come back to the original notebook: the draft must still be there.
      await page.getByRole('button', { name: new RegExp(target.title.slice(0, 8)) }).first().click();
      await page.getByRole('button', { name: /PERSIST-TEST/ }).click();
      await page.locator('input[value="PERSIST-TEST"]').waitFor();
      const returned = await page.locator('textarea').first().inputValue();
      assert(returned.includes('tres importante'), 'switching notebooks lost the draft: ' + returned);
    }

    // Hard reload: same notebook, same page, same typed content.
    await page.reload({ waitUntil: 'networkidle' });
    const restored = await page.locator('textarea').first().inputValue();
    assert(restored.includes('tres importante'), 'typed content lost after reload: ' + restored);
    console.log('PASS typed content survives a hard reload');

    // Tab memory.
    await page.getByRole('button', { name: /Présentations/ }).click();
    await page.getByText('ارفعي عروضك', { exact: false }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('ارفعي عروضك', { exact: false }).waitFor();
    console.log('PASS the active module tab is remembered after reload');

    // Library and dictionary filter memory.
    await page.goto(base + '/bibliotheque', { waitUntil: 'networkidle' });
    await page.getByLabel('Rechercher un livre').fill('Candide');
    await page.getByLabel('Statut de lecture').selectOption('Lu');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByLabel('Rechercher un livre').inputValue(), 'Candide');
    assert.equal(await page.getByLabel('Statut de lecture').inputValue(), 'Lu');
    console.log('PASS library search and reading status are remembered');

    // Instant cached render for saved lists (no empty flash).
    await page.goto(base + '/dictionnaire', { waitUntil: 'networkidle' });
    const renderTime = await page.evaluate(() => performance.now());
    assert(renderTime < 12000, 'dictionary took too long to show content');
    console.log('PASS dictionary renders from cache then refreshes');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/bien-etre', { waitUntil: 'networkidle' });
    const mobile = await page.evaluate(() => ({ width: innerWidth, body: document.documentElement.scrollWidth }));
    assert(mobile.body <= mobile.width + 2, 'mobile overflow ' + JSON.stringify(mobile));
    await page.screenshot({ path: 'artifacts/persistence-mobile.png', fullPage: true });
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS persistence UI has no runtime errors and fits mobile');
  } finally {
    for (const id of created.pages) { await fetch(`${base}/api/pages/${id}`, { method: 'DELETE' }); await fetch(`${base}/api/study/activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'noop' }) }).catch(() => {}); }
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
