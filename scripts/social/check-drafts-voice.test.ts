import { describe, expect, it } from 'vitest';
import { checkDraft } from './check-drafts.mjs';
import { bodyHash } from './lib/judge-rubric.mjs';
import { scrubbedEnv } from './stamp-tree-auto.mjs';
import { checkVoiceStyle } from './lib/voice-gates.mjs';

const CRITIQUE = {
  v: 1,
  scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 },
  total: 23,
  rationale: 'A dated, verifiable detail carries the post.',
  rulesChecked: [],
  revision: 1,
};
const NOW = Date.parse('2026-11-08T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const base = { platform: 'x', scheduledAt: '2026-11-09T15:00:00Z', critique: CRITIQUE };
const posted = (body: string, d: number, extra = {}) => ({ file: 'p.json', full: 'p.json', data: { platform: 'x', body, postedAt: daysAgo(d), campaign: 'other', ...extra } });
const run = (body: string, allPosted: unknown[] = [], extra = {}) =>
  checkDraft({ file: 'd.json', data: { ...base, body } }, { allQueue: [], allPosted, openerContext: [], recentIg: [], now: NOW, ...extra });

describe('checkDraft voice gates', () => {
  it('hard-fails more than one em dash and allows exactly one', async () => {
    expect((await run('one — two — three, all of it hers.')).some((f) => f.startsWith('voice: 2 em dashes'))).toBe(true);
    expect((await run('one — two, all of it hers.')).some((f) => f.startsWith('voice:'))).toBe(false);
  });

  it('hard-fails a contrast frame', async () => {
    expect((await run("this song isn't a sad one, it's the happiest thing on the record.")).some((f) => f.includes('contrast frame'))).toBe(true);
  });

  it('fails a tag-a-friend CTA only when one posted in the last 14 days', async () => {
    const body = 'tag the friend who knew all along 🤍';
    expect((await run(body, [posted('tag a friend who gets it', 3)])).some((f) => f.includes('tag-a-friend'))).toBe(true);
    expect((await run(body, [posted('tag a friend who gets it', 20)])).some((f) => f.includes('tag-a-friend'))).toBe(false);
    expect((await run(body, [])).some((f) => f.includes('tag-a-friend'))).toBe(false);
  });

  it('fails a question lead only when one of the last 4 posted on that platform led with a question', async () => {
    const body = 'which era taught you the most?';
    expect((await run(body, [posted('who remembers this one?', 5)])).some((f) => f.includes('question lead'))).toBe(true);
    expect((await run(body, [posted('who remembers this one?', 5, { platform: 'instagram' })])).some((f) => f.includes('question lead'))).toBe(false);
    const recentStatements = [1, 2, 3, 4].map((d) => posted(`statement number ${d} about folklore`, d));
    expect((await run(body, [posted('who remembers this one?', 9), ...recentStatements])).some((f) => f.includes('question lead'))).toBe(false);
  });

  it('fails 4-gram overlap of 0.2 or more with a caption posted in the last 14 days', async () => {
    const body = 'speak now is the only album taylor wrote entirely alone and every song is hers';
    const near = posted('speak now is the only album taylor wrote entirely alone, no co-writers', 4);
    expect((await run(body, [near])).some((f) => f.includes('4-gram overlap'))).toBe(true);
    expect((await run(body, [posted(near.data.body, 30)])).some((f) => f.includes('4-gram overlap'))).toBe(false);
  });

  it('ignores the same campaign (the pair sibling) and the shared link when comparing', () => {
    const link = 'longlivets.com/?item=vault-tloas-richard-marx&utm_source=x&utm_medium=social&utm_campaign=era-deep-cut';
    const sibling = { platform: 'x', body: `speak now is the only album taylor wrote entirely alone ${link}`, postedAt: daysAgo(1), campaign: 'pair' };
    expect(checkVoiceStyle({ platform: 'instagram', campaign: 'pair', body: 'speak now is the only album taylor wrote entirely alone' }, [sibling], { now: NOW })).toEqual([]);
    const other = { ...sibling, campaign: 'different', body: `this is a different caption entirely about folklore ${link}` };
    expect(checkVoiceStyle({ platform: 'x', campaign: 'c', body: `a fresh new thought about reputation tonight ${link}` }, [other], { now: NOW })).toEqual([]);
  });
});

describe('checkDraft independent judge requirement', () => {
  const body = 'folklore track three never fails to get me 🍂';
  const judge = { model: 'claude-opus-5-5', scores: { onVoice: 4, specific: 4, formula: 4, notEmbarrassed: 4 }, at: '2026-11-08T11:00:00Z', bodyHash: bodyHash(body) };
  const judged = (j: unknown, extra = {}) =>
    checkDraft({ file: 'd.json', data: { ...base, body, critique: { ...CRITIQUE, judge: j } } }, { allQueue: [], allPosted: [], openerContext: [], recentIg: [], now: NOW, ...extra });

  it('is optional at draft time and required when asked', async () => {
    expect((await run(body)).some((f) => f.startsWith('judge:'))).toBe(false);
    expect((await run(body, [], { requireJudge: true })).some((f) => f.includes('critique.judge is missing'))).toBe(true);
  });

  it('passes a valid record and fails a low score, with or without the requirement', async () => {
    expect((await judged(judge, { requireJudge: true })).some((f) => f.startsWith('judge:'))).toBe(false);
    const low = { ...judge, scores: { ...judge.scores, formula: 3 } };
    expect((await judged(low)).some((f) => f.includes('formula is 3'))).toBe(true);
    expect((await judged(low, { requireJudge: true })).some((f) => f.includes('formula is 3'))).toBe(true);
  });
});

describe('approve-workflow signal', () => {
  it('survives the credential scrub stamp-tree-auto applies before spawning check-drafts', () => {
    const env = scrubbedEnv({ GITHUB_WORKFLOW: 'social-tree-approve', GH_TOKEN: 'x', SOCIAL_APPROVAL_KEY: 'y', PATH: '/bin' });
    expect(env.GITHUB_WORKFLOW).toBe('social-tree-approve');
    expect(env.GH_TOKEN).toBeUndefined();
  });
});
