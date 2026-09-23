// Marjorie's Discord-then-mail fallback (Marjorie Overhaul C1,
// docs/specs/marjorie-overhaul/c1-delivery.md). The only judgment-free path
// from Marjorie to email: no agent step ever decides to send mail — this
// CLI does, and only on an HTTP-observable Discord failure.
//
// Usage:
//   node post-or-mail.mjs --subject "<subject>" --body-file <path> \
//     [--url <url>] [--thread <id>] [--no-mail-fallback]
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
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
  const args = { subject: '', bodyFile: '', url: '', thread: undefined, noMailFallback: false, mentionFounder: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--subject') args.subject = argv[++i];
    else if (arg === '--body-file') args.bodyFile = argv[++i];
    else if (arg === '--url') args.url = argv[++i];
    else if (arg === '--thread') args.thread = argv[++i];
    else if (arg === '--no-mail-fallback') args.noMailFallback = true;
    else if (arg === '--mention-founder') args.mentionFounder = true;
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
  // mkdtempSync (not a predictable pid/timestamp filename) avoids a
  // symlink-race on the shared OS temp dir: it atomically creates a
  // fresh, exclusively-owned directory with a random suffix, so nothing
  // could have pre-created a link at this path (CodeQL js/insecure-temporary-file).
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'marjorie-mail-'));
  const tmpFile = path.join(tmpDir, 'payload.json');
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

  // `--mention-founder` (t_85667a3c): a real @-mention, not just a channel
  // post. FOUNDER_DISCORD_ID reuses the fleet's one existing founder-mention
  // constant (jw-agent-operating-system/tools/ha_lib/common.py's `OWNER`,
  // already live for every HUMAN-ACTIONS.md ping) rather than inventing a
  // second id — a caller opts in per-alert so routine, non-alarm posts
  // (a healthy brief, a routine status close) never ping.
  //
  // `allowed_mentions.users` is only an ALLOWLIST FILTER over mention
  // tokens already present in the posted content — it cannot inject a
  // ping by itself (confirmed against Discord's webhook API). The mention
  // token is therefore prepended to the DISCORD-BOUND text here, not to
  // `body` itself, so the mail fallback (which reuses `body` verbatim,
  // sendMailFallback below) never gets a raw Discord snowflake pasted
  // into an email.
  const FOUNDER_DISCORD_ID = '338508192755482626';
  const mentionUserIds = args.mentionFounder ? [FOUNDER_DISCORD_ID] : [];
  const discordBody = args.mentionFounder ? `<@${FOUNDER_DISCORD_ID}> ${body}` : body;

  // A missing/empty webhook is treated exactly like an unreachable one —
  // post() fails the same way either way, no special-casing here.
  const result = await post(discordBody, { webhook, thread: args.thread, mentionUserIds });

  if (result.ok) {
    console.log('delivered: discord');
    // Reply poller (Marjorie Overhaul M2) needs the posted message's id to
    // find the founder-reply thread later — printed only when `post()`
    // actually got one back, so callers that don't care (or a mocked
    // `post()` in tests) see no extra output.
    if (result.messageId) console.log(`discord-message-id: ${result.messageId}`);
    return 0;
  }

  // Keep failure evidence visible even when a shell captures stdout and
  // exits on this command's failure. Never print provider text or URLs.
  const numeric = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 'unknown';
  const cooldown = result.status === 429 ? ` retryAfterMs=${numeric(result.retryAfterMs)}` : '';
  console.error(`discord-delivery: status=${numeric(result.status)} delivered=${numeric(result.delivered)} chunks=${numeric(result.chunks)}${cooldown}`);

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
