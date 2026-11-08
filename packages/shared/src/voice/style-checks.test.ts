import { describe, expect, it } from 'vitest';
import {
  aiTellHits,
  emDashCount,
  hasContrastFrame,
  hasTagAFriendCta,
  isQuestionLead,
  ngramOverlap,
  questionLeadShare,
} from './style-checks';

describe('emDashCount', () => {
  it('counts em dashes only', () => {
    expect(emDashCount('a — b — c, d-e, f–g')).toBe(2);
    expect(emDashCount('none here')).toBe(0);
  });
});

describe('hasContrastFrame', () => {
  it.each([
    "This isn't a comeback, it's a coronation.",
    "It isn't about the money — it's about the music.",
    "It's not a rumor — it's a confirmed date.",
    'Not just a single, an entire era.',
  ])('flags %s', (text) => {
    expect(hasContrastFrame(text)).toBe(true);
  });

  it.each([
    'The album drops Friday and the tour follows in spring.',
    "She isn't commenting on the report.",
    'Not everyone agrees.',
  ])('passes %s', (text) => {
    expect(hasContrastFrame(text)).toBe(false);
  });
});

describe('hasTagAFriendCta', () => {
  it.each(['Tag a friend who needs this!', 'tag your bestie below', 'Share this with a friend'])(
    'flags %s',
    (text) => expect(hasTagAFriendCta(text)).toBe(true),
  );

  it('passes ordinary copy', () => {
    expect(hasTagAFriendCta('Her friend tagged along to the show.')).toBe(false);
  });
});

describe('question lead', () => {
  it('detects a first-sentence question', () => {
    expect(isQuestionLead('Ready for Friday? The album drops.')).toBe(true);
    expect(isQuestionLead('  Why now?')).toBe(true);
    expect(isQuestionLead('The album drops. Ready?')).toBe(false);
    expect(isQuestionLead('')).toBe(false);
  });

  it('computes the share over non-empty texts', () => {
    expect(questionLeadShare(['Why?', 'Because.', '', 'Who?', 'Done.'])).toBe(0.5);
    expect(questionLeadShare([])).toBe(0);
  });
});

describe('ngramOverlap', () => {
  const corpus = ['the album drops friday at midnight eastern time', 'unrelated words about something else entirely'];

  it('returns the max containment across the corpus', () => {
    expect(ngramOverlap('the album drops friday at midnight', corpus)).toBe(1);
    expect(ngramOverlap('the album drops friday at noon', corpus)).toBeCloseTo(2 / 3);
  });

  it('is zero for no overlap, short text or an empty corpus', () => {
    expect(ngramOverlap('completely different sentence structure here', corpus)).toBe(0);
    expect(ngramOverlap('too short', corpus)).toBe(0);
    expect(ngramOverlap('the album drops friday at midnight', [])).toBe(0);
  });

  it('honours a custom n', () => {
    expect(ngramOverlap('album drops', corpus, 2)).toBe(1);
  });
});

describe('aiTellHits', () => {
  it('returns the core phrases on the voice surface', () => {
    expect(aiTellHits('In this article, it seems we will explore.', 'voice')).toEqual([
      'in this article',
      'it seems',
      'we will explore',
    ]);
    expect(aiTellHits('Big news!! Huge!!', 'voice')).toEqual([]);
  });

  it('adds the news extra on the news surface', () => {
    expect(aiTellHits('Big news!!', 'news')).toEqual(['exclamation-stacked hype']);
  });

  it('uses only the community list on the community surface', () => {
    expect(aiTellHits('Great question — wow', 'community')).toHaveLength(1);
    expect(aiTellHits('In this article', 'community')).toEqual([]);
    expect(aiTellHits('She will delve into it', 'community')).toHaveLength(1);
  });
});
