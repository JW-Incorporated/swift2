import type { RenderFeedEntry } from './era-feed-clusters';
import { isPlayableVideoItem } from './current-feed';
import type { VideoNote } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Longest run of consecutive text/image entries the 7-day window allows while a video is still waiting. */
export const MAX_TEXT_RUN = 2;

/** Whether an entry plays video: a video record, a moment carrying an embed, or a live item with a playable embed. */
export function isVideoEntry<V extends VideoNote>(entry: RenderFeedEntry<V>): boolean {
  switch (entry.kind) {
    case 'video':
      return true;
    case 'moment':
      return Boolean(entry.item.video?.youtubeId);
    case 'current':
      return isPlayableVideoItem(entry.item);
    default:
      return false;
  }
}

function isTextEntry<V extends VideoNote>(entry: RenderFeedEntry<V>): boolean {
  return (entry.kind === 'moment' || entry.kind === 'current' || entry.kind === 'cluster') && !isVideoEntry(entry);
}

/**
 * Media-aware interleave for the rolling 7-day window (video-first slice 1).
 *
 * `sorted` is the rendered card list (clusters already folded in, so
 * "in a row" counts cards the reader sees). Entries dated inside the
 * window (from today back 7 days) keep their
 * relative order, except that once `MAX_TEXT_RUN` text/image entries have
 * appeared in a row and a video from the window is still waiting, the next
 * video is pulled forward. Videos keep their own relative order, as does
 * everything else. Entries outside the window,
 * including anything dated after today, are untouched. A permutation:
 * nothing is dropped or duplicated, and the result depends only on the input.
 */
export function interleaveRecentVideo<V extends VideoNote>(
  sorted: RenderFeedEntry<V>[],
  nowMs: number,
): RenderFeedEntry<V>[] {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const cutoff = new Date(nowMs - WEEK_MS).toISOString().slice(0, 10);
  const dayOf = (e: RenderFeedEntry<V>) => e.anchor.sortDate.slice(0, 10);
  const startIdx = sorted.findIndex((e) => dayOf(e) <= today);
  if (startIdx === -1) return sorted;
  const endFound = sorted.findIndex((e) => dayOf(e) < cutoff);
  const endIdx = endFound === -1 ? sorted.length : endFound;
  const lead = sorted.slice(0, startIdx);
  const head = sorted.slice(startIdx, endIdx);
  const tail = sorted.slice(endIdx);

  const videos: { idx: number; entry: RenderFeedEntry<V> }[] = [];
  const others: { idx: number; entry: RenderFeedEntry<V> }[] = [];
  head.forEach((entry, idx) => (isVideoEntry(entry) ? videos : others).push({ idx, entry }));
  if (videos.length === 0 || others.length === 0) return sorted;

  const out: RenderFeedEntry<V>[] = [];
  let v = 0;
  let o = 0;
  let run = 0;
  while (v < videos.length || o < others.length) {
    const nextVideo = videos[v];
    const nextOther = others[o];
    const takeVideo =
      nextVideo !== undefined &&
      (nextOther === undefined ||
        nextVideo.idx < nextOther.idx ||
        (run >= MAX_TEXT_RUN && isTextEntry(nextOther.entry)));
    const entry = takeVideo ? videos[v++]!.entry : others[o++]!.entry;
    run = isTextEntry(entry) ? run + 1 : 0;
    out.push(entry);
  }
  return [...lead, ...out, ...tail];
}
