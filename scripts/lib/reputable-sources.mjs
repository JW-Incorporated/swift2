// Reputable-source allowlist for rumor `sourceTier` verification (#1965).
//
// Before this module, `sourceTier` was accepted on the authoring agent's
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
// Residual risk, documented rather than hidden (same convention as
// rumor-redlines.mjs's own "WHAT IS DELIBERATELY NOT HERE" section): the
// outlet-NAME path can still be strung along by a `reportedBy` that mentions
// a real outlet's name without that outlet actually having reported the
// claim (e.g. "MyBlog, via Reuters"). Closing that fully needs either a
// stricter structural binding between `reportedBy` and `url`, or dropping
// the name path entirely and accepting the aggregator false-positive rate
// that would cause — neither was safe to ship in this pass without a full
// corpus re-audit. RR2 (blind-item denylist) and RR4 (redline-category gate)
// both still apply independently and are unaffected by this residual gap.

/** Domains that verify a claim as literally Taylor's own — the only thing
 * that can earn `official` tier. */
export const OFFICIAL_DOMAINS = new Set(['taylorswift.com']);

/** Direct-publisher domains that earn `established` on their own. Mirrors,
 * but does not import, `packages/shared/src/news/outlet-tiers.ts`'s
 * OUTLET_TIER_MAP — that module runs under the worker's TS build, this one
 * under plain `node scripts/*.mjs` with no compile step, so it cannot be a
 * shared import; same "mirrored, not shared" convention as
 * `packages/shared/src/current-types.ts`'s SOURCE_TIERS comment. */
export const ESTABLISHED_DOMAINS = new Set([
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
export const ESTABLISHED_SOURCE_NAMES = [
  'billboard', 'variety', 'rolling stone', 'hollywood reporter', 'wwd',
  'deadline', 'stereogum', 'the guardian', 'bbc', 'bbc news',
  'the new york times', 'new york times', 'people', 'entertainment tonight',
  'et online', 'vogue', 'elle', "harper's bazaar", 'the tennessean',
  'kansas city star', 'pitchfork', 'forbes', 'nbc news', 'cbs news', 'today',
  'ap', 'associated press', 'reuters', 'usa today', 'snopes',
  'yahoo entertainment', 'the sporting news', 'w magazine', 'fox 17',
];

/** Case-insensitive `www.`-stripped hostname, or null for an unparsable url. */
export function hostOf(url) {
  try {
    return new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function domainOrSubdomainOf(host, set) {
  if (!host) return false;
  if (set.has(host)) return true;
  for (const d of set) if (host.endsWith(`.${d}`)) return true;
  return false;
}

/** True when `url`'s host resolves to Taylor's own verified domain. */
export function isOfficialDomain(url) {
  return domainOrSubdomainOf(hostOf(url), OFFICIAL_DOMAINS);
}

/** True when `url`'s host is a direct-publisher domain on the allowlist. */
export function isEstablishedDomain(url) {
  return domainOrSubdomainOf(hostOf(url), ESTABLISHED_DOMAINS);
}

/** True when `name` (already extracted to a single attribution component)
 * matches a known newsroom on the allowlist. */
export function isEstablishedName(name) {
  const n = String(name ?? '').toLowerCase().trim();
  if (!n) return false;
  return ESTABLISHED_SOURCE_NAMES.some((known) => n.includes(known));
}
