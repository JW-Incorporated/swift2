import { forwardRef, type ComponentProps } from 'react';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { webApiFetch } from '@swift2/content';
import type { HostAdapter, HostImageProps, HostLinkProps, HostStorage } from '@swift2/ui';

const CANONICAL_ORIGIN = 'https://www.longlivets.com';

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
        return area()?.getItem(key) ?? null;
      } catch {
        return null;
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
