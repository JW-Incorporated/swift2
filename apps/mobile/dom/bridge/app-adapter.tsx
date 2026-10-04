// One UI H4/D1: the app (Expo DOM) HostAdapter. Built per provider, never a
// module singleton, and NOT mounted until D2. Bridge access goes through the
// injected `client` (no transport code here: Expo specifics stay in
// transport-expo.ts + SharedUiHost). The web adapter's contract applies: the
// reader only ever sees `useHost()`.
import { forwardRef, type CSSProperties } from 'react';
import { toExternalUrl, toWebPath } from '@swift2/ui';
import type { BridgeClient, HostAdapter, HostImageProps, HostLinkProps, Insets } from '@swift2/ui';
import { imageLoaded } from '../spike/image-listener';
import { resolveAppUrl } from '../spike/resolve-url';
import { createAppStorage, handleLinkClick, type NavDeps } from './app-adapter-nav';

export const APP_ORIGIN = 'https://www.longlivets.com';

export interface AppAdapterDeps {
  client: Pick<BridgeClient, 'call'>;
  /** Canonical site origin; defaults to APP_ORIGIN. */
  origin?: string;
  insets: Insets;
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
  priority,
  loading,
  className,
  draggable,
  fetchPriority,
  decoding,
  style,
  onLoad,
}: HostImageProps) {
  return (
    <img
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding={decoding ?? 'async'}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      draggable={draggable}
      style={fill ? { ...FILL, ...style } : style}
      onLoad={(e) => {
        onLoad?.(e);
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

  const openExternal = (url: string) => {
    const ext = toExternalUrl(url);
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
    Link,
    Image: AppImage,
    navigate,
    resolveUrl: (path) => resolveAppUrl(path, origin),
    embedOrigin: origin,
    onBack: deps.onBack,
    apiFetch: deps.apiFetch,
    storage: deps.storage ?? { local: webStorage('localStorage'), session: webStorage('sessionStorage') },
    env: { turnstileSiteKey: null, origin },
    insets: deps.insets,
    currentUrl: () => resolveAppUrl(toWebPath(deps.getPath()) ?? '/', origin),
    openExternal,
    share: async (payload) => {
      const r = await deps.client.call('share', payload);
      if (!r.ok) throw new Error(`share ${r.error.code}`);
    },
    haptic: (kind) => {
      void deps.client.call('haptic', { kind });
    },
  };
}
