import { describe, expect, it, vi } from 'vitest';
import { composePost, type ComposeInput } from './compose-post';
import type { JudgeInput } from './judge-prompt';
import type { ExtractUsageStore } from './usage-store';
import type { WriterAttempt, WriterResult } from './writer-client';

const LEAD =
  'Taylor stepped into a quiet Nashville recording room this week, and the photos that followed have fans wondering what the next chapter of The Life of a Showgirl might sound like. The visit was brief, but the timing lands in a stretch of careful silence.';
const SENTENCES = [
  'The photos show Taylor outside Blackbird Studio in Nashville on Tuesday afternoon.',
  'She arrived with a small group and left roughly three hours later.',
  'Neither her team nor the studio has said what the session was for.',
  'Blackbird has hosted sessions for artists across country and pop for decades.',
  'Fans noticed the visit within hours and began comparing it with earlier studio sightings.',
  'Last autumn the album rollout began with a similarly quiet stretch of studio rumors.',
  'That history is why one afternoon outside a recording room now draws such attention.',
  'For now the only detail anyone can confirm is the location and the day.',
  'Everything about the purpose stays open until Taylor or her representatives say otherwise.',
  'Watch her official channels over the coming days, since announcements for this era have usually landed with very little warning, often on a weekday morning.',
];
const refsFor = (i: number) => (i === 5 ? ['c1'] : ['f1']);
const PARAGRAPHS = [
  { sentences: SENTENCES.slice(0, 5).map((text, i) => ({ text, refs: refsFor(i) })) },
  { sentences: SENTENCES.slice(5).map((text, i) => ({ text, refs: refsFor(i + 5) })) },
];
const BODY = `${SENTENCES.slice(0, 5).join(' ')}\n\n${SENTENCES.slice(5).join(' ')}`;

function attempt(paragraphs = PARAGRAPHS): WriterAttempt {
  return { lead: LEAD, body: BODY, paragraphs, citations: [] };
}

const INPUT: ComposeInput = {
  headline: 'Taylor spotted outside a Nashville studio',
  statusHint: 'reported',
  facts: [{ id: 'f1', claim: 'Taylor was photographed outside Blackbird Studio.', attribution: 'People', confidence: 'reported' }],
  context: { items: [{ id: 'c1', kind: 'prior', text: 'Last autumn the album rollout began quietly.' }], text: '[c1] Last autumn the album rollout began quietly.' },
  sources: [{ outletName: 'People', url: 'https://people.com/a' }],
};
const store = {} as ExtractUsageStore;
const PASS = {
  status: 'ok' as const, pass: true, writingScore: 4,
  scores: { voice: 4, context: 4, grounding: 4, non_repetition: 4 },
  reasons: { voice: '', context: '', grounding: '', non_repetition: '' },
};

describe('composePost', () => {
  it('gives the judge the context pack and every sentence with its refs', async () => {
    const write = vi.fn(async (): Promise<WriterResult> => ({ status: 'ok', draft: attempt() }));
    const judgeFn = vi.fn<(s: unknown, i: JudgeInput) => Promise<typeof PASS>>(async () => PASS);
    const result = await composePost({ writer: store, judge: store, write, judgeFn }, INPUT);
    expect(result.status).toBe('ok');
    const judged = judgeFn.mock.calls[0]![1];
    expect(judged.context).toBe(INPUT.context.text);
    expect(judged.facts[0]).toContain('[f1]');
    expect(judged.citations).toHaveLength(SENTENCES.length);
    expect(judged.citations![5]).toEqual({ text: SENTENCES[5], refs: ['c1'] });
  });

  it('holds a sentence with no refs as uncited_sentence from the structure, not the splitter', async () => {
    const broken = [{ sentences: [{ text: SENTENCES[0]!, refs: [] }, ...PARAGRAPHS[0]!.sentences.slice(1)] }, PARAGRAPHS[1]!];
    const write = vi.fn(async (): Promise<WriterResult> => ({ status: 'ok', draft: attempt(broken) }));
    const judgeFn = vi.fn();
    const result = await composePost({ writer: store, judge: store, write, judgeFn }, INPUT);
    expect(result).toMatchObject({ status: 'hold', reason: 'writing_quality:uncited_sentence' });
    expect(write).toHaveBeenCalledTimes(2);
    expect(judgeFn).not.toHaveBeenCalled();
  });

  it('records the last invalid attempt and its reasons in the trace', async () => {
    const invalid = { ...attempt(), lead: 'Too short' };
    const write = vi.fn(async (): Promise<WriterResult> => ({
      status: 'invalid', reasons: ['lead is 9 characters; the minimum is 200'], attempt: invalid,
    }));
    const result = await composePost({ writer: store, judge: store, write, judgeFn: vi.fn() }, INPUT);
    expect(result).toMatchObject({ status: 'hold', reason: 'writing_quality:invalid_draft' });
    expect(result.trace).toMatchObject({
      lead: 'Too short', body: BODY, paragraphs: PARAGRAPHS, gateReasons: ['lead is 9 characters; the minimum is 200'],
    });
  });
  it('allows an outlet the facts are attributed to even when the legacy source has no name', async () => {
    const credited = [...SENTENCES];
    credited[0] = 'Variety reports the photos show Taylor outside Blackbird Studio in Nashville on Tuesday afternoon.';
    const paragraphs = [
      { sentences: credited.slice(0, 5).map((text, i) => ({ text, refs: refsFor(i) })) },
      PARAGRAPHS[1]!,
    ];
    const draft = { ...attempt(paragraphs), body: `${credited.slice(0, 5).join(' ')}

${SENTENCES.slice(5).join(' ')}` };
    const write = vi.fn(async (): Promise<WriterResult> => ({ status: 'ok', draft }));
    const judgeFn = vi.fn<(s: unknown, i: JudgeInput) => Promise<typeof PASS>>(async () => PASS);
    const input: ComposeInput = {
      ...INPUT,
      facts: [{ id: 'f1', claim: 'Taylor was photographed outside Blackbird Studio.', attribution: 'Variety', confidence: 'reported' }],
      sources: [{ outletName: '', url: 'https://news.yahoo.com/a' }],
    };
    const result = await composePost({ writer: store, judge: store, write, judgeFn }, input);
    expect(result.status).toBe('ok');
    expect(judgeFn.mock.calls[0]![1].attributions).toEqual(['Variety']);
  });
});
