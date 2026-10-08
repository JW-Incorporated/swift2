import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no types
import { tier, visibilityScore } from './visibility.mjs';

// A bare item with nothing that would score on its own: no latest-news era,
// no category weight, no marquee-hook title match.
const bareItem = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  era: 'debut',
  title: 'A routine sighting',
  texts: { snippet: 'nothing notable happens here' },
  ...over,
});

describe('visibilityScore / tier — significance override', () => {
  it('scores a bare item as normal tier', () => {
    expect(tier(bareItem())).toBe('normal');
  });

  it('routes a defining item to high tier even with no other signal', () => {
    const item = bareItem({ raw: { significance: 'defining' } });
    expect(tier(item)).toBe('high');
  });

  it('routes a notable item to high tier even with no other signal', () => {
    const item = bareItem({ raw: { significance: 'notable' } });
    expect(tier(item)).toBe('high');
  });

  it('does not bump score for an unmarked item', () => {
    const marked = bareItem({ raw: { significance: 'defining' } });
    const unmarked = bareItem({ raw: {} });
    expect(visibilityScore(marked)).toBeGreaterThan(visibilityScore(unmarked));
  });
});
