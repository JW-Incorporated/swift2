// Marjorie's Discord-then-mail fallback (Marjorie Overhaul C1,
// docs/specs/marjorie-overhaul/c1-delivery.md). The only judgment-free path
// from Marjorie to email: no agent step ever decides to send mail — this
// CLI does, and only on an HTTP-observable Discord failure.
//
// Usage:
//   node post-or-mail.mjs --subject "<subject>" --body-file <path> \
//     [--url <url>] [--thread <id>] [--no-mail-fallback]
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { post } from './lib/discord.mjs';

const SEND_MAIL_PY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../watchdog/send-mail.py',
);

function parseArgs(argv) {
  const args = { subject: '', bodyFile: '', url: '', thread: undefined, noMailFallback: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--subject') args.subject = argv[++i];
    else if (arg === '--body-file') args.bodyFile = argv[++i];
    else if (arg === '--url') args.url = argv[++i];
    else if (arg === '--thread') args.thread = argv[++i];
    else if (arg === '--no-mail-fallback') args.noMailFallback = true;
  }
  return args;
}

/**
 * Runs the existing `send-mail.py` contract and tells apart its two exit-0
 * outcomes (verified in send-mail.py source): an actual send (stdout
 * contains `Mailed [`) vs. a silent no-op because MARJORIE_EMAIL/
 * GMAIL_APP_PASSWORD are unset (stdout contains `skipping`). Exit 1 (a
 * Gmail auth failure) and the unset-creds no-op both count as `neither` —
 * only a confirmed send counts as `email`.
 */
function sendMailFallback(subject, body, url, spawnImpl) {
  const tmpFile = path.join(tmpdir(), `marjorie-mail-${process.pid}-${Date.now()}.json`);
  writeFileSync(tmpFile, JSON.stringify({ subject: `[discord failed] ${subject}`, body, url }));
  const result = spawnImpl('python3', [SEND_MAIL_PY, tmpFile], { encoding: 'utf8' });
  const stdout = result?.stdout || '';
  if (result?.status === 0 && stdout.includes('Mailed [')) return 'email';
  return 'neither';
}

/**
 * @param {string[]} argv
 * @param {{ spawnImpl?: typeof spawnSync }} [deps] Test-only injection point
 *   for the send-mail.py child process, the same way `discord.mjs`'s
 *   `fetchImpl`/`waitImpl` let tests avoid the real thing.
 */
export async function main(argv = process.argv.slice(2), { spawnImpl = spawnSync } = {}) {
  const args = parseArgs(argv);
  const body = readFileSync(args.bodyFile, 'utf8');
  const webhook = process.env.DISCORD_MARJORIE_WEBHOOK_URL || '';

  // A missing/empty webhook is treated exactly like an unreachable one —
  // post() fails the same way either way, no special-casing here.
  const result = await post(body, { webhook, thread: args.thread });

  if (result.ok) {
    console.log('delivered: discord');
    return 0;
  }

  if (args.noMailFallback) {
    console.log('delivered: neither');
    return 0;
  }

  const delivery = sendMailFallback(args.subject, body, args.url, spawnImpl);
  console.log(`delivered: ${delivery}`);
  return delivery === 'neither' ? 1 : 0;
}

// Only auto-run as a CLI; tests import `main` and drive it directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'post-or-mail' });
}
