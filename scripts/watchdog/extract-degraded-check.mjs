// Verdict for watchdog.yml's "knowledge-extract degraded" alert (issue #4647
// item 4). news-worker.yml stays green on a degraded no-op, so the worker
// emits a `::warning::` annotation containing "extract-degraded:"
// (apps/worker/src/extract/degraded.ts); the watchdog step collects, per
// recent scheduled run, whether that annotation was present.
//
// Usage: node scripts/watchdog/extract-degraded-check.mjs < runs.json
//   runs.json = [{ "createdAt": ISO, "degraded": boolean }, ...]
//   prints `alert` or `ok`.
import { readFileSync } from 'node:fs';

// news-worker runs every 4h, so 6 consecutive runs = 24h.
export const SUSTAINED_RUNS = 6;

export function verdict(runs, sustained = SUSTAINED_RUNS) {
  const last = [...runs]
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, sustained);
  return last.length >= sustained && last.every((r) => r.degraded === true) ? 'alert' : 'ok';
}

const invokedDirectly =
  process.argv[1] && process.argv[1].replaceAll('\\', '/').endsWith('/extract-degraded-check.mjs');
if (invokedDirectly) {
  process.stdout.write(verdict(JSON.parse(readFileSync(0, 'utf8'))) + '\n');
}
