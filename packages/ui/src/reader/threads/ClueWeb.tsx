'use client';

import { smoothScrollBehavior } from '../lib/scroll-behavior';
import { useEffect, useRef, useState } from 'react';
import { useAppActions, useAppState } from '../store';
import type { MotifId } from '@swift2/experience';
import { useBackDismiss } from '../lib/useBackDismiss';
import { ClueHome } from './ClueWebHome';
import { TrailView } from './ClueWebTrail';
import { ConstellationView } from './ClueWebConstellation';

type View =
  | { kind: 'home' }
  | { kind: 'trail'; motif: MotifId }
  | { kind: 'map'; motif: MotifId | null; nodeId?: string };

/**
 * The Clue Web — a self-contained mini-app. It has its own internal navigation
 * so the visitor always knows what they're doing: a guided home screen leads
 * into a readable "trail" for one motif, with the free-form constellation kept
 * as an explicit, opt-in "explore" mode rather than the confusing front door.
 */
export function ClueWeb() {
  // A cross-link (a moment's "follow this thread") may have queued a trail to
  // land on; start there instead of home. Initialized from state so the first
  // paint is already the trail (no home-screen flash).
  const { clueWebTrail } = useAppState();
  const { clearClueWebTrail } = useAppActions();
  const [view, setView] = useState<View>(() =>
    clueWebTrail ? { kind: 'trail', motif: clueWebTrail } : { kind: 'home' },
  );
  const topRef = useRef<HTMLDivElement>(null);

  // Consume the pending focus once landed — and honor a new one if a cross-
  // link fires while the Clue Web is already mounted.
  useEffect(() => {
    if (!clueWebTrail) return;
    setView({ kind: 'trail', motif: clueWebTrail });
    clearClueWebTrail();
  }, [clueWebTrail, clearClueWebTrail]);

  const go = (next: View) => {
    setView(next);
    // Re-anchor to the top of the mini-app so a new view starts in view.
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: smoothScrollBehavior(), block: 'start' }),
    );
  };

  // Let the mobile back-swipe gesture return to the Clue Web's home screen
  // instead of leaving the app — same pattern as the app's other overlays.
  // Matches the existing in-app back buttons, which already return straight
  // to home rather than stepping back one level at a time.
  useBackDismiss(view.kind !== 'home', () => go({ kind: 'home' }), { escape: false });

  return (
    <div ref={topRef} className="scroll-mt-24 pt-8">
      {view.kind === 'home' && (
        <ClueHome
          onOpenTrail={(m) => go({ kind: 'trail', motif: m })}
          onOpenMap={() => go({ kind: 'map', motif: null })}
        />
      )}
      {view.kind === 'trail' && (
        <TrailView
          motifId={view.motif}
          onBack={() => go({ kind: 'home' })}
          onOpenMap={(m) => go({ kind: 'map', motif: m })}
          onOpenNode={(id) => go({ kind: 'map', motif: null, nodeId: id })}
        />
      )}
      {view.kind === 'map' && (
        <ConstellationView
          initialMotif={view.motif}
          initialNodeId={view.nodeId ?? null}
          onBack={() => go({ kind: 'home' })}
        />
      )}
    </div>
  );
}
