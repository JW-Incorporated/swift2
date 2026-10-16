#!/usr/bin/env node
// P2-08 social retraction (built INERT, architect ruling #14).
//
//   RETRACTION_SOCIAL_ENABLED=true node scripts/social/retract-post.mjs --dry-run --campaign <name>
//
// Off unless RETRACTION_SOCIAL_ENABLED is exactly "true"; refuses under
// SOCIAL_FREEZE. Dry-run is the default and the only implemented mode: it
// reports which posted items on which platforms it WOULD retract and performs
// no deletion and no network call. It never imports or spawns delete-media.mjs
// or post-queue.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { isRetractionEnabled, isSocialFrozen, planRetraction } from './lib/retraction.mjs';

const POSTED_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'social', 'posted');

function readPosted(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({ file, data: JSON.parse(readFileSync(path.join(dir, file), 'utf8')) }));
}

export async function main({ env = process.env, argv = process.argv.slice(2), log = console.log, postedDir = POSTED_DIR } = {}) {
  if (!isRetractionEnabled(env)) {
    log('retract-post: RETRACTION_SOCIAL_ENABLED is not "true" - nothing to do.');
    return 0;
  }
  if (isSocialFrozen(env)) {
    log(`retract-post: SOCIAL_FREEZE is set ("${env.SOCIAL_FREEZE}") - refusing.`);
    return 0;
  }
  if (argv.includes('--live') || argv.includes('--no-dry-run')) {
    log('retract-post: only dry-run is implemented; live retraction is a go-live decision (X delete tier UNVERIFIED).');
    return 1;
  }
  const at = argv.indexOf('--campaign');
  if (at < 0 || !argv[at + 1]) {
    log('retract-post: --campaign <name> is required.');
    return 1;
  }
  const plan = planRetraction(readPosted(postedDir), argv[at + 1]);
  log(`retract-post: dry-run - ${plan.length} planned step(s), nothing executed.`);
  for (const s of plan) {
    log(`  [${s.platform}] ${s.file}: ${s.action}${s.request ? ` ${s.request.method} ${s.request.url}` : ''}${s.note ? ` - ${s.note}` : ''}`);
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) runMain(main, { name: 'retract-post' });
