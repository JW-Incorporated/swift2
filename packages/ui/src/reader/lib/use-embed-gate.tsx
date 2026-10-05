'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const EMBED_LOAD_TIMEOUT_MS = 10_000;

export const EMBED_OFFLINE_MESSAGE = 'You’re offline — try again when connected';
export const EMBED_FAILED_MESSAGE = 'Couldn’t load the player — tap to try again';

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Gate for a click-to-play embed (YouTube / Spotify). The poster stays put when
 * the device is offline at tap time, and a player that errors or never loads
 * within `EMBED_LOAD_TIMEOUT_MS` falls back to the poster so the tap is
 * retryable instead of leaving a permanently dead box. The `online` event
 * clears the message so the reader can retry.
 */
export function useEmbedGate(startPlaying = false) {
  const [playing, setPlaying] = useState(() => startPlaying && !isOffline());
  const [notice, setNotice] = useState<string | null>(() =>
    startPlaying && isOffline() ? EMBED_OFFLINE_MESSAGE : null,
  );
  const loaded = useRef(false);

  const fail = useCallback(() => {
    setPlaying(false);
    setNotice(isOffline() ? EMBED_OFFLINE_MESSAGE : EMBED_FAILED_MESSAGE);
  }, []);

  const play = useCallback(() => {
    if (isOffline()) {
      setNotice(EMBED_OFFLINE_MESSAGE);
      return;
    }
    loaded.current = false;
    setNotice(null);
    setPlaying(true);
  }, []);

  const onLoad = useCallback(() => {
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => {
      if (!loaded.current) fail();
    }, EMBED_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [playing, fail]);

  useEffect(() => {
    const onOnline = () => setNotice(null);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return { playing, notice, play, onLoad, onError: fail };
}

/** Small inline message shown under a poster after a failed or offline tap. */
export function EmbedNotice({ message }: { message: string | null }) {
  return (
    <p role="status" className="mt-2 text-center text-xs text-[color:var(--era-ink-soft)]">
      {message}
    </p>
  );
}
