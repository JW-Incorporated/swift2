#!/usr/bin/env node
// Scores the photo QC gate against hand-labelled ground truth (paid: one
// Sonnet call per photo, about $0.003 each). Reports a confusion matrix,
// accuracy, the false-keeps (bad photos the gate would admit; the costly
// error) and the false-rejects.
//
//   node scripts/social/photo-qc-eval.mjs --labels labels.json [--ids a,b] [--out results.json] [--cache-dir dir]
//
// labels.json: [{ "id", "label": "keep" | "drop", "caption", "kind", "file" | "url" }].
// A "url" entry is downloaded once into the cache dir. Needs ANTHROPIC_API_KEY.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { isMain } from '../lib/is-main.mjs';
import { DEFAULT_CONCURRENCY, estimateCost, kindFromId, qcPhoto } from './photo-qc.mjs';

export function summarize(rows) {
  const count = (label, keep) => rows.filter((r) => r.label === label && r.keep === keep).length;
  const m = {
    trueKeep: count('keep', true),
    falseReject: count('keep', false),
    falseKeep: count('drop', true),
    trueDrop: count('drop', false),
  };
  const total = rows.length;
  const drops = m.falseKeep + m.trueDrop;
  return {
    ...m,
    total,
    accuracy: total ? (m.trueKeep + m.trueDrop) / total : 0,
    falseKeepRate: drops ? m.falseKeep / drops : 0,
    falseKeeps: rows
      .filter((r) => r.label === 'drop' && r.keep)
      .map((r) => ({ id: r.id, reason: r.reason })),
    falseRejects: rows
      .filter((r) => r.label === 'keep' && !r.keep)
      .map((r) => ({ id: r.id, reason: r.reason })),
  };
}

async function load(entry, cacheDir) {
  if (entry.file) return readFile(entry.file);
  const cached = path.join(cacheDir, `${entry.id.replace(/[^\w.-]/g, '_')}.bin`);
  try {
    return await readFile(cached);
  } catch {
    const res = await fetch(entry.url);
    if (!res.ok) throw new Error(`download ${res.status} for ${entry.url}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cached, bytes);
    return bytes;
  }
}

export async function runEval(entries, { client, cacheDir, concurrency = DEFAULT_CONCURRENCY }) {
  const rows = [];
  let next = 0;
  const worker = async () => {
    while (next < entries.length) {
      const entry = entries[next++];
      try {
        const buffer = await load(entry, cacheDir);
        const r = await qcPhoto(
          {
            buffer,
            caption: entry.caption,
            source: entry.source,
            kind: entry.kind ?? kindFromId(entry.id),
          },
          { client },
        );
        rows.push({
          id: entry.id,
          label: entry.label,
          keep: r.keep,
          error: r.error === true,
          reason: r.reason,
          usage: r.usage,
        });
      } catch (err) {
        rows.push({
          id: entry.id,
          label: entry.label,
          keep: false,
          error: true,
          reason: `load failed: ${err.message}`,
          usage: { inputTokens: 0, outputTokens: 0 },
        });
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

if (isMain(import.meta.url, process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = (name) => args[args.indexOf(name) + 1];
  if (!args.includes('--labels'))
    throw new Error(
      'Usage: node scripts/social/photo-qc-eval.mjs --labels labels.json [--ids a,b] [--out results.json] [--cache-dir dir]',
    );
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set.');
  let entries = JSON.parse(await readFile(flag('--labels'), 'utf8'));
  if (args.includes('--ids')) {
    const ids = new Set(flag('--ids').split(','));
    entries = entries.filter((e) => ids.has(e.id));
  }
  const rows = await runEval(entries, {
    client: new Anthropic({ maxRetries: 0 }),
    cacheDir: args.includes('--cache-dir') ? flag('--cache-dir') : '.artifacts/qc-eval',
  });
  const usage = rows.reduce(
    (a, r) => ({
      inputTokens: a.inputTokens + r.usage.inputTokens,
      outputTokens: a.outputTokens + r.usage.outputTokens,
    }),
    { inputTokens: 0, outputTokens: 0 },
  );
  const summary = summarize(rows);
  const errors = rows.filter((r) => r.error).length;
  console.log(
    JSON.stringify(
      {
        ...summary,
        errors,
        ...usage,
        usd: Number(estimateCost(usage).toFixed(4)),
        usdPerPhoto: Number((estimateCost(usage) / Math.max(rows.length, 1)).toFixed(5)),
      },
      null,
      2,
    ),
  );
  if (args.includes('--out')) await writeFile(flag('--out'), JSON.stringify(rows, null, 2) + '\n');
}
