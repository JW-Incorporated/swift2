import { describe, expect, it } from 'vitest';
// buildAll() only reads local seed files — importing this module for it
// (and loadWorkerEnvLocal, reused by knowledge-coverage.mjs) never writes to
// a database; main() only runs when the file is invoked directly.
import { buildAll } from './sync-clown-knowledge.mjs';

describe('sync-clown-knowledge buildAll()', () => {
  it('builds knowledge_doc/egg_ledger/symbol_lexicon rows from real Vault seed data', async () => {
    const { knowledgeDocs, eggLedgerRows, symbolLexicon } = await buildAll();
    expect(knowledgeDocs.length).toBeGreaterThan(0);
    expect(eggLedgerRows.length).toBeGreaterThan(0);
    expect(symbolLexicon.length).toBeGreaterThan(0);
  });

  it('is idempotent — running it twice yields the same row counts and ids (safe to re-run/upsert)', async () => {
    const first = await buildAll();
    const second = await buildAll();
    expect(second.knowledgeDocs.length).toBe(first.knowledgeDocs.length);
    expect(second.eggLedgerRows.length).toBe(first.eggLedgerRows.length);
    expect(second.symbolLexicon.length).toBe(first.symbolLexicon.length);
    expect(second.knowledgeDocs.map((d) => d.id).sort()).toEqual(first.knowledgeDocs.map((d) => d.id).sort());
    expect(second.eggLedgerRows.map((r) => r.id).sort()).toEqual(first.eggLedgerRows.map((r) => r.id).sort());
    expect(second.symbolLexicon.map((s) => s.key).sort()).toEqual(first.symbolLexicon.map((s) => s.key).sort());
  });

  it('every knowledge_doc id is unique', async () => {
    const { knowledgeDocs } = await buildAll();
    const ids = knowledgeDocs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only confirmed easter_egg theories reach egg_ledger, and every row has a hint_date', async () => {
    const { eggLedgerRows } = await buildAll();
    expect(eggLedgerRows.length).toBeGreaterThan(0);
    for (const row of eggLedgerRows) {
      expect(row.confirmed).toBe(true);
      expect(row.outcome).toBe('confirmed');
      expect(row.hint_date).toBeTruthy();
    }
  });

  it('the technique table is never referenced or written by this script', async () => {
    const source = await import('node:fs/promises').then((fs) => fs.readFile(new URL('./sync-clown-knowledge.mjs', import.meta.url), 'utf-8'));
    expect(source).not.toMatch(/public\.technique/);
  });
});
