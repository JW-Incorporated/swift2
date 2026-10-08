#!/usr/bin/env node
// One issue per checker — reconciling the tracker with that rule.
//
// WHY THIS EXISTS. A rollup issue's fingerprint used to be hashed over its item
// COUNT (`lib/issues.mjs`, `excerpt: `${fs.length}``). A standing defect class
// whose count drifts by one overnight therefore looked brand new every night,
// so Karen opened another rollup for the same checker. Result on 2026-08-11:
// 24 of 36 open `cie` issues were rollups covering only 11 distinct checkers,
// with `image.host-reputation` alone holding five (194 · 149 · 156 · 245 · 259
// items). `lib/issues.mjs` now hashes the checker alone (`rollupFingerprint`),
// which stops new duplicates — this script cleans up the ones already open, and
// stamps each survivor with the new count-free fingerprint so the next nightly
// recognises it instead of filing one final duplicate.
//
// SAFETY: dry-run by default. `--apply` is required to touch anything, and
// everything it does is reversible — it closes duplicates (reopenable) and only
// ever APPENDS a comment marker to the survivor's body; no body text is removed.
//
//   node --use-env-proxy scripts/content-engine/dedupe-rollups.mjs            # show the plan
//   node --use-env-proxy scripts/content-engine/dedupe-rollups.mjs --apply    # do it
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gh, resolveGh } from '../lib/gh.mjs';
import { rollupFingerprint } from './lib/issues.mjs';
import { CONFIG } from './config.mjs';

const PFX = CONFIG.output.issueLabelPrefix;
const apply = process.argv.includes('--apply');

// `issue edit/comment/close` are deliberately NOT in gh.mjs's REST fallback
// (that fallback covers only the four shapes the nightly needs). This is a
// human-run maintenance one-shot, so require the real CLI and say so plainly
// rather than dying on an unhelpful "no REST fallback implemented for" error.
if (apply && !(await resolveGh())) {
  console.error('dedupe-rollups --apply needs the real `gh` CLI (it edits/comments/closes issues,\nwhich the REST fallback in scripts/lib/gh.mjs does not implement). Install gh and retry.');
  process.exit(2);
}

// `[CIE P2] image.host-reputation: 259 items to review` — the shape createIssues
// gives every rollup, and nothing else in the tracker.
const ROLLUP_TITLE = /^\[CIE (P[0-3])\]\s+([\w.-]+):\s+\d+\s+items to review$/;

const j = async (args) => JSON.parse((await gh(args)).stdout || '[]');

const open = await j(['issue', 'list', '--label', PFX, '--state', 'open', '--json', 'number,title,body,url', '--limit', '500']);

const byChecker = new Map();
for (const it of open) {
  const m = ROLLUP_TITLE.exec(it.title);
  if (!m) continue;
  const checker = m[2];
  if (!byChecker.has(checker)) byChecker.set(checker, []);
  byChecker.get(checker).push(it);
}

let dupes = 0;
for (const [checker, group] of [...byChecker].sort()) {
  // Survivor = the newest (highest number): its item list reflects the corpus
  // as it is now, and its checklist is the one anyone has been ticking.
  group.sort((a, b) => b.number - a.number);
  const [keep, ...close] = group;
  const fp = rollupFingerprint(checker);
  const stamped = (keep.body ?? '').includes(`cie-fp:${fp}`);

  console.log(`\n${checker}  (${group.length} open)`);
  console.log(`  keep    #${keep.number}  ${keep.title}${stamped ? '  [already stamped]' : '  → stamp cie-fp:' + fp}`);
  for (const c of close) console.log(`  close   #${c.number}  ${c.title}`);
  dupes += close.length;

  if (!apply) continue;

  if (!stamped) {
    // Append-only. Read the body we already have, add the marker, write back.
    const body = `${(keep.body ?? '').replace(/\s+$/, '')}\n\n<!-- cie-fp:${fp} -->\n` +
      '<!-- Count-free rollup identity (2026-08-11): this issue is THE tracking issue for\n' +
      `     \`${checker}\`. Karen now recognises it by checker alone, so a drifting item\n` +
      '     count no longer opens a duplicate. See scripts/content-engine/dedupe-rollups.mjs. -->\n';
    // --body-file, never argv: a rollup body runs to ~60KB (image.host-reputation
    // carries 259 checklist lines) and would blow the command-line length limit.
    const bodyPath = join(tmpdir(), `cie-rollup-${keep.number}.md`);
    writeFileSync(bodyPath, body, 'utf8');
    try {
      await gh(['issue', 'edit', String(keep.number), '--body-file', bodyPath]);
    } finally {
      try { unlinkSync(bodyPath); } catch { /* best-effort */ }
    }
    console.log(`  ✓ stamped #${keep.number}`);
  }

  for (const c of close) {
    await gh(['issue', 'comment', String(c.number), '--body',
      `Closing as a duplicate rollup of ${keep.url} (#${keep.number}), which is now the single tracking issue for \`${checker}\`.\n\n` +
      'Nothing is lost: a rollup is a pointer, not a record — the authoritative per-item detail is the committed run report under `docs/audits/engine/`, ' +
      'and the survivor is regenerated from the current corpus on every run.\n\n' +
      'Root cause: rollup issue fingerprints were hashed over the item *count*, so a defect class whose count drifted overnight looked brand new and re-filed. ' +
      'Fixed in `scripts/content-engine/lib/issues.mjs` (`rollupFingerprint`) — identity is the checker alone. ' +
      'Re-open this issue if you were tracking work against it specifically.',
    ]);
    await gh(['issue', 'close', String(c.number)]);
    console.log(`  ✓ closed #${c.number}`);
  }
}

console.log(`\n${byChecker.size} checker(s) with open rollups · ${dupes} duplicate(s) ${apply ? 'closed' : 'to close (dry run — pass --apply)'}.`);
