import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

test('TP2 — contrôle final du layout et lecteur sans nouvelles données', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/tracks$/);
  await page.getByRole('button', { name: /^Lire TP-test-/ }).first().click();
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
  const inputBounds = await page.getByLabel('Fichier audio').boundingBox();
  const cardBounds = await page.locator('.grid > .card').boundingBox();
  expect(inputBounds!.x + inputBounds!.width).toBeLessThanOrEqual(cardBounds!.x + cardBounds!.width);
  await page.screenshot({ path: resolve('../evidence/tp2/player.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve('../evidence/tp2/library-mobile.png'), fullPage: true });
});

test('TP2 — pagination, upload, Blob audio et propriété sur API réelle', async ({ page }) => {
  const evidence = resolve('../evidence/tp2');
  mkdirSync(evidence, { recursive: true });
  const network: { method: string; path: string; status: number }[] = [];
  const fixtures: { id: string; title: string; originalName: string; mimeType: string; size: number; createdAt: string }[] = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) network.push({ method: response.request().method(), path: url.pathname + url.search, status: response.status() });
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/tracks$/);
  await expect(page.getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled();
  const fileInput = page.getByLabel('Fichier audio');
  await fileInput.setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('Format refusé');
  await expect(page.getByRole('button', { name: 'Envoyer', exact: true })).toBeDisabled();

  const run = Date.now();
  for (let index = 0; index < 6; index++) {
    const title = `TP-test-${run}-${index}`;
    await page.getByLabel('Titre', { exact: true }).fill(title);
    await fileInput.setInputFiles(resolve('fichiers-audio-de-test/song1.mp3'));
    const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/tracks' && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
    const uploaded = await response;
    expect(uploaded.status()).toBe(201);
    const metadata = await uploaded.json(); // Métadonnées audio uniquement, aucun token.
    fixtures.push(metadata);
    writeFileSync(resolve(evidence, 'fixture-tracks.json'), JSON.stringify(fixtures, null, 2));
    await expect(page.getByText('Piste envoyée.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled();
    await expect(page.getByLabel('Titre', { exact: true })).toHaveValue('');
  }
  const nextPage = page.waitForResponse(r => new URL(r.url()).searchParams.get('page') === '2');
  await page.getByRole('button', { name: 'Suivant', exact: true }).click();
  expect((await nextPage).status()).toBe(200);
  await expect(page.getByText(/Page 2 \/ /)).toBeVisible();
  await page.getByRole('button', { name: 'Précédent', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Précédent', exact: true })).toBeDisabled();
  const track = fixtures.at(-1)!;
  await page.getByRole('button', { name: 'Lire ' + track.title, exact: true }).click();
  await expect(page.locator('audio')).toHaveAttribute('src', /^blob:/);
  await expect.poll(() => page.locator('audio').evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(0);
  await page.screenshot({ path: resolve(evidence, 'player.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(evidence, 'library-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  // Bypass contrôlé de la validation client : uniquement le MIME de notre fichier test.
  await page.route('**/api/tracks', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataBuffer()!;
    const marker = Buffer.from('Content-Type: audio/mpeg');
    const position = body.indexOf(marker);
    expect(position).toBeGreaterThan(-1);
    await route.continue({ postData: Buffer.concat([
      body.subarray(0, position), Buffer.from('Content-Type: text/plain'), body.subarray(position + marker.length),
    ]) });
  });
  await fileInput.setInputFiles(resolve('fichiers-audio-de-test/song1.mp3'));
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Données refusées');
  await page.unroute('**/api/tracks');

  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.goto('/register');
  await page.getByLabel('Nom', { exact: true }).fill('Compte test propriété TP2');
  await page.getByLabel('Email', { exact: true }).fill(`tp2-${run}@example.test`);
  await page.getByLabel('Mot de passe', { exact: true }).fill(randomUUID());
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  // Injection de métadonnées connues pour afficher le bouton. La requête audio reste RÉELLE.
  await page.route('**/api/tracks?*', route => route.fulfill({ json: { items: [track], page: 1, pages: 1, total: 1, limit: 5 } }));
  await page.getByRole('link', { name: 'Backing tracks' }).click();
  const denied = page.waitForResponse(r => new URL(r.url()).pathname === `/api/tracks/${track.id}/audio`);
  await page.getByRole('button', { name: 'Lire ' + track.title, exact: true }).click();
  expect((await denied).status()).toBe(404);
  await expect(page.getByRole('alert')).toContainText('inaccessible');
  await page.unroute('**/api/tracks?*');
  expect(network.some(r => r.method === 'POST' && r.path === '/api/tracks' && r.status === 400)).toBe(true);
  writeFileSync(resolve(evidence, 'network-library.json'), JSON.stringify(network, null, 2));
  await page.setContent('<h1>TP2 — Network enregistré par Playwright</h1><p>API réelle, sauf liste injectée pour tester la propriété. Aucun corps/header secret.</p><pre id="network"></pre>');
  await page.locator('#network').evaluate((element, value) => { element.textContent = value; }, JSON.stringify(network, null, 2));
  await page.screenshot({ path: resolve(evidence, 'network-library.png'), fullPage: true });
});
