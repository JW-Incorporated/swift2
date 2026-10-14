// Live feed quality watchdog (Content fix 6/6) — deterministic, zero-AI.
//
// WHY THIS EXISTS. Content fix 3/6 (#5629) added a hard publish gate
// (`packages/shared/src/current-item-quality.ts` → `evaluateCurrentItemQuality`)
// at write time AND at every read path. This check is the regression alarm on
// top of it: it asks what the LIVE SITE actually serves, not what the code
// says it should serve, and pages the founders if either
//
//   1. `visible` — any current_item the site is serving right now
//      (GET https://www.longlivets.com/vault/live/<CURRENT_ERA_ID>, the exact
//      route the browser's feed hooks read) lacks an image or fails the
//      shared publish gate; or
//   2. `hold-rate` — the pipeline is broken upstream: of the current_item
//      rows created in the last 24h (at least MIN_SAMPLE of them), 100% were
//      held for `missing_image`, or 100% were held for any reason. The gate
//      keeps those off the site, so the feed just goes quiet — exactly the
//      silent-failure shape nothing else would notice.
//
// SAME GATE, NOT A COPY. The visible check imports the shared validator
// straight from packages/shared/src/current-item-quality.ts (Node 24 strips
// the TypeScript types natively; that file has zero imports), so the
// watchdog cannot drift from the rule the site enforces. No `npm ci` needed,
// matching the dependency-free watchdog.yml convention.
//
// DEDUPE / AUTO-RESOLVE. Each check has its own persistent alert title in
// watchdog.yml and goes through scripts/watchdog/upsert-alert.sh, which only
// notifies (Discord, with the founder @-mention) on the open transition and
// comments+closes when the condition clears. One page per incident.
//
// Usage:
//   node scripts/watchdog/feed-quality-check.mjs --check visible   --alert-body /tmp/a.md
//   node scripts/watchdog/feed-quality-check.mjs --check hold-rate --alert-body /tmp/a.md
// Exit: 0 = healthy (caller closes the alert)
//       1 = regression confirmed (caller opens/refreshes the alert)
//       2 = could not check (site unreachable, no credentials, column not
//           migrated yet) — caller leaves alert state unchanged. A site
//           outage is the prod smoke check's job to page on; double-paging
//           it here would just be noise.
/* global AbortSignal */ // Node 17.3+ built-in, same convention as knowledge-freshness.mjs
import { writeFileSync } from 'node:fs';
import { evaluateCurrentItemQuality } from '../../packages/shared/src/current-item-quality.ts';
import { runMain } from '../lib/cli.mjs';

export const SITE_ORIGIN = process.env.FEED_WATCH_ORIGIN || 'https://www.longlivets.com';
// Mirrors packages/experience/src/eras.ts's CURRENT_ERA_ID — the only era
// whose feed carries current_items (apps/web/lib/longlive/use-era-current-feed.ts).
export const CURRENT_ERA_ID = process.env.FEED_WATCH_ERA || 'tloas';
export const HOLD_WINDOW_HOURS = 24;
export const MIN_SAMPLE = Number(process.env.FEED_HOLD_MIN_SAMPLE || 5);
const FETCH_TIMEOUT_MS = 30_000;

// ── Pure logic (unit-tested) ────────────────────────────────────────────────

/**
 * Evaluate every item the live feed is serving. `items` is the `items` array
 * of the /vault/live/<era> payload (mapped CurrentItem objects).
 * Returns { status: 'ok' | 'fail', checked, failures: [{ id, headline, reason }] }.
 */
export function evaluateVisibleItems(items) {
  if (!Array.isArray(items)) {
    return { status: 'unknown', checked: 0, failures: [], reason: 'payload had no items array' };
  }
  const failures = [];
  for (const item of items) {
    const verdict = evaluateCurrentItemQuality({
      headline: item?.headline ?? '',
      summary: item?.summary ?? '',
      detail: item?.detail ?? '',
      imageUrl: item?.imageUrl ?? undefined,
      // The read path only serves redline_ok rows; a missing flag counts as a fail.
      redlineOk: item?.redlineOk === true,
    });
    if (!verdict.ok) {
      failures.push({ id: item?.id ?? '(no id)', headline: item?.headline ?? '(no headline)', reason: verdict.reason });
    }
  }
  return { status: failures.length ? 'fail' : 'ok', checked: items.length, failures };
}

/**
 * Decide whether the hold rate says the pipeline is broken. `rows` are
 * current_item rows created inside the window: { redline_ok, quality_hold_reason }.
 * Below MIN_SAMPLE new rows there is not enough signal to call it broken
 * (a quiet news day is not an incident; knowledge-freshness covers silence).
 */
export function evaluateHoldRate(rows, { minSample = MIN_SAMPLE } = {}) {
  const total = rows.length;
  const held = rows.filter((r) => r.redline_ok !== true).length;
  const missingImage = rows.filter((r) => r.quality_hold_reason === 'missing_image').length;
  const byReason = {};
  for (const r of rows) {
    if (r.redline_ok === true) continue;
    const k = r.quality_hold_reason ?? 'redline_or_unknown';
    byReason[k] = (byReason[k] ?? 0) + 1;
  }
  const stats = { total, held, missingImage, byReason, minSample };
  if (total < minSample) return { status: 'ok', insufficientSample: true, ...stats };
  if (missingImage === total) {
    return { status: 'fail', trigger: 'missing_image', ...stats };
  }
  if (held === total) {
    return { status: 'fail', trigger: 'all_held', ...stats };
  }
  return { status: 'ok', ...stats };
}

export function renderVisibleBody(result, { url, now = new Date() } = {}) {
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  if (result.status === 'ok') {
    return `All ${result.checked} item(s) the live feed is serving (${url}) pass the shared publish gate (image + copy floor) as of ${stamp}.\n`;
  }
  const lines = [
    `**${result.failures.length} of ${result.checked} item(s) visible on longlivets.com right now fail the publish gate** (no image, or copy below the floor) — checked ${stamp}.`,
    '',
    ...result.failures.slice(0, 25).map((f) => `- \`${f.reason}\` — ${f.headline} (\`${f.id}\`)`),
  ];
  if (result.failures.length > 25) lines.push(`- …and ${result.failures.length - 25} more`);
  lines.push(
    '',
    `Source: ${url} (the exact route the site's feed reads). The gate is \`evaluateCurrentItemQuality\` in packages/shared/src/current-item-quality.ts — the same one the worker and read paths use, so a failure here means a path is bypassing it.`,
    '',
    'This is the zero-AI feed-quality watchdog (watchdog.yml, scripts/watchdog/feed-quality-check.mjs, Content fix 6/6). It closes itself once every visible item passes.',
  );
  return lines.join('\n') + '\n';
}

export function renderHoldBody(result, { now = new Date() } = {}) {
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const reasons = Object.entries(result.byReason)
    .map(([k, n]) => `\`${k}\`: ${n}`)
    .join(', ') || 'none';
  if (result.status === 'ok') {
    const tail = result.insufficientSample
      ? ` (fewer than ${result.minSample} new items — not enough to judge)`
      : '';
    return `News pipeline hold rate healthy as of ${stamp}: ${result.held}/${result.total} new item(s) held in the last ${HOLD_WINDOW_HOURS}h${tail}. Holds by reason: ${reasons}.\n`;
  }
  const what =
    result.trigger === 'missing_image'
      ? `**every one of the ${result.total} new items in the last ${HOLD_WINDOW_HOURS}h was held for \`missing_image\`** — image resolution is broken (Content fix 1/6 path: news_story.top_image_url → og:image fallback → allowlist).`
      : `**every one of the ${result.total} new items in the last ${HOLD_WINDOW_HOURS}h was held by the publish gate** — enrichment is stuck, nothing new can reach the feed.`;
  return [
    `The news pipeline is producing items but none can publish: ${what}`,
    '',
    `Holds by reason: ${reasons}. Checked ${stamp}.`,
    '',
    'The publish gate is doing its job (nothing bad is live); the feed is going quiet instead. Check the latest news-worker runs and the image/enrichment stage.',
    '',
    'Zero-AI watchdog (watchdog.yml, scripts/watchdog/feed-quality-check.mjs, Content fix 6/6). Closes itself once new items publish again.',
  ].join('\n') + '\n';
}

// ── I/O ─────────────────────────────────────────────────────────────────────

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function runVisible(alertFile) {
  const url = `${SITE_ORIGIN}/vault/live/${CURRENT_ERA_ID}`;
  let body;
  try {
    const res = await fetchJson(url, { 'Cache-Control': 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = JSON.parse(res.text);
  } catch (err) {
    console.log(`feed-quality-check: could not load ${url} (${err.message}) — leaving alert state unchanged.`);
    return 2;
  }
  const result = evaluateVisibleItems(body?.items);
  if (result.status === 'unknown') {
    console.log(`feed-quality-check: ${url} ${result.reason} — leaving alert state unchanged.`);
    return 2;
  }
  console.log(`feed-quality-check visible: ${result.status} — ${result.failures.length}/${result.checked} failing`);
  if (alertFile) writeFileSync(alertFile, renderVisibleBody(result, { url }));
  return result.status === 'ok' ? 0 : 1;
}

async function runHoldRate(alertFile) {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    console.log('feed-quality-check hold-rate: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping.');
    return 2;
  }
  const since = new Date(Date.now() - HOLD_WINDOW_HOURS * 3600_000).toISOString();
  const url =
    `${base.replace(/\/$/, '')}/rest/v1/current_item` +
    `?select=id,redline_ok,quality_hold_reason,created_at&created_at=gte.${encodeURIComponent(since)}` +
    '&order=created_at.desc&limit=1000';
  let rows;
  try {
    const res = await fetchJson(url, { apikey: key, Authorization: `Bearer ${key}` });
    if (!res.ok) {
      if (/schema cache|does not exist|PGRST20[45]/i.test(res.text) || res.status === 404) {
        console.log('feed-quality-check hold-rate: quality_hold_reason column not migrated yet — skipping.');
      } else {
        console.log(`feed-quality-check hold-rate: query HTTP ${res.status} — skipping.`);
      }
      return 2;
    }
    rows = JSON.parse(res.text);
  } catch (err) {
    console.log(`feed-quality-check hold-rate: query failed (${err.message}) — skipping.`);
    return 2;
  }
  const result = evaluateHoldRate(Array.isArray(rows) ? rows : []);
  console.log(
    `feed-quality-check hold-rate: ${result.status} — held ${result.held}/${result.total}, missing_image ${result.missingImage}`,
  );
  if (alertFile) writeFileSync(alertFile, renderHoldBody(result));
  return result.status === 'ok' ? 0 : 1;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const check = arg('--check');
  const alertFile = arg('--alert-body');
  if (check === 'visible') return runVisible(alertFile);
  if (check === 'hold-rate') return runHoldRate(alertFile);
  console.error('usage: feed-quality-check.mjs --check visible|hold-rate [--alert-body <file>]');
  return 2;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'feed-quality-check.mjs';
if (invokedDirectly) runMain(main, { name: 'feed-quality-check' });
