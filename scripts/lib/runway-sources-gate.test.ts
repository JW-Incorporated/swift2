import { describe, expect, it } from 'vitest';
import { runwaySourceErrors } from './runway-sources-gate.mjs';

describe('runwaySourceErrors', () => {
  it('accepts valid sources', () => {
    expect(runwaySourceErrors([{ title: 'Vogue', url: 'https://www.vogue.com/x' }])).toEqual([]);
  });
  it('accepts absent sources', () => {
    expect(runwaySourceErrors(undefined)).toEqual([]);
  });
  it('errors on a missing or blank title', () => {
    expect(runwaySourceErrors([{ url: 'https://a.com/x' }])).toHaveLength(1);
    expect(runwaySourceErrors([{ title: '  ', url: 'https://a.com/x' }])).toHaveLength(1);
  });
  it('errors on a non-https url', () => {
    expect(runwaySourceErrors([{ title: 'A', url: 'http://a.com/x' }])).toHaveLength(1);
    expect(runwaySourceErrors([{ title: 'A' }])).toHaveLength(1);
  });
  it('errors when sources is not an array', () => {
    expect(runwaySourceErrors('https://a.com')).toHaveLength(1);
  });
});
