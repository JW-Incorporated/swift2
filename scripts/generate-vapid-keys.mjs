#!/usr/bin/env -S node --experimental-strip-types
// Notifications Phase 6 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §3) —
// generates a VAPID keypair for Web Push. Thin wrapper around the
// `web-push` package's own generator (same package
// notification-web-push.ts uses to actually SEND, so the keys it produces
// are guaranteed compatible) — this script exists only so there's one
// documented, discoverable command rather than requiring `npx web-push
// generate-vapid-keys` knowledge.
//
// Usage:
//   node scripts/generate-vapid-keys.mjs
//
// Prints the keypair to stdout. For PRODUCTION keys, a founder runs this
// once and stores the result per SETUP_NOTIFICATIONS.md's VAPID section —
// never commit a real keypair to the repo. The keypair this script
// generates is just asymmetric key material (like an SSH keypair) — no
// account, no billing, no external service call — so an agent generating
// one for LOCAL/DEV testing is safe within agent authority; only the
// PRODUCTION keys actually used for real user-facing push need a
// founder's own generation + secret-storage step (or a review of this
// dev-generated pair before promoting it).

import webpush from 'web-push';
import { runMain } from './lib/cli.mjs';

function main() {
  const keys = webpush.generateVAPIDKeys();

  console.log('VAPID keypair generated:\n');
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(
    '\nSet VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY as server-only env vars (never NEXT_PUBLIC_*\n' +
      'for the private key), and NEXT_PUBLIC_VAPID_PUBLIC_KEY as the client-visible public\n' +
      'half. See SETUP_NOTIFICATIONS.md for exactly where. VAPID_SUBJECT is a mailto: or\n' +
      'https: URL identifying the sender (e.g. mailto:ops@longlivets.com) — not generated\n' +
      'here, set it directly.',
  );
}

runMain(main, { name: 'generate-vapid-keys' });
