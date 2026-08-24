import { describe, expect, it } from 'vitest';

import { readClownStream, type ClownStreamEvent } from './clown-stream';
import { answerFromFallback } from './clown-answer';
import { composeFallback } from './clown-fallback';

function ndjsonResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${line}\n`));
      controller.close();
    },
  });
  return new Response(stream);
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
    const answer = answerFromFallback(composeFallback([], 'degraded'));
    const events: ClownStreamEvent[] = [];
    await readClownStream(ndjsonResponse([JSON.stringify({ type: 'answer', answer })]), (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('answer');
  });

  it('handles a chunk boundary landing mid-line (buffers across reads)', async () => {
    const encoder = new TextEncoder();
    const full = `${JSON.stringify({ type: 'investigation', step: { tool: 'search', input: {}, summary: 's' } })}\n${JSON.stringify(
      { type: 'answer', answer: answerFromFallback(composeFallback([], 'degraded')) },
    )}\n`;
    const mid = Math.floor(full.length / 2);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(full.slice(0, mid)));
        controller.enqueue(encoder.encode(full.slice(mid)));
        controller.close();
      },
    });
    const events: ClownStreamEvent[] = [];
    await readClownStream(new Response(stream), (e) => events.push(e));
    expect(events.map((e) => e.type)).toEqual(['investigation', 'answer']);
  });

  it('falls back to reading the whole body when `res.body` is unavailable', async () => {
    const answer = answerFromFallback(composeFallback([], 'degraded'));
    const res = { body: null, text: async () => `${JSON.stringify({ type: 'answer', answer })}\n` } as unknown as Response;
    const events: ClownStreamEvent[] = [];
    await readClownStream(res, (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('answer');
  });
});
