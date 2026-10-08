import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSeedModules, pendingVideos, readLedger, selectOfficialVideos, writeLedger, youtubeIdFromUrl } from './official-videos.mjs';

const media = (id: string, attribution: string) => [{ provider: 'youtube', post_url: `https://www.youtube.com/watch?v=${id}`, attribution }];
const OWN = 'Taylor Swift — official YouTube channel';
const mod = {
  eraSlug: 'folklore',
  videos: [
    { slug: 'a', kind: 'music_video', title: 'cardigan', media: media('K-a8s8OLBSE', OWN) },
    { slug: 'dup', kind: 'documentary', title: 'dup', media: media('K-a8s8OLBSE', OWN) },
    { slug: 'zayn', kind: 'music_video', title: 'Z', media: media('AAAAAAAAAAA', 'ZAYN — official YouTube channel') },
    { slug: 'ellen', kind: 'interview', title: 'E', media: media('BBBBBBBBBBB', 'TheEllenShow — official YouTube channel') },
    { slug: 'own-interview', kind: 'interview', title: 'I', media: media('CCCCCCCCCCC', OWN) },
    { slug: 'lyric', kind: 'lyric_video', title: 'L', media: media('DDDDDDDDDDD', OWN) },
    { slug: 'trailer', kind: 'documentary', title: 'T', media: media('EEEEEEEEEEE', `${OWN} (official trailer)`) },
    { slug: 'film', kind: 'tour_film', title: 'F', media: [] },
    { slug: 't1', kind: 'music_video', title: 'Song (Lyric Video)', media: media('GGGGGGGGGGG', OWN) },
    { slug: 't2', kind: 'documentary', title: 'Making of: Behind The Scenes', media: media('HHHHHHHHHHH', OWN) },
    { slug: 't3', kind: 'documentary', title: 'Studio BTS', media: media('IIIIIIIIIII', OWN) },
    { slug: 't4', kind: 'music_video', title: 'Song (Visualizer)', media: media('JJJJJJJJJJJ', OWN) },
    { slug: 't5', kind: 'music_video', title: 'Song (Teaser)', media: media('KKKKKKKKKKK', OWN) },
    { slug: 'a1', kind: 'music_video', title: 'Fine', media: media('LLLLLLLLLLL', `${OWN} (official audio)`) },
    { slug: 'a2', kind: 'music_video', title: 'Fine', media: media('MMMMMMMMMMM', `${OWN} (behind the scenes)`) },
    { slug: 'ok-bts-word', kind: 'performance', title: 'Cobtsworth live', media: media('NNNNNNNNNNN', OWN) },
    { slug: 'perf', kind: 'performance', title: 'P', media: media('FFFFFFFFFFF', OWN) },
  ],
};

describe('selectOfficialVideos', () => {
  it('keeps only Taylor-channel music/short/performance/documentary uploads, de-duped by id', () => {
    const out = selectOfficialVideos([mod]);
    expect(out.map((v) => v.id)).toEqual(['K-a8s8OLBSE', 'NNNNNNNNNNN', 'FFFFFFFFFFF']);
    expect(out[0]).toMatchObject({ era: 'folklore', slug: 'a', title: 'cardigan', kind: 'music_video' });
  });

  it('extracts ids from watch URLs only', () => {
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=K-a8s8OLBSE&t=3s')).toBe('K-a8s8OLBSE');
    expect(youtubeIdFromUrl('https://example.com/x')).toBeNull();
  });

  it('finds a plausible official set in the real seed', async () => {
    const real = selectOfficialVideos(await loadSeedModules(path.resolve(__dirname, '../../../supabase/seed/videos')));
    expect(real.length).toBeGreaterThan(100);
    expect(new Set(real.map((v) => v.id)).size).toBe(real.length);
    expect(real.every((v) => v.id.length === 11)).toBe(true);
  });
});

describe('ledger', () => {
  it('round-trips, treats a missing file as empty, and skips processed videos on resume', async () => {
    const file = path.join(await mkdtemp(path.join(os.tmpdir(), 'ledger-')), 'l.json');
    const empty = await readLedger(file);
    expect(empty.processed).toEqual({});
    const videos = selectOfficialVideos([mod]);
    empty.processed[videos[0].id] = { at: 'x', mode: 'b', frames: 3 };
    await writeLedger(file, empty);
    const again = await readLedger(file);
    expect(pendingVideos(videos, again, 10).map((v) => v.id)).toEqual(['NNNNNNNNNNN', 'FFFFFFFFFFF']);
    expect(pendingVideos(videos, empty, 0)).toEqual([]);
  });
});
