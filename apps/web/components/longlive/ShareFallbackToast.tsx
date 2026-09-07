'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import type { WebSharePayload } from '@/lib/longlive/share-action';

const EVENT_NAME = 'longlive-share-fallback';

export function ShareFallbackToast() {
  const [payload, setPayload] = useState<WebSharePayload | null>(null);

  useEffect(() => {
    const onFallback = (event: Event) => setPayload((event as CustomEvent<WebSharePayload>).detail);
    window.addEventListener(EVENT_NAME, onFallback);
    return () => window.removeEventListener(EVENT_NAME, onFallback);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const timeout = window.setTimeout(() => setPayload(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [payload]);

  if (!payload) return null;
  const message = encodeURIComponent(`${payload.text} ${payload.url}`);
  return (
    <aside
      aria-live="polite"
      className="fixed bottom-24 right-4 z-[70] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)] p-4 shadow-2xl"
    >
      <p className="font-semibold text-[color:var(--era-ink)]">Link copied</p>
      <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">Share it directly, or choose an option below.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(payload.url)}
          className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm"
        >
          <Copy className="size-4" /> Copy link
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="era-btn-ghost rounded-full px-3 py-2 text-sm"
        >
          X
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(payload.title)}&body=${message}`} className="era-btn-ghost rounded-full px-3 py-2 text-sm">
          Email
        </a>
      </div>
    </aside>
  );
}
