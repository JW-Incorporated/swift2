import { describe, expect, it } from 'vitest';
import {
  findLeadGush,
  hasFanAddressOpener,
  headlineAnchorPhrases,
  headlineAnchors,
  isLeadStyleReason,
  leadRewriteInstruction,
  leadStyleReasons,
  leadWithholdsHeadline,
} from './current-item-lead';
import { splitSentences } from './current-item-writing';

const reasons = (headline: string, lead: string): string[] => leadStyleReasons(headline, splitSentences(lead));

// Real live-feed rows (https://www.longlivets.com/vault/live/tloas, 2026-11-18).
const H = {
  museum: "Boston's Museum of Fine Arts announces 'Taylor Swift: The Eras Collection', opening April 10, 2027",
  cma: 'Taylor reportedly set to perform at the CMA Awards for the first time in 13 years',
  travis: 'Travis Kelce says he wants to see what Taylor Swift could come up with for a New Heights podcast event',
  lansing: "Taylor to receive The Hollywood Reporter's Sherry Lansing Leadership Award at Women in Entertainment gala",
  charity: 'Charity post shares a new photo of Taylor and Travis Kelce and says wedding guests were asked to donate instead of gifting',
  kolek: "Knicks guard Tyler Kolek reportedly walks back his 'fakest fan' jab at Taylor and sings 'Blank Space'",
  airplay: "Taylor's 'Patient Zero' ties Rihanna for most Pop Airplay top 10s as it climbs to No. 10",
  dress: 'Taylor wore a strapless burgundy velvet micro minidress by Raisa Vanessa to the Nashville Songwriters Hall of Fame Gala',
  uk: "Billboard reports 'Patient Zero' has spent a second week at No. 1 on the U.K. chart",
  gala: 'Taylor Swift reported as closing the Academy Museum Gala in Los Angeles on Oct. 17',
  wed: 'Taylor and Travis Kelce wed at Madison Square Garden',
};

const LIVE_BAD = [
  {
    headline: H.charity,
    lead: "A small-town animal charity just posted a fresh snapshot of Taylor and Travis, and the caption carries a sweet detail about the wedding: what the couple asked their guests to do instead of showing up with presents. For fans still piecing the big day together, it's a lovely new piece.",
    expected: ['lead_for_fans_who_opener'],
  },
  {
    headline: H.airplay,
    lead: "A song that started its run at the very top has been taking the long road on pop radio, and its newest step lands it right where Taylor's record chase needed it. For fans who watched her sit one short of the all-time mark for months, this is the chart move they were refreshing for.",
    expected: ['lead_withholds_headline_news', 'lead_for_fans_who_opener'],
  },
  {
    headline: H.kolek,
    lead: "An offhand jab during a video-game stream is said to have put Taylor's Knicks loyalty on trial, and the follow-up sounds a lot more like a peace offering set to one of her own hits. For fans who remember her courtside in a pun tee, the turnaround is too good to ignore.",
    expected: ['lead_for_fans_who_opener', 'lead_gush:too good to ignore'],
  },
  {
    headline: H.wed,
    lead: 'The arena that has hosted countless sold-out nights just held the most personal one of all. Taylor is married, her own team has made it official, and Swifties finally have an answer to the question they spent weeks asking about where and when it would happen.',
    expected: ['lead_withholds_headline_news'],
  },
  {
    headline: H.dress,
    lead: 'A career-defining night in Nashville called for a look to match, and Taylor showed up in deep jewel tones and serious sparkle. For Swifties who track every red-carpet moment, the breakdown from the diamonds down to the sandals is half the fun, especially with one detail of the shoes still up for debate.',
    expected: ['lead_for_fans_who_opener', 'lead_gush:half the fun'],
  },
];

describe('leadStyleReasons on live leads', () => {
  it.each(LIVE_BAD)('flags $expected', ({ headline, lead, expected }) => {
    expect(reasons(headline, lead)).toEqual(expected);
  });

  it('passes a lead that states the news, then adds context', () => {
    const lead = "'Patient Zero' just became Taylor's record-tying Pop Airplay top 10, putting her level with Rihanna. The song had been climbing radio for months after opening at the top of the Hot 100.";
    expect(reasons(H.airplay, lead)).toEqual([]);
  });
});

describe('leadWithholdsHeadline', () => {
  // Honest plain-news first sentences written against live headlines (PR #6974 review).
  it.each([
    [H.museum, "A Boston museum will open an exhibit of Taylor's stage costumes and instruments next spring."],
    [H.travis, 'Travis says he would love to see what Taylor could dream up for a live event of his podcast.'],
    [H.cma, "Taylor is set to play country music's biggest awards night for the first time in thirteen years."],
    [H.airplay, "Taylor's newest single just climbed to tenth on the radio chart, matching an all-time mark."],
    [H.uk, "Taylor's newest single held the top spot in Britain for another week."],
    [H.gala, 'Taylor is said to be the closing act at a film gala in LA this month.'],
    [H.kolek, "A Knicks guard who called Taylor the 'fakest fan' is said to have walked it back with a song."],
  ])('passes a plain statement of the news: %s', (headline, first) => {
    expect(leadWithholdsHeadline(headline, first)).toBe(false);
  });

  it('fails a lead that matches only a generic word', () => {
    expect(leadWithholdsHeadline(H.lansing, 'Women in music have a new reason to cheer.')).toBe(true);
    expect(leadWithholdsHeadline('Taylor climbs Pop Airplay', 'Her song keeps rising on pop radio.')).toBe(true);
  });

  it('matches plural and possessive forms without stemming junk anchors', () => {
    expect(leadWithholdsHeadline('Taylor up for Record of the Year in the 69th Grammy nominations', 'Taylor is back in the big Grammys races.')).toBe(false);
    expect(headlineAnchors(H.travis)).toEqual(new Set(['travis', 'kelce', 'heights']));
    expect(headlineAnchors(H.gala)).toEqual(new Set(['academy', 'museum', 'losangeles', 'oct', '17']));
  });

  it('counts the first word unless it is generic, and never Taylor or Swift', () => {
    expect(headlineAnchors('Fans spot Taylor at a game')).toEqual(new Set());
    expect(headlineAnchors('Taylor Swift shares a new photo')).toEqual(new Set());
    expect(leadWithholdsHeadline('Taylor Swift shares a new photo', 'A fresh picture landed this morning.')).toBe(false);
  });

  it('checks only the first sentence', () => {
    expect(reasons(H.wed, 'The arena just held its most personal night. Taylor and Travis are married.')).toEqual(['lead_withholds_headline_news']);
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

  it('treats only the lead-style codes as soft', () => {
    expect(isLeadStyleReason('lead_withholds_headline_news')).toBe(true);
    expect(isLeadStyleReason('lead_gush:half the fun')).toBe(true);
    expect(isLeadStyleReason('lead_length')).toBe(false);
    expect(isLeadStyleReason('lead_body_overlap')).toBe(false);
  });
});

describe('leadRewriteInstruction', () => {
  it('names the headline words to state, as readers see them', () => {
    expect(headlineAnchorPhrases(H.airplay)).toEqual(['Patient Zero', 'Rihanna', 'Airplay', '10']);
    expect(headlineAnchorPhrases(H.gala)).toEqual(['Academy Museum', 'Los Angeles', 'Oct', '17']);
    expect(leadRewriteInstruction('lead_withholds_headline_news', H.wed)).toContain('Travis Kelce, Madison Square Garden');
  });

  it('explains every other lead-style reason and leaves the rest alone', () => {
    expect(leadRewriteInstruction('lead_gush:half the fun', H.dress)).toContain('"half the fun"');
    expect(leadRewriteInstruction('lead_for_fans_who_opener', H.dress)).toContain('For fans who');
    expect(leadRewriteInstruction('lead_em_dash', H.dress)).toContain('em dash');
    expect(leadRewriteInstruction('lead_question_opener', H.dress)).toContain('question');
    expect(leadRewriteInstruction('lead_length', H.dress)).toBeUndefined();
  });
});
