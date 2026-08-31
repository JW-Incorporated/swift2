// Notifications Phase 6 (NOTIFICATIONS_SPEC.md §2/§3, NOTIFICATIONS_PLAN.md
// Phase 6) — web push subscription client. Mirrors
// apps/mobile/lib/push-registration.ts's shape (device_id + permission +
// token → POST /api/devices/register) but for the browser Push API: the
// "token" is a serialized `PushSubscription`, and the persisted identity
// is a `localStorage` UUID instead of SecureStore (there's no OS Keychain
// equivalent on web — same accepted-tradeoff posture as
// apps/mobile/lib/device-id.ts's own doc comment: survives page reloads,
// not a private/incognito session or a cleared site data).
'use client';

const DEVICE_ID_KEY = 'longlive_web_device_id';

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex
    .slice(8, 10)
    .join('')}-${hex.slice(10, 16).join('')}`;
}

/** Returns this browser's persistent anonymous device id, minting and
 * persisting one on first call — same idempotent-across-lifetime contract
 * as the mobile app's `getOrCreateDeviceId()`. `null` outside a browser
 * (SSR) since `localStorage` doesn't exist there; callers only invoke this
 * client-side. */
export function getOrCreateWebDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = generateDeviceId();
  window.localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

/** True when this browser can plausibly support Web Push at all — Service
 * Worker + Push API + Notification permission API. Safari on iOS only
 * gained this in relatively recent versions and some in-app browsers
 * (Instagram, etc.) never will; callers use this to decide whether to
 * render the "enable notifications" control in the first place, matching
 * spec §7's "never fire the OS permission dialog cold" principle applied
 * to the web equivalent (don't even show the ask if it can't work). */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export type WebPushSubscribeResult =
  | { status: 'subscribed'; deviceId: string }
  | { status: 'permission_denied'; deviceId: string }
  | { status: 'unsupported' }
  | { status: 'vapid_not_configured' }
  | { status: 'error'; error: string };

/**
 * Full subscribe flow: registers the service worker, asks for
 * Notification permission (this DOES show the native permission prompt —
 * only call from an explicit user action, e.g. a settings-page button tap,
 * never on page load, matching spec §7's onboarding principle applied to
 * web), subscribes to Push with the public VAPID key, and registers the
 * resulting subscription as a `platform: 'web'` device through the
 * EXISTING `POST /api/devices/register` pipeline — literally the same
 * endpoint and same `upsertDevice()` upsert-by-id path Phase 0 built,
 * unchanged (this phase's scope line: "registering platform='web' devices
 * through the existing pipeline unchanged").
 */
export async function subscribeToWebPush(
  vapidPublicKey: string | null,
): Promise<WebPushSubscribeResult> {
  if (!isWebPushSupported()) return { status: 'unsupported' };
  if (!vapidPublicKey) return { status: 'vapid_not_configured' };

  const deviceId = getOrCreateWebDeviceId();

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { status: 'permission_denied', deviceId };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const res = await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        platform: 'web',
        // The web "push token" IS the serialized subscription — see
        // notification-web-push.ts's header comment for why no new schema
        // is needed for this.
        pushToken: JSON.stringify(subscription.toJSON()),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      }),
    });
    if (!res.ok) {
      return { status: 'error', error: `devices/register: HTTP ${res.status}` };
    }

    return { status: 'subscribed', deviceId };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

/** Unsubscribes locally (browser-side) and clears the device's stored push
 * token server-side (empty pushToken re-upsert through the same
 * register route — the row stays, but with no token, matching the
 * "invalid/pruned token" state the router already treats as "nothing to
 * send"). Prefs are left untouched — this is "stop sending to this
 * browser," not "forget this device's settings." */
export async function unsubscribeFromWebPush(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!isWebPushSupported()) return { ok: true };
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();

    const deviceId = getOrCreateWebDeviceId();
    const res = await fetch('/api/devices/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId, platform: 'web', pushToken: null }),
    });
    if (!res.ok) return { ok: false, error: `devices/register: HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
