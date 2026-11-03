import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import { buildContextPack } from './context-pack';
import { ExtractUsageStore, WRITER_DAILY_CAP, WRITER_PER_RUN_CAP, type UsageDb } from './usage-store';
import { splitBodySentences, writePost, type WriterInput } from './writer-client';

function db(initial = 0): UsageDb {
  let count = initial;
  return {
    async todaysCallCount() {
      return count;
    },
    async incrementToday() {
      count++;
    },
  };
}

const LEAD =
  'Taylor turned up at a private Showgirl screening and the fan corner of the internet immediately noticed who she brought along. It is the first public sighting of the new era circle, and the guest list matters.';
const BODY =
  'Taylor attended the screening, People reports. Around 200 guests were there.\n\nThe Showgirl era has leaned on small, invite-only rooms like this one.';

const input: WriterInput = {
  headline: 'Taylor at a Showgirl screening',
  statusHint: 'reported',
  facts: [
    { id: 'f1', claim: 'Taylor attended a screening.', attribution: 'People', confidence: 'reported' },
    { id: 'f2', claim: 'About 200 guests attended.', attribution: 'The Ankler', confidence: 'reported' },
  ],
  context: buildContextPack({
    eraName: 'The Life of a Showgirl',
    eraSummary: 'The 2025 album era.',
    headline: 'Taylor at a Showgirl screening',
    entities: [],
    moments: [],
    priorItems: [],
  }),
};

const goodData = () => ({
  lead: LEAD,
  body: BODY,
  citations: [
    { sentence: 0, ref: 'f1' },
    { sentence: 1, ref: 'f2' },
    { sentence: 2, ref: 'c1' },
  ],
});

const claudeReturning = (data: unknown) =>
  vi.fn().mockResolvedValue({ status: 'ok', data }) as unknown as WorkerClaudeCaller;

afterEach(() => vi.unstubAllEnvs());

describe('writePost', () => {
  it('returns the validated draft on the happy path and calls Sonnet', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = claudeReturning(goodData());
    const usage = await ExtractUsageStore.create(db(), WRITER_PER_RUN_CAP, WRITER_DAILY_CAP);
    const result = await writePost(usage, input, claude);
    expect(result).toEqual({
      status: 'ok',
      draft: { lead: LEAD, body: BODY, citations: goodData().citations },
    });
    expect(claude).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-sonnet-5-5' }));
  });

  it('passes rewrite reasons into the prompt', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = claudeReturning(goodData());
    const usage = await ExtractUsageStore.create(db());
    await writePost(usage, { ...input, rewriteReasons: ['body repeats the lead'] }, claude);
    expect(vi.mocked(claude).mock.calls[0]?.[0].user).toContain('- body repeats the lead');
  });

  it('rejects citations that reference unknown ids or leave sentences uncited', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(db());
    const bad = { ...goodData(), citations: [{ sentence: 0, ref: 'f9' }, { sentence: 1, ref: 'f2' }] };
    const result = await writePost(usage, input, claudeReturning(bad));
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') {
      expect(result.reasons.join(' ')).toContain('f9');
      expect(result.reasons.join(' ')).toContain('body sentence 0 has no citation');
      expect(result.reasons.join(' ')).toContain('body sentence 2 has no citation');
    }
  });

  it('rejects a lead over 400 characters', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(db());
    const long = { ...goodData(), lead: 'x'.repeat(401) };
    const result = await writePost(usage, input, claudeReturning(long));
    expect(result).toEqual({
      status: 'invalid',
      reasons: ['lead is 401 characters; the maximum is 400'],
    });
  });

  it('defers without calling the model when the writer budget is exhausted', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const claude = claudeReturning(goodData());
    const usage = await ExtractUsageStore.create(db(), 0, WRITER_DAILY_CAP);
    await expect(writePost(usage, input, claude)).resolves.toEqual({
      status: 'deferred',
      reason: 'writer budget exhausted',
    });
    expect(claude).not.toHaveBeenCalled();
  });

  it('defers when the wrapper reports capped, and throws on invalid wrapper output', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const capped = vi.fn().mockResolvedValue({ status: 'capped', reason: 'limit' }) as unknown as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(db());
    await expect(writePost(usage, input, capped)).resolves.toEqual({ status: 'deferred', reason: 'limit' });
    const broken = vi.fn().mockResolvedValue({ status: 'invalid', reason: 'bad json' }) as unknown as WorkerClaudeCaller;
    await expect(writePost(usage, input, broken)).rejects.toThrow('bad json');
  });

  it('defers with no subscription token', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const claude = claudeReturning(goodData());
    const usage = await ExtractUsageStore.create(db());
    expect((await writePost(usage, input, claude)).status).toBe('deferred');
    expect(claude).not.toHaveBeenCalled();
  });
});

describe('splitBodySentences', () => {
  it('splits across paragraphs', () => {
    expect(splitBodySentences(BODY)).toHaveLength(3);
  });
});
