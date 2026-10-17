export const HOME_REDDIT_HEARTBEAT = 'home_reddit_reader_heartbeat';
export const HOME_REDDIT_FRESH_MS = 30 * 60 * 1_000;

export async function readHomeRedditHeartbeat(supabase) {
  const { data, error } = await supabase
    .from('ops_switches')
    .select('enabled, updated_at')
    .eq('name', HOME_REDDIT_HEARTBEAT)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export function heartbeatIsFresh(row, now = new Date()) {
  if (!row?.enabled || !row.updated_at) return false;
  const age = now.getTime() - Date.parse(row.updated_at);
  return Number.isFinite(age) && age >= 0 && age < HOME_REDDIT_FRESH_MS;
}

export async function shouldSkipForHomeReader(
  supabase,
  { now = new Date(), warn = console.warn } = {},
) {
  try {
    return heartbeatIsFresh(await readHomeRedditHeartbeat(supabase), now);
  } catch (error) {
    warn(
      `awareness-scan: home-reader heartbeat unreadable; running RSS fallback (${error.message})`,
    );
    return false;
  }
}
