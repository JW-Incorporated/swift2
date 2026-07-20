#!/usr/bin/env node
// Content Integrity Engine (CIE) — orchestrator / CLI.
// READ-ONLY on content. Produces findings → a run report → GitHub issues.
// Never edits supabase/seed/**, the DB, or generated files.
//
// Usage:
//   node scripts/content-engine/run.mjs scan            # deterministic checkers → findings + report
//   node scripts/content-engine/run.mjs scan --no-images# skip the network image pass (fast)
//   node scripts/content-engine/run.mjs prep-agents     # write scoped inputs for the agent review passes
//   node scripts/content-engine/run.mjs ingest          # merge deterministic + agent findings
//   node scripts/content-engine/run.mjs issues          # DRY-RUN: show issues that would be filed
//   node scripts/content-engine/run.mjs issues --create [--limit N]
import { readdirSync, existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, loadCorpus, imageIndex } from './lib/corpus.mjs';
import { rank, dedupe, makeFinding } from './lib/finding.mjs';
import { writeReport } from './lib/report.mjs';
import { createIssues, ensureLabels } from './lib/issues.mjs';
import { tier, visibilityScore } from './lib/visibility.mjs';
import { CONFIG } from './config.mjs';

import * as numericDate from './checkers/numeric-date.mjs';
import * as redlines from './checkers/redlines.mjs';
import * as imageUrlQuality from './checkers/image-url-quality.mjs';
import * as photoSparsity from './checkers/photo-sparsity.mjs';
import * as imageOveruse from './checkers/image-overuse.mjs';
import * as imageLiveness from './checkers/image-liveness.mjs';
import * as imageModeration from './checkers/image-moderation.mjs';
import * as depthDeficit from './checkers/depth-deficit.mjs';
import * as duplicateContent from './checkers/duplicate-content.mjs';
import * as crosslinkOpportunity from './checkers/crosslink-opportunity.mjs';
import * as hotThinTopic from './checkers/hot-thin-topic.mjs';
import * as fashionProducts from './checkers/fashion-products.mjs';
import * as rumorLifecycle from './checkers/rumor-lifecycle.mjs';

// imageModeration no-ops without GOOGLE_VISION_API_KEY, so it is safe to always
// include — it only does work (and costs) when a moderation key is provisioned.
// imageUrlQuality is network-free, so it runs even under --no-images / egress
// blocks — it is the fallback that keeps the image-quality gate alive when the
// byte-level resolution check in imageLiveness can't reach hosts.
const DET_CHECKERS = [numericDate, redlines, imageUrlQuality, photoSparsity, imageOveruse, imageLiveness, imageModeration, depthDeficit, duplicateContent, crosslinkOpportunity, hotThinTopic, fashionProducts, rumorLifecycle];
const FINDINGS_DIR = join(ROOT, CONFIG.output.findingsDir);
const log = (...a) => console.log(...a);
const today = () => new Date().toISOString().slice(0, 10);

async function saveFindings(name, findings) {
  await mkdir(FINDINGS_DIR, { recursive: true });
  await writeFile(join(FINDINGS_DIR, `${name}.json`), JSON.stringify(findings, null, 2), 'utf8');
}
async function loadAllFindings() {
  if (!existsSync(FINDINGS_DIR)) return [];
  const files = readdirSync(FINDINGS_DIR).filter((f) => f.endsWith('.json') && f !== 'merged.json');
  const all = [];
  for (const f of files) {
    try {
      const arr = JSON.parse(await readFile(join(FINDINGS_DIR, f), 'utf8'));
      for (const x of Array.isArray(arr) ? arr : []) {
        try { all.push(makeFinding(x)); } catch { /* skip malformed agent finding */ }
      }
    } catch { /* skip unreadable */ }
  }
  return all;
}

async function scan(opts) {
  log('CIE scan — loading corpus (supabase/seed/**)…');
  const items = await loadCorpus();
  const images = imageIndex(items);
  log(`  ${items.length} items, ${images.length} distinct images.`);

  const findings = [];
  for (const checker of DET_CHECKERS) {
    // --no-images skips BOTH network image passes — liveness probing AND the
    // Vision moderation call (which costs real API money when a key is set).
    if (opts.noImages && (checker === imageLiveness || checker === imageModeration)) { log(`  (skipping ${checker.id}: --no-images)`); continue; }
    const name = checker.id ?? 'checker';
    process.stdout.write(`  running ${name}… `);
    const fs = await checker.check(items, { log });
    for (const f of fs) f.source = 'deterministic'; // mechanical → rolls up (agent judgments file individually)
    log(`${fs.length} findings`);
    findings.push(...fs);
  }
  const deduped = dedupe(findings);
  await saveFindings('deterministic', deduped);

  const reportPath = await writeReport(deduped, {
    date: today(), itemCount: items.length, imageCount: images.length,
    checkers: DET_CHECKERS.map((c) => c.id),
  });
  const bySev = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of deduped) bySev[f.severity]++;
  log(`\n✓ ${deduped.length} deterministic findings — P0 ${bySev.P0} · P1 ${bySev.P1} · P2 ${bySev.P2} · P3 ${bySev.P3}`);
  log(`  findings → ${join(CONFIG.output.findingsDir, 'deterministic.json')}`);
  log(`  report   → ${reportPath.replace(ROOT, '.')}`);
}

async function prepAgents() {
  const items = await loadCorpus();
  const dir = join(FINDINGS_DIR, 'agent-input');
  await mkdir(dir, { recursive: true });

  // Safety candidates (scoped set the safety agent must classify).
  const cands = redlines.candidates(items);
  await writeFile(join(dir, 'safety-candidates.json'), JSON.stringify(
    cands.map((c) => ({ type: c.item.type, file: c.item.file, key: c.item.key, field: c.field, kind: c.kind, term: c.term, excerpt: c.excerpt })), null, 2), 'utf8');

  // High-visibility items (max-scrutiny factual pass), by era.
  const high = items.filter((it) => tier(it) === 'high')
    .map((it) => ({ type: it.type, file: it.file, era: it.era, key: it.key, title: it.title, score: visibilityScore(it), texts: it.texts, sources: it.sources.map((s) => s.url) }))
    .sort((a, b) => b.score - a.score);
  await writeFile(join(dir, 'high-visibility.json'), JSON.stringify(high, null, 2), 'utf8');

  // Image list for the vision agent (url + caption + where used).
  const images = imageIndex(items).map((im) => ({ url: im.url, caption: im.caption, usedBy: im.usedBy.map((u) => ({ key: u.key, caption: u.caption })) }));
  await writeFile(join(dir, 'images.json'), JSON.stringify(images, null, 2), 'utf8');

  log(`prep-agents → ${join(CONFIG.output.findingsDir, 'agent-input')}/`);
  log(`  safety-candidates: ${cands.length} · high-visibility: ${high.length} · images: ${images.length}`);
}

// Chunk the WHOLE corpus into agent-sized batch inputs so the agent layer can
// cover all 985 items / 585 images (not just the high-visibility sample). Each
// batch file is a self-contained input one subagent reviews, writing findings to
// .findings/agent-<name>.json. A manifest lists every batch for the orchestrator.
async function prepBatches(opts) {
  const items = await loadCorpus();
  // Factual fleet can be focused; the IMAGE fleet always covers the full corpus.
  // --claims-only: restrict FACTUAL to items the deterministic claim-risk router
  // flagged (superlatives/records/dates) — reviewing claim-free items is
  // low-yield, so this focuses agent spend where facts live. Images are unaffected.
  let factualItems = items;
  if (opts.claimsOnly) {
    const detPath = join(FINDINGS_DIR, 'deterministic.json');
    if (!existsSync(detPath)) { log('--claims-only needs deterministic.json; run `scan` first.'); return; }
    const det = JSON.parse(await readFile(detPath, 'utf8'));
    const claimKeys = new Set(det.filter((f) => f.checker === 'fact.claim-risk').map((f) => f.itemRef.key));
    // Latest-news eras are reviewed IN FULL regardless of claim signals: a
    // hallucinated narrative event ("recapped the wedding on the podcast") carries
    // no stat/superlative, so claim-only filtering would blind us to exactly the
    // highest-stakes miss. Everywhere else, focus on claim-bearing items.
    const latest = new Set(CONFIG.visibility.latestNewsEras);
    factualItems = items.filter((it) => claimKeys.has(it.key) || latest.has(it.era));
    const forced = factualItems.filter((it) => !claimKeys.has(it.key)).length;
    log(`--claims-only: ${factualItems.length} factual items (${claimKeys.size} claim-bearing + ${forced} forced-in from latest-news eras; images cover all).`);
  }
  const dir = join(FINDINGS_DIR, 'agent-input');
  await mkdir(join(dir, 'factual'), { recursive: true });
  await mkdir(join(dir, 'images'), { recursive: true });

  const factualSize = opts.factualSize ?? 28;
  const imageSize = opts.imageSize ?? 40;
  const pad = (n) => String(n).padStart(3, '0');
  const manifest = { date: today(), factual: [], images: [] };

  // Stale-output invalidation (review finding): an agent output is only valid
  // for the exact input it reviewed. If a batch's input content changes (or the
  // batch disappears), its old agent-<name>.json + dispatch marker must go —
  // otherwise a nightly re-run after content changes would "look done" and
  // ingest stale findings. Unchanged inputs keep their outputs, so re-running
  // `all` to fold agent results in stays safe.
  let invalidated = 0;
  async function writeBatch(path, name, json) {
    const prev = existsSync(path) ? await readFile(path, 'utf8') : null;
    if (prev === json) return; // unchanged — keep any existing agent output
    await writeFile(path, json, 'utf8');
    if (prev !== null) {
      await rm(join(FINDINGS_DIR, `agent-${name}.json`), { force: true });
      await rm(join(FINDINGS_DIR, 'dispatched', name), { force: true });
      invalidated++;
    }
  }

  // Factual batches — grouped by era (keeps a batch topically coherent), large
  // eras split into chunks. Full texts + sources travel with each record.
  const byEra = new Map();
  for (const it of factualItems) {
    if (!byEra.has(it.era)) byEra.set(it.era, []);
    byEra.get(it.era).push(it);
  }
  let fIdx = 0;
  for (const [era, list] of [...byEra].sort((a, b) => b[1].length - a[1].length)) {
    for (let i = 0; i < list.length; i += factualSize) {
      const chunk = list.slice(i, i + factualSize).map((it) => ({
        type: it.type, file: it.file, era: it.era, key: it.key, title: it.title,
        score: visibilityScore(it), tier: tier(it),
        texts: it.texts, sources: it.sources.map((s) => s.url),
      }));
      const name = `factual-${pad(fIdx)}-${era}`;
      await writeBatch(join(dir, 'factual', `${name}.json`), name, JSON.stringify(chunk, null, 2));
      manifest.factual.push({ name, era, count: chunk.length, input: `agent-input/factual/${name}.json`, output: `agent-${name}.json` });
      fIdx++;
    }
  }

  // Image batches — every distinct image with caption + where-used context.
  const images = imageIndex(items).map((im) => ({
    url: im.url, caption: im.caption,
    usedBy: im.usedBy.map((u) => ({ key: u.key, caption: u.caption, file: u.file })),
  }));
  let iIdx = 0;
  for (let i = 0; i < images.length; i += imageSize) {
    const chunk = images.slice(i, i + imageSize);
    const name = `image-${pad(iIdx)}`;
    await writeBatch(join(dir, 'images', `${name}.json`), name, JSON.stringify(chunk, null, 2));
    manifest.images.push({ name, count: chunk.length, input: `agent-input/images/${name}.json`, output: `agent-${name}.json` });
    iIdx++;
  }

  // Batches that vanished from the manifest (corpus shrank / regrouped): their
  // outputs are orphans — purge so ingest can't resurrect findings for content
  // that no longer exists in that shape.
  const live = new Set([...manifest.factual, ...manifest.images].map((b) => `agent-${b.name}.json`));
  for (const f of readdirSync(FINDINGS_DIR).filter((f) => f.startsWith('agent-') && f.endsWith('.json'))) {
    if (!live.has(f)) { await rm(join(FINDINGS_DIR, f), { force: true }); invalidated++; }
  }
  if (invalidated) log(`  (${invalidated} stale agent outputs invalidated — inputs changed since they were reviewed)`);

  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  log(`prep-batches → ${manifest.factual.length} factual batches (${factualItems.length} items), ${manifest.images.length} image batches (${images.length} images)`);
  log(`  manifest → ${join(CONFIG.output.findingsDir, 'agent-input', 'manifest.json')}`);
}

async function ingest() {
  const all = dedupe(await loadAllFindings());
  await saveFindings('merged', all);
  const bySev = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of all) bySev[f.severity]++;
  log(`ingest → merged ${all.length} findings — P0 ${bySev.P0} · P1 ${bySev.P1} · P2 ${bySev.P2} · P3 ${bySev.P3}`);
  return all;
}

async function report() {
  const merged = existsSync(join(FINDINGS_DIR, 'merged.json'))
    ? JSON.parse(await readFile(join(FINDINGS_DIR, 'merged.json'), 'utf8')).map(makeFinding)
    : dedupe(await loadAllFindings());
  if (!merged.length) return log('no findings — run scan + ingest first.');
  // The report is the human-facing record: show the FILABLE set (confidence
  // ≥0.5 or escalated) as the headline, and footnote the sub-floor claim-risk
  // signals that were routed to the agent passes rather than filed as tickets.
  const filable = merged.filter((f) => f.confidence >= 0.5 || f.escalate);
  const routed = merged.length - filable.length;
  const items = await loadCorpus();
  const checkers = [...new Set(merged.map((f) => f.checker))].sort();
  const note = [
    `> **Filable findings shown below** (confidence ≥ 0.5). A further **${routed}** deterministic claim-risk signals`,
    '> (superlatives / records / dates, confidence < 0.5) were routed to the factual-review agent passes rather',
    '> than filed as tickets — that routing is by design, so the tracker stays actionable. Agent-confirmed',
    '> factual errors from those passes appear here as `fact.*` findings.',
    '>',
    '> Two layers ran: **deterministic** (`fact.claim-risk`, `safety.redline`, `image.liveness/quality/host-reputation`)',
    '> and **agent** (`fact.source-grounding/cross-check/slop`, `safety.sexualization/illegal`, `image.relevance/safety`).',
  ].join('\n');
  const reportPath = await writeReport(filable, {
    date: today(), itemCount: items.length, imageCount: imageIndex(items).length,
    checkers, note,
  });
  log(`report → ${reportPath.replace(ROOT, '.')} (${filable.length} filable, ${routed} routed)`);
}

async function issues(opts) {
  const merged = existsSync(join(FINDINGS_DIR, 'merged.json'))
    ? JSON.parse(await readFile(join(FINDINGS_DIR, 'merged.json'), 'utf8')).map(makeFinding)
    : dedupe(await loadAllFindings());
  if (!merged.length) return log('no findings to file — run `scan` (and optionally agent passes + `ingest`) first.');
  if (opts.create) {
    log('ensuring labels…');
    await ensureLabels();
  }
  const res = await createIssues(rank(merged), { dryRun: !opts.create, limit: opts.limit });
  if (res.dryRun) {
    log(`DRY-RUN — would file ${res.created.length} issues (${res.created.filter((c) => c.rollup).length} rollups). Re-run with --create to file them.`);
    for (const c of res.created.slice(0, 40)) log(`  • ${c.title ?? c.url}${c.rollup ? ` (${c.rollup} instances)` : ''}`);
  } else {
    log(`filed ${res.created.length} issues (skipped ${res.skipped} already-existing).`);
    for (const c of res.created) log(`  • ${c.url ?? c.title}`);
  }
}

// One entry point that spins up the whole engine. The DETERMINISTIC layer +
// reporting + issue-filing run end-to-end here in Node. The AGENT layer (factual
// / image / safety review) needs an LLM, so `all` prepares its batch inputs and
// prints exactly how to run it; when those agents have written their findings,
// re-running `all` folds them in. Idempotent throughout — safe to re-run.
async function all(opts) {
  log('━━ Content Integrity Engine ━━\n');
  log('[1/5] Deterministic scan (facts/redlines/images)…');
  await scan(opts);
  log('\n[2/5] Preparing agent-review batches…');
  await prepBatches(opts);
  log('\n[3/5] Ingesting all findings (deterministic + any agent output)…');
  await ingest();
  log('\n[4/5] Writing run report…');
  await report();
  log(`\n[5/5] ${opts.create ? 'Filing GitHub issues…' : 'Issue preview (dry-run)…'}`);
  await issues(opts);
  log('\n━━ Agent-review layer (the LLM passes) ━━');
  log('The deterministic layer is done. To run the agent passes (factual + image');
  log('review), open this repo in Claude Code and say:');
  log('    "run the content integrity engine agent passes"');
  log('Claude reads scripts/content-engine/agent/prompts/{factual,image}.md and the');
  log('batch inputs under .findings/agent-input/, writes findings to .findings/, then');
  log('you re-run this command to fold them in and file the tickets:');
  log(`    node scripts/content-engine/run.mjs all${opts.create ? ' --create' : ' --create   # (add --create to actually file)'}`);
  log('\nRead-only: no seed/DB/generated content is ever modified.');
}

const [cmd, ...rest] = process.argv.slice(2);
const opts = {
  noImages: rest.includes('--no-images'),
  claimsOnly: rest.includes('--claims-only'),
  create: rest.includes('--create'),
  limit: rest.includes('--limit') ? Number(rest[rest.indexOf('--limit') + 1]) : Infinity,
};
const cmds = { all, karen: all, scan, 'prep-agents': prepAgents, 'prep-batches': prepBatches, ingest, report, issues };
(cmds[cmd] ?? (async () => {
  log('Content Integrity Engine — read-only content checker → GitHub issues.\n');
  log('One command (recommended):');
  log('  node scripts/content-engine/run.mjs all            # full pipeline, dry-run issues');
  log('  node scripts/content-engine/run.mjs all --create   # …and file the GitHub issues\n');
  log('Individual phases:');
  log('  scan [--no-images] | prep-batches | ingest | report | issues [--create] [--limit N]');
}))(opts)
  .catch((e) => { console.error(e); process.exit(1); });
