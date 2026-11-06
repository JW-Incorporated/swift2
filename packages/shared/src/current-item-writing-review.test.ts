import { describe, expect, it } from 'vitest';
import {
  evaluateCurrentItemWriting,
  findAiTells,
  headlineLeadOverlap,
  outletMentionCounts,
  splitSentences,
  type WritingInput,
} from './current-item-writing';

const SOURCES = [{ name: 'Billboard', url: 'https://billboard.com/x' }];

const GOOD: WritingInput = {
  headline: "Taylor's Napoleon Dynamite bit is a friendship in-joke",
  lead:
    "Taylor told a Toy Story 5 crowd in New York that a Napoleon Dynamite voice is a running joke between her and her old friend Abigail Anderson, much to their husbands' patience. It is a small window into a friendship that started in a Tennessee classroom.",
  body:
    'The story came out at a Toy Story 5 Q&A in New York City on November 1. Taylor said the Napoleon Dynamite voice is something she and Abigail Anderson fall into constantly, and that their husbands have simply learned to live with it. The habit goes back to Hendersonville High School, where the two met in English class not long after Taylor moved to Nashville at 14. Fans may recognize Abigail from the music videos for "Picture to Burn" and "I\'m Only Me When I\'m With You." Taylor tied the bond to the Bonnie and Blaze storyline in the movie, which she said hit her hard. The room was mostly guild members and Critics Choice voters, and Taylor stuck around to meet more than 200 attendees. Worth watching: whether the Toy Story 5 press run brings more of these off-the-cuff stories from her.',
  sources: SOURCES,
};
const CITED = splitSentences(GOOD.body).map((_, i) => i);

function reasonsOf(input: WritingInput): string[] {
  const result = evaluateCurrentItemWriting({ citations: CITED, ...input });
  return result.ok ? [] : result.reasons;
}

const attribution = (extra: string): boolean =>
  reasonsOf({ ...GOOD, body: `${GOOD.body} ${extra}`, citations: undefined }).includes('attribution_repeat');

describe('review round 1', () => {
  it('baseline is clean', () => {
    expect(reasonsOf(GOOD)).toEqual([]);
  });

  it('counts only attribution forms for outlet repeats', () => {
    expect(attribution('Billboard reports the single debuted at No. 1 on the Billboard 200.')).toBe(false);
    expect(attribution('Per Billboard, the single moved. Billboard reported the chart.')).toBe(true);
    expect(attribution('Taylor told Billboard it was fun. In an interview with Billboard she laughed.')).toBe(true);
  });

  it('uses outletName when name is empty', () => {
    const counts = outletMentionCounts('Per Variety, x. Variety said so.', [{ name: '', outletName: 'Variety' }]);
    expect(counts.get('Variety')).toBe(2);
  });

  it('requires citations unless legacy', () => {
    const uncited: WritingInput = { ...GOOD };
    expect(evaluateCurrentItemWriting(uncited)).toEqual({ ok: false, reasons: ['citations_missing'] });
    expect(evaluateCurrentItemWriting(uncited, { legacy: true })).toEqual({ ok: true });
    expect(reasonsOf({ ...GOOD, citations: [0] })).toContain('too_many_voice_sentences');
    expect(evaluateCurrentItemWriting({ ...GOOD, citations: [0] }, { legacy: true })).toEqual({ ok: true });
  });

  it('splits sentences on curly quotes and respects abbreviations', () => {
    expect(splitSentences('He said it was done.” Next came the show.')).toEqual([
      'He said it was done.”',
      'Next came the show.',
    ]);
    expect(splitSentences('She said it was fine. ‘Next’ was the song.')).toHaveLength(2);
    expect(splitSentences('The album is out Oct. 3 in the U.S. Open fans can stream it.')).toHaveLength(1);
    expect(splitSentences('The doors opened at 7 p.m. and fans lined up.')).toHaveLength(1);
    expect(splitSentences('Fans asked if she said no. No one expected it.')).toHaveLength(2);
    expect(splitSentences('Many songs, e.g. the title track, appear in vol. 2 of the set.')).toHaveLength(1);
    expect(splitSentences('Dr. Smith spoke. Then Mr. Jones left.')).toHaveLength(2);
    expect(splitSentences('[c1] The tour starts. Y')).toEqual(['[c1] The tour starts.', 'Y']);
  });

  it('flags only stacked exclamations', () => {
    expect(findAiTells('Wow! Great! Fun!')).toEqual([]);
    expect(findAiTells('Wow!! Great.')).toEqual(['exclamation-stacked hype']);
    expect(findAiTells('Wow, great, really! so fun!')).toEqual(['exclamation-stacked hype']);
  });

  it('applies hedge and AI-tell checks to the headline', () => {
    expect(reasonsOf({ ...GOOD, headline: 'Taylor reportedly visits Nashville' })).not.toContain('hedge_overuse');
    expect(reasonsOf({ ...GOOD, headline: 'Taylor reportedly visits, per People, Nashville' })).toContain('hedge_overuse');
    expect(reasonsOf({ ...GOOD, headline: 'It seems Taylor likes Nashville' })).toContain('ai_tell:it seems');
  });

  it('dedupes possessive entities', () => {
    const body = "Fans noted it. Then Abigail's visit and Abigail’s call came up. Nothing else happened here.";
    expect(reasonsOf({ ...GOOD, body })).toContain('thin_substance');
  });

  it('skips headline overlap for short headlines', () => {
    expect(headlineLeadOverlap('Taylor Swift Returns', 'Taylor Swift Returns to the stage.')).toBe(0);
  });

  it('counts whitespace tokens for the body floor', () => {
    const body = Array.from({ length: 120 }, () => "don't").join(' ');
    expect(reasonsOf({ ...GOOD, body })).not.toContain('body_too_short');
    expect(reasonsOf({ ...GOOD, body: body.split(' ').slice(1).join(' ') })).toContain('body_too_short');
  });

  it('fails empty lead and body without throwing', () => {
    expect(reasonsOf({ ...GOOD, lead: '' })).toContain('lead_length');
    const empty = reasonsOf({ ...GOOD, body: '', citations: [] });
    expect(empty).toContain('body_too_short');
    expect(empty).toContain('thin_substance');
    expect(reasonsOf({ ...GOOD, headline: '', lead: '', body: '' })).toEqual(
      expect.arrayContaining(['lead_length', 'body_too_short']),
    );
  });
});
