#!/usr/bin/env node
// Agent-safe wrapper for flipping NON-SECRET repo variables (founder decision
// 2026-10-06, docs/decisions.md). guard.sh denies raw `gh variable set`; this
// is the only sanctioned path. It never deletes (a deleted SOCIAL_FREEZE reads
// as unfrozen) and never touches secrets.
//
//   node scripts/ops/set-switch.mjs <NAME> <VALUE> --reason "why"
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPO = 'JW-Incorporated/swift2';

export const BOOL_SWITCHES = new Set([
  'AWARENESS_LANE_ENABLED',
  'BOT_CHAT_ENABLED',
  'CODE_SCANNING_ENABLED',
  'COMMUNITY_CRAWL_ENABLED',
  'COMMUNITY_SCAN_ENABLED',
  'CONCERT_PHOTO_SOURCING_ENABLED',
  'REPLY_NOTIFIER_ENABLED',
]);
export const INT_SWITCHES = new Set(['COMMUNITY_CRAWL_BUDGET']);
// Freezes are brakes: agents may engage them, never lift them.
export const FREEZE_ON_ONLY = new Set(['SOCIAL_FREEZE', 'CONTENT_AUTOMERGE_FREEZE']);

export const DENYLIST = {
  MARJORIE_EMAIL: 'notification address (identity), founder-only',
  DISCORD_FOUNDER_IDS: 'approval identity: who may approve social drafts, founder-only',
  OWNER_DISCORD_ID: 'approval identity, founder-only',
  HOME_RELAY_URL: 'points the pipeline at the home relay host, founder-only',
};
const DENY_FRAGMENT = /TOKEN|KEY|SECRET|PASSWORD|WEBHOOK|ID|EMAIL/;

export const LEDGER_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../docs/ops/switch-ledger.md',
);

export function validate(name, value, reason) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name ?? '')) return `invalid variable name "${name}"`;
  if (name in DENYLIST) return `${name} is founder-only: ${DENYLIST[name]}`;
  if (DENY_FRAGMENT.test(name)) return `${name} looks like a secret/identity variable (founder-only)`;
  const known = BOOL_SWITCHES.has(name) || INT_SWITCHES.has(name) || FREEZE_ON_ONLY.has(name);
  if (!known) return `${name} is not on the agent allowlist (founder-only)`;
  if (FREEZE_ON_ONLY.has(name)) {
    if (value !== 'true') return `${name} may only be set to "true" by agents; only the founder lifts it`;
  } else if (BOOL_SWITCHES.has(name)) {
    if (value !== 'true' && value !== 'false') return `${name} must be "true" or "false"`;
  } else if (!/^[1-9][0-9]*$/.test(value ?? '')) {
    return `${name} must be a positive integer`;
  }
  if (!reason || !reason.trim()) return 'a --reason "..." is required';
  return null;
}

function defaultGh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function setSwitch({ name, value, reason }, { gh = defaultGh, appendLedger, now = () => new Date() } = {}) {
  const err = validate(name, value, reason);
  if (err) return { ok: false, error: err };
  let oldValue = '(unset)';
  try {
    const got = gh(['variable', 'get', name, '--repo', REPO]).trim();
    if (got) oldValue = got;
  } catch {
    // unset variable: gh exits nonzero
  }
  gh(['variable', 'set', name, '--repo', REPO, '--body', value]);
  const line = `| ${now().toISOString()} | ${name} | ${oldValue} -> ${value} | ${reason.replace(/\|/g, '/').replace(/\s+/g, ' ').trim()} |\n`;
  (appendLedger ?? ((l) => appendFileSync(LEDGER_PATH, l)))(line);
  return { ok: true, line };
}

function parseArgs(argv) {
  const pos = [];
  let reason;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--reason') reason = argv[++i];
    else pos.push(argv[i]);
  }
  return { name: pos[0], value: pos[1], reason };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = setSwitch(parseArgs(process.argv.slice(2)));
  if (!res.ok) {
    console.error(`set-switch refused: ${res.error}`);
    process.exit(1);
  }
  console.log(`set-switch ok: ${res.line.trim()}`);
}
