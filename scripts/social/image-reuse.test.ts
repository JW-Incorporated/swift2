import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error -- plain .mjs without type declarations
import { IMAGE_MATCH_MAX_BITS, fingerprintDistance, fingerprintImage, fingerprintsMatch } from './lib/image-fingerprint.mjs';
// @ts-expect-error -- plain .mjs without type declarations
import { buildLedger, validateLedgerEntries } from './lib/image-ledger.mjs';
// @ts-expect-error -- plain .mjs without type declarations
import { checkImageReuse } from './lib/image-reuse.mjs';
// @ts-expect-error -- plain .mjs without type declarations
import { guardImageReuse } from './guard-image-reuse.mjs';

/** Deterministic pseudo-photo: a 12x12 grid of seeded colours smoothed up to look like a picture. */
async function picture(seed: number, width = 320, height = 240): Promise<Buffer> {
  let state = seed;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  const cells = Buffer.alloc(12 * 12 * 3);
  for (let i = 0; i < cells.length; i += 1) cells[i] = Math.floor(next() * 256);
  return sharp(cells, { raw: { width: 12, height: 12, channels: 3 } })
    .resize(width, height, { kernel: 'cubic' })
    .png()
    .toBuffer();
}

describe('image fingerprint', () => {
  it('matches the same photo resized, re-encoded or re-saved, and not a different photo', async () => {
    const original = await picture(7);
    const base = await fingerprintImage(original);
    const variants = [
      await sharp(original).resize(120).png().toBuffer(),
      await sharp(original).resize(900).jpeg({ quality: 40 }).toBuffer(),
      await sharp(original).jpeg({ quality: 95 }).toBuffer(),
      await sharp(original).webp({ quality: 60 }).toBuffer(),
    ];
    for (const v of variants) {
      const fp = await fingerprintImage(v);
      expect(fingerprintDistance(base, fp)).toBeLessThanOrEqual(3);
      expect(fingerprintsMatch(base, fp)).toBe(true);
    }
    for (const seed of [8, 9, 10, 11, 12]) {
      const other = await fingerprintImage(await picture(seed));
      expect(fingerprintDistance(base, other)).toBeGreaterThan(IMAGE_MATCH_MAX_BITS);
      expect(fingerprintsMatch(base, other)).toBe(false);
    }
  });

  it('matches a centre crop of the same photo', async () => {
    const original = await picture(21, 400, 300);
    const crop = await sharp(original).extract({ left: 80, top: 0, width: 240, height: 300 }).jpeg().toBuffer();
    expect(fingerprintsMatch(await fingerprintImage(original), await fingerprintImage(crop))).toBe(true);
  });

  it('returns null for undecodable bytes', async () => {
    expect(await fingerprintImage(Buffer.from('not an image'))).toBeNull();
  });
});

describe('image reuse check', () => {
  const buffers = new Map<string, Buffer>();
  const fingerprintOf = async (mediaPath: string) => (buffers.has(mediaPath) ? fingerprintImage(buffers.get(mediaPath)) : null);

  async function setup() {
    const photo = await picture(31);
    buffers.set('/social/library/photos/original.png', photo);
    buffers.set('/social/library/photos/renamed-small.jpg', await sharp(photo).resize(160).jpeg({ quality: 50 }).toBuffer());
    buffers.set('/social/library/photos/different.png', await picture(32));
    const posted = [
      {
        file: '2026-09-01-old-post-ig.json',
        data: { platform: 'instagram', campaign: 'old-campaign', platformPostId: 'IG123', postedAt: '2026-09-01T12:00:00Z', media: ['/social/library/photos/original.png'] },
      },
    ];
    const { entries } = await buildLedger(posted, [], fingerprintOf);
    return entries;
  }

  it('rejects the same photo renamed/resized from another campaign and names the earlier post', async () => {
    const ledger = await setup();
    const item = { platform: 'x', campaign: 'new-campaign', media: ['/social/library/photos/renamed-small.jpg'] };
    const { findings } = await checkImageReuse('new-x.json', item, { ledger, fingerprintOf });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('2026-09-01-old-post-ig.json');
    expect(findings[0]).toContain('IG123');
  });

  it('passes a different photo', async () => {
    const ledger = await setup();
    const item = { platform: 'x', campaign: 'new-campaign', media: ['/social/library/photos/different.png'] };
    expect((await checkImageReuse('new-x.json', item, { ledger, fingerprintOf })).findings).toEqual([]);
  });

  it('allows the same picture across the two halves of ONE campaign', async () => {
    const ledger = await setup();
    const item = { platform: 'x', campaign: 'old-campaign', media: ['/social/library/photos/renamed-small.jpg'] };
    expect((await checkImageReuse('old-x.json', item, { ledger, fingerprintOf })).findings).toEqual([]);
  });

  it('queue-vs-queue: rejects a cross-campaign repeat, allows the same-campaign pair', async () => {
    await setup();
    const queue = [
      { file: 'a-ig.json', data: { platform: 'instagram', campaign: 'camp-a', media: ['/social/library/photos/original.png'] } },
      { file: 'a-x.json', data: { platform: 'x', campaign: 'camp-a', media: ['/social/library/photos/renamed-small.jpg'] } },
      { file: 'b-x.json', data: { platform: 'x', campaign: 'camp-b', media: ['/social/library/photos/renamed-small.jpg'] } },
    ];
    const ctx = { ledger: [], queue, fingerprintOf };
    expect((await checkImageReuse('a-x.json', queue[1].data, ctx)).findings.join()).toContain('b-x.json');
    expect((await checkImageReuse('a-ig.json', queue[0].data, ctx)).findings.join()).toContain('b-x.json');
    const pairOnly = { ledger: [], queue: queue.slice(0, 2), fingerprintOf };
    expect((await checkImageReuse('a-x.json', queue[1].data, pairOnly)).findings).toEqual([]);
  });

  it('reports undecodable media as unreadable', async () => {
    const item = { platform: 'x', campaign: 'c', media: ['/social/library/photos/missing.png'] };
    expect((await checkImageReuse('q.json', item, { ledger: [], fingerprintOf })).unreadable).toEqual(['/social/library/photos/missing.png']);
  });

  it('backfill is deterministic, sorted and reuses existing entries', async () => {
    await setup();
    const posted = [
      { file: 'b.json', data: { platform: 'x', media: ['/social/library/photos/original.png'], postedAt: 'T2' } },
      { file: 'a.json', data: { platform: 'instagram', media: ['/social/library/photos/different.png', '/social/library/photos/original.png'], postedAt: 'T1' } },
    ];
    const first = await buildLedger(posted, [], fingerprintOf);
    const second = await buildLedger([...posted].reverse(), first.entries, async () => {
      throw new Error('must not re-fingerprint a known entry');
    });
    expect(JSON.stringify(second.entries)).toBe(JSON.stringify(first.entries));
    expect(first.entries.map((e: { post: string; file: string }) => `${e.post}${e.file}`)).toEqual([
      'a.json/social/library/photos/different.png',
      'a.json/social/library/photos/original.png',
      'b.json/social/library/photos/original.png',
    ]);
    expect(validateLedgerEntries(first.entries)).toEqual([]);
  });
});

describe('guard-image-reuse (poster pre-step)', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });

  async function fixtureRoot(queueMedia: Buffer, queueCampaign = 'new-campaign') {
    const root = mkdtempSync(path.join(tmpdir(), 'guard-image-'));
    roots.push(root);
    for (const d of ['social/queue', 'social/posted', 'apps/web/public/social/library/photos']) mkdirSync(path.join(root, d), { recursive: true });
    writeFileSync(path.join(root, 'social/photo-library.json'), JSON.stringify({ photos: [] }));
    const photos = path.join(root, 'apps/web/public/social/library/photos');
    writeFileSync(path.join(photos, 'posted.png'), await picture(41));
    writeFileSync(path.join(photos, 'queued.bin'), queueMedia);
    writeFileSync(
      path.join(root, 'social/posted/old-ig.json'),
      JSON.stringify({ platform: 'instagram', campaign: 'old', platformPostId: 'P1', postedAt: '2026-09-01T00:00:00Z', media: ['/social/library/photos/posted.png'] }),
    );
    writeFileSync(
      path.join(root, 'social/queue/due-x.json'),
      JSON.stringify({ platform: 'x', campaign: queueCampaign, scheduledAt: '2026-10-01T00:00:00Z', media: ['/social/library/photos/queued.bin'] }),
    );
    return root;
  }
  const noNetwork = async () => ({ ok: false }) as Response;
  const now = new Date('2026-10-16T00:00:00Z');

  it('refuses a due item whose image matches the ledger, even re-encoded', async () => {
    const root = await fixtureRoot(await sharp(await picture(41)).resize(150).jpeg({ quality: 45 }).toBuffer());
    const result = await guardImageReuse({ root, now, fetchImpl: noNetwork });
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain('old-ig.json');
  });

  it('passes a different picture and the sibling of its own campaign', async () => {
    const different = await fixtureRoot(await picture(42));
    expect((await guardImageReuse({ root: different, now, fetchImpl: noNetwork })).problems).toEqual([]);
    const sibling = await fixtureRoot(await picture(41), 'old');
    expect((await guardImageReuse({ root: sibling, now, fetchImpl: noNetwork })).problems).toEqual([]);
  });

  it('fails closed when a due item image is corrupt or unreachable', async () => {
    const root = await fixtureRoot(Buffer.from('this is not an image at all'));
    const result = await guardImageReuse({ root, now, fetchImpl: noNetwork });
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain('fail closed');
  });

  it('ignores items that are not yet due', async () => {
    const root = await fixtureRoot(Buffer.from('corrupt'));
    const result = await guardImageReuse({ root, now: new Date('2026-09-01T00:00:00Z'), fetchImpl: noNetwork });
    expect(result.problems).toEqual([]);
  });
});
