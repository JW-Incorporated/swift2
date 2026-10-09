// Ledger of candidates the photo vision check rejected (social/photo-qc-rejected.json),
// so the same candidate is not paid for again on the next daily run. Keyed by candidate
// id (checked before download) and by sha256 of the normalized bytes (checked before QC).
import { readFile, writeFile } from 'node:fs/promises';

export function createRejectedLedger(json = {}) {
  const entries = Array.isArray(json.rejected) ? [...json.rejected] : [];
  const ids = new Set(entries.map((e) => e.id));
  const hashes = new Set(entries.map((e) => e.sha256).filter(Boolean));
  const added = [];
  return {
    hasId: (id) => ids.has(id),
    hasHash: (sha256) => hashes.has(sha256),
    add({ id, sha256, reason, date }) {
      const entry = { id, sha256, reason, date };
      ids.add(id);
      hashes.add(sha256);
      entries.push(entry);
      added.push(entry);
    },
    added: () => added,
    toJSON: () => ({ ...json, version: json.version ?? 1, rejected: entries }),
  };
}

export async function loadRejectedLedger(file) {
  try {
    return createRejectedLedger(JSON.parse(await readFile(file, 'utf8')));
  } catch (err) {
    if (err?.code === 'ENOENT') return createRejectedLedger();
    throw err;
  }
}

export async function saveRejectedLedger(file, ledger) {
  await writeFile(file, JSON.stringify(ledger.toJSON(), null, 2) + '\n');
}
