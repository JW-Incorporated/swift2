import { defineConfig, devices } from '@playwright/test';

/**
 * One UI WP1.1c parity harness: renders the app's DOM UI (apps/mobile/index.web.tsx,
 * exported to apps/mobile/dist/parity-web) in a browser at four device viewports
 * and compares against committed Linux baselines. See docs/one-ui/parity.md.
 *
 * Baselines never pass vacuously: updateSnapshots is 'none' unless
 * PARITY_UPDATE=1 (set only by the workflow's update-baselines job), so a
 * missing baseline is a red run.
 */
const PORT = Number(process.env.PARITY_PORT ?? 4173);

export default defineConfig({
  testDir: './e2e/parity',
  testMatch: '**/*.spec.ts',
  // No {platform}: baselines are Linux-only, generated in the pinned container.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  updateSnapshots: process.env.PARITY_UPDATE === '1' ? 'all' : 'none',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 200,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'off',
  },
  webServer: {
    command: 'node scripts/parity/serve.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    env: { PARITY_PORT: String(PORT) },
    timeout: 30_000,
  },
  projects: [
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] } },
    { name: 'ipad-pro-11-portrait', use: { ...devices['iPad Pro 11'] } },
    { name: 'ipad-pro-11-landscape', use: { ...devices['iPad Pro 11 landscape'] } },
  ],
});
