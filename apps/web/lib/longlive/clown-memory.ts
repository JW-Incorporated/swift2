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
 * `clown-session.ts`'s header documents. Write failures reject so the route
 * can log them while still returning the already-composed answer.
 *
 * ONE CLIENT PER REQUEST (Fable 5.1 architecture review, task R14): every
 * exported function here takes an already-built `SupabaseClient | null` —
 * built ONCE by the caller (`route.ts`, via `clown-session.ts`'s
 * `createClownDbClient`) from the resolved session, rather than each
 * function/each PostgREST call re-deriving its own client/headers/URL. A
 * `null` db means the same thing a `null` env/session meant before: degrade
 * silently, exactly per this file's own graceful-degrade contract above.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ClownSession } from './clown-session';
import type { ClownTurn } from './clown-client';
import { MAX_TRANSCRIPT_TURNS } from './clown-client';
import { screenTurn } from './clown-safety';

/** 180 days — matches the retention policy already decided for
 * `clown_conversation`/`clown_turn` (docs/decisions.md 2026-08-23 item 6,
 * `20260904000000_clown_sessions.sql`'s `expires_at` column default). Set
 * explicitly on `getOrCreateConversation`'s upsert so a conflict against an
 * already-EXPIRED row (RLS hides it at read time, but the physical row still
 * exists and would otherwise collide) gets a fresh window, not the stale
 * expired one the conflicting row already carried. */
const CONVERSATION_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

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
 * for the `Set-Cookie` response header) and hands this function to the
 * loop as a callback, never calling it directly itself.
 *
 * RPC call returns the post-increment count directly (see
 * `increment_usage_daily`'s `returns integer`) — no separate read needed.
 * A failed/unreachable RPC fails OPEN (defense in depth only, same posture
 * `usage_daily`'s other callers already take on a durable-counter miss).
 */
export async function incrementUserUsage(
  session: ClownSession,
  db: SupabaseClient | null,
  signal?: AbortSignal,
): Promise<boolean> {
  if (!db) return true;
  try {
    let query_ = db.rpc('increment_usage_daily', { p_scope: `clown-chat:${session.userId}` });
    if (signal) query_ = query_.abortSignal(signal);
    const { data, error } = await query_;
    if (error) return true;
    return typeof data === 'number' ? data <= CLOWN_USER_DAILY_CAP : true;
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

/** `getConversation`'s outcome — distinguishes "confirmed empty, no row
 * exists" (`empty`) from "the read itself failed" (`error`, a rejected
 * fetch or malformed JSON) so callers can tell the two apart (HUMAN-ACTIONS.md
 * #15 round 4: `getOrCreateConversation` must only ever create a row on
 * confirmed-empty — creating one after a mere READ FAILURE risks a
 * duplicate/extra conversation the caller may already have, once the read
 * that would have found it eventually succeeds). */
type ConversationLookup =
  | { status: 'found'; conversation: ConversationRef }
  | { status: 'empty' }
  | { status: 'error' };

/** Read-only: the caller's most recently active conversation, confirmed
 * absent, or a failed read — never creates one (see `getOrCreateConversation`
 * for the write-capable wrapper). Shared by `loadClownHistory` (a pure read)
 * and `getOrCreateConversation` (which falls back to creating one on
 * confirmed-empty only) so there is exactly one query for "find my latest
 * conversation" rather than two near-identical ones.
 *
 * Fails closed the same way `resolveClownSession` already does (Codex
 * review, HUMAN-ACTIONS.md #15 item 2): a rejected fetch (timeout, abort) or
 * malformed JSON body used to escape uncaught into `loadClownHistory`'s own
 * caller (`route.ts`'s `POST`, which does NOT wrap this read path in a
 * `.catch()` the way it does the write-side `recordClownMemory`) — a
 * Supabase hiccup would 500 the live chat route instead of degrading to
 * no-memory. Caught here, once, and degraded to `{ status: 'error' }` —
 * never thrown. */
async function getConversation(session: ClownSession, db: SupabaseClient, signal?: AbortSignal): Promise<ConversationLookup> {
  try {
    let query_ = db
      .from('clown_conversation')
      .select('id,summary')
      .eq('user_id', session.userId)
      .order('last_active_at', { ascending: false })
      .limit(1);
    if (signal) query_ = query_.abortSignal(signal);
    const { data, error } = await query_;
    if (error) return { status: 'error' };
    const rows = data as unknown;
    if (!Array.isArray(rows)) return { status: 'error' };
    if (rows.length === 0) return { status: 'empty' };
    const row = rows[0] as { id?: unknown; summary?: unknown };
    if (row && typeof row.id === 'string') {
      return { status: 'found', conversation: { id: row.id, summary: typeof row.summary === 'string' ? row.summary : '' } };
    }
    return { status: 'error' };
  } catch {
    warnMemoryReadUnavailable('getConversation fetch/json failed');
    return { status: 'error' };
  }
}

/**
 * Write-capable wrapper: read the caller's most recent conversation, or
 * create one when — and only when — that read CONFIRMED none exists.
 * On a read FAILURE (`status: 'error'`), this aborts as a best-effort no-op
 * (returns `null`, degrading to no-memory for this request) rather than
 * risking a duplicate conversation once the underlying read issue clears
 * (HUMAN-ACTIONS.md #15 round 4).
 *
 * Creation is a PostgREST UPSERT (`on_conflict=user_id`,
 * `resolution=merge-duplicates`), not a plain insert — `clown_conversation`
 * now carries a `unique (user_id)` constraint
 * (`20260908000000_clown_conversation_unique.sql`), so a plain insert would
 * permanently fail for any user whose prior row has EXPIRED: RLS hides an
 * expired row at read time (the confirmed-empty branch above), but the
 * physical row still exists and collides on insert. The upsert recovers
 * from that collision by resetting `summary`/`expires_at` on the existing
 * row instead of erroring.
 */
async function getOrCreateConversation(session: ClownSession, db: SupabaseClient): Promise<ConversationRef | null> {
  const lookup = await getConversation(session, db);
  if (lookup.status === 'found') return lookup.conversation;
  if (lookup.status === 'error') return null;
  const { data: created, error } = await db
    .from('clown_conversation')
    .upsert(
      {
        user_id: session.userId,
        summary: '',
        expires_at: new Date(Date.now() + CONVERSATION_RETENTION_MS).toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single();
  if (error || !created) return null;
  const id = (created as { id?: unknown }).id;
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
  db: SupabaseClient | null,
  signal?: AbortSignal,
): Promise<LoadedClownHistory | null> {
  if (!session || !db) return null;
  const lookup = await getConversation(session, db, signal);
  if (lookup.status !== 'found') return null;
  const conversation = lookup.conversation;
  try {
    let query_ = db
      .from('clown_turn')
      .select('role,text')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(MAX_TRANSCRIPT_TURNS);
    if (signal) query_ = query_.abortSignal(signal);
    const { data, error } = await query_;
    if (error) return { summary: conversation.summary, turns: [] };
    const rows = data as Array<{ role?: unknown; text?: unknown }>;
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

async function appendTurnPair(
  session: ClownSession,
  db: SupabaseClient,
  conversationId: string,
  question: string,
  answerText: string,
): Promise<void> {
  const userCreatedAt = Date.now();
  const { error } = await db.from('clown_turn').insert([
    {
      conversation_id: conversationId,
      user_id: session.userId,
      role: 'user',
      text: question.slice(0, MAX_TURN_TEXT),
      created_at: new Date(userCreatedAt).toISOString(),
    },
    {
      conversation_id: conversationId,
      user_id: session.userId,
      role: 'assistant',
      text: answerText.slice(0, MAX_TURN_TEXT),
      created_at: new Date(userCreatedAt + 1).toISOString(),
    },
  ]);
  if (error) throw new Error(`clown memory turn insert failed: ${error.message}`);
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
  db: SupabaseClient,
  conversation: ConversationRef,
): Promise<void> {
  const { data, error: listError } = await db
    .from('clown_turn')
    .select('id,role,text')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });
  if (listError) {
    console.log('clown:memory-fold-list-failed', JSON.stringify({ conversationId: conversation.id, message: listError.message }));
    return;
  }
  const turns = data as TurnRow[];
  if (!Array.isArray(turns)) return;

  let deleteTurnIds: string[] = [];
  let newSummary: string | null = null;
  if (turns.length > KEEP_RECENT_TURNS) {
    const toFold = turns.slice(0, turns.length - KEEP_RECENT_TURNS);
    // FOLD-TIME SCREEN (architect-directed redesign, HUMAN-ACTIONS.md #15
    // round 4) — per turn, role-aware (`screenTurn`: user turns via
    // `screenInput`, assistant turns via `screenOutput`, the exact dispatch
    // `screenConversation` already uses). A turn that fails its own screen
    // is silently dropped from what gets folded into `summary` — NOT
    // surfaced as a user-facing refusal (round 3's regression was turning a
    // fold-time hit into a chat refusal; this is deliberately not that).
    // Eviction from `clown_turn` still happens for every turn in `toFold`
    // regardless of whether it passed — this only affects what text
    // survives into the rolling summary.
    const safeToFold = toFold.filter((t) => screenTurn({ role: t.role as 'user' | 'assistant', text: t.text }) === null);
    const folded = safeToFold.map((t) => `${t.role}: ${t.text}`).join(' / ');
    newSummary = `${conversation.summary} ${folded}`.trim().slice(-MAX_SUMMARY_CHARS);
    deleteTurnIds = toFold.map((t) => t.id);
  }

  const { error: foldError } = await db.rpc('fold_clown_conversation', {
    p_conversation_id: conversation.id,
    p_delete_turn_ids: deleteTurnIds,
    p_new_summary: newSummary,
  });
  if (foldError) {
    console.log('clown:memory-fold-failed', JSON.stringify({ conversationId: conversation.id, message: foldError.message }));
  }
}

export interface RecordTurnInput {
  session: ClownSession | null;
  question: string;
  answerText: string;
}

/**
 * Best-effort — the caller (`route.ts`) waits for this to settle before the
 * response stream closes and logs a rejection without replacing the answer.
 * No-ops entirely when `session` is `null` (auth unavailable — today's real
 * state) or `db` couldn't be built.
 */
export async function recordClownMemory(input: RecordTurnInput, db: SupabaseClient | null): Promise<void> {
  if (!input.session || !db) return;
  const conversation = await getOrCreateConversation(input.session, db);
  if (!conversation) return;
  await appendTurnPair(input.session, db, conversation.id, input.question, input.answerText);
  await maintainRollingSummary(input.session, db, conversation);
}
