// Moment (Tier 1) load state machine — portable, no I/O. The web hook and the
// future Expo hook drive this same reducer so both handle the spec's degraded
// states identically: slow, timeout, 404 (notfound), offline, and superseded-tap
// (tapping B while A is still loading must never let A's late reply win).
//
// The caller (hook) owns a monotonic `requestId` and stamps every action with
// it. SLOW/RESOLVE/REJECT only take effect when their id matches the live one,
// which is how superseded taps and closed panels ignore stale replies.
import type { Moment } from './vault-types';

export type MomentLoadError = 'notfound' | 'offline' | 'timeout' | 'error';

export type MomentLoadStatus =
  | 'idle'
  | 'loading'
  | 'slow' // still loading past the slow threshold — show a spinner/hint
  | 'loaded'
  | MomentLoadError;

export interface MomentLoadState {
  status: MomentLoadStatus;
  /** The month_item whose moment is open/loading (null when idle). */
  itemId: string | null;
  /** The live request id; stale-stamped actions are ignored. */
  requestId: number;
  moment: Moment | null;
}

export type MomentLoadAction =
  | { type: 'OPEN'; itemId: string; requestId: number }
  | { type: 'SLOW'; requestId: number }
  | { type: 'RESOLVE'; requestId: number; moment: Moment }
  | { type: 'REJECT'; requestId: number; reason: MomentLoadError }
  | { type: 'CLOSE'; requestId: number };

export const initialMomentLoadState: MomentLoadState = {
  status: 'idle',
  itemId: null,
  requestId: 0,
  moment: null,
};

export function momentLoadReducer(
  state: MomentLoadState,
  action: MomentLoadAction,
): MomentLoadState {
  switch (action.type) {
    case 'OPEN':
      return { status: 'loading', itemId: action.itemId, requestId: action.requestId, moment: null };
    case 'SLOW':
      // Only the in-flight request can go 'slow', and only from 'loading'.
      return action.requestId === state.requestId && state.status === 'loading'
        ? { ...state, status: 'slow' }
        : state;
    case 'RESOLVE':
      // Ignore a reply for a superseded/closed request.
      return action.requestId === state.requestId
        ? { ...state, status: 'loaded', moment: action.moment }
        : state;
    case 'REJECT':
      return action.requestId === state.requestId
        ? { ...state, status: action.reason, moment: null }
        : state;
    case 'CLOSE':
      // Always closes; the fresh requestId invalidates any in-flight reply.
      return { ...initialMomentLoadState, requestId: action.requestId };
    default:
      return state;
  }
}

/** Map a fetch outcome to a degraded state (priority: timeout > offline > 404). */
export function classifyMomentError(signal: {
  status?: number;
  offline?: boolean;
  timedOut?: boolean;
}): MomentLoadError {
  if (signal.timedOut) return 'timeout';
  if (signal.offline) return 'offline';
  if (signal.status === 404) return 'notfound';
  return 'error';
}
