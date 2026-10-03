import type { ComponentType, ReactNode } from 'react';
import type { ApiFetch } from '@swift2/content';

/** Safe-area insets in CSS px. Package CSS should prefer `var(--safe-*, env(...))`. */
export type Insets = { top: number; right: number; bottom: number; left: number };

export type SharePayload = { title?: string; text?: string; url?: string };

export type HapticKind = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export type NotificationStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/** Per-category on/off map; the category keys are owned by the notifications domain (WP2.12). */
export type NotificationPrefs = Record<string, boolean>;

export type HostLinkProps = {
  href: string;
  children?: ReactNode;
  className?: string;
  prefetch?: boolean;
  /** Opens outside the app/site (new tab on web, system browser in the app). */
  external?: boolean;
};

/**
 * `fill` mode needs a `position: relative` (or otherwise positioned) parent
 * with a size, and hosts MUST replicate next/image's `fill` inline styles
 * (position:absolute; inset:0; width/height:100%; object-fit from className)
 * for pixel parity. See HOST-ADAPTER.md.
 */
export type HostImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export type Unsubscribe = () => void;

export type HostStorage = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export type HostEnv = {
  /** Cloudflare Turnstile site key; null when unset or when the host origin cannot verify (app DOM host is a null origin). */
  turnstileSiteKey: string | null;
  origin: string;
};

export type HostNotifications = {
  status(): Promise<NotificationStatus>;
  request(): Promise<NotificationStatus>;
  register(): Promise<void>;
  updatePrefs(prefs: NotificationPrefs): Promise<void>;
};

export interface HostAdapter {
  Link: ComponentType<HostLinkProps>;
  Image: ComponentType<HostImageProps>;
  navigate(path: string, opts?: { replace?: boolean }): void;
  /**
   * Subscribes to the host's back gesture (web: popstate, app: hardware/swipe
   * back). The handler returns true when it consumed the event. Returns an unsubscribe.
   */
  onBack(handler: () => boolean): Unsubscribe;
  /** Transport for `/api/*` (X1). Same shape as WP0.3b's `ApiFetch`. */
  apiFetch: ApiFetch;
  storage: { local: HostStorage; session: HostStorage };
  env: HostEnv;
  insets: Insets;

  /** @later WP2.4/2.5 */
  lazy?: <T>(loader: () => Promise<{ default: ComponentType<T> }>) => ComponentType<T>;
  /** @later WP2.5 */
  share?: (payload: SharePayload) => Promise<void>;
  /** @later WP2.x (web: no-op) */
  haptic?: (kind: HapticKind) => void;
  /** @later WP2.5 */
  openExternal?: (url: string) => void;
  /** @later WP2.12 */
  notifications?: HostNotifications;
}
