import type { RefObject } from 'react';
import type { Era, Milestone, MonthItem } from '@swift2/shared';
import type { ScrubberModel } from './scrubberModel';

/**
 * The contract every variant scrubber implements. ReaderShell owns the scroll
 * container + era sections and hands each variant everything it needs to (a)
 * follow scroll passively via rAF and (b) drive scroll on drag — the two-way
 * coupling. Variants share this so ReaderShell can swap between them freely.
 */
export interface ScrubberProps {
  eras: Era[];
  milestones: Milestone[];
  monthItems: MonthItem[];
  /** Flattened timeline + per-era rollups (position math). */
  model: ScrubberModel;
  /** Coarse active era from the reader's scroll-spy (≤1 change per boundary). */
  activeIndex: number;
  /** The reader's scroll viewport — variants read scrollTop and set it on drag. */
  scrollRef: RefObject<HTMLElement | null>;
  /** Era section elements, index-aligned with `eras`. */
  sectionRefs: RefObject<(HTMLElement | null)[]>;
  /** Smooth-scroll the reader to an era (used for release snaps). */
  onJumpToEra: (eraIndex: number) => void;
}

export type VariantId = 'A' | 'B' | 'C' | 'D';

export interface VariantInfo {
  id: VariantId;
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
}

/** Registry of the four variants — drives the tabs and route params. */
export const VARIANTS: VariantInfo[] = [
  {
    id: 'A',
    slug: 'a',
    name: 'Time Reel',
    tagline: 'Vertical text reel on the right edge',
    blurb:
      'A column of month labels rides the right edge and drifts as you scroll. Grab it and it grows into a tall dial of months with era headers you can flick through.',
  },
  {
    id: 'B',
    slug: 'b',
    name: 'Spectrum Spine',
    tagline: 'Full-height ribbon of era colours',
    blurb:
      'A thin stripe of stacked era colours runs the full height, sized by how much each era holds. A date chip rides it; grab it and the spine widens into a labelled ruler.',
  },
  {
    id: 'C',
    slug: 'c',
    name: 'Loupe',
    tagline: 'Dot capsule that swells into a magnifier',
    blurb:
      'A slim capsule of one dot per era with a floating date tag. Grab it and a frosted loupe blooms under your finger, fanning the nearest eras into magnified month lists.',
  },
  {
    id: 'D',
    slug: 'd',
    name: 'Marquee',
    tagline: 'Top-center lozenge that stretches to a timeline',
    blurb:
      'A compact pill sits top-center showing the current month ticking by. Grab it and it stretches into a wide horizontal timeline with a fisheye bulge under your finger.',
  },
];

export function variantBySlug(slug: string): VariantInfo | undefined {
  return VARIANTS.find((v) => v.slug === slug);
}
