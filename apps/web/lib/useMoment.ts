'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  classifyMomentError,
  initialMomentLoadState,
  momentLoadReducer,
  type Moment,
} from '@swift2/shared';

const SLOW_MS = 1200; // past this, tell the user it's still loading
const TIMEOUT_MS = 8000; // past this, give up with a timeout state

/**
 * Drives the Tier 1 moment fetch through the shared load state machine, wiring
 * in the browser-only pieces: AbortController (supersede/timeout), a slow timer,
 * and the offline signal. Tapping a new item aborts the previous fetch, and a
 * late reply for a superseded/closed request is ignored by requestId.
 */
export function useMoment() {
  const [state, dispatch] = useReducer(momentLoadReducer, initialMomentLoadState);
  const reqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const open = useCallback((itemId: string) => {
    abortRef.current?.abort();
    const requestId = reqRef.current + 1;
    reqRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'OPEN', itemId, requestId });

    const slowTimer = setTimeout(() => dispatch({ type: 'SLOW', requestId }), SLOW_MS);
    const timeoutTimer = setTimeout(() => {
      controller.abort();
      dispatch({ type: 'REJECT', requestId, reason: 'timeout' });
    }, TIMEOUT_MS);
    const clearTimers = () => {
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };

    fetch(`/vault/moment/${encodeURIComponent(itemId)}`, { signal: controller.signal })
      .then(async (res) => {
        clearTimers();
        if (res.ok) {
          const body = (await res.json()) as { moment?: Moment };
          if (body.moment) dispatch({ type: 'RESOLVE', requestId, moment: body.moment });
          else dispatch({ type: 'REJECT', requestId, reason: 'notfound' });
          return;
        }
        dispatch({ type: 'REJECT', requestId, reason: classifyMomentError({ status: res.status }) });
      })
      .catch(() => {
        clearTimers();
        if (controller.signal.aborted) return; // superseded or timeout already dispatched
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        dispatch({ type: 'REJECT', requestId, reason: classifyMomentError({ offline }) });
      });
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    reqRef.current += 1;
    dispatch({ type: 'CLOSE', requestId: reqRef.current });
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, open, close };
}
