import { describe, expect, it } from 'vitest';
import { detectPersistentLogo } from './frame-logo.mjs';
import sharp from 'sharp';
import { blocky, stampLogo } from './frame-fixtures';

describe('detectPersistentLogo', () => {
  it('finds a corner mark that is identical across varying frames', async () => {
    const frames = await Promise.all([1, 2, 3, 4, 5].map(async (s) => stampLogo(await blocky(s))));
    const hit = await detectPersistentLogo(frames);
    expect(hit?.corner).toBe('bottom-right');
    expect(hit?.ratio).toBeGreaterThanOrEqual(0.7);
  });

  it('works on exactly three stills (Mode B) and on a top-left mark', async () => {
    const frames = await Promise.all([1, 2, 3].map(async (s) => stampLogo(await blocky(s), 'top-left')));
    expect((await detectPersistentLogo(frames))?.corner).toBe('top-left');
  });

  it('still catches the mark when 1 of 5 frames lacks it (>=70% rule)', async () => {
    const frames = await Promise.all([1, 2, 3, 4].map(async (s) => stampLogo(await blocky(s))));
    frames.push(await blocky(9));
    expect(await detectPersistentLogo(frames)).not.toBeNull();
  });

  it('does not flag logo-free frames, too few frames, or a static scene', async () => {
    const clean = await Promise.all([1, 2, 3, 4].map((s) => blocky(s)));
    expect(await detectPersistentLogo(clean)).toBeNull();
    expect(await detectPersistentLogo(clean.slice(0, 2))).toBeNull();
    const same = await blocky(1);
    expect(await detectPersistentLogo([same, same, same, same])).toBeNull();
  });

  it('does not treat a flat dark corner as a logo', async () => {
    const black = await sharp({ create: { width: 180, height: 100, channels: 3, background: '#000' } }).png().toBuffer();
    const frames = await Promise.all([1, 2, 3].map(async (s) => sharp(await blocky(s)).composite([{ input: black, left: 1100, top: 620 }]).jpeg().toBuffer()));
    expect(await detectPersistentLogo(frames)).toBeNull();
  });
});
