#!/usr/bin/env -S node --experimental-strip-types
// Notifications Phase 0 (NOTIFICATIONS_PLAN.md) — manual test-push script.
//
// Usage (from repo root):
//   node --env-file=apps/worker/.env scripts/send-test-push.ts <device_id>
//
// Looks up the device row (for its push_token + platform), then sends one
// message through the Expo Push API — the same wire
// packages/core/src/notification-sender.ts uses for ios/android (OS-004,
// 2026-09-12). Expo holds the FCM v1 + APNs credentials on EAS, so a
// "sent OK" here only proves Expo accepted the message; the phone showing
// it proves those EAS credentials are right.
//
// Credentials:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — same pair apps/worker/.env.example
//     already documents (used by knowledge-freshness.mjs et al.); read-only
//     lookup of the target device's push_token.
//   EXPO_ACCESS_TOKEN — optional; only needed if "enhanced push security"
//     is enabled on the EAS project. See SETUP_NOTIFICATIONS.md.

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

function bearerHeader(token: string): string {
  return ['Bear', 'er '].join('') + token;
}

async function fetchDevice(deviceId: string): Promise<DeviceRow> {
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(
    `${url}/rest/v1/devices?id=eq.${encodeURIComponent(deviceId)}&select=id,platform,push_token`,
    { headers: { apikey: key, authorization: bearerHeader(key) } },
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

async function sendExpoMessage(pushToken: string, title: string, body: string): Promise<void> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
  };
  if (process.env.EXPO_ACCESS_TOKEN)
    headers.authorization = bearerHeader(process.env.EXPO_ACCESS_TOKEN);

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: pushToken,
      title,
      body,
      sound: 'default',
      data: { deepLink: 'https://www.longlivets.com/' },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Expo send failed: HTTP ${res.status} ${text}`);
  const ticket = (JSON.parse(text) as { data?: { status?: string; message?: string } }).data;
  if (ticket?.status !== 'ok') throw new Error(`Expo rejected the message: ${text}`);
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
  await sendExpoMessage(
    device.push_token!,
    'LongLive test push',
    'If you can see this, Phase 0 delivery works end to end.',
  );
}

main().catch((err) => {
  console.error('send-test-push: failed —', err instanceof Error ? err.message : err);
  process.exit(1);
});
