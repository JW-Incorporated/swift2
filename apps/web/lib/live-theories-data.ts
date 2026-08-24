import { mapFanSignal, mapLiveTheory, type FanSignalRow, type LiveTheoryRow } from '@swift2/core';
import type { FanSignal, LiveTheory } from '@swift2/shared';

// Server-side reads for `live_theory` / `fan_signal` (PLAN.md Stage 7) —
// deliberately NOT routed through `packages/core/src/knowledge/` (a sibling
// worktree is actively building that module into a full retrieval library
// this stage must stay file-disjoint from). Raw `fetch()` against Supabase's
// PostgREST endpoint instead of the `@supabase/supabase-js` SDK, which isn't
// an `apps/web` dependency — same "avoid a new SDK dependency" convention
// `apps/worker/src/classify/openai-client.ts` already uses for the same
// reason. Row -> domain mapping still reuses `mapLiveTheory`/`mapFanSignal`
// from `@swift2/core`'s `current-map.ts` (outside `knowledge/`, already the
// single source of truth for that shape) rather than duplicating it by hand.
// Env detection + degrade-to-empty mirrors `lib/current.ts`/`lib/vault.ts`.

function supabaseEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

// Defensive ceiling, same intent as knowledge/client.ts's CURRENT_ITEM_MAX_ROWS.
const MAX_ROWS = 200;

const LIVE_THEORY_COLS =
  'id,name,claim,first_seen_on,last_seen_on,origin,status,outcome,evidence_ids,symbols,heat,resolution,promoted_to,expires_at';
const FAN_SIGNAL_COLS =
  'id,window_start,window_end,platform,community,topic,summary,volume,heat,stance_mix,symbols,theory_ids,current_item_ids,sample_urls,expires_at,redline_ok';

async function restSelect<T>(
  env: { supabaseUrl: string; supabaseKey: string },
  table: string,
  cols: string,
  order: string,
): Promise<T[]> {
  const url = `${env.supabaseUrl}/rest/v1/${table}?select=${cols}&order=${order}&limit=${MAX_ROWS}`;
  const res = await fetch(url, {
    headers: { apikey: env.supabaseKey, Authorization: `Bearer ${env.supabaseKey}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return (await res.json()) as T[];
}

/** Live theories, hottest first. RLS already scopes reads to unexpired rows
 * (anon key, RLS-public, no session machinery — same posture as
 * `lib/current.ts`/`lib/vault.ts`). Empty array when Supabase env isn't
 * configured; a fetch/HTTP failure propagates so the caller (the
 * `/vault/live-theories` route) can log it and degrade to `[]` itself. */
export async function loadLiveTheories(): Promise<LiveTheory[]> {
  const env = supabaseEnv();
  if (!env) return [];
  const rows = await restSelect<LiveTheoryRow>(env, 'live_theory', LIVE_THEORY_COLS, 'heat.desc');
  return rows.map(mapLiveTheory);
}

/** Fan-signal rows, hottest first — matched against live theories client-side
 * (`lib/longlive/live-theories.ts`'s `matchFanSignal`) for the "fans are
 * saying" line. Same empty/failure contract as `loadLiveTheories`. */
export async function loadFanSignals(): Promise<FanSignal[]> {
  const env = supabaseEnv();
  if (!env) return [];
  const rows = await restSelect<FanSignalRow>(env, 'fan_signal', FAN_SIGNAL_COLS, 'heat.desc');
  return rows.map(mapFanSignal);
}
