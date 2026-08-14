import type { AppMode } from './store';
import { epochDay } from './era-secrets';

/**
 * R1 (2026-08-13 rulings, PLAN.md): the landing masthead carries ONE
 * rotating gloss line, not a list of every section — so it teaches a fan one
 * section at a time and never grows as sections are added. Same
 * deterministic-daily-pick mechanism as `dailyEraSecret` in era-secrets.ts —
 * reused, not reinvented.
 *
 * `built: false` lets a section be added to this list ahead of launch
 * without ever surfacing (the standing "no coming-soon surface" rule) —
 * Marketplace and Community land here first, then flip to `true`.
 */
export type GlossSection = {
  mode: AppMode;
  label: string;
  gloss: string;
  built: boolean;
};

export const GLOSS_SECTIONS: readonly GlossSection[] = [
  { mode: 'era', label: 'Eras', gloss: 'twelve chapters of her life, newest first', built: true },
  {
    mode: 'threads',
    label: 'Threads',
    gloss: 'one storyline at a time, across every era',
    built: true,
  },
  {
    mode: 'mood',
    label: 'Mood',
    gloss: 'tell it how you feel, it hands you the songs',
    built: true,
  },
  { mode: 'clownbot', label: 'Clownbot', gloss: 'the theories, graded for delulu', built: true },
];

/**
 * Deterministic daily pick from the BUILT sections only: the same gloss for
 * everyone on a given calendar day, rotating through every live section
 * across a run of days. Pure — the day key is passed in, never read from the
 * clock here (no `Date.now()`/`Math.random()`).
 */
export function dailyGloss(dayKey: string): GlossSection | null {
  const pool = GLOSS_SECTIONS.filter((s) => s.built);
  if (pool.length === 0) return null;
  return pool[epochDay(dayKey) % pool.length];
}
