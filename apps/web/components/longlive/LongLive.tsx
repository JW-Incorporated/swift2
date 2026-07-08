'use client';

import { useEffect } from 'react';
import { AppProvider, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import { TopBar } from './TopBar';
import { EraMode } from './EraMode';
import { LensMode } from './LensMode';
import { EraSelector } from './EraSelector';
import { MomentDetail } from './MomentDetail';
import { ShareSheet } from './ShareSheet';
import { SiteFooter } from './SiteFooter';

function Shell() {
  const { mode, eraId } = useAppState();
  const era = getEra(eraId);

  // Keep the document theme-color in sync with the active era.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', era.theme.bg);
  }, [era.theme.bg]);

  return (
    <div className="era-shell font-sans" style={eraStyle(era)}>
      <TopBar />
      <main>{mode === 'era' ? <EraMode /> : <LensMode />}</main>
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
