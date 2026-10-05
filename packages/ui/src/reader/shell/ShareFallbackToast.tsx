'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { Copy, X as XIcon } from 'lucide-react';
import { useHost } from '../../host/context';
import type { WebSharePayload } from '../lib/share-action';

const EVENT_NAME = 'longlive-share-fallback';

export function ShareFallbackToast() {
  const host = useHost();
  const [payload, setPayload] = useState<(WebSharePayload & { copied: boolean }) | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onFallback = (event: Event) =>
      setPayload((event as CustomEvent<WebSharePayload & { copied: boolean }>).detail);
    window.addEventListener(EVENT_NAME, onFallback);
    return () => window.removeEventListener(EVENT_NAME, onFallback);
  }, []);

  useEffect(() => {
    if (!payload || paused) return;
    const timeout = window.setTimeout(() => setPayload(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [payload, paused]);

  if (!payload) return null;
  const openVia = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!host.openExternal) return;
    event.preventDefault();
    host.openExternal(event.currentTarget.href);
  };
  const message = encodeURIComponent(`${payload.text} ${payload.url}`);
  return (
    <aside
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      className="fixed bottom-24 right-4 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[color:var(--era-ink)]">{payload.copied ? 'Link copied' : 'Share link ready'}</p>
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            setPaused(false);
            setPayload(null);
          }}
          className="era-btn-ghost -mr-1 -mt-1 rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">
        {payload.copied ? 'Share it directly, or choose an option below.' : 'Select the link, or choose a direct share option below.'}
      </p>
      <input
        readOnly
        value={payload.url}
        aria-label="Share link"
        onClick={(event) => event.currentTarget.select()}
        onFocus={(event) => event.currentTarget.select()}
        className="mt-3 w-full rounded-lg border border-[color:var(--era-line)] bg-[color:var(--era-bg)] px-2 py-1.5 text-xs text-[color:var(--era-ink)]"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            (host.clipboard ?? navigator.clipboard)
              ?.writeText(payload.url)
              .then(() => setPayload((current) => (current ? { ...current, copied: true } : current)))
              .catch(() => undefined)
          }
          className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm"
        >
          <Copy className="size-4" /> Copy link
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${message}`}
          target="_blank"
          rel="noreferrer"
          onClick={openVia}
          className="era-btn-ghost rounded-full px-3 py-2 text-sm"
        >
          X
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(payload.title)}&body=${message}`} onClick={openVia} className="era-btn-ghost rounded-full px-3 py-2 text-sm">
          Email
        </a>
      </div>
    </aside>
  );
}
