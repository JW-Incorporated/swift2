// Run report writer — a human-readable snapshot of a CIE run. Committed to
// docs/audits/engine/ so runs are diffable over time.
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './corpus.mjs';
import { rank, SEVERITY } from './finding.mjs';
import { CONFIG } from '../config.mjs';

// Machine-readable filing verdict, appended to every run report. It exists so
// that a zero-AI checker (.github/workflows/watchdog.yml → "Karen filed what
// she found") can tell a healthy run from one that scanned perfectly and then
// dropped everything on the floor. Two real runs did exactly that — 2026-07-26
// (623 findings, `spawn gh ENOENT`) and 2026-08-09 (597 findings, `401 Bad
// credentials`) — and both committed a report that looked completely normal.
// The absence of this marker is itself the alarm: it means the run never
// reached the end of step 5.
export const FILING_MARKER_RE = /<!--\s*cie-filing:([^>]*?)-->/;

// Provenance marker — which command produced this report. `scan` is the bare
// self-check other content-authoring agents run before opening their own PR;
// only `all` (Karen's own full pipeline) is meant to land in the canonical
// docs/audits/engine/ path (see writeReport's `reportDir` override below). A
// bare `scan` writing there is exactly how a five-day Karen outage went
// unnoticed — the report looked fresh because someone else's self-check kept
// refreshing it (docs/decisions.md 2026-08-14). The watchdog greps this to
// tell Karen's own runs from anything else that might land here.
export const RUN_MARKER_RE = /<!--\s*cie-run:([^>]*?)-->/;

export async function writeReport(findings, meta) {
  const ranked = rank(findings);
  const bySev = Object.fromEntries(SEVERITY.map((s) => [s, ranked.filter((f) => f.severity === s).length]));
  const byChecker = {};
  for (const f of ranked) byChecker[f.checker] = (byChecker[f.checker] ?? 0) + 1;
  const escalations = ranked.filter((f) => f.escalate);

  const L = [];
  L.push(`# Content Integrity Engine — run ${meta.date}`);
  L.push('');
  L.push(`Corpus: ${meta.itemCount} items · ${meta.imageCount} distinct images (source: supabase/seed/**). Read-only run — findings only, no content changed.`);
  L.push('');
  L.push(`**Totals:** ${ranked.length} findings — P0 ${bySev.P0} · P1 ${bySev.P1} · P2 ${bySev.P2} · P3 ${bySev.P3}`);
  L.push('');
  L.push(`<!-- cie-run: source=${meta.source ?? 'unknown'} date=${meta.date} -->`);
  L.push('');
  if (meta.note) { L.push(meta.note); L.push(''); }
  if (escalations.length) {
    L.push(`## ⚠️ Escalations (${escalations.length}) — human review required now`);
    for (const f of escalations) L.push(`- **${f.title}** — ${f.itemRef.file} — ${f.evidence}`);
    L.push('');
  }
  L.push('## By checker');
  for (const [c, n] of Object.entries(byChecker).sort((a, b) => b[1] - a[1])) L.push(`- \`${c}\` — ${n}`);
  L.push('');
  L.push('## Top findings (P0/P1)');
  for (const f of ranked.filter((f) => f.severity === 'P0' || f.severity === 'P1').slice(0, 60)) {
    L.push(`- **[${f.severity}] ${f.title}** \`${f.checker}\` — ${f.itemRef.file}${f.itemRef.key ? ` · ${f.itemRef.key}` : ''}`);
    if (f.evidence) L.push(`  - ${f.evidence.slice(0, 240)}`);
  }
  L.push('');
  L.push(`_Checkers run: ${meta.checkers.join(', ')}. Engine: scripts/content-engine._`);

  // `reportDir` lets a caller override where the report lands. Default is the
  // canonical, committed path — Karen's own. `scan()` passes a scratch
  // override so a bare self-check can't clobber Karen's evidence (decision 1,
  // docs/decisions.md 2026-08-14).
  const dir = join(ROOT, meta.reportDir ?? CONFIG.output.reportsDir);
  await mkdir(dir, { recursive: true });
  // A second run on the same calendar date used to silently overwrite the
  // first run's report (#489). The plain `<date>-cie-run.md` name still wins
  // when it's free (keeps the common single-run-a-day filename lexically
  // sortable against every prior committed report); only a same-date collision
  // falls through to a time-suffixed name, so every run's audit trail survives.
  let name = `${meta.date}-cie-run.md`;
  if (existsSync(join(dir, name))) {
    const time = meta.time ?? new Date().toISOString().slice(11, 19).replace(/:/g, '');
    name = `${meta.date}-${time}-cie-run.md`;
    for (let n = 2; existsSync(join(dir, name)); n++) name = `${meta.date}-${time}-${n}-cie-run.md`;
  }
  const path = join(dir, name);
  await writeFile(path, L.join('\n'), 'utf8');
  return path;
}

/** Parse the cie-run provenance marker. Returns null when there isn't one. */
export function parseRunProvenance(text) {
  const m = RUN_MARKER_RE.exec(text ?? '');
  if (!m) return null;
  const out = {};
  for (const [, k, v] of m[1].matchAll(/(\w+)=(\S+)/g)) out[k] = v;
  return out;
}

/**
 * Render the "did these findings actually reach the tracker?" section.
 *
 * @param {{ filed:number, deduped:number, unfiled:Array<{title:string,reason:string}>,
 *           fatal?:string|null, dryRun?:boolean }} s
 */
export function renderFilingStatus(s) {
  const unfiled = s.unfiled ?? [];
  // A fatal (nothing could be filed at all) discards every filable finding, so
  // the caller passes that count as `detected`; otherwise the loss is exactly
  // the per-finding failures we collected.
  const n = s.fatal ? (s.detected ?? unfiled.length) : unfiled.length;
  const status = s.dryRun ? 'dry-run' : s.fatal ? 'fatal' : unfiled.length ? 'failed' : 'ok';
  const L = ['', '---', ''];

  if (s.dryRun) {
    L.push('## Ticket filing — DRY RUN');
    L.push('');
    L.push(`No issues were filed (no \`--create\`). ${s.filed} would have been opened.`);
  } else if (status === 'ok') {
    L.push('## Ticket filing — ✅ complete');
    L.push('');
    L.push(`**${s.filed} new issue(s) filed · ${s.deduped} already on the tracker · 0 unfiled.**`);
  } else {
    L.push(`## 🚨 TICKET FILING FAILED — ${n} finding(s) detected and NOT filed`);
    L.push('');
    L.push('**This run is a FAILURE even though the scan above completed.** The findings');
    L.push('listed in this report were detected and then discarded: they are on no ticket,');
    L.push('in no queue, and nobody is going to act on them. Re-run');
    L.push('`node --use-env-proxy scripts/content-engine/run.mjs all --create` once the cause below is fixed —');
    L.push('the engine is idempotent, so nothing is lost by re-running it.');
    L.push('');
    if (s.fatal) {
      L.push(`**Fatal:** ${s.fatal}`);
      L.push('');
    }
    if (s.filed || s.deduped) {
      L.push(`Partial progress: ${s.filed} filed · ${s.deduped} already present before this run.`);
      L.push('');
    }
    if (unfiled.length) {
      L.push(`### Not filed (${unfiled.length})`);
      for (const u of unfiled.slice(0, 40)) L.push(`- ${u.title} — _${u.reason}_`);
      if (unfiled.length > 40) L.push(`- …and ${unfiled.length - 40} more.`);
      L.push('');
    }
  }

  L.push('');
  L.push(`<!-- cie-filing: status=${status} filed=${s.filed ?? 0} deduped=${s.deduped ?? 0} unfiled=${n} -->`);
  return L.join('\n');
}

/** Parse the marker back out of a report. Returns null when there isn't one. */
export function parseFilingStatus(text) {
  const m = FILING_MARKER_RE.exec(text ?? '');
  if (!m) return null;
  const out = {};
  for (const [, k, v] of m[1].matchAll(/(\w+)=(\S+)/g)) out[k] = /^\d+$/.test(v) ? Number(v) : v;
  return out;
}

/**
 * Append the filing verdict to an already-written run report, replacing any
 * previous verdict so re-running `all` on the same day stays idempotent.
 */
export async function appendFilingStatus(path, s) {
  let body = await readFile(path, 'utf8');
  const cut = body.indexOf('\n---\n\n## Ticket filing');
  const cutFail = body.indexOf('\n---\n\n## 🚨 TICKET FILING FAILED');
  const at = [cut, cutFail].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at !== undefined) body = body.slice(0, at);
  await writeFile(path, `${body.replace(/\s+$/, '')}\n${renderFilingStatus(s)}\n`, 'utf8');
  return path;
}
