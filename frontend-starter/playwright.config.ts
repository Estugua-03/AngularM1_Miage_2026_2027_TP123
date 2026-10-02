import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests',
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    channel: 'chrome',
    headless: true,
    // Les traces/HAR et captures automatiques peuvent enregistrer des secrets.
    trace: 'off', video: 'off', screenshot: 'off',
  },
});
