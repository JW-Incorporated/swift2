#!/usr/bin/env node
// Social event-status sensor (t_4ebbe8ba, implementing t_60c73aaa's
// approved design comment — reused verbatim, not re-derived).
//
// Read-only. Queries the current era's live `current_item` rows and
// `live_theory` rows via the SAME public/anon-key path the website itself
// reads (packages/core/src/knowledge/client.ts's getCurrentItems for
// current_item; apps/web/lib/current.ts's REST-based loadLiveTheories for
// live_theory, since live_theory isn't in the knowledge client yet — see
// that file's own header for why), and hands both to
// `pickBannerCandidate` from `@swift2/experience` — the EXACT function the
// website's pin banner uses, never a forked copy (card step 3/8).
//
// Prints one JSON line to stdout:
//   { mode: 'event'|'normal', kind: 'countdown'|'theory'|null, id,
//     target?, heat?, daysToResolution?, blendTier, reservedBeats,
//     windingDown }
//
// Consumed by:
//   - docs/agents/runner-prompts/tree-weekly-plan.md (step 0.6)
//   - docs/agents/runner-prompts/tree-daily-draft.md (event-status step)
//   - .github/workflows/social-event-status.yml (4h hash-diff trigger)
//
// Missing Supabase credentials degrade to `{ mode: 'normal', ... }` (same
// contract every other read script in this file uses) — a routine reading
// this must never crash or stall because event-status couldn't reach the
// DB; it just proceeds as if nothing is live.
//
// This is the ONLY new "sensor" per the design — every consumer reads this
// script's output, nobody re-derives current_item/live_theory queries or
// the tie-break independently.

import { createKnowledgeClient } from '@swift2/core';
// Imported directly from source, same convention as
// scripts/social/lib/era-palette.mjs uses for eras.ts: current-feed.ts and
// eras.ts only ever `import type` from the rest of @swift2/experience, so
// going through the package barrel (index.ts) would pull in every other
// module's runtime code (including lenses.ts, which needs the generated
// content bundle this read-only sensor has no reason to require).
import { pickBannerCandidate } from '../../packages/experience/src/current-feed.ts';
import { CURRENT_ERA_ID } from '../../packages/experience/src/eras.ts';
import { runMain } from '../lib/cli.mjs';
import { buildEventStatus } from './lib/event-status.mjs';

const LIVE_THEORY_COLS =
  'id,name,claim,first_seen_on,last_seen_on,origin,status,outcome,evidence_ids,symbols,heat,resolution,promoted_to,expires_at,mention_count,communities,stance,persistent';

function publicEnv(env = process.env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

// live_theory has no era_id column (same note apps/web/lib/current.ts's
// header carries) and isn't wired into @swift2/core's knowledge client yet
// — mirrors that file's own REST-select approach rather than duplicating a
// second SDK client instantiation.
async function loadLiveTheories(env) {
  const url = `${env.supabaseUrl}/rest/v1/live_theory?select=${LIVE_THEORY_COLS}&order=heat.desc&limit=200`;
  const res = await fetch(url, {
    headers: { apikey: env.supabaseKey, Authorization: `Bearer ${env.supabaseKey}` },
  });
  if (!res.ok) throw new Error(`live_theory: HTTP ${res.status}`);
  const rows = await res.json();
  return rows.map((row) => ({
    id: row.id,
    heat: row.heat,
    status: row.status,
  }));
}

async function main() {
  const env = publicEnv();
  if (!env) {
    console.log(JSON.stringify(buildEventStatus(undefined, Date.now())));
    return 0;
  }

  const nowMs = Date.now();
  const knowledge = createKnowledgeClient(env);
  const [items, theories] = await Promise.all([
    knowledge.getCurrentItems(CURRENT_ERA_ID),
    loadLiveTheories(env),
  ]);

  const candidate = pickBannerCandidate(items, theories, nowMs);
  const status = buildEventStatus(candidate, nowMs);
  console.log(JSON.stringify(status));
  return 0;
}

runMain(main, { name: 'event-status' });
