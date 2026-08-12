/**
 * Layout contract for the Decode pattern rail's era buttons, extracted so the
 * WCAG 2.5.8 hit-area fix (#727) is testable: the button carries a fixed
 * 24×24 CSS-px box (h-6/w-6 on Tailwind's default scale) no matter how small
 * the density-scaled dot inside it renders.
 */
export const RAIL_BUTTON_CLASS =
  'group relative z-10 flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200';

/** Accessible name + tooltip text for an era dot. */
export function railButtonLabel(shortName: string, count: number): string {
  return `${shortName} — ${count} clue${count !== 1 ? 's' : ''}`;
}
