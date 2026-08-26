// Minimal OAuth 1.0a request-signing for X's v2 API, which still requires
// user-context OAuth1 (not OAuth2 app-only) to post as the account. No
// dependency pulled in for this — it's ~30 lines of HMAC-SHA1 per the spec.

import { createHmac, randomBytes } from 'node:crypto';

/** RFC 3986 percent-encoding — encodeURIComponent doesn't escape !*'(). */
function pct(s) {
  return encodeURIComponent(s).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Builds the `Authorization` header for a single OAuth1 request. `url` must
 * be the base URL with no query string — pass any GET query parameters via
 * `params` instead. Per the OAuth1 spec, query parameters (unlike a JSON
 * POST body, which is never part of the signature) ARE part of the signed
 * parameter set: omitting them here produces a signature X's API rejects
 * with 401 for any GET request that has query params (caught 2026-07-17
 * building the growth-snapshot follower-count fetch, which has none for
 * plain POSTs like /2/tweets — so this defaults to `{}` and stays a no-op
 * there).
 */
export function oauth1Header({ method, url, consumerKey, consumerSecret, token, tokenSecret, nonce, timestamp, params = {} }) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce ?? randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp ?? Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: '1.0',
  };
  const allParams = { ...oauthParams, ...params };

  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pct(k)}=${pct(allParams[k])}`)
    .join('&');
  const baseString = `${method.toUpperCase()}&${pct(url)}&${pct(paramString)}`;
  const signingKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

  const withSig = { ...oauthParams, oauth_signature: signature };
  return 'OAuth ' + Object.keys(withSig).sort().map((k) => `${pct(k)}="${pct(withSig[k])}"`).join(', ');
}
