'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Sparkles, Share2, ArrowRight, Route } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getContentItem } from '@/lib/longlive/content';
import { getEra } from '@/lib/longlive/eras';
import { resolveMotifTrail, type MotifTarget } from '@/lib/longlive/related';
import { TAG_META } from '@/lib/longlive/tags';
import { eraStyle } from '@/lib/longlive/theme';
import { MomentVideo } from './MomentVideo';
import type { Confidence } from '@/lib/longlive/types';

// At/above this tier a moment is established fact — no pill. Below it, a
// confidence pill renders so a claim never reads as unqualified fact.
const CONFIRMED_TIER: ReadonlySet<Confidence> = new Set(['official', 'confirmed_interview']);
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  official: 'Official',
  confirmed_interview: 'Confirmed',
  reputable_reporting: 'Reported',
  strong_fan_consensus: 'Fan consensus',
  plausible: 'Plausible',
  clowning: 'Clowning',
  disproven: 'Disproven',
  joke_meme: 'Joke / meme',
};

export function MomentDetail() {
  const { openItemId, share } = useAppState();
  const { closeItem, openShare } = useAppActions();
  const [revealed, setRevealed] = useState(false);

  const item = openItemId ? getContentItem(openItemId) : undefined;

  // Reset the clue reveal whenever a new item opens; lock body scroll.
  // Only if the id actually resolves — a stale/bad ?item= deep link
  // shouldn't lock scrolling on a modal that never renders.
  useEffect(() => {
    setRevealed(false);
    if (item) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [item]);

  // Close on Escape — but not while the share sheet is open on top of us;
  // that overlay owns Escape until it closes itself.
  useEffect(() => {
    if (!openItemId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) closeItem();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openItemId, closeItem, share]);

  if (!item) return null;
  const era = getEra(item.eraId);
  // Clue Web trail this moment cross-links to (via relatedIds), if any.
  // Resolution is best-effort: no resolvable target simply means no link.
  const trail = resolveMotifTrail(item.relatedIds);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
    >
      {/* Hero image */}
      <div className="relative h-[42vh] min-h-64 w-full">
        <Image src={item.image || '/placeholder.svg'} alt="" fill priority className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 20%, transparent), var(--era-bg))',
          }}
        />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={() => openShare({ kind: 'item', itemId: item.id })}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Share this moment"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={closeItem}
            className="era-icon-btn rounded-full p-2 backdrop-blur-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <article className="relative z-10 mx-auto -mt-10 max-w-2xl px-5 pb-24">
        <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          {era.name} · {item.dateLabel}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {item.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `hsl(${TAG_META[t].hue} / 0.16)`,
                color: `hsl(${TAG_META[t].hue})`,
              }}
            >
              {TAG_META[t].label}
            </span>
          ))}
          {item.confidence && !CONFIRMED_TIER.has(item.confidence) && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[color:var(--era-ink-soft)]"
              style={{ borderColor: 'var(--era-line)' }}
            >
              {CONFIDENCE_LABEL[item.confidence]}
            </span>
          )}
        </div>

        <div className="mt-7 space-y-4 text-lg leading-relaxed text-[color:var(--era-ink)]">
          {item.body.map((para, i) => (
            <p key={i} className="text-pretty">
              {para}
            </p>
          ))}
        </div>

        {item.video && <MomentVideo video={item.video} />}

        {item.sources && item.sources.length > 0 && (
          <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
            <p className="text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
              {item.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
              {item.sources.map((s, i) => (
                <span key={`${s.url}-${i}`}>
                  {i > 0 && ', '}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                  >
                    {s.name}
                  </a>
                </span>
              ))}
            </p>
          </div>
        )}

        {item.hiddenClue && (
          <div className="era-card mt-8 rounded-2xl border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
              <Sparkles className="h-4 w-4" />
              Hidden clue
            </div>
            <p className="mt-2 text-[15px] italic leading-relaxed text-[color:var(--era-ink)]">
              “{item.hiddenClue.clue}”
            </p>
            {revealed ? (
              <div className="clue-reveal">
                <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
                  {item.hiddenClue.payoff}
                </p>
                {/* Decoded — now hand the visitor the thread it belongs to. */}
                <ClueWebCta trail={trail} />
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="era-btn-ghost mt-4 rounded-full px-4 py-2 text-sm font-medium"
              >
                Decode it
              </button>
            )}
          </div>
        )}

        {/* A moment can cross-link into a Clue Web trail without carrying its
            own hidden clue — give it the same invitation as its own card. */}
        {!item.hiddenClue && trail && (
          <div className="era-card mt-8 rounded-2xl border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
              <Route className="h-4 w-4" />
              Part of a bigger pattern
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink-soft)]">
              This moment belongs to the “{trail.motif.label}” trail — {trail.motif.blurb}
            </p>
            <ClueWebCta trail={trail} />
          </div>
        )}
      </article>
    </div>
  );
}

/**
 * The moment → Clue Web jump. With a resolved trail (from relatedIds) it opens
 * the Clue Web directly on that motif's trail; without one it falls back to a
 * plain "Explore the Clue Web" invitation (Clue Web home) — never a dead link.
 */
function ClueWebCta({ trail }: { trail: MotifTarget | null }) {
  const { openClueWebTrail, openThread } = useAppActions();
  return (
    <button
      onClick={() => {
        if (trail) openClueWebTrail(trail.motifId);
        else openThread('easter-eggs');
        // Same instant re-anchor every era → thread pivot uses (EraSection) —
        // deferred a frame so it lands after this overlay's scroll lock lifts.
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      }}
      className="era-btn-ghost mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
      aria-label={
        trail
          ? `Follow the ${trail.motif.label} trail in the Clue Web`
          : 'Explore the Clue Web'
      }
    >
      {trail ? 'Follow this thread in the Clue Web' : 'Explore the Clue Web'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
