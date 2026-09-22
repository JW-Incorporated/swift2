'use client';

import { useEffect, useState } from 'react';
import { Flame, Timer } from 'lucide-react';
import type { CurrentItem, LiveTheory } from '@swift2/shared';
import { pickBannerCandidate } from '@swift2/experience';
import { useLiveTheories } from '@/lib/longlive/use-live-theories';

/**
 * The auto-pin banner (t_09dc269f's approved design, extended by
 * t_eee0c7f7's fast-follow to also accept a big fan theory): renders
 * full-width, sticky, above EraStream's masthead when there is EITHER a
 * live, still-open countdown (`current_item.countdownTargetAt`/
 * `countdownResolvedAt`, from the same rows EraStream already fetched via
 * `useCurrentItems`) OR a "big" fan theory (`live_theory.heat` over the
 * promotion threshold, `status` of `rumor` or better — see
 * `isBigTheory`/`pickBigTheoryBannerItem` in `@swift2/experience`'s
 * `current-feed.ts`). Still exactly ONE shared slot, never two banners:
 * `pickBannerCandidate` resolves both candidate types down to at most one
 * winner before this component ever renders anything.
 *
 * Fails soft, same contract as the rest of the Current tier
 * (`docs/decisions.md`'s Current-tier fail-soft rule, `use-current-items.ts`'s
 * header doc): no qualifying candidate of either type (empty items/theories,
 * nothing crosses its bar, or an upstream fetch failed and left either list
 * empty) means this renders nothing and nothing else on the page changes —
 * no loading state, no error state, just absent.
 *
 * `nowMs` is resolved client-side only (same SSR-safe swap-after-mount
 * pattern `LandingMasthead.tsx` uses for its own relative-time math) since
 * "is this countdown still live" depends on the reader's actual clock, not
 * server render time — the very first paint (server + hydration) always
 * renders nothing, then the banner appears once `nowMs` resolves if a
 * countdown candidate qualifies. That one-frame absence is the safe
 * default: it can never flash a STALE countdown as live before the client
 * clock is known. The theory candidate has no clock dependency, but stays
 * behind the same `nowMs` gate for a single consistent first-paint contract
 * (never a theory banner flash before a countdown has had its chance to
 * resolve and win the slot).
 */
export function CountdownBanner({ currentItems }: { currentItems: CurrentItem[] }) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
  }, []);
  // Always enabled: this banner is mounted once at EraStream's top level
  // (never per-era), same "fetch once regardless of which era is in view"
  // contract `currentItems` itself already has via `useCurrentItems`.
  const { theories } = useLiveTheories(true);

  if (nowMs == null) return null;
  const candidate = pickBannerCandidate(currentItems, theories, nowMs);
  if (!candidate) return null;

  return candidate.kind === 'countdown' ? (
    <CountdownSlot item={candidate.item} nowMs={nowMs} />
  ) : (
    <TheorySlot theory={candidate.theory} />
  );
}

function CountdownSlot({ item, nowMs }: { item: CurrentItem; nowMs: number }) {
  if (!item.countdownTargetAt) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-40 w-full border-b-2 px-5 py-3 text-center text-sm font-semibold"
      style={{
        borderColor: 'var(--era-accent)',
        background: 'var(--era-bg)',
        color: 'var(--era-ink)',
      }}
      data-ll-countdown-banner={item.id}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <Timer className="h-4 w-4 text-[color:var(--era-accent)]" aria-hidden />
        <span>{item.headline}</span>
        <CountdownClock targetIso={item.countdownTargetAt} nowMs={nowMs} />
      </span>
    </div>
  );
}

/** The big-theory candidate's rendering — same sticky single-slot shell as
 * `CountdownSlot`, a `Flame` glyph (matching `LiveTheoryCard`'s heat chip)
 * instead of a `Timer`, and the theory's name instead of a clock (a theory
 * has no deadline to count down to). */
function TheorySlot({ theory }: { theory: LiveTheory }) {
  return (
    <div
      role="status"
      className="sticky top-0 z-40 w-full border-b-2 px-5 py-3 text-center text-sm font-semibold"
      style={{
        borderColor: 'var(--era-accent)',
        background: 'var(--era-bg)',
        color: 'var(--era-ink)',
      }}
      data-ll-theory-banner={theory.id}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <Flame className="h-4 w-4 text-[color:var(--era-accent)]" aria-hidden />
        <span>Fans are onto something: {theory.name}</span>
      </span>
    </div>
  );
}

/** A plain "counting down to..." readout — no live-ticking timer (a static
 * label refreshed on each render is enough for a banner that re-renders on
 * every EraStream mount/navigation; a per-second ticking clock is
 * deliberately out of scope for this card). */
function CountdownClock({ targetIso, nowMs }: { targetIso: string; nowMs: number }) {
  const remainingMs = Date.parse(targetIso) - nowMs;
  if (remainingMs <= 0) return <span>· revealing now</span>;
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return <span>· {parts.join(' ')} left</span>;
}
