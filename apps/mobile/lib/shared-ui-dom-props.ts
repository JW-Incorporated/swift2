// The Expo DOM webview props SharedUiHost hands AppReader/SharedUiTest (split out of SharedUiHost to keep it under 300 lines).
// iOS: no WKWebView scroll-view inset adjustment or rubber-banding (the DOM owns its insets via --safe-*, W3-iOS).
// Inline playback is explicit (as MomentSheet/SiteShell) so embeds stay inline; mediaPlaybackRequiresUserAction true: the tap on the embed is the user gesture.
// onShouldStartLoadWithRequest (react-native-webview, passed through the DOM props spread): main-frame navigation guard.
import { Linking } from 'react-native';
import { eraColors } from './theme';
import { isAppOpenableUrl } from './mailto-allowlist';
import type { createDomHostHandlers } from './dom-host-handlers';

type Handlers = Pick<ReturnType<typeof createDomHostHandlers>, 'onContentProcessDidTerminate' | 'onRenderProcessGone'>;

export type NavRequest = { url: string; isTopFrame?: boolean };

const originOf = (url: string): string | null => {
  const m = /^([a-z][a-z0-9+.-]*:)(?:\/\/([^/?#]*))?/i.exec(url);
  return m ? `${m[1].toLowerCase()}//${(m[2] ?? '').toLowerCase()}` : null;
};

/**
 * Decides whether the DOM webview may load a request. The first top-frame load is the bundled DOM page and pins the
 * home origin; later top-frame loads must stay on it (or be about:blank). Any other top-level navigation is blocked and
 * handed to `openExternal` when it is an app-openable url. Sub-frame (embed) loads may be http(s) or about:blank only.
 */
export function createDomNavGuard(openExternal: (url: string) => void) {
  let home: string | null = null;
  return (req: NavRequest): boolean => {
    const url = req.url;
    if (/^about:(blank|srcdoc)$/i.test(url)) return true;
    const origin = originOf(url);
    if (req.isTopFrame === false) return origin !== null && (origin.startsWith('https:') || origin.startsWith('http:'));
    if (origin !== null && home === null) {
      home = origin;
      return true;
    }
    if (origin !== null && origin === home) return true;
    if (isAppOpenableUrl(url)) openExternal(url);
    return false;
  };
}

export function sharedUiDomProps(handlers: Handlers, openUrl: (url: string) => void = (url) => void Linking.openURL(url).catch(() => {})) {
  return {
    contentInsetAdjustmentBehavior: 'never' as const,
    automaticallyAdjustContentInsets: false,
    bounces: false,
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: true,
    style: { backgroundColor: eraColors.bg },
    containerStyle: { backgroundColor: eraColors.bg },
    onContentProcessDidTerminate: handlers.onContentProcessDidTerminate,
    onRenderProcessGone: handlers.onRenderProcessGone,
    onShouldStartLoadWithRequest: createDomNavGuard(openUrl),
  };
}
