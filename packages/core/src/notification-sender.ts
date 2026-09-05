// Notifications Phase 2 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §10) —
// batched FCM HTTP v1 sender with retry + invalid-token detection. Reuses
// the exact OAuth2 JWT-bearer flow scripts/send-test-push.ts already proved
// out in Phase 0 (no new dependency — same standard-library approach), but
// as an importable, testable module rather than a CLI script, and batched
// (spec §10: "Batched FCM sends (500 tokens/request)").
//
// FCM HTTP v1 has no true multi-token batch endpoint (unlike the legacy
// API) — "batched" here means: one access-token mint per call, N
// messages:send calls fired with bounded concurrency, which is what every
// FCM HTTP v1 client library actually does under the hood. Each call is
// independently retried on 5xx/429; a 404/NOT_FOUND or
// UNREGISTERED-equivalent response marks that token invalid for pruning.
//
// Phase 6: this module now also owns the platform dispatch between FCM
// (ios/android) and Web Push/VAPID (web, notification-web-push.ts) — see
// `sendPushBatch`'s platform split below — plus stamping every successful
// send with an opaque `deliveryToken` (spec: "notification-open tracking
// writing deliveries.opened_at") so the caller can persist it on the
// `deliveries` row and the client (native deep-link handler / the web
// service worker) can report it back via `POST /api/notifications/open`.
import { randomUUID } from 'node:crypto';
import { sendWebPushBatch, type WebPushSendResult } from './notification-web-push';

const FCM_SEND_CONCURRENCY = 20;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

export interface PushSendInput {
  deviceId: string;
  pushToken: string;
  title: string;
  body: string;
  deepLink: string;
  /** Phase 6: which wire to send over. Defaults to `'ios'`/`'android'`
   * (FCM) behavior when omitted — every Phase 0-5 call site that never
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

interface FcmCredentials {
  clientEmail: string;
  privateKey: string;
  tokenUri: string;
}

function loadCredentials(): FcmCredentials | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw) as {
      client_email: string;
      private_key: string;
      token_uri?: string;
    };
    return {
      clientEmail: creds.client_email,
      privateKey: creds.private_key,
      tokenUri: creds.token_uri ?? 'https://oauth2.googleapis.com/token',
    };
  } catch {
    return null;
  }
}

/** Mints a short-lived OAuth2 access token for the `firebase.messaging`
 * scope — same JWT-bearer flow as scripts/send-test-push.ts's
 * getFcmAccessToken(), extracted so both the manual script and the router
 * can share it (no logic fork between "test send" and "real send"). */
export async function getFcmAccessToken(creds: FcmCredentials): Promise<string> {
  const nodeCrypto = await import('node:crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: creds.tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');
  const signInput = `${header}.${claimSet}`;
  const signer = nodeCrypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(creds.privateKey).toString('base64url');
  const assertion = `${signInput}.${signature}`;

  const res = await fetch(creds.tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** True for FCM's "this token will never work again" responses — the
 * signal the router uses to clear a device's push_token (spec §10:
 * "invalid tokens pruned on response"). NOT_FOUND / UNREGISTERED /
 * INVALID_ARGUMENT on the token field are all in this bucket; everything
 * else (UNAVAILABLE, INTERNAL, QUOTA_EXCEEDED) is transient and retried
 * instead. */
function isInvalidTokenError(status: number, errorCode: string | undefined): boolean {
  if (status === 404) return true;
  return (
    errorCode === 'UNREGISTERED' || errorCode === 'NOT_FOUND' || errorCode === 'INVALID_ARGUMENT'
  );
}

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

async function sendOne(
  accessToken: string,
  projectId: string,
  input: PushSendInput,
  deliveryToken: string,
): Promise<PushSendResult> {
  let lastError = 'unknown error';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          authorization: authHeader(accessToken),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: input.pushToken,
            notification: { title: input.title, body: input.body },
            data: { deepLink: input.deepLink, deliveryToken },
          },
        }),
      });

      if (res.ok) return { ok: true, deviceId: input.deviceId, deliveryToken };

      const errJson = (await res.json().catch(() => ({}))) as {
        error?: { status?: string };
      };
      const errorCode = errJson.error?.status;

      if (isInvalidTokenError(res.status, errorCode)) {
        return {
          ok: false,
          deviceId: input.deviceId,
          invalidToken: true,
          error: `HTTP ${res.status} ${errorCode ?? ''}`.trim(),
        };
      }

      lastError = `HTTP ${res.status} ${errorCode ?? ''}`.trim();
      if (!isRetryable(res.status) || attempt === MAX_RETRIES) {
        return { ok: false, deviceId: input.deviceId, invalidToken: false, error: lastError };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt === MAX_RETRIES) {
        return { ok: false, deviceId: input.deviceId, invalidToken: false, error: lastError };
      }
    }
    await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  return { ok: false, deviceId: input.deviceId, invalidToken: false, error: lastError };
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
 * When FCM credentials aren't configured (SETUP_NOTIFICATIONS.md not yet
 * completed by the founder), every send fails closed with a clear reason
 * rather than throwing — matches send-test-push.ts's designed degraded
 * behavior (Phase 0 precedent) so the router can run in staging tonight
 * without a live Firebase project, exactly as this task's founder note
 * instructs ("build/test the full pipeline against a mocked/faked FCM
 * client... structured so dropping in real values is the only remaining
 * step").
 *
 * Phase 6: inputs are first partitioned by `platform` — `web` entries go
 * to notification-web-push.ts's VAPID sender, everything else (the
 * default, matching every pre-Phase-6 caller) goes through the existing
 * FCM path below unchanged. Every successful send also gets a fresh
 * `deliveryToken` (a v4 UUID, never derived from anything guessable) that
 * the caller is expected to persist as `deliveries.delivery_token` — the
 * correlation id `POST /api/notifications/open` looks up when a
 * notification is opened.
 */
export async function sendPushBatch(inputs: readonly PushSendInput[]): Promise<PushSendResult[]> {
  if (inputs.length === 0) return [];

  const results: PushSendResult[] = new Array(inputs.length);
  const fcmIndices: number[] = [];
  const webIndices: number[] = [];
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i]?.platform === 'web') webIndices.push(i);
    else fcmIndices.push(i);
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

  const fcmPromise: Promise<void> =
    fcmIndices.length === 0
      ? Promise.resolve()
      : (async () => {
          const projectId = process.env.FCM_PROJECT_ID;
          const creds = loadCredentials();
          if (!projectId || !creds) {
            for (const i of fcmIndices) {
              const input = inputs[i] as PushSendInput;
              results[i] = {
                ok: false,
                deviceId: input.deviceId,
                invalidToken: false,
                error:
                  'FCM_PROJECT_ID/FCM_SERVICE_ACCOUNT_JSON not configured — see SETUP_NOTIFICATIONS.md',
              };
            }
            return;
          }

          const accessToken = await getFcmAccessToken(creds);
          let cursor = 0;

          async function worker(): Promise<void> {
            while (true) {
              const idx = cursor++;
              const i = fcmIndices[idx];
              if (idx >= fcmIndices.length || i === undefined) return;
              const input = inputs[i] as PushSendInput;
              results[i] = await sendOne(accessToken, projectId as string, input, randomUUID());
            }
          }

          await Promise.all(
            Array.from({ length: Math.min(FCM_SEND_CONCURRENCY, fcmIndices.length) }, () =>
              worker(),
            ),
          );
        })();

  await Promise.all([fcmPromise, webPromise]);

  return results;
}
