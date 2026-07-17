import { describe, expect, it } from 'vitest';
import { oauth1Header } from './oauth1.mjs';

describe('oauth1Header', () => {
  const base = {
    method: 'POST',
    url: 'https://api.twitter.com/2/tweets',
    consumerKey: 'ck',
    consumerSecret: 'cs',
    token: 'tok',
    tokenSecret: 'toksec',
    nonce: 'fixednonce',
    timestamp: '1700000000',
  };

  it('produces a deterministic signature for fixed nonce/timestamp', () => {
    const header = oauth1Header(base);
    expect(header).toBe(
      'OAuth oauth_consumer_key="ck", oauth_nonce="fixednonce", oauth_signature="oBmArsyrCaHzIikxpCfawaZFWfU%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1700000000", oauth_token="tok", oauth_version="1.0"',
    );
  });

  it('changes signature when the URL changes', () => {
    const h1 = oauth1Header(base);
    const h2 = oauth1Header({ ...base, url: 'https://api.twitter.com/2/other' });
    expect(h1).not.toBe(h2);
  });

  it('changes signature when the token secret changes', () => {
    const h1 = oauth1Header(base);
    const h2 = oauth1Header({ ...base, tokenSecret: 'different' });
    expect(h1).not.toBe(h2);
  });
});
