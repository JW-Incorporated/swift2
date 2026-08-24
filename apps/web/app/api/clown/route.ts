import { NextResponse } from 'next/server';

import { allClownDocs } from '../../../lib/longlive/clown-index';
import { retrieveClownDocs } from '../../../lib/longlive/clown-retrieve';
import { crisisCheck, refusal, screenConversation, screenInput, OUT_OF_SCOPE_MESSAGE } from '../../../lib/longlive/clown-safety';
import { MAX_TRANSCRIPT_TURNS, type ClownTurn } from '../../../lib/longlive/clown-client';
import { clownUsage } from '../../../lib/longlive/clown-usage';
import { screenClownTake } from '../../../lib/longlive/clown-gate';
import { resolveTheoryName } from '../../../lib/longlive/clown-names';
import { composeFallback, docToRetrievedItem, type RetrievedItem } from '../../../lib/longlive/clown-fallback';
import { answerFromFallback, answerFromTake, type ClownAnswer, type InvestigationStep } from '../../../lib/longlive/clown-answer';
import { resolveScopeSignal } from '../../../lib/longlive/clown-agent-tools';
import { AGENT_MAX_WALL_MS, runClownAgent } from '../../../lib/longlive/clown-agent';
import { persistPrediction } from '../../../lib/longlive/clown-predictions';

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
// reads the API key, then the kill switch, then reserves budget, in that
// order, and degrades (a null `take`) for every degraded state (no key,
// kill switch on, over cap, timeout, or every attempt failing). This route
// does not duplicate that check.
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
// THE SERVER STORES NOTHING beyond the one best-effort `bot_prediction`
// write attempt (PLAN.md Stage 10 req 1; the table is Stage 11's, may not
// exist yet, and the write degrades silently either way — see
// `clown-predictions.ts`). No message content is otherwise logged — only
// category names on a refusal/rejection, matching the pattern already used
// elsewhere in this app (mood-chat's route). The client holds the
// transcript (~`MAX_TRANSCRIPT_TURNS` messages) and resends it every call;
// this route reads it, forgets it.
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

const MAX_TEXT = 600; // a question, not an essay — well above the composer's 300-char UI cap

// A degraded loop can accumulate hundreds of rows across its investigation
// (Codex review MAJOR 10) — cap what actually gets composed into the
// fallback response to a small, presentable number; `composeFallback`'s
// `totalAvailable` note tells the reader honestly that more was found.
const DEGRADED_ITEM_CAP = 8;

// Best-effort per-instance per-IP rate limit — same style as
// apps/web/app/api/mood/route.ts. Serverless instances are ephemeral, so
// this blunts bursts on a warm instance; the daily compose cap
// (clown-usage.ts) is the real spend ceiling.
const HITS = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 15;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > RATE_MAX_PER_WINDOW;
}

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

interface RawTurn {
  role?: unknown;
  text?: unknown;
}

/** Validate the client-held transcript. Leaves room for the current turn,
 * which this route appends itself — see `POST` below. */
function sanitizeTranscript(raw: unknown): ClownTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ClownTurn[] = [];
  for (const entry of raw as RawTurn[]) {
    if (!entry || typeof entry !== 'object') continue;
    const { role, text } = entry;
    if ((role === 'user' || role === 'assistant') && typeof text === 'string' && text.trim()) {
      out.push({ role, text: text.slice(0, MAX_TEXT) });
    }
  }
  return out.slice(-(MAX_TRANSCRIPT_TURNS - 1));
}

/** The crisis, blocklist-refusal, and out-of-scope shapes — fixed copy, no
 * sources, no delulu score (nothing scored them; nothing ran), no
 * investigation trail (nothing investigated). */
function messageAnswer(lines: readonly string[]): ClownAnswer {
  return {
    kind: 'fallback',
    theoryName: null,
    segments: lines.map((text) => ({ role: 'plain' as const, text })),
    delulu: null,
    sources: [],
    investigation: [],
  };
}

type ClownStreamEvent = { type: 'investigation'; step: InvestigationStep } | { type: 'answer'; answer: ClownAnswer };

/** Newline-delimited JSON stream — one `ClownStreamEvent` per line. Chosen
 * over SSE (`text/event-stream`) because this app has no existing SSE
 * client/parsing precedent to match and NDJSON needs no framing beyond a
 * newline; the client reads the body with `getReader()` and splits on `\n`.
 * A single-event stream (every non-loop path, unused here — see the header
 * note above) still parses fine under a plain `res.json()`, since
 * `JSON.parse` tolerates trailing whitespace, but those paths don't use
 * this helper at all; only the loop path does. */
function ndjsonResponse(run: (emit: (event: ClownStreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ClownStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await run(emit);
      } catch (err) {
        console.log(
          'clown:stream-error',
          JSON.stringify({ message: err instanceof Error ? err.message : 'unknown' }),
        );
        emit({ type: 'answer', answer: answerFromFallback(composeFallback([], 'degraded')) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } });
}

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

  // AGENT LOOP — streamed. `scope.result` (the search that just proved this
  // question is in scope) is reused as the loop's free seed context rather
  // than spending one of its own bounded tool calls repeating it.
  const transcript: ClownTurn[] = [...priorTurns, { role: 'user', text }];

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
      );

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
          // Best-effort — never awaited into the response path; see
          // clown-predictions.ts for exactly what "best-effort" degrades to.
          void persistPrediction({ question: text, take: finalTake, sources }).catch(() => {});
          emit({ type: 'answer', answer });
          return;
        }
        console.log('clown:gate-reject', JSON.stringify({ kind: rejection.kind }));
      }

      // DEGRADE — no key, kill switch, over cap, timeout, every attempt
      // failed, or the take failed the output gate. Never an apology; the
      // fallback is the primary design here. Composed from every citable doc
      // the loop actually surfaced (the pool), not just the seed — a run
      // that investigated deeply before degrading still hands back what it
      // found, capped to a small presentable number (Codex review MAJOR 10)
      // rather than dumping the entire accumulated pool.
      const pooledItems = [...run.pool.values()];
      const fallbackItems = pooledItems.slice(0, DEGRADED_ITEM_CAP);
      emit({
        type: 'answer',
        answer: answerFromFallback(composeFallback(fallbackItems, 'degraded', pooledItems.length)),
      });
    } finally {
      clearTimeout(deadlineTimer);
    }
  });
}
