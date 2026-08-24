/**
 * Client-side reader for `/api/clown`'s NDJSON stream (PLAN.md Stage 10 —
 * see `app/api/clown/route.ts`'s `ndjsonResponse` for the producer side).
 * Split out of `ClownChat.tsx` so the parsing logic is unit-testable
 * without React/DOM (same rationale as every other `clown-*` split).
 *
 * Every deterministic (non-loop) route path still returns a single line,
 * so this reader works identically for those — one `onEvent` call, then
 * done — as it does for the agent loop's multi-line trail.
 */
import type { ClownAnswer, InvestigationStep } from './clown-answer';

export type ClownStreamEvent = { type: 'investigation'; step: InvestigationStep } | { type: 'answer'; answer: ClownAnswer };

function parseLine(line: string): ClownStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed) as ClownStreamEvent;
}

/**
 * Reads `res`'s body as newline-delimited JSON, calling `onEvent` for each
 * event as soon as its line is complete — this is what makes the
 * investigation trail arrive live rather than all at once. Falls back to
 * reading the whole body at once when `res.body` isn't a readable stream
 * (older runtimes/test environments) — same event contract either way.
 */
export async function readClownStream(res: Response, onEvent: (event: ClownStreamEvent) => void): Promise<void> {
  if (!res.body) {
    const text = await res.text();
    for (const line of text.split('\n')) {
      const event = parseLine(line);
      if (event) onEvent(event);
    }
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const event = parseLine(buffer.slice(0, newlineIndex));
      if (event) onEvent(event);
      buffer = buffer.slice(newlineIndex + 1);
      newlineIndex = buffer.indexOf('\n');
    }
    if (done) break;
  }
  const trailing = parseLine(buffer);
  if (trailing) onEvent(trailing);
}
