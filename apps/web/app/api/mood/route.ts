import { NextResponse } from 'next/server';

import { MOOD_AXES, type MoodAxis } from '@swift2/experience';
import { matchMoods, type MoodMatch, type MoodQuery } from '../../../lib/longlive/mood-match';
import { keywordQuery, isEmptyQuery, hasSignal, hasBereavementSignal } from '../../../lib/longlive/mood-keywords';
import { classifyMood } from '../../../lib/longlive/mood-client';
import { moodUsage } from '../../../lib/longlive/mood-usage';
import {
  CRISIS_MESSAGE,
  CRISIS_MESSAGE_ABUSE,
  HEAVY_INTRO,
  REFUSAL_MESSAGE,
  UNCLEAR_MESSAGE,
  assessCrisis,
} from '../../../lib/longlive/mood-safety';
import { trustedClientIp } from '../../../lib/longlive/client-ip';
import { makeRateLimiter, isHoneypotTripped } from '../../../lib/longlive/rate-limit';

// Mood Chat — Stage 4: the API route. See docs/proposals/2026-07-19-mood-chat.md
// and docs/content-ops/mood-chat-safety-language.md.
//
// The reader's words go through a fixed, safety-first pipeline:
//   rate-limit → CRISIS CHECK (deterministic, before any spend) → classify
//   (model if a key + budget exist, else the free keyword matcher) → pure
//   deterministic match → picks.
//
// The model never touches the catalogue, so it cannot invent a song; the crisis
// path never touches the model, so it works when the classifier is down; and
// the raw text is NEVER written down — only the derived mood vector + the song
// slugs we returned are ever logged (safety doc Block 5). We cannot leak what we
// never wrote down.
//
// A dynamic Vercel serverless function, like the feedback route — not a static
// vault route.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT = 1000; // a feeling, not an essay
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 8;

// Best-effort per-instance per-IP rate limit — a public LLM endpoint without one
// is a billing incident waiting to happen (spec Stage 4). Serverless instances
// are ephemeral, so this blunts bursts on a warm instance rather than being a
// hard security control; the daily call cap (mood-usage) is the spend ceiling.
const limiter = makeRateLimiter({ windowMs: 60_000, max: 15 });

function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
}

// See lib/longlive/client-ip.ts's trustedClientIp for the #1973 rationale —
// this route was migrated to it 2026-09-02 (security audit follow-up
// t_07025f1e), replacing the spoofable-leftmost-XFF lookup that used to live
// here directly.
function clientIp(req: Request): string {
  return trustedClientIp(req);
}

function unit(n: unknown): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v)) return undefined;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Build a validated MoodQuery from a client-supplied vector (the chip path). */
function queryFromVector(body: {
  moods?: Record<string, unknown>;
  energy?: unknown;
  valence?: unknown;
}): MoodQuery {
  const moods: Partial<Record<MoodAxis, number>> = {};
  const raw = body.moods ?? {};
  for (const axis of MOOD_AXES) {
    const v = unit((raw as Record<string, unknown>)[axis]);
    if (v !== undefined) moods[axis] = v;
  }
  const query: MoodQuery = { moods };
  const energy = unit(body.energy);
  const valence = unit(body.valence);
  if (energy !== undefined) query.energy = energy;
  if (valence !== undefined) query.valence = valence;
  return query;
}

/**
 * Heavy-but-not-crisis: genuine sadness/heartbreak/loneliness — the normal
 * heavy stuff this feature exists for. Gets Block 2's one added line, never a
 * resources dump (that would pathologize ordinary sadness). Distinct from
 * crisis, which is real risk and handled far upstream.
 */
function isHeavy(query: MoodQuery): boolean {
  const m = query.moods;
  const heavyAxis = (m.heartbreak ?? 0) >= 0.5 || (m.longing ?? 0) >= 0.5;
  // "Not mostly happy": joy isn't dominant, and valence — when the reader/model
  // supplied it — sits on the sad side. An UNSET valence doesn't veto the intro
  // (the model often asserts heartbreak without a valence number), so genuine
  // heartbreak still earns Block 2's line.
  const notMostlyHappy = (m.joy ?? 0) < 0.4 && (query.valence === undefined || query.valence <= 0.45);
  // #2000 — the "sitting with something heavy?" intro was showing on FUN chips.
  // The intro is about the slow songs that SIT WITH you, so two moods that trip
  // the heavy-axis test but aren't that intro are excluded: an energetic mood
  // ("feral about a bridge", energy ≥ 0.6) is cathartic-fun, not heavy; and a
  // calm/nostalgia-led mood ("cardigan weather") is cozy/wistful, not heavy.
  const energetic = (query.energy ?? 0) >= 0.6;
  const soothingLed = (m.calm ?? 0) >= 0.6 || (m.nostalgia ?? 0) >= 0.75;
  return heavyAxis && notMostlyHappy && !energetic && !soothingLed;
}

/** The mood vector we DO log (safety doc Block 5) — derived numbers, never text. */
function loggableVector(query: MoodQuery): Record<string, number> {
  const out: Record<string, number> = { ...query.moods };
  if (query.energy !== undefined) out.energy = query.energy;
  if (query.valence !== undefined) out.valence = query.valence;
  return out;
}

type Source = 'chip' | 'model' | 'keyword';

function matchesResponse(query: MoodQuery, picks: MoodMatch[], source: Source, degraded: boolean) {
  // Log ONLY the derived vector + returned slugs. Never the reader's words.
  console.log(
    'mood:match',
    JSON.stringify({ source, degraded, vector: loggableVector(query), picks: picks.map((p) => p.slug) }),
  );
  return NextResponse.json({
    kind: 'matches' as const,
    picks,
    intro: isHeavy(query) ? HEAVY_INTRO : undefined,
    source,
    degraded,
  });
}

export async function POST(req: Request): Promise<Response> {
  let payload: {
    text?: string;
    moods?: Record<string, unknown>;
    energy?: unknown;
    valence?: unknown;
    limit?: unknown;
    hp?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Pretend success, do nothing.
  if (isHoneypotTripped(payload.hp)) return NextResponse.json({ kind: 'matches', picks: [], source: 'chip' }, { status: 200 });

  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.round(Number(payload.limit) || DEFAULT_LIMIT)));

  // Chip path: a hand-tuned vector from a starter chip. Zero cost, no model, no
  // crisis check (curated input) — the demo path must be deterministic and free
  // (safety doc Block 3 implementation note).
  if (payload.moods && typeof payload.moods === 'object') {
    const query = queryFromVector(payload);
    if (isEmptyQuery(query)) {
      return NextResponse.json({ error: 'No mood axes supplied.' }, { status: 400 });
    }
    return matchesResponse(query, matchMoods(query, { limit }), 'chip', false);
  }

  // Free-text path.
  const text = (typeof payload.text === 'string' ? payload.text : '').slice(0, MAX_TEXT).trim();
  if (!text) {
    return NextResponse.json({ error: 'Tell me how you’re feeling.' }, { status: 400 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'One thing at a time — give it a moment and try again.' },
      { status: 429 },
    );
  }

  // CRISIS CHECK FIRST — deterministic, before any spend or matching. A song is
  // the wrong answer to "I want to die": return the resources block and NO
  // songs. Do NOT log the text (not even that a crisis fired against it). When
  // the disclosure is abuse (another person hurting the reader), lead with the
  // DV hotline instead of the suicide line (#1979).
  const crisis = assessCrisis(text);
  if (crisis.crisis) {
    return NextResponse.json({
      kind: 'crisis' as const,
      message: crisis.abuse ? CRISIS_MESSAGE_ABUSE : CRISIS_MESSAGE,
      source: 'crisis',
    });
  }

  // Classify. Model when a key + budget exist; otherwise the free keyword
  // matcher — either way the endpoint returns real songs (never 500 on no key).
  const classified = await classifyMood(moodUsage, text);
  const query: MoodQuery = classified ? classified.query : keywordQuery(text);
  const source: Source = classified ? 'model' : 'keyword';
  const degraded = classified === null;

  // #1984 — gate the grief canon on an explicit bereavement signal in the raw
  // text, for BOTH paths (the model doesn't know about this flag; keywordQuery
  // already sets it, and re-asserting is idempotent). Runs strictly AFTER the
  // crisis check above, so it can never re-open a crisis bypass. Without a signal
  // the flag stays unset and the matcher excludes the bereavement songs, so
  // "I feel numb" / "stressed about work" can never surface a song about a death.
  if (hasBereavementSignal(text)) query.bereavement = true;

  // Defense in depth: the model can catch crisis phrasings the keyword list
  // misses. If it flags one, honor Block 1 and return no songs.
  if (classified?.crisis) {
    return NextResponse.json({ kind: 'crisis' as const, message: CRISIS_MESSAGE, source: 'crisis' });
  }

  // Out of scope → Block 6. ONLY the model's out_of_scope flag reaches here:
  // the approved trigger for Block 6 is "medical, legal or relationship advice,
  // or general-chatbot use" (safety doc), and nothing else.
  if (classified?.outOfScope) {
    console.log('mood:refusal', JSON.stringify({ source, degraded, vector: loggableVector(query) }));
    return NextResponse.json({ kind: 'refusal' as const, message: REFUSAL_MESSAGE, source });
  }

  // Nothing to match on. THIS IS NOT A REFUSAL — it means our reading failed,
  // not that the reader asked for something we don't do.
  //
  // The old code was `if (classified?.outOfScope || picks.length === 0)`, and
  // that `||` is the bug the founder hit. On the degraded path (no
  // ANTHROPIC_API_KEY — the documented normal local/preview state) every
  // message the hand-built keyword lexicon didn't recognise came back as
  // "that's outside what I can help with". "I'm grumpy and everything is
  // pissing me off" produced an empty vector, so did "I'm sad", and both got
  // told their feeling was out of scope. Ordinary negative emotion is the
  // product; it must never route here.
  const picks = hasSignal(query) ? matchMoods(query, { limit }) : [];
  if (picks.length === 0) {
    console.log('mood:unclear', JSON.stringify({ source, degraded, vector: loggableVector(query) }));
    return NextResponse.json({ kind: 'unclear' as const, message: UNCLEAR_MESSAGE, source });
  }

  return matchesResponse(query, picks, source, degraded);
}
