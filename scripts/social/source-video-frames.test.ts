import { describe, expect, it, vi } from 'vitest';
import { blocky } from './lib/frame-fixtures';
import { ModeAUnavailable } from './lib/video-frames-modea.mjs';
import { validatePhotoEntry } from './lib/photo-library.mjs';
import { buildCandidate, runSourcing, sourceStills, stillUrls, watchUrl } from './source-video-frames.mjs';

const video = (id: string, era = 'folklore') => ({ id, era, slug: `s-${id}`, title: 'cardigan', kind: 'music_video' });
const jpegRes = (buf: Buffer) => ({ ok: true, status: 200, headers: new Headers({ 'content-type': 'image/jpeg' }), arrayBuffer: async () => buf });
const missing = { ok: false, status: 404, headers: new Headers(), arrayBuffer: async () => new ArrayBuffer(0) };

describe('Mode B URLs and candidates', () => {
  it('generates the three auto-frame stills, thumbnail only on request', () => {
    expect(stillUrls('abc').map((s) => s.url)).toEqual([1, 2, 3].map((n) => `https://i.ytimg.com/vi/abc/maxres${n}.jpg`));
    expect(stillUrls('abc', { includeThumbnail: true })).toHaveLength(4);
  });

  it('builds importer-valid candidates with watch-URL source and credit', () => {
    const c = buildCandidate(video('abc'), { key: 'maxres1', sourceUrl: 'https://i.ytimg.com/vi/abc/maxres1.jpg' });
    expect(validatePhotoEntry(c)).toEqual([]);
    expect(c).toMatchObject({
      id: 'official-video-abc-maxres1',
      mediaPath: '/social/library/photos/official-video-abc-maxres1.jpg',
      credit: 'Taylor Swift (official video)',
      source: 'https://www.youtube.com/watch?v=abc',
      tags: ['official-video', 'folklore'],
    });
    expect(c.alt).toBe('Still from Taylor Swift\'s official "cardigan" music video.');
    const timed = buildCandidate(video('abc'), { key: 't83', sourceUrl: 'file:///x.jpg', seconds: 83.4 });
    expect(timed.source).toBe(watchUrl('abc', 83.4));
    expect(timed.source).toMatch(/&t=83s$/);
    expect(timed.alt).toContain('scene at 1:23');
  });
});

describe('sourceStills dimension + quality filter', () => {
  it('keeps HD distinct stills; drops absent, undersized and duplicate ones', async () => {
    const hd = await blocky(1);
    const small = await blocky(2, 640, 360);
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith('maxres1.jpg')) return jpegRes(hd);
      if (url.endsWith('maxres2.jpg')) return jpegRes(small);
      return jpegRes(hd); // maxres3 identical to maxres1 -> duplicate
    });
    const out = await sourceStills(video('abc'), { fetchImpl: fetchImpl as never });
    expect(out.frames.map((f) => f.id)).toEqual(['official-video-abc-maxres1']);
    expect(out.dropped).toMatchObject({ 'too small': 1, duplicate: 1 });
    const none = await sourceStills(video('abc'), { fetchImpl: (async () => missing) as never });
    expect(none.frames).toEqual([]);
    expect(none.dropped['absent (404)']).toBe(3);
  });
});

describe('runSourcing', () => {
  const videos = [video('aaaaaaaaaaa'), video('bbbbbbbbbbb'), video('ccccccccccc', 'red')];
  const ledger = () => ({ version: 1, processed: {} as Record<string, unknown> });
  const stills = (id: string) => [buildCandidate(video(id), { key: 'maxres1', sourceUrl: `https://i.ytimg.com/vi/${id}/maxres1.jpg` })];

  it('falls back to Mode B for everything after Mode A is blocked once, and stops trying A', async () => {
    const modeA = vi.fn(async () => {
      throw new ModeAUnavailable('Sign in to confirm you are not a bot');
    });
    const modeB = vi.fn(async (v: { id: string }) => ({ frames: stills(v.id) }));
    const l = ledger();
    const out = await runSourcing(videos, l, { limit: 10, scratch: 'x', modeA, modeB, warn: () => {} });
    expect(modeA).toHaveBeenCalledTimes(1);
    expect(modeB).toHaveBeenCalledTimes(3);
    expect(out.report).toMatchObject({ videos: 3, modeA: 0, modeB: 3, blocked: true });
    expect(Object.keys(l.processed)).toHaveLength(3);
  });

  it('uses Mode A frames (file URLs, timestamped) when the download works', async () => {
    const modeA = vi.fn(async () => ({ kept: [{ file: 'C:/tmp/f_0001.jpg', time: 61.2 }] }));
    const modeB = vi.fn();
    const out = await runSourcing([videos[0]], ledger(), { limit: 1, scratch: 'x', modeA, modeB, warn: () => {} });
    expect(modeB).not.toHaveBeenCalled();
    expect(out.candidates[0]).toMatchObject({ id: 'official-video-aaaaaaaaaaa-t61', source: 'https://www.youtube.com/watch?v=aaaaaaaaaaa&t=61s' });
    expect(out.candidates[0].sourceUrl).toMatch(/^file:\/\//);
  });

  it('is resumable and bounded: processed ids are skipped, limit caps videos per run', async () => {
    const modeB = vi.fn(async (v: { id: string }) => ({ frames: stills(v.id) }));
    const l = ledger();
    await runSourcing(videos, l, { mode: 'b', limit: 2, scratch: 'x', modeB });
    expect(Object.keys(l.processed)).toEqual(['aaaaaaaaaaa', 'bbbbbbbbbbb']);
    const second = await runSourcing(videos, l, { mode: 'b', limit: 2, scratch: 'x', modeB });
    expect(second.candidates.map((c: { id: string }) => c.id)).toEqual(['official-video-ccccccccccc-maxres1']);
    expect(modeB).toHaveBeenCalledTimes(3);
  });

  it('stops starting new videos once the shared candidate cap is reached', async () => {
    const modeB = vi.fn(async (v: { id: string }) => ({ frames: stills(v.id) }));
    const l = ledger();
    const out = await runSourcing(videos, l, { mode: 'b', limit: 10, maxCandidates: 2, scratch: 'x', modeB });
    expect(out.candidates).toHaveLength(2);
    expect(Object.keys(l.processed)).toEqual(['aaaaaaaaaaa', 'bbbbbbbbbbb']);
  });

  it('skips Mode A once the time budget is spent', async () => {
    const modeA = vi.fn();
    const modeB = vi.fn(async (v: { id: string }) => ({ frames: stills(v.id) }));
    let t = 0;
    await runSourcing([videos[0]], ledger(), { limit: 1, scratch: 'x', budgetMs: 1000, now: () => (t += 5000), modeA, modeB });
    expect(modeA).not.toHaveBeenCalled();
    expect(modeB).toHaveBeenCalled();
  });

  it('is non-fatal: a failing video is warned about, left out of the ledger, and the rest proceed', async () => {
    const modeB = vi.fn(async (v: { id: string }) => {
      if (v.id === 'bbbbbbbbbbb') throw new Error('socket hang up');
      return { frames: stills(v.id) };
    });
    const warn = vi.fn();
    const l = ledger();
    const out = await runSourcing(videos, l, { mode: 'b', limit: 10, scratch: 'x', modeB, warn });
    expect(out.report).toMatchObject({ videos: 2, errors: 1 });
    expect(Object.keys(l.processed)).toEqual(['aaaaaaaaaaa', 'ccccccccccc']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('socket hang up'));
  });

  it('records a video with zero surviving frames as processed (no retry loop)', async () => {
    const l = ledger();
    await runSourcing([videos[0]], l, { mode: 'b', limit: 1, scratch: 'x', modeB: async () => ({ frames: [] }) });
    expect(l.processed.aaaaaaaaaaa).toMatchObject({ frames: 0 });
  });
});
