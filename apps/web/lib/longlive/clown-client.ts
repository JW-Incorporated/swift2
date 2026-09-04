/**
 * Clownbot (build B) — THE ONE MODULE THAT SPENDS MONEY.
 *
 * PLAN.md Step 7. Mirrors `mood-client.ts`'s discipline and, per that model
 * tier, its transport exactly: every dollar this feature can spend leaves the
 * building through this function and nowhere else, it does one small bounded
 * job, and it returns null (never throws) for every expected degraded state
 * so the caller falls back to `clown-fallback.ts`'s zero-model composer and
 * the route never 500s.
 *
 * MODEL: see `CLOWN_MODEL` below — PENDING WYATT'S RATIFICATION (PLAN.md
 * § Rulings — Wyatt: "model tier (spec offers Sonnet-class like Mood, or
 * Haiku)... Build against Mood's tier"). Built against Mood Chat's tier
 * (`mood-client.ts`'s `claude-sonnet-5`) as the placeholder, kept as a single
 * named constant so changing it is a one-line diff.
 *
 * THE MODEL NEVER SEARCHES THE CORPUS. It receives a small, fixed set of
 * `ClownDoc`s retrieved deterministically upstream (`clown-retrieve.ts`) and
 * may only cite ids from that set; `clown-gate.ts` (a later step) fails the
 * whole answer if it cites anything else — AND fails it outright if it cites
 * nothing at all (`kind: 'ungrounded'`), since an empty `citedIds` has no bad
 * id to invalidate and would otherwise skip the check entirely. Between the
 * two, this module cannot get a source-free or fabricated-source take past
 * `clown-gate.ts` to a reader — but nothing in THIS module enforces that on
 * its own; the guarantee lives entirely in the later gate, not here.
 *
 * IT ALSO CANNOT BE THE REFUSAL LAYER. Whatever this returns is re-screened
 * by `clown-gate.ts` before a reader sees a word of it — this module does not
 * import `clown-safety.ts`/`clown-blocklist.ts` and does not need to.
 *
 * MULTI-TURN: `askClown` accepts a capped transcript (~`MAX_TRANSCRIPT_TURNS`
 * messages); the caller (the route) owns the cap and this module stores
 * nothing between calls — no history, no session state, nothing written down.
 */

import type { ClownDoc } from './clown-index';
import { CLOWN_DAILY_CAP, CLOWN_GLOBAL_SCOPE, type ClownUsage } from './clown-usage';
import { reserveGlobalUsage } from './usage-db-gate';
import { CLOWN_SYSTEM_PROMPT, CLOWN_TAKE_TOOL } from './clown-client-prompt';

/**
 * PENDING WYATT'S RATIFICATION — see header. Matches `mood-client.ts`'s
 * `MODEL` constant as the placeholder tier.
 */
export const CLOWN_MODEL = 'claude-sonnet-5';

/**
 * Kill switch, an env flag. Neither Mood Chat nor build A's rebuilt safety
 * module defines a dedicated kill-switch env var (Mood degrades purely on a
 * missing key or an exhausted cap; build A's V1 client gated on
 * `CLOWNBOT_SAFETY_V2`, a one-time migration flag, not a standing switch).
 * This is a fresh, narrowly-scoped flag for the same purpose build A's
 * flag served: an operator can force the degraded path without touching the
 * key or the cap. Checked BEFORE `usage.reserve()` so flipping it costs
 * nothing.
 */
const CLOWN_MODEL_DISABLED_ENV = 'CLOWN_MODEL_DISABLED';

/** Exported so `clown-agent.ts` (PLAN.md Stage 10) can build its own request
 * bodies against the same wire contract without a second constant. */
export const ANTHROPIC_VERSION = '2023-06-01';
export const MAX_TOKENS = 1_024;
// Slightly higher than Mood Chat's 8s — this call composes prose across up
// to MAX_TRANSCRIPT_TURNS turns, not a single short vector classification.
export const REQUEST_TIMEOUT_MS = 9_000;

/** Thinking OFF, explicitly — same rationale as mood-client.ts: on
 * claude-sonnet-5 adaptive thinking is ON when the field is omitted, and
 * MAX_TOKENS caps thinking AND the tool call together, so an unbudgeted
 * thinking pass could truncate the tool call before it lands. This is a
 * short structured take, not a reasoning task. */
const THINKING = { type: 'disabled' } as const;

/** One transcript turn. The route builds this; this module never persists it. */
export interface ClownTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Defensive re-cap — the route owns the real cap, this is belt-and-braces. */
export const MAX_TRANSCRIPT_TURNS = 6;

/** What the model produces. Every field is validated before it is trusted. */
export interface ClownTake {
  /** The position it commits to. */
  stance: string;
  /** One source FOR, in its voice. */
  argument: string;
  /** One source AGAINST — the "yes-and, then raise" second half. */
  counterpoint: string;
  /** ClownDoc ids it cited. `clown-gate.ts` fails the answer if any id here
   * was not in the retrieved set handed to this call. */
  citedIds: string[];
  /** 0..5 ambition, clamped and rounded to an integer by `sanitizeTake`
   * before this type is ever populated. Evidence is NOT model-scored. */
  delulu: number;
  /** A name for the theory. May be overridden by the canonical registry (`clown-names.ts`). */
  theoryName: string | null;
  /** The kicker / self-deprecating bit. */
  aside: string;
  /** The model's own read that this is off-limits — defense in depth only. */
  offLimits: boolean;
}

function str(value: unknown, max = 600): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Never trust the model's shape — validate and clamp into a ClownTake. */
export function sanitizeTake(input: unknown): ClownTake {
  const p = (input ?? {}) as Record<string, unknown>;
  const rawIds = Array.isArray(p.cited_ids) ? p.cited_ids : [];
  const citedIds = rawIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id.length < 200)
    .slice(0, 8);

  const rawDelulu = Number(p.delulu);
  // 0..5 integer, always — a model take is never allowed to render a
  // negative or a wildly out-of-range delulu score (DeluluBadge renders it
  // raw, with no clamp of its own). `null` is NOT produced here on purpose:
  // that value is reserved for the zero-model fallback path
  // (clown-answer.ts's `answerFromFallback`), which legitimately has no
  // score because nothing scored it. A model take always gets a number.
  const delulu = Number.isFinite(rawDelulu) ? Math.min(5, Math.max(0, Math.round(rawDelulu))) : 3;

  return {
    stance: str(p.stance),
    argument: str(p.argument),
    counterpoint: str(p.counterpoint),
    citedIds,
    delulu,
    theoryName: typeof p.theory_name === 'string' ? str(p.theory_name, 80) : null,
    aside: str(p.aside, 300),
    offLimits: p.off_limits === true,
  };
}

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

/** Trim a doc's searchable haystack to one citable line, same discipline as
 * build A's `receiptsForPrompt`'s `firstLine`. */
function firstLine(text: string, max = 240): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return `${(lastStop > 80 ? cut.slice(0, lastStop) : cut).trimEnd()}…`;
}

/** Format the retrieved `ClownDoc`s into the citable list the prompt shows. */
function docsForPrompt(docs: readonly ClownDoc[]): string {
  return docs
    .map((d) => `[${d.id}] (${d.date ?? 'undated'}${d.open ? ', open' : ''}) ${d.title} — ${firstLine(d.text)}`)
    .join('\n');
}

/** The volatile half of the final turn: the retrieved sources plus the question. */
function buildUserMessage(text: string, docs: readonly ClownDoc[]): string {
  return [
    'SOURCES AVAILABLE (cite only these ids, exactly as written):',
    docs.length > 0 ? docsForPrompt(docs) : '(none — say so honestly, do not invent one)',
    '',
    'READER SAID:',
    text,
  ].join('\n');
}

interface WireMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Earlier turns pass through as-is; only the LAST (current) turn carries the
 * sources block — earlier turns were already answered against their own,
 * now-stale, retrieval set. */
function buildMessages(transcript: readonly ClownTurn[], docs: readonly ClownDoc[]): WireMessage[] {
  const lastIndex = transcript.length - 1;
  return transcript.map((turn, i) => ({
    role: turn.role,
    content: i === lastIndex ? buildUserMessage(turn.text, docs) : turn.text,
  }));
}

/** Anthropic `usage` block, normalised to camelCase — same field either
 * caller needs: `askClown` ignores it, `clown-agent.ts`'s loop sums it
 * toward its own token budget. */
export interface AnthropicCallUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AnthropicCallResult {
  /** The full parsed response body — the caller extracts what it needs
   * (`extractToolInput` here; `clown-agent.ts` also reads `stop_reason`). */
  raw: unknown;
  usage: AnthropicCallUsage;
}

/**
 * THE shared wire primitive — one POST to the Messages API, timeout +
 * abort, no retry (callers own their own retry policy; `attempt` below
 * keeps `askClown`'s existing one-retry behaviour). Exported so
 * `clown-agent.ts`'s multi-turn tool loop sends requests through the exact
 * same transport (headers, endpoint, timeout) rather than standing up a
 * second model client — PLAN.md Stage 10's "don't add a new model client."
 * Pulled out of `attempt` below as a pure extraction: `askClown`'s own
 * request shape and behaviour are unchanged.
 */
/**
 * `signal` (Codex review BLOCKER 2, Clownbot agent loop) lets a caller with
 * its own wall-clock deadline (`clown-agent.ts`'s loop, via the route's
 * single request-wide `AbortController`) actually cancel an in-flight
 * request rather than just abandoning the promise and letting it keep
 * running server-side — this local controller's own `timeoutMs` timer and
 * the external `signal` both feed the SAME `fetch` abort, whichever fires
 * first. `askClown` (below) never passes one, so its own behaviour is
 * unchanged.
 */
export async function callAnthropicMessages(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<AnthropicCallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`anthropic call failed (${res.status})`);
    const json = await res.json();
    const rawUsage = (json as { usage?: { input_tokens?: unknown; output_tokens?: unknown } } | null)?.usage;
    const inputTokens = typeof rawUsage?.input_tokens === 'number' ? rawUsage.input_tokens : 0;
    const outputTokens = typeof rawUsage?.output_tokens === 'number' ? rawUsage.output_tokens : 0;
    return { raw: json, usage: { inputTokens, outputTokens } };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

async function attempt(apiKey: string, messages: readonly WireMessage[]): Promise<ClownTake> {
  const { raw } = await callAnthropicMessages(apiKey, {
    model: CLOWN_MODEL,
    max_tokens: MAX_TOKENS,
    thinking: THINKING,
    system: [{ type: 'text', text: CLOWN_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools: [CLOWN_TAKE_TOOL],
    tool_choice: { type: 'tool', name: CLOWN_TAKE_TOOL.name },
    messages,
  });
  const toolInput = extractToolInput(raw);
  if (toolInput === null) throw new Error('anthropic clown: no tool_use block');
  return sanitizeTake(toolInput);
}

/**
 * Ask Clownbot for a take, or return null to signal "use `clown-fallback.ts`".
 * null — never a thrown error — for every expected degraded state: no API
 * key, kill switch on, cap reached, a malformed transcript, or two failed
 * attempts. One budget reservation covers both attempts; a retry is the same
 * logical call.
 *
 * `transcript`'s LAST entry must be the reader's current turn (`role: 'user'`)
 * — that is what the sources block is attached to. Never logs the transcript
 * text; this module receives it and forgets it.
 */
/**
 * The one place that reads the API key and the kill switch. Returns the key
 * when the model is allowed to spend, `null` when it is not (no key, or the
 * kill switch is on) — never throws. Exported so `clown-agent.ts` gates the
 * SAME two checks, in the SAME order, rather than re-deriving them; the
 * env-var name itself stays private to this module either way.
 */
export function clownModelKey(): string | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (process.env[CLOWN_MODEL_DISABLED_ENV] === '1') return null;
  return apiKey;
}

export async function askClown(
  usage: ClownUsage,
  transcript: readonly ClownTurn[],
  docs: readonly ClownDoc[],
): Promise<ClownTake | null> {
  const apiKey = clownModelKey();
  if (!apiKey) return null;

  const capped = transcript.slice(-MAX_TRANSCRIPT_TURNS);
  if (capped.length === 0 || capped[capped.length - 1].role !== 'user') return null;

  if (!(await reserveGlobalUsage(usage, CLOWN_GLOBAL_SCOPE, CLOWN_DAILY_CAP))) return null;

  const messages = buildMessages(capped, docs);

  try {
    return await attempt(apiKey, messages);
  } catch {
    try {
      return await attempt(apiKey, messages);
    } catch {
      return null;
    }
  }
}
