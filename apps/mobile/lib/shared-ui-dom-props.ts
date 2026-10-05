// The Expo DOM webview props SharedUiHost hands AppReader/SharedUiTest (split out of SharedUiHost to keep it under 300 lines).
// iOS: no WKWebView scroll-view inset adjustment or rubber-banding (the DOM owns its insets via --safe-*, W3-iOS).
// Inline playback is explicit (as MomentSheet/SiteShell) so embeds stay inline; mediaPlaybackRequiresUserAction true: the tap on the embed is the user gesture.
import { eraColors } from './theme';
import type { createDomHostHandlers } from './dom-host-handlers';

type Handlers = Pick<ReturnType<typeof createDomHostHandlers>, 'onContentProcessDidTerminate' | 'onRenderProcessGone'>;

export function sharedUiDomProps(handlers: Handlers) {
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
  };
}
