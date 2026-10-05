import { Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import type { WebPath } from '@swift2/ui';
import type { DomSignal } from './dom-host-handlers';
import { createFileHostStorage } from './host-storage-file';
import { shareCardPorts } from './share-card-ports';
import { createUiDeps } from './ui-deps';

// One per process: every epoch's bridge host shares the cached blob.
const hostStorage = createFileHostStorage();

/** The per-epoch UI bridge deps (SharedUiHost): real native ports; `navRef` is read live. */
export function createHostUiDeps(onSignal: DomSignal, navRef: { current: { siteUrl?: string; presentNativeRoute?: (path: WebPath) => unknown } }) {
  return createUiDeps({
    linking: Linking,
    share: Share,
    cards: shareCardPorts,
    clipboard: Clipboard,
    haptics: Haptics,
    hostStorage,
    platformOS: Platform.OS,
    log: onSignal,
    siteUrl: navRef.current.siteUrl,
    getPresenter: () => navRef.current.presentNativeRoute,
  });
}
