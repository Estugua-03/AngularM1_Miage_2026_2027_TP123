import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Fixture = { id: string; title: string; originalName: string; mimeType: string; size: number; createdAt: string };

test('TP3 — progression réelle, confirmation, suppression, page vide et piste disparue', async ({ page, context }) => {
  const evidence = resolve('../evidence/tp3');
  mkdirSync(evidence, { recursive: true });
  const network: { method: string; path: string; status: number }[] = [];
  const fixtures: Fixture[] = JSON.parse(readFileSync(resolve('../evidence/tp2/fixture-tracks.json'), 'utf8'));
  // Liste blanche : seuls les ids/titres créés par les tests TP2/TP3 sont supprimés.
  expect(fixtures.every(track => /^TP-test-\d+-\d+$/.test(track.title))).toBe(true);
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) network.push({ method: response.request().method(), path: url.pathname + url.search, status: response.status() });
  });
  const unexpectedErrors: string[] = [];
  page.on('pageerror', () => unexpectedErrors.push('Erreur JavaScript non gérée (contenu exclu).'));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/tracks$/);
  await expect(page.getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled();

  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false, latency: 20, downloadThroughput: 5 * 1024 * 1024, uploadThroughput: 256 * 1024,
  });
  await page.getByLabel('Titre', { exact: true }).fill('TP3-progress-test');
  await page.getByLabel('Fichier audio').setInputFiles(resolve('fichiers-audio-de-test/song1.mp3'));
  const uploadedResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/tracks' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  const progressSamples: number[] = [];
  await expect.poll(async () => {
    const value = Number(await page.locator('progress').getAttribute('value'));
    progressSamples.push(value);
    return value > 0 && value < 100;
  }).toBe(true);
  await expect(page.getByLabel('Titre', { exact: true })).toBeDisabled();
  await expect(page.getByLabel('Fichier audio')).toBeDisabled();
  await page.screenshot({ path: resolve(evidence, 'upload-progress.png'), fullPage: true });
  const response = await uploadedResponse;
  expect(response.status()).toBe(201);
  const uploaded: Fixture = await response.json();
  writeFileSync(resolve(evidence, 'progress-fixture.json'), JSON.stringify(uploaded, null, 2));
  await expect(page.getByLabel('Titre', { exact: true })).toBeEnabled();
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  const deletionButton = page.getByRole('button', { name: 'Supprimer ' + uploaded.title, exact: true });
  const deleteCount = network.filter(row => row.method === 'DELETE').length;
  page.once('dialog', dialog => dialog.dismiss());
  await deletionButton.click();
  expect(network.filter(row => row.method === 'DELETE')).toHaveLength(deleteCount);
  await page.getByRole('button', { name: 'Lire ' + uploaded.title, exact: true }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
  page.once('dialog', dialog => dialog.accept());
  const deletion = page.waitForResponse(r => new URL(r.url()).pathname === `/api/tracks/${uploaded.id}` && r.request().method() === 'DELETE');
  await deletionButton.click();
  expect((await deletion).status()).toBe(204);
  await expect(page.locator('audio')).toHaveCount(0);
  await expect(page.locator('mat-snack-bar-container').filter({ hasText: 'Piste supprimée.' }).last()).toBeVisible();
  await expect(page.locator('mat-snack-bar-container[mat-exit]')).toHaveCount(0);
  await page.screenshot({ path: resolve(evidence, 'delete-snackbar.png'), fullPage: true });

  // Supprimer d'abord la piste la plus ancienne sur la page 2, puis les autres ids autorisés.
  const targetOrder = [fixtures[0], ...fixtures.slice(1).reverse()];
  const deleted: string[] = [uploaded.id];
  for (const track of targetOrder) {
    await expect(page.locator('.library')).toHaveAttribute('aria-busy', 'false');
    // Attendre le numéro de page (mis à jour après HTTP), pas un bouton encore activé
    // pendant le rendu du Signal. Un test doit lui aussi gérer l'asynchronisme réel.
    while (await page.getByRole('button', { name: 'Précédent', exact: true }).isEnabled()) {
      const current = Number((await page.locator('.pager span').innerText()).match(/Page (\d+)/)![1]);
      await page.getByRole('button', { name: 'Précédent', exact: true }).click();
      await expect(page.locator('.pager span')).toContainText(`Page ${current - 1} /`);
      await expect(page.locator('.library')).toHaveAttribute('aria-busy', 'false');
    }
    let button = page.getByRole('button', { name: 'Supprimer ' + track.title, exact: true });
    while (!(await button.count())) {
      const next = page.getByRole('button', { name: 'Suivant', exact: true });
      await expect(next).toBeEnabled();
      const current = Number((await page.locator('.pager span').innerText()).match(/Page (\d+)/)![1]);
      await next.click();
      await expect(page.locator('.pager span')).toContainText(`Page ${current + 1} /`);
      await expect(page.locator('.library')).toHaveAttribute('aria-busy', 'false');
    }
    page.once('dialog', dialog => dialog.accept());
    const result = page.waitForResponse(r => new URL(r.url()).pathname === `/api/tracks/${track.id}` && r.request().method() === 'DELETE');
    await button.click();
    expect((await result).status()).toBe(204);
    deleted.push(track.id);
    await expect(button).toHaveCount(0);
    await expect(page.locator('.library')).toHaveAttribute('aria-busy', 'false');
  }

  // Une card périmée comme dans un onglet resté ouvert ; DELETE et refresh sont réels.
  const stale = fixtures[0];
  await page.route('**/api/tracks?*', route => route.fulfill({ json: { items: [stale], page: 1, pages: 1, total: 1, limit: 5 } }), { times: 1 });
  await page.reload();
  page.once('dialog', dialog => dialog.accept());
  const missing = page.waitForResponse(r => new URL(r.url()).pathname === `/api/tracks/${stale.id}` && r.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Supprimer ' + stale.title, exact: true }).click();
  expect((await missing).status()).toBe(404);
  await expect(page.locator('mat-snack-bar-container').filter({ hasText: 'introuvable' }).last()).toBeVisible();
  await page.screenshot({ path: resolve(evidence, 'delete-missing.png'), fullPage: true });
  expect(unexpectedErrors).toEqual([]);
  writeFileSync(resolve(evidence, 'network-delete-upload.json'), JSON.stringify(network, null, 2));
  writeFileSync(resolve(evidence, 'browser-results.json'), JSON.stringify({ progressSamples, deletedTestIds: deleted, unhandledPageErrors: unexpectedErrors }, null, 2));
  await page.setContent('<h1>TP3 — Network enregistré par Playwright</h1><p>API réelle. Une liste périmée a été injectée pour tester DELETE 404. Corps/headers exclus.</p><pre id="network"></pre>');
  await page.locator('#network').evaluate((element, value) => { element.textContent = value; }, JSON.stringify(network, null, 2));
  await page.screenshot({ path: resolve(evidence, 'network-delete-upload.png'), fullPage: true });
});
