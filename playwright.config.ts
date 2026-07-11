import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E smoke tests for the live web Vault.
 *
 * These run against a *deployed* URL (default: production) rather than a
 * locally-built server, because the Supabase env that the reader needs to load
 * real Vault data is NOT in GitHub secrets. Pointing at the public deployment
 * keeps CI secret-free and makes this a synthetic monitor of prod.
 *
 * Override the target with BASE_URL, e.g.
 *   BASE_URL=https://swift2-web-<preview>.vercel.app npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? 'https://swift2-web-nine.vercel.app';

export default defineConfig({
  testDir: './e2e',
  // Smoke tests hit a live network; give async fetches/animations room but keep
  // the whole run snappy.
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Prod content is static between deploys; no auth needed (public read).
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Definition of Done requires mobile + desktop viewports. Same smoke
      // assertions, phone-sized viewport + touch.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
