import { extractYouTubeId } from '@swift2/shared';
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
 * Intentionally just the moment's own `video`: it is the same predicate
 * `visibleMoments(..., { videosOnly: true })` selects on, so the Videos filter
 * and the play badge can never disagree about which moments are watchable —
 * which is exactly the contradiction Joey hit (#2051, "nothing on the card tells
 * you which is which"). A YouTube *source* is promoted in the detail view (see
 * `detailVideoFor`) but not here: promoting in the feed would widen the filter's
 * selection, which is a content decision, not a playback one.
 */
export function feedVideoFor(item: ContentItem): MomentVideo | null {
  return item.video ?? null;
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
