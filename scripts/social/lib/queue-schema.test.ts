import { describe, expect, it } from 'vitest';
import { validateQueueItem, PLATFORM_RULES } from './queue-schema.mjs';

const validX = { platform: 'x', body: 'a real tweet', scheduledAt: '2026-08-12T23:00:00Z' };
const validIg = { platform: 'instagram', body: 'a real caption', media: ['/eras/red.png'], scheduledAt: '2026-08-12T23:00:00Z' };

const findingFor = (item: unknown, needle: string | RegExp) =>
  validateQueueItem(item).find((f) => (typeof needle === 'string' ? f.includes(needle) : needle.test(f)));

describe('validateQueueItem', () => {
  it('accepts the two real shapes the queue actually uses', () => {
    expect(validateQueueItem(validX)).toEqual([]);
    expect(validateQueueItem(validIg)).toEqual([]);
    expect(validateQueueItem({ ...validIg, campaign: 'c', why: 'w', approvedBy: 'joey', approvedAt: '2026-08-01T00:00:00Z' })).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateQueueItem(null)).toEqual(['not a JSON object']);
    expect(validateQueueItem([validX])).toEqual(['not a JSON object']);
  });

  it('rejects an unknown platform', () => {
    expect(findingFor({ ...validX, platform: 'twitter' }, 'platform:')).toBeDefined();
    expect(findingFor({ ...validX, platform: undefined }, 'platform:')).toBeDefined();
  });

  describe('body length', () => {
    // The regression that mattered: every X item in social/failed/ was over
    // 280 chars and every one that posted was under it.
    it("rejects an X body over X's 280-character limit", () => {
      const finding = findingFor({ ...validX, body: 'x'.repeat(281) }, 'body:');
      expect(finding).toContain('281 characters exceeds');
      expect(finding).toContain('403');
    });

    it('accepts an X body exactly at the limit', () => {
      expect(validateQueueItem({ ...validX, body: 'x'.repeat(280) })).toEqual([]);
    });

    it('reproduces the real failed/posted split at 280', () => {
      const posted = [84, 219, 246, 247, 260, 268, 270, 271, 272, 272, 274, 275, 276];
      const failed = [294, 302, 310, 321, 322, 338, 341, 342, 352, 358, 373];
      for (const n of posted) expect(validateQueueItem({ ...validX, body: 'x'.repeat(n) })).toEqual([]);
      for (const n of failed) expect(findingFor({ ...validX, body: 'x'.repeat(n) }, 'body:')).toBeDefined();
    });

    it('allows Instagram captions far past X’s limit but not past 2200', () => {
      expect(validateQueueItem({ ...validIg, body: 'x'.repeat(2200) })).toEqual([]);
      expect(findingFor({ ...validIg, body: 'x'.repeat(2201) }, 'body:')).toBeDefined();
    });

    it('rejects an empty or missing body', () => {
      expect(findingFor({ ...validX, body: '   ' }, 'body:')).toBeDefined();
      expect(findingFor({ platform: 'x', scheduledAt: validX.scheduledAt }, 'body:')).toBeDefined();
    });
  });

  describe('scheduledAt', () => {
    it('requires a parseable ISO instant with a timezone', () => {
      expect(findingFor({ ...validX, scheduledAt: '2026-08-12' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: '2026-08-12T23:00:00' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: 'tomorrow' }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: undefined }, 'scheduledAt:')).toBeDefined();
      expect(findingFor({ ...validX, scheduledAt: '2026-13-45T99:00:00Z' }, 'scheduledAt:')).toBeDefined();
    });

    it('accepts offsets and fractional seconds (what social/posted/ already contains)', () => {
      expect(validateQueueItem({ ...validX, scheduledAt: '2026-08-12T23:00:00.123Z' })).toEqual([]);
      expect(validateQueueItem({ ...validX, scheduledAt: '2026-08-12T19:00:00-04:00' })).toEqual([]);
    });
  });

  describe('media', () => {
    it('requires media on Instagram', () => {
      expect(findingFor({ ...validIg, media: [] }, 'media:')).toContain('require at least one image');
      expect(findingFor({ ...validIg, media: undefined }, 'media:')).toBeDefined();
    });

    it('rejects media on X while X media posting is unimplemented', () => {
      expect(PLATFORM_RULES.x.media).toBe('forbidden');
      expect(findingFor({ ...validX, media: ['/eras/red.png'] }, 'media:')).toContain('does not support media yet');
    });

    it('requires site-absolute paths', () => {
      expect(findingFor({ ...validIg, media: ['eras/red.png'] }, 'media:')).toContain('site-absolute');
      expect(findingFor({ ...validIg, media: [42] }, 'media:')).toBeDefined();
    });

    it('rejects a non-array media field', () => {
      expect(findingFor({ ...validIg, media: '/eras/red.png' }, 'media:')).toContain('must be an array');
    });

    it('caps Instagram carousels at 10', () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `/social/${i}.png`);
      expect(findingFor({ ...validIg, media: eleven }, 'media:')).toContain('exceeds instagram');
    });
  });

  describe('bookkeeping fields', () => {
    it('validates attempts and timestamps when present', () => {
      expect(findingFor({ ...validX, attempts: -1 }, 'attempts:')).toBeDefined();
      expect(findingFor({ ...validX, attempts: 1.5 }, 'attempts:')).toBeDefined();
      expect(validateQueueItem({ ...validX, attempts: 2, lastAttemptAt: '2026-08-12T23:00:00Z' })).toEqual([]);
      expect(findingFor({ ...validX, lastAttemptAt: 'nope' }, 'lastAttemptAt:')).toBeDefined();
      expect(findingFor({ ...validX, campaign: 12 }, 'campaign:')).toBeDefined();
    });
  });

  it('reports every problem at once rather than the first', () => {
    const findings = validateQueueItem({ platform: 'tiktok', body: '', scheduledAt: 'soon', media: 'x' });
    expect(findings.length).toBeGreaterThanOrEqual(4);
  });
});
