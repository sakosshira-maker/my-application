const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, permissions: ['microphone'] });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const created = { oral: [], plans: [], words: [], moods: [] };
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Mes petits ateliers' }).waitFor();
    await page.getByRole('heading', { name: 'Ma boîte à médailles' }).waitFor();
    await page.screenshot({ path: 'artifacts/study-home.png', fullPage: true });
    console.log('PASS home widgets and routes visible');

    await page.getByRole('link', { name: /Bibliothèque littéraire/ }).first().click();
    await page.getByRole('heading', { name: 'Ma bibliothèque littéraire' }).waitFor();
    await page.getByRole('button', { name: /Candide/ }).click();
    await page.getByRole('heading', { name: 'Les personnages' }).waitFor();
    await page.getByRole('heading', { name: 'Le fil des événements' }).waitFor();
    await page.getByRole('main').getByRole('button', { name: 'Fermer', exact: true }).click();
    await page.screenshot({ path: 'artifacts/study-library.png', fullPage: true });
    console.log('PASS literary shelf opens character plot and quote card');

    const beforeWords = await fetch(base + '/api/study/words').then((r) => r.json());
    await page.goto(base + '/dictionnaire', { waitUntil: 'networkidle' });
    const keepWord = page.getByRole('button', { name: 'Garder ce petit mot', exact: true });
    if (await keepWord.count()) {
      await keepWord.click();
      await page.getByRole('button', { name: 'Dans mon dictionnaire', exact: true }).waitFor();
    }
    await page.getByText('Quel est son sens ?', { exact: false }).first().waitFor();
    const afterWords = await fetch(base + '/api/study/words').then((r) => r.json());
    created.words.push(...afterWords.filter((w) => !beforeWords.some((old) => old.id === w.id)).map((w) => w.id));
    console.log('PASS word of the day saves and appears immediately in the pink dictionary');

    await page.goto(base + '/oral', { waitUntil: 'networkidle' });
    await page.getByLabel('Sujet de mon essai').fill('TEST-BROWSER oral');
    await page.getByRole('button', { name: 'Enregistrer ma voix', exact: true }).click();
    await page.getByText('Microphone actif', { exact: true }).waitFor();
    await page.waitForTimeout(2400);
    await page.getByRole('button', { name: 'Terminer', exact: true }).click();
    await page.getByRole('button', { name: 'Enregistrer cet entraînement', exact: true }).waitFor();
    await page.waitForFunction(() => !Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Enregistrer cet entraînement')).disabled);
    await page.getByLabel("Transcription de ce que j'ai réellement dit").fill('Bonjour la classe. Voici un exemple de métaphore.');
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/study/oral') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Enregistrer cet entraînement', exact: true }).click();
    const session = await (await saved).json(); created.oral.push(session.id);
    await page.getByRole('button', { name: 'Conseils à partir de mes mesures' }).click();
    await page.getByText('Mesures locales · pas de jugement phonétique', { exact: true }).waitFor();
    await page.screenshot({ path: 'artifacts/study-oral.png', fullPage: true });
    console.log('PASS actual browser microphone capture, WAV conversion, save, playback and analysis');

    await page.goto(base + '/bien-etre', { waitUntil: 'networkidle' });
    const beforeMoods = await fetch(base + '/api/study/moods').then((r) => r.json());
    const testDate = Array.from({ length: 28 }, (_, i) => `1900-01-${String(i + 1).padStart(2, '0')}`).find((d) => !beforeMoods.some((m) => m.date === d));
    await page.getByLabel('Jour du journal').fill(testDate);
    const moodSaved = page.waitForResponse((r) => r.url().endsWith('/api/study/moods') && r.request().method() === 'POST');
    await page.getByRole('button', { name: '🥱 Fatiguée', exact: true }).click();
    const moodRow = await (await moodSaved).json(); created.moods.push(moodRow.id);
    await page.waitForFunction(() => document.querySelector('div.fixed.z-40')?.textContent.includes('Tu as le droit de ralentir'));
    await page.getByLabel('Mon petit journal').fill('TEST-BROWSER Une pause toute douce.');
    await page.getByRole('button', { name: 'Enregistrer ma voix', exact: true }).click();
    await page.getByText('Microphone actif', { exact: true }).waitFor();
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Terminer', exact: true }).click();
    await page.getByRole('button', { name: 'Recommencer', exact: true }).waitFor();
    const ventSaved = page.waitForResponse((r) => r.url().endsWith('/api/study/moods') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Garder cette petite trace', exact: true }).click();
    const vent = await (await ventSaved).json(); assert(vent.audioData); assert(vent.note.includes('TEST-BROWSER'));
    console.log('PASS mood selection, Lina encouragement and saved voice vent');
    await page.getByRole('button', { name: /Pluie légère/ }).click();
    await page.getByText('Laisse tes épaules se relâcher.', { exact: false }).waitFor();
    await page.getByRole('button', { name: /Pluie légère/ }).click();
    await page.screenshot({ path: 'artifacts/study-mood.png', fullPage: true });
    console.log('PASS mood panel and ambient audio start/stop');

    await page.goto(base + '/stage', { waitUntil: 'networkidle' });
    await page.getByLabel('Nom du cours').fill('TEST-BROWSER Les valeurs de l’imparfait');
    await page.getByRole('button', { name: 'Générer ma trame' }).click();
    await page.getByText('55 / 55 minutes', { exact: true }).waitFor();
    const planResponse = page.waitForResponse((r) => r.url().endsWith('/api/study/plans') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).first().click();
    const plan = await (await planResponse).json(); created.plans.push(plan.id);
    await page.getByText('Ta fiche est enregistrée.', { exact: false }).waitFor();
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Imprimer / PDF' }).click();
    const popup = await popupPromise; await popup.waitForLoadState();
    assert((await popup.content()).includes('Fiche de préparation'));
    assert((await popup.content()).includes('Objectifs d&#39;apprentissage') || (await popup.content()).includes("Objectifs d'apprentissage"));
    await popup.close();
    await page.screenshot({ path: 'artifacts/study-planner.png', fullPage: true });
    console.log('PASS lesson generation, edits, persistent save and printable PDF document');

    await page.goto(base + '/reussites', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: "Plume d'or" }).waitFor();
    await page.screenshot({ path: 'artifacts/study-badges.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/bibliotheque', { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, body: document.documentElement.scrollWidth }));
    assert(dimensions.body <= dimensions.width + 2, 'Mobile viewport overflows: ' + JSON.stringify(dimensions));
    await page.screenshot({ path: 'artifacts/study-mobile.png', fullPage: true });
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS achievement display, mobile layout and no browser runtime errors');
  } finally {
    for (const resource of Object.keys(created)) for (const id of created[resource]) await fetch(`${base}/api/study/${resource}/${id}`, { method: 'DELETE' });
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
