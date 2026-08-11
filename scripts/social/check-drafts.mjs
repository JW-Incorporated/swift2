#!/usr/bin/env node
// Draft-time quality gate for social/queue/**.json — see social/README.md's
// "Draft-time checks" section. This is now the MAIN quality gate for what
// ships (WS1+WS5, 2026-08-11): the post-time guards in lib/queue.mjs exist
// to stop a bad draft from posting wrong, but by the time a draft is posting
// it has already sat in the queue occupying a slot for potentially days —
// this catches the same classes of problem before the draft's PR ever
// merges, which is strictly cheaper.
//
// Four independent rule families:
//   - voice        — reuses scripts/content-engine/checkers/voice.mjs's
//                     surname-overuse / ai-tell / wire-attribution rules
//                     verbatim against the draft's body (not re-implemented).
//   - openers       — bans the "did you know" formula opener outright, and
//                     flags a draft whose first 6 words match the opening of
//                     any post from the last 14 days or any other queue item.
//   - cross-post copy — an X draft that reads as a near-clone of its IG
//                     sibling (same `campaign`) is what has been causing X's
//                     duplicate-content 403s (11 of 12 social/failed/ items
//                     as of 2026-08-11).
//   - media         — IG drafts must have media; every media path must
//                     exist under apps/web/public/; generic era-cover art
//                     needs "mediaKind": "era-art" and must not repeat the
//                     last 10 posted Instagram items; non-era media must
//                     not repeat them either.
//
// Usage:
//   node scripts/social/check-drafts.mjs                # checks every file in social/queue/
//   node scripts/social/check-drafts.mjs <file> [file…]  # checks only the given files
//     (repo-relative or absolute paths) — what
//     .github/workflows/auto-merge-content.yml passes: just the files a PR
//     actually touched, so tightening a rule after older items already
//     shipped doesn't retroactively fail every future PR that merely touches
//     social/queue/ near them.
//
// Exits non-zero with a readable findings list if anything fails.

import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkSurnameOveruse, checkAiTells, checkWireAttribution } from '../content-engine/checkers/voice.mjs';
import { isGenericEraArt, repeatsRecentIgMedia } from './lib/queue.mjs';
import { MAX_X_IMAGES } from './lib/platforms.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public');

const OPENER_WORDS = 6;
const POSTED_LOOKBACK_DAYS = 14;
const SIBLING_SIMILARITY_THRESHOLD = 0.8;
const ERA_ART_LOOKBACK = 10;

async function readJsonDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    const full = path.join(dir, file);
    out.push({ file, full, data: JSON.parse(await readFile(full, 'utf-8')) });
  }
  return out;
}

function firstWords(text, n) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .slice(0, n)
    .join(' ');
}

function tokenSet(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

// Word-level OVERLAP coefficient (intersection / size of the SMALLER set),
// not Jaccard (intersection / union). An X sibling is deliberately trimmed
// and shorter than its IG counterpart — Jaccard's union-sized denominator
// punishes that length gap and undercounts genuine near-duplicates (the
// real 2026-08-10 TTPD IG/X pair, an near-verbatim trim that plausibly
// triggered an X duplicate-content 403 per the failed/ evidence, scores only
// ~0.37 on Jaccard but ~0.89 on overlap). Overlap asks the right question
// for THIS check: "is nearly everything in the shorter draft also in the
// longer one," which is exactly what "trimmed the IG caption down for X"
// looks like, and is far less fooled by the length asymmetry than Jaccard.
export function bodySimilarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / Math.min(A.size, B.size);
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Voice rules — reuses voice.mjs's checkers rather than re-implementing
 * the surname/ai-tell/wire-attribution regexes for drafts. */
export async function checkVoice(file, body) {
  const asContentItem = [{ type: 'social-draft', file, era: null, key: file, texts: { body } }];
  const [surname, aiTell, wire] = await Promise.all([
    checkSurnameOveruse(asContentItem),
    checkAiTells(asContentItem),
    checkWireAttribution(asContentItem),
  ]);
  return [...surname, ...aiTell, ...wire].map((f) => `voice (${f.checker}): ${f.evidence}`);
}

export function checkOpeners(file, item, others) {
  const findings = [];
  const trimmed = String(item.body ?? '').trim();
  if (/^did you know/i.test(trimmed)) {
    findings.push('opener: body opens with "did you know" — banned formula opener, rewrite the hook.');
  }
  const mine = firstWords(item.body, OPENER_WORDS);
  if (mine) {
    for (const other of others) {
      if (other.file === file) continue;
      const theirs = firstWords(other.body, OPENER_WORDS);
      if (theirs && theirs === mine) {
        findings.push(`opener: first ${OPENER_WORDS} words ("${mine}") match ${other.file} — formula opener, vary the hook.`);
      }
    }
  }
  return findings;
}

export function checkCrossPostCopy(file, item, allQueueItems) {
  if (item.platform !== 'x' || !item.campaign) return [];
  const sibling = allQueueItems.find((o) => o.file !== file && o.data.platform === 'instagram' && o.data.campaign === item.campaign);
  if (!sibling) return [];
  const similarity = bodySimilarity(item.body, sibling.data.body);
  if (similarity > SIBLING_SIMILARITY_THRESHOLD) {
    return [
      `cross-post copy: ${Math.round(similarity * 100)}% similar to its Instagram sibling ${sibling.file} (campaign "${item.campaign}") — ` +
        'near-identical siblings are what trigger X\'s duplicate-content 403s and break the platform-native rule. Rewrite the X version distinctly.',
    ];
  }
  return [];
}

export async function checkMedia(file, item, recentIgPosted) {
  const findings = [];
  if (item.platform === 'instagram' && !item.media?.length) {
    findings.push('media: Instagram drafts require at least one image in `media`.');
    return findings; // nothing else to check without media
  }
  if (item.platform === 'x' && (item.media?.length ?? 0) > MAX_X_IMAGES) {
    findings.push(`media: X posts support at most ${MAX_X_IMAGES} images (this draft has ${item.media.length}).`);
  }
  for (const mediaPath of item.media ?? []) {
    const full = path.join(PUBLIC_DIR, mediaPath);
    if (!(await fileExists(full))) {
      findings.push(`media: "${mediaPath}" does not exist under apps/web/public/ — commit it in this PR.`);
      continue;
    }
    if (isGenericEraArt(mediaPath)) {
      if (item.mediaKind !== 'era-art') {
        findings.push(
          `media: "${mediaPath}" is generic era-cover art but the draft is missing "mediaKind": "era-art" — source a real dedicated photo, or add the tag if the fallback is genuinely intended.`,
        );
      } else if (repeatsRecentIgMedia(mediaPath, recentIgPosted, ERA_ART_LOOKBACK)) {
        findings.push(`media: "${mediaPath}" (declared era art) repeats one of the last ${ERA_ART_LOOKBACK} posted Instagram items.`);
      }
    } else if (repeatsRecentIgMedia(mediaPath, recentIgPosted, ERA_ART_LOOKBACK)) {
      findings.push(
        `media: "${mediaPath}" repeats one of the last ${ERA_ART_LOOKBACK} posted Instagram items' media — even a dedicated photo shouldn't ship twice that soon.`,
      );
    }
  }
  return findings;
}

async function recentInstagramPosted(n = ERA_ART_LOOKBACK) {
  const posted = (await readJsonDir(POSTED_DIR)).map((p) => p.data).filter((d) => d.platform === 'instagram');
  return posted.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt)).slice(-n);
}

async function recentPostedOpeners(days = POSTED_LOOKBACK_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const posted = await readJsonDir(POSTED_DIR);
  return posted.filter((p) => p.data.postedAt && new Date(p.data.postedAt).getTime() >= cutoff).map((p) => ({ file: p.file, body: p.data.body }));
}

/** Resolves CLI args to absolute file paths, or null meaning "everything in social/queue/". */
function resolveTargets(args) {
  if (!args.length) return null;
  return args.map((a) => (path.isAbsolute(a) ? a : path.resolve(ROOT, a)));
}

export async function checkDraft(target, { allQueue, openerContext, recentIg }) {
  return [
    ...(await checkVoice(target.file, target.data.body)),
    ...checkOpeners(target.file, target.data, openerContext),
    ...checkCrossPostCopy(target.file, target.data, allQueue),
    ...(await checkMedia(target.file, target.data, recentIg)),
  ];
}

async function main() {
  const targetPaths = resolveTargets(process.argv.slice(2));
  const allQueue = await readJsonDir(QUEUE_DIR);
  const targets = targetPaths ? allQueue.filter((q) => targetPaths.includes(q.full)) : allQueue;

  if (targetPaths) {
    const foundFulls = new Set(targets.map((t) => t.full));
    for (const p of targetPaths) {
      if (!foundFulls.has(p)) console.error(`check-drafts: WARNING — requested file not found under social/queue/: ${p}`);
    }
  }

  if (!targets.length) {
    console.log('check-drafts: no target queue files found — nothing to check.');
    return;
  }

  const recentIg = await recentInstagramPosted();
  const recentPosted = await recentPostedOpeners();
  const openerContext = [...recentPosted, ...allQueue.map((q) => ({ file: q.file, body: q.data.body }))];

  let hadFindings = false;
  for (const target of targets) {
    const findings = await checkDraft(target, { allQueue, openerContext, recentIg });
    if (findings.length) {
      hadFindings = true;
      console.error(`\nFAIL ${target.file}`);
      for (const f of findings) console.error(`  - ${f}`);
    } else {
      console.log(`OK   ${target.file}`);
    }
  }

  if (hadFindings) {
    console.error('\ncheck-drafts: one or more queue drafts failed quality checks (see above).');
    process.exit(1);
  }
  console.log('\ncheck-drafts: all checked drafts passed.');
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`check-drafts: crashed: ${err.stack ?? err}`);
    process.exit(1);
  });
}
