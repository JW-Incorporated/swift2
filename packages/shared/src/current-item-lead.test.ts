import { describe, expect, it } from 'vitest';
import {
  findLeadGush,
  hasFanAddressOpener,
  headlineAnchors,
  leadStyleReasons,
  leadWithholdsHeadline,
} from './current-item-lead';
import { splitSentences } from './current-item-writing';

const reasons = (headline: string, lead: string): string[] => leadStyleReasons(headline, splitSentences(lead));

// Real live-feed rows (https://www.longlivets.com/vault/live/tloas, 2026-11-18).
const LIVE_BAD = [
  {
    headline: 'Charity post shares a new photo of Taylor and Travis Kelce and says wedding guests were asked to donate instead of gifting',
    lead: "A small-town animal charity just posted a fresh snapshot of Taylor and Travis, and the caption carries a sweet detail about the wedding: what the couple asked their guests to do instead of showing up with presents. For fans still piecing the big day together, it's a lovely new piece.",
    expected: ['lead_for_fans_who_opener'],
  },
  {
    headline: "Taylor's 'Patient Zero' ties Rihanna for most Pop Airplay top 10s as it climbs to No. 10",
    lead: "A song that started its run at the very top has been taking the long road on pop radio, and its newest step lands it right where Taylor's record chase needed it. For fans who watched her sit one short of the all-time mark for months, this is the chart move they were refreshing for.",
    expected: ['lead_withholds_headline_news', 'lead_for_fans_who_opener'],
  },
  {
    headline: "Knicks guard Tyler Kolek reportedly walks back his 'fakest fan' jab at Taylor and sings 'Blank Space'",
    lead: "An offhand jab during a video-game stream is said to have put Taylor's Knicks loyalty on trial, and the follow-up sounds a lot more like a peace offering set to one of her own hits. For fans who remember her courtside in a pun tee, the turnaround is too good to ignore.",
    expected: ['lead_withholds_headline_news', 'lead_for_fans_who_opener', 'lead_gush:too good to ignore'],
  },
  {
    headline: 'Taylor and Travis Kelce wed at Madison Square Garden',
    lead: 'The arena that has hosted countless sold-out nights just held the most personal one of all. Taylor is married, her own team has made it official, and Swifties finally have an answer to the question they spent weeks asking about where and when it would happen.',
    expected: ['lead_withholds_headline_news'],
  },
  {
    headline: 'Taylor wore a strapless burgundy velvet micro minidress by Raisa Vanessa to the Nashville Songwriters Hall of Fame Gala',
    lead: 'A career-defining night in Nashville called for a look to match, and Taylor showed up in deep jewel tones and serious sparkle. For Swifties who track every red-carpet moment, the breakdown from the diamonds down to the sandals is half the fun, especially with one detail of the shoes still up for debate.',
    expected: ['lead_for_fans_who_opener', 'lead_gush:half the fun'],
  },
];

describe('leadStyleReasons on live leads', () => {
  it.each(LIVE_BAD)('flags $expected', ({ headline, lead, expected }) => {
    expect(reasons(headline, lead)).toEqual(expected);
  });

  it('passes a lead that states the news, then adds context', () => {
    const headline = "Taylor's 'Patient Zero' ties Rihanna for most Pop Airplay top 10s as it climbs to No. 10";
    const lead = "'Patient Zero' just became Taylor's record-tying Pop Airplay top 10, putting her level with Rihanna. The song had been climbing radio for months after opening at the top of the Hot 100.";
    expect(reasons(headline, lead)).toEqual([]);
  });
});

describe('leadWithholdsHeadline', () => {
  it('matches a number from the headline', () => {
    expect(leadWithholdsHeadline('Taylor ties a record with 100 weeks at No. 1', 'She has now spent 100 weeks on top.')).toBe(false);
  });

  it('matches names case-sensitively, so a common word does not count', () => {
    expect(leadWithholdsHeadline('Taylor climbs Pop Airplay', 'Her song keeps rising on pop radio.')).toBe(true);
  });

  it('matches across plural, possessive and hyphenated forms', () => {
    expect(leadWithholdsHeadline('Taylor up for Record of the Year in the 69th Grammy nominations', 'Taylor is back in the big Grammys races.')).toBe(false);
    expect(leadWithholdsHeadline("Taylor's show heads to Boston's Museum of Fine Arts", 'A Boston museum is building a whole show around her.')).toBe(false);
    expect(leadWithholdsHeadline('The Life of a Showgirl returns to No. 1', 'Taylor\'s Showgirl-era album is back on top.')).toBe(false);
  });

  it('never counts Taylor or Swift as the news', () => {
    expect(headlineAnchors('Taylor Swift shares a new photo')).toEqual(new Set());
    expect(leadWithholdsHeadline('Taylor Swift shares a new photo', 'A fresh picture landed this morning.')).toBe(false);
  });

  it('ignores the sentence-case first word of the headline', () => {
    expect(headlineAnchors('Fans spot Taylor at a game')).toEqual(new Set());
    expect(leadWithholdsHeadline('Fans spot Taylor at a game', 'Taylor was seen in the stands on Sunday.')).toBe(false);
  });

  it('checks only the first sentence', () => {
    expect(leadWithholdsHeadline('Taylor and Travis marry at Madison Square Garden', 'The arena just held its most personal night.')).toBe(true);
  });
});

describe('hasFanAddressOpener', () => {
  it.each([
    'For fans who remember her country years, this matters.',
    'For Swifties keeping score, the hold matters.',
    'For anyone who has followed this friendship, it lands.',
    'For Showgirl-era fans, it is a big night.',
    'For longtime fans, the callback is clear.',
  ])('flags %s', (sentence) => {
    expect(hasFanAddressOpener([sentence])).toBe(true);
  });

  it.each([
    'For the first time in 13 years, Taylor will play the CMAs.',
    'For her third act, Taylor went back to the piano.',
    'Fans who bought tickets will get refunds.',
    'Taylor thanked her fans for the record week.',
  ])('does not flag %s', (sentence) => {
    expect(hasFanAddressOpener([sentence])).toBe(false);
  });
});

describe('other lead rules', () => {
  it('finds gushing closers', () => {
    expect(findLeadGush('The look is worth a closer look.')).toEqual(['worth a closer look']);
    expect(findLeadGush('The dress was by Raisa Vanessa.')).toEqual([]);
  });

  it('flags an em dash and a question opener', () => {
    const headline = 'Taylor confirms the Eras Collection at the MFA';
    expect(reasons(headline, 'Is the Eras Collection coming? The MFA says yes.')).toEqual(['lead_question_opener']);
    expect(reasons(headline, 'The Eras Collection is coming to the MFA — in April.')).toEqual(['lead_em_dash']);
  });
});
