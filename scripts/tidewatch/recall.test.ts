import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { MAX_JEV_CALLS, main, matchReferences, readAuditInputs } from './recall.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');

function readonlyClient(rows: Record<string, unknown[]>) {
  const calls: string[] = [];
  return {
    calls,
    from(table: string) {
      calls.push(`from:${table}`);
      return {
        select() {
          calls.push(`select:${table}`);
          return { range: async () => ({ data: rows[table] ?? [], error: null }) };
        },
        insert: () => { throw new Error('write attempted'); },
        update: () => { throw new Error('write attempted'); },
        upsert: () => { throw new Error('write attempted'); },
        delete: () => { throw new Error('write attempted'); },
      };
    },
  };
}

describe('weekly recall inertness', () => {
  it('is workflow_dispatch only', async () => {
    const yaml = await readFile(path.join(root, '.github', 'workflows', 'news-recall.yml'), 'utf8');
    expect(yaml).toMatch(/on:\s*\n\s+workflow_dispatch:/);
    expect(yaml).not.toMatch(/^\s+(schedule|push|pull_request):/m);
  });

  it('reads all shadow stores without mutations and emits only a report', async () => {
    const client = readonlyClient({
      watch_item: [{ id: 'seen-1', excerpt: 'unrelated archive item', first_seen_at: '2026-10-10T02:00:00Z' }],
      watch_decision: [{ item_id: 'seen-1', class: 'normal_news', shadow: true }],
      story_timeline: [{ story_id: 'story-1', detected_at: '2026-10-10T02:00:00Z' }],
    });
    const inputs = await readAuditInputs(client);
    expect(inputs).toMatchObject({ seen: [{ id: 'seen-1' }], decisions: [{ shadow: true }], timelines: [{ story_id: 'story-1' }] });
    expect(client.calls).toEqual(expect.arrayContaining([
      'select:watch_item', 'select:watch_decision', 'select:story_timeline',
    ]));
    expect(client.calls.some((call) => /insert|update|upsert|delete/.test(call))).toBe(false);
    const source = await readFile(path.join(root, 'scripts', 'tidewatch', 'recall.mjs'), 'utf8');
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/gh\.mjs|gh\s*\(/);
    expect(source).toContain('usageLogger: createJevUsageLogger(client)');
  });

  it('defaults filing off and never calls an issue filer', async () => {
    const client = readonlyClient({ watch_item: [], watch_decision: [], story_timeline: [] });
    const emitted = vi.fn();
    const report = await main(['--out', 'report.json'], {
      now: Date.parse('2026-10-15T12:00:00Z'), client,
      collectReferences: async () => [], jev: { ask: vi.fn() }, emitReport: emitted, log: vi.fn(),
    });
    expect(report.filing).toEqual({ requested: false, enabled: false, filed: 0 });
    expect(emitted).toHaveBeenCalledOnce();
  });

  it('uses only Jev and stops at the per-run cap', async () => {
    const source = await readFile(path.join(root, 'scripts', 'tidewatch', 'recall.mjs'), 'utf8');
    expect(source).not.toMatch(/anthropic|claude-call|callClaude/i);
    const references = Array.from({ length: 4 }, (_, index) => ({
      source: 'google_news', title: `Taylor event ${index}`, url: `https://example.com/${index}`,
      published_at: '2026-10-10T00:00:00Z', critical: false,
    }));
    const seen = references.map((_, index) => ({
      id: `seen-${index}`, excerpt: `Taylor event candidate ${index}`, first_seen_at: '2026-10-10T01:00:00Z',
    }));
    const ask = vi.fn().mockResolvedValue({ answers: { same_story: { probability: 0 } } });
    const result = await matchReferences(references, seen, { jev: { ask }, cap: 2 });
    expect(ask).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ calls: 2, cap: 2, capped: true });
    await expect(matchReferences([], [], { jev: { ask }, cap: MAX_JEV_CALLS + 1 })).rejects.toThrow('Jev cap');
  });
});
