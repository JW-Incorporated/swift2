import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blocky } from './frame-fixtures';
import { downloadVideo, filterFrames, ModeAUnavailable, parseShowinfoTimes, sceneFilter, spread, ytdlpArgs } from './video-frames-modea.mjs';

describe('Mode A helpers', () => {
  it('builds a <=1080p video-only yt-dlp command and an optional cookie source', () => {
    const args = ytdlpArgs('abc', 'out/abc.%(ext)s', { cookiesFromBrowser: 'chrome' });
    expect(args.join(' ')).toContain('height<=1080');
    expect(args).toContain('--no-playlist');
    expect(args.slice(-3)).toEqual(['--cookies-from-browser', 'chrome', 'https://www.youtube.com/watch?v=abc']);
  });

  it('selects scene changes >0.35 with a 1s minimum gap', () => {
    expect(sceneFilter()).toBe("select='gt(scene,0.35)*(isnan(prev_selected_t)+gte(t-prev_selected_t,1))',showinfo");
  });

  it('parses showinfo timestamps and spreads evenly', () => {
    expect(parseShowinfoTimes('x pts_time:1.5 y\n z pts_time:20 q')).toEqual([1.5, 20]);
    expect(spread([1, 2, 3, 4, 5, 6, 7, 8], 4)).toEqual([1, 3, 5, 7]);
    expect(spread([1, 2], 5)).toEqual([1, 2]);
  });

  it('turns a bot-check into ModeAUnavailable and other failures into plain errors', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modea-'));
    const blocked = async () => ({ code: 1, stdout: '', stderr: 'ERROR: Sign in to confirm you’re not a bot' });
    await expect(downloadVideo('abc', dir, { exec: blocked })).rejects.toBeInstanceOf(ModeAUnavailable);
    const forbidden = async () => ({ code: 1, stdout: '', stderr: 'ERROR: HTTP Error 403: Forbidden' });
    await expect(downloadVideo('abc', dir, { exec: forbidden })).rejects.toBeInstanceOf(ModeAUnavailable);
    const broken = async () => ({ code: 1, stdout: '', stderr: 'ERROR: unexpected failure' });
    const err = await downloadVideo('abc', dir, { exec: broken }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(ModeAUnavailable);
  });

  it('returns the downloaded file path when yt-dlp succeeds', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modea-'));
    const exec = async () => {
      await writeFile(path.join(dir, 'abc.mp4'), 'x');
      return { code: 0, stdout: '', stderr: '' };
    };
    expect(await downloadVideo('abc', dir, { exec })).toBe(path.join(dir, 'abc.mp4'));
  });
});

describe('filterFrames', () => {
  it('drops dark + duplicate frames, caps the rest, and deletes dropped files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frames-'));
    const sharp = (await import('sharp')).default;
    const raw = [] as { file: string; time: number }[];
    const add = async (name: string, buf: Buffer, time: number) => {
      await writeFile(path.join(dir, name), buf);
      raw.push({ file: path.join(dir, name), time });
    };
    await add('f_0001.jpg', await blocky(1), 5);
    await add('f_0002.jpg', await blocky(1), 6); // duplicate of 1
    await add('f_0003.jpg', await sharp({ create: { width: 1280, height: 720, channels: 3, background: '#000' } }).jpeg().toBuffer(), 7);
    await add('f_0004.jpg', await blocky(5), 8);
    await add('f_0005.jpg', await blocky(11), 9);
    const out = await filterFrames(raw, { maxFrames: 2 });
    expect(out.dropped).toMatchObject({ 'near-black': 1 });
    expect(out.duplicates).toBe(1);
    expect(out.kept).toHaveLength(2);
    expect((await readdir(dir)).sort()).toEqual(out.kept.map((k: { file: string }) => path.basename(k.file)).sort());
  });
});
