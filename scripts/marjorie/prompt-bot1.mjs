// CLI for the Marjorie -> bot1 bridge (docs/plans/bots-v2/PLAN.md, C5). Always
// a plain `run:` step in a job that holds the webhook secret, never an agent:
//
//   node scripts/marjorie/prompt-bot1.mjs send --file <prompt.md> [--source <url>] [--dry-run]
//
// Default OFF: sends nothing unless scripts/marjorie/marjorie-config.json has
// `bot1Bridge.enabled: true` AND DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL is set.
// A refusal prints a ::notice:: and exits 0 (a disabled bridge must never turn
// a run red); only bad usage or an unreadable file exits non-zero. Logic and
// rate-limit rationale: lib/bot1-bridge.mjs. Skill: .claude/skills/prompting-bot1/.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import { REPO, loadConfig, runSend } from './lib/bot1-bridge.mjs';

const CONFIG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'marjorie-config.json');
const USAGE = 'usage: prompt-bot1.mjs send --file <prompt.md> [--source <url>] [--dry-run] [--repo owner/repo]';

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    if (!rest[i].startsWith('--')) continue;
    const next = rest[i + 1];
    if (next === undefined || next.startsWith('--')) flags[rest[i].slice(2)] = true;
    else { flags[rest[i].slice(2)] = next; i += 1; }
  }
  return { command, flags };
}

export async function send(flags, { gh = ghRun, env = process.env, nowMs = Date.now(), fetchImpl = fetch, configFile = CONFIG_FILE, log = console.log } = {}) {
  if (typeof flags.file !== 'string') throw new Error(USAGE);
  const result = await runSend({
    text: readFileSync(flags.file, 'utf8'),
    source: typeof flags.source === 'string' ? flags.source : undefined,
    config: loadConfig(configFile),
    repo: typeof flags.repo === 'string' ? flags.repo : REPO,
    dryRun: flags['dry-run'] === true,
    env, nowMs, gh, fetchImpl,
  });
  const { content } = result;
  const summary = { ...result };
  delete summary.content;
  delete summary.body;
  if (result.dryRun) {
    log(`bot1-bridge dry-run: ${result.action} — ${result.reason ?? 'would post'} (${result.used}/${result.limit} used today)`);
    if (content) log(`--- message (flags=${result.flags}) ---\n${content}\n---`);
  } else if (result.action === 'sent') {
    log(`bot1-bridge: sent prompt ${result.id} (${result.used + 1}/${result.limit} today), logged on #${result.trackingIssue}`);
  } else {
    log(`::notice::bot1-bridge: ${result.action} — ${result.reason}`);
  }
  log(JSON.stringify(summary));
  return result;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command !== 'send') throw new Error(USAGE);
  await send(flags);
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/prompt-bot1.mjs')) {
  runMain(main, { name: 'prompt-bot1' });
}
