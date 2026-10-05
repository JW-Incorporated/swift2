// The app-side reader controller (D2). Rendered as the first slot overlay, so it sits inside the packages/ui
// AppProvider: it can read the store, which AppReader (outside ReaderRoot) cannot. Renders nothing.
import { useEffect, useRef } from 'react';
import { resolveTrackKey, THREADS } from '@swift2/experience';
import { useReader } from '@swift2/ui';
import { inboxOverlay } from '../slots/inbox-store';
import { onboardingOverlay } from '../slots/onboarding-store';
import { settingsOverlay } from '../slots/settings-store';
import { dismissTopOverlayFromNativeBack } from '@swift2/ui/reader/lib/useBackDismiss';
import { useAppActions, useAppState } from '@swift2/ui/reader/store/index';
import { useBackRegistration } from './back-responder';
import { applyAfterCommit } from './commit-apply';
import { applyDeepLink, type DeepLinkQueries } from './deep-link-apply';
import { useReaderControls } from './reader-controls';

export function ReaderBridge() {
  const controls = useReaderControls();
  const { mode, openItemId } = useAppState();
  const actions = useAppActions();
  const q = useReader();
  // One ordered stack (useBackDismiss): settings, inbox, the push offer and every reader overlay register in open
  // order, so Back closes whichever opened last; only then does the open item (or exit) answer.
  useBackRegistration(
    // While an offer CTA is in flight every Back is handled outright (never exits mid-save, outside the one-close-per-key guard).
    (fn) => controls.registerBack(fn && (() => (onboardingOverlay.isBusy() || dismissTopOverlayFromNativeBack() ? 'handled' : fn()))),
    openItemId,
    actions.closeItem,
  );

  useEffect(() => {
    if (controls.slottedModes.has(mode)) controls.lastSlotted.current = mode;
  }, [mode]);

  const live = useRef({ actions, q });
  live.current = { actions, q };
  useEffect(() => {
    controls.setApplier((search) => {
      const { actions: a, q: r } = live.current;
      const queries: DeepLinkQueries = {
        threadIds: THREADS.map((t) => t.id),
        contentItemId: (id) => r.getContentItemByIdOrSlug(id)?.id ?? null,
        isEraId: (id) => r.eras.some((e) => e.id === id),
        eraHasVideoSlug: (eraId, slug) => r.allVideoRecordsForEra(eraId as never).some((v) => v.slug === slug),
        findEraForVideoSlug: (slug) => r.eras.find((e) => r.allVideoRecordsForEra(e.id).some((v) => v.slug === slug))?.id ?? null,
        eraOfTrackKey: (key) => resolveTrackKey(key)?.eraId ?? null,
      };
      return applyAfterCommit(() => applyDeepLink(search, queries, { ...a, closeInbox: inboxOverlay.close, closeSettings: settingsOverlay.close }));
    });
    return () => controls.setApplier(null);
  }, []);

  return null;
}
