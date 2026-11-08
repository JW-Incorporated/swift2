import type { EraFeedEntry } from './feed-types';
import type { VideoNote } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Longest run of consecutive text/image entries the 7-day window allows while a video is still waiting. */
export const MAX_TEXT_RUN = 2;

/** Whether an entry plays video: a video record, a moment carrying an embed, or a live item with a verified embed. */
export function isVideoEntry<V extends VideoNote>(entry: EraFeedEntry<V>): boolean {
  switch (entry.kind) {
    case 'video':
      return true;
    case 'moment':
      return Boolean(entry.item.video?.youtubeId);
    case 'current':
      return entry.item.mediaKind === 'video' || Boolean(entry.item.embed);
    default:
      return false;
  }
}

function isTextEntry<V extends VideoNote>(entry: EraFeedEntry<V>): boolean {
  return (entry.kind === 'moment' || entry.kind === 'current') && !isVideoEntry(entry);
}

/**
 * Media-aware interleave for the rolling 7-day window (video-first slice 1).
 *
 * `sorted` is `mergeEraFeed`'s newest-first order. Entries dated inside the
 * window (the leading run, since the input is date-descending) keep their
 * relative order, except that once `MAX_TEXT_RUN` text/image entries have
 * appeared in a row and a video from the window is still waiting, the next
 * video is pulled forward. Videos keep their own relative order, as does
 * everything else. Entries outside the window are untouched. A permutation:
 * nothing is dropped or duplicated, and the result depends only on the input.
 */
export function interleaveRecentVideo<V extends VideoNote>(
  sorted: EraFeedEntry<V>[],
  nowMs: number,
): EraFeedEntry<V>[] {
  const cutoff = new Date(nowMs - WEEK_MS).toISOString().slice(0, 10);
  const windowEnd = sorted.findIndex((e) => e.anchor.sortDate.slice(0, 10) < cutoff);
  const head = windowEnd === -1 ? sorted : sorted.slice(0, windowEnd);
  const tail = windowEnd === -1 ? [] : sorted.slice(windowEnd);

  const videos: { idx: number; entry: EraFeedEntry<V> }[] = [];
  const others: { idx: number; entry: EraFeedEntry<V> }[] = [];
  head.forEach((entry, idx) => (isVideoEntry(entry) ? videos : others).push({ idx, entry }));
  if (videos.length === 0 || others.length === 0) return sorted;

  const out: EraFeedEntry<V>[] = [];
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
  return [...out, ...tail];
}
