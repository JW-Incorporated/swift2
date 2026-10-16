import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it, vi } from 'vitest';
import { main } from './breaking-draft.mjs';
import { isBreakingEnabled, shapeBreakingPair } from './lib/breaking.mjs';
import { selectDuePosts } from './lib/queue.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const now = new Date('2026-10-15T12:00:00Z');
const item = (platform: string, extra = {}) => ({ platform, campaign: `c-${platform}-${Object.keys(extra).length}`, scheduledAt: '2026-10-15T11:00:00Z', status: 'queued', body: 'x', ...extra });

describe('social-breaking workflow is dispatch-only', () => {
  const wf = parse(readFileSync(path.join(root, '.github/workflows/social-breaking.yml'), 'utf8'));
  it('has only workflow_dispatch', () => {
    expect(Object.keys(wf.on)).toEqual(['workflow_dispatch']);
  });
  it('cannot dispatch other workflows and never names the poster or approver', () => {
    const text = readFileSync(path.join(root, '.github/workflows/social-breaking.yml'), 'utf8').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
    expect(wf.permissions).toEqual({ contents: 'read' });
    expect(text).not.toMatch(/gh workflow run|social-poster\.yml|social-tree-approve\.yml/);
  });
});

describe('breaking-draft is off by default', () => {
  it('exits before fetch / child_process / file reads when the flag is unset or not "true"', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const readFile = vi.fn();
    const log = vi.fn();
    for (const env of [{}, { BREAKING_SOCIAL_ENABLED: '1' }, { BREAKING_SOCIAL_ENABLED: 'TRUE' }, { BREAKING_SOCIAL_ENABLED: 'false' }]) {
      expect(await main({ env, argv: ['--dry-run', '--pair', 'x.json'], log, readFile })).toBe(0);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it('has no static child_process or fetch use in the script or its lib', () => {
    for (const f of ['breaking-draft.mjs', 'lib/breaking.mjs']) {
      const src = readFileSync(path.join(here, f), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      expect(src).not.toMatch(/child_process|fetch\(|workflow run|execFile|spawn/);
    }
  });
  it('refuses under SOCIAL_FREEZE even when enabled', async () => {
    const readFile = vi.fn();
    expect(await main({ env: { BREAKING_SOCIAL_ENABLED: 'true', SOCIAL_FREEZE: 'true' }, argv: ['--dry-run', '--pair', 'x'], log: vi.fn(), readFile })).toBe(0);
    expect(readFile).not.toHaveBeenCalled();
    expect(isBreakingEnabled({ BREAKING_SOCIAL_ENABLED: 'true' })).toBe(true);
  });
  it('never emits an approval key and requires a pair', () => {
    const r = shapeBreakingPair([item('x', { approval: { sig: 'forged' } }), item('x')]);
    expect(r.findings.join()).toMatch(/one x item and one instagram/);
    expect(r.items.some((i: Record<string, unknown>) => 'approval' in i)).toBe(false);
  });
});

describe('queue +2 breaking allowance', () => {
  const posted = new Map([['x', 1], ['instagram', 1]]);
  it('does not apply to ordinary items, truthy lookalikes, or a spent day', () => {
    expect(selectDuePosts([item('x')], now, posted, Infinity)).toHaveLength(0);
    expect(selectDuePosts([item('x', { breaking: 'true' })], now, posted, Infinity)).toHaveLength(0);
    expect(selectDuePosts([item('x', { breaking: 1 })], now, posted, Infinity)).toHaveLength(0);
  });
  const ON = { breakingEnabled: true };
  it('is a no-op without breakingEnabled, even for strict breaking:true', () => {
    expect(selectDuePosts([item('x', { breaking: true })], now, posted, Infinity)).toHaveLength(0);
    expect(selectDuePosts([item('x', { breaking: true })], now, posted, Infinity, { breakingEnabled: false })).toHaveLength(0);
  });
  it('lets breaking items through up to 2 extra per platform', () => {
    const b = (n: number) => item('x', { breaking: true, campaign: `b${n}` });
    expect(selectDuePosts([b(1), b(2), b(3)], now, new Map([['x', 1]]), Infinity, ON)).toHaveLength(2);
    expect(selectDuePosts([b(1)], now, new Map([['x', 3]]), Infinity, ON)).toHaveLength(0);
  });
  it('a breaking pair needs both sides breaking', () => {
    const pair = (bx: boolean, bi: boolean) => [
      { ...item('x', { breaking: bx }), campaign: 'p' },
      { ...item('instagram', { breaking: bi }), campaign: 'p' },
    ];
    expect(selectDuePosts(pair(true, true), now, posted, Infinity, ON)).toHaveLength(2);
    expect(selectDuePosts(pair(true, false), now, posted, Infinity, ON)).toHaveLength(0);
  });
  it('unchanged for the empty live queue: no breaking items under social/queue', () => {
    const dir = path.join(root, 'social', 'queue');
    let files: string[] = [];
    try { files = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { /* none */ }
    for (const f of files) expect(JSON.parse(readFileSync(path.join(dir, f), 'utf8')).breaking).toBeUndefined();
  });
});
