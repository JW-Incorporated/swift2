'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Clapperboard,
  Compass,
  CornerDownLeft,
  Lightbulb,
  Music2,
  Search,
  Sparkles,
  Waypoints,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEra } from '@/lib/longlive/eras';
import {
  flattenGroups,
  getSearchIndex,
  searchDocs,
  type SearchDocType,
  type SearchResult,
  type SearchTarget,
} from '@/lib/longlive/search';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

/**
 * The search overlay (audit T7): a command-palette-style panel over the whole
 * app. Opens from the TopBar button, `/`, or Ctrl/Cmd+K; Esc closes. Queries
 * run against the client-side static index in lib/longlive/search.ts — no
 * backend, no fetch — debounced, ranked, grouped by content type. Selecting a
 * result closes search and navigates via the existing store actions, so
 * search adds zero new navigation surface.
 *
 * Theming: rendered inside the era shell, so `--era-*` vars already reflect
 * the active era (or the vault palette in Threads mode) — nothing to wire.
 */

const TYPE_ICON: Record<SearchDocType, typeof Search> = {
  era: Compass,
  moment: Sparkles,
  egg: Waypoints,
  theory: Lightbulb,
  track: Music2,
  video: Clapperboard,
  glossary: BookOpen,
};

/** Starter queries shown in the empty state — one per corner of the archive. */
const SUGGESTIONS = ['snake', 'vault', '13', 'crossing'];

const DEBOUNCE_MS = 120;

function optionId(key: string): string {
  // Doc keys contain spaces/quotes (track titles); ids must be CSS-safe.
  return `ll-search-opt-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

export function SearchOverlay() {
  const { searchOpen } = useAppState();
  const actions = useAppActions();
  const { setSearchOpen } = actions;

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcuts, mounted for the app's lifetime: `/` (and Ctrl/Cmd+K)
  // opens search — unless the user is typing somewhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
      const isCmdK = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey;
      if (!isSlash && !isCmdK) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  // Esc closes — captured on window so overlays *underneath* (moment detail,
  // track guide, …) don't also close on the same keypress.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [searchOpen, setSearchOpen]);

  // Lock body scroll while open (mirrors the other overlays).
  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  // Let the mobile back-swipe gesture close search instead of leaving the app.
  useBackDismiss(searchOpen, () => setSearchOpen(false));

  // Reset per-open state so search always starts fresh.
  useEffect(() => {
    if (!searchOpen) return;
    setQuery('');
    setDebounced('');
    setActiveIndex(0);
  }, [searchOpen]);

  // Debounce keystrokes → query. Cheap anyway (in-memory index), but this
  // keeps the results list from churning under fast typing.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const groups = useMemo(
    () => (debounced.trim() ? searchDocs(getSearchIndex(), debounced) : []),
    [debounced],
  );
  const flat = useMemo(() => flattenGroups(groups), [groups]);

  // Clamp the active row whenever the result set changes.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  // Keep the active row visible under keyboard navigation.
  const active = flat[activeIndex];
  useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active.doc.key))?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!searchOpen) return null;

  function select(target: SearchTarget) {
    setSearchOpen(false);
    switch (target.kind) {
      case 'moment':
        actions.openItem(target.itemId);
        break;
      case 'era':
        actions.openEra(target.eraId);
        break;
      case 'track-guide':
        actions.openTrackGuide(target.eraId);
        break;
      case 'theory-guide':
        actions.openTheoryGuide(target.eraId);
        break;
      case 'trail':
        actions.openClueWebTrail(target.motifId);
        break;
      case 'glossary':
        actions.openGlossary(target.entryId);
        break;
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length > 0) setActiveIndex((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length > 0) setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active) select(active.doc.target);
    }
  }

  const showEmptyHint = debounced.trim() === '';
  const showNoMatch = !showEmptyHint && flat.length === 0;
  let flatIndex = -1; // running index across groups, for active-row tracking

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center bg-black/60 p-4 pt-[max(4rem,10vh)] backdrop-blur-sm detail-enter sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Search the archive"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-bg)] text-[color:var(--era-ink)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-[color:var(--era-line)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--era-accent)]" aria-hidden />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            type="text"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="ll-search-results"
            aria-activedescendant={active ? optionId(active.doc.key) : undefined}
            aria-label="Search moments, songs, eggs, theories, videos, and glossary"
            placeholder="Search the archive…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[color:var(--era-ink-soft)]"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="era-icon-btn shrink-0 rounded-full p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results / states */}
        <div id="ll-search-results" role="listbox" aria-label="Search results" className="min-h-0 overflow-y-auto overscroll-contain">
          {showEmptyHint && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[color:var(--era-ink-soft)]">
                Moments, songs, Easter eggs, theories, videos, glossary — the whole archive.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="era-chip rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showNoMatch && (
            <p className="px-4 py-8 text-center text-sm text-[color:var(--era-ink-soft)]">
              No matches for “{debounced.trim()}” — try an era, a song, or a motif like “snake”.
            </p>
          )}

          {groups.map((group) => (
            <div key={group.type} role="group" aria-label={group.label}>
              <p
                role="presentation"
                className="sticky top-0 bg-[color:var(--era-bg)]/95 px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)] backdrop-blur-sm"
              >
                {group.label}
              </p>
              {group.results.map((result) => {
                flatIndex += 1;
                return (
                  <ResultRow
                    key={result.doc.key}
                    result={result}
                    isActive={flatIndex === activeIndex}
                    index={flatIndex}
                    onHover={setActiveIndex}
                    onSelect={select}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Key hints */}
        <div className="hidden items-center justify-end gap-4 border-t border-[color:var(--era-line)] px-4 py-2 text-[11px] text-[color:var(--era-ink-soft)] sm:flex">
          <span>
            <kbd className="rounded border border-[color:var(--era-line)] px-1">↑</kbd>{' '}
            <kbd className="rounded border border-[color:var(--era-line)] px-1">↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-[color:var(--era-line)] px-1">↵</kbd> open
          </span>
          <span>
            <kbd className="rounded border border-[color:var(--era-line)] px-1">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  result,
  isActive,
  index,
  onHover,
  onSelect,
}: {
  result: SearchResult;
  isActive: boolean;
  index: number;
  onHover: (index: number) => void;
  onSelect: (target: SearchTarget) => void;
}) {
  const { doc } = result;
  const Icon = TYPE_ICON[doc.type];
  return (
    <button
      type="button"
      id={optionId(doc.key)}
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(doc.target)}
      onMouseMove={() => onHover(index)}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors',
        isActive && 'bg-[color:var(--era-surface-2)]',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--era-accent)]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{doc.title}</span>
        <span className="block truncate text-xs text-[color:var(--era-ink-soft)]">{doc.snippet}</span>
      </span>
      {doc.eraId && (
        <span className="mt-0.5 hidden shrink-0 rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] text-[color:var(--era-ink-soft)] sm:inline">
          {getEra(doc.eraId).shortName}
        </span>
      )}
      {isActive && (
        <CornerDownLeft className="mt-1 hidden h-3.5 w-3.5 shrink-0 text-[color:var(--era-ink-soft)] sm:block" aria-hidden />
      )}
    </button>
  );
}
