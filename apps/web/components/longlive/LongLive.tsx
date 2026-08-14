'use client';

import { useEffect } from 'react';
import { AppProvider, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle, vaultStyle, VAULT_THEME } from '@/lib/longlive/theme';
import { TopBar } from './TopBar';
import { EraStream } from './EraStream';
import { ThreadsMode } from './ThreadsMode';
import { MoodChat } from './MoodChat';
import { ClownChat } from './ClownChat';
import { EraSelector } from './EraSelector';
import { MomentDetail } from './MomentDetail';
import { TrackGuide } from './TrackGuide';
import { TrackDetail } from './TrackDetail';
import { TheoryGuide } from './TheoryGuide';
import { ShareSheet } from './ShareSheet';
import { SearchOverlay } from './SearchOverlay';
import { SiteFooter } from './SiteFooter';
import { FeedbackButton } from './FeedbackButton';
import { BottomNav } from './BottomNav';
import { CommunitySection } from './CommunitySection';
import { MerchSection } from './MerchSection';

function Shell() {
  const { mode, eraId } = useAppState();
  const era = getEra(eraId);
  const inThreads = mode === 'threads';
  const inMood = mode === 'mood';
  const inClownbot = mode === 'clownbot';
  const inCommunity = mode === 'community';
  const inMerch = mode === 'merch';

  // Keep the document theme-color in sync with the active surface.
  const themeColor = inThreads ? VAULT_THEME.bg : era.theme.bg;
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
    <div className="era-shell font-sans" style={inThreads ? vaultStyle() : eraStyle(era)}>
      <TopBar />
      <main>
        {inClownbot ? (
          <ClownChat />
        ) : inMood ? (
          <MoodChat />
        ) : inThreads ? (
          <ThreadsMode />
        ) : inCommunity ? (
          <CommunitySection />
        ) : inMerch ? (
          <MerchSection />
        ) : (
          <EraStream />
        )}
      </main>
      <SiteFooter />
      {/* Clearance for the fixed BottomNav. It cannot push content itself, so
          without this the last card of every surface — and the footer — sit
          under the bar on mobile. Matches the bar's own height plus the same
          safe-area inset it pads with; zero at md+, where there is no bar. */}
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      />

      {/* Overlays */}
      <EraSelector />
      <TrackGuide />
      <TrackDetail />
      <TheoryGuide />
      <MomentDetail />
      <ShareSheet />
      <SearchOverlay />

      {/* Mobile tab bar (P4, R3) — desktop keeps TopBar's pill rail instead. */}
      {/* Mounted on EVERY surface including the front door — Joey, 2026-08-13:
          "the landing page IS the website... it's just a redesign of the main
          page". The bar is the mobile navigation, so it does not get to be
          absent from the first screen a visitor sees. (R1, 2026-08-14: the
          front door is now the era stream itself, TopBar included — there is
          no more separate landing surface for either bar to be exempt from.) */}
      <BottomNav />

      {/* Always-available issue reporter, fixed bottom-right. */}
      <FeedbackButton />
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
