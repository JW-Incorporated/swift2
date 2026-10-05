'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a wrapper-framed player may stay silent before we offer a reload. */
export const EMBED_READY_BOUND_MS = 20_000;

export const EMBED_OFFLINE_MESSAGE =
  'You’re offline — the player may not load until you’re connected.';
export const EMBED_FAILED_MESSAGE = 'Couldn’t load the player — tap to try again';
export const EMBED_STALLED_MESSAGE = 'Having trouble?';

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Gate for a click-to-play embed (YouTube / Spotify).
 *
 * Attempt-first: `navigator.onLine === false` only adds a hint, the tap still
 * mounts the player (the flag is a hint, not proof of no connectivity).
 *
 * With an `embedOrigin` the player lives in our wrapper page, which posts
 * `{ type: 'embed-ready' | 'embed-error' }` to its parent once the PROVIDER
 * reports ready / failed (YouTube onReady/onError, Spotify's ready message).
 * Messages count only when `event.source` is this iframe's window and
 * `event.origin` is the wrapper's origin. An error restores a retryable
 * poster; silence past `EMBED_READY_BOUND_MS` only surfaces a reload control.
 * The iframe is never torn down on a timer. With no `embedOrigin` (website,
 * direct provider iframe) there is no handshake and no timer.
 */
export function useEmbedGate(startPlaying = false, embedOrigin?: string) {
  const [playing, setPlaying] = useState(startPlaying);
  const [notice, setNotice] = useState<string | null>(() =>
    startPlaying && isOffline() ? EMBED_OFFLINE_MESSAGE : null,
  );
  const [stalled, setStalled] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const origin = originOf(embedOrigin);

  const fail = useCallback(() => {
    setPlaying(false);
    setStalled(false);
    setNotice(EMBED_FAILED_MESSAGE);
  }, []);

  const play = useCallback(() => {
    ready.current = false;
    setStalled(false);
    setNotice(isOffline() ? EMBED_OFFLINE_MESSAGE : null);
    setPlaying(true);
  }, []);

  const reload = useCallback(() => {
    ready.current = false;
    setStalled(false);
    setReloadKey((k) => k + 1);
  }, []);

  const onLoad = useCallback(() => {
    if (!origin) ready.current = true;
  }, [origin]);

  useEffect(() => {
    if (!playing || !origin) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow || e.origin !== origin) return;
      const type = (e.data as { type?: unknown } | null)?.type;
      if (type === 'embed-ready') {
        ready.current = true;
        setStalled(false);
      } else if (type === 'embed-error') {
        fail();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playing, origin, fail, reloadKey]);

  useEffect(() => {
    if (!playing || !origin) return;
    const t = window.setTimeout(() => {
      if (!ready.current) setStalled(true);
    }, EMBED_READY_BOUND_MS);
    return () => window.clearTimeout(t);
  }, [playing, origin, reloadKey]);

  useEffect(() => {
    const onOnline = () => setNotice((n) => (n === EMBED_OFFLINE_MESSAGE ? null : n));
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return { playing, notice, stalled, reloadKey, iframeRef, play, reload, onLoad, onError: fail };
}

/** Small inline message shown under a poster/player after an offline hint, failure or stall. */
export function EmbedNotice({
  message,
  stalled = false,
  onReload,
}: {
  message: string | null;
  stalled?: boolean;
  onReload?: () => void;
}) {
  if (!message && !stalled) return null;
  return (
    <p role="status" className="mt-2 text-center text-xs text-[color:var(--era-ink-soft)]">
      {message}
      {stalled && (
        <>
          {message ? ' ' : ''}
          {EMBED_STALLED_MESSAGE}{' '}
          <button type="button" onClick={onReload} className="underline">
            Reload
          </button>
        </>
      )}
    </p>
  );
}
