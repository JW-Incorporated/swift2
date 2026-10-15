// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { baseMomentId, claimMomentId, momentIds } from './moment-ids.mjs';

describe('moment ids', () => {
  it('maps an era slug to its era id and slugifies the title', () => {
    expect(baseMomentId('the-life-of-a-showgirl', 'Defining Thing')).toBe('vault-tloas-defining-thing');
    expect(baseMomentId('lover', 'Same Title')).toBe('vault-lover-same-title');
  });
  it('suffixes collisions -2, -3 in order', () => {
    const seen = new Set<string>();
    expect(['A', 'a', 'A!'].map((t) => claimMomentId(baseMomentId('lover', t), seen))).toEqual(['vault-lover-a', 'vault-lover-a-2', 'vault-lover-a-3']);
  });
  it('momentIds numbers duplicates within one era list', () => {
    expect(momentIds('lover', [{ title: 'Same Title' }, { title: 'Same title' }])).toEqual(['vault-lover-same-title', 'vault-lover-same-title-2']);
    expect(momentIds('lover', undefined)).toEqual([]);
  });
});
