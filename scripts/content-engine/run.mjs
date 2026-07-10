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
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, loadCorpus, imageIndex } from './lib/corpus.mjs';
import { rank, dedupe, makeFinding } from './lib/finding.mjs';
import { writeReport } from './lib/report.mjs';
import { createIssues, ensureLabels } from './lib/issues.mjs';
import { tier, visibilityScore } from './lib/visibility.mjs';
import { CONFIG } from './config.mjs';

import * as numericDate from './checkers/numeric-date.mjs';
import * as redlines from './checkers/redlines.mjs';
import * as imageLiveness from './checkers/image-liveness.mjs';

const DET_CHECKERS = [numericDate, redlines, imageLiveness];
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
    if (opts.noImages && checker === imageLiveness) { log('  (skipping image pass: --no-images)'); continue; }
    const name = checker.id ?? 'checker';
    process.stdout.write(`  running ${name}… `);
    const fs = await checker.check(items, { log });
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

const [cmd, ...rest] = process.argv.slice(2);
const opts = {
  noImages: rest.includes('--no-images'),
  create: rest.includes('--create'),
  limit: rest.includes('--limit') ? Number(rest[rest.indexOf('--limit') + 1]) : Infinity,
};
const cmds = { scan, 'prep-agents': prepAgents, ingest, report, issues };
(cmds[cmd] ?? (async () => { log('commands: scan [--no-images] | prep-agents | ingest | issues [--create] [--limit N]'); }))(opts)
  .catch((e) => { console.error(e); process.exit(1); });
