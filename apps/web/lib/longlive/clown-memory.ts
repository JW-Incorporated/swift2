/**
 * Clownbot memory (PLAN.md Stage 11, proposal §7) — server-side conversation
 * continuation, rolling summary, and the per-user daily cap. Session
 * resolution itself lives in `clown-session.ts`; this module is everything
 * that happens once a session is (or isn't) resolved.
 *
 * Every exported function here degrades to a no-op (or the most permissive
 * outcome) when `session` is `null` — the same graceful-degrade contract
 * `clown-session.ts`'s header documents. Nothing here throws into the
 * response path; callers still wrap the write-side calls in `.catch(() =>
 * {})` (matching `clown-predictions.ts`'s existing best-effort convention)
 * as defense in depth against a bug in this module, not because any path
 * here is expected to throw.
 */
import type { ClownSession, ClownSessionToken } from './clown-session';
import { clownAuthHeaders, clownMemoryEnv, resolveClownSession } from './clown-session';

/** Composes/day per authenticated anonymous user (PLAN.md Stage 11).
 * Deliberately the SAME number as `clown-usage.ts`'s `CLOWN_DAILY_CAP`
 * (200/day/instance, PENDING Wyatt's ratification per that file's header) —
 * not a new invented number, just the existing convention now also scoped
 * per user rather than only per warm instance. Backed by the existing
 * `usage_daily` table/`increment_usage_daily` RPC (20260902000000), scoped
 * to `clown-chat:<user_id>` so this never collides with `extract`'s counter
 * or the global per-instance cap. */
export const CLOWN_USER_DAILY_CAP = 200;

export interface UserBudgetResult {
  /** `false` only when a session resolved AND that user is over their daily
   * cap — the caller should refuse the request. `true` otherwise, including
   * every degraded state (no session), since the existing per-instance daily
   * cap (`clown-usage.ts`) remains the real ceiling either way. */
  ok: boolean;
  session: ClownSession | null;
}

/** RPC call returns the post-increment count directly (see
 * `increment_usage_daily`'s `returns integer`) — no separate read needed.
 * A failed/unreachable RPC fails OPEN (defense in depth only, same posture
 * `usage_daily`'s other callers already take on a durable-counter miss). */
async function incrementUserUsage(session: ClownSession, fetchImpl: typeof fetch, signal?: AbortSignal): Promise<boolean> {
  const env = clownMemoryEnv();
  if (!env) return true;
  try {
    const res = await fetchImpl(`${env.supabaseUrl}/rest/v1/rpc/increment_usage_daily`, {
      method: 'POST',
      headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json' },
      body: JSON.stringify({ p_scope: `clown-chat:${session.userId}` }),
      signal,
    });
    if (!res.ok) return true;
    const count = await res.json();
    return typeof count === 'number' ? count <= CLOWN_USER_DAILY_CAP : true;
  } catch {
    return true;
  }
}

/** Resolves the session (see `clown-session.ts`) and, only when one
 * resolves, checks/increments that user's daily cap. Call this ONCE per
 * request, before the model spend — mirrors where `clown-agent.ts`'s own
 * `usage.reserve()` sits relative to the route's scope check. `signal`
 * bounds both the auth attempt and the cap RPC to the route's single shared
 * request deadline — see `clown-session.ts`'s `resolveClownSession` header. */
export async function reserveUserDailyBudget(
  existingToken?: ClownSessionToken | null,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<UserBudgetResult> {
  const session = await resolveClownSession(existingToken, fetchImpl, signal);
  if (!session) return { ok: true, session: null };
  const withinCap = await incrementUserUsage(session, fetchImpl, signal);
  return { ok: withinCap, session };
}

interface ConversationRef {
  id: string;
  summary: string;
}

async function getOrCreateConversation(session: ClownSession, fetchImpl: typeof fetch): Promise<ConversationRef | null> {
  const env = clownMemoryEnv();
  if (!env) return null;
  const getUrl = `${env.supabaseUrl}/rest/v1/clown_conversation?select=id,summary&user_id=eq.${session.userId}&order=last_active_at.desc&limit=1`;
  const getRes = await fetchImpl(getUrl, { headers: clownAuthHeaders(env, session) });
  if (getRes.ok) {
    const rows = (await getRes.json()) as Array<{ id?: unknown; summary?: unknown }>;
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (row && typeof row.id === 'string') return { id: row.id, summary: typeof row.summary === 'string' ? row.summary : '' };
  }
  const postRes = await fetchImpl(`${env.supabaseUrl}/rest/v1/clown_conversation`, {
    method: 'POST',
    headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: session.userId }),
  });
  if (!postRes.ok) return null;
  const created = (await postRes.json()) as unknown;
  const row = Array.isArray(created) ? created[0] : created;
  const id = (row as { id?: unknown })?.id;
  if (typeof id !== 'string') return null;
  return { id, summary: '' };
}

const MAX_TURN_TEXT = 4000;

async function appendTurn(
  session: ClownSession,
  conversationId: string,
  role: 'user' | 'assistant',
  text: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  const env = clownMemoryEnv();
  if (!env) return;
  await fetchImpl(`${env.supabaseUrl}/rest/v1/clown_turn`, {
    method: 'POST',
    headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      user_id: session.userId,
      role,
      text: text.slice(0, MAX_TURN_TEXT),
    }),
  });
}

/** How many of the MOST RECENT turns stay as individual rows — well above
 * `clown-client.ts`'s `MAX_TRANSCRIPT_TURNS` (6, the model's own context
 * window), same "cap it" instinct `buildInitialMessages` already applies,
 * just at the storage layer instead of the prompt layer. */
const KEEP_RECENT_TURNS = 20;
const MAX_SUMMARY_CHARS = 4000;

interface TurnRow {
  id: string;
  role: string;
  text: string;
}

/**
 * Simple truncate-and-fold, per PLAN.md Stage 11's explicit "doesn't need to
 * be fancy" instruction: once a conversation has more than
 * `KEEP_RECENT_TURNS` rows, the oldest excess turns are folded into
 * `clown_conversation.summary` (a plain concatenation, capped and tail-
 * truncated) and deleted, so `clown_turn` never grows unbounded for a
 * long-running session. Always bumps `last_active_at`.
 */
async function maintainRollingSummary(
  session: ClownSession,
  conversation: ConversationRef,
  fetchImpl: typeof fetch,
): Promise<void> {
  const env = clownMemoryEnv();
  if (!env) return;
  const listUrl = `${env.supabaseUrl}/rest/v1/clown_turn?select=id,role,text&conversation_id=eq.${conversation.id}&order=created_at.asc`;
  const listRes = await fetchImpl(listUrl, { headers: clownAuthHeaders(env, session) });
  const turns: TurnRow[] = listRes.ok ? ((await listRes.json()) as TurnRow[]) : [];

  const patchBody: Record<string, unknown> = { last_active_at: new Date().toISOString() };
  if (Array.isArray(turns) && turns.length > KEEP_RECENT_TURNS) {
    const toFold = turns.slice(0, turns.length - KEEP_RECENT_TURNS);
    const folded = toFold.map((t) => `${t.role}: ${t.text}`).join(' / ');
    patchBody.summary = `${conversation.summary} ${folded}`.trim().slice(-MAX_SUMMARY_CHARS);
    const idList = toFold.map((t) => t.id).join(',');
    if (idList) {
      await fetchImpl(`${env.supabaseUrl}/rest/v1/clown_turn?id=in.(${idList})`, {
        method: 'DELETE',
        headers: clownAuthHeaders(env, session),
      });
    }
  }
  await fetchImpl(`${env.supabaseUrl}/rest/v1/clown_conversation?id=eq.${conversation.id}`, {
    method: 'PATCH',
    headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json' },
    body: JSON.stringify(patchBody),
  });
}

export interface RecordTurnInput {
  session: ClownSession | null;
  question: string;
  answerText: string;
}

/**
 * Best-effort — the caller (`route.ts`) fire-and-forgets this with a
 * `.catch(() => {})`, same discipline as `persistPrediction`. No-ops
 * entirely when `session` is `null` (auth unavailable — today's real state).
 */
export async function recordClownMemory(input: RecordTurnInput, fetchImpl: typeof fetch = fetch): Promise<void> {
  if (!input.session) return;
  const conversation = await getOrCreateConversation(input.session, fetchImpl);
  if (!conversation) return;
  await appendTurn(input.session, conversation.id, 'user', input.question, fetchImpl);
  await appendTurn(input.session, conversation.id, 'assistant', input.answerText, fetchImpl);
  await maintainRollingSummary(input.session, conversation, fetchImpl);
}
