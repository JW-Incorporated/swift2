import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = 500;
const execFileAsync = promisify(execFile);

export const ITEM_SELECT = '*, watch_decision!left(item_id)';
export const ITEM_DECISION_NULL_FILTER = 'watch_decision';

export function classifierStore(client) {
  const existingDecisionIds = async (ids) => {
    const found = new Set();
    for (let offset = 0; offset < ids.length; offset += PAGE) {
      const { data, error } = await client.from('watch_decision').select('item_id')
        .in('item_id', ids.slice(offset, offset + PAGE));
      if (error) throw error;
      for (const row of data) if (row.item_id) found.add(row.item_id);
    }
    return found;
  };
  return {
    async loadItems(limit) {
      const { data, error } = await client.from('watch_item')
        .select(ITEM_SELECT)
        .in('status', ['new', 'pending']).is(ITEM_DECISION_NULL_FILTER, null)
        .order('first_seen_at').limit(limit);
      if (error) throw error;
      return data;
    },
    existingDecisionIds,
    async loadCandidates(since) {
      const { data, error } = await client.from('watch_item').select('*')
        .gte('last_seen_at', since).order('last_seen_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
    async insertDecisions(rows) {
      const unique = [...new Map(rows.map((row) => [row.item_id, row])).values()];
      const existing = await existingDecisionIds(unique.map((row) => row.item_id));
      const fresh = unique.filter((row) => !existing.has(row.item_id));
      if (fresh.length === 0) return fresh;
      const { error } = await client.from('watch_decision').insert(fresh);
      if (error) throw error;
      return fresh;
    },
    async markClassified(items, rows, classifiedAt) {
      const decided = new Set(rows.map((row) => row.item_id));
      const storyIds = [...new Set(items.filter((item) => decided.has(item.id) && item.story_id)
        .map((item) => item.story_id))];
      if (storyIds.length === 0) return;
      const { data: existing, error: selectError } = await client.from('story_timeline')
        .select('story_id, classified_at').in('story_id', storyIds);
      if (selectError) throw selectError;
      const alreadyClassified = new Set((existing ?? [])
        .filter((row) => row.classified_at !== null).map((row) => row.story_id));
      const timelines = storyIds.filter((storyId) => !alreadyClassified.has(storyId))
        .map((story_id) => ({ story_id, classified_at: classifiedAt }));
      if (timelines.length === 0) return;
      const { error } = await client.from('story_timeline')
        .upsert(timelines, { onConflict: 'story_id' });
      if (error) throw error;
    },
  };
}

export async function openJevFallbackAlert(reason, run = execFileAsync) {
  const directory = await mkdtemp(path.join(tmpdir(), 'tidewatch-alert-'));
  const bodyPath = path.join(directory, 'body.md');
  const title = 'Tidewatch: Jev fallback-only mode';
  await writeFile(bodyPath,
    `Tidewatch switched this classifier run to Haiku-only after ${reason}. One alert is raised per affected run.\n`);
  try {
    await run('bash', [path.join(ROOT, 'scripts/watchdog/upsert-alert.sh'), 'open', title, bodyPath], {
      env: { ...process.env, REPO: process.env.REPO ?? process.env.GITHUB_REPOSITORY },
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
