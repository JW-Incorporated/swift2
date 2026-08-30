import { describe, expect, it } from 'vitest';
import { revalidate } from './page';

describe('home page metadata freshness', () => {
  it('renders Product JSON-LD dynamically so offer freshness is evaluated per request', () => {
    expect(revalidate).toBe(0);
  });
});
