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
import type { MoodUsage } from './mood-usage';

const MODEL = 'claude-sonnet-5';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 400;
const REQUEST_TIMEOUT_MS = 8_000;

/** What the classifier derives from a reader's words — never raw text downstream. */
export interface Classification {
  query: MoodQuery;
  /** The model's own crisis read — defense in depth behind the deterministic check. */
  crisis: boolean;
  /** Medical/legal/relationship advice or general-chatbot use — routes to Block 6. */
  outOfScope: boolean;
}

/**
 * Stable system prompt — the cacheable prefix. Kept free of any per-request
 * text so the same bytes hash to the same cache entry on every call. Describes
 * the axes and the two flags; forbids catalogue search and fabrication.
 */
const SYSTEM_PROMPT = [
  'You read one short message describing how a person feels and score it on eight mood axes for a Taylor Swift song-recommendation feature.',
  'You never recommend, name, or search for songs — a separate deterministic system does the matching from your scores. Your only job is to read the feeling.',
  '',
  'The eight axes, each 0..1:',
  '- heartbreak: loss, being hurt by someone, a breakup.',
  '- anger: fury, resentment, being wronged, wanting revenge.',
  '- nostalgia: memory, the past, longing for an earlier time.',
  '- joy: happiness, excitement, being in love, celebration.',
  '- calm: peace, contentment, softness, being settled.',
  '- defiance: empowerment, moving on, strength, being done with someone.',
  '- longing: yearning, missing someone, loneliness, wanting what you don\'t have.',
  '- catharsis: release, letting it all out, feeling everything at once.',
  '',
  'Rules:',
  '- Only assert axes the words actually evoke. Leave an axis unset if it is not there — do NOT default every axis to a number.',
  '- energy (0 still .. 1 driving) and valence (0 sad .. 1 happy) are optional; set them only when the words imply a clear level.',
  '- Set crisis=true if the message suggests self-harm, suicidal thoughts, or acute crisis.',
  '- Set out_of_scope=true if it asks for medical, legal, or relationship advice, or tries to use you as a general chatbot rather than describing a feeling.',
  '- Report your reading through the record_mood tool. Do not add prose.',
].join('\n');

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
  const content = (body as { content?: unknown })?.content;
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (block && typeof block === 'object' && (block as { type?: string }).type === 'tool_use') {
      return (block as { input?: unknown }).input ?? {};
    }
  }
  return null;
}

/** One network attempt. Throws on any non-2xx / malformed / missing-tool result. */
async function attempt(apiKey: string, text: string): Promise<Classification> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: [MOOD_TOOL],
        tool_choice: { type: 'tool', name: MOOD_TOOL.name },
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!res.ok) {
      throw new Error(`anthropic classify failed (${res.status})`);
    }
    const toolInput = extractToolInput(await res.json());
    if (toolInput === null) throw new Error('anthropic classify: no tool_use block');
    return sanitizeClassification(toolInput);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Classify a reader's feeling, or return null to signal "fall back to keywords".
 *
 * null is returned — never an exception surfaced — for every expected degraded
 * state: no API key, daily cap reached, or two consecutive failed attempts.
 * The one budget reservation covers both attempts (a retry is the same logical
 * call, not a second one against the cap).
 */
export async function classifyMood(usage: MoodUsage, text: string): Promise<Classification | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!usage.reserve()) return null;

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
