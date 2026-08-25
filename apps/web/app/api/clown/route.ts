import { NextResponse } from 'next/server';

import { allClownDocs } from '../../../lib/longlive/clown-index';
import { retrieveClownDocs } from '../../../lib/longlive/clown-retrieve';
import { crisisCheck, refusal, screenConversation, screenInput, OUT_OF_SCOPE_MESSAGE } from '../../../lib/longlive/clown-safety';
import type { ClownTurn } from '../../../lib/longlive/clown-client';
import { clownUsage } from '../../../lib/longlive/clown-usage';
import { screenClownTake } from '../../../lib/longlive/clown-gate';
import { resolveTheoryName } from '../../../lib/longlive/clown-names';
import { docToRetrievedItem, composeFallback, type RetrievedItem } from '../../../lib/longlive/clown-fallback';
import { answerFromFallback, answerFromTake } from '../../../lib/longlive/clown-answer';
import { resolveScopeSignal } from '../../../lib/longlive/clown-agent-tools';
import { AGENT_MAX_WALL_MS, runClownAgent } from '../../../lib/longlive/clown-agent';
import { persistPrediction } from '../../../lib/longlive/clown-predictions';
import { incrementUserUsage, loadClownHistory, recordClownMemory } from '../../../lib/longlive/clown-memory';
import {
  buildSessionCookieHeader,
  decodeSessionToken,
  encodeSessionToken,
  readSessionCookie,
  resolveClownSession,
} from '../../../lib/longlive/clown-session';
import { MAX_TEXT, clientIp, messageAnswer, ndjsonResponse, rateLimited, sanitizeTranscript } from '../../../lib/longlive/clown-route-helpers';

// Clownbot (build B) — the API route. PLAN.md Step 8; agent loop added
// PLAN.md Stage 10 (proposal §7).
//
// STAGE ORDER, non-negotiable, UNCHANGED by Stage 10:
//   rate-limit → kill switch → crisis check → input blocklist →
//   prior-turn blocklist → retrieval → compose-or-fallback → output gate
//
// Stage 10 inserts a BOUNDED TOOL LOOP into "compose-or-fallback" — it does
// not reorder anything before or after it. Two new things sit right before
// the loop, both still inside the same "retrieval" stage conceptually:
//   - CHIP TAPS (unchanged) still resolve via the deterministic compile-time
//     retrieval + zero-model fallback composer, exactly as before.
//   - SCOPE CHECK (new): a fast-path short-circuit, not a new gate layer
//     (proposal §7 / 8-16 brief Task 2) — if neither a DB search nor the
//     compile-time corpus surfaces anything for the question, the route
//     returns the existing in-character `OUT_OF_SCOPE_MESSAGE` before ever
//     spending a model call. See `clown-agent-tools.ts`'s
//     `resolveScopeSignal` for exactly what "nothing surfaces" means and why
//     it checks both the DB and the compile-time corpus, not just the DB.
//
// The kill switch (`CLOWN_MODEL_DISABLED`) is checked BEFORE usage is
// reserved, but that check lives entirely inside `runClownAgent()`
// (clown-agent.ts, via `clown-client.ts`'s shared `clownModelKey()`) — it
// reads the API key, then the kill switch, then reserves budget (global,
// then — Codex review fix, HUMAN-ACTIONS.md #15 item 2 — the caller's own
// per-user budget, via the `reserveUserBudget` callback this route hands
// it), in that order, and degrades (a null `take`) for every degraded state
// (no key, kill switch on, over cap, over the caller's own cap, timeout, or
// every attempt failing). This route does not duplicate that check.
//
// CRISIS is a THIRD PRODUCER of `ClownAnswer` (clown-answer.ts's header says
// "three producers converge here" but only names two — the model take and
// the zero-model fallback; this route is the crisis path's producer). It is
// built directly, not through either adapter, because it must be the
// verbatim `CRISIS_MESSAGE` alone: no retrieval, no model, no source cards,
// no clown persona wrapped around it. The blocklist refusal and the
// out-of-scope redirect are the same shape for the same reason — fixed,
// in-character copy with nothing else attached.
//
// `screenInput()` (clown-safety.ts) already composes the topic blocklist
// (clown-blocklist.ts's `screenTopic()`) together with the behaviour
// redlines (impersonation/official/certainty) into one ordered gate — that
// IS "the input blocklist stage". Calling `screenTopic()` again here would
// re-run the same categories a second time for nothing.
//
// PRIOR-TURN BLOCKLIST (2026-08-14 fix, Finding 3): `screenInput` only ever
// saw the current turn's `text`. The client-held `transcript` was shape-
// sanitised (`sanitizeTranscript`) and sent straight to the model — a
// blocked topic smuggled into an earlier user turn, or a forged assistant
// turn granting a jailbreak, reached the model completely unscreened.
// `screenConversation()` exists precisely for this (its own header has said
// so since it was written) and was simply never wired in. It now runs on
// every prior turn, before the model is ever called — same refusal shape as
// a blocked current turn, so a caller cannot tell the two stages apart.
//
// MEMORY (PLAN.md Stage 11): the server persists a `bot_prediction` row and
// a folded conversation/turn history ONLY when an anonymous-auth session
// resolves (`clown-memory.ts`/`clown-session.ts`) — today's real state is
// that it never resolves (HUMAN-ACTIONS.md #15 item 2), so the server stores
// nothing beyond the existing best-effort `bot_prediction` attempt either
// way. Every write is best-effort and degrades silently. No message content
// is otherwise logged — only category names on a refusal/rejection, matching
// the pattern already used elsewhere in this app (mood-chat's route). The
// client still holds the transcript (~`MAX_TRANSCRIPT_TURNS` messages) and
// resends it every call; this route reads it, forgets it — memory is an
// ADDITIONAL, separately-gated store, not a replacement for that.
//
// MEMORY LOAD (Codex review fix, HUMAN-ACTIONS.md #15 item 2: "persisted
// memory is write-only"): when a session resolves AND the client's own
// transcript is empty (a fresh page load, or the conversation's first
// message — `store.tsx` never persists `clownMessages` to localStorage, so
// a reload always starts the client transcript over even though the server
// has a full history), the caller's stored conversation is loaded
// (`clown-memory.ts`'s `loadClownHistory`) and its recent turns stand in for
// the client transcript so the model still has continuity. When the client
// DOES already hold turns (continuing within the same page load), those
// already mirror what `recordClownMemory` persisted this session, so they
// are used as-is rather than duplicating context. The rolling summary,
// covering whatever was folded away before either window, is passed to
// `runClownAgent` either way — see its own header for how it reaches the
// model. LOADED HISTORY IS SCREENED before any of this (HUMAN-ACTIONS.md
// #15 item 1 fix, below) — a stored turn or summary carries the same
// elevated-trust risk the client-supplied transcript does, and skipped this
// gate entirely before this fix.
//
// STREAMING (new, PLAN.md Stage 10 req 1): only the agent-loop path streams.
// Every deterministic path (crisis, blocklist, chip, scope redirect) still
// returns a single, unstreamed `NextResponse.json(...)` — a `ClownAnswer` at
// the top level, byte-for-byte the same shape as before Stage 10, so every
// caller that only cares about the final answer (including this route's own
// pre-Stage-10 tests for those paths) is unaffected. The loop path returns
// a newline-delimited JSON stream of `ClownStreamEvent`s instead: zero or
// more `{type:'investigation', step}` events as the loop's tool calls
// resolve, followed by exactly one `{type:'answer', answer}` event. See
// `ndjsonResponse` below.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A degraded loop can accumulate hundreds of rows across its investigation
// (Codex review MAJOR 10) — cap what actually gets composed into the
// fallback response to a small, presentable number; `composeFallback`'s
// `totalAvailable` note tells the reader honestly that more was found.
const DEGRADED_ITEM_CAP = 8;

export async function POST(req: Request): Promise<Response> {
  let payload: { text?: unknown; transcript?: unknown; chip?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'One thing at a time — give it a moment and try again.' },
      { status: 429 },
    );
  }

  const text = (typeof payload.text === 'string' ? payload.text : '').slice(0, MAX_TEXT).trim();
  if (!text) {
    return NextResponse.json({ error: 'Give me something to clown about.' }, { status: 400 });
  }

  // CRISIS CHECK — deterministic, before any spend, before retrieval, before
  // the model. The one response that is not in character.
  const crisis = crisisCheck(text);
  if (crisis) {
    return NextResponse.json(messageAnswer(crisis.message));
  }

  // INPUT BLOCKLIST — a blocked topic returns the fixed in-character
  // redirect and the model is never consulted.
  const blockedCategory = screenInput(text);
  if (blockedCategory) {
    console.log('clown:refusal', JSON.stringify({ gate: 'input', category: blockedCategory }));
    return NextResponse.json(messageAnswer([refusal(blockedCategory).message]));
  }

  // PRIOR-TURN BLOCKLIST — see the header note above. Before any model spend.
  const priorTurns = sanitizeTranscript(payload.transcript);
  const conversationHit = screenConversation(priorTurns);
  if (conversationHit) {
    console.log('clown:refusal', JSON.stringify({ gate: 'conversation', category: conversationHit }));
    return NextResponse.json(messageAnswer([refusal(conversationHit).message]));
  }

  // CHIP TAPS — the request marks itself as originating from a prefill
  // column. Those resolve here, via the unchanged deterministic compile-time
  // retrieval, and MUST NOT reach the model or the agent loop; that is what
  // keeps both board columns free.
  if (payload.chip === true) {
    const docs = retrieveClownDocs(text, allClownDocs());
    const items = docs.map(docToRetrievedItem);
    return NextResponse.json(answerFromFallback(composeFallback(items, 'chip')));
  }

  // SINGLE SHARED DEADLINE (Codex review BLOCKER 2) — one wall-clock budget
  // for BOTH the scope check below and the agent loop that may follow it,
  // via one `AbortController` threaded through every async call either
  // makes. Created here, not inside `runClownAgent`, so a hung pre-loop
  // scope search counts against the same 20s the loop itself is bound by,
  // rather than getting an unbounded head start on it.
  const deadlineController = new AbortController();
  const deadlineTimer = setTimeout(() => deadlineController.abort(), AGENT_MAX_WALL_MS);

  // SCOPE CHECK — fast-path retrieval short-circuit (PLAN.md Stage 10 req
  // 3), NOT a new blocklist layer. Runs before the model is ever consulted.
  const scope = await resolveScopeSignal(text, deadlineController.signal);
  if (!scope.inScope) {
    clearTimeout(deadlineTimer);
    console.log('clown:out-of-scope', JSON.stringify({ length: text.length }));
    return NextResponse.json(messageAnswer([OUT_OF_SCOPE_MESSAGE]));
  }

  // MEMORY — resolves an anonymous-auth session BEFORE the model spend
  // (needed synchronously for the `Set-Cookie` response header below), but
  // does NOT reserve the caller's per-user budget here — that happens
  // inside `runClownAgent`, only once it already knows a model call is
  // about to be attempted (Codex review fix, HUMAN-ACTIONS.md #15 item 2;
  // see `clown-agent.ts`'s header for why). `session` is `null` in every
  // degraded state (no Supabase env, no client token, or — today's real
  // state — anonymous sign-ins not yet toggled on; HUMAN-ACTIONS.md #15
  // item 2) and every downstream memory call already treats `null` as
  // "skip, no persistence" — this never blocks a reply on its own.
  //
  // COOKIE, NOT A CLIENT-VISIBLE TOKEN (architect-directed redesign,
  // HUMAN-ACTIONS.md #15 round 4): the round-3 `x-clown-session` header/
  // localStorage token handed the raw Supabase access+refresh token pair to
  // client JS — the client never needs to see or handle it at all. The
  // session now round-trips via an `HttpOnly; Secure; SameSite=Strict`
  // cookie scoped to this route (`clown-session.ts`'s `readSessionCookie`/
  // `buildSessionCookieHeader`); the browser resends it automatically on
  // same-origin `fetch`, and a forged/invalid cookie just fails the refresh
  // exchange inside `resolveClownSession` (falls through to null/fresh-
  // signup) — no signing, no HMAC, no new env var needed.
  const incomingSessionToken = decodeSessionToken(readSessionCookie(req.headers.get('cookie')));
  const memorySession = await resolveClownSession(incomingSessionToken, undefined, deadlineController.signal);
  const sessionHeaders = memorySession
    ? { 'Set-Cookie': buildSessionCookieHeader(encodeSessionToken(memorySession)) }
    : undefined;
  const reserveUserBudget = memorySession
    ? () => incrementUserUsage(memorySession, undefined, deadlineController.signal)
    : undefined;

  // MEMORY LOAD — see the header note above. Only pulled when the client's
  // own transcript is empty; otherwise the client transcript already covers
  // the same recent-turn window.
  const loadedHistory =
    memorySession && priorTurns.length === 0
      ? await loadClownHistory(memorySession, undefined, deadlineController.signal)
      : null;

  // LOADED-HISTORY SCREEN (HUMAN-ACTIONS.md #15 item 1 fix) — a stored turn
  // reaching this point originated from some earlier user message; without
  // this it becomes elevated-trust context the model would otherwise trust
  // unconditionally (it never passed the CLIENT-transcript screen above,
  // because it never arrived as a client transcript). The loaded turns are
  // turn objects, so they go through the exact same `screenConversation` the
  // client transcript does above. Same refusal shape either way — a caller
  // cannot tell this screen apart from the client-transcript one.
  //
  // The rolling SUMMARY is deliberately NOT screened here (architect-
  // directed redesign, HUMAN-ACTIONS.md #15 round 4) — round 3's role-blind
  // `screenInput` over the folded summary text is replaced by per-turn,
  // role-aware screening at FOLD TIME (`clown-memory.ts`'s
  // `maintainRollingSummary`), which drops a bad turn from what gets folded
  // in the first place rather than re-screening the already-folded text
  // here. The summary itself reaches the model demoted into the first user
  // message, wrapped in `<conversation_memory>` tags (`clown-agent.ts`) —
  // never promoted into a system block.
  if (loadedHistory) {
    const historyHit = screenConversation(loadedHistory.turns);
    if (historyHit) {
      clearTimeout(deadlineTimer);
      console.log('clown:refusal', JSON.stringify({ gate: 'history', category: historyHit }));
      return NextResponse.json(messageAnswer([refusal(historyHit).message]), sessionHeaders ? { headers: sessionHeaders } : undefined);
    }
  }

  // AGENT LOOP — streamed. `scope.result` (the search that just proved this
  // question is in scope) is reused as the loop's free seed context rather
  // than spending one of its own bounded tool calls repeating it.
  const effectiveTurns = priorTurns.length > 0 ? priorTurns : (loadedHistory?.turns ?? []);
  const transcript: ClownTurn[] = [...effectiveTurns, { role: 'user', text }];

  return ndjsonResponse(async (emit) => {
    try {
      const run = await runClownAgent(
        clownUsage,
        transcript,
        scope.result,
        { query: text },
        (step) => emit({ type: 'investigation', step }),
        undefined,
        deadlineController.signal,
        loadedHistory?.summary || undefined,
        reserveUserBudget,
      );

      if (run.overUserCap) {
        emit({ type: 'answer', answer: messageAnswer(["That's today's clowning limit for you — come back tomorrow for more."]) });
        return;
      }

      if (run.take) {
        // OUTPUT GATE — discard the model answer on any redline, fabricated
        // citation, or blank required prose; never return ungated model
        // prose.
        const pooledItems = [...run.pool.values()];
        const rejection = screenClownTake(run.take, pooledItems);
        if (!rejection) {
          const sources = run.take.citedIds
            .map((id) => run.pool.get(id))
            .filter((item): item is RetrievedItem => item !== undefined);
          // The canonical registry (clown-names.ts) beats whatever the model
          // coined — deterministic reuse, no cross-session storage needed. Fed
          // the receipts the take actually stands on (the validated cited
          // sources above), not the wider retrieved set, matching the
          // resolver's own "the receipts an answer stands on decide its name"
          // contract. Falls through to the model's own proposal, or null,
          // when nothing canonical matches — never invented, never a default.
          const resolvedName = resolveTheoryName(text, sources, run.take.theoryName);
          const finalTake = { ...run.take, theoryName: resolvedName?.name ?? null };
          const answer = answerFromTake(finalTake, sources, run.investigation);
          emit({ type: 'answer', answer });
          const persistenceResults = await Promise.allSettled([
            persistPrediction({ session: memorySession, question: text, take: finalTake, sources }),
            recordClownMemory({
              session: memorySession,
              question: text,
              answerText: `${finalTake.stance} ${finalTake.argument}`.trim(),
            }),
          ]);
          for (const [index, result] of persistenceResults.entries()) {
            if (result.status === 'rejected') {
              console.log(
                'clown:persistence-failed',
                JSON.stringify({
                  target: index === 0 ? 'prediction' : 'memory',
                  message: result.reason instanceof Error ? result.reason.message : 'unknown',
                }),
              );
            }
          }
          return;
        }
        console.log('clown:gate-reject', JSON.stringify({ kind: rejection.kind }));
      }

      // DEGRADE — no key, kill switch, over the global cap, timeout, every
      // attempt failed, or the take failed the output gate (the caller's own
      // per-user cap is handled separately above, before this point). Never
      // an apology; the fallback is the primary design here. Composed from
      // every citable doc the loop actually surfaced (the pool), not just
      // the seed — a run that investigated deeply before degrading still
      // hands back what it found, capped to a small presentable number
      // (Codex review MAJOR 10) rather than dumping the entire accumulated
      // pool.
      const pooledItems = [...run.pool.values()];
      const fallbackItems = pooledItems.slice(0, DEGRADED_ITEM_CAP);
      emit({
        type: 'answer',
        answer: answerFromFallback(composeFallback(fallbackItems, 'degraded', pooledItems.length)),
      });
    } finally {
      clearTimeout(deadlineTimer);
    }
  }, sessionHeaders);
}
