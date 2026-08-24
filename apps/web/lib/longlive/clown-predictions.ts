/**
 * Clownbot agent loop (PLAN.md Stage 10) — best-effort prediction persist.
 *
 * `bot_prediction` is PLAN.md Stage 11's table, not this stage's — as of
 * this writing it does not exist in `supabase/migrations/**` (grep
 * confirmed; only `usage_daily` has landed from that group). This function
 * is written FORWARD-COMPATIBLE with Stage 11's eventual schema rather than
 * gated behind a "does the table exist" check, because there is no cheap
 * way to ask Postgres that through PostgREST without either a schema
 * introspection call (a second round trip, every single request) or
 * hard-coding today's guess at the column names as a permanent contract.
 * Instead: every insert is wrapped in try/catch, an error is logged and
 * swallowed, and the caller (`clown-agent.ts`'s consumer in `route.ts`)
 * never awaits this in a way that can block or fail the response — exactly
 * the "logs and continues" degrade PLAN.md's Stage 10 brief asks for.
 *
 * Also honest about auth: this uses the same anon-key client every other
 * Current-tier read in this app uses (`clown-agent-tools.ts`'s
 * `knowledgeEnv`/`createKnowledgeClient` pattern). Stage 2's migration note
 * says Current-tier tables are RLS "anon read-only, service role writes" —
 * meaning even once `bot_prediction` exists, this anon-key insert will very
 * likely keep failing (harmlessly, via the same try/catch) until Stage 11
 * wires real auth/RLS for it. Never reach for a service-role key from a
 * public, anonymous request path to work around that — that would bypass
 * RLS entirely for every table this key can see, not just this one insert.
 */
import type { ClownTake } from './clown-client';
import type { RetrievedItem } from './clown-fallback';

/** Same env-detection shape as `clown-agent-tools.ts`'s `knowledgeEnv` — its
 * own small copy, same rationale (not exported/shared for a 4-line lookup). */
function knowledgeEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

export interface PersistPredictionInput {
  question: string;
  take: ClownTake;
  sources: readonly RetrievedItem[];
}

/**
 * Best-effort. Never throws, never blocks the response — the caller should
 * not `await` this on the response's critical path (fire-and-forget with a
 * `.catch()` is the intended usage; see `route.ts`).
 */
export async function persistPrediction(input: PersistPredictionInput): Promise<void> {
  const env = knowledgeEnv();
  if (!env) return;
  try {
    // Posts directly to PostgREST rather than going through
    // `createKnowledgeClient` — that function's return type
    // (`KnowledgeDataSource`) is deliberately read-only (every other
    // caller in this app should only ever read the Current tier), and this
    // is the one write this module attempts. A raw `fetch` needs no new
    // client object and degrades identically either way: any error
    // (network, missing table, RLS) is caught below, logged, forgotten.
    const res = await fetch(`${env.supabaseUrl}/rest/v1/bot_prediction`, {
      method: 'POST',
      headers: {
        apikey: env.supabaseKey,
        authorization: `Bearer ${env.supabaseKey}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        question: input.question.slice(0, 600),
        stance: input.take.stance,
        theory_name: input.take.theoryName,
        delulu: input.take.delulu,
        cited_ids: input.take.citedIds,
        source_ids: input.sources.map((s) => s.id),
      }),
    });
    if (!res.ok) {
      console.log('clown:prediction-persist-skipped', JSON.stringify({ status: res.status }));
    }
  } catch (err) {
    console.log(
      'clown:prediction-persist-skipped',
      JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }),
    );
  }
}
