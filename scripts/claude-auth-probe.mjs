#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function probeVerdict(entries) {
  if (!Array.isArray(entries)) return { ok: false, reason: 'invalid execution metadata' };
  const result = entries.findLast((entry) => entry?.type === 'result');
  if (!result) return { ok: false, reason: 'missing terminal result' };
  if (result.is_error || result.subtype !== 'success') return { ok: false, reason: 'model result was not successful' };
  if (result.num_turns !== 1) return { ok: false, reason: 'probe did not use exactly one turn' };
  if (!Number.isFinite(result.total_cost_usd) || result.total_cost_usd > 0.05) {
    return { ok: false, reason: 'probe exceeded or omitted its cost metadata' };
  }
  if (String(result.result).trim() !== 'AUTH_OK') return { ok: false, reason: 'sentinel did not match' };
  return { ok: true, reason: 'OAuth and Haiku inference succeeded within probe limits', costUsd: result.total_cost_usd };
}

async function main(file = process.argv[2]) {
  if (!file) throw new Error('probe failed before terminal result');
  let entries;
  try {
    entries = JSON.parse(await readFile(file, 'utf8'));
  } catch {
    throw new Error('probe execution metadata was unavailable');
  }
  const verdict = probeVerdict(entries);
  if (!verdict.ok) throw new Error(verdict.reason);
  console.log(`claude-auth-probe: ${verdict.reason}; cost_usd=${verdict.costUsd}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(`claude-auth-probe: ${error.message}`);
    process.exitCode = 1;
  });
}
