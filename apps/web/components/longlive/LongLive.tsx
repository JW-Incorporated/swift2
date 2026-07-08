'use client';

import { useEffect } from 'react';
import { AppProvider, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle, vaultStyle, VAULT_THEME } from '@/lib/longlive/theme';
import { TopBar } from './TopBar';
import { EraStream } from './EraStream';
import { ThreadsMode } from './ThreadsMode';
import { EraSelector } from './EraSelector';
import { MomentDetail } from './MomentDetail';
import { ShareSheet } from './ShareSheet';
import { SiteFooter } from './SiteFooter';

function Shell() {
  const { mode, eraId } = useAppState();
  const era = getEra(eraId);
  const inThreads = mode === 'threads';

  // Keep the document theme-color in sync with the active surface.
  const themeColor = inThreads ? VAULT_THEME.bg : era.theme.bg;
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColor);
  }, [themeColor]);

  // Entering Threads should start at the top. Era mode manages its own scroll
  // (EraStream restores the user's previous spot, or starts at the top).
  useEffect(() => {
    if (inThreads) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [inThreads]);

  return (
    <div className="era-shell font-sans" style={inThreads ? vaultStyle() : eraStyle(era)}>
      <TopBar />
      <main>{inThreads ? <ThreadsMode /> : <EraStream />}</main>
      <SiteFooter />

      {/* Overlays */}
      <EraSelector />
      <MomentDetail />
      <ShareSheet />
    </div>
  );
}

export function LongLive() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
