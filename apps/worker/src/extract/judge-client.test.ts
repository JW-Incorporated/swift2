import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import { judgeWriting } from './judge-client';
import { ExtractUsageStore, type UsageDb } from './usage-store';

const db: UsageDb = { todaysCallCount: async () => 0, incrementToday: async () => undefined };
const INPUT = { headline: 'H', lead: 'L', body: 'B', facts: ['Fact one', 'Fact two'] };

function output(scores: [number, number, number, number]) {
  return {
    voice: scores[0], context: scores[1], grounding: scores[2], non_repetition: scores[3],
    voice_reason: 'v', context_reason: 'c', grounding_reason: 'g', non_repetition_reason: 'n',
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('judgeWriting', () => {
  it('passes when every score is 4 or more and reports the minimum', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'x');
    const claude = vi.fn(async () => ({ status: 'ok', data: output([5, 4, 5, 4]) })) as unknown as WorkerClaudeCaller;
    const result = await judgeWriting(await ExtractUsageStore.create(db), INPUT, claude);
    expect(result).toMatchObject({ status: 'ok', pass: true, writingScore: 4 });
    const call = (claude as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(call.model).toBe('claude-haiku-5-5');
    expect(call.user).toContain('1. Fact one');
  });

  it('fails when any score is below 4', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'x');
    const claude = vi.fn(async () => ({ status: 'ok', data: output([5, 5, 3, 5]) })) as unknown as WorkerClaudeCaller;
    const result = await judgeWriting(await ExtractUsageStore.create(db), INPUT, claude);
    expect(result).toMatchObject({ status: 'ok', pass: false, writingScore: 3 });
    if (result.status === 'ok') expect(result.reasons.grounding).toBe('g');
  });

  it('defers without calling when the budget is exhausted', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'x');
    const claude = vi.fn() as unknown as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(db, 0, 0);
    expect(await judgeWriting(usage, INPUT, claude)).toEqual({ status: 'deferred', reason: 'budget_exhausted' });
    expect(claude).not.toHaveBeenCalled();
  });

  it('defers without a token', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const claude = vi.fn() as unknown as WorkerClaudeCaller;
    expect(await judgeWriting(await ExtractUsageStore.create(db), INPUT, claude)).toEqual({ status: 'deferred', reason: 'no_token' });
  });

  it('defers when the wrapper is capped or unavailable', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'x');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const claude = vi.fn(async () => ({ status: 'capped', reason: 'limit' })) as unknown as WorkerClaudeCaller;
    expect(await judgeWriting(await ExtractUsageStore.create(db), INPUT, claude)).toEqual({ status: 'deferred', reason: 'limit' });
  });

  it('throws on invalid output', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'x');
    const bad = vi.fn(async () => ({ status: 'ok', data: { voice: 9 } })) as unknown as WorkerClaudeCaller;
    await expect(judgeWriting(await ExtractUsageStore.create(db), INPUT, bad)).rejects.toThrow(/invalid/);
    const invalid = vi.fn(async () => ({ status: 'invalid', reason: 'nope' })) as unknown as WorkerClaudeCaller;
    await expect(judgeWriting(await ExtractUsageStore.create(db), INPUT, invalid)).rejects.toThrow(/nope/);
  });
});
