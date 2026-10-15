// Publish gate (Content fix 3/6, docs/proposals/2026-08-23-knowledge-engine.md
// §3 "nothing goes live without an image and good copy"). Portable, zero I/O
// — a pure predicate over a `CurrentItem`-shaped value, reused at BOTH
// write time (`apps/worker/src/extract/write-knowledge.ts`, to hold a row
// with a reason instead of marking it servable) and read time (every path
// that selects current items for display: `packages/core/src/knowledge/
// client.ts`'s `getCurrentItems`/`getRecentItems`, and
// `packages/experience/src/current-feed.ts`'s `currentFeedEntries`), so a
// failing item can never reach the feed through any caller — not just the
// one write-time guard.
//
// Every threshold this gate checks lives in the single exported
// `CURRENT_ITEM_QUALITY_THRESHOLDS` constant below (the card's "tune numbers
// in one exported constant" instruction) — change the bar in one place.

/**
 * Hotlink host allowlist. MIRROR, NOT IMPORT (same boundary rule as
 * `redline.ts`'s header: "packages/shared cannot import from scripts/
 * without breaking the portability contract" — this module must stay
 * zero-I/O and loadable by web/mobile/worker alike, which rules out
 * depending on a `scripts/` Node CLI config). This starts with the existing,
 * reviewed reputation allowlist from `scripts/content-engine/config.mjs`
 * and carries reviewed official/established source and image-CDN additions
 * used by the live-feed fallback; image-resolve.ts consumes the same predicate so image
 * resolution and publication cannot drift.
 */
export const IMAGE_HOST_ALLOWLIST: readonly string[] = [
  'taylorswift.com', 'www.taylorswift.com', 'store.taylorswift.com',
  'upload.wikimedia.org', 'commons.wikimedia.org',
  'i.ytimg.com', 'img.youtube.com',
  'billboard.com', 'www.billboard.com',
  'rollingstone.com', 'www.rollingstone.com',
  'variety.com', 'www.variety.com',
  'hollywoodreporter.com', 'www.hollywoodreporter.com',
  'people.com', 'www.people.com',
  'vogue.com', 'www.vogue.com',
  'gettyimages.com', 'media.gettyimages.com',
  'eonline.com', 'www.eonline.com', 'akns-images.eonline.com',
  'marieclaire.com', 'www.marieclaire.com',
  'cms.futurecdn.net', 'cdn.mos.cms.futurecdn.net',
  'townsquare.media',
  'nme.com', 'www.nme.com',
  'time.com', 'api.time.com',
  'cbsnews.com', 'www.cbsnews.com', 'assets1.cbsnewsstatic.com',
  'forbes.com', 'www.forbes.com', 'imageio.forbes.com',
  'apnews.com', 'dims.apnews.com',
  'today.com', 'media-cldnry.s-nbcnews.com',
  'i.abcnewsfe.com', 's.abcnews.com', 'cdn.abcotvs.com',
  'i.guim.co.uk', 'static.time.com', 'media.vanityfair.com',
  'assets.teenvogue.com', 'media.glamour.com', 'assets.newsweek.com',
  'media.cnn.com', 'image.cnbcfm.com', 'fortune.com',
  'media.nbcphiladelphia.com', 'media.nbcbayarea.com',
  'assets2.cbsnewsstatic.com', 'assets3.cbsnewsstatic.com',
  'sportshub.cbsistatic.com', 'images.foxtv.com', 'a57.foxnews.com',
  'media.npr.org', 'npr.brightspotcdn.com',
  'i.cbc.ca', 'www.rte.ie', 'images.wral.com',
  'neon.reviewjournal.com', 'www.deseret.com', 'www.inquirer.com',
  'archive.longislandpress.com', 'cdn.i-scmp.com',
  's.yimg.com', 'media.zenfs.com',
  'blogs-images.forbes.com', 'specials-images.forbesimg.com',
  'lede-admin.stereogum.com', 'deadline.com', 'wwd.com',
  'www.etonline.com', 'images.hellomagazine.com', 'graziamagazine.com',
  'imgix.bustle.com', 'images.complex.com',
  's2.r29static.com', 'static3.refinery29.com',
  'thefader-res.cloudinary.com', 'cdn.hercampus.com',
  'www.redcarpet-fashionawards.com', 'fashiongonerogue.com',
  'skift.com', 'petapixel.com', 'consequence.net',
  'www.wideopencountry.com', 'www.thelist.com', 'www.nickiswift.com',
  'hollywoodlife.com', 'headlineplanet.com', 'assets.purewow.com',
  'imagez.tmz.com', 'i.iheart.com',
  'jj-justjared-media.s3.amazonaws.com',
  'jj-justjared-media.s3.us-east-1.amazonaws.com',
  'jj-justjaredjr-media.s3.amazonaws.com',
  'jj-justjaredjr-media.s3.us-east-1.amazonaws.com',
  'cdn01.justjared.com',
  'www.justjared.com', 'news.ucr.edu',
  'a1.espncdn.com', 'img.mlbstatic.com', 'cdn.nba.com',
  'images2.minutemediacdn.com',
  'www.guinnessworldrecords.com', 'thewaltdisneycompany.com',
  'news.wwu.edu', 'wsjshop.com',
  'www.answerthecall.org',
  'assets.vogue.com', 'atozsports.com', 'ichef.bbci.co.uk',
  'www.usatoday.com', 'www.usmagazine.com',
  'cloudfront-us-east-1.images.arcpublishing.com',
  'd3i6fh83elv35t.cloudfront.net',
  'wish-media.s3.us-east-2.amazonaws.com',
  'zpllkavmkkjnxpedhotv.supabase.co',
  'ra-grammy-media.ncp.consulting',
  'entertainmentnow.com',
  'www.femestella.com',
  'www.shefinds.com',
  'www.blogilates.com',
  'media.hollywoodlife.com',
  'www.thewrap.com',
  'medias.spotern.com',
  'tayswiftstyle.wordpress.com',
  'taylorpictures.net',
  'stealherstyle.net',
  'fashionsizzle.com',
  'bostonglobe-prod.cdn.arcpublishing.com',
  'stereogum.com', 'www.stereogum.com',
  'theguardian.com', 'www.theguardian.com',
  'bbc.co.uk', 'www.bbc.co.uk', 'bbc.com', 'www.bbc.com',
  'nytimes.com', 'www.nytimes.com', 'static01.nyt.com',
  'etonline.com',
  'elle.com', 'www.elle.com', 'harpersbazaar.com', 'www.harpersbazaar.com',
  'hips.hearstapps.com',
  'tennessean.com', 'www.tennessean.com',
  'kansascity.com', 'www.kansascity.com',
  'pitchfork.com', 'www.pitchfork.com', 'media.pitchfork.com',
  'nbcnews.com', 'www.nbcnews.com',
  'reuters.com', 'www.reuters.com',
  'snopes.com', 'www.snopes.com',
];

/** Scoped multi-tenant CDN allowlist — host + required path prefix, for
 * generic CDNs where tenant identity lives in the path, not the hostname.
 * Mirrors `CONFIG.image.scopedHostAllowlist` (see the header above). */
export interface ScopedImageHost {
  host: string;
  pathPrefix: string;
}

export const SCOPED_IMAGE_HOST_ALLOWLIST: readonly ScopedImageHost[] = [
  { host: 'cdn.shopify.com', pathPrefix: '/s/files/1/0011/4651/9637/' },
  { host: 'storage.googleapis.com', pathPrefix: '/pr-newsroom-wp/' },
  { host: 'format.creatorcdn.com', pathPrefix: '/9fcd0df5-9285-4916-8837-8946bbc00b90/' },
  { host: 'images.squarespace-cdn.com', pathPrefix: '/content/v1/6616cae0172b170a8dd0818d/' },
  { host: 'images.prismic.io', pathPrefix: '/birchbox/' },
];

/** Every tunable number/word-floor this gate checks — change the bar in
 * exactly one place. `summaryMinSentences`/`summaryMinChars` and
 * `detailMinWords` are the card's "2+ sentences / ~160+ chars" / "~60+
 * words" floors. */
export const CURRENT_ITEM_QUALITY_THRESHOLDS = {
  summaryMinSentences: 2,
  summaryMinChars: 160,
  detailMinWords: 60,
} as const;

/** One named reason a row failed the gate — `writeCurrentItem` persists
 * this as the hold reason so the next worker cycle's re-enrichment pass
 * (Cards 1-2) and any human triage knows exactly what to fix. Ordered by
 * check precedence in `evaluateCurrentItemQuality` (first failing check
 * wins; a row can fail more than one check, but only the first is
 * reported — same "don't partially report" posture as `screenAll`'s
 * redline screen, which also reports one verdict per row). */
export const QUALITY_HOLD_REASONS = [
  'missing_headline',
  'missing_image',
  'image_host_not_allowlisted',
  'summary_too_short',
  'detail_too_short',
  'redline_failed',
] as const;
export type QualityHoldReason = (typeof QUALITY_HOLD_REASONS)[number];

/** The minimal shape this gate needs — a structural subset of
 * `CurrentItem` (not `CurrentItem` itself) so write-time callers can check
 * an `ExtractedCurrentItem` + candidate `imageUrl` + screen result BEFORE a
 * full `CurrentItem` row exists, and read-time callers can check the real
 * row as-is. */
export interface CurrentItemQualityInput {
  headline: string;
  summary: string;
  detail: string;
  imageUrl?: string;
  redlineOk: boolean;
}

export interface CurrentItemQualityResult {
  ok: boolean;
  /** Undefined when `ok` is true. */
  reason?: QualityHoldReason;
}

/** Rough sentence count: splits on `.`/`!`/`?` followed by whitespace or
 * end-of-string, drops empty fragments. Good enough for a length floor —
 * this is a publish GATE, not a grammar checker, so it deliberately doesn't
 * try to handle abbreviations ("Jan.") perfectly; a false negative here
 * just holds a row for one more enrichment cycle, never publishes a bad
 * one (fails closed either way). */
export function sentenceCount(text: string): number {
  // Linear single pass (no backtracking regex — CodeQL js/polynomial-redos
  // flagged `/[.!?]+(?:\s+|$)/` on long runs of '!'). A sentence ends at a
  // run of terminators that is followed by whitespace or end-of-string.
  const s = text.trim();
  if (!s) return 0;
  let count = 0;
  let hasContent = false;
  let i = 0;
  while (i < s.length) {
    const ch = s.charAt(i);
    if (ch === '.' || ch === '!' || ch === '?') {
      let j = i;
      while (j < s.length && (s.charAt(j) === '.' || s.charAt(j) === '!' || s.charAt(j) === '?')) j++;
      if (j === s.length || /\s/.test(s.charAt(j))) {
        if (hasContent) count++;
        hasContent = false;
      }
      i = j;
      continue;
    }
    if (!/\s/.test(ch)) hasContent = true;
    i++;
  }
  if (hasContent) count++;
  return count;
}

/** Word count: splits on whitespace, drops empty fragments. */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Whether `url`'s hostname is on the image-host allowlist (bare host
 * match) or the scoped allowlist (host + path prefix match). Returns false
 * for an unparseable URL — never throws, same fail-closed posture as the
 * rest of this gate. */
export function isAllowlistedImageHost(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  if (IMAGE_HOST_ALLOWLIST.includes(host)) return true;
  return SCOPED_IMAGE_HOST_ALLOWLIST.some(
    (scoped) => scoped.host.toLowerCase() === host && parsed.pathname.startsWith(scoped.pathPrefix),
  );
}

/**
 * THE PUBLISH GATE. A `current_item` is servable only when ALL of:
 * headline present; `imageUrl` present AND allowlisted; `summary` >=
 * `summaryMinSentences` sentences AND >= `summaryMinChars` chars; `detail`
 * >= `detailMinWords` words; `redlineOk` true. Checked in that order —
 * the first failing check is the reported reason (never multiple reasons
 * at once, same single-verdict posture as the existing redline screen).
 */
export interface CurrentItemQualityThresholds {
  summaryMinSentences: number;
  summaryMinChars: number;
  detailMinWords: number;
}

export function evaluateCurrentItemQuality(
  item: CurrentItemQualityInput,
  thresholds: CurrentItemQualityThresholds = CURRENT_ITEM_QUALITY_THRESHOLDS,
): CurrentItemQualityResult {
  if (!item.headline || !item.headline.trim()) return { ok: false, reason: 'missing_headline' };
  if (!item.imageUrl) return { ok: false, reason: 'missing_image' };
  if (!isAllowlistedImageHost(item.imageUrl)) return { ok: false, reason: 'image_host_not_allowlisted' };
  if (
    sentenceCount(item.summary) < thresholds.summaryMinSentences ||
    item.summary.trim().length < thresholds.summaryMinChars
  ) {
    return { ok: false, reason: 'summary_too_short' };
  }
  if (wordCount(item.detail) < thresholds.detailMinWords) return { ok: false, reason: 'detail_too_short' };
  if (!item.redlineOk) return { ok: false, reason: 'redline_failed' };
  return { ok: true };
}

/** Convenience boolean form for read-time filtering (every current-item
 * selection path: `getCurrentItems`/`getRecentItems`/`currentFeedEntries`)
 * where callers only need the pass/fail, not the reason. */
export function passesCurrentItemQualityGate(
  item: CurrentItemQualityInput,
  thresholds: CurrentItemQualityThresholds = CURRENT_ITEM_QUALITY_THRESHOLDS,
): boolean {
  return evaluateCurrentItemQuality(item, thresholds).ok;
}
