// attribution_unknown_outlet: outlet-style attributions ("People reports",
// "per Variety") must name an outlet from the item's sources or facts.
// Threshold-free; the cases come from the Hemmingway smoke draft (2026-11-03).

import { describe, expect, it } from 'vitest';
import { allowedOutlets, unknownAttributions } from './current-item-attribution';
import { evaluateCurrentItemWriting } from './current-item-writing';

const EXAMPLE_TIMES = [{ name: 'Example Times', url: 'https://exampletimes.com/a' }];

describe('unknownAttributions', () => {
  it('flags an outlet that is not among the sources', () => {
    expect(unknownAttributions('People reports that the show sold out.', allowedOutlets(EXAMPLE_TIMES))).toEqual(['People']);
  });

  it('allows an outlet known only by its URL host', () => {
    const allowed = allowedOutlets([{ name: '', url: 'https://www.people.com/x' }]);
    expect(unknownAttributions('People reports that the show sold out.', allowed)).toEqual([]);
  });

  it('allows an outlet named in the fact attributions', () => {
    expect(unknownAttributions('Per The Ankler, the deal closed in May.', allowedOutlets([], ['The Ankler']))).toEqual([]);
    // the same sentence is flagged without the attribution, so the allow path is what clears it
    expect(unknownAttributions('Per The Ankler, the deal closed in May.', allowedOutlets([]))).toEqual(['The Ankler']);
  });

  it('tolerates a section word after an allowed outlet and a lowercase brand prefix', () => {
    expect(unknownAttributions('Yahoo Entertainment reports the show sold out.', allowedOutlets([], ['Yahoo']))).toEqual([]);
    expect(unknownAttributions('Per The Yahoo News, the show sold out.', allowedOutlets([], ['Yahoo']))).toEqual([]);
    expect(unknownAttributions('iHeart reports the show sold out.', allowedOutlets([], ['iHeart']))).toEqual([]);
    expect(unknownAttributions('iHeart reports the show sold out.', allowedOutlets([]))).toEqual(['iHeart']);
  });

  it('allows a name the fact claims spell out, and still flags one they do not', () => {
    const claims = ['Cosmopolitan cites a 2024 Page Six report about safety.', 'Stereogum published a retrospective by Tom Breihan.'];
    const allowed = allowedOutlets([], ['Cosmopolitan', 'Stereogum']);
    expect(unknownAttributions('Page Six reported the safety worry.', allowed, claims)).toEqual([]);
    expect(unknownAttributions('Tom Breihan wrote the retrospective.', allowed, claims)).toEqual([]);
    expect(unknownAttributions('Variety reported the safety worry.', allowed, claims)).toEqual(['Variety']);
  });

  it('does not treat "<Name> said" as an outlet attribution', () => {
    expect(unknownAttributions('Travis Kelce said the night was perfect.', allowedOutlets([]))).toEqual([]);
  });

  it('ignores lower-case generic attributions', () => {
    expect(unknownAttributions('The tour grew, according to fan accounts.', allowedOutlets([]))).toEqual([]);
  });

  it('allows an outlet known through outletLabel', () => {
    const allowed = allowedOutlets([{ url: 'https://www.eonline.com/news/1' }]);
    expect(unknownAttributions('E! News reported the date first.', allowed)).toEqual([]);
  });

  it('handles a sentence-initial "According to"', () => {
    const allowed = allowedOutlets([{ name: 'Billboard', url: 'https://billboard.com/x' }]);
    expect(unknownAttributions('According to Billboard, it debuted at No. 1.', allowed)).toEqual([]);
    expect(unknownAttributions('According to Variety, it debuted at No. 1.', allowed)).toEqual(['Variety']);
  });

  it('never flags pronouns or generic nouns', () => {
    expect(unknownAttributions('Fans reported long lines. It reported nothing new.', allowedOutlets([]))).toEqual([]);
  });

  it('returns unknown outlets in text order, once each', () => {
    const body = 'Variety wrote that the film opens in May. Per Deadline, it was moved. Per variety, it holds.';
    expect(unknownAttributions(body, allowedOutlets([]))).toEqual(['Variety', 'Deadline']);
  });

  it('strips a possessive and a sentence-final period', () => {
    expect(unknownAttributions("People's report ran first.", allowedOutlets(EXAMPLE_TIMES))).toEqual(['People']);
    expect(unknownAttributions('The date was confirmed, per People.com.', allowedOutlets(EXAMPLE_TIMES))).toEqual(['People.com']);
  });

  it('matches whole words only, so a short allowed name does not clear a longer one', () => {
    const allowed = allowedOutlets([{ url: 'https://www.etonline.com/x' }]); // label 'ET'
    expect(unknownAttributions('Variety reported the deal.', allowed)).toEqual(['Variety']);
    expect(unknownAttributions('ET reported the deal.', allowed)).toEqual([]);
  });
});

describe('allowedOutlets', () => {
  it('collects source names, URL host stems and fact attributions, lower-cased', () => {
    const allowed = allowedOutlets([{ name: 'Example Times', url: 'https://www.exampletimes.com/a' }], ['Fan Accounts']);
    expect(allowed).toEqual(expect.arrayContaining(['example times', 'exampletimes', 'fan accounts']));
  });

  it('de-duplicates and trims', () => {
    expect(allowedOutlets([{ name: '  People  ', url: 'https://people.com/x' }])).toEqual(['people']);
  });
});

describe('evaluateCurrentItemWriting', () => {
  it('reports attribution_unknown_outlet for an invented outlet', () => {
    const result = evaluateCurrentItemWriting(
      { headline: 'Show sells out', lead: 'x'.repeat(220), body: 'People reports that the show sold out.', sources: EXAMPLE_TIMES },
      { legacy: true },
    );
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.reasons).toContain('attribution_unknown_outlet');
  });

  it('does not report it when the outlet is a fact attribution', () => {
    const result = evaluateCurrentItemWriting(
      {
        headline: 'Show sells out',
        lead: 'x'.repeat(220),
        body: 'People reports that the show sold out.',
        sources: EXAMPLE_TIMES,
        factAttributions: ['People'],
      },
      { legacy: true },
    );
    expect(result.ok ? [] : result.reasons).not.toContain('attribution_unknown_outlet');
  });
});
