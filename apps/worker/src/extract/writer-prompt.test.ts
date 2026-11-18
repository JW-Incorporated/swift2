import { describe, expect, it } from 'vitest';
import { countHedges, headlineLeadOverlap, leadStyleReasons, splitSentences, WRITING_THRESHOLDS } from '@swift2/shared';
import { LEAD_EXAMPLES, WRITER_SYSTEM_PROMPT } from './writer-prompt';

describe('LEAD_EXAMPLES', () => {
  it.each(LEAD_EXAMPLES)('good lead passes the lead gate: $headline', ({ headline, good }) => {
    expect(leadStyleReasons(headline, splitSentences(good))).toEqual([]);
    expect(headlineLeadOverlap(headline, good)).toBeLessThan(WRITING_THRESHOLDS.headlineLeadOverlapMax);
    expect(countHedges(good)).toBe(0);
    expect(good.length).toBeGreaterThanOrEqual(WRITING_THRESHOLDS.leadMinChars);
    expect(good.length).toBeLessThanOrEqual(WRITING_THRESHOLDS.leadMaxChars);
  });

  it.each(LEAD_EXAMPLES)('bad lead fails the lead gate: $headline', ({ headline, bad }) => {
    expect(leadStyleReasons(headline, splitSentences(bad)).length).toBeGreaterThan(0);
  });

  it('renders every example into the prompt and drops the teaser rule', () => {
    for (const { good } of LEAD_EXAMPLES) expect(WRITER_SYSTEM_PROMPT).toContain(good);
    expect(WRITER_SYSTEM_PROMPT).not.toMatch(/lead is a teaser|names NO specifics/);
  });
});
