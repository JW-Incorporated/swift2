// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §3/§8)
// — the Web Push service worker for longlivets.com.
//
// Scope, deliberately minimal: this worker's ONLY job is receiving a push
// event and turning it into a native OS notification, then handling a tap
// on that notification. It does NOT do offline caching / PWA asset
// precaching — that's a separate concern this phase doesn't touch, and
// bolting it on here would risk breaking normal page loads for a feature
// (web push) that's opt-in and off by default.
//
// Registered from apps/web/lib/web-push-client.ts's `subscribeToWebPush()`
// at `/sw.js` (root scope, required for a service worker to control the
// whole origin rather than one subpath).

self.addEventListener('install', () => {
  // Activate immediately rather than waiting for all existing tabs to
  // close — this worker has no cached assets to version, so there's no
  // "old worker still serving stale files" risk to guard against.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Renders the native notification for a push event. Payload shape matches
 * exactly what notification-web-push.ts's `sendWebPushBatch` sends:
 * `{ title, body, deepLink, deliveryToken }` — see that module's header
 * comment. Falls back to a generic notification if the payload can't be
 * parsed as JSON (a push with no data body, or a malformed one) rather
 * than throwing and losing the notification entirely.
 */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Long Live',
    body: 'You have a new notification.',
    deepLink: '/',
    deliveryToken: null,
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    // Non-JSON push body — keep the generic fallback above rather than
    // dropping the notification.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicons/heart-hands-192x192.png',
      badge: '/favicons/heart-hands-48x48.png',
      data: { deepLink: payload.deepLink, deliveryToken: payload.deliveryToken },
    }),
  );
});

/**
 * A tap on the notification: (1) reports the open to
 * `POST /api/notifications/open` (spec: "notification-open tracking
 * writing deliveries.opened_at") using `navigator.sendBeacon` where
 * available — fire-and-forget, never blocks focusing/opening the tab —
 * with a `fetch(..., {keepalive: true})` fallback for browsers where
 * `sendBeacon` inside a service worker isn't available; (2) focuses an
 * existing longlivets.com tab if one is open, or opens a new one at the
 * event's deep link otherwise.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { deepLink, deliveryToken } = event.notification.data || {};
  const targetUrl = deepLink || '/';

  event.waitUntil(
    (async () => {
      if (deliveryToken) {
        try {
          await fetch('/api/notifications/open', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ deliveryToken }),
            keepalive: true,
          });
        } catch {
          // Best-effort — a failed open-tracking call must never block the
          // user from actually reaching the notification's destination.
        }
      }

      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })(),
  );
});
