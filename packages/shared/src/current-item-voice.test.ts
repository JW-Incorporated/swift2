import { describe, expect, it } from 'vitest';
import { evaluateCurrentItemWriting, splitSentences } from './current-item-writing';
import { MAX_VOICE_SENTENCES, voiceCitationReasons, voiceSentenceHasFact } from './current-item-voice';

const FIRST = [
  'The story came out at a Toy Story event in New York City, according to People.',
  'Taylor said the Napoleon Dynamite voice is something she and Abigail Anderson fall into constantly, and that their husbands have simply learned to live with it.',
  'The habit goes back to Hendersonville High School, where the two met in English class not long after Taylor moved to Nashville.',
  'Fans may recognize Abigail from the music videos for Picture to Burn and Im Only Me When Im With You.',
];
const SECOND = [
  'Taylor tied the bond to the Bonnie and Blaze storyline in the movie, which she said hit her hard.',
  'The room was mostly guild members and Critics Choice voters, and Taylor stuck around to meet the attendees.',
  'Abigail has stayed close to Taylor through every era since those classroom days.',
];
const VOICE = ["Honestly, this is the most Taylor thing she's done all year.", 'Swifties will be replaying this one for a while.', 'What a delightful little story.'];

const HEADLINE = "Taylor's Napoleon Dynamite bit is a friendship in-joke";
const LEAD =
  "Taylor told a Toy Story crowd in New York that a Napoleon Dynamite voice is a running joke between her and her old friend Abigail Anderson, much to their husbands' patience. It is a small window into a friendship that started in a Tennessee classroom.";
const SOURCES = [{ name: 'People', url: 'https://people.com/x' }];

type Layout = { text: string; cited: boolean }[][];
function run(layout: Layout) {
  const body = layout.map((p) => p.map((s) => s.text).join(' ')).join('\n\n');
  const sentenceRefs = layout.flat().map((s) => (s.cited ? ['f1'] : []));
  const result = evaluateCurrentItemWriting({ headline: HEADLINE, lead: LEAD, body, sources: SOURCES, sentenceRefs });
  return result.ok ? [] : result.reasons;
}
const cited = (texts: string[]) => texts.map((text) => ({ text, cited: true }));
const voice = (text: string) => ({ text, cited: false });

describe('fan-voice sentences in the gate', () => {
  it('names the cap', () => {
    expect(MAX_VOICE_SENTENCES).toBe(2);
  });

  it('accepts a post with up to two empty-refs voice lines', () => {
    expect(run([[...cited(FIRST), voice(VOICE[0]!)], cited(SECOND)])).toEqual([]);
    expect(run([[...cited(FIRST), voice(VOICE[0]!)], [...cited(SECOND), voice(VOICE[1]!)]])).toEqual([]);
  });

  it('no longer fails an empty-refs sentence as uncited_sentence', () => {
    expect(run([[...cited(FIRST), voice(VOICE[2]!)], cited(SECOND)])).not.toContain('uncited_sentence');
  });

  it('fails too_many_voice_sentences above the cap', () => {
    const layout = [[...cited(FIRST), voice(VOICE[0]!), voice(VOICE[1]!)], [...cited(SECOND), voice(VOICE[2]!)]];
    expect(run(layout)).toContain('too_many_voice_sentences');
  });

  it('fails a paragraph with no cited sentence as uncited_sentence', () => {
    expect(run([cited(FIRST), [voice(VOICE[0]!)]])).toContain('uncited_sentence');
  });

  it.each([
    ['a digit', 'Honestly, that was her 5th big night.'],
    ['a month', 'Honestly, October was a very Taylor month.'],
    ['a year', 'Honestly, nothing beats the vibe of this era since twenty twenty, or 2019.'],
    ['a quoted span', 'Honestly, "Cruel Summer" energy all over again.'],
    ['an outlet credit', 'Honestly, per Billboard this is peak Taylor.'],
  ])('fails voice_sentence_has_fact for %s', (_label, text) => {
    expect(run([[...cited(FIRST), voice(text)], cited(SECOND)])).toContain('voice_sentence_has_fact');
  });

  it('applies the same rules on the legacy citations index path', () => {
    const body = [...FIRST, ...SECOND].join(' ');
    const result = evaluateCurrentItemWriting({ headline: HEADLINE, lead: LEAD, body, sources: SOURCES, citations: [0, 1, 2, 3, 4] });
    expect(result).toEqual({ ok: true });
  });

  it('still reports citations_missing when no citation data is given', () => {
    const body = [...FIRST, ...SECOND].join(' ');
    expect(evaluateCurrentItemWriting({ headline: HEADLINE, lead: LEAD, body, sources: SOURCES })).toMatchObject({ reasons: ['citations_missing'] });
  });
});

describe('voice helpers', () => {
  it('passes plain fan reactions', () => {
    for (const line of VOICE) expect(voiceSentenceHasFact(line)).toBe(false);
  });

  it('flags a bare attribution form', () => {
    expect(voiceSentenceHasFact('According to Variety, it is lovely.')).toBe(true);
  });

  it('treats a single paragraph body as one paragraph when sentence counts misalign', () => {
    const body = [...FIRST, ...SECOND].join(' ');
    expect(voiceCitationReasons(body, [true, true], splitSentences)).toEqual([]);
  });
});
