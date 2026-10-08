import { describe, expect, it } from 'vitest';
import { formatEraCount } from './EraSpine';

// A zero count means "nothing catalogued", not a real measurement — same
// honesty rule as the Community page's null member counts (never "0", never
// invented, never rounded).
describe('formatEraCount', () => {
  it('renders a zero count as an em-dash, never "0"', () => {
    expect(formatEraCount(0)).toBe('—');
  });

  it('renders real counts as given, without inventing or rounding', () => {
    expect(formatEraCount(1)).toBe('1');
    expect(formatEraCount(24)).toBe('24');
    expect(formatEraCount(156)).toBe('156');
  });
});
