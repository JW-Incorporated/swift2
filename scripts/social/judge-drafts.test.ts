import { describe, expect, it } from 'vitest';
import { alreadyJudged, judgeCaption, judgeItem } from './judge-drafts.mjs';
import { JUDGE_MODEL, checkJudge } from './lib/judge-rubric.mjs';

const ok = { onVoice: 4, specific: 5, formula: 4, notEmbarrassed: 4, onVoice_reason: 'warm', specific_reason: 'dated', formula_reason: 'clean', notEmbarrassed_reason: 'proud' };
const draft = { platform: 'x', body: 'speak now was all hers 🤍', critique: { v: 1, total: 20 } };
const now = () => new Date('2026-11-08T11:00:00Z');

describe('judgeCaption', () => {
  it('sends the social rubric to the judge model with the schema and returns parsed scores', async () => {
    let seen: { model: string; schema: unknown; user: string } | undefined;
    const claude = async (req: { model: string; schema: unknown; user: string }) => {
      seen = req;
      return { status: 'ok', data: ok };
    };
    const r = await judgeCaption(draft, { claude });
    expect(r).toMatchObject({ status: 'ok', scores: { onVoice: 4, specific: 5, formula: 4, notEmbarrassed: 4 } });
    expect(seen?.model).toBe(JUDGE_MODEL);
    expect(seen?.schema).toBeTruthy();
    expect(seen?.user).toContain('speak now was all hers');
  });

  it('reports an unavailable call and an invalid score object without throwing', async () => {
    expect(await judgeCaption(draft, { claude: async () => ({ status: 'unavailable', reason: 'limit' }) })).toEqual({ status: 'unavailable', reason: 'limit' });
    expect(await judgeCaption(draft, { claude: async () => ({ status: 'ok', data: { ...ok, formula: 9 } }) })).toEqual({ status: 'invalid', reason: 'invalid_scores' });
  });
});

describe('judgeItem', () => {
  it('writes critique.judge and changes nothing else', async () => {
    const { item, outcome } = await judgeItem(draft, { claude: async () => ({ status: 'ok', data: ok }), now });
    expect(outcome.status).toBe('ok');
    expect(item.critique.judge).toMatchObject({ model: JUDGE_MODEL, at: '2026-11-08T11:00:00.000Z', scores: { formula: 4 } });
    expect({ ...item, critique: { ...item.critique, judge: undefined } }).toEqual({ ...draft, critique: { ...draft.critique, judge: undefined } });
    expect(Object.keys(item)).not.toContain('approval');
    expect(checkJudge(item, { required: true })).toEqual([]);
  });

  it('records a low score for the approval gate to refuse rather than erroring', async () => {
    const { item } = await judgeItem(draft, { claude: async () => ({ status: 'ok', data: { ...ok, formula: 2 } }), now });
    expect(checkJudge(item, { required: true })).toContain('judge: formula is 2, needs 4 (independent social judge).');
  });

  it('skips a draft already judged for this exact body, and re-judges after an edit', async () => {
    const { item } = await judgeItem(draft, { claude: async () => ({ status: 'ok', data: ok }), now });
    expect(alreadyJudged(item)).toBe(true);
    const calls: number[] = [];
    const claude = async () => {
      calls.push(1);
      return { status: 'ok', data: ok };
    };
    expect((await judgeItem(item, { claude, now })).outcome.status).toBe('skipped');
    expect(calls).toHaveLength(0);
    await judgeItem({ ...item, body: `${item.body} edit` }, { claude, now });
    expect(calls).toHaveLength(1);
  });

  it('leaves the draft untouched when the call fails or the draft has no critique', async () => {
    const failed = await judgeItem(draft, { claude: async () => ({ status: 'capped', reason: 'cap' }), now });
    expect(failed.item).toBe(draft);
    expect(failed.outcome.status).toBe('capped');
    expect((await judgeItem({ platform: 'x', body: 'x' }, { now })).outcome.status).toBe('invalid');
  });
});
