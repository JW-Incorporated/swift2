import { extractYouTubeId } from '@swift2/shared';
import type { ContentItem, MomentVideo, VideoNote } from './types';

/**
 * "What can this card actually DO with its footage?" — as pure functions.
 *
 * Same boundary and same reason as era-feed.ts: vitest runs in a `node`
 * environment with no component tests in the suite, so a rule left inside
 * EraSection/EraVideos/MomentDetail is untestable by construction. Both bugs
 * this module exists for (#2050, #2051) were rules living in the view layer:
 *
 *  - #2050 — a video record whose `youtubeId` is null had its ONLY interactive
 *    element gated on that id in two components, so the card rendered as a dead
 *    rectangle. 19 records are in that state today; 3 sit in the unfiltered era
 *    feed. `watchAffordance` makes "what does this card offer" a total function
 *    over VideoNote, so there is no longer a branch that produces nothing.
 *  - #2051 — a moment carrying footage looked identical to one that didn't, and
 *    its video rendered below the entire article (or inside the citations
 *    footnote). `feedVideoFor` / `detailVideoFor` / `footnoteVideoSources` are
 *    the three answers those surfaces need.
 */

/** What a `VideoNote` card can offer the reader. Total over VideoNote — every
 * record resolves to exactly one of these, so no surface can render a card with
 * zero interaction (the #2050 bug). */
export type WatchAffordance =
  /** An official upload we can embed via the MomentVideo click-to-play facade. */
  | { kind: 'embed'; youtubeId: string }
  /** No embeddable upload, but a citation to point at — the card links out. */
  | { kind: 'link'; url: string; host: string; sourceName: string }
  /** Nothing to embed and nothing to link. The card must SAY so rather than
   * render a dead rectangle. Unreachable with today's data (the generator
   * requires >=1 source per record) — it exists so a future data shape can't
   * silently reintroduce the inert card. */
  | { kind: 'none' };

/**
 * Hostname for display: the bare host, minus a leading `www.`.
 *
 * Deliberately NOT a prettified brand map ('en.wikipedia.org' -> 'Wikipedia').
 * A map is a maintenance surface that goes stale silently, and showing the real
 * host is the more honest thing to hand a reader about to leave the site.
 * Returns null for anything we would not put in an `href`, which is what makes
 * the caller fall through to `kind: 'none'` instead of rendering a bad link.
 *
 * The scheme check is not decoration: failing to PARSE is not the only way a
 * URL is unusable. `new URL('javascript://evil.example/%0aalert(1)')` parses
 * happily and yields a host, so a host-only check would hand that straight to
 * an `href`. Content is authored in-repo today, so this isn't reachable — but
 * this function is the gatekeeper for a link the UI renders, and gatekeepers
 * shouldn't depend on the trustworthiness of their input.
 */
export function displayHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/**
 * What this video record offers.
 *
 * Order is deliberate: an embed beats a link (watching here beats leaving), and
 * the FIRST source wins the link because the seed convention puts the defining
 * reference first (the record's own encyclopedia/announcement entry).
 *
 * Note on `officialUrl`: #2050 suggested carrying it through the generator to
 * link out to Disney+/Netflix for the theatrical class. Checked the data — every
 * `officialUrl` in `supabase/seed/videos/**` is either null or already
 * YouTube-shaped (in which case `resolveYoutubeId` has already turned it into
 * `youtubeId`). Carrying the field through would add a column to the Tier-0
 * payload that is dead for all 19 affected records, so this uses `sources`,
 * which every record is required to have. If a real streaming URL is ever
 * authored, that is the moment to add the field.
 */
export function watchAffordance(video: VideoNote): WatchAffordance {
  if (video.youtubeId) return { kind: 'embed', youtubeId: video.youtubeId };
  for (const source of video.sources ?? []) {
    const host = displayHost(source.url);
    if (host) return { kind: 'link', url: source.url, host, sourceName: source.name };
  }
  return { kind: 'none' };
}

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
