'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import type { CurrentItem } from '@swift2/shared';
import { pickCountdownBannerItem } from '@swift2/experience';

/**
 * The auto-pin banner (t_09dc269f's approved design): renders full-width,
 * sticky, above EraStream's masthead ONLY when the current era has a live,
 * still-open countdown — computed from `countdownTargetAt`/
 * `countdownResolvedAt` on the same `current_item` rows EraStream already
 * fetched (`useCurrentItems`), never a second network call.
 *
 * Fails soft, same contract as the rest of the Current tier
 * (`docs/decisions.md`'s Current-tier fail-soft rule, `use-current-items.ts`'s
 * header doc): no live countdown (empty items, no qualifying row, or the
 * fetch itself failed upstream and left `items` empty) means this renders
 * nothing and nothing else on the page changes — no loading state, no error
 * state, just absent.
 *
 * Exactly one banner slot ever renders (`pickCountdownBannerItem`'s own
 * contract: soonest deadline wins, stable-id tiebreak) — this component
 * never stacks multiple countdowns and never has an empty-but-visible state
 * to deadlock on.
 *
 * `nowMs` is resolved client-side only (same SSR-safe swap-after-mount
 * pattern `LandingMasthead.tsx` uses for its own relative-time math) since
 * "is this countdown still live" depends on the reader's actual clock, not
 * server render time — the very first paint (server + hydration) always
 * renders nothing, then the banner appears once `nowMs` resolves if one
 * qualifies. That one-frame absence is the safe default: it can never
 * flash a STALE countdown as live before the client clock is known.
 */
export function CountdownBanner({ currentItems }: { currentItems: CurrentItem[] }) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  if (nowMs == null) return null;
  const item = pickCountdownBannerItem(currentItems, nowMs);
  if (!item || !item.countdownTargetAt) return null;

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
