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

const FCM_SEND_CONCURRENCY = 20;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

export interface PushSendInput {
  deviceId: string;
  pushToken: string;
  title: string;
  body: string;
  deepLink: string;
}

export type PushSendResult =
  | { ok: true; deviceId: string }
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

async function sendOne(
  accessToken: string,
  projectId: string,
  input: PushSendInput,
): Promise<PushSendResult> {
  let lastError = 'unknown error';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: input.pushToken,
            notification: { title: input.title, body: input.body },
            data: { deepLink: input.deepLink },
          },
        }),
      });

      if (res.ok) return { ok: true, deviceId: input.deviceId };

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
 */
export async function sendPushBatch(inputs: readonly PushSendInput[]): Promise<PushSendResult[]> {
  if (inputs.length === 0) return [];

  const projectId = process.env.FCM_PROJECT_ID;
  const creds = loadCredentials();
  if (!projectId || !creds) {
    return inputs.map((i) => ({
      ok: false,
      deviceId: i.deviceId,
      invalidToken: false,
      error: 'FCM_PROJECT_ID/FCM_SERVICE_ACCOUNT_JSON not configured — see SETUP_NOTIFICATIONS.md',
    }));
  }

  const accessToken = await getFcmAccessToken(creds);
  const results: PushSendResult[] = new Array(inputs.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      const input = inputs[i];
      if (i >= inputs.length || !input) return;
      results[i] = await sendOne(accessToken, projectId as string, input);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FCM_SEND_CONCURRENCY, inputs.length) }, () => worker()),
  );

  return results;
}
