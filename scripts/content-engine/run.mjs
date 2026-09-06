#!/usr/bin/env node
// Content Integrity Engine (CIE) — orchestrator / CLI.
// READ-ONLY on content. Produces findings → a run report → GitHub issues.
// Never edits supabase/seed/**, the DB, or generated files.
//
// Usage:
//   node --use-env-proxy scripts/content-engine/run.mjs scan            # deterministic checkers → findings + report
//     (`scan`'s report writes to .scratch/content-engine/ by default — a self-check,
//     not Karen's run; add --canonical to write docs/audits/engine/ instead)
//   node --use-env-proxy scripts/content-engine/run.mjs scan --no-images# skip the network image pass (fast)
//   node --use-env-proxy scripts/content-engine/run.mjs prep-agents     # write scoped inputs for the agent review passes
//   node --use-env-proxy scripts/content-engine/run.mjs ingest          # merge deterministic + agent findings
//   node --use-env-proxy scripts/content-engine/run.mjs issues          # DRY-RUN: show issues that would be filed
//   node --use-env-proxy scripts/content-engine/run.mjs issues --create [--limit N]
import { readdirSync, existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, loadCorpus, imageIndex } from './lib/corpus.mjs';
import { rank, dedupe, makeFinding } from './lib/finding.mjs';
import { writeReport, appendFilingStatus } from './lib/report.mjs';
import { createIssues, ensureLabels, errText } from './lib/issues.mjs';
import { tier, visibilityScore } from './lib/visibility.mjs';
import { contentHash, coverage, loadLedger, saveLedger, selectSlice, LEDGER_REL } from './lib/review-ledger.mjs';
import { CONFIG } from './config.mjs';
import { runMain } from '../lib/cli.mjs';

import * as numericDate from './checkers/numeric-date.mjs';
import * as redlines from './checkers/redlines.mjs';
import * as imageUrlQuality from './checkers/image-url-quality.mjs';
import * as photoSparsity from './checkers/photo-sparsity.mjs';
import * as topOfFeedPhoto from './checkers/top-of-feed-photo.mjs';
import * as imageOveruse from './checkers/image-overuse.mjs';
import * as imageLiveness from './checkers/image-liveness.mjs';
import * as imageModeration from './checkers/image-moderation.mjs';
import * as depthDeficit from './checkers/depth-deficit.mjs';
import * as duplicateContent from './checkers/duplicate-content.mjs';
import * as crosslinkOpportunity from './checkers/crosslink-opportunity.mjs';
import * as hotThinTopic from './checkers/hot-thin-topic.mjs';
import * as fashionProducts from './checkers/fashion-products.mjs';
import * as rumorLifecycle from './checkers/rumor-lifecycle.mjs';
import * as rumorRedline from './checkers/rumor-redline.mjs';
import * as socialPostMissing from './checkers/social-post-missing.mjs';
import * as voice from './checkers/voice.mjs';

// imageModeration no-ops without GOOGLE_VISION_API_KEY, so it is safe to always
// include — it only does work (and costs) when a moderation key is provisioned.
// imageUrlQuality is network-free, so it runs even under --no-images / egress
// blocks — it is the fallback that keeps the image-quality gate alive when the
// byte-level resolution check in imageLiveness can't reach hosts.
const DET_CHECKERS = [numericDate, redlines, imageUrlQuality, photoSparsity, topOfFeedPhoto, imageOveruse, imageLiveness, imageModeration, depthDeficit, duplicateContent, crosslinkOpportunity, hotThinTopic, fashionProducts, rumorLifecycle, rumorRedline, socialPostMissing, voice];
const FINDINGS_DIR = join(ROOT, CONFIG.output.findingsDir);
// docs/audits/engine/ is Karen-exclusive (docs/decisions.md 2026-08-14): a
// bare `scan` self-check writes here instead, so other agents keep their
// self-check without being able to clobber Karen's evidence. `--canonical` is
// the explicit opt-in for a caller that genuinely needs the committed path.
const SCRATCH_REPORTS_DIR = '.scratch/content-engine';
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
    source: 'scan',
    reportDir: opts.canonical ? undefined : SCRATCH_REPORTS_DIR,
  });
  const bySev = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of deduped) bySev[f.severity]++;
  log(`\n✓ ${deduped.length} deterministic findings — P0 ${bySev.P0} · P1 ${bySev.P1} · P2 ${bySev.P2} · P3 ${bySev.P3}`);
  log(`  findings → ${join(CONFIG.output.findingsDir, 'deterministic.json')}`);
  log(`  report   → ${reportPath.replace(ROOT, '.')}`);
}

// ── The agent review layer, on a schedule ────────────────────────────────────
// `prep-batches` chunks the WHOLE corpus (46 factual + 27 image batches ≈ 20M
// tokens to review in one night) — that is a full sweep, not a nightly job, and
// nobody ever ran it. `review-slice` is the nightly form: it picks a bounded
// slice, changed content first, and `record-review` writes what was covered into
// the committed ledger so tomorrow's clean-checkout runner knows where it left
// off. See lib/review-ledger.mjs for why the state has to be committed.
const SLICE_DIR = () => join(FINDINGS_DIR, 'agent-input', 'slice');

/** Stable identity + change detection for one reviewable item. */
function factualEntries(items) {
  return items.map((it) => ({
    id: it.key,
    hash: contentHash({ t: it.texts, s: it.sources.map((s) => s.url) }),
    weight: visibilityScore(it),
    item: it,
  }));
}
function imageEntries(items) {
  return imageIndex(items).map((im) => ({
    id: im.url,
    hash: contentHash({ c: im.caption, u: im.usedBy.map((u) => u.key).sort() }),
    weight: im.usedBy.length,
    image: im,
  }));
}
function safetyEntries(items) {
  return redlines.candidates(items).map((c) => ({
    id: `${c.item.key}|${c.field}|${c.kind}|${c.term}`,
    hash: contentHash(c.excerpt),
    weight: c.kind === 'illegal-context' ? 3 : c.kind === 'sexualization' ? 2 : 1,
    cand: c,
  }));
}

async function reviewSlice(opts) {
  const items = await loadCorpus();
  const ledger = await loadLedger();
  const dir = SLICE_DIR();
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const factualSize = opts.factualSize ?? 28;
  const imageSize = opts.imageSize ?? 40;
  const nFactual = opts.factualBatches ?? 2;
  const nImages = opts.imageBatches ?? 1;

  const fEntries = factualEntries(items);
  const iEntries = imageEntries(items);
  const sEntries = safetyEntries(items);

  const fPick = selectSlice(fEntries, ledger.factual, nFactual * factualSize);
  const iPick = selectSlice(iEntries, ledger.images, nImages * imageSize);
  // Safety is small (~121 candidates) and cheap, but re-classifying an unchanged
  // candidate set every night is pure waste — so it runs only when something is
  // new or has changed, and then it covers the WHOLE set in one pass. That keeps
  // the safety route (redlines.candidates → agent) genuinely unattended without
  // adding a standing nightly cost.
  const sPending = selectSlice(sEntries, ledger.safety, sEntries.length);
  const runSafety = sPending.counts.changed + sPending.counts.new > 0;

  const manifest = { date: today(), factual: [], images: [], safety: null };
  const pad = (n) => String(n).padStart(3, '0');
  const byId = (arr) => new Map(arr.map((e) => [e.id, e]));

  const fById = byId(fEntries);
  for (let i = 0, b = 0; i < fPick.picked.length; i += factualSize, b++) {
    const chunk = fPick.picked.slice(i, i + factualSize);
    const name = `factual-${pad(b)}`;
    const payload = chunk.map(({ id }) => {
      const it = fById.get(id).item;
      return {
        type: it.type, file: it.file, era: it.era, key: it.key, title: it.title,
        score: visibilityScore(it), tier: tier(it), texts: it.texts,
        sources: it.sources.map((s) => s.url),
      };
    });
    await writeFile(join(dir, `${name}.json`), JSON.stringify(payload, null, 2), 'utf8');
    manifest.factual.push({ name, count: chunk.length, ids: chunk.map((c) => c.id), hashes: Object.fromEntries(chunk.map((c) => [c.id, c.hash])), input: `agent-input/slice/${name}.json`, output: `agent-${name}.json` });
  }

  const iById = byId(iEntries);
  for (let i = 0, b = 0; i < iPick.picked.length; i += imageSize, b++) {
    const chunk = iPick.picked.slice(i, i + imageSize);
    const name = `image-${pad(b)}`;
    const payload = chunk.map(({ id }) => {
      const im = iById.get(id).image;
      return { url: im.url, caption: im.caption, usedBy: im.usedBy.map((u) => ({ key: u.key, caption: u.caption, file: u.file })) };
    });
    await writeFile(join(dir, `${name}.json`), JSON.stringify(payload, null, 2), 'utf8');
    manifest.images.push({ name, count: chunk.length, ids: chunk.map((c) => c.id), hashes: Object.fromEntries(chunk.map((c) => [c.id, c.hash])), input: `agent-input/slice/${name}.json`, output: `agent-${name}.json` });
  }

  if (runSafety) {
    const sById = byId(sEntries);
    const payload = sEntries.map((e) => {
      const c = sById.get(e.id).cand;
      return { type: c.item.type, file: c.item.file, key: c.item.key, field: c.field, kind: c.kind, term: c.term, excerpt: c.excerpt };
    });
    await writeFile(join(dir, 'safety.json'), JSON.stringify(payload, null, 2), 'utf8');
    manifest.safety = { name: 'safety', count: sEntries.length, ids: sEntries.map((e) => e.id), hashes: Object.fromEntries(sEntries.map((e) => [e.id, e.hash])), input: 'agent-input/slice/safety.json', output: 'agent-safety.json' };
  }

  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const fCov = coverage(fEntries, ledger.factual, today());
  const iCov = coverage(iEntries, ledger.images, today());
  log(`review-slice → ${manifest.factual.length} factual batch(es), ${manifest.images.length} image batch(es)${runSafety ? ', 1 safety batch' : ' (safety unchanged — skipped)'}`);
  log(`  factual picked: ${fPick.counts.changed} changed · ${fPick.counts.new} new · ${fPick.counts.rotation} rotation   (backlog: ${fPick.available.changed} changed, ${fPick.available.new} never reviewed)`);
  log(`  images  picked: ${iPick.counts.changed} changed · ${iPick.counts.new} new · ${iPick.counts.rotation} rotation   (backlog: ${iPick.available.changed} changed, ${iPick.available.new} never reviewed)`);
  log(`  coverage: factual ${fCov.reviewed}/${fCov.total} (${fCov.pct}%, ${fCov.stale} stale) · images ${iCov.reviewed}/${iCov.total} (${iCov.pct}%, ${iCov.stale} stale)`);
  log(`  manifest → ${join(CONFIG.output.findingsDir, 'agent-input', 'slice', 'manifest.json')}`);
  return manifest;
}

/**
 * Mark the slice reviewed. Only batches whose agent actually WROTE an output
 * file are recorded — a batch that failed, hit a session limit, or was never
 * dispatched stays unreviewed and comes back to the front of tomorrow's queue.
 * That is the whole reason this is a separate step and not a side effect of
 * `review-slice`.
 */
async function recordReview() {
  const manifestPath = join(SLICE_DIR(), 'manifest.json');
  if (!existsSync(manifestPath)) return log('no slice manifest — run `review-slice` first.');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const ledger = await loadLedger();
  const date = manifest.date ?? today();

  let recorded = 0;
  let skipped = 0;
  const sections = [['factual', manifest.factual ?? []], ['images', manifest.images ?? []], ['safety', manifest.safety ? [manifest.safety] : []]];
  for (const [section, batches] of sections) {
    for (const b of batches) {
      if (!existsSync(join(FINDINGS_DIR, b.output))) {
        log(`  ⏭ ${b.name}: no ${b.output} — left unreviewed, it returns to the front of the queue`);
        skipped += b.count;
        continue;
      }
      for (const id of b.ids) ledger[section][id] = { h: b.hashes[id], d: date };
      recorded += b.count;
    }
  }
  ledger.updated = date;
  await saveLedger(ledger);
  log(`record-review → ${recorded} item(s) marked reviewed on ${date}${skipped ? `, ${skipped} left unreviewed` : ''}`);
  log(`  ledger → ${LEDGER_REL} (commit it — it is the review layer's only durable memory)`);
  return { recorded, skipped };
}

async function reviewStatus() {
  const items = await loadCorpus();
  const ledger = await loadLedger();
  const f = coverage(factualEntries(items), ledger.factual, today());
  const i = coverage(imageEntries(items), ledger.images, today());
  const s = coverage(safetyEntries(items), ledger.safety, today());
  log(`agent-review coverage (ledger updated ${ledger.updated ?? 'never'}):`);
  for (const [name, c] of [['factual', f], ['images ', i], ['safety ', s]]) {
    log(`  ${name}: ${c.reviewed}/${c.total} reviewed (${c.pct}%) · ${c.never} never · ${c.stale} changed since review · oldest ${c.oldestReviewDays}d`);
  }
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
    checkers, note, source: 'all',
  });
  log(`report → ${reportPath.replace(ROOT, '.')} (${filable.length} filable, ${routed} routed)`);
  return reportPath;
}

const ALARM = (lines) => {
  const bar = '!'.repeat(78);
  console.error(`\n${bar}\n${lines.map((l) => `!! ${l}`).join('\n')}\n${bar}\n`);
};

/**
 * File the findings. Returns a filing STATUS object rather than throwing —
 * `all()` needs it to stamp the run report before the process dies, because a
 * report that doesn't say "these findings were thrown away" is exactly how two
 * runs (2026-07-26, 2026-08-09) discarded ~1,220 findings and still looked green.
 */
async function issues(opts) {
  const merged = existsSync(join(FINDINGS_DIR, 'merged.json'))
    ? JSON.parse(await readFile(join(FINDINGS_DIR, 'merged.json'), 'utf8')).map(makeFinding)
    : dedupe(await loadAllFindings());
  if (!merged.length) {
    log('no findings to file — run `scan` (and optionally agent passes + `ingest`) first.');
    return { filed: 0, deduped: 0, unfiled: [], fatal: null, detected: 0, dryRun: !opts.create };
  }
  const detected = merged.filter((f) => f.confidence >= 0.5 || f.escalate).length;

  if (opts.create) {
    // WRITE PREFLIGHT. The label upsert is the cheapest authenticated write the
    // engine makes; if it cannot run, nothing downstream can either, and we say
    // so here instead of discovering it one issue at a time.
    log('ensuring labels (write preflight)…');
    try {
      const partial = await ensureLabels();
      for (const p of partial) log(`  ⚠ label upsert failed: ${p}`);
    } catch (e) {
      const fatal = errText(e);
      ALARM([
        'KAREN CANNOT FILE — the scan succeeded and the tickets cannot be written.',
        `${detected} filable finding(s) will be DISCARDED unless this is fixed and the run repeated.`,
        '',
        fatal,
      ]);
      process.exitCode = 1; // `issues --create` on its own must fail too, not just `all`.
      return { filed: 0, deduped: 0, unfiled: [], fatal, detected, dryRun: false };
    }
  }

  const res = await createIssues(rank(merged), { dryRun: !opts.create, limit: opts.limit, log });
  const status = {
    filed: res.created.length, deduped: res.skipped, unfiled: res.unfiled,
    fatal: null, detected, dryRun: res.dryRun,
  };

  if (res.dryRun) {
    log(`DRY-RUN — would file ${res.created.length} issues (${res.created.filter((c) => c.rollup).length} rollups). Re-run with --create to file them.`);
    for (const c of res.created.slice(0, 40)) log(`  • ${c.title ?? c.url}${c.rollup ? ` (${c.rollup} instances)` : ''}`);
    return status;
  }

  log(`filed ${res.created.length} issues (skipped ${res.skipped} already-existing).`);
  for (const c of res.created) log(`  • ${c.url ?? c.title}`);
  if (res.unfiled.length) {
    ALARM([
      `${res.unfiled.length} DETECTED FINDING(S) WERE NOT FILED. They are on no ticket.`,
      'This run FAILED. Fix the cause below and re-run — the engine is idempotent.',
      '',
      ...res.unfiled.slice(0, 15).map((u) => `${u.title} — ${u.reason}`),
      ...(res.unfiled.length > 15 ? [`…and ${res.unfiled.length - 15} more.`] : []),
    ]);
    process.exitCode = 1;
  }
  return status;
}

// One entry point that spins up the whole engine. The DETERMINISTIC layer +
// reporting + issue-filing run end-to-end here in Node. The AGENT layer (factual
// / image / safety review) needs an LLM, so `all` prepares its batch inputs and
// prints exactly how to run it; when those agents have written their findings,
// re-running `all` folds them in. Idempotent throughout — safe to re-run.
async function all(opts) {
  log('━━ Content Integrity Engine ━━\n');

  // Early write preflight. The scan takes ~20 minutes; knowing in the first
  // second that this runner cannot file anything is worth one API call. We do
  // NOT abort on failure — the run report is still worth producing, and step 5
  // stamps the failure onto it — but the operator sees the alarm up front
  // instead of at the end of a run that looked fine the whole way.
  if (opts.create) {
    try {
      await ensureLabels();
      log('[0/5] Write preflight OK — GitHub is writable from this runner.\n');
    } catch (e) {
      ALARM([
        'WRITE PREFLIGHT FAILED — this runner cannot file GitHub issues.',
        'The scan below will run and the report will be written, but every finding',
        'it produces will be DISCARDED unless this is fixed and the run repeated.',
        '',
        errText(e),
      ]);
    }
  }

  log('[1/5] Deterministic scan (facts/redlines/images)…');
  await scan(opts);
  log('\n[2/5] Preparing agent-review batches…');
  // prepAgents() writes safety-candidates.json — the scoped set the safety agent
  // must classify. `all()` never called it, so `redlines.candidates()` (the whole
  // sexualization / illegal-context / privacy routing path) produced nothing on
  // any unattended run: the deterministic screen ran, and its output went
  // nowhere. Every unattended run now produces the safety hand-off too.
  await prepAgents();
  await prepBatches(opts);
  log('\n[3/5] Ingesting all findings (deterministic + any agent output)…');
  await ingest();
  log('\n[4/5] Writing run report…');
  const reportPath = await report();
  log(`\n[5/5] ${opts.create ? 'Filing GitHub issues…' : 'Issue preview (dry-run)…'}`);

  // Step 5 is allowed to fail, but it is NEVER allowed to fail quietly. Whatever
  // happens, the committed run report gets a filing verdict stamped on it (the
  // watchdog's zero-AI "Karen filed what she found" check reads that stamp), and
  // a lossy run exits non-zero so the runner, CI, and any shell see a failure.
  let status;
  try {
    status = await issues(opts);
  } catch (e) {
    status = { filed: 0, deduped: 0, unfiled: [], fatal: errText(e), detected: 0, dryRun: !opts.create };
    console.error(e);
  }
  if (reportPath) {
    try {
      await appendFilingStatus(reportPath, status);
    } catch (e) {
      console.error(`could not stamp filing status onto the run report: ${errText(e)}`);
    }
  }
  const lost = status.fatal ? status.detected : status.unfiled.length;
  // `status.fatal` alone also fails the run: when issues() THREW (rather than
  // returning a status), `detected` is unknown-zero — a fatal with an unknown
  // loss must never read as a healthy run.
  if (!status.dryRun && (lost > 0 || status.fatal)) {
    ALARM([
      `RUN FAILED: ${lost} finding(s) detected, ${status.filed} filed, ${lost} DISCARDED.`,
      'The run report records this. Exiting non-zero so nothing downstream reads this as a healthy run.',
    ]);
    process.exitCode = 1;
  }

  log('\n━━ Agent-review layer (the LLM passes) ━━');
  log('The deterministic layer is done. To run the agent passes (factual + image');
  log('review), open this repo in Claude Code and say:');
  log('    "run the content integrity engine agent passes"');
  log('Claude reads scripts/content-engine/agent/prompts/{factual,image}.md and the');
  log('batch inputs under .findings/agent-input/, writes findings to .findings/, then');
  log('you re-run this command to fold them in and file the tickets:');
  log(`    node --use-env-proxy scripts/content-engine/run.mjs all${opts.create ? ' --create' : ' --create   # (add --create to actually file)'}`);
  log('\nRead-only: no seed/DB/generated content is ever modified.');
}

const [cmd, ...rest] = process.argv.slice(2);
const num = (flag, dflt) => (rest.includes(flag) ? Number(rest[rest.indexOf(flag) + 1]) : dflt);
const opts = {
  noImages: rest.includes('--no-images'),
  claimsOnly: rest.includes('--claims-only'),
  canonical: rest.includes('--canonical'),
  create: rest.includes('--create'),
  limit: num('--limit', Infinity),
  factualBatches: num('--factual-batches', 2),
  imageBatches: num('--image-batches', 1),
};
const cmds = {
  all, karen: all, scan, 'prep-agents': prepAgents, 'prep-batches': prepBatches, ingest, report, issues,
  'review-slice': reviewSlice, 'record-review': recordReview, 'review-status': reviewStatus,
};
async function main() {
  return (cmds[cmd] ?? (async () => {
    log('Content Integrity Engine — read-only content checker → GitHub issues.\n');
    log('One command (recommended):');
    log('  node --use-env-proxy scripts/content-engine/run.mjs all            # full pipeline, dry-run issues');
    log('  node --use-env-proxy scripts/content-engine/run.mjs all --create   # …and file the GitHub issues\n');
    log('Deterministic phases:');
    log('  scan [--no-images] | prep-agents | prep-batches | ingest | report | issues [--create] [--limit N]\n');
    log('Agent review layer (the LLM half — see docs/agents/runner-prompts/karen-deep-review.md):');
    log('  review-slice [--factual-batches N] [--image-batches N]   # tonight\'s bounded slice, changed content first');
    log('  record-review                                            # mark the reviewed slice in the committed ledger');
    log('  review-status                                            # how much of the corpus the agent layer has ever seen');
  }))(opts);
}
runMain(main, { name: 'run' });
