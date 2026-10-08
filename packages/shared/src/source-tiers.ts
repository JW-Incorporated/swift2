// ONE source-tier map (Fable 5.1 architecture review, R9). Before this file,
// five modules each held their own hand-typed copy of "which outlets/domains
// count as which tier", with no structural guarantee they agreed:
//
//   - packages/shared/src/news/outlet-tiers.ts    — OUTLET_TIER_MAP (worker
//     domain -> tier for resolved Google News redirects)
//   - scripts/lib/reputable-sources.mjs           — OFFICIAL_DOMAINS /
//     ESTABLISHED_DOMAINS / ESTABLISHED_SOURCE_NAMES (rumor sourceTier gate)
//   - scripts/lib/knowledge-rows.mjs              — SOURCE_TIER_BY_TYPE
//     (Vault citation type -> knowledge_doc.source_tier)
//   - packages/shared/src/news/credibility.ts     — computeVerificationStatus
//     (corroboration -> verification_status; consumes the same SourceTier)
//   - scripts/sync-longlive-content.mjs           — RUMOR_SOURCE_TIERS
//     (RumorSourceTier vocabulary: official/established/tabloid/social)
//
// This module is now the one place each of those lists/functions is
// authored. No rule changes were made moving them here — the data is
// unchanged, just no longer copy-pasted.
//
// scripts/**/*.mjs run under plain `node`, no compile step, so they cannot
// `import` this .ts file directly (same constraint reputable-sources.mjs
// documented before this consolidation). The DATA constants below are
// therefore also emitted as a generated twin, scripts/lib/source-tiers.
// generated.mjs (scripts/sync-source-tiers.mjs, registered in
// scripts/lib/generated-content.mjs, wired into `npm run check:generated`)
// — this file stays the single hand-authored source of truth, the twin is
// its plain-JS mirror. The functions here (hostOf, isOfficialDomain, etc.)
// are NOT duplicated into the twin — scripts/lib/reputable-sources.mjs
// imports the twin's data and keeps its own (unchanged) function bodies,
// since logic isn't the drift risk the domain lists were.

import type { SourceTier, VerificationStatus } from './news/news-types';

// ── Outlet domain -> tier (worker's Google News re-tiering) ────────────────
// Drives resolveGoogleNewsItem's re-tiering once a Google News redirect
// resolves to a real publisher URL: a domain not listed here stays
// `unverified` even after resolving — this map is the only thing allowed to
// grant `established`, never an inferred guess.

export interface OutletTierEntry {
  /** Display name used as `outlet_name` when a redirect resolves here. */
  name: string;
  tier: SourceTier;
}

export const OUTLET_TIER_MAP: Record<string, OutletTierEntry> = {
  'billboard.com': { name: 'Billboard', tier: 'established' },
  'variety.com': { name: 'Variety', tier: 'established' },
  'rollingstone.com': { name: 'Rolling Stone', tier: 'established' },
  'hollywoodreporter.com': { name: 'The Hollywood Reporter', tier: 'established' },
  'wwd.com': { name: 'WWD', tier: 'established' },
  'deadline.com': { name: 'Deadline', tier: 'established' },
  'stereogum.com': { name: 'Stereogum', tier: 'established' },
  'theguardian.com': { name: 'The Guardian', tier: 'established' },
  'bbc.co.uk': { name: 'BBC News', tier: 'established' },
  'bbc.com': { name: 'BBC News', tier: 'established' },
  'nytimes.com': { name: 'The New York Times', tier: 'established' },
  'people.com': { name: 'People', tier: 'established' },
  'etonline.com': { name: 'Entertainment Tonight', tier: 'established' },
  'vogue.com': { name: 'Vogue', tier: 'established' },
  'elle.com': { name: 'Elle', tier: 'established' },
  'harpersbazaar.com': { name: "Harper's Bazaar", tier: 'established' },
  'tennessean.com': { name: 'The Tennessean', tier: 'established' },
  'kansascity.com': { name: 'The Kansas City Star', tier: 'established' },
  'pitchfork.com': { name: 'Pitchfork', tier: 'established' },
};

/** Case-insensitive, `www.`-stripped lookup. Unknown domain -> undefined (caller must keep the item unverified). */
export function lookupOutletTier(domain: string): OutletTierEntry | undefined {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return OUTLET_TIER_MAP[normalized];
}

// ── Corroboration -> verification_status (rules-first credibility model) ───
// Pure function of a story's corroboration breakdown — the base signal is
// WHO reported it and HOW MANY independently did, never an LLM's say-so.
// `disputed`/`debunked` require an explicit signal (a tiered outlet
// publishing a denial/correction, or founder/moderator action) and are never
// auto-computed from corroboration alone.

export interface Corroboration {
  tier: SourceTier;
}

/**
 * Computes verification_status from a story's supporting-source breakdown.
 * `explicitSignal`, when set, always wins — this function never invents
 * disputed/debunked on its own.
 */
export function computeVerificationStatus(
  corroboration: Corroboration[],
  explicitSignal?: 'disputed' | 'debunked',
): VerificationStatus {
  if (explicitSignal) return explicitSignal;
  if (corroboration.length === 0) return 'single_source';
  if (corroboration.some((c) => c.tier === 'official')) return 'official';
  // Distinct-outlet corroboration matters, not raw count — see news_story_source's
  // audit trail, which is where actual outlet identity is deduped before this runs.
  if (corroboration.length >= 2) return 'corroborated';
  // corroboration.length === 1 here (0 and 2+ handled above), so this index is safe.
  return corroboration[0]?.tier === 'established' ? 'single_source' : 'rumor';
}

// ── Reputable-source allowlist for rumor `sourceTier` verification (#1965) ─
//
// Before this existed, `sourceTier` was accepted on the authoring agent's
// say-so: any `reportedBy` + any `url` could claim `established` or
// `official`, and the only structural check (RR2, rumor-redlines.mjs) fires
// only for 19 named blind-item accounts. An arbitrary blog, a look-alike
// domain (`reuters-daily.co`), or a seeded wiki/forum page could claim
// `established` or `official` and no rule ever fired.
//
// Two independent, narrower checks replace that self-declaration:
//
//   - `established` is earned by a real domain OR a real outlet NAME. Domain
//     alone is not enough on its own to cover the corpus: real content
//     routinely cites a real newsroom through a syndication/aggregator URL
//     (Yahoo, AOL host People, Us Weekly, Cosmopolitan, Page Six, etc. —
//     `reportedBy` correctly names the ORIGINATING outlet per
//     rumor-redlines.mjs's `primarySource()`, the url is just wherever the
//     piece was read). Either signal being real is sufficient; an unlisted
//     domain AND an unrecognized name together is not.
//   - `official` is earned ONLY by domain. No press outlet, however
//     reputable, earns `official` by reporting ON Taylor — only a citation
//     that actually resolves to her own channel does (#1965 hardening fix
//     #2: "an unverifiable official tier should fail closed"). The list is
//     deliberately narrow — extend only with a verified addition, never a
//     plausible-sounding one.
//
// Residual risk, documented rather than hidden: the outlet-NAME path can
// still be strung along by a `reportedBy` that mentions a real outlet's name
// without that outlet actually having reported the claim (e.g. "MyBlog, via
// Reuters"). Closing that fully needs either a stricter structural binding
// between `reportedBy` and `url`, or dropping the name path entirely and
// accepting the aggregator false-positive rate that would cause — neither
// was safe to ship without a full corpus re-audit. RR2 (blind-item
// denylist) and RR4 (redline-category gate) both still apply independently.

/** Domains that verify a claim as literally Taylor's own — the only thing
 * that can earn `official` tier. */
export const OFFICIAL_DOMAINS: ReadonlySet<string> = new Set(['taylorswift.com']);

/** Direct-publisher domains that earn `established` on their own. */
export const ESTABLISHED_DOMAINS: ReadonlySet<string> = new Set([
  'billboard.com', 'variety.com', 'rollingstone.com', 'hollywoodreporter.com',
  'wwd.com', 'deadline.com', 'stereogum.com', 'theguardian.com', 'bbc.co.uk',
  'bbc.com', 'nytimes.com', 'people.com', 'etonline.com', 'vogue.com',
  'elle.com', 'harpersbazaar.com', 'tennessean.com', 'kansascity.com',
  'pitchfork.com', 'forbes.com', 'nbcnews.com', 'cbsnews.com', 'today.com',
  'apnews.com', 'reuters.com', 'usatoday.com', 'snopes.com',
]);

/** Outlet NAMES (lowercase) that earn `established` when they appear as the
 * PRIMARY or "via"-carrier component of a rumor's `reportedBy` — see
 * rumor-redlines.mjs's `primarySource()`/`viaSource()`, which extract those
 * two components specifically (not a whole-string scan) to keep this narrow. */
export const ESTABLISHED_SOURCE_NAMES: readonly string[] = [
  'billboard', 'variety', 'rolling stone', 'hollywood reporter', 'wwd',
  'deadline', 'stereogum', 'the guardian', 'bbc', 'bbc news',
  'the new york times', 'new york times', 'people', 'entertainment tonight',
  'et online', 'vogue', 'elle', "harper's bazaar", 'the tennessean',
  'kansas city star', 'pitchfork', 'forbes', 'nbc news', 'cbs news', 'today',
  'ap', 'associated press', 'reuters', 'usa today', 'snopes',
  'yahoo entertainment', 'the sporting news', 'w magazine', 'fox 17',
];

/** Case-insensitive `www.`-stripped hostname, or null for an unparsable url. */
export function hostOf(url: unknown): string | null {
  try {
    return new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function domainOrSubdomainOf(host: string | null, set: ReadonlySet<string>): boolean {
  if (!host) return false;
  if (set.has(host)) return true;
  for (const d of set) if (host.endsWith(`.${d}`)) return true;
  return false;
}

/** True when `url`'s host resolves to Taylor's own verified domain. */
export function isOfficialDomain(url: unknown): boolean {
  return domainOrSubdomainOf(hostOf(url), OFFICIAL_DOMAINS);
}

/** True when `url`'s host is a direct-publisher domain on the allowlist. */
export function isEstablishedDomain(url: unknown): boolean {
  return domainOrSubdomainOf(hostOf(url), ESTABLISHED_DOMAINS);
}

/** True when `name` (already extracted to a single attribution component)
 * matches a known newsroom on the allowlist. */
export function isEstablishedName(name: unknown): boolean {
  const n = String(name ?? '').toLowerCase().trim();
  if (!n) return false;
  return ESTABLISHED_SOURCE_NAMES.some((known) => n.includes(known));
}

// ── Vault citation type -> knowledge_doc.source_tier ────────────────────────
// Best `source_tier` across a doc's citations (scripts/lib/knowledge-rows.mjs
// sourceTierFrom). Vault content is editorially reviewed even when a
// per-source `type` wasn't recorded, so an unscored source defaults to
// 'established' there — never the raw-ingest-only 'unverified' tier.

export const VAULT_SOURCE_TIER_BY_TYPE: Record<string, 'official' | 'established' | 'fan'> = {
  official: 'official',
  interview: 'official',
  reputable_press: 'established',
  chart_database: 'established',
  awards_database: 'established',
  fashion_database: 'established',
  wiki: 'established',
  fan_forum: 'fan',
  social: 'fan',
  video: 'established',
  image_source: 'established',
};

// ── RumorSourceTier vocabulary (scripts/sync-longlive-content.mjs) ─────────
// Mirrors RumorSourceTier in apps/web/lib/longlive/types.ts. Distinct
// taxonomy from SourceTier above: rumor content additionally distinguishes
// `tabloid` from `social`, and has no `unverified`/`fan` member.

export const RUMOR_SOURCE_TIERS: readonly string[] = ['official', 'established', 'tabloid', 'social'];
