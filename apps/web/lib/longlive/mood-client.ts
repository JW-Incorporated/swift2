/**
 * Mood Chat — Stage 4: the classify client. THE ONE MODULE THAT SPENDS MONEY.
 *
 * Mirrors the worker's openai-client discipline (docs/decisions.md 2026-07-18)
 * and the spec's Stage 4 rules: every dollar the feature can spend leaves the
 * building through this function and nowhere else. It does ONE small bounded
 * job — turn a reader's words into a mood vector (+ crisis / out-of-scope
 * flags) — and it NEVER searches the catalogue: matching is pure TypeScript
 * downstream, so the model structurally cannot invent a song.
 *
 * Guarantees, each one load-bearing:
 *  - Returns null (never throws) for the expected degraded states — no key,
 *    cap reached, two failed attempts — so the caller falls back to the free
 *    keyword matcher and still returns real songs.
 *  - Reserves budget via the usage cap BEFORE the network call.
 *  - Structured output via a forced tool call — the model must answer in the
 *    schema, and we still clamp/validate every field before trusting it.
 *  - Stable system prompt sent as a cache_control prefix (cheap on repeat),
 *    volatile user text after it.
 *  - One retry, then fall back. A raw model error never reaches the reader.
 *  - Never logs the reader's text. This module receives it and forgets it; only
 *    the derived vector is ever observable (and only the route logs that).
 *
 * Model: claude-haiku-5-5 through the shared subscription wrapper. Haiku is
 * sufficient for this bounded classifier; unavailable calls use keywords.
 */

import { MOOD_AXES, type MoodAxis, type MoodQuery } from '@swift2/experience';
import { MOOD_DAILY_CAP, MOOD_GLOBAL_SCOPE, type MoodUsage } from './mood-usage';
import { MOOD_SYSTEM_PROMPT } from './mood-prompt';
import { reserveGlobalUsage } from './usage-db-gate';
import { callClaude } from '../../../../scripts/lib/claude-call.mjs';

const MODEL = 'claude-haiku-5-5';
const PRIORITY = 'P2';

/** Kill switch, an env flag — parity with Clownbot's `CLOWN_MODEL_DISABLED`
 * (`clown-client.ts`). Neither feature had a dedicated standing switch of
 * its own before Clownbot's; Mood Chat previously only ever degraded on a
 * missing key or an exhausted cap. An operator can now force Mood Chat's
 * degraded (keyword-matcher) path without touching the key or the cap.
 * Checked BEFORE `reserveGlobalUsage()` so flipping it costs nothing — same
 * ordering `clownModelKey()` uses. */
const MOOD_MODEL_DISABLED_ENV = 'MOOD_MODEL_DISABLED';

/**
 * Thinking OFF, explicitly.
 *
 * On claude-sonnet-5 adaptive thinking is ON when the field is omitted (it was
 * OFF on sonnet-4.6, which is what this file was written against). `max_tokens`
 * caps thinking AND the tool call together, so at the old 400 the model could
 * spend the budget thinking and get truncated before emitting record_mood —
 * `attempt()` then throws 'no tool_use block', retries, throws again, and
 * classifyMood returns null. The route falls back to the keyword matcher, which
 * is the degraded path the founder's bug lives on. Reading eight mood axes off
 * one sentence does not need a reasoning budget; this keeps the call cheap,
 * fast, and structurally unable to truncate. `max_tokens` is raised anyway as
 * belt and braces.
 */
/** What the classifier derives from a reader's words — never raw text downstream. */
export interface Classification {
  query: MoodQuery;
  /** The model's own crisis read — defense in depth behind the deterministic check. */
  crisis: boolean;
  /** Medical/legal/relationship advice or general-chatbot use — routes to Block 6. */
  outOfScope: boolean;
}

/** The forced tool — the model must answer in this shape. */
const MOOD_TOOL = {
  name: 'record_mood',
  description: 'Record the mood reading for one message.',
  input_schema: {
    type: 'object',
    properties: {
      moods: {
        type: 'object',
        description: 'Only the axes the message actually evokes, each 0..1. Omit axes that are not present.',
        properties: Object.fromEntries(
          MOOD_AXES.map((axis) => [axis, { type: 'number', minimum: 0, maximum: 1 }]),
        ),
        additionalProperties: false,
      },
      energy: { type: 'number', minimum: 0, maximum: 1 },
      valence: { type: 'number', minimum: 0, maximum: 1 },
      crisis: { type: 'boolean' },
      out_of_scope: { type: 'boolean' },
    },
    required: ['moods'],
    additionalProperties: false,
  },
} as const;

/** Clamp any candidate to the 0..1 unit range, or undefined if not a usable number. */
function unitOrUndef(n: unknown): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v)) return undefined;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Never trust the model's shape blindly — validate/clamp into a Classification. */
export function sanitizeClassification(input: unknown): Classification {
  const p = (input ?? {}) as Record<string, unknown>;
  const rawMoods = (p.moods ?? {}) as Record<string, unknown>;
  const moods: Partial<Record<MoodAxis, number>> = {};
  for (const axis of MOOD_AXES) {
    const v = unitOrUndef(rawMoods[axis]);
    if (v !== undefined) moods[axis] = v;
  }
  const query: MoodQuery = { moods };
  const energy = unitOrUndef(p.energy);
  const valence = unitOrUndef(p.valence);
  if (energy !== undefined) query.energy = energy;
  if (valence !== undefined) query.valence = valence;
  return {
    query,
    crisis: p.crisis === true,
    outOfScope: p.out_of_scope === true,
  };
}

/** One network attempt. Throws on any non-2xx / malformed / missing-tool result. */
async function attempt(text: string, callClaudeImpl: typeof callClaude): Promise<Classification> {
  const outcome = await callClaudeImpl({
    caller: 'mood-client',
    priority: PRIORITY,
    model: MODEL,
    system: MOOD_SYSTEM_PROMPT,
    user: text,
    schema: MOOD_TOOL.input_schema,
    maxInputTokens: 4_000,
    maxCalls: MOOD_DAILY_CAP * 2,
  });
  if (outcome.status !== 'ok') throw new Error(outcome.reason ?? outcome.status);
  return sanitizeClassification(outcome.data);
}

/**
 * Classify a reader's feeling, or return null to signal "fall back to keywords".
 *
 * null is returned — never an exception surfaced — for every expected degraded
 * state: wrapper unavailable, the kill switch, the daily cap reached (in-process OR the
 * durable cross-instance DB gate — `reserveGlobalUsage`), or two consecutive
 * failed attempts. The one budget reservation covers both attempts (a retry is
 * the same logical call, not a second one against the cap).
 */
export async function classifyMood(
  usage: MoodUsage,
  text: string,
  callClaudeImpl: typeof callClaude = callClaude,
): Promise<Classification | null> {
  if (process.env[MOOD_MODEL_DISABLED_ENV] === '1') return null;
  if (!(await reserveGlobalUsage(usage, MOOD_GLOBAL_SCOPE, MOOD_DAILY_CAP))) return null;

  try {
    return await attempt(text, callClaudeImpl);
  } catch {
    // One retry, then fall back. Never log the error with the text attached.
    try {
      return await attempt(text, callClaudeImpl);
    } catch {
      return null;
    }
  }
}
