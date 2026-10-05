'use client';

import { useEffect, useRef, type ComponentType } from 'react';
import { getEra } from '@swift2/experience';
import { AppProvider, useAppState } from '../store';
import type { AppMode } from '../store/navigation';
import { useHost, type ThemeChange } from '../../host';
import { useReportEngaged } from '../lib/useReportEngaged';
import { useReportSnapshot } from '../lib/useReportSnapshot';
import { eraStyle, vaultStyle, merchStyle, statusBarStyleFor, VAULT_THEME, MERCH_THEME } from '../lib/theme';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export type ReaderSurface = AppMode;

export interface ReaderSlots {
  surfaces: Partial<Record<ReaderSurface, ComponentType>>;
  overlays: ComponentType[];
  footer?: ComponentType;
  floating?: ComponentType;
  fallback: ComponentType<{ mode: AppMode }>;
}

/** Mounted only when the host has a `theme` hook (the app); sends each distinct theme colour once. Web never mounts it. */
function ThemeEmitter({ color, emit }: { color: string; emit: (t: ThemeChange) => void }) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current === color) return;
    last.current = color;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) emit({ statusBarStyle: statusBarStyleFor(color), background: color });
  }, [color, emit]);
  return null;
}

export function ReaderShell({ slots }: { slots: ReaderSlots }) {
  const { mode, eraId, restoreSeq } = useAppState();
  const themeHost = useHost().theme;
  useReportEngaged();
  useReportSnapshot();
  const era = getEra(eraId);
  const inThreads = mode === 'threads';
  const inMerch = mode === 'merch';
  const Surface = slots.surfaces[mode];
  const Footer = slots.footer;
  const Floating = slots.floating;
  const Fallback = slots.fallback;

  // Keep the document theme-color in sync with the active surface.
  const themeColor = inThreads ? VAULT_THEME.bg : inMerch ? MERCH_THEME.bg : era.theme.bg;
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColor);
  }, [themeColor]);

  // Entering Threads should start at the top. Era mode manages its own
  // scroll (EraStream restores the user's previous spot, or starts at the
  // top, or scrolls the masthead away for an explicit jump/goHome).
  useEffect(() => {
    if (mode !== 'era') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [mode]);

  return (
    <div
      className="era-shell font-sans"
      style={inThreads ? vaultStyle() : inMerch ? merchStyle() : eraStyle(era)}
    >
      {themeHost ? <ThemeEmitter color={themeColor} emit={themeHost} /> : null}
      <TopBar />
      <main>{Surface ? <Surface key={restoreSeq} /> : <Fallback mode={mode} />}</main>
      {Footer ? <Footer /> : null}
      {/* Clearance for the fixed BottomNav. It cannot push content itself, so
          without this the last card of every surface — and the footer — sit
          under the bar on mobile. Matches the bar's own height plus the same
          safe-area inset it pads with; zero at md+, where there is no bar. */}
      <div
        aria-hidden
        data-ll-safe="bottom-spacer"
        className="md:hidden"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      />

      {/* Overlays */}
      {slots.overlays.map((Overlay, i) => (
        <Overlay key={i} />
      ))}

      {/* Mobile tab bar (P4, R3) — desktop keeps TopBar's pill rail instead. */}
      {/* Mounted on EVERY surface including the front door — Joey, 2026-08-13:
          "the landing page IS the website... it's just a redesign of the main
          page". The bar is the mobile navigation, so it does not get to be
          absent from the first screen a visitor sees. (R1, 2026-08-14: the
          front door is now the era stream itself, TopBar included — there is
          no more separate landing surface for either bar to be exempt from.) */}
      <BottomNav />

      {/* Always-available issue reporter, fixed bottom-right. */}
      {Floating ? <Floating /> : null}
    </div>
  );
}

export function ReaderRoot({ slots }: { slots: ReaderSlots }) {
  return (
    <AppProvider>
      <ReaderShell slots={slots} />
    </AppProvider>
  );
}
