#!/usr/bin/env node
// Delivers the payload shadow-report.mjs wrote, to #longlive-marjorie, with Marjorie's own
// `post` helper (the one scripts/marjorie/status-page.mjs uses). Posting is on unless
// TIDEWATCH_REPORT_POST_ENABLED is exactly "false". After a successful alert post it merges
// the payload's stateUpdate into --state-file so the next run can de-duplicate.
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { runMain } from '../lib/cli.mjs';
import { isMain } from '../lib/is-main.mjs';
import { post as discordPost } from '../marjorie/lib/discord.mjs';

function parseArgs(argv) {
  const options = { payload: 'tidewatch-discord-payload.json', stateFile: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--payload') options.payload = argv[++i];
    else if (argv[i] === '--state-file') options.stateFile = argv[++i];
    else throw new Error('usage: shadow-report-post.mjs [--payload file] [--state-file file]');
  }
  return options;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const env = deps.env ?? process.env;
  const log = deps.log ?? console.log;
  const payload = deps.payload ?? await readJson(options.payload, null);
  if (!payload?.text) { log('no payload to post'); return { posted: false }; }
  if (env.TIDEWATCH_REPORT_POST_ENABLED === 'false') {
    log('discord post disabled by TIDEWATCH_REPORT_POST_ENABLED=false');
    return { posted: false };
  }
  const webhook = env.DISCORD_MARJORIE_WEBHOOK_URL || '';
  if (!webhook) { log('DISCORD_MARJORIE_WEBHOOK_URL not set; not posted'); return { posted: false }; }
  const result = await (deps.post ?? discordPost)(payload.text, { webhook });
  if (!result.ok) throw new Error(`Discord post failed: ${result.error}`);
  const update = payload.stateUpdate ?? {};
  if (options.stateFile && Object.keys(update).length > 0) {
    const state = deps.state ?? await readJson(options.stateFile, {});
    await (deps.writeFile ?? writeFile)(options.stateFile, `${JSON.stringify({ ...state, ...update })}\n`);
    if (env.GITHUB_OUTPUT) await (deps.appendFile ?? appendFile)(env.GITHUB_OUTPUT, 'state_updated=true\n');
  }
  return { posted: true };
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'tidewatch-shadow-report-post' });
