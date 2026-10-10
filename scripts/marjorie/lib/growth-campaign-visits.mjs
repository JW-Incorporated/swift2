// First-party per-campaign social visits for the weekly growth collector
// (#4719). Reads the `usage_daily` rows apps/web/lib/campaign-visit.ts bumps
// (scope `utm-visit:<family>`, one row per day). Free, no Vercel tier. Counts
// are pageviews (one per arriving document load), not unique visitors, so
// `visitors` is always null. Never throws — a failure is `{ rows: null, note }`.
import { isSchemaPending } from '../../lib/cli.mjs';

export const SCOPE_PREFIX = 'utm-visit:';

export const FIRST_PARTY_NOTE =
  'Visits are first-party counts of arriving utm_medium=social page loads (usage_daily scope utm-visit:<family>, UTC days, crawlers/prefetch excluded), grouped by campaign family. Pageviews (best-effort, spoofable, throttled per instance); unique visitors are not collected. Counting began when the site first shipped the counter, so earlier weeks read 0.';

const day = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Pure: `usage_daily` rows → `[{ campaign, pageviews, visitors: null }]`, biggest first. */
export function summarizeCampaignVisits(rows) {
  const totals = new Map();
  for (const r of rows || []) {
    if (typeof r?.scope !== 'string' || !r.scope.startsWith(SCOPE_PREFIX)) continue;
    const n = Number(r.call_count);
    if (!Number.isFinite(n)) continue;
    const campaign = r.scope.slice(SCOPE_PREFIX.length);
    totals.set(campaign, (totals.get(campaign) ?? 0) + n);
  }
  return [...totals].map(([campaign, pageviews]) => ({ campaign, pageviews, visitors: null })).sort((a, b) => b.pageviews - a.pageviews);
}

/** `{ rows, note }`: `rows` is `[]` (a real zero) when nothing arrived, `null` only when the read itself failed. */
export async function fetchCampaignVisits(supabase, win) {
  if (!supabase) return { rows: null, note: 'Campaign visits not collected: no Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) in this environment.' };
  try {
    const { data, error } = await supabase
      .from('usage_daily')
      .select('scope, call_count')
      .like('scope', `${SCOPE_PREFIX}%`)
      .gt('usage_date', day(win.startMs))
      .lte('usage_date', day(win.endMs));
    if (error) {
      if (isSchemaPending(error)) return { rows: [], note: FIRST_PARTY_NOTE };
      throw error;
    }
    return { rows: summarizeCampaignVisits(data), note: FIRST_PARTY_NOTE };
  } catch (err) {
    return { rows: null, note: `Campaign visits not collected: ${String(err?.message ?? err).slice(0, 160)}` };
  }
}
