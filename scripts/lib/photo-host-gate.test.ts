import { describe, expect, it } from 'vitest';
import { CONFIG } from '../content-engine/config.mjs';
import { PHOTO_HOST_LEGACY, hostOf } from './photo-host-gate.mjs';

// --- the ratchet, asserted -------------------------------------------------
// Same idea as scripts/lib/sourcing-gate.test.ts's ceiling tests: the list is
// only worth anything if it can shrink and never grow. This is the size the
// day the gate went up (2026-08-24, issue #1968). Adding an entry to make a
// build green makes this FAIL — that's the point.
const PHOTO_HOST_LEGACY_CEILING = 93;

describe('PHOTO_HOST_LEGACY only ever shrinks', () => {
  it(`never exceeds its ${PHOTO_HOST_LEGACY_CEILING}-entry ceiling`, () => {
    expect(PHOTO_HOST_LEGACY.size).toBeLessThanOrEqual(PHOTO_HOST_LEGACY_CEILING);
  });

  it('carries no host already on CONFIG.hostAllowlist (that would be dead weight)', () => {
    for (const host of PHOTO_HOST_LEGACY) {
      expect(CONFIG.hostAllowlist.includes(host), host).toBe(false);
    }
  });

  it('every entry is a bare lowercase hostname, not a URL', () => {
    for (const host of PHOTO_HOST_LEGACY) {
      expect(host, host).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
      expect(host).toBe(host.toLowerCase());
    }
  });
});

describe('hostOf', () => {
  it('extracts a lowercase hostname from a URL', () => {
    expect(hostOf('https://Upload.Wikimedia.org/foo.png')).toBe('upload.wikimedia.org');
  });

  it('returns null for an unparseable URL', () => {
    expect(hostOf('not a url')).toBeNull();
  });
});
