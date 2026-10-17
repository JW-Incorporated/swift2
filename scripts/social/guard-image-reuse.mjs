#!/usr/bin/env node
// Last-line "never post the same picture twice" guard (issue #5990). Runs in
// .github/workflows/social-poster.yml BEFORE the post step, as its own step
// because post-queue.mjs is guard-protected. It refuses — non-zero exit, so the
// job goes red and the post step never runs — when any DUE queue item carries an
// image that matches the posted-image ledger (same picture, any name/size/
// encoding; only the other half of the item's own campaign is exempt).
//
// FAIL CLOSED: an image that cannot be fetched or decoded is a refusal, never a
// pass. The ledger it checks is the committed social/posted-images.json plus
// anything in social/posted/** newer than it (derived here every run, so the
// poster never depends on an append inside post-queue.mjs). A posted image that
// can't be fingerprinted is a ::warning:: only — it can't be matched against,
// but it must not wedge every later post.
//
// HOLD MODE (IMAGE_GUARD_HOLD_DIR set, as in the workflow): instead of failing the
// whole job — which would stall every other due post every 30 minutes — each
// offending item (and its same-campaign siblings, so a pair is never half-posted)
// is moved out of the local checkout's social/queue for this run only, exactly like
// rolling-view.mjs drops settled items locally; `--restore` puts them back before
// anything is committed. Holding can only BLOCK a post, never cause one. The
// workflow then fails the run at the end so the hold is loud.
//
//   node scripts/social/guard-image-reuse.mjs            # fail on any problem
//   IMAGE_GUARD_HOLD_DIR=… node scripts/social/guard-image-reuse.mjs
//   IMAGE_GUARD_HOLD_DIR=… node scripts/social/guard-image-reuse.mjs --restore
import { appendFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildLedger, fingerprintMedia, readLedger, readRecords } from './lib/image-ledger.mjs';
import { checkImageReuse } from './lib/image-reuse.mjs';
import { isDue, isValidScheduledAt } from './lib/queue.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** `{ problems, warnings, checked, offenders }` — `problems` non-empty means a due item must not post; `offenders` are its queue files. */
export async function guardImageReuse({ root = ROOT, now = new Date(), fetchImpl, retryDelayMs } = {}) {
  const problems = [];
  const offenders = new Set();
  const warnings = [];
  const options = { root, ...(fetchImpl ? { fetchImpl } : {}), ...(retryDelayMs !== undefined ? { retryDelayMs } : {}) };
  const memo = new Map();
  const fingerprintOf = (mediaPath) => {
    if (!memo.has(mediaPath)) memo.set(mediaPath, fingerprintMedia(mediaPath, options));
    return memo.get(mediaPath);
  };

  const queue = await readRecords(path.join(root, 'social', 'queue'));
  const posted = await readRecords(path.join(root, 'social', 'posted'));
  const postedFiles = new Set(posted.map((p) => p.file));
  let library = [];
  try {
    library = JSON.parse(await readFile(path.join(root, 'social', 'photo-library.json'), 'utf8')).photos ?? [];
  } catch {
    problems.push('social/photo-library.json is unreadable — refusing to post (fail closed).');
  }

  const { entries: ledger, unresolved } = await buildLedger(posted, await readLedger(root), fingerprintOf);
  for (const u of unresolved) warnings.push(`posted image ${u.file} (${u.post}) could not be fingerprinted; it is absent from the same-picture check.`);

  const due = queue.filter(({ file, data }) => !postedFiles.has(file) && isValidScheduledAt(data) && isDue(data, now));
  for (const { file, data } of due) {
    const { findings, unreadable } = await checkImageReuse(file, data, { ledger, queue: [], fingerprintOf, library, now });
    if (findings.length || unreadable.length) offenders.add(file);
    for (const f of findings) problems.push(`${file}: ${f}`);
    for (const m of unreadable) problems.push(`${file}: media "${m}" could not be fetched or decoded — refusing to post an image that cannot be checked (fail closed).`);
  }
  // A pair is never half-posted: an offender drags its same-campaign queued siblings with it.
  const campaigns = new Set(queue.filter((q) => offenders.has(q.file) && q.data?.campaign).map((q) => q.data.campaign));
  for (const q of queue) if (q.data?.campaign && campaigns.has(q.data.campaign)) offenders.add(q.file);
  return { problems, warnings, checked: due.length, offenders: [...offenders].sort(), global: problems.length > 0 && offenders.size === 0 };
}

/** Move across filesystems safely (runner temp may be a different device from the workspace). */
const move = async (from, to) => {
  await copyFile(from, to);
  await unlink(from);
};

const QUEUE_DIR = path.join(ROOT, 'social', 'queue');

async function restore(holdDir) {
  let held;
  try {
    held = JSON.parse(await readFile(path.join(holdDir, 'held.json'), 'utf8'));
  } catch {
    return;
  }
  for (const file of held) {
    await move(path.join(holdDir, file), path.join(QUEUE_DIR, file));
    console.log(`guard-image-reuse: restored ${file} to social/queue`);
  }
}

async function main() {
  const holdDir = process.env.IMAGE_GUARD_HOLD_DIR;
  if (process.argv.includes('--restore')) {
    if (holdDir) await restore(holdDir);
    return;
  }
  let result;
  try {
    result = await guardImageReuse();
  } catch (err) {
    result = { problems: [`guard-image-reuse crashed: ${err?.stack ?? err}`], warnings: [], checked: 0, offenders: [], global: true };
  }
  for (const w of result.warnings) console.log(`::warning::guard-image-reuse: ${w}`);
  if (result.problems.length) {
    for (const p of result.problems) console.error(`::error::guard-image-reuse: ${p}`);
    if (holdDir && !result.global) {
      await mkdir(holdDir, { recursive: true });
      for (const file of result.offenders) await move(path.join(QUEUE_DIR, file), path.join(holdDir, file));
      await writeFile(path.join(holdDir, 'held.json'), JSON.stringify(result.offenders));
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, 'held=true\n');
      console.error(`guard-image-reuse: HELD ${result.offenders.join(', ')} for this run (not posted); other due items proceed. Remove or replace the image (#5990).`);
      return;
    }
    console.error('guard-image-reuse: REFUSING to post — the same picture must never be posted twice (#5990). Remove or replace the offending queue item.');
    process.exit(1);
  }
  console.log(`guard-image-reuse: ${result.checked} due item(s) checked against the posted-image ledger — no repeats.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
