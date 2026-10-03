import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PERF_PORT ?? 4180);

// Builds and serves the web app with the parity fixture applied
// (scripts/parity/make-fixture.mjs --apply must have run first; the
// workflow does this). Run from the repo root:
//   npx playwright test --config e2e/perf/playwright.config.ts
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'] },
  webServer: {
    command: `npm run build -w @swift2/web && npm run start -w @swift2/web -- -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
