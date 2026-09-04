/**
 * `/api/clown` route helpers — request-shape plumbing split out of
 * `route.ts` (PLAN.md Stage 10) so the route itself stays focused on stage
 * ordering and orchestration: rate limiting, client-transcript sanitisation,
 * the fixed-copy deterministic answer shape, and the NDJSON stream producer
 * (see `clown-stream.ts` for the matching client-side reader). No
 * safety/gate logic lives here — that stays in `clown-safety.ts`/
 * `clown-gate.ts`.
 */
import { answerFromFallback, type ClownAnswer } from './clown-answer';
import { MAX_TRANSCRIPT_TURNS, type ClownTurn } from './clown-client';
import { composeFallback } from './clown-fallback';
import type { ClownStreamEvent } from './clown-stream';
import { trustedClientIp } from './client-ip';
import { makeRateLimiter } from './rate-limit';

/** A question, not an essay — well above the composer's 300-char UI cap. */
export const MAX_TEXT = 600;

// Best-effort per-instance per-IP rate limit — same style as
// apps/web/app/api/mood/route.ts. Serverless instances are ephemeral, so
// this blunts bursts on a warm instance; the daily compose cap
// (clown-usage.ts) is the real spend ceiling.
const limiter = makeRateLimiter({ windowMs: 60_000, max: 15 });

export function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
}

// See client-ip.ts's trustedClientIp for the #1973 rationale — this route
// was migrated to it 2026-09-02 (security audit follow-up t_07025f1e),
// replacing the spoofable-leftmost-XFF lookup that used to live here
// directly.
export function clientIp(req: Request): string {
  return trustedClientIp(req);
}

interface RawTurn {
  role?: unknown;
  text?: unknown;
}

/** Validate the client-held transcript. Leaves room for the current turn,
 * which the route appends itself. */
export function sanitizeTranscript(raw: unknown): ClownTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ClownTurn[] = [];
  for (const entry of raw as RawTurn[]) {
    if (!entry || typeof entry !== 'object') continue;
    const { role, text } = entry;
    if ((role === 'user' || role === 'assistant') && typeof text === 'string' && text.trim()) {
      out.push({ role, text: text.slice(0, MAX_TEXT) });
    }
  }
  return out.slice(-(MAX_TRANSCRIPT_TURNS - 1));
}

/** The crisis, blocklist-refusal, and out-of-scope shapes — fixed copy, no
 * sources, no delulu score (nothing scored them; nothing ran), no
 * investigation trail (nothing investigated). */
export function messageAnswer(lines: readonly string[]): ClownAnswer {
  return {
    kind: 'fallback',
    theoryName: null,
    segments: lines.map((text) => ({ role: 'plain' as const, text })),
    delulu: null,
    sources: [],
    investigation: [],
  };
}

/** Newline-delimited JSON stream — one `ClownStreamEvent` per line. Chosen
 * over SSE (`text/event-stream`) because this app has no existing SSE
 * client/parsing precedent to match and NDJSON needs no framing beyond a
 * newline; the client reads the body with `getReader()` and splits on `\n`.
 * A single-event stream (every non-loop path, unused here — see `route.ts`'s
 * header note) still parses fine under a plain `res.json()`, since
 * `JSON.parse` tolerates trailing whitespace, but those paths don't use this
 * helper at all; only the loop path does. */
export function ndjsonResponse(
  run: (emit: (event: ClownStreamEvent) => void) => Promise<void>,
  extraHeaders?: Record<string, string>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ClownStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await run(emit);
      } catch (err) {
        console.log(
          'clown:stream-error',
          JSON.stringify({ message: err instanceof Error ? err.message : 'unknown' }),
        );
        emit({ type: 'answer', answer: answerFromFallback(composeFallback([], 'degraded')) });
      } finally {
        controller.close();
      }
    },
  });
  // PLAN.md Stage 11: `extraHeaders` carries the `Set-Cookie` session cookie
  // back to the reader when a memory session resolved, so the browser
  // resends it automatically for continuity (see `clown-session.ts`'s
  // header) — undefined/empty for every request where it didn't (today's
  // real state).
  return new Response(stream, {
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', ...extraHeaders },
  });
}
