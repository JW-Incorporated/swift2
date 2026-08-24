/**
 * Clownbot agent loop (PLAN.md Stage 10) — best-effort prediction persist.
 * PLAN.md Stage 11 wires this for real: `bot_prediction` now exists
 * (`supabase/migrations/20260904000000_clown_sessions.sql`), RLS scoped so
 * the `authenticated` (anonymous-auth) user may insert/read only their own
 * rows (`clown-session.ts`'s header — no service-role key is ever reached
 * for from `apps/web`).
 *
 * Same graceful-degrade posture as the rest of this stage: a `null` session
 * (auth unavailable — today's real state, HUMAN-ACTIONS.md #15 item 2)
 * no-ops the write entirely rather than firing a doomed anon-key POST
 * (Codex review MAJOR 9 on the pre-Stage-11 version of this file).
 */
import type { ClownTake } from './clown-client';
import type { RetrievedItem } from './clown-fallback';
import type { ClownSession } from './clown-session';
import { clownAuthHeaders, clownMemoryEnv } from './clown-session';

export interface PersistPredictionInput {
  session: ClownSession | null;
  question: string;
  take: ClownTake;
  sources: readonly RetrievedItem[];
}

const MAX_QUESTION = 600;

/**
 * Best-effort — never blocks the response. A network/HTTP failure DOES
 * reject; the caller never `await`s this on the response's critical path
 * (fire-and-forget with a `.catch(() => {})` is the intended usage; see
 * `route.ts`), so a rejection here is swallowed there, not here.
 *
 * Writes `claim` (the falsifiable position — `take.stance`), `theory_name`,
 * `cited_ids`, `delulu`, and `status: 'pending'` — enough structure for a
 * future resolution pass (Stage 8/promotion) to act on, per this stage's
 * brief. `symbols` has no source on `ClownTake`/`RetrievedItem` today, so it
 * ships `[]` — the column exists for that future pass to populate.
 */
export async function persistPrediction(input: PersistPredictionInput): Promise<void> {
  if (!input.session) return;
  const env = clownMemoryEnv();
  if (!env) return;
  await fetch(`${env.supabaseUrl}/rest/v1/bot_prediction`, {
    method: 'POST',
    headers: { ...clownAuthHeaders(env, input.session), 'content-type': 'application/json' },
    body: JSON.stringify({
      user_id: input.session.userId,
      question: input.question.slice(0, MAX_QUESTION),
      claim: input.take.stance.slice(0, MAX_QUESTION) || input.question.slice(0, MAX_QUESTION),
      theory_name: input.take.theoryName,
      symbols: [],
      cited_ids: input.take.citedIds,
      delulu: input.take.delulu,
      status: 'pending',
    }),
  });
}
