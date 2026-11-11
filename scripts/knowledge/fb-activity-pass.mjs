import { serviceClient } from '../lib/supabase.mjs';
import { ingestFacebookActivity } from '../community/fb-activity-outcomes.mjs';
import { weekOf } from './fb-export-helpers.mjs';
import { extensionCollect } from './fb-export-launch.mjs';

export const ACTIVITY_INTERVAL_MS = 20 * 60 * 60_000;
export const OWNER_ACTIVITY_JOB = {
  slug: 'owner-activity',
  label: 'Owner Facebook activity log',
  kind: 'activity',
  url: 'https://www.facebook.com/me/allactivity?category_key=GROUPPOSTS',
  wallBudgetMs: 5 * 60_000,
};

export function activityPassDue(lastActivityAt, now) {
  if (!lastActivityAt) return true;
  const previous = new Date(lastActivityAt).getTime();
  return !Number.isFinite(previous) || now.getTime() - previous >= ACTIVITY_INTERVAL_MS;
}

export async function runActivityIfDue({ now, dryRun, readState, writeState, run }) {
  const state = await readState();
  if (!activityPassDue(state.lastActivityAt, now)) {
    return { ok: true, count: 0, written: 0, skipped: true };
  }
  if (!dryRun) await writeState({ lastActivityAt: now.toISOString() });
  return run();
}

export async function runActivityPass({
  collect = extensionCollect,
  ingest = ingestFacebookActivity,
  supabase,
  groups,
  root,
  outputDir,
  now,
  dryRun = false,
}) {
  const job = {
    ...OWNER_ACTIVITY_JOB,
    groupIds: groups.flatMap((group) => [group.groupId, ...(group.aliases ?? [])]),
  };
  const collection = await collect({ groups: [job], root, outputDir, now, week: weekOf(now) });
  const item = (Array.isArray(collection) ? collection : collection.results)?.[0];
  if (item?.status !== 'activity-collected')
    return { ok: false, count: 0, reason: item?.reason ?? item?.status ?? 'activity missing' };
  if (dryRun) return { ok: true, count: item.activities.length, written: 0 };
  const client = supabase ?? serviceClient();
  if (!client) return { ok: false, count: item.activities.length, reason: 'worker env missing' };
  const result = await ingest(client, item.activities, { checkedAt: now });
  return { ok: true, count: item.activities.length, written: result.written };
}
