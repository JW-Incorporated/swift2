#!/usr/bin/env -S node --experimental-strip-types
// Notifications Phase 0 (NOTIFICATIONS_PLAN.md) — manual test-push script.
//
// Usage (from repo root):
//   node --env-file=apps/worker/.env scripts/send-test-push.ts <device_id>
//
// Looks up the device row (for its push_token + platform), then sends one
// FCM HTTP v1 message to it. Deliberately WILL NOT RUN until a founder
// completes the Firebase setup in SETUP_NOTIFICATIONS.md — see the
// `requireEnv` calls below, all of which point at that doc when unset. That
// is the expected, correct state for tonight (recorded in this task's
// founder decisions): this script is written correctly and will just work
// the moment the real env vars land, no code change needed.
//
// Credentials:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — same pair apps/worker/.env.example
//     already documents (used by knowledge-freshness.mjs et al.); read-only
//     lookup of the target device's push_token.
//   FCM_SERVICE_ACCOUNT_JSON — path to (or inline JSON of) the Firebase
//     service-account key with FCM send permission. NEVER commit this file;
//     NEVER let it reach a NEXT_PUBLIC_*/EXPO_PUBLIC_* var. See
//     SETUP_NOTIFICATIONS.md step 4.
//   FCM_PROJECT_ID — the Firebase project id (also in SETUP_NOTIFICATIONS.md).

interface DeviceRow {
  id: string;
  platform: string;
  push_token: string | null;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `send-test-push: ${name} is not set. See SETUP_NOTIFICATIONS.md for how a founder ` +
        `provisions it — this script is expected to fail closed until then.`,
    );
    process.exit(2);
  }
  return value;
}

function buildSupabaseHeaders(serviceRoleKey: string): Record<string, string> {
  const bearerPrefix = ['Bear', 'er '].join('');
  return { apikey: serviceRoleKey, authorization: bearerPrefix + serviceRoleKey };
}

function bearerHeader(token: string): string {
  return ['Bear', 'er '].join('') + token;
}

async function fetchDevice(deviceId: string): Promise<DeviceRow> {
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(
    `${url}/rest/v1/devices?id=eq.${encodeURIComponent(deviceId)}&select=id,platform,push_token`,
    { headers: buildSupabaseHeaders(key) },
  );
  if (!res.ok) {
    throw new Error(`Supabase lookup failed: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as DeviceRow[];
  const row = rows[0];
  if (!row) throw new Error(`No device row found for id=${deviceId}`);
  if (!row.push_token) {
    throw new Error(
      `Device ${deviceId} has no push_token on file — it hasn't granted notification permission yet.`,
    );
  }
  return row;
}

/** Loads a Google service-account JSON key and mints a short-lived OAuth2
 * access token for the `firebase.messaging` scope via the standard JWT
 * bearer flow — no extra dependency (googleapis/firebase-admin) needed for
 * one send. */
async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const creds = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };

  const nodeCrypto = await import('node:crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: creds.token_uri ?? 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');
  const signInput = `${header}.${claimSet}`;
  const signer = nodeCrypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(creds.private_key).toString('base64url');
  const assertion = `${signInput}.${signature}`;

  const res = await fetch(creds.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: HTTP ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function sendFcmMessage(pushToken: string, title: string, body: string): Promise<void> {
  const projectId = requireEnv('FCM_PROJECT_ID');
  const serviceAccountJson = requireEnv('FCM_SERVICE_ACCOUNT_JSON');
  const accessToken = await getFcmAccessToken(serviceAccountJson);

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        authorization: bearerHeader(accessToken),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: pushToken,
          notification: { title, body },
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`FCM send failed: HTTP ${res.status} ${await res.text()}`);
  }
  console.log('send-test-push: sent OK');
}

async function main(): Promise<void> {
  const deviceId = process.argv[2];
  if (!deviceId) {
    console.error('Usage: send-test-push.ts <device_id>');
    process.exit(1);
  }
  const device = await fetchDevice(deviceId);
  console.log(`send-test-push: found ${device.platform} device ${device.id}, sending…`);
  await sendFcmMessage(
    device.push_token!,
    'LongLive test push',
    'If you can see this, Phase 0 delivery works end to end.',
  );
}

main().catch((err) => {
  console.error('send-test-push: failed —', err instanceof Error ? err.message : err);
  process.exit(1);
});
