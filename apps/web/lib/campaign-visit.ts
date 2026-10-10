/**
 * First-party count of arriving utm-tagged social visits (#4719).
 *
 * Vercel's per-campaign breakdown needs a paid tier (HTTP 402), so the site
 * counts the visits itself: one `usage_daily` row per `(scope, day)` — the
 * existing table + `increment_usage_daily` RPC (no migration, no new secret) —
 * with scope `utm-visit:<family>`. Campaign family + day only: no IP, no user
 * id, no per-visitor row. Families are the closed set Tree uses (the first
 * `:` segment of `utm_campaign`, `scripts/social/lib/scorecard-report.mjs`
 * KNOWN_FAMILIES); anything else lands in `other`, so a crafted URL cannot
 * mint unbounded rows. Pageview-grain (a visit = one document load), not
 * unique visitors. Crawlers/link-unfurlers and prefetches are not counted.
 *
 * Best-effort: at most one RPC per scope per second per server instance, so a
 * hammered URL cannot amplify DB writes (counts are therefore pageviews,
 * best-effort, spoofable, throttled per instance).
 *
 * Reader: `scripts/marjorie/lib/growth-campaign-visits.mjs`. Fire-and-forget:
 * a failure of any kind is swallowed and never touches the page response.
 */
export const CAMPAIGN_FAMILIES = ['launch', 'thread', 'timeline', 'mood', 'heartbeat'] as const;
export const CAMPAIGN_SCOPE_PREFIX = 'utm-visit:';

const NON_HUMAN = /bot|crawl|spider|preview|unfurl|facebookexternalhit|meta-externalagent|slurp|discord|telegram|whatsapp|linkedin|embedly|headless/i;

/** `usage_daily` scope for this request, or `null` when it is not a counted social arrival. */
export function campaignVisitScope(method: string, url: URL, headers: Headers): string | null {
  if (method !== 'GET') return null;
  if (url.searchParams.get('utm_medium')?.toLowerCase() !== 'social') return null;
  const campaign = url.searchParams.get('utm_campaign');
  if (!campaign) return null;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/embed/')) return null;
  const purpose = `${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''}`;
  if (/prefetch|prerender/i.test(purpose) || headers.has('next-router-prefetch')) return null;
  if (NON_HUMAN.test(headers.get('user-agent') ?? '')) return null;
  const head = campaign.toLowerCase().split(':')[0];
  const family = (CAMPAIGN_FAMILIES as readonly string[]).includes(head) ? head : 'other';
  return `${CAMPAIGN_SCOPE_PREFIX}${family}`;
}

const THROTTLE_MS = 1000;
const lastSent = new Map<string, number>();
let warnedMissingEnv = false;

/** Test hook: clears the per-instance throttle and warn-once state. */
export function resetCampaignVisitState(): void {
  lastSent.clear();
  warnedMissingEnv = false;
}

/** Bumps today's counter for `scope`; resolves `false` (never throws) on any degraded state. */
export async function recordCampaignVisit(scope: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn('campaign-visit: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing; utm visits are not being counted');
    }
    return false;
  }
  const now = Date.now();
  const prev = lastSent.get(scope);
  if (prev !== undefined && now - prev < THROTTLE_MS) return false;
  lastSent.set(scope, now);
  try {
    const res = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/increment_usage_daily`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ p_scope: scope }),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
