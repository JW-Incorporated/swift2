// Pass B: one Sonnet call per extracted item that writes the lead and body
// from pass A's facts plus a context pack. Same transport/error contract as
// haiku-client.ts (callWorkerClaude, forced tool output): expected "no key" /
// "cap hit" states come back as a deferred result, never a throw, so the
// caller can hold the item with quality_hold_reason 'writer_deferred'; a
// genuine API failure throws.

import { splitSentences } from '@swift2/shared';
import { stripFences } from './prompt-fence';
import { WRITER_SYSTEM_PROMPT, WRITE_POST_TOOL } from './writer-prompt';
import type { ContextPack } from './context-pack';
import type { ExtractedFact } from './types';
import type { ExtractUsageStore } from './usage-store';
import {
  callWorkerClaude,
  hasClaudeSubscriptionToken,
  type WorkerClaudeCaller,
} from '../claude-call';

const MODEL = 'claude-sonnet-5-5';
export const LEAD_MIN_CHARS = 200;
export const LEAD_MAX_CHARS = 400;
export const BODY_MIN_WORDS = 120;
export const BODY_MAX_WORDS = 300;
export const BODY_MIN_PARAGRAPHS = 2;
export const BODY_MAX_PARAGRAPHS = 4;
const TERMINAL_PUNCTUATION = /[.!?]["'\u201d\u2019)]*$/;

export interface WriterInput {
  headline: string;
  statusHint: string;
  facts: readonly ExtractedFact[];
  context: ContextPack;
  /** Overrides the writer model (tuning harness only). */
  model?: string;
  /** One-shot rewrite: the gate's reasons the previous attempt was rejected. */
  rewriteReasons?: readonly string[];
}

export interface WriterCitation {
  sentence: number;
  ref: string;
}

export interface WriterSentence {
  text: string;
  refs: string[];
}

export interface WriterParagraph {
  sentences: WriterSentence[];
}

/** What the model produced, kept even when it fails validation so the report can show it. */
export interface WriterAttempt {
  lead: string;
  body: string;
  paragraphs: WriterParagraph[];
  citations: WriterCitation[];
}

export type WriterDraft = WriterAttempt;

export type WriterResult =
  | { status: 'ok'; draft: WriterDraft }
  | { status: 'deferred'; reason: string }
  | { status: 'invalid'; reasons: string[]; attempt?: WriterAttempt };

/** The exact system message sent to the writer model. */
export const WRITER_SYSTEM_MESSAGE = `${WRITER_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`;

export function buildUserMessage(input: WriterInput): string {
  const lines = [
    `HEADLINE: ${input.headline}`,
    `STATUS: ${input.statusHint}`,
    '',
    '<facts>',
    ...input.facts.map((f) => `[${f.id}] (${f.confidence}, ${stripFences(f.attribution)}) ${stripFences(f.claim)}`),
    '</facts>',
    '',
    '<context>',
    stripFences(input.context.text) || '(none available)',
    '</context>',
  ];
  if (input.rewriteReasons && input.rewriteReasons.length > 0) {
    lines.push(
      '',
      'YOUR PREVIOUS DRAFT WAS REJECTED. Fix every reason below, change nothing else about the rules:',
      ...input.rewriteReasons.map((r) => `- ${r}`),
    );
  }
  return lines.join('\n');
}

const clean = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** The body is built from the structure: sentences joined by a space, paragraphs by a blank line. */
export function buildBody(paragraphs: readonly WriterParagraph[]): string {
  return paragraphs.map((p) => p.sentences.map((s) => s.text).join(' ')).join('\n\n');
}

/** Never trust the model's output shape blindly. Returns reasons, empty when valid; `attempt` is whatever could be read, valid or not. */
export function validateDraft(
  parsed: unknown,
  allowedRefs: ReadonlySet<string>,
): { draft?: WriterDraft; attempt?: WriterAttempt; reasons: string[] } {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const reasons: string[] = [];
  const lead = typeof p.lead === 'string' ? clean(p.lead) : '';

  if (!lead) reasons.push('lead is missing');
  else if (lead.length > LEAD_MAX_CHARS) reasons.push(`lead is ${lead.length} characters; the maximum is ${LEAD_MAX_CHARS}`);
  else if (lead.length < LEAD_MIN_CHARS) reasons.push(`lead is ${lead.length} characters; the minimum is ${LEAD_MIN_CHARS}`);

  const paragraphs: WriterParagraph[] = [];
  const citations: WriterCitation[] = [];
  let sentenceIndex = 0;
  if (!Array.isArray(p.paragraphs) || p.paragraphs.length === 0) {
    reasons.push('paragraphs are missing');
  } else {
    if (p.paragraphs.length > BODY_MAX_PARAGRAPHS) reasons.push(`body has ${p.paragraphs.length} paragraphs; the maximum is ${BODY_MAX_PARAGRAPHS}`);
    p.paragraphs.forEach((rawParagraph, pi) => {
      const rawSentences = (rawParagraph as { sentences?: unknown } | null)?.sentences;
      if (!Array.isArray(rawSentences) || rawSentences.length === 0) {
        reasons.push(`paragraph ${pi} has no sentences`);
        return;
      }
      const sentences: WriterSentence[] = [];
      rawSentences.forEach((raw, si) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        const text = typeof r.text === 'string' ? clean(r.text) : '';
        const refs = Array.isArray(r.refs) ? r.refs.filter((x): x is string => typeof x === 'string') : [];
        if (!text) reasons.push(`paragraph ${pi} sentence ${si} has no text`);
        if (refs.length === 0) reasons.push(`paragraph ${pi} sentence ${si} has no refs`);
        for (const ref of refs) {
          if (!allowedRefs.has(ref)) reasons.push(`ref ${ref} is not a provided fact or context id`);
        }
        if (!text) return;
        if (splitSentences(text).length !== 1) reasons.push(`paragraph ${pi} sentence ${si} is not one sentence (sentence_not_single)`);
        if (!TERMINAL_PUNCTUATION.test(text)) reasons.push(`paragraph ${pi} sentence ${si} lacks terminal punctuation (sentence_not_single)`);
        sentences.push({ text, refs });
        for (const ref of refs) if (allowedRefs.has(ref)) citations.push({ sentence: sentenceIndex, ref });
        sentenceIndex++;
      });
      paragraphs.push({ sentences });
    });
  }

  const body = buildBody(paragraphs);
  const wordCount = body ? body.split(/\s+/).length : 0;
  if (body && wordCount < BODY_MIN_WORDS) reasons.push(`body_too_short: body is ${wordCount} words; the minimum is ${BODY_MIN_WORDS}`);
  if (wordCount > BODY_MAX_WORDS) reasons.push(`body is ${wordCount} words; the maximum is ${BODY_MAX_WORDS}`);

  if (Array.isArray(p.paragraphs) && p.paragraphs.length > 0 && p.paragraphs.length < BODY_MIN_PARAGRAPHS) {
    reasons.push(`body has ${p.paragraphs.length} paragraph; the minimum is ${BODY_MIN_PARAGRAPHS}`);
  }

  const made: WriterAttempt = { lead, body, paragraphs, citations };
  return reasons.length > 0 ? { reasons, ...(lead || body ? { attempt: made } : {}) } : { draft: made, attempt: made, reasons };
}

async function attempt(input: WriterInput, claude: WorkerClaudeCaller): Promise<WriterResult> {
  const response = await claude({
    caller: 'news-worker-writer',
    priority: 'P1',
    model: input.model ?? MODEL,
    system: WRITER_SYSTEM_MESSAGE,
    user: buildUserMessage(input),
    schema: WRITE_POST_TOOL.input_schema,
  });
  if (response.status === 'ok') {
    const allowed = new Set([...input.facts.map((f) => f.id), ...input.context.items.map((i) => i.id)]);
    const { draft, attempt: partial, reasons } = validateDraft(response.data, allowed);
    return draft ? { status: 'ok', draft } : { status: 'invalid', reasons, ...(partial ? { attempt: partial } : {}) };
  }
  if (response.status === 'unavailable' || response.status === 'capped') {
    console.warn(`news-worker writer deferred: ${response.reason}`);
    return { status: 'deferred', reason: response.reason };
  }
  throw new Error(`Claude writer returned invalid output: ${response.reason}`);
}

/**
 * Runs pass B for one item. `usage` must be the writer-scoped store (60/run,
 * 200/day). Budget exhausted or no subscription token -> `deferred`, no call
 * made. Output that fails validation -> `invalid` with reasons the caller may
 * pass back as `rewriteReasons` for its one-shot rewrite. Throws only on a
 * genuine API failure.
 */
export async function writePost(
  usage: ExtractUsageStore,
  input: WriterInput,
  claude: WorkerClaudeCaller = callWorkerClaude,
): Promise<WriterResult> {
  if (!hasClaudeSubscriptionToken()) return { status: 'deferred', reason: 'no subscription token' };
  if (!(await usage.reserve())) return { status: 'deferred', reason: 'writer budget exhausted' };
  return attempt(input, claude);
}
