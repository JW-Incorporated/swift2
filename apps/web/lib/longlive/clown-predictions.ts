/**
 * Clownbot agent loop (PLAN.md Stage 10) — best-effort prediction persist.
 *
 * `bot_prediction` is PLAN.md Stage 11's table, not this stage's — as of
 * this writing it does not exist in `supabase/migrations/**` (grep
 * confirmed; only `usage_daily` has landed from that group), and even once
 * it does, Stage 2's migration note says Current-tier tables are RLS "anon
 * read-only, service role writes" — this anon-key insert would very likely
 * keep failing harmlessly until Stage 11 wires real auth/RLS for it. Never
 * reach for a service-role key from a public, anonymous request path to
 * work around that — that would bypass RLS entirely for every table this
 * key can see, not just this one insert.
 *
 * Codex review MAJOR 9: firing that doomed POST anyway, on every single
 * successful answer, wasted a real network round trip for a write that was
 * always going to fail — this function now short-circuits to a clear,
 * greppable no-op log instead. The intended-shape write (kept here,
 * unreachable, as the concrete contract Stage 11 wires up for real) stays
 * documented below rather than deleted outright.
 */
import type { ClownTake } from './clown-client';
import type { RetrievedItem } from './clown-fallback';

export interface PersistPredictionInput {
  question: string;
  take: ClownTake;
  sources: readonly RetrievedItem[];
}

/**
 * Best-effort. Never throws, never blocks the response — the caller should
 * not `await` this on the response's critical path (fire-and-forget with a
 * `.catch()` is the intended usage; see `route.ts`).
 *
 * No-ops until `bot_prediction` (PLAN.md Stage 11) exists — see header.
 * Stage 11 replaces this body with the real insert (shape: `question`,
 * `stance`/`theory_name`/`delulu`/`cited_ids` off `input.take`, `source_ids`
 * off `input.sources`, against `env.supabaseUrl`'s `/rest/v1/bot_prediction`
 * once real auth/RLS lands for it) rather than adding a second function.
 */
export async function persistPrediction(input: PersistPredictionInput): Promise<void> {
  console.log(
    'clown:prediction-persist-pending-stage-11',
    JSON.stringify({ questionLength: input.question.length, citedIds: input.take.citedIds.length }),
  );
}
