#!/usr/bin/env node
// P2-06 breaking social fast path (built INERT, architect ruling #14).
//
//   BREAKING_SOCIAL_ENABLED=true node scripts/social/breaking-draft.mjs --dry-run --pair <file.json>
//
// Off unless BREAKING_SOCIAL_ENABLED is exactly "true": returns before any
// import of child_process, any fetch, any gh call. Even when on, this script
// only validates a drafted pair (dry-run). A real draft is a normal
// tree/draft/* PR by the Tree identity, cleared by the existing
// social-tree-approve.yml and posted on social-poster.yml's own clock; nothing
// here writes an approval key or dispatches any workflow.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { isBreakingEnabled, isSocialFrozen, shapeBreakingPair } from './lib/breaking.mjs';

export async function main({ env = process.env, argv = process.argv.slice(2), log = console.log, readFile = readFileSync } = {}) {
  if (!isBreakingEnabled(env)) {
    log('breaking-draft: BREAKING_SOCIAL_ENABLED is not "true" - nothing to do.');
    return 0;
  }
  if (isSocialFrozen(env)) {
    log(`breaking-draft: SOCIAL_FREEZE is set ("${env.SOCIAL_FREEZE}") - refusing.`);
    return 0;
  }
  if (!argv.includes('--dry-run')) {
    log('breaking-draft: only --dry-run is implemented; live drafting is gated on the P2-12 drill.');
    return 1;
  }
  const at = argv.indexOf('--pair');
  if (at < 0 || !argv[at + 1]) {
    log('breaking-draft: --pair <file.json> is required.');
    return 1;
  }
  const { items, findings } = shapeBreakingPair(JSON.parse(readFile(argv[at + 1], 'utf8')));
  if (findings.length) {
    for (const f of findings) log(`  ${f}`);
    return 1;
  }
  log(`breaking-draft: dry-run ok - ${items.length} items valid, nothing written.`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runMain(main, { name: 'breaking-draft' });
