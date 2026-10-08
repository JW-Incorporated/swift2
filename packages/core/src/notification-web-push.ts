// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §3) —
// Web Push (VAPID) sender. Sibling to notification-sender.ts's FCM path;
// `sendPushBatch()` there dispatches to THIS module for any `platform:
// 'web'` input instead of FCM, so every existing call site (router,
// digest, fun, cooldown) gets web push "for free" — none of them changed
// their own send-decision logic, only which wire the batch sender uses
// per device, which is the literal meaning of this phase's scope line:
// "registering platform='web' devices through the existing pipeline
// unchanged."
//
// Web devices persist their subscription as `devices.push_token` — the
// SAME column iOS/Android use for an FCM token, just holding a different
// shape of string: the JSON-serialized `PushSubscription` object
// (`{endpoint, keys: {p256dh, auth}}`) the browser's Push API returns from
// `pushManager.subscribe()`. No new device-identity schema needed (see
// the Phase 6 migration's header comment for the full reasoning).
import webpush from 'web-push';

export interface WebPushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface WebPushSendInput {
  deviceId: string;
  /** Raw `devices.push_token` value — the JSON-stringified subscription. */
  subscriptionJson: string;
  title: string;
  body: string;
  deepLink: string;
  /** Opaque per-delivery token embedded in the payload so the service
   * worker's `notificationclick` handler can report back which specific
   * delivery was opened (spec: `deliveries.opened_at`) — see
   * apps/web/public/sw.js. */
  deliveryToken: string;
}

export type WebPushSendResult =
  | { ok: true; deviceId: string }
  | { ok: false; deviceId: string; invalidToken: boolean; error: string };

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

function loadVapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

function parseSubscription(raw: string): WebPushSubscriptionJSON | null {
  try {
    const parsed = JSON.parse(raw) as Partial<WebPushSubscriptionJSON>;
    if (
      typeof parsed.endpoint === 'string' &&
      parsed.endpoint.length > 0 &&
      typeof parsed.keys?.p256dh === 'string' &&
      typeof parsed.keys?.auth === 'string'
    ) {
      return { endpoint: parsed.endpoint, keys: parsed.keys };
    }
    return null;
  } catch {
    return null;
  }
}

/** web-push's error shape for a rejected send — narrowed here so this
 * module doesn't need `web-push`'s own (loosely-typed) exported class as
 * a runtime import beyond what `webpush.sendNotification` already needs. */
interface WebPushErrorLike {
  statusCode?: number;
  body?: string;
  message?: string;
}

function isWebPushErrorLike(err: unknown): err is WebPushErrorLike {
  return typeof err === 'object' && err !== null && 'statusCode' in err;
}

/** Endpoint gone for good — mirrors notification-sender.ts's FCM
 * UNREGISTERED/NOT_FOUND bucket: the push service (FCM-for-web, Mozilla's
 * autopush, etc.) told us this subscription will never work again, so the
 * caller should prune `devices.push_token` for this device. 404/410 are
 * the two codes the Push API spec + every push-service implementation use
 * for "this endpoint no longer exists." */
function isInvalidSubscriptionError(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

/**
 * Sends one batch of web push notifications via VAPID. Same contract as
 * notification-sender.ts's `sendPushBatch` (one result per input, same
 * order, degrades to a clear per-item failure when VAPID isn't configured
 * rather than throwing) so the two are interchangeable from the caller's
 * point of view — see that module's `sendPushBatch` for the platform
 * dispatch that picks between them.
 */
export async function sendWebPushBatch(
  inputs: readonly WebPushSendInput[],
): Promise<WebPushSendResult[]> {
  if (inputs.length === 0) return [];

  const config = loadVapidConfig();
  if (!config) {
    return inputs.map((i) => ({
      ok: false,
      deviceId: i.deviceId,
      invalidToken: false,
      error:
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT not configured — see SETUP_NOTIFICATIONS.md',
    }));
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  return Promise.all(
    inputs.map(async (input): Promise<WebPushSendResult> => {
      const subscription = parseSubscription(input.subscriptionJson);
      if (!subscription) {
        // Malformed/corrupt token — same bucket as an invalid FCM token:
        // never retryable, the caller should prune it.
        return {
          ok: false,
          deviceId: input.deviceId,
          invalidToken: true,
          error: 'stored push_token is not a valid PushSubscription JSON',
        };
      }
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: input.title,
            body: input.body,
            deepLink: input.deepLink,
            deliveryToken: input.deliveryToken,
          }),
        );
        return { ok: true, deviceId: input.deviceId };
      } catch (err) {
        if (isWebPushErrorLike(err) && isInvalidSubscriptionError(err.statusCode)) {
          return {
            ok: false,
            deviceId: input.deviceId,
            invalidToken: true,
            error: `HTTP ${err.statusCode}`,
          };
        }
        const message = isWebPushErrorLike(err)
          ? `HTTP ${err.statusCode ?? '?'} ${err.body ?? err.message ?? ''}`.trim()
          : err instanceof Error
            ? err.message
            : String(err);
        return { ok: false, deviceId: input.deviceId, invalidToken: false, error: message };
      }
    }),
  );
}
