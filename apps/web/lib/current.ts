import { createKnowledgeClient, mapFanSignal, mapLiveTheory } from '@swift2/core';
import type { FanSignalRow, LiveTheoryRow } from '@swift2/core';
import type { CurrentItem, FanSignal, LiveTheory } from '@swift2/shared';
import { supabasePublicEnv } from './supabase-server';

// Current-tier data access (server-side) — mirrors lib/vault.ts's env
// detection exactly, but has no v0-preview fallback: unlike the Vault
// (baked in at build time from content-vault.generated.ts), the Current
// tier has no static generated form to fall back to, so an unconfigured
// environment simply renders the era stream without it (additive, per
// PLAN.md Stage 5 — the Vault-only render is the correct degraded state,
// not an error).

/** Load the current era's live `current_item` rows (server-side). Empty
 * array when Supabase env isn't configured (e.g. CI/preview) — never throws. */
export async function loadCurrentItems(eraId: string): Promise<CurrentItem[]> {
  const env = supabasePublicEnv();
  if (!env) return [];
  return createKnowledgeClient(env).getCurrentItems(eraId);
}

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
// Env detection + degrade-to-empty mirrors `loadCurrentItems` above.
//
// Folded in from the former `lib/live-theories-data.ts` (R17: one combined
// live-data route) — same functions, same contract, just co-located with
// the other Current-tier server reads.

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
 * `loadCurrentItems`/`lib/vault.ts`). Empty array when Supabase env isn't
 * configured; a fetch/HTTP failure propagates so the caller (the
 * `/vault/live/[eraId]` route, and the `/vault/live-theories` alias) can log
 * it and degrade to `[]` itself. */
export async function loadLiveTheories(): Promise<LiveTheory[]> {
  const env = supabasePublicEnv();
  if (!env) return [];
  const rows = await restSelect<LiveTheoryRow>(env, 'live_theory', LIVE_THEORY_COLS, 'heat.desc');
  return rows.map(mapLiveTheory);
}

/** Fan-signal rows, hottest first — matched against live theories client-side
 * (`lib/longlive/live-theories.ts`'s `matchFanSignal`) for the "fans are
 * saying" line. Same empty/failure contract as `loadLiveTheories`. */
export async function loadFanSignals(): Promise<FanSignal[]> {
  const env = supabasePublicEnv();
  if (!env) return [];
  const rows = await restSelect<FanSignalRow>(env, 'fan_signal', FAN_SIGNAL_COLS, 'heat.desc');
  return rows.map(mapFanSignal);
}
