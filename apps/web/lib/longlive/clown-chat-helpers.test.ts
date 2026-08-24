import { describe, expect, it } from 'vitest';

import { nextSessionToken, withSessionHeader } from './clown-chat-helpers';

describe('withSessionHeader', () => {
  it('adds x-clown-session when a token is held', () => {
    const headers = withSessionHeader({ 'content-type': 'application/json' }, 'token-1');
    expect(headers).toEqual({ 'content-type': 'application/json', 'x-clown-session': 'token-1' });
  });

  it('leaves the headers untouched (no key at all) when no token is held yet', () => {
    const headers = withSessionHeader({ 'content-type': 'application/json' }, null);
    expect(headers).toEqual({ 'content-type': 'application/json' });
    expect('x-clown-session' in headers).toBe(false);
  });
});

describe('nextSessionToken', () => {
  it('adopts the response header value when the server returned one', () => {
    expect(nextSessionToken(null, 'token-1')).toBe('token-1');
    expect(nextSessionToken('token-1', 'token-2')).toBe('token-2');
  });

  it('keeps the previously held token when the response carried no header (toggle off, or an unaffected path)', () => {
    expect(nextSessionToken('token-1', null)).toBe('token-1');
    expect(nextSessionToken(null, null)).toBeNull();
  });
});
