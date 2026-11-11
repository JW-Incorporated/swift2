import { describe, expect, it } from 'vitest';
import {
  countHedges,
  evaluateCurrentItemWriting,
  findAiTells,
  headlineLeadOverlap,
  outletMentionCounts,
  splitSentences,
  type WritingInput,
} from './current-item-writing';

const SOURCES = [
  { name: 'People', url: 'https://people.com/x' },
  { name: 'The Ankler', url: 'https://theankler.com/y' },
];

const BAD: WritingInput = {
  headline:
    'Taylor describes a playful habit she shares with friend Abigail Anderson that their husbands put up with',
  lead:
    'According to a People report, Taylor reportedly described a quirky Napoleon Dynamite voice habit she shares with close friend Abigail Anderson, which their husbands have to put up with. Per The Ankler, the November 1 Toy Story 5 Q&A in New York City drew mostly guild members and Critics Choice voters, and Taylor reportedly stayed to meet more than 200 attendees.',
  body:
    "According to a People.com report, Taylor shared the Napoleon Dynamite story at a Toy Story 5 Q&A in New York City on November 1. The bit grew out of her friendship with Abigail Anderson (Berard), whom she reportedly met in English class at Hendersonville High School after moving to Nashville at 14. Anderson has appeared in music videos for 'Picture to Burn' and 'I'm Only Me When I'm With You'. Taylor linked the bond to the Bonnie and Blaze storyline in Napoleon Dynamite, which she said hit her hard. Per The Ankler, the crowd was mostly guild members and Critics Choice voters, and Taylor reportedly stayed to meet more than 200 attendees.",
  sources: SOURCES,
};

const citeAll = (body: string): number[] => splitSentences(body).map((_, i) => i);

const GOOD: WritingInput = {
  headline: "Taylor's Napoleon Dynamite bit is a friendship in-joke",
  lead:
    "Taylor told a Toy Story 5 crowd in New York that a Napoleon Dynamite voice is a running joke between her and her old friend Abigail Anderson, much to their husbands' patience. It is a small window into a friendship that started in a Tennessee classroom.",
  body:
    'The story came out at a Toy Story 5 Q&A in New York City on November 1, according to People. Taylor said the Napoleon Dynamite voice is something she and Abigail Anderson fall into constantly, and that their husbands have simply learned to live with it. The habit goes back to Hendersonville High School, where the two met in English class not long after Taylor moved to Nashville at 14. Fans may recognize Abigail from the music videos for "Picture to Burn" and "I\'m Only Me When I\'m With You." Taylor tied the bond to the Bonnie and Blaze storyline in the movie, which she said hit her hard. The Ankler adds that the room was mostly guild members and Critics Choice voters, and that Taylor stuck around to meet more than 200 attendees. Worth watching: whether the Toy Story 5 press run brings more of these off-the-cuff stories from her.',
  sources: SOURCES,
};
GOOD.citations = citeAll(GOOD.body);

function reasonsOf(input: WritingInput): string[] {
  const result = evaluateCurrentItemWriting(input);
  return result.ok ? [] : result.reasons;
}

describe('evaluateCurrentItemWriting', () => {
  it('fails the bad live example', () => {
    const reasons = reasonsOf(BAD);
    expect(reasons).toContain('hedge_overuse');
    expect(reasons).toContain('lead_body_overlap');
  });

  it('passes the hand-written good example', () => {
    expect(evaluateCurrentItemWriting(GOOD)).toEqual({ ok: true });
  });

  const cases: [string, Partial<WritingInput>, string][] = [
    ['hedges in lead', { lead: GOOD.lead.replace('told', 'reportedly told') }, 'hedge_overuse'],
    [
      'hedges in body',
      { body: `${GOOD.body} Reportedly more is coming, allegedly soon, rumored too.` },
      'hedge_overuse',
    ],
    ['lead copied into body', { body: `${GOOD.lead} ${GOOD.body}` }, 'lead_body_overlap'],
    [
      'repeated body sentence',
      { body: `${GOOD.body} Taylor tied the bond to the Bonnie and Blaze storyline in the movie, which she said hit her hard.` },
      'body_self_repeat',
    ],
    [
      'headline restates lead',
      { headline: 'Taylor told a Toy Story 5 crowd in New York' },
      'headline_lead_overlap',
    ],
    ['ai tell', { body: `In this article we look back. ${GOOD.body}` }, 'ai_tell:in this article'],
    ['exclamation stack', { body: `${GOOD.body} Wow!! Amazing!` }, 'ai_tell:exclamation-stacked hype'],
    ['outlet repeated', { body: `${GOOD.body} Per People, the bit is old.` }, 'attribution_repeat'],
    ['short body', { body: 'Taylor spoke in New York on November 1.' }, 'body_too_short'],
    ['short lead', { lead: 'Taylor spoke.' }, 'lead_length'],
    ['long lead', { lead: 'x'.repeat(401) }, 'lead_length'],
    [
      'thin body',
      { body: `${'some plain words here and there. '.repeat(30)}` },
      'thin_substance',
    ],
    ['too many voice sentences', { citations: [0, 1, 2] }, 'too_many_voice_sentences'],
  ];

  it.each(cases)('%s', (_label, override, reason) => {
    expect(reasonsOf({ ...GOOD, ...override })).toContain(reason);
  });

  it('accepts full citations', () => {
    const sentences = splitSentences(GOOD.body).length;
    const result = evaluateCurrentItemWriting({
      ...GOOD,
      bodySentenceCount: sentences,
      citations: Array.from({ length: sentences }, (_, i) => i),
    });
    expect(result).toEqual({ ok: true });
  });

  it('checks structured per-sentence refs instead of splitter indexes', () => {
    const refs = splitSentences(GOOD.body).map(() => ['f1']);
    expect(evaluateCurrentItemWriting({ ...GOOD, citations: undefined, sentenceRefs: refs })).toEqual({ ok: true });
    expect(reasonsOf({ ...GOOD, citations: undefined, sentenceRefs: [...refs.slice(1), []] })).toContain('voice_sentence_has_fact');
    expect(reasonsOf({ ...GOOD, citations: undefined, sentenceRefs: [] })).toContain('uncited_sentence');
  });

  it('lets sentenceRefs take precedence over legacy citations', () => {
    const refs = splitSentences(GOOD.body).map(() => ['f1']);
    expect(evaluateCurrentItemWriting({ ...GOOD, citations: [0], sentenceRefs: refs })).toEqual({ ok: true });
  });
});

describe('writing helpers', () => {
  it('counts hedges across the family', () => {
    expect(countHedges('Reportedly, per People, it is said she allegedly left.')).toBe(4);
    expect(countHedges('Two per cent more per week.')).toBe(0);
  });

  it('matches only the cut-list phrases', () => {
    expect(findAiTells('It seems fine.')).toEqual(['it seems']);
    expect(findAiTells('She seems fine.')).toEqual([]);
  });

  it('counts outlet mentions by name or host once each', () => {
    const counts = outletMentionCounts('Per People, it is true. People reported more, said People.', SOURCES);
    expect(counts.get('People')).toBe(2);
  });

  it('scores headline overlap on content tokens', () => {
    expect(headlineLeadOverlap('Taylor visits Nashville tonight', 'Taylor visits Nashville tonight.')).toBe(1);
    expect(headlineLeadOverlap('Taylor visits Nashville tonight', 'A quiet evening.')).toBe(0);
  });
});

