// Wire contract for `POST /api/clown` — the one source of truth the web route,
// the web client, and the native client all import. Server shape wins: these
// types describe exactly what `apps/web/app/api/clown/route.ts` emits.
//
// The route answers in one of two framings (see its STREAMING header):
//   - every deterministic path (crisis, refusal, chip, scope redirect) returns
//     a bare `ClownAnswer` as a single JSON body;
//   - the agent-loop path returns newline-delimited `ClownStreamEvent`s.
// Clients must accept both, so `isClownAnswer` and `isClownStreamEvent` are
// both exported.

/** One transcript turn the client resends with each request. */
export interface ClownTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** `POST /api/clown` request body. `transcript` holds PRIOR turns only. */
export interface ClownRequest {
  text: string;
  transcript?: ClownTurn[];
  /** True when the request originates from a prefill chip tap (zero-model path). */
  chip?: boolean;
}

export type ClownSegmentRole = 'stance' | 'argument' | 'counterpoint' | 'aside' | 'plain';

export const CLOWN_SEGMENT_ROLES: readonly ClownSegmentRole[] = [
  'stance',
  'argument',
  'counterpoint',
  'aside',
  'plain',
];

export interface ClownSegment {
  role: ClownSegmentRole;
  text: string;
}

/** One tool call the agent loop made while investigating, in order. */
export interface InvestigationStep {
  tool: string;
  input: Record<string, unknown>;
  summary: string;
}

/** How resolved a retrieved claim is. */
export type ClownItemStatus = 'rumor' | 'reported' | 'confirmed' | 'debunked';

export const CLOWN_ITEM_STATUSES: readonly ClownItemStatus[] = [
  'rumor',
  'reported',
  'confirmed',
  'debunked',
];

export interface ClownItemSource {
  name: string;
  url: string;
}

/** One retrieved corpus item, rendered as a source card beneath an answer. */
export interface ClownRetrievedItem {
  id: string;
  headline: string;
  detail: string;
  status: ClownItemStatus;
  date: string;
  sources: ClownItemSource[];
}

export interface ClownAnswer {
  kind: 'take' | 'fallback';
  theoryName: string | null;
  segments: ClownSegment[];
  /** 0..5, or null when no model scored the claim (fallback paths). */
  delulu: number | null;
  sources: ClownRetrievedItem[];
  investigation: InvestigationStep[];
}

export type ClownStreamEvent =
  { type: 'investigation'; step: InvestigationStep } | { type: 'answer'; answer: ClownAnswer };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isClownSegment(value: unknown): value is ClownSegment {
  return (
    isRecord(value) &&
    typeof value.text === 'string' &&
    (CLOWN_SEGMENT_ROLES as readonly unknown[]).includes(value.role)
  );
}

function isClownItemSource(value: unknown): value is ClownItemSource {
  return isRecord(value) && typeof value.name === 'string' && typeof value.url === 'string';
}

export function isClownRetrievedItem(value: unknown): value is ClownRetrievedItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.headline === 'string' &&
    typeof value.detail === 'string' &&
    typeof value.date === 'string' &&
    (CLOWN_ITEM_STATUSES as readonly unknown[]).includes(value.status) &&
    Array.isArray(value.sources) &&
    value.sources.every(isClownItemSource)
  );
}

export function isInvestigationStep(value: unknown): value is InvestigationStep {
  return (
    isRecord(value) &&
    typeof value.tool === 'string' &&
    typeof value.summary === 'string' &&
    isRecord(value.input)
  );
}

export function isClownAnswer(value: unknown): value is ClownAnswer {
  return (
    isRecord(value) &&
    (value.kind === 'take' || value.kind === 'fallback') &&
    (value.theoryName === null || typeof value.theoryName === 'string') &&
    (value.delulu === null || typeof value.delulu === 'number') &&
    Array.isArray(value.segments) &&
    value.segments.every(isClownSegment) &&
    Array.isArray(value.sources) &&
    value.sources.every(isClownRetrievedItem) &&
    Array.isArray(value.investigation) &&
    value.investigation.every(isInvestigationStep)
  );
}

export function isClownStreamEvent(value: unknown): value is ClownStreamEvent {
  if (!isRecord(value)) return false;
  if (value.type === 'investigation') return isInvestigationStep(value.step);
  if (value.type === 'answer') return isClownAnswer(value.answer);
  return false;
}
