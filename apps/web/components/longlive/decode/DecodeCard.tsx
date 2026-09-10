'use client';

import {
  Unlock,
  Lock,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Hash,
  Gem,
  Quote,
  User,
  GitBranch,
  Sparkles,
  Landmark,
  ArrowDown,
  type LucideIcon,
} from 'lucide-react';
import { getEra } from '@swift2/experience';
import { erasBetween, gapYears } from '@/lib/longlive/decode';
import { DECODE_MOTIF_META, type CluePair, type DecodeMotifId } from '@swift2/experience';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

const MOTIF_ICON: Record<DecodeMotifId, LucideIcon> = {
  number: Hash,
  object: Gem,
  lyric: Quote,
  name: User,
  structural: GitBranch,
  theme: Sparkles,
  political: Landmark,
};

export function DecodeCard({
  clue,
  revealed,
  onToggle,
  highlightEra,
}: {
  clue: CluePair;
  revealed: boolean;
  onToggle: () => void;
  highlightEra: string | null;
}) {
  const plantEra = getEra(clue.plant.eraId);
  const payoffEra = getEra(clue.payoff.eraId);
  const plantColor = plantEra.theme.accent;
  const payoffColor = payoffEra.theme.accent;

  const MotifIcon = clue.motif ? MOTIF_ICON[clue.motif] : null;
  const motifLabel = clue.motif ? DECODE_MOTIF_META[clue.motif].label : null;

  const isHighlighted = Boolean(highlightEra) && (clue.plant.eraId === highlightEra || clue.payoff.eraId === highlightEra);

  const gap = gapYears(clue);
  const isEpic = gap >= 12;
  const isLong = gap >= 5 && !isEpic;

  const journey = erasBetween(clue.plant.eraId, clue.payoff.eraId);
  const erasSpanned = journey.length;

  const gapText = gap === 0 ? 'Same year' : gap === 1 ? '1 year' : `${gap} years`;
  const hook = clue.hook ?? clue.title;
  const verdict = clue.verdict ?? clue.connection;

  // Let the mobile back-swipe gesture hide a revealed payoff instead of
  // leaving the app — same pattern as the app's other overlays. Cards can
  // stack (multiple revealed at once); useBackDismiss's shared stack
  // dismisses the most-recently-revealed one first.
  useBackDismiss(revealed, onToggle);

  return (
    <article
      id={`decode-card-${clue.id}`}
      className="group relative overflow-hidden rounded-2xl transition-all duration-300"
      style={{ background: 'var(--era-surface)', border: `1px solid ${isHighlighted ? plantColor : 'var(--era-line)'}`, boxShadow: isHighlighted ? `0 0 0 1.5px ${plantColor}` : 'none' }}
    >
      {/* HERO: the plant, dramatized */}
      <div className="relative overflow-hidden px-5 pb-6 pt-5" style={{ background: `linear-gradient(160deg, ${plantColor}26 0%, ${plantColor}0d 45%, transparent 100%)` }}>
        <div className="absolute bottom-0 left-0 top-0 w-1" style={{ background: plantColor }} />

        {MotifIcon && (
          <MotifIcon size={isEpic ? 150 : 120} className="pointer-events-none absolute -right-6 -top-6" style={{ color: plantColor, opacity: 0.09 }} strokeWidth={1} />
        )}

        <div className="relative mb-3 flex flex-wrap items-center gap-2">
          {MotifIcon && motifLabel && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${plantColor}26`, color: plantColor }}>
              <MotifIcon size={11} />
              {motifLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--era-surface-2)', color: 'var(--era-ink-soft)' }}>
            <span className="inline-block h-2 w-2 flex-none rounded-full" style={{ background: plantColor }} />
            {plantEra.shortName} · {clue.plant.dateLabel}
          </span>
          {clue.confirmed ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'color-mix(in srgb, var(--era-accent) 15%, transparent)', color: 'var(--era-accent)' }}>
              <CheckCircle2 size={10} />
              Confirmed
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--era-surface-2)', color: 'var(--era-ink-soft)' }}>
              <HelpCircle size={10} />
              Fan theory
            </span>
          )}
        </div>

        <h2
          className={['relative text-balance font-bold tracking-tight', isEpic ? 'text-2xl leading-tight' : isLong ? 'text-xl leading-snug' : 'text-lg leading-snug'].join(' ')}
          style={{ color: 'var(--era-ink)', fontFamily: 'var(--era-font, inherit)' }}
        >
          {hook}
        </h2>

        {clue.plant.line && <Receipt line={clue.plant.line} cite={clue.plant.lineCite} color={plantColor} className="mt-4" />}

        <p className="relative mt-3 text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
          {clue.plant.what}
        </p>
      </div>

      {/* JOURNEY: the wait, made visible */}
      <div className="px-5 py-3.5" style={{ background: 'var(--era-surface-2)' }}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: isEpic ? plantColor : 'var(--era-ink-soft)' }}>
            {gapText}
            {erasSpanned > 1 ? ` · ${erasSpanned} eras` : ''}
          </span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
            {gap === 0 ? 'planted & paid off' : 'the wait'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {journey.map((eraId, i) => {
            const era = getEra(eraId);
            const isEnd = i === 0 || i === journey.length - 1;
            return (
              <div key={eraId} className="flex min-w-0 items-center gap-1">
                <span
                  title={era.shortName}
                  className="flex-none rounded-full transition-transform"
                  style={{ background: era.theme.accent, width: isEnd ? 11 : 7, height: isEnd ? 11 : 7, opacity: isEnd ? 1 : 0.5, outline: isEnd ? `2px solid ${era.theme.accent}33` : 'none' }}
                />
                {i < journey.length - 1 && <span className="h-px min-w-2 flex-1" style={{ background: 'var(--era-line)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYOFF */}
      <div className="px-5 pb-5 pt-4">
        {revealed ? (
          <div className="space-y-4">
            {clue.plant.line && clue.payoff.line ? (
              <div className="rounded-xl p-4" style={{ background: 'var(--era-surface-2)', border: '1px solid var(--era-line)' }}>
                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
                  The echo
                </div>
                <Receipt line={clue.plant.line} cite={clue.plant.lineCite} color={plantColor} compact />
                <div className="my-2 flex items-center gap-2 pl-1">
                  <ArrowDown size={13} style={{ color: 'var(--era-ink-soft)' }} />
                  <span className="h-px flex-1" style={{ background: 'var(--era-line)' }} />
                </div>
                <Receipt line={clue.payoff.line} cite={clue.payoff.lineCite} color={payoffColor} compact />
              </div>
            ) : clue.payoff.line ? (
              <Receipt line={clue.payoff.line} cite={clue.payoff.lineCite} color={payoffColor} />
            ) : null}

            <div className="relative overflow-hidden rounded-xl p-4" style={{ background: `linear-gradient(160deg, ${payoffColor}1f 0%, transparent 90%)`, border: `1px solid ${payoffColor}40` }}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: payoffColor }}>
                  The payoff
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${payoffColor}26`, color: payoffColor }}>
                  <span className="inline-block h-2 w-2 flex-none rounded-full" style={{ background: payoffColor }} />
                  {payoffEra.shortName} · {clue.payoff.dateLabel}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--era-ink)' }}>
                {clue.payoff.what}
              </p>
            </div>

            <p className="text-pretty px-1 text-base font-semibold leading-snug" style={{ color: 'var(--era-ink)', fontFamily: 'var(--era-font, inherit)' }}>
              {verdict}
            </p>

            <details className="group/details">
              <summary className="inline-flex list-none cursor-pointer items-center gap-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--era-accent)' }}>
                How the thread connects
              </summary>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--era-ink-soft)' }}>
                {clue.connection}
              </p>
            </details>

            {clue.sources.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-0.5">
                {clue.sources.map((s, i) => (
                  <a
                    key={`${s.url}-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] underline underline-offset-2 opacity-60 transition-opacity hover:opacity-100"
                    style={{ color: 'var(--era-ink-soft)' }}
                  >
                    <ExternalLink size={9} />
                    {s.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <LockedPayoff eraLabel={payoffEra.shortName} eraColor={payoffColor} teaseLine={Boolean(clue.payoff.line)} />
        )}

        <button
          onClick={onToggle}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
          style={revealed ? { background: 'var(--era-surface-2)', color: 'var(--era-ink-soft)' } : { background: plantColor, color: 'var(--era-bg)' }}
        >
          {revealed ? (
            <>
              <Lock size={14} />
              Hide the payoff
            </>
          ) : (
            <>
              <Unlock size={14} />
              Decode the payoff
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function Receipt({ line, cite, color, compact = false, className = '' }: { line: string; cite?: string; color: string; compact?: boolean; className?: string }) {
  return (
    <figure className={`relative ${className}`} style={{ borderLeft: `3px solid ${color}`, paddingLeft: '0.875rem' }}>
      <blockquote className={['text-balance font-medium', compact ? 'text-sm leading-snug' : 'text-lg leading-snug'].join(' ')} style={{ color: 'var(--era-ink)', fontFamily: 'var(--era-font, inherit)' }}>
        {`“${line}”`}
      </blockquote>
      {cite && (
        <figcaption className="mt-1 text-[11px] uppercase tracking-wider" style={{ color }}>
          {cite}
        </figcaption>
      )}
    </figure>
  );
}

function LockedPayoff({ eraLabel, eraColor, teaseLine }: { eraLabel: string; eraColor: string; teaseLine: boolean }) {
  return (
    <div aria-hidden className="w-full select-none rounded-xl border border-dashed p-4 text-left" style={{ borderColor: 'var(--era-line)', background: 'var(--era-surface-2)' }}>
      <div className="mb-3 flex items-center gap-2">
        <Lock size={12} style={{ color: 'var(--era-ink-soft)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
          The payoff
        </span>
        <span className="select-none rounded-full px-2 py-0.5 text-[11px] blur-[3px]" style={{ background: `${eraColor}26`, color: eraColor }}>
          {eraLabel}
        </span>
      </div>
      {teaseLine ? (
        <div className="select-none text-lg font-medium leading-snug blur-[6px]" style={{ color: 'var(--era-ink)', fontFamily: 'var(--era-font, inherit)' }}>
          {'“The line that finishes the thread”'}
        </div>
      ) : (
        <div className="space-y-2">
          {[92, 78, 60].map((w, i) => (
            <div key={i} className="h-2.5 animate-pulse rounded-full" style={{ width: `${w}%`, background: 'var(--era-line)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
