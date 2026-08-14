'use client';

import { useEffect } from 'react';
import { AppProvider, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle, vaultStyle, VAULT_THEME } from '@/lib/longlive/theme';
import { TopBar } from './TopBar';
import { LandingPage } from './LandingPage';
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

function Shell() {
  const { mode, eraId } = useAppState();
  const era = getEra(eraId);
  const inThreads = mode === 'threads';
  const inMood = mode === 'mood';
  const inClownbot = mode === 'clownbot';
  const onLanding = mode === 'landing';

  // Keep the document theme-color in sync with the active surface. The
  // landing page (#684) shares the current era's palette, like the selector.
  const themeColor = inThreads ? VAULT_THEME.bg : era.theme.bg;
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColor);
  }, [themeColor]);

  // Entering Threads or the landing page should start at the top. Era mode
  // manages its own scroll (EraStream restores the user's previous spot, or
  // starts at the top).
  useEffect(() => {
    if (mode !== 'era') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [mode]);

  return (
    <div className="era-shell font-sans" style={inThreads ? vaultStyle() : eraStyle(era)}>
      {/* The landing page carries its own wordmark + toggle — no TopBar. */}
      {!onLanding && <TopBar />}
      <main>
        {onLanding ? (
          <LandingPage />
        ) : inClownbot ? (
          <ClownChat />
        ) : inMood ? (
          <MoodChat />
        ) : inThreads ? (
          <ThreadsMode />
        ) : (
          <EraStream />
        )}
      </main>
      <SiteFooter />

      {/* Overlays */}
      <EraSelector />
      <TrackGuide />
      <TrackDetail />
      <TheoryGuide />
      <MomentDetail />
      <ShareSheet />
      <SearchOverlay />

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
