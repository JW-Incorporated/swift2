// Awareness lane — row shaping and the per-day candidate counter (split out of
// awareness-scan.mjs, which re-exports these).
import { isSchemaPending } from '../lib/cli.mjs';
import { AWARENESS_KIND } from './awareness-filters.mjs';

export function utcDayStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export function contextFor(subreddit, types, ageHours, rank) {
  return `Awareness candidate in r/${subreddit} (${types.join('/')}), about ${Math.round(ageHours)}h old, feed rank ${rank} (title-only scan, no bodies stored).`;
}

export function buildAwarenessRow({
  subreddit,
  post,
  types,
  ageHours,
  imageRef,
  imageComments,
  replyUnverified = false,
}) {
  return {
    platform: 'reddit',
    community: subreddit,
    kind: AWARENESS_KIND,
    thread_id: post.id,
    url: post.permalink,
    title: post.title,
    context:
      contextFor(subreddit, types, ageHours, post.rank) +
      (replyUnverified ? ' Reply-ability (locked/archived/restricted) unverified.' : ''),
    matched_doc_ids: [],
    status: 'new',
    redline_ok: true, // screenTopic ran on the title in evaluateThread
    image_ref: imageRef,
    image_comments: imageComments,
    thread_type: types[0],
  };
}

/** Per-sub candidates created so far today (UTC), from existing awareness rows. */
export async function fetchTodaysCandidateCounts(supabase, now = new Date()) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('community')
    .eq('kind', AWARENESS_KIND)
    .eq('platform', 'reddit')
    .gte('created_at', utcDayStart(now));
  if (error) {
    if (isSchemaPending(error)) return {};
    throw error;
  }
  const counts = {};
  for (const row of data ?? []) counts[row.community] = (counts[row.community] ?? 0) + 1;
  return counts;
}
