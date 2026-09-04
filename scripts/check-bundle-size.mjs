// Bundle-size gate (R7, Fable 5.1 architecture review): fail CI if the
// production client bundle for apps/web grows past a threshold, so a
// regression is caught at the PR instead of discovered live on
// longlivets.com. This is detection only — no auto-remediation.
//
// Measures apps/web/.next/static (everything the browser actually
// downloads: JS chunks, CSS, fonts placed there by next/font) after
// `npm run build --workspace @swift2/web`. Excludes .next/server and
// .next/cache, which never ship to a client.
//
//   npm run check:budget:bundle
import { statSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = join(here, '..', 'apps', 'web', '.next', 'static');

// Threshold rationale (2026-09-04, R7): the current apps/web/.next/static
// output is ~4.9 MB. 8 MB gives ~60% headroom for organic growth (new
// eras/routes/icons) while still catching a real regression — e.g. an
// accidentally-unsplit dependency or a duplicated data blob landing in the
// client bundle. Not a hard product requirement, just a trip-wire; raise it
// deliberately (with a comment here) if legitimate growth needs more room.
const BUDGET_BYTES = 8 * 1024 * 1024; // 8 MB

function dirSizeBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSizeBytes(full);
    } else if (entry.isFile()) {
      total += statSync(full).size;
    }
  }
  return total;
}

let bytes;
try {
  bytes = dirSizeBytes(staticDir);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(
      `✗ ${staticDir} not found — run "npm run build --workspace @swift2/web" before this check.`,
    );
    process.exit(1);
  }
  throw err;
}

const mb = (v) => `${(v / (1024 * 1024)).toFixed(2)} MB`;
console.log(`apps/web client bundle (.next/static): ${mb(bytes)} / ${mb(BUDGET_BYTES)} budget`);

if (bytes > BUDGET_BYTES) {
  console.error(`✗ OVER bundle-size budget by ${mb(bytes - BUDGET_BYTES)}`);
  process.exit(1);
}
console.log('✓ within bundle-size budget');
