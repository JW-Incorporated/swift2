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
 * YouTube's own thumbnail hosts. `i.ytimg.com` is what the app renders and what
 * Photo Enrichment stored on these moments; `img.youtube.com` is the older alias
 * for the same files and shows up in hand-authored seed rows.
 */
const YOUTUBE_THUMB_HOSTS = new Set(['i.ytimg.com', 'img.youtube.com', 'i9.ytimg.com']);

/**
 * True when the card's own photo is just a frame of the very video the card is
 * about to play — so rendering both would show the same footage twice, stacked.
 *
 * This is not hypothetical: 9 of the 16 moments carrying `video` today have a
 * `https://i.ytimg.com/vi/<same id>/…jpg` primary image, four of them the exact
 * `maxresdefault` frame the poster uses at a different resolution. Photo
 * Enrichment reached for the video's own thumbnail precisely because these
 * moments ARE the video, and before #2078 nothing rendered the two together.
 *
 * Matched on the id in the path rather than on the whole URL because the frames
 * differ by filename (`maxresdefault` / `maxres1` / `sd2` / `hqdefault`) while
 * being the same video — a URL-equality check would miss most of them and leave
 * the duplication it exists to prevent.
 *
 * A photo from anywhere else (album art, a press shot) is a genuinely different
 * picture and is kept: this suppresses duplication, not imagery.
 */
export function cardImageDuplicatesVideo(item: ContentItem, video: MomentVideo): boolean {
  if (!hasRealPrimaryImage(item)) return false;
  const url = primaryImageRef(item)?.url;
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // A relative path (the local /eras/ art and /placeholder.svg) is never a
    // YouTube frame.
    return false;
  }
  if (!YOUTUBE_THUMB_HOSTS.has(parsed.hostname)) return false;
  // `/vi/<id>/…` and its WebP sibling `/vi_webp/<id>/…` are the same frames.
  return (
    parsed.pathname.startsWith(`/vi/${video.youtubeId}/`) ||
    parsed.pathname.startsWith(`/vi_webp/${video.youtubeId}/`)
  );
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
 * The video that renders at the TOP of a moment detail — above the article body
 * and below the confidence banner (#2051 hard requirement; the reader must meet
 * "Rumor — unconfirmed" before the media, never after).
 *
 * This is the moment's OWN `item.video`, and deliberately nothing else.
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
  return item.video ? { video: item.video } : null;
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
