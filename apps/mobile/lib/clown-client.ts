// OS-036 — native Clownbot API client. Mirrors `apps/web/lib/longlive/
// clown-stream.ts` + the `fetch('/api/clown', ...)` call in
// `apps/web/components/longlive/ClownChat.tsx`, ported to a cross-origin
// call against the deployed API (same `apiBaseUrl()` fallback pattern
// `push-registration.ts`/`prefs-client.ts` use) and to a bearer-token
// identity instead of a same-origin cookie (see `clown-session-store.ts`'s
// header for why).
//
// The wire shapes below (ClownAnswer/ClownSegment/InvestigationStep/
// ClownStreamEvent/ClownTurn) are a deliberate, minimal COPY of the ones
// `apps/web/lib/longlive/clown-answer.ts`/`clown-client.ts`/`clown-
// stream.ts` define, not an import — apps/mobile has no dependency on
// apps/web (architecture.md hard boundary; every native surface is built
// against @swift2/shared/@swift2/experience or its own copy, never a
// cross-app import). Keep this shape in sync BY HAND if the server's
// `ClownAnswer` contract changes.
import { getStoredClownSessionToken, setStoredClownSessionToken } from './clown-session-store';

function apiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://swift2-web-nine.vercel.app'
  ).replace(/\/$/, '');
}

export interface ClownTurn {
  role: 'user' | 'assistant';
  text: string;
}

export type ClownSegmentRole = 'stance' | 'argument' | 'counterpoint' | 'aside' | 'plain';

export interface ClownSegment {
  role: ClownSegmentRole;
  text: string;
}

export interface InvestigationStep {
  tool: string;
  input: Record<string, unknown>;
  summary: string;
}

export interface RetrievedItem {
  id: string;
  headline: string;
  date: string;
  status: 'confirmed' | 'debunked' | 'reported' | 'rumor';
}

export interface ClownAnswer {
  kind: 'take' | 'fallback';
  theoryName: string | null;
  segments: ClownSegment[];
  delulu: number | null;
  sources: RetrievedItem[];
  investigation: InvestigationStep[];
}

export type ClownStreamEvent =
  | { type: 'investigation'; step: InvestigationStep }
  | { type: 'answer'; answer: ClownAnswer };

function isStreamEvent(value: unknown): value is ClownStreamEvent {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return type === 'investigation' || type === 'answer';
}

function isClownAnswer(value: unknown): value is ClownAnswer {
  if (!value || typeof value !== 'object') return false;
  const v = value as { kind?: unknown; segments?: unknown };
  return (v.kind === 'take' || v.kind === 'fallback') && Array.isArray(v.segments);
}

function parseLine(line: string): ClownStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const parsed: unknown = JSON.parse(trimmed);
  if (isStreamEvent(parsed)) return parsed;
  if (isClownAnswer(parsed)) return { type: 'answer', answer: parsed };
  return null;
}

/** Reads `res`'s body as newline-delimited JSON — same contract as the
 * web's `readClownStream`. React Native's `fetch` (via Hermes) does not
 * expose a readable-stream `res.body`, so this always takes the
 * whole-body-at-once path; the loop still emits every `investigation`
 * event before the final `answer`, just all at once instead of
 * incrementally. */
async function readClownStream(res: Response, onEvent: (event: ClownStreamEvent) => void): Promise<void> {
  const text = await res.text();
  for (const line of text.split('\n')) {
    const event = parseLine(line);
    if (event) onEvent(event);
  }
}

export interface AskClownResult {
  answer: ClownAnswer;
  investigationSteps: InvestigationStep[];
}

/**
 * Ask Clownbot a question. `question` is the current turn; `priorTurns`
 * mirrors the web's `clownMessages`-derived transcript (prior turns only —
 * the route appends the current one itself). Carries the stored device
 * session token as a bearer credential (OS-036) so a returning device gets
 * continuity the same way a returning browser does via its cookie; a fresh
 * device sends none and the server treats that exactly like a browser with
 * no cookie yet (anonymous sign-up, or no persistence when the memory
 * system isn't toggled on — see `clown-session.ts`'s header).
 */
export async function askClown(question: string, priorTurns: ClownTurn[]): Promise<AskClownResult> {
  const token = await getStoredClownSessionToken();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl()}/api/clown`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: question, transcript: priorTurns }),
  });
  if (!res.ok) {
    throw new Error(`POST /api/clown: HTTP ${res.status}`);
  }

  // See `apps/web/app/api/clown/route.ts`'s OS-036 comment: the server
  // echoes the (possibly refreshed) session token back in this plain
  // header specifically because a bare RN `fetch` cannot read/resend
  // `Set-Cookie` the way a browser does. Absent when the memory system
  // isn't toggled on server-side — nothing to persist in that case, same
  // as the web's "no Set-Cookie" degrade.
  const refreshedToken = res.headers.get('x-clown-session');
  if (refreshedToken) await setStoredClownSessionToken(refreshedToken);

  let answer: ClownAnswer | null = null;
  const investigationSteps: InvestigationStep[] = [];
  await readClownStream(res, (event) => {
    if (event.type === 'investigation') investigationSteps.push(event.step);
    else answer = event.answer;
  });
  if (!answer) throw new Error('askClown: no answer event in stream');
  return { answer, investigationSteps };
}
