// The sourcing gates for month_item moments, and the two shrinking lists of
// records that predate them.
//
// WHY THIS FILE EXISTS
// --------------------
// Typed records (releases/tours/theories/videos) have hard-failed with no
// sources since the 2026-07-08 audit: `checkCommon` in validate-content.mjs
// calls `err('no sources — every new-type record requires >= 1 source')`.
// Moments — the largest surface on the site, and the one every reader actually
// lands on — only ever got a `warn()`. On 2026-08-11 that meant 45 moments were
// passing CI green and auto-merging to production with nothing behind them, on
// a site whose entire proposition is receipts. Warnings do not hold a line:
// `npm run validate:content` prints ~100 of them and exits 0.
//
// Both gates below are therefore ERRORS, with an explicit list of the records
// that already existed when the gate went up. The lists are not amnesty. They
// are a ratchet:
//
//   * a NEW record can never join a list — adding an entry is a deliberate,
//     reviewable edit to this file, not something a content PR does by
//     accident;
//   * a record that gets sourced must be REMOVED from its list, because
//     validate-content.mjs errors on a stale entry ("listed here but now has
//     sources"). The list therefore cannot silently rot into a permanent
//     exemption — it can only shrink.
//
// Keys are `<seed file>#<item slug>`, e.g. `1989.mjs#1989-squad`. Slug, not
// index or title: an index shifts when anything is inserted above it, and a
// title is editorial copy that gets rewritten.

import { slugify } from './longlive-sync-shared.mjs';

/**
 * Moments that shipped with no `sourceUrl` and no `moment.sources` before the
 * gate went up, and that a sourcing pass on 2026-08-11 could not honestly
 * close. Each one is an aesthetic or editorial generalisation — "the era
 * looked like this", "these songs belong together" — rather than a datable
 * assertion an outlet can be pointed at. They are connective tissue, not
 * claims of fact.
 *
 * NEVER add to this list to make a build pass. If a new moment has no source,
 * it has no business shipping; find the source or don't publish the moment.
 */
export const UNSOURCED_LEGACY = new Set([
  // 44 of the 45 were sourced on 2026-08-11. This is the residue.
  //
  // "A run of TV performances" / "Late-night and award-show stages keep Red
  // everywhere at once" / "A dense promotional stretch put the album on every
  // major stage as the release momentum peaked." It names no performance, no
  // date, no venue and no outlet, so there is nothing for a citation to
  // support — the assertion is unfalsifiable as written. Its slug also
  // promises an SNL appearance that did not happen: Swift's SNL dates are
  // November 2009 (host) and November 13, 2021 (musical guest, promoting Red
  // (Taylor's Version)); the 2021 date appears to have been transposed to
  // 2012. Filed for an editorial rewrite around the verifiable November 11,
  // 2012 MTV EMAs appearance, at which point it gets real sources and leaves
  // this list. Rewriting it is a content decision, not a sourcing one.
  'red.mjs#red-snl',
]);

/** Categories the editorial standard holds to two independent outlets. */
export const TWO_OUTLET_CATEGORIES = new Set(['relationship', 'business']);

/**
 * Source types that, per the audit §5 rubric, "alone never satisfy sourcing for
 * a factual claim" — fine as supplements, never as the citation that carries a
 * relationship or business claim.
 */
export const WEAK_SOURCE_TYPES = new Set(['wiki', 'fan_forum', 'social', 'fan_wiki', 'fan_site']);

/**
 * Hosts that are weak regardless of what `source_type` says — most pre-audit
 * citations carry no `source_type` at all, so type alone would wave through
 * exactly the "sourced entirely to Wikipedia" case this check exists to catch.
 */
const WEAK_HOSTS = [
  // — wikis, forums, social (the original §5 rubric set) —
  'wikipedia.org',
  'wikia.com',
  'fandom.com',
  'reddit.com',
  'tumblr.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'quora.com',
  // — self-publishing platforms (Codex review, 2026-08-12): the identity is
  //   the PUBLICATION, which the domain cannot establish — a Billboard
  //   newsletter and an anonymous fan blog share substack.com. Whoever wrote
  //   it, the domain proves nothing, so it counts zero toward independence.
  'medium.com',
  'substack.com',
  'blogspot.com',
  'wordpress.com',
  // — mirrors, caches, aggregators and shorteners (Codex review): they serve
  //   someone else's content, so the domain identifies a wrapper, not a
  //   reporter — citing an article directly AND through web.archive.org or
  //   bit.ly must never read as two outlets. Cite the canonical URL instead.
  'archive.org',
  'archive.today',
  'archive.ph',
  'archive.is',
  'google.com', // news.google, AMP cache, translate — all wrappers
  'ampproject.org',
  'bit.ly',
  't.co',
  'tinyurl.com',
  'goo.gl',
  'feedburner.com',
];

const isWeakHost = (host) => WEAK_HOSTS.some((w) => host === w || host.endsWith(`.${w}`));

// ---------------------------------------------------------------------------
// Source classification — outlet identity, not hostname (issue #2036)
// ---------------------------------------------------------------------------
// Until 2026-08-12 independence was counted by URL host, which had two holes,
// both fail-OPEN:
//
//   * every youtube.com link counted as one full independent outlet, whoever
//     uploaded it — so a fan re-upload read as press corroboration, and two
//     records were promoted over the two-outlet bar on exactly that
//     (issue #2036, found twice independently the same day);
//   * a URL that did not parse counted as an outlet too, because `hostOf()`
//     returns its garbage input on parse failure.
//
// The rule now: a citation contributes to the independence count only when it
// is an OUTLET — an organization reporting under its own editorial identity,
// identified by its registrable domain. A video-platform link is EVIDENCE:
// footage of an event, hosted on a platform. Evidence can be real, valuable,
// even official — but it is never independent press corroboration. An
// official upload is the subject's own primary source; a fan re-upload is
// nobody's. Both count ZERO toward independence, always. They remain
// perfectly good `moment.sources` entries and satisfy the one-source
// minimum; they just cannot be what lifts a relationship/business claim over
// the two-outlet bar.
//
// Everything unknown fails closed: an unparseable URL identifies nobody and
// counts zero, and a video link with unknown provenance is classified like a
// fan upload, never like an official one.

/**
 * Video/UGC platforms: hosting, not reporting. The evidentiary weight of a
 * link here comes from WHO uploaded it (the channel), never from the domain —
 * so the domain must never be allowed to stand in as an outlet identity.
 * Subdomain-matched like WEAK_HOSTS (`music.youtube.com` counts).
 */
export const VIDEO_PLATFORM_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com', // YouTube's privacy-embed domain — same platform
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'dai.ly',
  'twitch.tv',
  'rumble.com',
  'streamable.com',
  'odysee.com',
  'bitchute.com',
  'kick.com',
  'soundcloud.com', // audio UGC — same who-uploaded-it problem
  // The platforms' own delivery CDNs — a link here is a raw asset, not even a
  // watch page, and must not mint an outlet either.
  'googlevideo.com',
  'ytimg.com',
  'vimeocdn.com',
  'dmcdn.net',
];

const isVideoPlatformHost = (host) =>
  VIDEO_PLATFORM_HOSTS.some((v) => host === v || host.endsWith(`.${v}`));

/**
 * The subject's own web properties. Real citations — an announcement on
 * taylorswift.com can anchor a date and satisfy the one-source minimum — but
 * self-published by the subject of every claim in this corpus, so they can
 * never be one of the two INDEPENDENT outlets behind a relationship/business
 * claim. (Institutions of record — grammy.com, nyc.gov — stay outlets: they
 * are independent of the subject even when `source_type` says 'official',
 * and a blanket type-based demotion measurably delists records that deserve
 * to pass.)
 */
export const SUBJECT_OWNED_HOSTS = ['taylorswift.com', 'taylornation.com'];

const isSubjectOwnedHost = (host) =>
  SUBJECT_OWNED_HOSTS.some((v) => host === v || host.endsWith(`.${v}`));

/**
 * `source_type` values the audit §5 rubric scores 5 ("official/primary").
 * On a video-platform citation they mark an upload by the artist's or the
 * event's own verified channel — distinguishable from a fan re-upload, but
 * still ZERO independent outlets: it is the subject's own account of the
 * event, not independent reporting on it.
 */
const OFFICIAL_SOURCE_TYPES = new Set(['official', 'primary']);

/**
 * Public suffixes under which the registrable name takes THREE labels
 * (`bbc.co.uk`), not two (`co.uk` — which would collapse every UK outlet
 * into one identity). Not the full public-suffix list on purpose: this is a
 * small, auditable set covering press domains this corpus plausibly cites;
 * an unlisted ccSLD collapses too far, which fails in the strict direction
 * (counts fewer outlets, never more).
 */
const TWO_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'net.uk',
  'com.au', 'net.au', 'org.au',
  'co.nz', 'org.nz',
  'co.jp', 'ne.jp', 'or.jp',
  'co.in', 'co.kr', 'co.za',
  'com.br', 'com.mx', 'com.ar', 'com.sg', 'com.hk',
]);

/**
 * The identity a host corroborates under: its registrable domain, so
 * `music.example.com` and `www.example.com` are ONE outlet. Strictly
 * stricter than the old exact-host identity — subdomain styling can no
 * longer mint a second outlet.
 */
export function registrableDomain(host) {
  const labels = String(host).toLowerCase().split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const take = TWO_LABEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 3 : 2;
  return labels.slice(-take).join('.');
}

/**
 * One outlet, several registrable domains (Codex review, 2026-08-12): an
 * outlet's international domain or its OWN link shortener must collapse into
 * one identity, or "cite it twice, once through nyti.ms" mints a phantom
 * second outlet. Small and code-owned like everything else here — extend it
 * when a real double-count shows up, with the pair in the commit message.
 */
const OUTLET_ALIASES = new Map([
  ['bbc.co.uk', 'bbc.com'],
  ['nyti.ms', 'nytimes.com'],
  ['reut.rs', 'reuters.com'],
  ['wapo.st', 'washingtonpost.com'],
  ['n.pr', 'npr.org'],
  ['rol.st', 'rollingstone.com'],
  ['cbsn.ws', 'cbsnews.com'],
]);

/**
 * Reserved / special-use TLDs (RFC 2606, RFC 6761, .onion) plus the example
 * second-level names: a host here exists in no public DNS an outlet could
 * publish under. It used to classify as a full outlet — two `.invalid` hosts
 * passed the two-outlet bar.
 */
const RESERVED_HOST = /(^|\.)(invalid|test|example|localhost|local|internal|onion)$/;
const RESERVED_NAMES = new Set(['example.com', 'example.org', 'example.net']);

/**
 * What a citation IS, before asking what it counts for:
 *
 *   { role: 'unusable' }                    — no object, no URL, or a URL that
 *                                             does not parse. Counts zero
 *                                             everywhere; fail closed.
 *   { role: 'weak' }                        — wiki/forum/social by type or
 *                                             host. Supplement, never carrier.
 *   { role: 'evidence', provenance }        — video-platform link. provenance:
 *                                             'official' (source_type official/
 *                                             primary) | 'fan' (fan_* type) |
 *                                             'unknown' (everything else —
 *                                             treated exactly like 'fan').
 *   { role: 'subject' }                     — the subject's own web property
 *                                             (taylorswift.com). Usable, never
 *                                             independent.
 *   { role: 'outlet', identity }            — independent press; identity is
 *                                             the registrable domain.
 */
export function classifySource(source) {
  if (!source || typeof source !== 'object') return { role: 'unusable' };
  // First non-empty of the three URL spellings — an empty `url` must not
  // shadow a real `source_url` on the same citation.
  const url = [source.url, source.source_url, source.sourceUrl].find(
    (u) => typeof u === 'string' && u.trim(),
  );
  // A citation with no url is not a citation. Fail closed: an unusable entry
  // must never be what lifts a claim over the two-outlet bar.
  if (!url) return { role: 'unusable' };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { role: 'unusable' };
  }
  // Only the web can be a citation readers can follow: file:/ftp:/ws: URLs
  // used to classify as outlets (Codex review). And a URL carrying
  // credentials ('https://billboard.com@evil.example/') is visually
  // deceptive even though the parser resolves the real host — reject it.
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { role: 'unusable' };
  if (parsed.username || parsed.password) return { role: 'unusable' };
  // Normalize BEFORE any list check: lowercase, strip the trailing dot a
  // fully-qualified hostname may carry ('youtube.com.' is youtube.com — an
  // extra dot must not re-open the #2036 hole), then strip 'www.'.
  const host = parsed.hostname.toLowerCase().replace(/\.+$/, '').replace(/^www\./, '');
  if (!host) return { role: 'unusable' };
  // An IP literal (or IPv6 bracket host) is not an organization reporting
  // under its own identity — it identifies nobody. Fail closed. Likewise a
  // single-label host (localhost, an intranet name), a reserved/special-use
  // name, and a punycode (xn--) homograph — 'yоutube.com' with a Cyrillic о
  // must not sail past every list as a fresh outlet.
  if (host.startsWith('[') || host.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host))
    return { role: 'unusable' };
  if (!host.includes('.')) return { role: 'unusable' };
  if (RESERVED_HOST.test(host) || RESERVED_NAMES.has(registrableDomain(host)))
    return { role: 'unusable' };
  if (host.split('.').some((l) => l.startsWith('xn--'))) return { role: 'unusable' };
  if (WEAK_SOURCE_TYPES.has(source.source_type) || isWeakHost(host)) return { role: 'weak' };
  if (isVideoPlatformHost(host)) {
    const t = String(source.source_type ?? '');
    const provenance = OFFICIAL_SOURCE_TYPES.has(t) ? 'official' : t.startsWith('fan') ? 'fan' : 'unknown';
    return { role: 'evidence', provenance };
  }
  if (isSubjectOwnedHost(host)) return { role: 'subject' };
  const rd = registrableDomain(host);
  return { role: 'outlet', identity: OUTLET_ALIASES.get(rd) ?? rd };
}

/** True when this citation cannot, on its own, carry a factual claim. */
export function isWeakSource(source) {
  const role = classifySource(source).role;
  return role === 'weak' || role === 'unusable';
}

/**
 * How many INDEPENDENT outlets stand behind a claim. "Independent" is two
 * different outlets/bylines, not two re-syndications of one wire story
 * (docs/content-ops/editorial-voice-and-pipeline.md), so two citations under
 * one registrable domain count once however they are named — the common
 * near-miss is two Billboard articles about the same chart week. Weak
 * sources, video-platform evidence and the subject's own web properties
 * contribute zero (see the header above: an upload is footage, not
 * reporting, and a self-publication corroborates nothing — issue #2036).
 */
export function independentOutlets(sources) {
  const identities = new Set();
  for (const s of Array.isArray(sources) ? sources : []) {
    const c = classifySource(s);
    if (c.role === 'outlet') identities.add(c.identity);
  }
  return identities.size;
}

/**
 * `relationship`/`business` moments that carried only one independent outlet
 * when the two-outlet standard was first put in code on 2026-08-11. The
 * standard has been written down since the editorial pipeline doc was created
 * and had no implementation anywhere — these 21 are what a decade of "documented
 * but unenforced" actually cost, and 143 of the 164 records in those two
 * categories already met the bar without anyone checking.
 *
 * Same ratchet as UNSOURCED_LEGACY: never add, and remove on sourcing.
 */
export const SINGLE_OUTLET_LEGACY = new Set([
  // --- FOUR that carry NO usable outlet at all -----------------------------
  // These rest entirely on Wikipedia, which the rubric it was authored under
  // says "alone never satisfies sourcing for a factual claim". They are the
  // priority to clear, not the tail: each is a hard business number (a
  // year-end sales title, a Grammy nomination count, a tour gross) of exactly
  // the kind the two-outlet rule exists for. Filed as the first follow-up.
  'fearless.mjs#the-best-selling-album-in-america-for-all-of-2009',
  'red.mjs#red-goes-into-the-grammys-with-two-nominations-and-leaves-wi',
  'speak-now.mjs#speak-now-the-only-album-taylor-swift-has-ever-written-entir',
  'speak-now.mjs#the-speak-now-world-tour-closes-out-at-123-7-million',

  // --- TWENTY-ONE with one independent outlet ------------------------------
  // Mostly single-outlet Billboard or Rolling Stone chart/award reporting.
  // Nine of them are Billboard-only, and billboard.com currently 307s to a
  // tollbit paywall gateway returning HTTP 402, so a second outlet for those
  // has to come from somewhere else — that is a real obstacle, and the reason
  // this list is grandfathered rather than fixed in the same pass.
  'debut.mjs#our-song-wins-two-trophies-at-the-2008-cmt-music-awards',
  'debut.mjs#nsai-songwriter-artist-2007',
  'debut.mjs#acm-new-female-vocalist-2008',
  'evermore.mjs#red-taylors-version-sets-a-new-hot-100-record-26-debuts-in-a',
  'evermore.mjs#joe-alwyn-pound-coins',
  'fearless.mjs#fearless-spends-11-weeks-at-no-1-a-record-for-the-whole-deca',
  'fearless.mjs#love-story-pop-crossover',
  'folklore.mjs#folklores-surprise-debut-846-000-units-and-her-seventh-no-1-',
  'folklore.mjs#folklore-becomes-the-first-million-selling-album-of-2020-in-',
  'folklore.mjs#folklore-is-rolling-stones-best-album-of-2020',
  'folklore.mjs#folklore-six-grammy-nominations',
  'midnights.mjs#midnights-knocks-morgan-wallen-off-the-top-of-the-chart',
  'red.mjs#the-red-tour-closes-as-the-highest-grossing-country-tour-of-',
  'red.mjs#red-buys-high-watch',
  'reputation.mjs#one-nomination-for-the-years-best-selling-album',
  'reputation.mjs#breaking-a-rolling-stones-record-set-a-decade-earlier-in-alm',
  'speak-now.mjs#speak-now-earns-a-best-country-album-grammy-nomination',
  'speak-now.mjs#wonderstruck-her-first-fragrance-named-for-an-enchanted-lyri',
]);

/**
 * The key both lists are addressed by: `<seed file>#<identity>`, where identity
 * is the item's `slug` when it has one and `slugify(title)` otherwise. Most
 * moments have no slug — only the batch migrated out of content.ts in July 2026
 * does — and `slugify(title)` is the same derivation the sync script uses to
 * build a moment's `vault-<eraId>-<slug>` id, so it is the corpus's existing
 * notion of moment identity rather than a new one invented here.
 *
 * A title rewrite therefore changes the key. That is handled, not ignored:
 * validate-content.mjs errors on any list entry that matches no record, so a
 * retitle turns into a loud "stale entry" failure instead of an exemption that
 * silently stops applying to anything.
 */
export const momentKey = (file, item) =>
  `${file}#${item.slug ?? slugify(String(item.title ?? ''))}`;
