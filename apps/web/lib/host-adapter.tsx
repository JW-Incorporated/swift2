import { forwardRef, type ComponentProps } from 'react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { webApiFetch } from '@swift2/content';
import type {
  HostAdapter,
  HostImageProps,
  HostLinkProps,
  HostStorage,
  HostWebPush,
} from '@swift2/ui';

import { CANONICAL_ORIGIN } from './canonical-origin';
import { webApiStream } from './host-api-stream';
import {
  getOrCreateWebDeviceId,
  isWebPushSupported,
  subscribeToWebPush,
  unsubscribeFromWebPush,
} from './web-push-client';

// Module-level so their identity is stable across renders (a component defined
// inside the adapter factory would remount its subtree on every adapter rebuild).
export const WebLink = forwardRef<HTMLAnchorElement, HostLinkProps>(function WebLink(
  { href, children, prefetch, external, ...rest },
  ref,
) {
  if (external) {
    return (
      <a {...rest} ref={ref} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <NextLink {...rest} ref={ref} href={href} prefetch={prefetch}>
      {children}
    </NextLink>
  );
});

export function WebImage(props: HostImageProps) {
  // next/image requires width+height unless `fill`; the host contract leaves both optional.
  return <NextImage {...(props as ComponentProps<typeof NextImage>)} />;
}

export function createWebStorage(which: 'localStorage' | 'sessionStorage'): HostStorage {
  const area = (): Storage | null => {
    try {
      return typeof window === 'undefined' ? null : window[which];
    } catch {
      return null;
    }
  };
  return {
    get(key) {
      try {
        const a = area();
        return a ? a.getItem(key) : undefined;
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        area()?.setItem(key, value);
      } catch {
        // storage full or blocked: best-effort, same as today's call sites
      }
    },
    remove(key) {
      try {
        area()?.removeItem(key);
      } catch {
        // best-effort
      }
    },
  };
}

export const webPushHost: HostWebPush = {
  isSupported: isWebPushSupported,
  getDeviceId: getOrCreateWebDeviceId,
  subscribe: subscribeToWebPush,
  unsubscribe: unsubscribeFromWebPush,
  async loadPrefs(deviceId) {
    const res = await fetch(`/api/devices/${deviceId}/prefs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async savePrefs(deviceId, body) {
    const res = await fetch(`/api/devices/${deviceId}/prefs`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

export type WebRouter = {
  push(path: string): void;
  replace(path: string): void;
};

/** Pure factory: callers (the provider) pass the router obtained from their own hook call. */
export function createWebAdapter(router: WebRouter): HostAdapter {
  return {
    Link: WebLink,
    Image: WebImage,
    navigate(path, opts) {
      if (opts?.replace) router.replace(path);
      else router.push(path);
    },
    onBack(handler) {
      const listener = () => {
        handler();
      };
      window.addEventListener('popstate', listener);
      return () => window.removeEventListener('popstate', listener);
    },
    apiFetch: webApiFetch,
    storage: { local: createWebStorage('localStorage'), session: createWebStorage('sessionStorage') },
    env: {
      turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
      origin: process.env.NEXT_PUBLIC_SITE_ORIGIN || CANONICAL_ORIGIN,
    },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    haptic: () => {},
  };
}

/** The Next app root's adapter: the base web adapter plus affiliate ids and browser web push (never in the base, which the app DOM host spreads). */
export function createWebRootAdapter(router: WebRouter): HostAdapter {
  const base = createWebAdapter(router);
  return {
    ...base,
    apiStream: webApiStream,
    env: {
      ...base.env,
      affiliate: {
        awinId: process.env.NEXT_PUBLIC_AWIN_ID,
        amazonAssociatesTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG,
        catchallId: process.env.NEXT_PUBLIC_CATCHALL_ID,
      },
    },
    webPush: webPushHost,
  };
}
