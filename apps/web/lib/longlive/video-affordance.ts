import { extractYouTubeId } from '@swift2/shared';
import { hasRealPrimaryImage, primaryImageRef } from './types';
import type { ContentItem, MomentVideo } from './types';

/**
 * "What can this card actually DO with its footage?" — as pure functions.
 *
 * Same boundary and same reason as era-feed.ts: vitest runs in a `node`
 * environment with no component tests in the suite, so a rule left inside
 * EraSection/EraVideos/MomentDetail is untestable by construction. This module
 * exists for #2051: a moment carrying footage looked identical to one that
 * didn't, and its video rendered below the entire article (or inside the
 * citations footnote). `feedVideoFor` / `detailVideoFor` / `footnoteVideoSources`
 * are the three answers those surfaces need.
 *
 * It used to also carry `watchAffordance` / `displayHost` / `WatchAffordance`,
 * the "embed | link out | say nothing" resolver behind #2050's card states.
 * Those are gone: under the playable-first rule (Joey, 2026-08-13 — see
 * docs/decisions.md) a record with no embed is HIDDEN by `videosForEra` rather
 * than rendered as a link-out or an "unavailable" card, so every rendered card
 * is unconditionally an embed and there is no longer a fallback to resolve.
 */

/**
 * The video a feed card can play inline, or null.
 *
 * Intentionally just the moment's own `video` — no wider notion of "has
 * footage", so the Videos filter and the play affordance can never disagree
 * about which moments are watchable, which is exactly the contradiction Joey
 * hit (#2051, "nothing on the card tells you which is which"). A YouTube
 * *source* is promoted in the detail view (see `detailVideoFor`) but not here:
 * promoting in the feed would widen the filter's selection, which is a content
 * decision, not a playback one.
 *
 * One caller-side qualifier since #2057: when two moments in the RENDERED list
 * embed the same YouTube id, only the first plays it inline (the later card
 * keeps its story and its detail-page embed). That de-dupe is not in this
 * predicate because it is a property of the list, not of the item — see
 * `inlineVideoMomentIds` in era-feed.ts, which both the Videos filter and
 * EraSection's `ownsVideo` prop are derived from, over the same list, so the
 * two still cannot disagree.
 */
export function feedVideoFor(item: ContentItem): MomentVideo | null {
  return item.video ?? null;
}

/**
 * True for a host that serves YouTube's own thumbnail files.
 *
 * Matched as a SUFFIX rather than an allowlist of exact names. YouTube serves
 * the same files from `i.ytimg.com` and from the numbered shards
 * (`i1`–`i4`/`i9.ytimg.com`), and `img.youtube.com` is the older alias. The
 * whole job of this module's duplicate check is to stop the same frame
 * rendering twice; a named-host list that happens to miss `i3.ytimg.com` would
 * silently let the duplication back in on the next Photo Enrichment run, with
 * no test failing. The vault is 100% `i.ytimg.com` today — this costs nothing
 * now and closes the hole later.
 */
function isYouTubeThumbHost(hostname: string): boolean {
  return hostname === 'ytimg.com' || hostname.endsWith('.ytimg.com') || hostname === 'img.youtube.com';
}

/**
 * True when the card's own photo is just a frame of the very video the card is
 * about to play — so rendering both would show the same footage twice, stacked.
 *
 * This is not hypothetical: 8 of the 16 moments carrying `video` today have a
 * `https://i.ytimg.com/vi/<same id>/…jpg` primary image. Two of those are the
 * EXACT url the poster requests (`hqdefault.jpg`); two more are
 * `maxresdefault.jpg`, the same frame at another resolution; the remaining four
 * are other frames of the same video. Photo Enrichment reached for the video's
 * own thumbnail precisely because these moments ARE the video, and before #2080
 * nothing rendered the two together.
 *
 * Matched on the id in the path rather than on the whole URL because of that
 * spread: the frames differ by filename (`maxresdefault` / `maxres1` /
 * `maxres2` / `maxres3` / `sd2` / `hqdefault`) while being the same video, so a
 * URL-equality check would catch 2 of the 8 and leave the duplication it exists
 * to prevent.
 *
 * A photo from anywhere else (album art, a press shot) is a genuinely different
 * picture and is kept: this suppresses duplication, not imagery.
 */
export function cardImageDuplicatesVideo(item: ContentItem, video: MomentVideo): boolean {
  if (!hasRealPrimaryImage(item)) return false;
  return youtubeFrameId(primaryImageRef(item)?.url) === video.youtubeId;
}

/**
 * The YouTube video a url is a thumbnail FRAME of, or null for any other image.
 *
 * The single place this repo decides "is this picture actually a video still",
 * extracted so the three rules built on it (the #2080 feed suppression, the
 * deferring-card suppression below, and the detail hero promotion) cannot
 * disagree about what counts as a frame.
 *
 * Matched on the id in the PATH rather than on URL equality because the vault
 * carries the same frame at several filenames — `maxresdefault` / `maxres1` /
 * `maxres2` / `maxres3` / `sd2` / `hqdefault` are all one video — so a
 * URL-equality check would catch a quarter of the real cases and leave the
 * duplication it exists to prevent. `/vi/<id>/…` and its WebP sibling
 * `/vi_webp/<id>/…` are the same frames.
 */
export function youtubeFrameId(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // A relative path (the local /eras/ art and /placeholder.svg) is never a
    // YouTube frame.
    return null;
  }
  if (!isYouTubeThumbHost(parsed.hostname)) return null;
  const match = /^\/(?:vi|vi_webp)\/([^/]+)\//.exec(parsed.pathname);
  return match ? match[1] : null;
}

/**
 * Whether a feed card yields its photo slot — the ONE answer EraSection asks,
 * covering both reasons a card's picture must not render.
 *
 * 1. The card OWNS the embed and its photo is a frame of that video (#2080):
 *    the poster takes the image slot rather than printing the same frame twice.
 *
 * 2. The card DEFERS the embed (#2057 de-dupe: one video plays from exactly one
 *    card) and its photo is a frame of a video it will not play. This is the
 *    case Joey hit on tloas: "'Elizabeth Taylor' goes to radio" rendered a
 *    hero-tier still from the Elizabeth Taylor music video with NO play control,
 *    because the embed belongs to the earlier supercut card. A big video-looking
 *    frame you cannot play is worse than the duplication #2080 removed — it
 *    promises a player that does not exist. Suppressed, the card renders as what
 *    it actually is: a story about radio airplay.
 *
 * Case 2 is deliberately scoped to cards that CARRY footage. A moment with no
 * `video` of its own whose photo happens to be a frame of some era video (20 of
 * them today — a moment about the "22" video illustrated with a still from it)
 * is not masquerading as anything: it has no play affordance to promise and the
 * frame is its only picture. Stripping those would delete imagery, not
 * duplication.
 *
 * `knownVideoIds` is every video id the era can play (moment embeds + the
 * Videos rail's records), so a deferring card is caught whether its photo is a
 * frame of its OWN video or of a sibling's. Its own id is checked directly too,
 * so the rule holds even if a caller hands over a narrower set.
 */
export function feedCardImageHidden(
  item: ContentItem,
  ownsVideo: boolean,
  knownVideoIds: ReadonlySet<string>,
): boolean {
  const video = item.video;
  if (!video) return false;
  if (ownsVideo) return cardImageDuplicatesVideo(item, video);
  if (!hasRealPrimaryImage(item)) return false;
  const frame = youtubeFrameId(primaryImageRef(item)?.url);
  if (!frame) return false;
  return frame === video.youtubeId || knownVideoIds.has(frame);
}

/**
 * The video promoted INTO the detail page's ~42vh hero slot, or null.
 *
 * Joey, 2026-08-13, on the detail pages: "it looks horrible… the site would feel
 * much more natural if you played the video from the top." The cause is a
 * content decision, not a layout bug: Photo Enrichment sourced video frames as
 * photos for the moments that ARE a video, so 10 of the 16 video-carrying
 * moments open with a still of the very footage embedded a screen further down,
 * and 8 of those have no other photo to fall back to. The honest fix is not to
 * hunt for a substitute picture — it is to let the thing the page is about be
 * the thing at the top of the page.
 *
 * So when the hero image is a frame of the moment's own video, the hero BECOMES
 * the click-to-load player and `detailVideoFor` yields the body slot to it.
 * Pages whose hero is a genuinely different photo are untouched: hero stays a
 * photo, the video stays in the body, and nothing was duplicated there anyway.
 *
 * Compared against `primaryImageRef` — what the hero actually renders — rather
 * than through `cardImageDuplicatesVideo`'s `hasRealPrimaryImage` gate, which is
 * a feed-card question. Two of the ten ("Tim McGraw" arrives, "willow" leads the
 * era) hold their frame as a non-`primary` stand-in, so the gate would answer
 * "no real photo" about an image the reader is looking at.
 */
export function heroVideoFor(item: ContentItem): MomentVideo | null {
  const video = item.video;
  if (!video) return null;
  return youtubeFrameId(primaryImageRef(item)?.url) === video.youtubeId ? video : null;
}

/** The top-slot video for `MomentDetail`, with the caption to render under it. */
export interface DetailVideo {
  video: MomentVideo;
  /**
   * Figcaption override. Left `undefined` for the moment's own video so
   * `MomentVideo` keeps its default caption; a promoted citation captions with
   * the source's own name, so it still reads as a citation rather than as
   * something we uploaded.
   */
  caption?: string;
}

/**
 * The video that renders in the BODY of a moment detail — above the article
 * prose and below the confidence banner (#2051 hard requirement; the reader must
 * meet "Rumor — unconfirmed" before the media, never after).
 *
 * This is the moment's OWN `item.video`, and deliberately nothing else — and
 * only when the hero did not already take it (see `heroVideoFor`). The two are
 * exclusive by construction rather than by the component remembering to check,
 * so no page can render one video twice.
 *
 * #2051 decision point 3 proposed also promoting a lone YouTube *citation* into
 * this slot (a moment whose only footage is a source link currently shows it
 * down in the footnote). That is NOT implemented here, and the reason is a
 * rights posture, not an oversight: run over the real corpus the rule fires on
 * 29 moments, and six of those citations are explicitly fan re-uploads
 * ("YouTube — lionheart33026 (fan archive)", "TaylorShreya13 (fan archive)",
 * …), with others being personal channels carrying reliability 2-3. The
 * standing rule for media we PRESENT (as opposed to cite) is first-party
 * uploads only — see the appearance rules in docs/longlive-experience.md §8 and
 * the note on VideoNote.youtubeId in types.ts. Promoting a fan re-upload from a
 * footnote citation to the lead element of a detail page changes what the app
 * publishes, which is Joey's call plus a docs/decisions.md entry, and #2051
 * itself files that promotion under "Needs Joey (product)" rather than under
 * the unconditional criteria.
 *
 * So the footnote keeps rendering citation videos exactly as it did before this
 * change. If Joey wants the promotion, the honest version gates on a
 * first-party signal rather than on "there happens to be only one".
 */
export function detailVideoFor(item: ContentItem): DetailVideo | null {
  if (!item.video) return null;
  // The hero got there first. Rendering here as well is the exact duplication
  // Joey called horrible — the same footage twice on one page, a screen apart.
  if (heroVideoFor(item)) return null;
  return { video: item.video };
}

/** One citation that still embeds inside the sources footnote. */
export interface FootnoteVideoSource {
  youtubeId: string;
  name: string;
  url: string;
}

/**
 * The YouTube citations that embed in the footnote block, unchanged from the
 * behaviour this refactor replaced: every YouTube source except one duplicating
 * the moment's own `item.video`, which would otherwise render the same player
 * twice on one page.
 *
 * Extracted from the component only so it is testable — see the note in
 * `detailVideoFor` for why nothing is promoted OUT of this list.
 */
export function footnoteVideoSources(item: ContentItem): FootnoteVideoSource[] {
  const out: FootnoteVideoSource[] = [];
  for (const source of item.sources ?? []) {
    const youtubeId = extractYouTubeId(source.url);
    if (!youtubeId) continue;
    if (youtubeId === item.video?.youtubeId) continue;
    out.push({ youtubeId, name: source.name, url: source.url });
  }
  return out;
}
