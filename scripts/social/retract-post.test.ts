import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main } from './retract-post.mjs';
import { facebookDeleteRequest, isRetractionEnabled, planRetraction, xDeleteRequest } from './lib/retraction.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const on = { RETRACTION_SOCIAL_ENABLED: 'true' };

const records = [
  { file: 'a-x.json', data: { platform: 'x', campaign: 'c1', platformPostId: '111', url: 'https://x.com/u/status/111' } },
  { file: 'a-ig.json', data: { platform: 'instagram', campaign: 'c1', platformPostId: '222', facebookPostId: '333', url: 'https://instagram.com/p/z' } },
  { file: 'b-x.json', data: { platform: 'x', campaign: 'other', platformPostId: '999' } },
];

const dirs: string[] = [];
function postedDir() {
  const d = mkdtempSync(path.join(tmpdir(), 'retract-'));
  dirs.push(d);
  for (const r of records) writeFileSync(path.join(d, r.file), JSON.stringify(r.data));
  return d;
}
afterEach(() => {
  vi.unstubAllGlobals();
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('request shapes and plan', () => {
  it('X delete request shape', () => {
    expect(xDeleteRequest('111')).toMatchObject({ method: 'DELETE', url: 'https://api.twitter.com/2/tweets/111' });
  });
  it('Facebook delete request shape', () => {
    expect(facebookDeleteRequest('333')).toMatchObject({ method: 'DELETE', url: 'https://graph.facebook.com/v25.0/333' });
  });
  it('plans only the named campaign: X delete, IG manual, FB delete', () => {
    const plan = planRetraction(records, 'c1');
    expect(plan.map((s) => `${s.platform}:${s.action}`)).toEqual(['x:delete', 'instagram:manual', 'facebook:delete']);
  });
});

describe('inertness (architect ruling #14)', () => {
  it('flag is default-off and exact', async () => {
    expect(isRetractionEnabled({})).toBe(false);
    expect(isRetractionEnabled({ RETRACTION_SOCIAL_ENABLED: 'TRUE' })).toBe(false);
    expect(isRetractionEnabled(on)).toBe(true);
    const log = vi.fn();
    expect(await main({ env: {}, argv: ['--campaign', 'c1'], log, postedDir: postedDir() })).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
  });
  it('honors SOCIAL_FREEZE', async () => {
    const log = vi.fn();
    expect(await main({ env: { ...on, SOCIAL_FREEZE: '1' }, argv: ['--campaign', 'c1'], log, postedDir: postedDir() })).toBe(0);
    expect(log.mock.calls[0][0]).toMatch(/SOCIAL_FREEZE/);
  });
  it('dry-run by default reports the plan and makes no network call', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const log = vi.fn();
    const dir = postedDir();
    expect(await main({ env: on, argv: ['--campaign', 'c1'], log, postedDir: dir })).toBe(0);
    const out = log.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toMatch(/dry-run - 3 planned/);
    expect(out).toContain('DELETE https://api.twitter.com/2/tweets/111');
    expect(out).not.toContain('999');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('live modes are not implemented', async () => {
    const log = vi.fn();
    expect(await main({ env: on, argv: ['--live', '--campaign', 'c1'], log, postedDir: postedDir() })).toBe(1);
    expect(await main({ env: on, argv: ['--no-dry-run', '--campaign', 'c1'], log, postedDir: postedDir() })).toBe(1);
  });
  it('never imports, spawns or names the live delete/post scripts or process APIs', () => {
    for (const f of ['scripts/social/retract-post.mjs', 'scripts/social/lib/retraction.mjs']) {
      const code = readFileSync(path.join(root, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l) => !l.trim().startsWith('//'))
        .join('\n');
      expect(code).not.toMatch(/delete-media|post-queue|child_process|\bfetch\s*\(|\bspawn|\bexec(Sync|File)?\s*\(/);
    }
  });
  it('live delete workflow is untouched: media_ids only, delete-media.mjs last step', () => {
    const text = readFileSync(path.join(root, '.github/workflows/social-delete-media.yml'), 'utf8');
    const wf = parse(text);
    expect(Object.keys(wf.on)).toEqual(['workflow_dispatch']);
    expect(Object.keys(wf.on.workflow_dispatch.inputs)).toEqual(['media_ids']);
    expect(wf.on.workflow_dispatch.inputs.media_ids.required).toBe(true);
    expect(wf.jobs.delete.steps.at(-1).run).toBe('node scripts/social/delete-media.mjs');
  });
});
