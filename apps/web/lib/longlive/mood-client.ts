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
 * Model: claude-sonnet-5. Key: ANTHROPIC_API_KEY from env, never committed —
 * absent key is the normal local/preview state, not an error.
 */

import { MOOD_AXES, type MoodAxis } from './types';
import type { MoodQuery } from './mood-match';
import { MOOD_DAILY_CAP, MOOD_GLOBAL_SCOPE, type MoodUsage } from './mood-usage';
import { MOOD_SYSTEM_PROMPT } from './mood-prompt';
import { reserveGlobalUsage } from './usage-db-gate';
import {
  callAnthropicMessages,
  extractToolUseInput,
} from '@swift2/shared/llm/anthropic-messages';

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 1_024;
const REQUEST_TIMEOUT_MS = 8_000;

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
const THINKING = { type: 'disabled' } as const;

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

/** Pull the record_mood tool input out of a Messages API response body. */
function extractToolInput(body: unknown): unknown | null {
  return extractToolUseInput(body, { fallback: {} });
}

/** One network attempt. Throws on any non-2xx / malformed / missing-tool result. */
async function attempt(apiKey: string, text: string): Promise<Classification> {
  const { raw } = await callAnthropicMessages(
    apiKey,
    {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: THINKING,
      // The cacheable-prefix minimum on claude-sonnet-5 is 1024 tokens. This
      // breakpoint used to be a no-op because the prompt sat under it; as of
      // #2177 the prompt measures ~1627 tokens and the cache is LIVE —
      // measured cache_creation_input_tokens=1619 cold, then
      // cache_read_input_tokens=1619 warm on an identical call.
      // DO NOT shorten MOOD_SYSTEM_PROMPT back below ~1024 tokens: caching
      // would silently stop, with no error and no test failure. Re-verify
      // with usage.cache_read_input_tokens after any prompt edit.
      system: [{ type: 'text', text: MOOD_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [MOOD_TOOL],
      tool_choice: { type: 'tool', name: MOOD_TOOL.name },
      messages: [{ role: 'user', content: text }],
    },
    { timeoutMs: REQUEST_TIMEOUT_MS, errorLabel: 'anthropic classify' },
  );
  const toolInput = extractToolInput(raw);
  if (toolInput === null) throw new Error('anthropic classify: no tool_use block');
  return sanitizeClassification(toolInput);
}

/**
 * Classify a reader's feeling, or return null to signal "fall back to keywords".
 *
 * null is returned — never an exception surfaced — for every expected degraded
 * state: no API key, the kill switch, the daily cap reached (in-process OR the
 * durable cross-instance DB gate — `reserveGlobalUsage`), or two consecutive
 * failed attempts. The one budget reservation covers both attempts (a retry is
 * the same logical call, not a second one against the cap).
 */
export async function classifyMood(usage: MoodUsage, text: string): Promise<Classification | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (process.env[MOOD_MODEL_DISABLED_ENV] === '1') return null;
  if (!(await reserveGlobalUsage(usage, MOOD_GLOBAL_SCOPE, MOOD_DAILY_CAP))) return null;

  try {
    return await attempt(apiKey, text);
  } catch {
    // One retry, then fall back. Never log the error with the text attached.
    try {
      return await attempt(apiKey, text);
    } catch {
      return null;
    }
  }
}
