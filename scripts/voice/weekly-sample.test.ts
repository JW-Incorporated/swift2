import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildRow, percentile, pickSample, postEnabled, postSample, recordRatings, runWeekly,
} from './weekly-sample.mjs';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function setup(n = 25) {
  const root = mkdtempSync(join(tmpdir(), 'voice-sample-'));
  const dir = join(root, 'posted') + '/';
  mkdirSync(dir);
  for (let i = 0; i < n; i += 1) writeFileSync(`${dir}item-${i}.json`, JSON.stringify({ body: `post ${i}` }));
  return { dir, file: join(root, 'out', 'voice.json') };
}

type Input = { user: string; caller: string; priority: string };
const okCall = (score = 4) => vi.fn(async (input: Input) => ({
  status: 'ok',
  data: {
    results: [...input.user.matchAll(/<text id="([^"]+)"/g)].map((m) => ({
      id: m[1], note: 'n', love: score, insight: score, opinion: score, clowning: score, ai_tells: score,
    })),
  },
}));

describe('inertness (architect ruling 14)', () => {
  it('workflow is workflow_dispatch only', () => {
    const wf = read('.github/workflows/voice-sample.yml');
    const on = wf.slice(wf.indexOf('\non:'), wf.indexOf('\npermissions:'));
    expect(on).toMatch(/workflow_dispatch/);
    expect(on).not.toMatch(/schedule|push|pull_request|workflow_run/);
  });

  it('posts nothing and makes no network call unless the flag is true', async () => {
    const fetchImpl = vi.fn();
    for (const flag of [undefined, '', 'false', '1', 'yes']) {
      const env = { DISCORD_BOT_TOKEN: 'x', ...(flag === undefined ? {} : { VOICE_SAMPLE_POST_ENABLED: flag }) };
      expect(postEnabled(env)).toBe(false);
      expect((await postSample([{ id: 'a', text: 't' }], { env, fetchImpl })).posted).toBe(false);
    }
    const { dir, file } = setup();
    await runWeekly({ call: okCall(), env: {}, fetchImpl, dir, file });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts to the marjorie channel only when the flag is true', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200 }));
    const env = { VOICE_SAMPLE_POST_ENABLED: 'true', DISCORD_BOT_TOKEN: 'x' };
    const res = await postSample([{ id: 'a', text: 't' }], { env, fetchImpl });
    expect(res.posted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0][0])).toContain('/channels/1548350324891328562/messages');
  });

  it('scores through the subscription wrapper, not the Batch API or an API key', () => {
    const src = read('scripts/voice/weekly-sample.mjs');
    expect(src).toContain("../lib/claude-call.mjs");
    expect(src).not.toMatch(/ANTHROPIC_API_KEY|anthropic\.mjs|batches/i);
    const wf = read('.github/workflows/voice-sample.yml');
    expect(wf).toContain('CLAUDE_CODE_OAUTH_TOKEN');
    expect(wf).not.toMatch(/ANTHROPIC_API_KEY/);
  });

  it('touches no tidewatch, decision or timeline surface', () => {
    const src = read('scripts/voice/weekly-sample.mjs') + read('.github/workflows/voice-sample.yml');
    expect(src).not.toMatch(/scripts\/tidewatch|config\/tidewatch|watch_decision|seen-store|story_timeline/);
  });
});

describe('weekly sample', () => {
  it('writes one row with mean, p10 and dimension means, capped at 20 items', async () => {
    const { dir, file } = setup();
    const call = okCall(4);
    const { row } = await runWeekly({ call, env: {}, dir, file, now: new Date('2026-10-19T00:00:00Z') });
    expect(row).toMatchObject({ week: '2026-10-19', sampled: 20, scored: 20, mean: 4, p10: 4 });
    expect(row.dimensions.love).toBe(4);
    expect(call.mock.calls[0][0]).toMatchObject({ caller: 'voice-critic', priority: 'P2' });
    expect(JSON.parse(readFileSync(file, 'utf8'))).toHaveLength(1);
  });

  it('is idempotent per week and records not-scored items honestly', async () => {
    const { dir, file } = setup(3);
    const down = vi.fn(async () => ({ status: 'unavailable', reason: 'limit' }));
    const now = new Date('2026-10-19T00:00:00Z');
    const { row } = await runWeekly({ call: down, env: {}, dir, file, now });
    expect(row).toMatchObject({ scored: 0, notScored: 3, mean: null });
    await runWeekly({ call: okCall(), env: {}, dir, file, now });
    expect(JSON.parse(readFileSync(file, 'utf8'))).toHaveLength(1);
  });

  it('logs model vs owner drift', () => {
    const base = buildRow('w', []);
    const row = recordRatings(base, { a: 4, b: 5 }, { a: 3, b: 4, zz: 5, c: 9 });
    expect(row.ownerRatings).toEqual({ n: 2, mean: 3.5 });
    expect(row.drift).toBe(1);
    expect(recordRatings(base, { a: 4 }, {}).drift).toBeNull();
  });

  it('percentile and pickSample are deterministic', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.1)).toBe(2);
    const items = Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, text: 't' }));
    expect(pickSample(items, 20, 7)).toEqual(pickSample(items, 20, 7));
    expect(pickSample(items, 20, 7)).toHaveLength(20);
  });
});
