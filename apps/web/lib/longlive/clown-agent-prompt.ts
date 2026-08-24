/**
 * Clownbot agent loop — message-shape plumbing split out of `clown-agent.ts`
 * (PLAN.md Stage 10): building the initial seeded prompt, formatting every
 * subsequent `tool_result`, dispatching a model-requested read tool call
 * against a sanitised input shape, and pulling `tool_use` blocks back out of
 * a raw Anthropic response. `clown-agent.ts` keeps the loop's control flow
 * (the three hard caps); this file has no cap/budget logic of its own.
 */
import type { ClownTurn } from './clown-client';
import type { RetrievedItem } from './clown-fallback';
import {
  toolChatter,
  toolDateMath,
  toolPrecedents,
  toolRecent,
  toolSearch,
  toolSymbolActivity,
  toolTrack,
  type ToolCallResult,
} from './clown-agent-tools';

export interface AgentContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | AgentContentBlock[];
}

/** Shared item formatter for both the seed context and every subsequent
 * `tool_result` (Codex review MAJOR 8) — without this, the loop's later
 * rounds sent back only a count-style summary, never the actual retrieved
 * data, so the model had nothing real to cite or reason from after the
 * seed search. */
function formatItemsForPrompt(items: readonly RetrievedItem[]): string {
  return items
    .slice(0, 8)
    .map((item) => `[${item.id}] (${item.date}) ${item.headline} — ${item.detail.replace(/\s+/g, ' ').trim().slice(0, 240)}`)
    .join('\n');
}

function formatSeedForPrompt(seed: ToolCallResult): string {
  if (seed.items.length === 0) return '(no results)';
  return formatItemsForPrompt(seed.items);
}

/** Every subsequent read-tool's `tool_result` content — the actual
 * retrieved data (id/date/headline/detail, truncated), not just the
 * one-line summary already shown in the investigation trail. Tools that
 * never add to the citable pool (`symbol_activity`, `date_math`) have no
 * items to append, so this degrades to the summary alone for those. */
export function formatToolResultForPrompt(result: ToolCallResult): string {
  if (result.items.length === 0) return result.summary;
  return [result.summary, formatItemsForPrompt(result.items)].join('\n');
}

function buildSeedText(text: string, seed: ToolCallResult): string {
  return [
    'AN INITIAL SEARCH HAS ALREADY RUN FOR YOU (does not count against your investigation budget):',
    formatSeedForPrompt(seed),
    '',
    'You may call more tools before committing (precedents/recent/chatter/symbol_activity/track/date_math, or search again). Cite ONLY ids exactly as written, from something you have actually seen in a tool result — never invent one.',
    '',
    'READER SAID:',
    text,
  ].join('\n');
}

export function buildInitialMessages(transcript: readonly ClownTurn[], seed: ToolCallResult): AgentMessage[] {
  const lastIndex = transcript.length - 1;
  return transcript.map((turn, i) => ({
    role: turn.role,
    content: i === lastIndex ? buildSeedText(turn.text, seed) : turn.text,
  }));
}

function str(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

interface ToolDispatch {
  input: Record<string, unknown>;
  result: ToolCallResult;
}

/** Never trusts the model's tool input shape — same discipline as
 * `sanitizeTake`. Returns `null` for an unrecognised tool or a missing
 * required argument; the caller reports that honestly in the tool_result
 * rather than silently skipping the call (still counts against budget —
 * a model that keeps calling badly-shaped tools must not evade the cap). */
export async function executeReadTool(name: string, rawInput: unknown, signal?: AbortSignal): Promise<ToolDispatch | null> {
  const p = (rawInput ?? {}) as Record<string, unknown>;
  switch (name) {
    case 'search': {
      const query = str(p.query, 200);
      if (!query) return null;
      return { input: { query }, result: await toolSearch(query, signal) };
    }
    case 'precedents': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolPrecedents(symbol, signal) };
    }
    case 'recent': {
      const days = num(p.days, 7, 1, 90);
      return { input: { days }, result: await toolRecent(days, signal) };
    }
    case 'chatter': {
      const topic = str(p.topic, 100);
      if (!topic) return null;
      return { input: { topic }, result: await toolChatter(topic, signal) };
    }
    case 'symbol_activity': {
      const symbol = str(p.symbol, 100);
      if (!symbol) return null;
      return { input: { symbol }, result: await toolSymbolActivity(symbol, signal) };
    }
    case 'track': {
      const title = str(p.title, 200);
      if (!title) return null;
      return { input: { title }, result: await toolTrack(title, signal) };
    }
    case 'date_math': {
      const phrase = str(p.phrase, 50);
      if (!phrase) return null;
      return { input: { phrase }, result: await toolDateMath(phrase) };
    }
    default:
      return null;
  }
}

interface RawToolUseBlock {
  id: string;
  name: string;
  input: unknown;
}

export function extractToolUseBlocks(raw: unknown): RawToolUseBlock[] {
  const content = (raw as { content?: unknown })?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter(
      (b): b is { type: 'tool_use'; id: string; name: string; input: unknown } =>
        Boolean(b) && typeof b === 'object' && (b as { type?: string }).type === 'tool_use',
    )
    .map((b) => ({ id: b.id, name: b.name, input: b.input }));
}
