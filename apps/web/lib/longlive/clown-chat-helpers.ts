/**
 * Pure helpers for `ClownChat.tsx`, split out to keep that file under the
 * 300-line cap (MAP.md).
 */
import type { ClownAnswer, InvestigationStep } from './clown-answer';

/** A prior answer, flattened to plain text for the transcript sent to
 * `/api/clown` — the route passes earlier turns straight through to the
 * model as-is (clown-client.ts's `buildMessages`), so this is the one place
 * a `ClownAnswer`'s segments collapse back into a single utterance. */
export function flattenAnswer(answer: ClownAnswer): string {
  return answer.segments.map((s) => s.text).join('\n\n');
}

/** Human label for a live investigation step, PLAN.md Stage 10's "what the
 * bot looked up" made transparent while the loop is still running (see
 * `ClownMessageRow.tsx` for the same trail rendered once a message lands). */
const TOOL_LABEL: Record<string, string> = {
  search: 'searching the vault',
  precedents: 'checking precedents',
  recent: 'checking the calendar',
  chatter: 'reading fan chatter',
  symbol_activity: 'checking symbol activity',
  track: 'looking up the track',
  date_math: 'doing the date math',
};

export function investigationLabel(step: InvestigationStep): string {
  return `${TOOL_LABEL[step.tool] ?? `running ${step.tool}`}…`;
}

/**
 * Session round-trip (Codex review fix, PLAN.md Stage 11, HUMAN-ACTIONS.md
 * #15 item 2): `route.ts` reads/returns an opaque `x-clown-session` header
 * so a caller's server-side identity persists across messages in the same
 * conversation — this component previously never captured or resent it, so
 * every message signed up a fresh anonymous identity. Pulled out as pure
 * functions (rather than inlined in `ask()`) so the round-trip logic itself
 * is directly testable without a DOM/React harness, which this repo has
 * none of for components (`ClownChat.tsx`'s own header note on browser
 * verification still applies to the rendered behavior).
 */
export function withSessionHeader(headers: Record<string, string>, sessionToken: string | null): Record<string, string> {
  return sessionToken ? { ...headers, 'x-clown-session': sessionToken } : headers;
}

/** The token to hold for the NEXT request: the response's own header value
 * when present, else whatever was already held (a response that carried no
 * header — e.g. the toggle is off — must not erase a token from earlier in
 * the same conversation). */
export function nextSessionToken(previous: string | null, responseHeaderValue: string | null): string | null {
  return responseHeaderValue ?? previous;
}
