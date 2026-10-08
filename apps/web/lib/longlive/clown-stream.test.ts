import { describe, expect, it } from 'vitest';

import { readClownStream, type ClownStreamEvent } from './clown-stream';
import { answerFromFallback } from './clown-answer';
import { composeFallback } from './clown-fallback';

async function* chunksOf(parts: string[]): AsyncGenerator<string> {
  for (const p of parts) yield p;
}

function ndjsonResponse(lines: string[]): AsyncIterable<string> {
  return chunksOf(lines.map((l) => `${l}\n`));
}

describe('readClownStream', () => {
  it('parses multiple investigation events followed by a final answer event, in order', async () => {
    const answer = answerFromFallback(composeFallback([], 'degraded'));
    const lines = [
      JSON.stringify({ type: 'investigation', step: { tool: 'search', input: { query: 'x' }, summary: 'no results' } }),
      JSON.stringify({ type: 'investigation', step: { tool: 'precedents', input: { symbol: 'a' }, summary: '1 precedent' } }),
      JSON.stringify({ type: 'answer', answer }),
    ];
    const events: ClownStreamEvent[] = [];
    await readClownStream(ndjsonResponse(lines), (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(['investigation', 'investigation', 'answer']);
    expect((events[2] as { type: 'answer'; answer: typeof answer }).answer).toEqual(answer);
  });

  it('parses a single-line deterministic-path response (no investigation events)', async () => {
    // The real route contract (Codex review BLOCKER 1 of item 11): every
    // deterministic path (crisis/refusal/chip/scope redirect) returns the
    // route's top-level `ClownAnswer` shape directly — a bare `NextResponse.
    // json(answer)`, never wrapped in a `{type:'answer', ...}` envelope. The
    // reader must normalize this itself; see `isClownAnswer` in clown-
    // stream.ts.
    const answer = answerFromFallback(composeFallback([], 'degraded'));
    const events: ClownStreamEvent[] = [];
    await readClownStream(ndjsonResponse([JSON.stringify(answer)]), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('answer');
    expect((events[0] as { type: 'answer'; answer: typeof answer }).answer).toEqual(answer);
  });

  it('handles a chunk boundary landing mid-line (buffers across reads)', async () => {
    const full = `${JSON.stringify({ type: 'investigation', step: { tool: 'search', input: {}, summary: 's' } })}\n${JSON.stringify(
      { type: 'answer', answer: answerFromFallback(composeFallback([], 'degraded')) },
    )}\n`;
    const mid = Math.floor(full.length / 2);
    const events: ClownStreamEvent[] = [];
    await readClownStream(chunksOf([full.slice(0, mid), full.slice(mid)]), (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(['investigation', 'answer']);
  });

  it('handles the whole body arriving as one buffered chunk', async () => {
    const answer = answerFromFallback(composeFallback([], 'degraded'));
    const events: ClownStreamEvent[] = [];
    await readClownStream(chunksOf([`${JSON.stringify({ type: 'answer', answer })}\n`]), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('answer');
  });

  it('a real crisis/refusal-shaped raw ClownAnswer (kind: fallback, no investigation) still renders as an answer event, not a dropped/undefined one (Codex review BLOCKER 4)', async () => {
    const crisisAnswer = {
      kind: 'fallback' as const,
      theoryName: null,
      segments: [{ role: 'plain' as const, text: "If you're in crisis, you deserve real support right now." }],
      delulu: null,
      sources: [],
      investigation: [],
    };
    const events: ClownStreamEvent[] = [];
    await readClownStream(ndjsonResponse([JSON.stringify(crisisAnswer)]), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('answer');
    const rendered = (events[0] as { type: 'answer'; answer: typeof crisisAnswer }).answer;
    expect(rendered.segments[0].text).toBe(crisisAnswer.segments[0].text);
  });
});
