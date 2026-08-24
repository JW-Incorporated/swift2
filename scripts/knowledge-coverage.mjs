#!/usr/bin/env node
// Coverage audit (Stage 4, PLAN.md; proposal's "brief's EGG-GAPS.md", made
// durable per workflow rule 8): emits docs/audits/knowledge-coverage.md — a
// technique × era matrix built from `egg_ledger`, thin cells (<2 examples)
// flagged. A work order for content people, regenerated on every canonical
// sync, never hand-filled.
//
// `technique` ships EMPTY in this stage on purpose (2026-08-16 brief,
// ratified docs/decisions.md 2026-08-23) — this script must render an
// honest empty-state, never a fabricated or blank-looking matrix.
//
//   npm run knowledge:coverage
//   node scripts/knowledge-coverage.mjs

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';
import { ROOT } from './lib/longlive-sync-shared.mjs';
import { buildAll, loadWorkerEnvLocal } from './sync-clown-knowledge.mjs';

const OUT_FILE = path.join(ROOT, 'docs', 'audits', 'knowledge-coverage.md');
const THIN_THRESHOLD = 2; // fewer than this many grounded examples is "thin"

export async function fetchTechniques(client) {
  const { rows } = await client.query('select key, label, example_ids from public.technique order by key');
  return rows;
}

function mdRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Pure: builds the report markdown from technique rows + egg_ledger rows.
 * `techniques` is `null` when the `technique` table couldn't be checked
 * (no DB reachable) and an array (possibly empty) when it was.
 */
export function buildCoverageReport({ techniques, eggLedgerRows, generatedAt = new Date().toISOString() }) {
  const lines = [];
  lines.push('# Knowledge coverage audit');
  lines.push('');
  lines.push(
    `Generated ${generatedAt} by \`scripts/knowledge-coverage.mjs\` — regenerated on every canonical sync, never hand-filled.`,
  );
  lines.push('');
  lines.push('## Technique × era matrix');
  lines.push('');

  const eraIds = [...new Set(eggLedgerRows.map((r) => r.era_id).filter(Boolean))].sort();

  if (techniques === null) {
    lines.push(
      '_Not checked this run — no `SUPABASE_DB_URL` reachable, so the `technique` table could not be queried. ' +
        'Per Stage 4 (docs/decisions.md 2026-08-23) it is expected to be empty until a frontier-model authoring ' +
        'session seeds it; this is not itself evidence of a gap._',
    );
  } else if (techniques.length === 0) {
    lines.push(
      'No techniques seeded yet. The `technique` table is deliberately empty — Stage 4 of the knowledge-engine ' +
        'build ships schema and plumbing only; `techniques.mjs` (7-10 records, >=2 grounded examples each) is ' +
        'authored in a frontier-model session with a human, not an autonomous run (docs/decisions.md 2026-08-23). ' +
        'This audit will render a real technique × era matrix once that lands.',
    );
  } else {
    lines.push(
      `Cell = confirmed-egg examples for that technique in that era. Flagged (⚠) below ${THIN_THRESHOLD}.`,
    );
    lines.push('');
    lines.push(mdRow(['Technique', ...eraIds]));
    lines.push(mdRow(new Array(eraIds.length + 1).fill('---')));
    const thinTechniques = [];
    for (const t of techniques) {
      const exampleIds = t.example_ids ?? [];
      if (exampleIds.length < THIN_THRESHOLD) thinTechniques.push(t.key);
      const byEra = {};
      for (const id of exampleIds) {
        const egg = eggLedgerRows.find((r) => r.id === id);
        if (egg?.era_id) byEra[egg.era_id] = (byEra[egg.era_id] ?? 0) + 1;
      }
      const cells = eraIds.map((e) => {
        const n = byEra[e] ?? 0;
        return n < THIN_THRESHOLD ? `${n} ⚠` : String(n);
      });
      lines.push(mdRow([t.label ?? t.key, ...cells]));
    }
    lines.push('');
    lines.push(
      thinTechniques.length
        ? `**Techniques with <${THIN_THRESHOLD} grounded examples total:** ${thinTechniques.join(', ')}`
        : `All techniques have >=${THIN_THRESHOLD} grounded examples.`,
    );
  }

  lines.push('');
  lines.push('## Confirmed eggs by era (reference — not a technique breakdown)');
  lines.push('');
  if (eraIds.length === 0) {
    lines.push('No confirmed easter eggs in `egg_ledger` yet.');
  } else {
    lines.push(mdRow(['Era', 'Confirmed eggs']));
    lines.push(mdRow(['---', '---']));
    for (const e of eraIds) {
      const n = eggLedgerRows.filter((r) => r.era_id === e).length;
      lines.push(mdRow([e, String(n)]));
    }
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  await loadWorkerEnvLocal();
  const { eggLedgerRows } = await buildAll();

  let techniques = null;
  const connectionString = process.env.SUPABASE_DB_URL;
  if (connectionString) {
    const client = makeClient(connectionString);
    await client.connect();
    try {
      techniques = await fetchTechniques(client);
    } finally {
      await client.end();
    }
  }

  const report = buildCoverageReport({ techniques, eggLedgerRows });
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, report, 'utf-8');
  console.log(
    `knowledge-coverage: wrote ${path.relative(ROOT, OUT_FILE)} ` +
      `(${techniques === null ? 'technique not checked' : `${techniques.length} technique(s)`}, ` +
      `${eggLedgerRows.length} confirmed egg(s)).`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
