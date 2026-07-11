'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { ERAS } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

export function EraSelector() {
  const { selectorOpen, eraId } = useAppState();
  const { setEra, setSelectorOpen } = useAppActions();

  useEffect(() => {
    if (!selectorOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [selectorOpen, setSelectorOpen]);

  // Let the mobile back-swipe gesture close the selector instead of leaving the app.
  useBackDismiss(selectorOpen, () => setSelectorOpen(false));

  if (!selectorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[color:var(--era-bg)]/95 backdrop-blur-xl detail-enter">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--era-font)] text-2xl font-semibold">
              Choose an era
            </h2>
            <p className="mt-1 text-sm text-[color:var(--era-ink-soft)]">
              Twelve chapters, newest first. Tap one to step inside.
            </p>
          </div>
          <button
            onClick={() => setSelectorOpen(false)}
            className="era-icon-btn rounded-full p-2"
            aria-label="Close era selector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...ERAS].reverse().map((era, i) => {
            const active = era.id === eraId;
            return (
              <button
                key={era.id}
                onClick={() => setEra(era.id)}
                style={{ ...eraStyle(era), animationDelay: `${i * 40}ms` }}
                className="era-tile group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left"
                data-active={active}
              >
                <Image
                  src={era.image || '/placeholder.svg'}
                  alt=""
                  fill
                  className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, var(--era-bg), color-mix(in srgb, var(--era-bg) 10%, transparent))',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div
                    className="mb-1 h-1 w-8 rounded-full"
                    style={{ backgroundColor: 'var(--era-accent)' }}
                  />
                  <div className="font-[family-name:var(--era-font)] text-lg font-semibold leading-tight text-[color:var(--era-ink)]">
                    {era.shortName}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                    {era.yearLabel}
                  </div>
                </div>
                {active && (
                  <span className="absolute right-2 top-2 rounded-full bg-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--era-bg)]">
                    Here
                  </span>
                )}
                {era.isCurrent && !active && (
                  <span className="absolute right-2 top-2 rounded-full border border-[color:var(--era-line)] bg-[color:var(--era-bg)]/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
                    Now
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
