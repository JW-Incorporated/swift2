import { describe, expect, it } from 'vitest';

import { trustedClientIp } from './client-ip';

const requestWith = (headers: Record<string, string>) =>
  new Request('http://localhost/test', { headers });

describe('trustedClientIp', () => {
  it('prefers Vercel-provided x-real-ip over a client-supplied forwarded chain', () => {
    expect(
      trustedClientIp(
        requestWith({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '6.6.6.6, 8.8.8.8' }),
      ),
    ).toBe('9.9.9.9');
  });

  it('uses the trusted edge-appended rightmost forwarded hop as fallback', () => {
    expect(trustedClientIp(requestWith({ 'x-forwarded-for': '6.6.6.6, 9.9.9.9' }))).toBe(
      '9.9.9.9',
    );
  });

  it('uses one shared fallback bucket when no platform IP header exists', () => {
    expect(trustedClientIp(requestWith({}))).toBe('unknown');
  });
});
