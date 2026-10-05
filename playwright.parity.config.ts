import { defineConfig, devices } from '@playwright/test';

/**
 * One UI WP1.1c parity harness. Renders the spike routes twice, (a) the Next
 * web build (`next start`) and (b) the app's DOM entry (apps/mobile/index.web.ts,
 * exported to apps/mobile/dist/parity-web, fed from the fixture bundle), at four
 * device viewports, and compares a-vs-b and each side against committed Linux
 * baselines. See docs/one-ui/parity.md.
 *
 * Baselines never pass vacuously: updateSnapshots is 'none' unless
 * PARITY_UPDATE=1 (set only by the workflow's update-baselines job), so a
 * missing baseline is a red run. 'changed' (not 'all') rewrites only a PNG that misses its
 * tolerance, so sub-pixel render noise (#5046) never churns committed baselines.
 */
const PORT = Number(process.env.PARITY_PORT ?? 4173);
const A_PORT = Number(process.env.PARITY_A_PORT ?? 4174);

export default defineConfig({
  testDir: './e2e/parity',
  testMatch: '**/*.spec.ts',
  // No {platform}: baselines are Linux-only, generated in the pinned container.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  updateSnapshots: process.env.PARITY_UPDATE === '1' ? 'changed' : 'none',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  // The web build's CSP stays ON for Chromium: the harness injects its stylesheets same-origin (page.route + <link>).
  // WebKit refuses the inline style Playwright itself injects for EVERY page.screenshot() under that CSP (verified:
  // a bare screenshot logs the violation), so the WebKit projects alone set bypassCSP; side b has no CSP either way.
  use: { trace: 'off', reducedMotion: 'reduce' },
  webServer: [
    {
      command: 'node scripts/parity/serve.mjs',
      url: `http://127.0.0.1:${PORT}/`,
      reuseExistingServer: !process.env.CI,
      env: { PARITY_PORT: String(PORT) },
      timeout: 30_000,
    },
    {
      command: `npm run start -w @swift2/web -- -H 127.0.0.1 -p ${A_PORT}`,
      url: `http://127.0.0.1:${A_PORT}/`,
      reuseExistingServer: !process.env.CI,
      env: { PARITY_PROBE: '1' },
      timeout: 60_000,
    },
  ],
  projects: [
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'iphone-15', use: { ...devices['iPhone 15'], bypassCSP: true } },
    { name: 'ipad-pro-11-portrait', use: { ...devices['iPad Pro 11'], bypassCSP: true } },
    { name: 'ipad-pro-11-landscape', use: { ...devices['iPad Pro 11 landscape'], bypassCSP: true } },
  ],
});
