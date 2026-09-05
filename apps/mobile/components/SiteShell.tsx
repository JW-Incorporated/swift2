// The Long Live experience, in the app.
//
// Decision 2026-09-05 (docs/decisions.md): the native app renders the shipped
// website — the 64k-line experience layer under apps/web/lib/longlive — inside
// a full-screen WebView, and keeps the natively-built pieces around it (push
// registration, the bell, notification settings, the inbox, deep links). The
// native Vault navigator (VaultNavigator.tsx) stays in the tree as the
// long-term port target but is no longer mounted.
//
// What this component owns:
//   - loading + offline/error states in the app's own chrome, never a bare
//     browser error page;
//   - keeping the user on our domain: any other host opens in the system
//     browser (Spotify/YouTube/Instagram embeds keep working in place — only
//     top-level navigations are intercepted);
//   - iOS swipe-back / Android hardware-back navigate the WebView's history
//     before they leave the app;
//   - a `LongLiveApp/<version>` marker in the user agent so the site can tell
//     it is running inside the app (e.g. to hide "get the app" prompts later).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://www.longlivets.com').replace(
  /\/$/,
  '',
);

const SITE_HOSTS = new Set(['www.longlivets.com', 'longlivets.com']);

function isSiteUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (
      SITE_HOSTS.has(u.hostname) ||
      (process.env.EXPO_PUBLIC_SITE_URL ? u.origin === SITE_URL : false)
    );
  } catch {
    return false;
  }
}

const APP_UA_SUFFIX = `LongLiveApp/${Constants.expoConfig?.version ?? '0'} (${Platform.OS})`;

// OS-002: the one-way message protocol the in-page bell (`apps/web/lib/
// longlive/in-app.ts`'s `postToNativeApp`) sends via
// `window.ReactNativeWebView.postMessage`. Documented in
// `docs/architecture.md`.
export type NativeBridgeMessage =
  | { type: 'openNotificationSettings' }
  | { type: 'openInbox' };

function parseBridgeMessage(raw: string): NativeBridgeMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'type' in parsed &&
      (parsed.type === 'openNotificationSettings' || parsed.type === 'openInbox')
    ) {
      return parsed as NativeBridgeMessage;
    }
  } catch {
    /* ignore malformed messages — never crash the shell over web-side JSON */
  }
  return null;
}

export interface SiteShellProps {
  /** The page to show. Changing it navigates the WebView (used by deep links). */
  url: string;
  /** Called when the page asks to open a native screen (OS-002 bridge). */
  onBridgeMessage?: (message: NativeBridgeMessage) => void;
}

export function SiteShell({ url, onBridgeMessage }: SiteShellProps) {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Android hardware back: walk the WebView history first.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const onShouldStart = useCallback((req: ShouldStartLoadRequest) => {
    // Only top-level navigations leave the shell; iframe loads (embeds) are
    // untouched. `isTopFrame` is iOS-only, so treat Android as top-level.
    const topLevel = req.isTopFrame ?? true;
    if (!topLevel) return true;
    if (isSiteUrl(req.url) || req.url.startsWith('about:')) return true;
    Linking.openURL(req.url).catch(() => {
      /* nothing sensible to do if the OS refuses; stay put */
    });
    return false;
  }, []);

  const onNav = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseBridgeMessage(event.nativeEvent.data);
      if (message) onBridgeMessage?.(message);
    },
    [onBridgeMessage],
  );

  const retry = useCallback(() => {
    setFailed(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.fill}>
      {failed ? (
        <View style={[styles.fill, styles.center]}>
          <Text style={styles.errTitle}>Couldn’t reach Long Live</Text>
          <Text style={styles.errBody}>
            Check your connection and try again.{'\n'}
            <Text style={styles.errDetail}>{failed}</Text>
          </Text>
          <Pressable onPress={retry} accessibilityRole="button" style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{ uri: url }}
          style={styles.web}
          applicationNameForUserAgent={APP_UA_SUFFIX}
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={onNav}
          onMessage={onMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            setLoading(false);
            setFailed(e.nativeEvent.description || `error ${e.nativeEvent.code}`);
          }}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) {
              setLoading(false);
              setFailed(`HTTP ${e.nativeEvent.statusCode}`);
            }
          }}
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          pullToRefreshEnabled
          setSupportMultipleWindows={false}
          domStorageEnabled
          javaScriptEnabled
          decelerationRate="normal"
          contentInsetAdjustmentBehavior="never"
          bounces={false}
          startInLoadingState={false}
        />
      )}
      {loading && !failed && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.center, styles.loadingVeil]}
        >
          <ActivityIndicator color="#fff" />
          <Text style={styles.loading}>Loading Long Live…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: '#0b0b0f', flex: 1 },
  web: { backgroundColor: '#0b0b0f', flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingVeil: { backgroundColor: '#0b0b0f' },
  loading: { color: '#aaa', marginTop: 10 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errBody: { color: '#ccc', textAlign: 'center', lineHeight: 20 },
  errDetail: { color: '#777', fontSize: 12 },
  retry: {
    backgroundColor: '#fff',
    borderRadius: 999,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  retryText: { color: '#0b0b0f', fontWeight: '700' },
});
