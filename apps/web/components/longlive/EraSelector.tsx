'use client';

import { useEffect, useRef } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';
import { X } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { EraGrid } from './EraGrid';

const selectorTitleId = 'era-selector-title';

export function EraSelector() {
  const { selectorOpen, eraId } = useAppState();
  const { setEra, setSelectorOpen } = useAppActions();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useScrollLock(selectorOpen);
  useFocusTrap(selectorOpen, dialogRef);

  useEffect(() => {
    if (!selectorOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectorOpen, setSelectorOpen]);

  // Let the mobile back-swipe gesture close the selector instead of leaving the app.
  useBackDismiss(selectorOpen, () => setSelectorOpen(false));

  if (!selectorOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={selectorTitleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-[color:var(--era-bg)]/95 backdrop-blur-xl detail-enter"
    >
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2
              id={selectorTitleId}
              className="font-[family-name:var(--era-font)] text-2xl font-semibold"
            >
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

        <EraGrid activeEraId={eraId} onPick={setEra} />
      </div>
    </div>
  );
}
