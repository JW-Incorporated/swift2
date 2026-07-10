'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLOSSARY, getGlossaryEntry } from '@/lib/longlive/glossary';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import type { GlossaryEntry } from '@/lib/longlive/types';

/**
 * The glossary drawer (audit T7 / §E.10): the app's own vocabulary —
 * "thread", "crossing", "motif trail", "vault track" — defined in plain
 * language so nothing on screen is assumed knowledge. Slides in from the
 * right (full-width sheet on small screens); opens from the TopBar book
 * button, the footer link, or a glossary search result (which passes an
 * entry id to scroll to). Data is hand-authored UI vocabulary in
 * lib/longlive/glossary.ts — static, no fetch.
 *
 * Theming: rendered inside the era shell, so the `--era-*` variables track
 * the active era (or the Threads vault palette) automatically.
 */
export function GlossaryDrawer() {
  const { glossary, searchOpen } = useAppState();
  const { closeGlossary } = useAppActions();
  const open = glossary != null;

  // The entry currently highlighted (from a search result or a see-also
  // chip). Local so chip clicks don't round-trip through the store.
  const [focusId, setFocusId] = useState<string | null>(null);
  const entryRefs = useRef(new Map<string, HTMLElement>());

  // Adopt the store's requested entry each time the drawer opens (or a new
  // search selection retargets an already-open drawer).
  useEffect(() => {
    if (open) setFocusId(glossary.entryId);
  }, [open, glossary]);

  // Scroll the focused entry into view once it's rendered.
  useEffect(() => {
    if (!open || !focusId) return;
    entryRefs.current.get(focusId)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [open, focusId]);

  // Esc closes — captured, so overlays underneath don't also close; skipped
  // while search is layered on top (search owns Esc until it closes itself).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || searchOpen) return;
      e.stopPropagation();
      closeGlossary();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, searchOpen, closeGlossary]);

  // Lock body scroll while open (mirrors the other overlays).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Let the mobile back-swipe gesture close the drawer instead of leaving the app.
  useBackDismiss(open, closeGlossary);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Glossary">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close glossary"
        onClick={closeGlossary}
        className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-sm"
      />

      {/* Drawer panel */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[color:var(--era-line)] bg-[color:var(--era-bg)] text-[color:var(--era-ink)] shadow-2xl detail-enter">
        <header className="flex items-start justify-between gap-3 border-b border-[color:var(--era-line)] px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
              <BookOpen className="h-3.5 w-3.5 text-[color:var(--era-accent)]" aria-hidden />
              Glossary
            </p>
            <h2 className="mt-1 font-[family-name:var(--era-font)] text-2xl font-semibold">
              How to read the vault
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
              Every word this app uses, in plain language — nothing here is assumed knowledge.
            </p>
          </div>
          <button
            type="button"
            onClick={closeGlossary}
            aria-label="Close glossary"
            className="era-icon-btn shrink-0 rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <dl className="space-y-5">
            {GLOSSARY.map((entry) => (
              <GlossaryRow
                key={entry.id}
                entry={entry}
                highlighted={entry.id === focusId}
                refCallback={(el) => {
                  if (el) entryRefs.current.set(entry.id, el);
                  else entryRefs.current.delete(entry.id);
                }}
                onJump={setFocusId}
              />
            ))}
          </dl>
          <p className="mt-8 border-t border-[color:var(--era-line)] pt-4 text-[11px] leading-relaxed text-[color:var(--era-ink-soft)]">
            These definitions describe how this fan-made app uses each word — they are navigation
            help, not official terminology.
          </p>
        </div>
      </aside>
    </div>
  );
}

function GlossaryRow({
  entry,
  highlighted,
  refCallback,
  onJump,
}: {
  entry: GlossaryEntry;
  highlighted: boolean;
  refCallback: (el: HTMLElement | null) => void;
  onJump: (id: string) => void;
}) {
  const seeAlso = (entry.seeAlso ?? [])
    .map((id) => getGlossaryEntry(id))
    .filter((e): e is GlossaryEntry => e != null);

  return (
    <div
      ref={refCallback}
      className={cn(
        'scroll-mt-4 rounded-xl p-3 transition-colors',
        highlighted && 'bg-[color:var(--era-surface)] ring-1 ring-[color:var(--era-accent)]',
      )}
    >
      <dt className="font-[family-name:var(--era-font)] text-base font-semibold">{entry.term}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        {entry.definition}
        {entry.example && (
          <span className="mt-1.5 block border-l-2 border-[color:var(--era-accent)]/50 pl-2.5 text-xs italic">
            {entry.example}
          </span>
        )}
        {seeAlso.length > 0 && (
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider">See also</span>
            {seeAlso.map((ref) => (
              <button
                key={ref.id}
                type="button"
                onClick={() => onJump(ref.id)}
                className="era-chip rounded-full px-2 py-0.5 text-[11px] font-medium"
              >
                {ref.term}
              </button>
            ))}
          </span>
        )}
      </dd>
    </div>
  );
}
