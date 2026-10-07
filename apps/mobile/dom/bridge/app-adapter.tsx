// One UI H4/D1: the app (Expo DOM) HostAdapter. Built per provider, never a
// module singleton, and NOT mounted until D2. Bridge access goes through the
// injected `client` (no transport code here: Expo specifics stay in
// transport-expo.ts + SharedUiHost). The web adapter's contract applies: the
// reader only ever sees `useHost()`.
import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react';
import { toComposeMailtoUrl, toExternalUrl, toMailtoUrl, toWebPath } from '@swift2/ui';
import type { BridgeClient, HostAdapter, HostImageProps, HostLinkProps, Insets } from '@swift2/ui';
import { isAllowedMailto } from '../../lib/mailto-allowlist';
import { artSrc, noteArtFallback, noteArtLoaded, subscribeArtMap } from '../reader/art-map';
import { imageLoaded } from '../reader/image-listener';
import { resolveAppUrl } from '../reader/resolve-url';
import { createAppStorage, handleLinkClick, type NavDeps } from './app-adapter-nav';
import { withFocusRestore } from './focus-restore';
import { responsiveAttrs } from './responsive-image';

export const APP_ORIGIN = 'https://www.longlivets.com';

export interface AppAdapterDeps {
  client: Pick<BridgeClient, 'call'> & Partial<Pick<BridgeClient, 'sendEvent'>>;
  /** Canonical site origin; defaults to APP_ORIGIN. */
  origin?: string;
  insets: Insets;
  /** Native OS (react-native Platform.OS); anything but ios/android becomes the generic `app`. */
  platform?: string;
  /** Routes native still owns (dom/slots/routes). Those go over the bridge `navigate`. */
  isNativeRoute: (path: string) => boolean;
  /** In-DOM navigation (history + the store's navigation); wired in D2. */
  navigateDom: (path: string, opts?: { replace?: boolean }) => void;
  /** The current in-DOM web path (`/x?y#z`), never the file:// location. */
  getPath: () => string;
  apiFetch: HostAdapter['apiFetch'];
  onBack: HostAdapter['onBack'];
  storage?: HostAdapter['storage'];
}

// next/image `fill` inline styles (HOST-ADAPTER.md "Image with fill"); object-fit comes from className.
const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

export function AppImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  unoptimized,
  priority,
  loading,
  className,
  draggable,
  fetchPriority,
  decoding,
  style,
  onLoad,
}: HostImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [artFailedSrc, setArtFailedSrc] = useState<string | null>(null);
  // Offline art: a map hit serves the cached file:// copy directly (no srcSet); a miss or onError is today's remote path.
  // The map loads after first paint (never gating it): re-render on arrival, but leave an image that already loaded remotely alone.
  const [, bump] = useState(0);
  useEffect(() => subscribeArtMap(() => bump((n) => n + 1)), []);
  const remoteOk = useRef<string | null>(null);
  const art = artFailedSrc === src || remoteOk.current === src ? null : artSrc(src, APP_ORIGIN);
  const responsive = art || failedSrc === src ? null : responsiveAttrs({ src, origin: APP_ORIGIN, width, fill, sizes, unoptimized });
  return (
    <img
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding={decoding ?? 'async'}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
      src={art ?? responsive?.src ?? src}
      srcSet={responsive?.srcSet}
      sizes={responsive ? responsive.sizes : sizes}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      draggable={draggable}
      style={fill ? { ...FILL, ...style } : style}
      onError={
        art
          ? () => {
              noteArtFallback();
              setArtFailedSrc(src);
            }
          : responsive
            ? () => setFailedSrc(src)
            : undefined
      }
      onLoad={(e) => {
        onLoad?.(e);
        if (art) noteArtLoaded();
        else remoteOk.current = src;
        imageLoaded(e.currentTarget);
      }}
    />
  );
}

function webStorage(which: 'localStorage' | 'sessionStorage') {
  return createAppStorage(() => (typeof window === 'undefined' ? null : window[which]));
}

export function createAppAdapter(deps: AppAdapterDeps): HostAdapter {
  const origin = deps.origin ?? APP_ORIGIN;

  // Fixed text only: a failed bridge call never forwards native detail (no ids or tokens either way).
  const notif = async <T,>(call: Promise<{ ok: true; value: T } | { ok: false }>): Promise<T> => {
    const r = await call;
    if (!r.ok) throw new Error('notification request failed');
    return r.value;
  };

  const openExternal = (url: string) => {
    const ext = toExternalUrl(url) ?? (isAllowedMailto(url) ? (toMailtoUrl(url) ?? toComposeMailtoUrl(url)) : null);
    if (ext) void deps.client.call('openExternal', { url: ext });
  };

  const navigate: HostAdapter['navigate'] = (path, opts) => {
    const web = toWebPath(path);
    if (!web) return;
    if (deps.isNativeRoute(web)) {
      void deps.client.call('navigate', { path: web, replace: opts?.replace === true });
    } else {
      deps.navigateDom(web, opts);
    }
  };

  const nav: NavDeps = { origin, navigate, openExternal };

  const Link = forwardRef<HTMLAnchorElement, HostLinkProps>(function AppLink(
    { href, children, prefetch: _prefetch, external, onClick, ...rest },
    ref,
  ) {
    return (
      <a
        {...rest}
        ref={ref}
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        onClick={(e) => {
          onClick?.(e);
          handleLinkClick(e, href, { blank: Boolean(external) || rest.target === '_blank', external: Boolean(external) }, nav);
        }}
      >
        {children}
      </a>
    );
  });

  return {
    platform: deps.platform === 'ios' || deps.platform === 'android' ? deps.platform : 'app',
    Link,
    Image: AppImage,
    navigate,
    resolveUrl: (path) => resolveAppUrl(path, origin),
    embedOrigin: origin,
    onBack: deps.onBack,
    apiFetch: deps.apiFetch,
    storage: deps.storage ?? { local: webStorage('localStorage'), session: webStorage('sessionStorage') },
    env: { turnstileSiteKey: null, origin },
    submitLink: 'external',
    insets: deps.insets,
    currentUrl: () => resolveAppUrl(toWebPath(deps.getPath()) ?? '/', origin),
    openExternal,
    clipboard: {
      writeText: async (text) => {
        const r = await deps.client.call('clipboard.write', { text });
        if (!r.ok) throw new Error(`clipboard ${r.error.code}`);
      },
    },
    share: async (payload) => {
      const r = await withFocusRestore(() => deps.client.call('share', payload));
      if (!r.ok) throw new Error(`share ${r.error.code}`);
      return r.value;
    },
    haptic: (kind) => {
      void deps.client.call('haptic', { kind });
    },
    theme: (t) => {
      deps.client.sendEvent?.('theme', t);
    },
    notifications: {
      status: () => notif(deps.client.call('notifications.status', {})),
      request: () => notif(deps.client.call('notifications.request', {})),
      register: async () => void (await notif(deps.client.call('notifications.register', {}))),
      updatePrefs: async (prefs) => void (await notif(deps.client.call('notifications.updatePrefs', { prefs }))),
      loadPrefs: () => notif(deps.client.call('notifications.getPrefs', {})),
      savePrefs: (body) => notif(deps.client.call('notifications.savePrefs', body)),
      registered: async () => (await notif(deps.client.call('notifications.registration', {}))).registered,
      unregister: async () => void (await notif(deps.client.call('notifications.unregister', {}))),
      optOutPending: async () => (await notif(deps.client.call('notifications.optOutPending', {}))).pending,
      onboardingOffered: async () => (await notif(deps.client.call('notifications.onboardingOffered', {}))).offered,
      markOnboardingOffered: async () => void (await notif(deps.client.call('notifications.markOnboardingOffered', {}))),
    },
  };
}
