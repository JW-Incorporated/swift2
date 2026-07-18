// The single capped LLM-call module — every classify call in the pipeline
// goes through here, never direct (docs/decisions.md, 2026-07-18 cost-cap
// entry). Model vendor is OpenAI per Joey's explicit 2026-07-18 instruction
// to leverage OpenAI tokens for this build — a deliberate deviation from the
// architecture proposal's original "Haiku-class" suggestion.
//
// No OPENAI_API_KEY secret exists in this repo yet (checked 2026-07-18) —
// that's a founder TX item (new API key, likely new billing), not something
// built here. This module is wired and ready, not tested against a live
// key: classifyWithLLM returns null when no key is configured (the normal,
// expected state today), and the caller falls back to the deterministic
// rule-based classifier — the pipeline's designed degraded-but-functional
// path, not an error condition. Uses the long-stable Chat Completions shape
// (not the newer Responses API) specifically because it can be reviewed with
// confidence without a live key to test against; re-verify against a real
// key before relying on this in production.

import type { NewsCategory } from '@swift2/shared/news';
import { NEWS_CATEGORIES } from '@swift2/shared/news';
import type { UsageStore } from './usage-store';
import type { ClassifyResult } from './rule-based';

const MODEL = 'gpt-4o-mini'; // cost-cheap tier; re-check the current cheapest capable model at any real usage review
const MAX_OUTPUT_TOKENS = 400;

const CLASSIFY_PROMPT = `You classify a Taylor Swift fan-news item. Given a JSON object with "title" and "snippet", respond with STRICT JSON only, no prose: {"category": one of ${NEWS_CATEGORIES.join('|')}, "headline": a neutral rewritten headline under 100 characters, "summary": a neutral 1-2 sentence summary under 300 characters, "importance": an integer 1-10}. Never invent facts not present in the input. Never editorialize or speculate beyond what's given.`;

/**
 * Attempts an LLM classification. Returns null (never throws for the
 * "no key" / "cap hit" cases) so callers can uniformly fall back to
 * classifyByKeywords — those are expected, not exceptional, states.
 */
export async function classifyWithLLM(
  usage: UsageStore,
  input: { title: string; snippet: string },
): Promise<ClassifyResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const reserved = await usage.reserve();
  if (!reserved) return null;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI classify failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI classify: empty response content');

  const parsed = JSON.parse(text);
  return sanitizeResult(parsed);
}

/** Never trust the model's output shape blindly — clamp/validate before it reaches the DB. */
function sanitizeResult(parsed: unknown): ClassifyResult {
  const p = parsed as Record<string, unknown>;
  const category = NEWS_CATEGORIES.includes(p.category as NewsCategory)
    ? (p.category as NewsCategory)
    : 'sighting';
  const importance = Math.min(10, Math.max(1, Math.round(Number(p.importance) || 5)));
  return {
    category,
    headline: String(p.headline ?? '').slice(0, 100),
    summary: String(p.summary ?? '').slice(0, 300),
    importance,
  };
}
