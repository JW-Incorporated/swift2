'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackNote } from '@swift2/shared';

export interface TrackGuideState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  eraSlug: string;
  album: string;
  tracks: TrackNote[];
}

const IDLE: TrackGuideState = { status: 'idle', eraSlug: '', album: '', tracks: [] };

/**
 * Fetches an album's on-demand track guide (`/vault/album/[slug]/tracks`). A
 * request guard drops stale/aborted replies (open another album before the
 * first resolves → the first is ignored).
 */
export function useTrackGuide() {
  const [state, setState] = useState<TrackGuideState>(IDLE);
  const reqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const open = useCallback((eraSlug: string, album: string) => {
    abortRef.current?.abort();
    const req = reqRef.current + 1;
    reqRef.current = req;
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading', eraSlug, album, tracks: [] });

    fetch(`/vault/album/${encodeURIComponent(eraSlug)}/tracks`, { signal: controller.signal })
      .then(async (res) => {
        if (req !== reqRef.current) return;
        if (!res.ok) {
          setState({ status: 'error', eraSlug, album, tracks: [] });
          return;
        }
        const body = (await res.json()) as { tracks?: TrackNote[] };
        setState({ status: 'loaded', eraSlug, album, tracks: body.tracks ?? [] });
      })
      .catch(() => {
        if (req !== reqRef.current || controller.signal.aborted) return;
        setState({ status: 'error', eraSlug, album, tracks: [] });
      });
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    reqRef.current += 1;
    setState(IDLE);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { state, open, close };
}
