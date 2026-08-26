import type { JSX, ReactNode } from 'react';

/**
 * The merch page's signature hero (PLAN.md, "Merch page redesign to the
 * marquee mockup", 2026-08-16): a bordered panel with two rails of gold
 * bulbs, top and bottom, that flicker on a staggered per-bulb delay so the
 * row reads as a theatre marquee rather than a single blinking strip.
 *
 * Palette comes from the `--merch-*` tokens defined on `.merch-shell`
 * (globals.css, a sibling task in the same plan) — this file only
 * references them by name and never hardcodes their hex values.
 *
 * The `@keyframes flick` animation is scoped to this file via a plain
 * `<style>` tag rather than a shared stylesheet edit (no other file in this
 * plan is touched). It is still honoured by the app-wide
 * `prefers-reduced-motion: reduce` rule in globals.css, which forces
 * `animation-duration: 0.001ms !important` on `*, *::before, *::after`.
 * `!important` always wins over this file's un-important `animation`
 * shorthand regardless of source order or specificity, so a reduced-motion
 * user sees static bulbs — same precedent as `ClownItemCard`'s pulsing dot.
 */
export function MerchMarquee(props: {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  bulbCount?: number; // default 34 per rail
}): JSX.Element {
  const bulbCount = props.bulbCount ?? 34;
  const indices = Array.from({ length: bulbCount }, (_, i) => i);

  return (
    <div className="relative border border-[color:var(--merch-line-strong)] px-[22px] pb-[38px] pt-[46px] shadow-[0_40px_90px_-50px_rgba(0,0,0,.9),inset_0_1px_0_rgba(246,239,228,.06)] [background:linear-gradient(178deg,var(--merch-panel-2),var(--merch-ink-2)_78%)] sm:px-[34px]">
      <style>{`
        @keyframes merch-marquee-flick {
          0%, 100% { opacity: .32; }
          45% { opacity: 1; }
        }
        .merch-marquee-bulb {
          animation: merch-marquee-flick 3.6s ease-in-out infinite;
        }
      `}</style>

      <div
        className="pointer-events-none absolute left-[14px] right-[14px] top-[-4px] flex justify-between"
        aria-hidden="true"
      >
        {indices.map((i) => (
          <span
            key={`top-${i}`}
            className="merch-marquee-bulb h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--merch-gold)] shadow-[0_0_9px_2px_rgba(235,201,127,.55)]"
            style={{ animationDelay: `${(i * 0.11).toFixed(2)}s` }}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute bottom-[-4px] left-[14px] right-[14px] flex justify-between"
        aria-hidden="true"
      >
        {indices.map((i) => (
          <span
            key={`bottom-${i}`}
            className="merch-marquee-bulb h-[7px] w-[7px] shrink-0 rounded-full bg-[color:var(--merch-gold)] shadow-[0_0_9px_2px_rgba(235,201,127,.55)]"
            style={{ animationDelay: `${(i * 0.11).toFixed(2)}s` }}
          />
        ))}
      </div>

      <p className="m-0 mb-[14px] text-[11px] uppercase tracking-[0.3em] text-[color:var(--merch-gold)]">
        {props.eyebrow}
      </p>
      <h1 className="m-0 mb-4 font-[family-name:var(--font-bodoni)] text-[clamp(46px,9vw,92px)] font-normal leading-[.94] tracking-[-0.01em] text-[color:var(--merch-cream)]">
        {props.title}
      </h1>
      <p className="m-0 max-w-[52ch] text-[17px] text-[color:var(--merch-muted)]">{props.lede}</p>
    </div>
  );
}
