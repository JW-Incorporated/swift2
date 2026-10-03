// Ratified perf gate (One UI WP2.2-B): the reader snapshot core build, timed in
// Chromium around `fromBakedCore(...)` in WebReaderSnapshotProvider
// (performance.measure 'snapshot-core'). Median <= 15 ms unthrottled over >= 10
// FRESH browser contexts; p90/max reported; 4x CPU throttle is report-only.
//
// Run against a production build with the parity fixture applied:
//   npx tsx --tsconfig apps/web/tsconfig.json scripts/parity/make-fixture.mjs --apply
//   (cd apps/web && npx next build) && npm run start -w @swift2/web -- -H 127.0.0.1 -p 4180
//   PERF_URL=http://127.0.0.1:4180/ npx playwright test e2e/perf/snapshot-build.spec.ts --config e2e/perf/playwright.perf.config.ts
import { expect, test, type Browser } from '@playwright/test';

const URL = process.env.PERF_URL ?? 'http://127.0.0.1:4180/';
const SAMPLES = Number(process.env.PERF_SAMPLES ?? 12);
const MIN_SAMPLES = 10;
const GATE_MS = 15;

async function sample(browser: Browser, throttle: number): Promise<number> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    if (throttle > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    }
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForFunction(() => performance.getEntriesByName('snapshot-core').length > 0, null, { timeout: 30_000 });
    return await page.evaluate(() => performance.getEntriesByName('snapshot-core')[0].duration);
  } finally {
    await context.close();
  }
}

const stats = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
  const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { median, p90: q(0.9), max: s[s.length - 1] };
};

for (const throttle of [1, 4]) {
  test(`snapshot core build, ${throttle === 1 ? 'unthrottled (gate)' : '4x CPU (report only)'}`, async ({ browser }) => {
    test.setTimeout(300_000);
    expect(Number.isInteger(SAMPLES) && SAMPLES >= MIN_SAMPLES, `PERF_SAMPLES must be an integer >= ${MIN_SAMPLES}, got ${process.env.PERF_SAMPLES}`).toBe(true);
    const xs: number[] = [];
    for (let i = 0; i < SAMPLES; i++) xs.push(await sample(browser, throttle));
    const { median, p90, max } = stats(xs);
    console.log(`PERF throttle=${throttle}x samples_ms=${xs.map((x) => x.toFixed(2)).join(',')}`);
    console.log(`PERF throttle=${throttle}x median=${median.toFixed(2)} p90=${p90.toFixed(2)} max=${max.toFixed(2)} n=${xs.length}`);
    if (throttle === 1) expect(median).toBeLessThanOrEqual(GATE_MS);
  });
}
