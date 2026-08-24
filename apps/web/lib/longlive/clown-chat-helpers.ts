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
