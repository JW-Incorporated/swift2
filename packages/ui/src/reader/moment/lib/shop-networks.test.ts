import { describe, expect, it } from 'vitest';
import { createNetworkResolver } from './shop-networks';

describe('createNetworkResolver', () => {
  it('prefers the generated Awin hostname map over all fallback networks', () => {
    const networkFor = createNetworkResolver({
      'etsy.com': '6220',
      'amazon.com': '9999',
    });

    expect(networkFor('etsy.com')).toEqual({ network: 'awin', awinmid: '6220' });
    expect(networkFor('amazon.com')).toEqual({ network: 'awin', awinmid: '9999' });
  });

  it('resolves Amazon only after the Awin map and leaves all other hosts uncovered', () => {
    const networkFor = createNetworkResolver({});

    expect(networkFor('amazon.com')).toEqual({ network: 'amazon' });
    expect(networkFor('store.taylorswift.com')).toEqual({ network: 'none' });
    expect(networkFor('tiny-boutique.example')).toEqual({ network: 'none' });
  });
});