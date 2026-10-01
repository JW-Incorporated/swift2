// OS-036 — native mood chat API client. Mirrors the `fetch('/api/mood', ...)`
// call in `apps/web/components/longlive/MoodChat.tsx`, ported to a
// cross-origin call against the deployed API (host decided in
// `api-base.ts`).
//
// The response wire shape (`MoodApiResponse`) lives in `@swift2/shared`'s
// api/mood.ts and is checked against the route in CI. `MoodMatch` is the
// pick row (`@swift2/experience`'s `mood-match.ts`); only the chat-shaped
// result below is local.
import type { MoodMatch } from '@swift2/experience';
import type { MoodApiResponse as SharedMoodApiResponse } from '@swift2/shared';
import { apiBaseUrl } from './api-base';

export type MoodResult =
  | { kind: 'crisis'; message: string[] }
  | { kind: 'refusal'; message: string }
  | { kind: 'unclear'; message: string }
  | { kind: 'matches'; picks: MoodMatch[]; intro?: string };

type MoodApiResponse = SharedMoodApiResponse<MoodMatch>;

function normalize(json: MoodApiResponse): MoodResult {
  if (json.kind === 'crisis') {
    return { kind: 'crisis', message: Array.isArray(json.message) ? json.message : [String(json.message ?? '')] };
  }
  if (json.kind === 'refusal') {
    return { kind: 'refusal', message: typeof json.message === 'string' ? json.message : '' };
  }
  if (json.kind === 'unclear') {
    return { kind: 'unclear', message: typeof json.message === 'string' ? json.message : '' };
  }
  return { kind: 'matches', picks: json.picks ?? [], intro: json.intro };
}

/** Free-text mood query — same crisis-first, model-or-keyword-fallback
 * pipeline the web hits (`/api/mood`'s own header describes the ordering);
 * this client is a thin transport, no logic duplicated here. */
export async function askMood(text: string): Promise<MoodResult> {
  const res = await fetch(`${apiBaseUrl()}/api/mood`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`POST /api/mood: HTTP ${res.status}`);
  }
  return normalize((await res.json()) as MoodApiResponse);
}

/** A starter-chip tap — a hand-tuned vector, zero cost, no model call, same
 * as the web's `tapStarter`. */
export async function askMoodVector(input: {
  moods: Record<string, number>;
  energy?: number;
  valence?: number;
}): Promise<MoodResult> {
  const res = await fetch(`${apiBaseUrl()}/api/mood`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`POST /api/mood: HTTP ${res.status}`);
  }
  return normalize((await res.json()) as MoodApiResponse);
}
