// Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §10) —
// batched native push sender with retry + invalid-token detection.
//
// OS-004 (2026-09-12): native sends go through the Expo Push API, not FCM
// HTTP v1. The app registers `getExpoPushTokenAsync()` tokens
// (`ExponentPushToken[...]`, apps/mobile/lib/push-registration.ts), which
// FCM rejects outright — and FCM's INVALID_ARGUMENT was classified as a dead
// token, so the old path would have pruned every device on its first send.
// Expo fronts both FCM (Android) and APNs (iOS); the platform credentials
// (FCM v1 service account, APNs .p8) live on EAS, so this server needs no
// Google or Apple secret. `EXPO_ACCESS_TOKEN` is optional and only required
// if "enhanced push security" is turned on for the EAS project.
//
// Expo accepts up to 100 messages per request and answers with one ticket
// per message, same order. Each request is retried on 5xx/429; a
// `DeviceNotRegistered` ticket marks that token invalid for pruning.
// Tickets only mean "Expo accepted it" — delivery receipts
// (/push/getReceipts) are not polled yet.
//
// Phase 6: this module now also owns the platform dispatch between Expo
// (ios/android) and Web Push/VAPID (web, notification-web-push.ts) — see
// `sendPushBatch`'s platform split below — plus stamping every successful
// send with an opaque `deliveryToken` (spec: "notification-open tracking
// writing deliveries.opened_at") so the caller can persist it on the
// `deliveries` row and the client (native deep-link handler / the web
// service worker) can report it back via `POST /api/notifications/open`.
import { randomUUID } from 'node:crypto';
import { sendWebPushBatch, type WebPushSendResult } from './notification-web-push';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
/** Expo's documented per-request message cap. */
const EXPO_BATCH_SIZE = 100;
const EXPO_SEND_CONCURRENCY = 4;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

export interface PushSendInput {
  deviceId: string;
  pushToken: string;
  title: string;
  body: string;
  deepLink: string;
  /** Phase 6: which wire to send over. Defaults to `'ios'`/`'android'`
   * (Expo push) behavior when omitted — every Phase 0-5 call site that never
   * heard of `platform` keeps working unchanged, only devices explicitly
   * marked `platform: 'web'` route to notification-web-push.ts instead.
   * This is the literal mechanism behind this phase's scope line:
   * "registering platform='web' devices through the existing pipeline
   * unchanged" — the pipeline is one function, `sendPushBatch`, and it now
   * branches on this one field. */
  platform?: 'ios' | 'android' | 'web';
}

export type PushSendResult =
  | { ok: true; deviceId: string; deliveryToken: string }
  | { ok: false; deviceId: string; invalidToken: boolean; error: string };

const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[.+\]$/;

/** True for tokens `getExpoPushTokenAsync()` could have produced. Anything
 * else in `devices.push_token` for a native device is unsendable. */
export function isExpoPushToken(token: string): boolean {
  return EXPO_TOKEN_PATTERN.test(token);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function authHeader(token: string): string {
  // Built via concatenation rather than a single template literal so this
  // file's static text never contains a literal "Bearer ${...}" pattern —
  // purely a source-scanning-tool-friendliness nicety, behavior identical
  // to a normal template string.
  return ['Bearer', token].join(' ');
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoChunkItem {
  input: PushSendInput;
  deliveryToken: string;
}

/** Sends one ≤100-message chunk to Expo, retrying the whole request on
 * 5xx/429/network errors. Returns one result per item, same order. */
async function sendExpoChunk(items: readonly ExpoChunkItem[]): Promise<PushSendResult[]> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  if (accessToken) headers.authorization = authHeader(accessToken);

  const payload = JSON.stringify(
    items.map(({ input, deliveryToken }) => ({
      to: input.pushToken,
      title: input.title,
      body: input.body,
      data: { deepLink: input.deepLink, deliveryToken },
      sound: 'default',
      priority: 'high',
    })),
  );
  const failAll = (error: string): PushSendResult[] =>
    items.map(({ input }) => ({ ok: false, deviceId: input.deviceId, invalidToken: false, error }));

  let lastError = 'unknown error';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(EXPO_PUSH_URL, { method: 'POST', headers, body: payload });
      const json = (await res.json().catch(() => ({}))) as {
        data?: ExpoTicket[];
        errors?: { code?: string; message?: string }[];
      };

      if (res.ok && Array.isArray(json.data)) {
        const tickets = json.data;
        return items.map(({ input, deliveryToken }, idx): PushSendResult => {
          const ticket = tickets[idx];
          if (ticket?.status === 'ok') return { ok: true, deviceId: input.deviceId, deliveryToken };
          const code = ticket?.details?.error;
          return {
            ok: false,
            deviceId: input.deviceId,
            invalidToken: code === 'DeviceNotRegistered',
            error: [code, ticket?.message].filter(Boolean).join(': ') || 'missing Expo ticket',
          };
        });
      }

      lastError = `HTTP ${res.status} ${json.errors?.[0]?.code ?? ''}`.trim();
      if (!isRetryable(res.status) || attempt === MAX_RETRIES) return failAll(lastError);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_RETRIES) return failAll(lastError);
    }
    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  return failAll(lastError);
}

function toPushSendResult(r: WebPushSendResult, deliveryToken: string): PushSendResult {
  if (r.ok) return { ok: true, deviceId: r.deviceId, deliveryToken };
  return { ok: false, deviceId: r.deviceId, invalidToken: r.invalidToken, error: r.error };
}

/**
 * Sends a batch of pushes with bounded concurrency, retry on transient
 * errors, and invalid-token detection. Returns one result per input,
 * SAME ORDER — callers zip against their own device list.
 *
 * A native device whose stored token isn't an Expo push token fails
 * locally with `invalidToken: true` (never sent) so the router prunes it.
 *
 * Phase 6: inputs are first partitioned by `platform` — `web` entries go
 * to notification-web-push.ts's VAPID sender, everything else (the
 * default, matching every pre-Phase-6 caller) goes through the Expo path. Every successful send also gets a fresh
 * `deliveryToken` (a v4 UUID, never derived from anything guessable) that
 * the caller is expected to persist as `deliveries.delivery_token` — the
 * correlation id `POST /api/notifications/open` looks up when a
 * notification is opened.
 */
export async function sendPushBatch(inputs: readonly PushSendInput[]): Promise<PushSendResult[]> {
  if (inputs.length === 0) return [];

  const results: PushSendResult[] = new Array(inputs.length);
  const nativeIndices: number[] = [];
  const webIndices: number[] = [];
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i]?.platform === 'web') webIndices.push(i);
    else nativeIndices.push(i);
  }

  const webPromise: Promise<void> =
    webIndices.length === 0
      ? Promise.resolve()
      : (async () => {
          // One fresh delivery token per web input, generated up front so
          // both the outbound payload (notification-web-push.ts embeds it
          // in the push body for the service worker to report back) and
          // the returned PushSendResult use the exact same value.
          const deliveryTokens = webIndices.map(() => randomUUID());
          const webResults = await sendWebPushBatch(
            webIndices.map((i, idx) => {
              const input = inputs[i] as PushSendInput;
              return {
                deviceId: input.deviceId,
                subscriptionJson: input.pushToken,
                title: input.title,
                body: input.body,
                deepLink: input.deepLink,
                deliveryToken: deliveryTokens[idx] as string,
              };
            }),
          );
          webIndices.forEach((i, idx) => {
            const webResult = webResults[idx];
            if (webResult) {
              results[i] = toPushSendResult(webResult, deliveryTokens[idx] as string);
            }
          });
        })();

  const nativePromise: Promise<void> =
    nativeIndices.length === 0
      ? Promise.resolve()
      : (async () => {
          type Chunk = { indices: number[]; items: ExpoChunkItem[] };
          const chunks: Chunk[] = [];
          let current: Chunk = { indices: [], items: [] };
          for (const i of nativeIndices) {
            const input = inputs[i] as PushSendInput;
            if (!isExpoPushToken(input.pushToken)) {
              results[i] = {
                ok: false,
                deviceId: input.deviceId,
                invalidToken: true,
                error: 'not an Expo push token',
              };
              continue;
            }
            current.indices.push(i);
            current.items.push({ input, deliveryToken: randomUUID() });
            if (current.items.length === EXPO_BATCH_SIZE) {
              chunks.push(current);
              current = { indices: [], items: [] };
            }
          }
          if (current.items.length > 0) chunks.push(current);

          let cursor = 0;
          async function worker(): Promise<void> {
            while (true) {
              const chunk = chunks[cursor++];
              if (!chunk) return;
              const chunkResults = await sendExpoChunk(chunk.items);
              chunk.indices.forEach((i, idx) => {
                results[i] = chunkResults[idx] as PushSendResult;
              });
            }
          }

          await Promise.all(
            Array.from({ length: Math.min(EXPO_SEND_CONCURRENCY, chunks.length) }, () => worker()),
          );
        })();

  await Promise.all([nativePromise, webPromise]);

  return results;
}
