// Pass B: one Sonnet call per extracted item that writes the lead and body
// from pass A's facts plus a context pack. Same transport/error contract as
// haiku-client.ts (callWorkerClaude, forced tool output): expected "no key" /
// "cap hit" states come back as a deferred result, never a throw, so the
// caller can hold the item with quality_hold_reason 'writer_deferred'; a
// genuine API failure throws.

import { splitSentences } from '@swift2/shared';
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
export const BODY_MAX_PARAGRAPHS = 4;

export interface WriterInput {
  headline: string;
  statusHint: string;
  facts: readonly ExtractedFact[];
  context: ContextPack;
  /** One-shot rewrite: the gate's reasons the previous attempt was rejected. */
  rewriteReasons?: readonly string[];
}

export interface WriterCitation {
  sentence: number;
  ref: string;
}

export interface WriterDraft {
  lead: string;
  body: string;
  citations: WriterCitation[];
}

export type WriterResult =
  | { status: 'ok'; draft: WriterDraft }
  | { status: 'deferred'; reason: string }
  | { status: 'invalid'; reasons: string[] };

/** Untrusted text may not close or reopen the data fences. */
function stripFences(text: string): string {
  return text.replace(/<\/?(?:facts|context)>/gi, '');
}

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

/** Never trust the model's output shape blindly. Returns reasons, empty when valid. */
export function validateDraft(
  parsed: unknown,
  allowedRefs: ReadonlySet<string>,
): { draft?: WriterDraft; reasons: string[] } {
  const p = (parsed ?? {}) as Record<string, unknown>;
  const reasons: string[] = [];
  const lead = typeof p.lead === 'string' ? p.lead.replace(/\s+/g, ' ').trim() : '';
  const body = typeof p.body === 'string' ? p.body.replace(/\r\n/g, '\n').trim() : '';

  if (!lead) reasons.push('lead is missing');
  else if (lead.length > LEAD_MAX_CHARS) reasons.push(`lead is ${lead.length} characters; the maximum is ${LEAD_MAX_CHARS}`);
  else if (lead.length < LEAD_MIN_CHARS) reasons.push(`lead is ${lead.length} characters; the minimum is ${LEAD_MIN_CHARS}`);

  if (!body) reasons.push('body is missing');
  const paragraphs = body ? body.split(/\n\s*\n/).filter((s) => s.trim()) : [];
  if (paragraphs.length > BODY_MAX_PARAGRAPHS) reasons.push(`body has ${paragraphs.length} paragraphs; the maximum is ${BODY_MAX_PARAGRAPHS}`);
  const wordCount = body ? body.split(/\s+/).length : 0;
  if (body && wordCount < BODY_MIN_WORDS) reasons.push(`body_too_short: body is ${wordCount} words; the minimum is ${BODY_MIN_WORDS}`);
  if (wordCount > BODY_MAX_WORDS) reasons.push(`body is ${wordCount} words; the maximum is ${BODY_MAX_WORDS}`);

  const sentenceCount = body ? splitSentences(body).length : 0;
  const covered = new Set<number>();
  const citations: WriterCitation[] = [];
  if (!Array.isArray(p.citations)) {
    reasons.push('citations are missing');
  } else {
    for (const raw of p.citations) {
      const c = (raw ?? {}) as Record<string, unknown>;
      if (!Number.isInteger(c.sentence) || (c.sentence as number) < 0 || (c.sentence as number) >= sentenceCount) {
        reasons.push(`citation points at sentence ${String(c.sentence)}, which is not a body sentence`);
      } else if (typeof c.ref !== 'string' || !allowedRefs.has(c.ref)) {
        reasons.push(`citation ref ${String(c.ref)} is not a provided fact or context id`);
      } else {
        covered.add(c.sentence as number);
        citations.push({ sentence: c.sentence as number, ref: c.ref });
      }
    }
    for (let i = 0; i < sentenceCount; i++) {
      if (!covered.has(i)) reasons.push(`body sentence ${i} has no citation`);
    }
  }

  return reasons.length > 0 ? { reasons } : { draft: { lead, body, citations }, reasons };
}

async function attempt(input: WriterInput, claude: WorkerClaudeCaller): Promise<WriterResult> {
  const response = await claude({
    caller: 'news-worker-writer',
    priority: 'P1',
    model: MODEL,
    system: WRITER_SYSTEM_MESSAGE,
    user: buildUserMessage(input),
    schema: WRITE_POST_TOOL.input_schema,
  });
  if (response.status === 'ok') {
    const allowed = new Set([...input.facts.map((f) => f.id), ...input.context.items.map((i) => i.id)]);
    const { draft, reasons } = validateDraft(response.data, allowed);
    return draft ? { status: 'ok', draft } : { status: 'invalid', reasons };
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
