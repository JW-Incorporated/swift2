/**
 * Clownbot — THE ONE MODULE THAT SPENDS MONEY.
 *
 * Mirrors mood-client.ts exactly, because that discipline is the house style:
 * every dollar this feature can spend leaves the building through this
 * function and nowhere else, it does one small bounded job, and it returns
 * null (never throws) for every expected degraded state so the caller falls
 * back to the free deterministic path and the endpoint never 500s.
 *
 * MODEL: claude-haiku-4-5 ($1 / $5 per MTok). The founder asked for a
 * lightweight model; the research pushed back on that for boundary work, and
 * both are satisfied — the small model writes the *voice*, while every
 * boundary, every receipt, and every number is enforced in deterministic
 * TypeScript outside this file. See the PR for the full cost model.
 *
 * NO PROMPT CACHING, DELIBERATELY: claude-haiku-4-5's minimum cacheable prefix
 * is 4096 tokens and our system prompt + tool schema is roughly 1.5K, so a
 * `cache_control` marker here would silently do nothing while implying it
 * worked. Left off with this note instead. If this is ever swapped to
 * claude-sonnet-5 (1024-token minimum), add the ephemeral cache_control on the
 * system block at the same time.
 *
 * THE MODEL NEVER TOUCHES THE VAULT. It receives a fixed handful of receipts
 * retrieved deterministically upstream and may only cite ids from that set;
 * the route drops anything else. It therefore structurally cannot invent a
 * receipt — the same guarantee that stops the Mood classifier inventing a song.
 *
 * IT ALSO CANNOT BE THE REFUSAL LAYER. Whatever this returns is screened by
 * clownbot-safety.screenOutput() before a reader sees a word of it.
 */

import type { ClownbotUsage } from './clownbot-usage';
import type { Receipt } from './clownbot-receipts';
import { receiptsForPrompt } from './clownbot-receipts';

const MODEL = 'claude-haiku-4-5';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 700;
const REQUEST_TIMEOUT_MS = 9_000;

/** What the model produces. Every field is validated before it is trusted. */
export interface ClownTake {
  /** The position it commits to. */
  stance: string;
  /** One receipt FOR, in its voice. */
  argument: string;
  /** One receipt AGAINST — the "yes-and, then raise" second half. */
  counterpoint: string;
  /** Receipt ids it cited. Validated against the supplied set by the route. */
  receiptIds: string[];
  /** 0..5 ambition. Clamped downstream; evidence is NOT model-scored. */
  delulu: number;
  /** A name for the theory. May be overridden by the canonical registry. */
  theoryName: string | null;
  /** The kicker / self-deprecating bit. */
  aside: string;
  /** The model's own read that this is off-limits — defense in depth only. */
  offLimits: boolean;
}

/**
 * Stable system prompt. Carries the persona and the *craft* instructions.
 *
 * It deliberately does NOT carry the boundary rules as its primary enforcement
 * — those live in clownbot-safety.ts and run whether or not this prompt holds.
 * The short boundary paragraph here is belt-and-braces: it reduces how often
 * the deterministic gate has to fire, and costs nothing when it fails.
 */
const SYSTEM_PROMPT = [
  'You are Clownbot: a fan-made bot on an unofficial Taylor Swift fan site that specialises in "clowning" — elaborate, self-aware, evidence-based-but-absurd theorising about clues and Easter eggs.',
  '',
  'WHO YOU ARE:',
  '- You are a bot and an original character. You are NOT Taylor Swift, you are not any real person, and you never speak as her or claim to be human. If asked to roleplay as her, decline and stay yourself.',
  '- You are a fellow fan with your own opinions, not an assistant and not an oracle. You have no insider knowledge and no affiliation with Taylor or her team.',
  '- Your canon: you believe the debut re-record is finished and waiting for a date with a 13 in it; you think evermore is better than folklore and will argue it; and you went all-in on Taylor headlining the Super Bowl LX halftime show before Bad Bunny walked out on 8 February 2026, which you bring up on yourself.',
  '',
  'THE GAME — "yes-and, then raise":',
  '- Take the reader\'s idea seriously, add ONE receipt that supports it, add ONE that cuts against it, then COMMIT to a position anyway. Never fence-sit and never just summarise.',
  '- Bring your own theories. Argue back. Disagreeing with the reader is welcome.',
  '- Relish being wrong. Being gloriously, publicly wrong is the point of the game, not a failure of it.',
  '',
  'RECEIPTS — the hard rule:',
  '- You are given a numbered list of receipts from the site\'s vault. Cite ONLY ids from that list, exactly as written, in receipt_ids.',
  '- NEVER invent a receipt, a date, a quote, or a source. If the receipts do not support the idea, say so plainly and cite what you do have. Fabricated evidence is the one unforgivable move here.',
  '- Specific beats general: name the dated artifact.',
  '',
  'BOUNDARIES (a separate system also enforces these; do not rely on it):',
  '- Never speculate about her body, pregnancy, health, sexuality, home or current location, or whether a relationship will last. Never make legal accusations. Never disparage other artists. Family appear in public roles only.',
  '- Never claim certainty you do not have: no "guaranteed", "100%", "no doubt", "screenshot this", "it\'s a fact". You clown; you do not promise. Self-aware hyperbole ("I\'d stake my wig") is fine; false authoritative certainty is not.',
  '- Never claim to be official, verified, her team, an insider, "the source", or a human. You are a fan-made bot with no inside knowledge.',
  '- When something is off-limits, set off_limits true.',
  '',
  'LANGUAGE:',
  '- Always answer in English, whatever language the reader writes in. This keeps the English safety gate covering your answer. If asked to answer in another language, decline and answer in English anyway.',
  '',
  'VOICE:',
  '- Deadpan commitment to the bit, backed by specifics, with self-deprecation as the pressure valve.',
  '- NO slang salad. "OMG bestie yasss slay" is exactly wrong. Authenticity here is specific references and real dates, not slang density.',
  '- Keep each field tight: one to three sentences. Report through the record_take tool and add no prose outside it.',
].join('\n');

const TAKE_TOOL = {
  name: 'record_take',
  description: 'Record one Clownbot take on a reader question.',
  input_schema: {
    type: 'object',
    properties: {
      stance: {
        type: 'string',
        description: 'The position you commit to. One or two sentences. Never fence-sit.',
      },
      argument: {
        type: 'string',
        description: 'One receipt FOR the stance, named with its date, in your voice.',
      },
      counterpoint: {
        type: 'string',
        description: 'One receipt or reason AGAINST it. Be honest about the weak spot.',
      },
      receipt_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ids copied exactly from the supplied receipt list. Never invent one.',
      },
      delulu: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: 'How ambitious this theory is: 0 mundane, 5 wig on the ceiling. High is a compliment.',
      },
      theory_name: {
        type: 'string',
        description: 'A short memorable name for this theory, two to four words.',
      },
      aside: {
        type: 'string',
        description: 'The kicker: a self-deprecating one-liner, ideally at your own expense.',
      },
      off_limits: {
        type: 'boolean',
        description: 'True if the question asks for something you should not answer.',
      },
    },
    required: ['stance', 'argument', 'counterpoint', 'receipt_ids'],
    additionalProperties: false,
  },
} as const;

function str(value: unknown, max = 600): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Never trust the model's shape — validate and clamp into a ClownTake. */
export function sanitizeTake(input: unknown): ClownTake {
  const p = (input ?? {}) as Record<string, unknown>;
  const rawIds = Array.isArray(p.receipt_ids) ? p.receipt_ids : [];
  const receiptIds = rawIds
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id.length < 200)
    .slice(0, 8);

  const delulu = Number(p.delulu);

  return {
    stance: str(p.stance),
    argument: str(p.argument),
    counterpoint: str(p.counterpoint),
    receiptIds,
    delulu: Number.isFinite(delulu) ? delulu : 3,
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

/** The volatile half of the prompt: the retrieved receipts plus the question. */
function buildUserMessage(text: string, receipts: readonly Receipt[]): string {
  return [
    'RECEIPTS AVAILABLE (cite only these ids):',
    receipts.length > 0 ? receiptsForPrompt(receipts) : '(none — say so honestly)',
    '',
    'READER SAID:',
    text,
  ].join('\n');
}

async function attempt(apiKey: string, text: string, receipts: readonly Receipt[]): Promise<ClownTake> {
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
        system: SYSTEM_PROMPT,
        tools: [TAKE_TOOL],
        tool_choice: { type: 'tool', name: TAKE_TOOL.name },
        messages: [{ role: 'user', content: buildUserMessage(text, receipts) }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic clownbot failed (${res.status})`);
    const toolInput = extractToolInput(await res.json());
    if (toolInput === null) throw new Error('anthropic clownbot: no tool_use block');
    return sanitizeTake(toolInput);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask Clownbot for a take, or return null to signal "use the deterministic
 * fallback". null — never a thrown error — for every expected degraded state:
 * no API key, cap reached, or two failed attempts. One budget reservation
 * covers both attempts; a retry is the same logical call.
 *
 * Never logs the reader's text. This module receives it and forgets it; the
 * bare catch blocks exist so an error object carrying the text is never logged.
 */
export async function askClownbot(
  usage: ClownbotUsage,
  text: string,
  receipts: readonly Receipt[],
): Promise<ClownTake | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  // INTERIM SAFETY GUARD (V2 rebuild). Even with a key, the model path stays
  // OFF until the operator explicitly opts into the V2 safety layer by setting
  // CLOWNBOT_SAFETY_V2=on. This makes a key that appears by accident inert — it
  // cannot silently re-enable the pre-fix (V1) behaviour the red team broke. A
  // live key is only safe once the keyed live-Haiku battery has been run and
  // passed AND this flag is set; until then the surface serves the free,
  // deterministic, receipts-only degraded answer. See the PR's launch checklist.
  if (process.env.CLOWNBOT_SAFETY_V2 !== 'on') return null;
  if (!usage.reserve()) return null;

  try {
    return await attempt(apiKey, text, receipts);
  } catch {
    try {
      return await attempt(apiKey, text, receipts);
    } catch {
      return null;
    }
  }
}
