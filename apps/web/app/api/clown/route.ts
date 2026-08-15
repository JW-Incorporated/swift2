import { NextResponse } from 'next/server';

import { allClownDocs } from '../../../lib/longlive/clown-index';
import { retrieveClownDocs } from '../../../lib/longlive/clown-retrieve';
import { crisisCheck, refusal, screenConversation, screenInput } from '../../../lib/longlive/clown-safety';
import { askClown, MAX_TRANSCRIPT_TURNS, type ClownTurn } from '../../../lib/longlive/clown-client';
import { clownUsage } from '../../../lib/longlive/clown-usage';
import { screenClownTake } from '../../../lib/longlive/clown-gate';
import { resolveTheoryName } from '../../../lib/longlive/clown-names';
import { composeFallback, docToRetrievedItem, type RetrievedItem } from '../../../lib/longlive/clown-fallback';
import { answerFromFallback, answerFromTake, type ClownAnswer } from '../../../lib/longlive/clown-answer';

// Clownbot (build B) — the API route. PLAN.md Step 8.
//
// STAGE ORDER, non-negotiable:
//   rate-limit → kill switch → crisis check → input blocklist →
//   prior-turn blocklist → retrieval → compose-or-fallback → output gate
//
// The kill switch (`CLOWN_MODEL_DISABLED`) is checked BEFORE usage is
// reserved, but that check lives entirely inside `askClown()`
// (clown-client.ts) — it reads the API key, then the kill switch, then
// reserves budget, in that order, and returns null for every degraded
// state (no key, kill switch on, over cap, timeout). This route does not
// duplicate that check: calling `askClown` at the compose-or-fallback stage
// already satisfies "checked before reserving usage" and folds the kill
// switch into the same null-means-degrade contract as every other model
// failure. Duplicating it here would mean re-reading a private, unexported
// env-var name from a second place.
//
// CRISIS is a THIRD PRODUCER of `ClownAnswer` (clown-answer.ts's header says
// "three producers converge here" but only names two — the model take and
// the zero-model fallback; this route is the crisis path's producer). It is
// built directly, not through either adapter, because it must be the
// verbatim `CRISIS_MESSAGE` alone: no retrieval, no model, no source cards,
// no clown persona wrapped around it. The blocklist refusal is the same
// shape for the same reason — fixed, in-character copy with nothing else
// attached.
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
// every prior turn, before `askClown` is ever called — same refusal shape as
// a blocked current turn, so a caller cannot tell the two stages apart.
//
// THE SERVER STORES NOTHING. No DB, no cache, no logging of message
// content — only category names on a refusal, matching the pattern already
// used elsewhere in this app (mood-chat's route). The client holds the
// transcript (~`MAX_TRANSCRIPT_TURNS` messages) and resends it every call;
// this route reads it, forgets it.
//
// Honeypot note: build A's `clownbot/route.ts` carried a `hp` honeypot
// field. That file is already deleted (a parallel step landed first), so
// there is nothing left on disk to port verbatim from — per the step brief,
// this is skipped rather than reinvented.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 600; // a question, not an essay — well above the composer's 300-char UI cap

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

/** The crisis and blocklist-refusal shapes — fixed copy, no sources, no
 * delulu score (nothing scored them; nothing ran). */
function messageAnswer(lines: readonly string[]): ClownAnswer {
  return {
    kind: 'fallback',
    theoryName: null,
    segments: lines.map((text) => ({ role: 'plain' as const, text })),
    delulu: null,
    sources: [],
  };
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

  // RETRIEVAL — deterministic, before any model call. The model never
  // searches the corpus; it only sees what this hands it.
  const docs = retrieveClownDocs(text, allClownDocs());
  const items = docs.map(docToRetrievedItem);

  // CHIP TAPS — the request marks itself as originating from a prefill
  // column. Those resolve here and MUST NOT reach the model; that is what
  // keeps both board columns free.
  if (payload.chip === true) {
    return NextResponse.json(answerFromFallback(composeFallback(items, 'chip')));
  }

  // COMPOSE-OR-FALLBACK — try the model.
  const transcript: ClownTurn[] = [...priorTurns, { role: 'user', text }];
  const take = await askClown(clownUsage, transcript, docs);

  if (take) {
    // OUTPUT GATE — discard the model answer on any redline or fabricated
    // citation; never return ungated model prose.
    const rejection = screenClownTake(take, docs);
    if (!rejection) {
      const sources = take.citedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is RetrievedItem => item !== undefined);
      // The canonical registry (clown-names.ts) beats whatever the model
      // coined — deterministic reuse, no cross-session storage needed. Fed
      // the receipts the take actually stands on (the validated cited
      // sources above), not the wider retrieved set, matching the
      // resolver's own "the receipts an answer stands on decide its name"
      // contract. Falls through to the model's own proposal, or null,
      // when nothing canonical matches — never invented, never a default.
      const resolvedName = resolveTheoryName(text, sources, take.theoryName);
      return NextResponse.json(
        answerFromTake({ ...take, theoryName: resolvedName?.name ?? null }, sources),
      );
    }
    console.log('clown:gate-reject', JSON.stringify({ kind: rejection.kind }));
  }

  // DEGRADE — no key, kill switch, over cap, timeout, or the take failed the
  // output gate. Never an apology; the fallback is the primary design here.
  return NextResponse.json(answerFromFallback(composeFallback(items, 'degraded')));
}
