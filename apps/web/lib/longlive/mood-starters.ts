/**
 * The starter chips under the mood input — Block 3 of
 * `docs/content-ops/mood-chat-safety-language.md` (APPROVED, Wyatt 2026-07-20).
 *
 * The labels are the approved copy VERBATIM. Do not reword them without a
 * founder call; the doc explains what each one is doing and why the set breaks
 * if you tidy it into a taxonomy of emotions. Two rules carried from there:
 *
 * - `feral about a bridge` is the deepest cut and the one that signals *we know
 *   you* rather than *we googled Taylor Swift moods*. If only one chip survives
 *   a redesign, keep that one.
 * - `winning, quietly` is load-bearing: without it the set reads as all
 *   heartbreak, and the catalogue has joy in it.
 *
 * WHY VECTORS AND NOT TEXT (safety doc, Stage 3 implementation note): each chip
 * ships with a HAND-TUNED vector rather than being routed through the
 * classifier as free text. They are the demo path — the first thing anyone taps
 * — so they must return the right songs deterministically, at zero cost, with
 * no model call. A chip that returns something mediocre is worse than no chip.
 *
 * None of these reference lyrics. Titles and era imagery only — that is what
 * keeps the set clear of the no-lyrics redline while still landing for a fan.
 */
import type { MoodAxes } from './types';

export interface MoodStarter {
  /** The approved label, shown verbatim. */
  label: string;
  /** Hand-tuned axes. Partial on purpose — an unasserted axis means "don't care". */
  moods: Partial<MoodAxes>;
  /** 0 (still, spare) .. 1 (loud, driving). Optional refinement. */
  energy?: number;
  /** 0 (sad) .. 1 (happy). Optional refinement. */
  valence?: number;
}

export const MOOD_STARTERS: readonly MoodStarter[] = [
  {
    label: 'crying in the car, cinematically',
    // The pleasure of the mood is the point — high catharsis, not flat despair.
    moods: { catharsis: 0.95, heartbreak: 0.8, longing: 0.6 },
    energy: 0.55,
    valence: 0.25,
  },
  {
    label: "3am and the group chat's asleep",
    moods: { longing: 0.9, heartbreak: 0.5, calm: 0.45 },
    energy: 0.2,
    valence: 0.3,
  },
  {
    label: 'plotting something in a ball gown',
    moods: { defiance: 0.9, anger: 0.5, joy: 0.45 },
    energy: 0.7,
    valence: 0.6,
  },
  {
    label: 'feral about a bridge',
    // The deepest cut, and the one the safety doc says must land. NO anger
    // here: a first tuning with anger 0.5 returned Bad Blood / Better Than
    // Revenge, i.e. revenge songs. Bridge obsession is not spite — it is the
    // cathartic key-change explosion, so it is catharsis + longing at high
    // energy, which is what surfaces All Too Well / Out of the Woods / illicit
    // affairs instead.
    moods: { catharsis: 1, longing: 0.65, heartbreak: 0.55, defiance: 0.3 },
    energy: 0.85,
    valence: 0.35,
  },
  {
    label: 'cardigan weather',
    moods: { nostalgia: 0.9, calm: 0.75, longing: 0.55 },
    energy: 0.2,
    valence: 0.45,
  },
  {
    label: 'driving out of a small town for good',
    // Leaving is forward-facing, so joy/defiance lead and nostalgia only
    // colours it — an earlier nostalgia-led tuning surfaced songs about
    // staying put rather than going.
    moods: { defiance: 0.7, joy: 0.65, nostalgia: 0.4 },
    energy: 0.75,
    valence: 0.7,
  },
  {
    label: 'romanticizing a Tuesday',
    moods: { joy: 0.7, calm: 0.7, nostalgia: 0.45 },
    energy: 0.35,
    valence: 0.75,
  },
  {
    label: 'someone said "we need to talk"',
    moods: { heartbreak: 0.9, longing: 0.5, anger: 0.35 },
    energy: 0.4,
    valence: 0.15,
  },
  {
    label: 'winning, quietly',
    // Load-bearing: keeps the set from reading as all heartbreak.
    moods: { joy: 0.8, defiance: 0.55, calm: 0.5 },
    energy: 0.45,
    valence: 0.85,
  },
  {
    label: 'unhinged in the best way',
    moods: { anger: 0.8, catharsis: 0.8, defiance: 0.75, joy: 0.4 },
    energy: 0.95,
    valence: 0.5,
  },
] as const;

/** How many chips are visible at once. A wall of ten reads as a menu. */
export const STARTERS_VISIBLE = 5;

/**
 * A rotating window over the set, so it "never reads as a fixed menu" (Block 3).
 * Deterministic in `offset` so it is testable and stable across a re-render;
 * the caller advances the offset, not this function.
 */
export function visibleStarters(
  offset: number,
  count: number = STARTERS_VISIBLE,
  set: readonly MoodStarter[] = MOOD_STARTERS,
): MoodStarter[] {
  const n = set.length;
  const take = Math.min(count, n);
  const start = ((offset % n) + n) % n;
  return Array.from({ length: take }, (_, i) => set[(start + i) % n]);
}
