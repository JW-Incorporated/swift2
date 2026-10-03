import type {
  AnchorHTMLAttributes,
  ComponentType,
  CSSProperties,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
  SyntheticEvent,
} from 'react';
import type { ApiFetch } from '@swift2/content';

/** Safe-area insets in CSS px. Package CSS should prefer `var(--safe-*, env(...))`. */
export type Insets = { top: number; right: number; bottom: number; left: number };

export type SharePayload = { title?: string; text?: string; url?: string };

export type HapticKind = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export type NotificationStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/** Per-category on/off map; the category keys are owned by the notifications domain (WP2.12). */
export type NotificationPrefs = Record<string, boolean>;

/**
 * Every anchor attribute passes through (className, aria-*, title, onClick, ...)
 * so a Radix `Slot` (`<Button asChild>`) can merge its props onto the Link. A
 * host Link must also forward its `ref` to the anchor (React.forwardRef).
 */
export type HostLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  /** Opens outside the app/site (new tab on web, system browser in the app). */
  external?: boolean;
};

/**
 * `fill` mode needs a `position: relative` (or otherwise positioned) parent
 * with a size, and hosts MUST replicate next/image's `fill` inline styles
 * (position:absolute; inset:0; width/height:100%; object-fit from className)
 * for pixel parity. See HOST-ADAPTER.md.
 *
 * Covers exactly the `next/image` props apps/web call sites use today.
 * `onLoad` is a function, so it is not JSON-safe: the DOM host implements it
 * natively in-DOM (it never crosses the bridge); the web adapter passes it
 * through to next/image 1:1.
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
  unoptimized?: boolean;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  style?: CSSProperties;
  onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
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
  /** Canonical site origin; identical on server and client (hydration-stable). */
  origin: string;
  /** Affiliate network ids for shop links (web root adapter only; absent = direct retailer links). */
  affiliate?: HostAffiliateEnv;
};

export type HostAffiliateEnv = {
  awinId?: string;
  amazonAssociatesTag?: string;
  catchallId?: string;
};

export type WebPushSubscribeResult =
  | { status: 'subscribed'; deviceId: string }
  | { status: 'permission_denied'; deviceId: string }
  | { status: 'unsupported' }
  | { status: 'vapid_not_configured' }
  | { status: 'error'; error: string };

/** Browser web-push settings surface (web adapter only; the app host omits it). */
export type HostWebPush = {
  isSupported(): boolean;
  getDeviceId(): string;
  subscribe(vapidPublicKey: string | null): Promise<WebPushSubscribeResult>;
  unsubscribe(): Promise<{ ok: true } | { ok: false; error: string }>;
  /** GET /api/devices/:id/prefs; resolves to the parsed body, rejects on HTTP error. */
  loadPrefs(deviceId: string): Promise<unknown>;
  /** PUT /api/devices/:id/prefs; resolves to the parsed body, rejects on HTTP error. */
  savePrefs(deviceId: string, body: { settings?: object; prefs?: object[] }): Promise<unknown>;
};

export type HostNotifications = {
  status(): Promise<NotificationStatus>;
  request(): Promise<NotificationStatus>;
  register(): Promise<void>;
  updatePrefs(prefs: NotificationPrefs): Promise<void>;
};

export interface HostAdapter {
  Link: ForwardRefExoticComponent<HostLinkProps & RefAttributes<HTMLAnchorElement>>;
  Image: ComponentType<HostImageProps>;
  navigate(path: string, opts?: { replace?: boolean }): void;
  /**
   * Maps an app-relative asset path (`/eras/x.png`) to a loadable URL. Web omits
   * it (same-origin path unchanged); the app DOM host (null origin) returns the
   * canonical-origin URL. Use `useResolveUrl()`.
   */
  resolveUrl?: (path: string) => string;
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
  /** @later WP2.12 (web adapter only; the app host omits it) */
  webPush?: HostWebPush;
}
