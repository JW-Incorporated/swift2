/**
 * Clownbot memory (PLAN.md Stage 11, proposal §7) — server-side conversation
 * continuation, rolling summary, and the per-user daily cap. Session
 * resolution itself lives in `clown-session.ts`; this module is everything
 * that happens once a session is (or isn't) resolved: `loadClownHistory`
 * (read), `recordClownMemory` (write), and `incrementUserUsage` (the
 * per-user cap, reserved by `clown-agent.ts`'s `runClownAgent` at the right
 * point in its own control flow — see that function's header for why).
 *
 * Every exported function here degrades to a no-op (or the most permissive
 * outcome) when `session` is `null` — the same graceful-degrade contract
 * `clown-session.ts`'s header documents. Nothing here throws into the
 * response path; callers still wrap the write-side calls in `.catch(() =>
 * {})` (matching `clown-predictions.ts`'s existing best-effort convention)
 * as defense in depth against a bug in this module, not because any path
 * here is expected to throw.
 */
import type { ClownSession } from './clown-session';
import { clownAuthHeaders, clownMemoryEnv } from './clown-session';
import type { ClownTurn } from './clown-client';
import { MAX_TRANSCRIPT_TURNS } from './clown-client';

/** Composes/day per authenticated anonymous user (PLAN.md Stage 11).
 * Deliberately the SAME number as `clown-usage.ts`'s `CLOWN_DAILY_CAP`
 * (200/day/instance, PENDING Wyatt's ratification per that file's header) —
 * not a new invented number, just the existing convention now also scoped
 * per user rather than only per warm instance. Backed by the existing
 * `usage_daily` table/`increment_usage_daily` RPC (20260902000000), scoped
 * to `clown-chat:<user_id>` so this never collides with `extract`'s counter
 * or the global per-instance cap. */
export const CLOWN_USER_DAILY_CAP = 200;

/**
 * Reserves budget for ONE model call against the resolved session's daily
 * cap — the caller must invoke this ONLY once it already knows a model call
 * is actually about to be attempted (Codex review, HUMAN-ACTIONS.md #15 item
 * 2: the route used to resolve-and-reserve before the kill-switch/API-key/
 * global-cap checks inside `clown-agent.ts`'s `runClownAgent`, so a request
 * that never spent any model budget still consumed the user's daily
 * allowance). `runClownAgent` calls this itself, right after its own
 * `clownModelKey()` and `usage.reserve()` (global) checks pass and before
 * building the first model request — the route only resolves the SESSION
 * up front (`clown-session.ts`'s `resolveClownSession`, needed synchronously
 * for the `x-clown-session` response header) and hands this function to the
 * loop as a callback, never calling it directly itself.
 *
 * RPC call returns the post-increment count directly (see
 * `increment_usage_daily`'s `returns integer`) — no separate read needed.
 * A failed/unreachable RPC fails OPEN (defense in depth only, same posture
 * `usage_daily`'s other callers already take on a durable-counter miss).
 */
export async function incrementUserUsage(session: ClownSession, fetchImpl: typeof fetch = fetch, signal?: AbortSignal): Promise<boolean> {
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

interface ConversationRef {
  id: string;
  summary: string;
}

/** One warn per warm instance (same "best-effort per-instance" posture as
 * `clown-session.ts`'s `warnedAuthUnavailable`) — a Supabase timeout/abort/
 * malformed-response on the READ path degrades to "no memory" silently on
 * every request but this one, rather than a log line per chat message. */
let warnedMemoryReadUnavailable = false;

/** Test-only reset — mirrors `clown-session.ts`'s
 * `resetClownSessionWarningForTests` for the same reason: the only way to
 * exercise the "warns exactly once" behavior deterministically across
 * multiple `it()` blocks. */
export function resetClownMemoryReadWarningForTests(): void {
  warnedMemoryReadUnavailable = false;
}

function warnMemoryReadUnavailable(reason: string): void {
  if (warnedMemoryReadUnavailable) return;
  warnedMemoryReadUnavailable = true;
  console.log('clown:memory-read-unavailable', JSON.stringify({ reason }));
}

/** Read-only: the caller's most recently active conversation, or `null` when
 * none exists yet / the read fails — never creates one (see
 * `getOrCreateConversation` for the write-capable wrapper). Shared by
 * `loadClownHistory` (a pure read) and `getOrCreateConversation` (which
 * falls back to creating one) so there is exactly one query for "find my
 * latest conversation" rather than two near-identical ones.
 *
 * Fails closed the same way `resolveClownSession` already does (Codex
 * review, HUMAN-ACTIONS.md #15 item 2): a rejected fetch (timeout, abort) or
 * malformed JSON body used to escape uncaught into `loadClownHistory`'s own
 * caller (`route.ts`'s `POST`, which does NOT wrap this read path in a
 * `.catch()` the way it does the write-side `recordClownMemory`) — a
 * Supabase hiccup would 500 the live chat route instead of degrading to
 * no-memory. Caught here, once, and degraded to `null` — never thrown. */
async function getConversation(session: ClownSession, fetchImpl: typeof fetch, signal?: AbortSignal): Promise<ConversationRef | null> {
  const env = clownMemoryEnv();
  if (!env) return null;
  try {
    const getUrl = `${env.supabaseUrl}/rest/v1/clown_conversation?select=id,summary&user_id=eq.${session.userId}&order=last_active_at.desc&limit=1`;
    const getRes = await fetchImpl(getUrl, { headers: clownAuthHeaders(env, session), signal });
    if (!getRes.ok) return null;
    const rows = (await getRes.json()) as Array<{ id?: unknown; summary?: unknown }>;
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (row && typeof row.id === 'string') return { id: row.id, summary: typeof row.summary === 'string' ? row.summary : '' };
    return null;
  } catch {
    warnMemoryReadUnavailable('getConversation fetch/json failed');
    return null;
  }
}

async function getOrCreateConversation(session: ClownSession, fetchImpl: typeof fetch): Promise<ConversationRef | null> {
  const env = clownMemoryEnv();
  if (!env) return null;
  const existing = await getConversation(session, fetchImpl);
  if (existing) return existing;
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

export interface LoadedClownHistory {
  /** The rolling fold of everything `maintainRollingSummary` has evicted
   * past `KEEP_RECENT_TURNS` — empty string when nothing has folded yet. */
  summary: string;
  /** The most recent stored turns, chronological order, capped at
   * `MAX_TRANSCRIPT_TURNS` — the same window size the model itself sees on
   * a live (non-reloaded) conversation. */
  turns: ClownTurn[];
}

/**
 * The read half of PLAN.md Stage 11's memory contract — previously missing
 * entirely (Codex review, HUMAN-ACTIONS.md #15 item 2: "persisted memory is
 * write-only"). Loads the caller's most recent conversation's rolling
 * summary plus its most recent stored turns, for the route to fold into the
 * model's context on a returning conversation (`route.ts`'s MEMORY LOAD
 * section) — without this, a client-side transcript reset (a page reload;
 * `store.tsx` never persists `clownMessages`) meant the model started from
 * nothing even though the server had a full history for that user.
 * Degrades to `null` for every no-session/no-conversation-yet/network-
 * failure state, same posture as every other function here. Never throws
 * (Codex review, HUMAN-ACTIONS.md #15 item 2) — a rejected fetch or
 * malformed JSON on the recent-turns lookup is caught the same way
 * `getConversation` above catches its own, so a Supabase hiccup degrades
 * `route.ts`'s `POST` to no-memory instead of an unhandled exception.
 */
export async function loadClownHistory(
  session: ClownSession | null,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<LoadedClownHistory | null> {
  if (!session) return null;
  const env = clownMemoryEnv();
  if (!env) return null;
  const conversation = await getConversation(session, fetchImpl, signal);
  if (!conversation) return null;
  try {
    const listUrl = `${env.supabaseUrl}/rest/v1/clown_turn?select=role,text&conversation_id=eq.${conversation.id}&order=created_at.desc&limit=${MAX_TRANSCRIPT_TURNS}`;
    const listRes = await fetchImpl(listUrl, { headers: clownAuthHeaders(env, session), signal });
    if (!listRes.ok) return { summary: conversation.summary, turns: [] };
    const rows = (await listRes.json()) as Array<{ role?: unknown; text?: unknown }>;
    const turns: ClownTurn[] = Array.isArray(rows)
      ? rows
          .filter((r): r is { role: 'user' | 'assistant'; text: string } => (r.role === 'user' || r.role === 'assistant') && typeof r.text === 'string')
          .reverse() // DESC (most recent first) over the wire → chronological order for the model
      : [];
    return { summary: conversation.summary, turns };
  } catch {
    warnMemoryReadUnavailable('loadClownHistory fetch/json failed');
    return null;
  }
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
 *
 * The delete + summary patch happen as ONE call to `fold_clown_conversation`
 * (20260906000000_clown_fold_conversation.sql), not two separate PostgREST
 * requests (Codex review, HUMAN-ACTIONS.md #15 item 2: two independent,
 * non-status-checked requests could partially fail — a dead delete after a
 * live patch duplicates the folded turns into `summary` again next time; a
 * dead patch after a live delete loses their text outright). The Postgres
 * function runs both writes in the one transaction its own call already is,
 * so either both land or neither does. The RPC response status IS checked
 * (logged on failure) rather than silently continuing either.
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
  if (!listRes.ok) {
    console.log('clown:memory-fold-list-failed', JSON.stringify({ conversationId: conversation.id, status: listRes.status }));
    return;
  }
  const turns = (await listRes.json()) as TurnRow[];
  if (!Array.isArray(turns)) return;

  let deleteTurnIds: string[] = [];
  let newSummary: string | null = null;
  if (turns.length > KEEP_RECENT_TURNS) {
    const toFold = turns.slice(0, turns.length - KEEP_RECENT_TURNS);
    const folded = toFold.map((t) => `${t.role}: ${t.text}`).join(' / ');
    newSummary = `${conversation.summary} ${folded}`.trim().slice(-MAX_SUMMARY_CHARS);
    deleteTurnIds = toFold.map((t) => t.id);
  }

  const foldRes = await fetchImpl(`${env.supabaseUrl}/rest/v1/rpc/fold_clown_conversation`, {
    method: 'POST',
    headers: { ...clownAuthHeaders(env, session), 'content-type': 'application/json' },
    body: JSON.stringify({
      p_conversation_id: conversation.id,
      p_delete_turn_ids: deleteTurnIds,
      p_new_summary: newSummary,
    }),
  });
  if (!foldRes.ok) {
    console.log('clown:memory-fold-failed', JSON.stringify({ conversationId: conversation.id, status: foldRes.status }));
  }
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
