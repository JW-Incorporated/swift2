// The native (non-DOM) screen router, moved verbatim from App.tsx — no behaviour change.
import { StyleSheet, View } from 'react-native';
import type { NativeBridgeMessage } from './SiteShell';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';
import { NotificationInboxScreen } from './NotificationInboxScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { EraStreamScreen } from './EraStreamScreen';
import { ThreadsScreen } from './ThreadsScreen';
import { CommunityScreen } from './CommunityScreen';
import { MerchScreen } from './MerchScreen';
import { TrackGuideScreen } from './TrackGuideScreen';
import { SongScreen } from './SongScreen';
import { MomentSheet } from './MomentSheet';
import { ClownChatScreen } from './ClownChatScreen';
import { BottomTabBar } from './BottomTabBar';
import { HomeTopBar } from './HomeTopBar';
import { LegalPageScreen } from './LegalPageScreen';
import { markOnboardingOffered } from '../lib/onboarding-state';
import { visibleScreen } from '../lib/visible-screen';
import type { NativeScreenState } from '../lib/use-native-screen-state';

export interface NativeScreenRouterProps {
  nav: NativeScreenState;
  navigate: (rawUrl: string | null | undefined) => void;
  openSettings: () => void;
  openMoment: (id: string) => void;
  handleBridgeMessage: (message: NativeBridgeMessage) => void;
  isNativeCapableUrl: (url: string) => boolean;
}

export function NativeScreenRouter({
  nav,
  navigate,
  openSettings,
  openMoment,
  handleBridgeMessage,
  isNativeCapableUrl,
}: NativeScreenRouterProps) {
  const {
    activeTab,
    setActiveTab,
    legalUrl,
    notificationSettingsOpen,
    setNotificationSettingsOpen,
    inboxOpen,
    setInboxOpen,
    onboardingOpen,
    setOnboardingOpen,
    trackGuideRoute,
    setTrackGuideRoute,
    trackGuideTracks,
    momentItemId,
    setMomentItemId,
    openNativeScreen,
    openLegalPage,
    closeLegalPage,
  } = nav;

  const screen = visibleScreen({
    settingsOpen: notificationSettingsOpen,
    inboxOpen,
    trackGuideScreen: trackGuideRoute?.screen ?? null,
    momentOpen: Boolean(momentItemId),
    onboardingOpen,
    legalOpen: Boolean(legalUrl),
  });

  return screen === 'inbox' ? (
    <NotificationInboxScreen
      onClose={() => setInboxOpen(false)}
      onOpenItem={(event) => navigate(event.deepLink)}
    />
  ) : screen === 'settings' ? (
    <NotificationSettingsScreen
      onClose={() => setNotificationSettingsOpen(false)}
      onOpenInbox={() => setInboxOpen(true)}
      onOpenLegalPage={(page) => openLegalPage(page, 'settings')}
    />
  ) : screen === 'track-guide' && trackGuideRoute?.screen === 'track-guide' ? (
    <TrackGuideScreen
      eraId={trackGuideRoute.eraId}
      tracks={trackGuideTracks}
      onOpenSong={(track) =>
        setTrackGuideRoute({ screen: 'song', eraId: trackGuideRoute.eraId, track })
      }
    />
  ) : screen === 'song' && trackGuideRoute?.screen === 'song' ? (
    <SongScreen
      eraId={trackGuideRoute.eraId}
      track={trackGuideRoute.track}
      onOpenSong={(eraId, track) => setTrackGuideRoute({ screen: 'song', eraId, track })}
      // OS-033 ships the native moment sheet: a "Keep exploring"
      // moment connection now opens it (through the same navigate()
      // every other entry point uses), replacing the documented
      // no-op OS-035 left here pending this card.
      onOpenMoment={openMoment}
    />
  ) : screen === 'moment' && momentItemId ? (
    <MomentSheet itemId={momentItemId} onClose={() => setMomentItemId(null)} />
  ) : screen === 'onboarding' ? (
    <OnboardingScreen
      onDone={() => {
        setOnboardingOpen(false);
        markOnboardingOffered().catch(() => {
          /* best-effort — a re-offer on the next bell tap is harmless */
        });
        // Onboarding is only ever shown by the settings gate, so the
        // user asked for Settings: land there whichever way they
        // finished (a preset already applied its prefs + fired the
        // OS permission dialog; Customize skips straight to it).
        openNativeScreen('settings');
      }}
    />
  ) : screen === 'legal' && legalUrl ? (
    // OS-039: the WebView's LAST remaining job — one of the three
    // legal pages. No native-capable-link interception here (a
    // legal page has no in-page links back into the app's own
    // native-capable routes worth intercepting); `navigate` still
    // handles the rare in-page link to another part of the site.
    // LegalPageScreen adds the Done button back out.
    <LegalPageScreen
      onClose={closeLegalPage}
      url={legalUrl}
      onBridgeMessage={handleBridgeMessage}
      isNativeCapableUrl={isNativeCapableUrl}
      onNativeCapableLinkPress={navigate}
    />
  ) : (
    <View style={styles.fill}>
      <HomeTopBar onOpenSettings={openSettings} />
      <View style={styles.fill}>
        {activeTab === 'era' ? (
          <EraStreamScreen onOpenItem={openMoment} />
        ) : activeTab === 'threads' ? (
          <ThreadsScreen />
        ) : activeTab === 'clownbot' ? (
          <ClownChatScreen
            onClose={() => setActiveTab('era')}
            onOpenPrivacyPolicy={() => openLegalPage('privacy', null)}
          />
        ) : activeTab === 'community' ? (
          <CommunityScreen />
        ) : (
          <MerchScreen />
        )}
      </View>
      <BottomTabBar active={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
});
