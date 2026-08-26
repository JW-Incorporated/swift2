import { describe, expect, it } from 'vitest';
import { classifyByKeywords } from './rule-based';

describe('classifyByKeywords', () => {
  it('classifies a fashion-shaped headline', () => {
    const result = classifyByKeywords(
      'Taylor Swift wore a pink gown at the wedding',
      'She wore a floral dress.',
    );
    expect(result.category).toBe('fashion');
    expect(result.importance).toBe(5);
  });

  it('classifies a tour-shaped headline', () => {
    const result = classifyByKeywords('Eras Tour surprise song shocks stadium crowd', '');
    expect(result.category).toBe('tour');
  });

  it('falls back to sighting with a flat importance when nothing matches', () => {
    const result = classifyByKeywords('An entirely unrelated headline about nothing', '');
    expect(result.category).toBe('sighting');
    expect(result.importance).toBe(3);
  });

  it('truncates headline/summary to the schema length limits', () => {
    const longTitle = 'x'.repeat(200);
    const longSnippet = 'y'.repeat(500);
    const result = classifyByKeywords(longTitle, longSnippet);
    expect(result.headline.length).toBe(100);
    expect(result.summary.length).toBe(300);
  });

  it('uses the title as the summary when no snippet exists', () => {
    const result = classifyByKeywords('A short headline', '');
    expect(result.summary).toBe('A short headline');
  });
});
