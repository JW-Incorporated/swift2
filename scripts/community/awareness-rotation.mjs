// Awareness lane — which feeds this run takes, and what Reddit's answer does to
// the next run. Anonymous Reddit RSS from GitHub runners is throttled (429 on
// 4 of 6 requests in one burst, 2026-10-01), so the scan makes MANY TINY RUNS
// instead of a few big ones: every ~20 minutes, 1-2 requests, the feeds that
// were fetched longest ago first. The state persists in the table
// `awareness_source_state` (one row per feed, plus GLOBAL_KEY for the whole
// IP): when it is missing or unreadable every run simply starts from the top of
// the list, never a failure.
//
// Cooldown: a failed feed (429, 403, network) sits out 30 minutes, doubling per
// consecutive failure up to 6 hours. A throttled run (any 429, or every request
// failing) also puts the WHOLE lane on cooldown the same way, because Reddit
// throttles the runner's IP, not one feed; the next runs then make no requests
// at all until it passes. A success clears the strikes.
export const GLOBAL_KEY = '*global*';
export const COOLDOWN_BASE_MS = 30 * 60_000;
export const COOLDOWN_MAX_MS = 6 * 3_600_000;

export const cooldownMs = (strikes) =>
  strikes > 0 ? Math.min(COOLDOWN_BASE_MS * 2 ** (strikes - 1), COOLDOWN_MAX_MS) : 0;

const at = (value) => {
  const ms = value ? Date.parse(value) : 0;
  return Number.isFinite(ms) ? ms : 0;
};
const isOk = (status) => status >= 200 && status < 300;

/** Map of key -> `{ last_fetched_at, cooldown_until, strikes }`; empty when the table is missing. */
export async function loadSourceState(supabase) {
  const { data, error } = await supabase
    .from('awareness_source_state')
    .select('source, last_fetched_at, cooldown_until, strikes');
  if (error) return new Map();
  return new Map((data ?? []).map((row) => [row.source, row]));
}

export const coolingDown = (state, key, now) => at(state.get(key)?.cooldown_until) > now.getTime();

/**
 * The feeds for this run: none while the whole lane cools down; otherwise the
 * least recently fetched (never fetched first, config order breaking ties),
 * skipping feeds that are cooling down, up to `budget`.
 */
export function pickFeeds(feeds, state, { now, budget }) {
  if (coolingDown(state, GLOBAL_KEY, now)) return [];
  return feeds
    .map((feed, index) => ({ feed, index, last: at(state.get(feed.id)?.last_fetched_at) }))
    .filter(({ feed }) => !coolingDown(state, feed.id, now))
    .sort((a, b) => a.last - b.last || a.index - b.index)
    .slice(0, Math.max(0, budget))
    .map(({ feed }) => feed);
}

function nextRow(key, prev, ok, now, stamp = now) {
  const strikes = ok ? 0 : (prev?.strikes ?? 0) + 1;
  return {
    source: key,
    last_fetched_at: stamp.toISOString(),
    cooldown_until: ok ? null : new Date(now.getTime() + cooldownMs(strikes)).toISOString(),
    strikes,
    updated_at: now.toISOString(),
  };
}

/**
 * Rows to persist after a run. `results` is `[{ id, status, skipped }]`; a
 * skipped feed (budget spent or run aborted) was never asked and is not touched.
 */
export function recordRun(state, results, now) {
  const asked = results.filter((r) => !r.skipped);
  if (asked.length === 0) return [];
  // One millisecond apart, in request order, so feeds asked in the same run keep
  // their order in the next rotation instead of tying.
  const rows = asked.map((r, i) =>
    nextRow(r.id, state.get(r.id), isOk(r.status), now, new Date(now.getTime() + i)),
  );
  const throttled = asked.some((r) => r.status === 429) || asked.every((r) => !isOk(r.status));
  rows.push(nextRow(GLOBAL_KEY, state.get(GLOBAL_KEY), !throttled, now));
  return rows;
}

/** Best-effort write; a failed state write never fails the run. */
export async function saveSourceState(supabase, rows) {
  if (rows.length === 0) return;
  try {
    await supabase.from('awareness_source_state').upsert(rows, { onConflict: 'source' });
  } catch {
    // the next run just starts from the same state
  }
}

/** Random delay before the first request so the runs do not line up on the cron minute. */
export const jitterMs = (random, maxMs) => Math.floor(random() * Math.max(0, maxMs));
