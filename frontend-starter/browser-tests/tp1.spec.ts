import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

test('TP1 — navigation et validation de formulaire dans Chrome réel', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  const evidence = resolve('../evidence/tp1');
  mkdirSync(evidence, { recursive: true });
  // Champs vides : aucun mot de passe ni JWT dans cette capture.
  await page.screenshot({ path: resolve(evidence, 'login-validation.png') });
});

test('TP1 — inscription réelle puis email déjà utilisé', async ({ page }) => {
  const email = `tp1-${Date.now()}@example.test`;
  const password = randomUUID(); // Usage éphémère : jamais écrit dans les preuves.
  const statuses: number[] = [];
  page.on('response', response => {
    if (new URL(response.url()).pathname === '/api/auth/register') statuses.push(response.status());
  });
  await page.goto('/register');
  await page.getByLabel('Nom', { exact: true }).fill('Compte test TP1');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByLabel('Nouveau nom')).toHaveValue('Compte test TP1');
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await page.goto('/register');
  await page.getByLabel('Nom', { exact: true }).fill('Compte test TP1');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('alert')).toContainText('déjà utilisé');
  expect(statuses).toEqual([201, 409]);
  writeFileSync(resolve('../evidence/tp1/registration-statuses.json'), JSON.stringify({ statuses }, null, 2));
});

test('TP1 — login refusé/accepté, profil PUT, logout et JWT invalide sur API réelle', async ({ page }) => {
  const network: { method: string; path: string; status: number }[] = [];
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) network.push({
      method: response.request().method(), path: url.pathname + url.search, status: response.status(),
    });
    // Aucun corps, header, storage, JWT ou mot de passe n'est lu/enregistré ici.
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('test-only-wrong-password');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Authentification refusée');
  // Identifiants de démonstration publics fournis par le README, jamais journalisés.
  await page.getByLabel('Mot de passe', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/tracks$/);
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  const name = page.getByLabel('Nouveau nom');
  await expect(name).not.toHaveValue('');
  const previousName = await name.inputValue();
  await name.fill('Demo TP1 test');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Profil enregistré');
  await name.fill(previousName);
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Profil enregistré');
  // Ne jamais lire le JWT réel. Écraser avec une valeur factice suffit à tester le 401.
  await page.evaluate(() => localStorage.setItem('gpc_token', 'invalid-test-value'));
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/tracks$/);
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(network).toEqual(expect.arrayContaining([
    { method: 'POST', path: '/api/auth/login', status: 401 },
    { method: 'POST', path: '/api/auth/login', status: 200 },
    { method: 'GET', path: '/api/users/me', status: 200 },
    { method: 'PUT', path: '/api/users/me', status: 200 },
    { method: 'GET', path: '/api/users/me', status: 401 },
  ]));
  const evidence = resolve('../evidence/tp1');
  mkdirSync(evidence, { recursive: true });
  writeFileSync(resolve(evidence, 'network-auth.json'), JSON.stringify(network, null, 2));
  // Capture du relevé réel de Network expurgé ; il ne s'agit pas des DevTools.
  await page.setContent('<h1>TP1 — Network enregistré par Playwright</h1><p>API réelle. Corps et headers exclus.</p><pre id="network"></pre>');
  await page.locator('#network').evaluate((element, value) => { element.textContent = value; }, JSON.stringify(network, null, 2));
  await page.screenshot({ path: resolve(evidence, 'network-auth.png'), fullPage: true });
});
