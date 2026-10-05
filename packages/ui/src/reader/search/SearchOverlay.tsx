'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useScrollLock } from '../lib/useScrollLock';
import { useFocusTrap } from '../moment/lib/useFocusTrap';
import { Search, X } from 'lucide-react';
import { flattenGroups, searchDocs, type SearchTarget } from '@swift2/experience';
import { useReader } from '../../snapshot/context';
import { useAppActions, useAppState } from '../store';
import { useBackDismiss } from '../lib/useBackDismiss';
import { optionId } from './SearchResultRow';
import { SearchKeyHints, SearchResults } from './SearchResults';

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
 *
 * Share exemption (#707): this overlay has NO share button, deliberately.
 * Search is a transient command palette, not a shareable destination — the
 * query is the reader's own and lives only in this input, and every result it
 * lists is itself a shareable surface (selecting one opens a moment/era/guide
 * that carries its own Share button + deep link). Sharing "a search" would
 * either leak the reader's typed query or reopen an empty box. This is the
 * "arguably exempt — decide deliberately, don't skip silently" case the ticket
 * called out; the decision is exempt. (The EraSelector menu and the thread-
 * crossing overlay are exempt for the same transient-chooser reason.)
 */

const DEBOUNCE_MS = 120;

export function SearchOverlay() {
  const { searchOpen } = useAppState();
  const actions = useAppActions();
  const { searchIndex } = useReader();
  const { setSearchOpen } = actions;

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  // Enter means two different things depending on whether the reader has
  // picked a suggestion. `activeIndex` alone cannot tell them apart because it
  // defaults to 0, so Enter always fired the top hit — Wyatt, 2026-07-20: "if I
  // type something and hit enter without selecting a suggested result, it
  // should take me to a search results page, not just the top suggested
  // result." This tracks the explicit pick.
  const [pickedSuggestion, setPickedSuggestion] = useState(false);
  // Full results view: every match, no per-type cap.
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

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
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
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

  useScrollLock(searchOpen);
  useFocusTrap(searchOpen, dialogRef);

  // Let the mobile back-swipe gesture close search instead of leaving the app.
  useBackDismiss(searchOpen, () => setSearchOpen(false));

  // Reset per-open state so search always starts fresh.
  useEffect(() => {
    if (!searchOpen) return;
    setQuery('');
    setDebounced('');
    setActiveIndex(0);
    setPickedSuggestion(false);
    setShowAll(false);
  }, [searchOpen]);

  // Debounce keystrokes → query. Cheap anyway (in-memory index), but this
  // keeps the results list from churning under fast typing.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  // Editing the query is a new question: drop back to the shortlist and forget
  // any previous pick, so Enter means "search this" again rather than firing a
  // suggestion the reader chose for different text.
  useEffect(() => {
    setPickedSuggestion(false);
    setShowAll(false);
    setActiveIndex(0);
  }, [query]);

  const groups = useMemo(
    () =>
      debounced.trim()
        ? searchDocs(searchIndex, debounced, showAll ? Number.POSITIVE_INFINITY : undefined)
        : [],
    [searchIndex, debounced, showAll],
  );
  const totalMatches = useMemo(() => groups.reduce((n, g) => n + g.totalMatches, 0), [groups]);
  const flat = useMemo(() => flattenGroups(groups), [groups]);

  // Clamp the active row whenever the result set changes.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  // Toggling the results view moves focus to whichever button was clicked, and
  // every keyboard affordance here lives on the INPUT's onKeyDown — so once
  // focus leaves it, arrows scroll the list instead of navigating it and Enter
  // does nothing at all. Caught in the browser: after clicking "Back to top
  // matches", document.activeElement was BODY and the combobox was inert
  // (2026-07-21). Hand focus back so the keyboard path survives a mouse click.
  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus();
  }, [showAll, searchOpen]);

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
      case 'track':
        actions.openSong(target.eraId, target.trackKey);
        break;
      case 'theory-guide':
        actions.openTheoryGuide(target.eraId);
        break;
      case 'trail':
        actions.openClueWebTrail(target.motifId);
        break;
      case 'thread':
        actions.openThread(target.lensId);
        break;
      case 'video':
        actions.openVideo(target.eraId, target.videoId);
        break;
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length > 0) {
        setActiveIndex((i) => (i + 1) % flat.length);
        setPickedSuggestion(true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length > 0) {
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
        setPickedSuggestion(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Only a DELIBERATE pick opens that result. Bare Enter means "search",
      // and jumping to the top hit silently discarded the other 25 matches.
      if (pickedSuggestion && active) select(active.doc.target);
      else if (flat.length > 0) setShowAll(true);
    }
  }

  const showEmptyHint = debounced.trim() === '';
  const showNoMatch = !showEmptyHint && flat.length === 0;
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col items-center bg-black/60 p-4 pb-[max(1rem,calc(var(--keyboard-inset,0px)+var(--safe-bottom,env(safe-area-inset-bottom))))] pt-[max(4rem,10vh)] backdrop-blur-sm detail-enter sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Search the archive"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className={`flex max-h-full w-full flex-col overflow-hidden rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-bg)] text-[color:var(--era-ink)] shadow-2xl ${
          showAll ? 'max-w-3xl' : 'max-w-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-[color:var(--era-line)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--era-accent)]" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            type="text"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="ll-search-results"
            aria-activedescendant={active ? optionId(active.doc.key) : undefined}
            aria-label="Search moments, songs, eggs, theories, and videos"
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
        <SearchResults
          groups={groups}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          select={select}
          setQuery={setQuery}
          setShowAll={setShowAll}
          showAll={showAll}
          showEmptyHint={showEmptyHint}
          showNoMatch={showNoMatch}
          totalMatches={totalMatches}
          debounced={debounced}
        />

        <SearchKeyHints />
      </div>
    </div>
  );
}
