'use client';

import { useEffect, useState, useMemo } from 'react';
import { Filter, ArrowUpDown, CheckCircle2, Layers, ChevronDown, ChevronUp, TrendingUp, X } from 'lucide-react';
import { useAppState } from '@/lib/longlive/store';
import { getEra, eraIndex } from '@swift2/experience';
import { CLUE_PAIRS } from '@swift2/experience';
import { gapYears } from '@/lib/longlive/decode';
import type { CluePair } from '@swift2/experience';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { DecodeCard } from './DecodeCard';
import { PatternRail } from './PatternRail';
import { StatBar } from './StatBar';

type SortKey = 'gap-desc' | 'gap-asc' | 'plant-asc' | 'payoff-asc';
type FilterConfirmed = 'all' | 'confirmed' | 'theory';
type FilterEra = 'all' | string;

function sortClues(clues: CluePair[], key: SortKey): CluePair[] {
  return [...clues].sort((a, b) => {
    if (key === 'gap-desc') return gapYears(b) - gapYears(a);
    if (key === 'gap-asc') return gapYears(a) - gapYears(b);
    if (key === 'plant-asc') return a.plant.date.localeCompare(b.plant.date);
    if (key === 'payoff-asc') return a.payoff.date.localeCompare(b.payoff.date);
    return 0;
  });
}

function filterClues(clues: CluePair[], confirmed: FilterConfirmed, era: FilterEra): CluePair[] {
  return clues.filter((c) => {
    if (confirmed === 'confirmed' && !c.confirmed) return false;
    if (confirmed === 'theory' && c.confirmed) return false;
    if (era !== 'all' && c.plant.eraId !== era && c.payoff.eraId !== era) return false;
    return true;
  });
}

/**
 * The Decode thread: clues planted in one era, payoffs that arrive years
 * later. Keeps the plant→payoff reveal-on-tap mechanic from the original
 * implementation; adds sort, filter (status + era), a pattern rail replacing
 * the career scrubber (see PatternRail's own doc comment for why), and a
 * gap leaderboard.
 */
export function DecodeThread({ clues = CLUE_PAIRS }: { clues?: CluePair[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('plant-asc');
  const [filterConfirmed, setFilterConfirmed] = useState<FilterConfirmed>('all');
  const [filterEra, setFilterEra] = useState<FilterEra>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const { share } = useAppState();

  // Escape dismisses the top-most in-thread layer (#525), matching the click
  // affordances: the filter panel first, then the era-filter chip's X. The
  // share sheet owns Escape while it is open on top.
  useEffect(() => {
    if (!showFilters && activeHighlight === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || share) return;
      if (showFilters) setShowFilters(false);
      else setActiveHighlight(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFilters, activeHighlight, share]);

  // Let the mobile back-swipe gesture dismiss the same two layers as Escape
  // above instead of leaving the app — same shared-stack pattern DecodeCard
  // uses for revealed payoffs, most-recently-opened layer closes first.
  useBackDismiss(showFilters, () => setShowFilters(false));
  useBackDismiss(activeHighlight !== null, () => setActiveHighlight(null));

  const allErasInData = useMemo(() => {
    const ids = new Set<string>();
    for (const c of clues) {
      ids.add(c.plant.eraId);
      ids.add(c.payoff.eraId);
    }
    return Array.from(ids).sort((a, b) => eraIndex(a) - eraIndex(b));
  }, [clues]);

  const processed = useMemo(() => {
    const era = activeHighlight ?? filterEra;
    return sortClues(filterClues(clues, filterConfirmed, era), sortKey);
  }, [clues, sortKey, filterConfirmed, filterEra, activeHighlight]);

  const longestGap = useMemo(() => Math.max(0, ...clues.map((c) => gapYears(c))), [clues]);
  const confirmedCount = clues.filter((c) => c.confirmed).length;
  const theoryCount = clues.length - confirmedCount;

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRailEraClick(eraId: string) {
    setActiveHighlight((prev) => (prev === eraId ? null : eraId));
    setFilterEra('all');
  }

  const activeEraLabel = activeHighlight ? getEra(activeHighlight).shortName : null;

  return (
    <div className="relative">
      <PatternRail clues={clues} activeEra={activeHighlight} onEraClick={handleRailEraClick} />

      <div className="md:pl-16">
        <div className="mb-6 flex items-start justify-between gap-3">
          <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
            Clues planted in one era. Payoffs that arrive years later. Tap any pair to reveal the connection.
          </p>
          <button
            aria-label="Toggle filters"
            onClick={() => setShowFilters((v) => !v)}
            className="era-btn-ghost flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all"
            style={{ background: showFilters ? 'var(--era-accent)' : 'var(--era-surface)', color: showFilters ? 'var(--era-bg)' : 'var(--era-ink)' }}
          >
            <Filter size={14} />
            Filter
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <StatBar total={clues.length} confirmed={confirmedCount} theories={theoryCount} longestGap={longestGap} shown={processed.length} />

        {activeEraLabel && (
          <div className="mb-4 mt-4 flex items-center gap-2">
            <span className="era-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs" style={{ background: 'var(--era-surface-2)', color: 'var(--era-ink)' }}>
              <Layers size={11} />
              Filtered: {activeEraLabel}
            </span>
            <button onClick={() => setActiveHighlight(null)} className="rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100" style={{ color: 'var(--era-ink-soft)' }} aria-label="Clear era filter">
              <X size={13} />
            </button>
          </div>
        )}

        {showFilters && (
          <div className="mb-5 mt-4 space-y-4 rounded-xl border p-4" style={{ background: 'var(--era-surface)', borderColor: 'var(--era-line)' }}>
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
                <ArrowUpDown size={11} /> Sort
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'plant-asc', label: 'Oldest plant first' },
                    { key: 'gap-desc', label: 'Longest gap first' },
                    { key: 'gap-asc', label: 'Shortest gap first' },
                    { key: 'payoff-asc', label: 'Earliest payoff' },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className="rounded-lg border px-3 py-1.5 text-xs transition-all"
                    style={{
                      background: sortKey === key ? 'var(--era-accent)' : 'var(--era-surface-2)',
                      color: sortKey === key ? 'var(--era-bg)' : 'var(--era-ink)',
                      borderColor: sortKey === key ? 'var(--era-accent)' : 'var(--era-line)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
                <CheckCircle2 size={11} /> Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'confirmed', label: 'Confirmed' },
                    { key: 'theory', label: 'Fan theory' },
                  ] as { key: FilterConfirmed; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterConfirmed(key)}
                    className="rounded-lg border px-3 py-1.5 text-xs transition-all"
                    style={{
                      background: filterConfirmed === key ? 'var(--era-accent)' : 'var(--era-surface-2)',
                      color: filterConfirmed === key ? 'var(--era-bg)' : 'var(--era-ink)',
                      borderColor: filterConfirmed === key ? 'var(--era-accent)' : 'var(--era-line)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
                <Layers size={11} /> Era (plant or payoff)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterEra('all')}
                  className="rounded-lg border px-3 py-1.5 text-xs transition-all"
                  style={{ background: filterEra === 'all' ? 'var(--era-accent)' : 'var(--era-surface-2)', color: filterEra === 'all' ? 'var(--era-bg)' : 'var(--era-ink)', borderColor: filterEra === 'all' ? 'var(--era-accent)' : 'var(--era-line)' }}
                >
                  All eras
                </button>
                {allErasInData.map((eraId) => (
                  <button
                    key={eraId}
                    onClick={() => setFilterEra(eraId === filterEra ? 'all' : eraId)}
                    className="rounded-lg border px-3 py-1.5 text-xs transition-all"
                    style={{
                      background: filterEra === eraId ? 'var(--era-accent)' : 'var(--era-surface-2)',
                      color: filterEra === eraId ? 'var(--era-bg)' : 'var(--era-ink)',
                      borderColor: filterEra === eraId ? 'var(--era-accent)' : 'var(--era-line)',
                    }}
                  >
                    {getEra(eraId).shortName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <GapLeaderboard
          clues={clues}
          onSelect={(id) => {
            const el = document.getElementById(`decode-card-${id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        />

        <div className="mt-5 space-y-4">
          {processed.length === 0 && (
            <div className="rounded-xl p-8 text-center text-sm" style={{ background: 'var(--era-surface)', color: 'var(--era-ink-soft)' }}>
              No clues match this filter combination.
            </div>
          )}
          {processed.map((clue) => (
            <DecodeCard key={clue.id} clue={clue} revealed={revealedIds.has(clue.id)} onToggle={() => toggleReveal(clue.id)} highlightEra={activeHighlight} />
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
        Clues compiled from public reporting by an independent fan project. "Fan theory" tags mark connections Taylor has not confirmed.
      </p>
    </div>
  );
}

function GapLeaderboard({ clues, onSelect }: { clues: CluePair[]; onSelect: (id: string) => void }) {
  const sorted = useMemo(() => [...clues].sort((a, b) => gapYears(b) - gapYears(a)).slice(0, 5), [clues]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
        <TrendingUp size={11} />
        Longest gaps
      </div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {sorted.map((clue, i) => {
          const gap = gapYears(clue);
          return (
            <button
              key={clue.id}
              onClick={() => onSelect(clue.id)}
              className="flex flex-none items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--era-surface)', borderColor: 'var(--era-line)', color: 'var(--era-ink)', minWidth: 160, maxWidth: 200 }}
            >
              <span className="flex-none text-lg font-bold leading-none" style={{ color: 'var(--era-accent)' }}>
                #{i + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{clue.title}</span>
                <span className="mt-0.5 block text-[11px]" style={{ color: 'var(--era-ink-soft)' }}>
                  {gap === 0 ? 'Same era' : `${gap}yr gap`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
