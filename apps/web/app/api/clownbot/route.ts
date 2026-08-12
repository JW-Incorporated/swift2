import { NextResponse } from 'next/server';

import { findReceipts, receiptById, type Receipt } from '../../../lib/longlive/clownbot-receipts';
import { askClownbot, type ClownTake } from '../../../lib/longlive/clownbot-client';
import { clownbotUsage } from '../../../lib/longlive/clownbot-usage';
import { gradeTheory } from '../../../lib/longlive/clownbot-grade';
import { resolveTheoryName } from '../../../lib/longlive/clownbot-names';
import {
  EMPTY_RECEIPTS_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  refusal,
  screenInput,
  screenOutput,
} from '../../../lib/longlive/clownbot-safety';
import { classifyOutput, UNCERTAIN } from '../../../lib/longlive/clownbot-output-classifier';
import {
  DEGRADED_ASIDE,
  DEGRADED_COUNTERPOINT,
  DEGRADED_STANCE,
} from '../../../lib/longlive/clownbot-persona';

// Clownbot — the API route. Spec in the PR body; persona in
// clownbot-persona.ts; boundaries in clownbot-safety.ts.
//
// THE PIPELINE, and the order is the safety design:
//
//   parse → honeypot → rate-limit → INPUT SCREEN (deterministic, pre-spend)
//     → deterministic receipt retrieval → model (if key + budget)
//     → OUTPUT SCREEN (deterministic) → receipt-id validation
//     → deterministic grading → response
//
// The model sits in the middle of a deterministic sandwich. It never searches
// the vault, so it cannot invent a receipt; it never gates a boundary, so a
// jailbroken persona prompt does not open one; and it never scores its own
// evidence or confidence, so it cannot manufacture certainty.
//
// The reader's words are NEVER written down. Only derived values — the
// refusal category, the receipt ids, the two axis scores — are ever logged.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 600;

// Best-effort per-instance per-IP limit, same shape and same honest caveat as
// the mood and feedback routes: this blunts bursts on a warm instance rather
// than being a hard security control. The daily cap is the spend ceiling.
const HITS = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 12;

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

/** Only receipts we actually supplied may be cited. Anything else is dropped. */
function validateCited(take: ClownTake, supplied: readonly Receipt[]): Receipt[] {
  const allowed = new Set(supplied.map((r) => r.id));
  const seen = new Set<string>();
  const out: Receipt[] = [];
  for (const id of take.receiptIds) {
    if (!allowed.has(id) || seen.has(id)) continue;
    const receipt = receiptById(id);
    if (!receipt) continue;
    seen.add(id);
    out.push(receipt);
  }
  return out;
}

/** The free, model-free answer. Real receipts, real grade, no voice. */
function degradedTake(receipts: readonly Receipt[]): ClownTake {
  return {
    stance: DEGRADED_STANCE,
    argument: receipts
      .slice(0, 3)
      .map((r) => `${r.title} (${r.dateLabel})`)
      .join(' · '),
    counterpoint: DEGRADED_COUNTERPOINT,
    receiptIds: receipts.map((r) => r.id),
    delulu: 1,
    theoryName: null,
    aside: DEGRADED_ASIDE,
    offLimits: false,
  };
}

type Source = 'model' | 'degraded';

export async function POST(req: Request): Promise<Response> {
  let payload: { text?: string; hp?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Pretend success, do nothing, spend nothing.
  if (payload.hp) {
    return NextResponse.json({ kind: 'refusal', message: OUT_OF_SCOPE_MESSAGE, source: 'degraded' });
  }

  const text = (typeof payload.text === 'string' ? payload.text : '').slice(0, MAX_TEXT).trim();
  if (!text) {
    return NextResponse.json({ error: 'Give me something to work with.' }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'One ring at a time — give it a moment and try again.' },
      { status: 429 },
    );
  }

  // GATE 1 — deterministic input screen, BEFORE any spend. A hit costs nothing
  // and works with no API key, over the cap, or with the model down. Log the
  // category only; never the words that triggered it.
  const inputHit = screenInput(text);
  if (inputHit) {
    console.log('clownbot:refusal', JSON.stringify({ gate: 'input', category: inputHit }));
    const { message } = refusal(inputHit);
    return NextResponse.json({ kind: 'refusal', message, category: inputHit, source: 'safety' });
  }

  // Deterministic retrieval. The model never searches the vault.
  const supplied = findReceipts(text);

  const take = await askClownbot(clownbotUsage, text, supplied);
  let source: Source = take ? 'model' : 'degraded';

  let effective: ClownTake;

  if (take) {
    const parts = [take.stance, take.argument, take.counterpoint, take.aside, take.theoryName ?? undefined];

    // GATE 2, TIER A — deterministic output screen over everything the model
    // wrote. The fast, free, keyless pre-filter: catches persona drift and
    // volunteered redline material that carries a trigger token. A hit discards
    // the whole answer; we do not try to repair it.
    const outputHit = screenOutput(parts);
    if (outputHit) {
      console.log('clownbot:refusal', JSON.stringify({ gate: 'output', category: outputHit }));
      const { message } = refusal(outputHit);
      return NextResponse.json({ kind: 'refusal', message, category: outputHit, source: 'safety' });
    }

    // GATE 2, TIER B — the SEMANTIC classifier. Runs only on drafts that already
    // cleared Tier A, so it screens the token-free paraphrases (first-person-as-
    // Taylor prose with no trigger word) that a keyword gate structurally cannot
    // enumerate. It FAILS CLOSED: a UNCERTAIN verdict (error/timeout/junk)
    // discards the draft and drops to the deterministic receipts-only answer,
    // never ships the unscreened draft. A confident redline refuses in-voice.
    const verdict = await classifyOutput(parts);
    if (verdict !== 'none' && verdict !== UNCERTAIN) {
      console.log('clownbot:refusal', JSON.stringify({ gate: 'classifier', category: verdict }));
      const { message } = refusal(verdict);
      return NextResponse.json({ kind: 'refusal', message, category: verdict, source: 'safety' });
    }
    if (verdict === UNCERTAIN) {
      // Safety check failed (not that the draft was clean) — discard the model
      // output and answer from the vault deterministically. Never leak.
      console.log('clownbot:degrade', JSON.stringify({ gate: 'classifier', reason: 'uncertain' }));
      effective = degradedTake(supplied);
      source = 'degraded';
    } else if (take.offLimits) {
      // Defense in depth behind both gates — the model's own read.
      console.log('clownbot:refusal', JSON.stringify({ gate: 'model', category: null }));
      return NextResponse.json({ kind: 'refusal', message: OUT_OF_SCOPE_MESSAGE, source: 'model' });
    } else {
      effective = take;
    }
  } else {
    effective = degradedTake(supplied);
  }

  // Only receipts we handed over may be cited — this is what makes fabricated
  // evidence structurally impossible rather than merely discouraged. When the
  // model draft was discarded (Tier B UNCERTAIN), we are on the deterministic
  // path and cite the supplied set, exactly as the keyless degraded path does.
  const usedModel = source === 'model';
  const cited = usedModel && take ? validateCited(take, supplied) : supplied;

  if (cited.length === 0 && supplied.length === 0) {
    return NextResponse.json({ kind: 'empty', message: EMPTY_RECEIPTS_MESSAGE, source });
  }

  const grade = gradeTheory(cited, effective.delulu);
  const named = resolveTheoryName(text, cited, effective.theoryName);

  console.log(
    'clownbot:take',
    JSON.stringify({
      source,
      receipts: cited.map((r) => r.id),
      evidence: grade.evidence,
      delulu: grade.delulu,
      confidence: grade.confidence,
      canonicalName: named?.canonical ?? false,
    }),
  );

  return NextResponse.json({
    kind: 'take',
    source,
    degraded: !usedModel,
    theoryName: named?.name ?? null,
    stance: effective.stance,
    argument: effective.argument,
    counterpoint: effective.counterpoint,
    aside: effective.aside,
    grade,
    receipts: cited.map((r) => ({
      id: r.id,
      title: r.title,
      dateLabel: r.dateLabel,
      detail: r.detail,
      status: r.status,
      sources: r.sources,
    })),
  });
}
