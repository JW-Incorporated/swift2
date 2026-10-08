import { describe, expect, it } from 'vitest';
import { resolveTarget } from './capture-targets.mjs';

describe('resolveTarget', () => {
  it('builds a lens deep link', () => {
    expect(resolveTarget({ lens: 'the-proposal' })).toEqual({
      path: '/?lens=the-proposal',
      readiness: 'lens',
    });
  });

  it('builds an era deep link', () => {
    expect(resolveTarget({ era: 'midnights' })).toEqual({
      path: '/?era=midnights',
      readiness: 'era',
    });
  });

  it('builds an item deep link', () => {
    expect(resolveTarget({ item: 'vault-foo-bar' })).toEqual({
      path: '/?item=vault-foo-bar',
      readiness: 'item',
    });
  });

  it('URL-encodes ids', () => {
    expect(resolveTarget({ era: 'weird id' })).toEqual({
      path: '/?era=weird%20id',
      readiness: 'era',
    });
  });

  it('routes --mood to the landing page with mood readiness (no deep link exists for it)', () => {
    expect(resolveTarget({ mood: true })).toEqual({ path: '/', readiness: 'mood' });
  });

  it('passes --url through verbatim as the escape hatch', () => {
    expect(resolveTarget({ url: '/?era=lover' })).toEqual({
      path: '/?era=lover',
      readiness: 'none',
    });
  });

  it('rejects zero targets', () => {
    expect(() => resolveTarget({})).toThrow(/exactly one/);
  });

  it('rejects more than one target', () => {
    expect(() => resolveTarget({ lens: 'love-story', era: 'red' })).toThrow(/exactly one/);
  });
});
