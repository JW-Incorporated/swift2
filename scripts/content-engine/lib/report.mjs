// Run report writer — a human-readable snapshot of a CIE run. Committed to
// docs/audits/engine/ so runs are diffable over time.
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './corpus.mjs';
import { rank, SEVERITY } from './finding.mjs';
import { CONFIG } from '../config.mjs';

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

  const dir = join(ROOT, CONFIG.output.reportsDir);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${meta.date}-cie-run.md`);
  await writeFile(path, L.join('\n'), 'utf8');
  return path;
}
