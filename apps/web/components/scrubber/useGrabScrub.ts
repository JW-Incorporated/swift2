'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import {
  clamp,
  nearestEraStart,
  scrollTopForMonthFloat,
  type ScrubberModel,
} from '../../lib/scrubberModel';

export interface GrabScrubOptions {
  scrollRef: RefObject<HTMLElement | null>;
  sectionRefs: RefObject<(HTMLElement | null)[]>;
  model: ScrubberModel;
  onJumpToEra: (eraIndex: number) => void;
  /**
   * Map a pointer event to a fraction (0..1) along the scrubber's travel. The
   * hook converts that into a continuous month float and drives the reader's
   * scroll — so a drag scrolls the page and the passive rAF loop redraws the
   * scrubber (real two-way coupling, zero per-move React state).
   */
  fractionFromPointer: (e: ReactPointerEvent, hitEl: HTMLElement) => number;
  /** Override the fraction→month-float mapping (default: proportional to months). */
  fractionToMonthFloat?: (fraction: number, model: ScrubberModel) => number;
}

export interface GrabScrub {
  grabbed: boolean;
  /** Live month float while grabbing (a caller may read it on its own frames). */
  grabMonthFloatRef: RefObject<number>;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
}

/**
 * Shared grab-to-scrub behaviour. Owns the "grabbed" flag (the only React state,
 * flipped twice per gesture) and, on release, snaps to the nearest era's first
 * month — the v1 era-only snap.
 */
export function useGrabScrub(opts: GrabScrubOptions): GrabScrub {
  const { scrollRef, sectionRefs, model, onJumpToEra, fractionFromPointer, fractionToMonthFloat } = opts;
  const [grabbed, setGrabbed] = useState(false);
  const grabMonthFloatRef = useRef(0);

  const scrub = useCallback(
    (e: ReactPointerEvent) => {
      const scrollEl = scrollRef.current;
      const hitEl = e.currentTarget as HTMLElement;
      if (!scrollEl) return;
      const f = clamp(fractionFromPointer(e, hitEl), 0, 1);
      const mf = fractionToMonthFloat ? fractionToMonthFloat(f, model) : f * model.totalMonths;
      grabMonthFloatRef.current = mf;
      scrollEl.scrollTop = scrollTopForMonthFloat(scrollEl, sectionRefs.current ?? [], model.eraMetas, mf);
    },
    [scrollRef, sectionRefs, model, fractionFromPointer, fractionToMonthFloat],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setGrabbed(true);
      scrub(e);
    },
    [scrub],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!grabbed) return;
      scrub(e);
    },
    [grabbed, scrub],
  );

  const onPointerUp = useCallback(() => {
    setGrabbed(false);
    if (model.eraMetas.length === 0) return;
    onJumpToEra(nearestEraStart(model.eraMetas, grabMonthFloatRef.current));
  }, [model.eraMetas, onJumpToEra]);

  return { grabbed, grabMonthFloatRef, onPointerDown, onPointerMove, onPointerUp };
}
