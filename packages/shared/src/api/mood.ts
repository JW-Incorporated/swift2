// Wire contract for `POST /api/mood`. Server shape wins: these types describe
// exactly what `apps/web/app/api/mood/route.ts` emits.
//
// `picks` rows are `MoodMatch` from `@swift2/experience`, which depends on this
// package (so it cannot be imported here). The response is generic over the
// pick type; callers that have `MoodMatch` pass it as `TPick`.

/** `POST /api/mood` request body — free text, OR a hand-tuned chip vector. */
export interface MoodRequest {
  text?: string;
  /** Chip path: axis name -> 0..1. */
  moods?: Record<string, number>;
  energy?: number;
  valence?: number;
  limit?: number;
  /** Honeypot field; real clients never send it. */
  hp?: string;
}

/** Where the reading came from. `crisis` is only ever paired with kind 'crisis'. */
export type MoodSource = 'chip' | 'model' | 'keyword';

export type MoodApiResponse<TPick = unknown> =
  | { kind: 'crisis'; message: string[]; source: 'crisis' }
  | { kind: 'refusal'; message: string; source: MoodSource }
  | { kind: 'unclear'; message: string; source: MoodSource }
  | { kind: 'matches'; picks: TPick[]; intro?: string; source: MoodSource; degraded?: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Accepts every shape the route can emit; rejects anything else. */
export function isMoodApiResponse(value: unknown): value is MoodApiResponse {
  if (!isRecord(value)) return false;
  if (typeof value.source !== 'string') return false;
  switch (value.kind) {
    case 'crisis':
      return (
        Array.isArray(value.message) && value.message.every((line) => typeof line === 'string')
      );
    case 'refusal':
    case 'unclear':
      return typeof value.message === 'string';
    case 'matches':
      return (
        Array.isArray(value.picks) &&
        value.picks.every(isRecord) &&
        (value.intro === undefined || typeof value.intro === 'string') &&
        (value.degraded === undefined || typeof value.degraded === 'boolean')
      );
    default:
      return false;
  }
}
