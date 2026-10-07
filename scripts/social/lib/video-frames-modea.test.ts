import { EventEmitter } from 'node:events';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { blocky, stampLogo } from './frame-fixtures';
import { downloadVideo, execFile, FFMPEG_TIMEOUT_MS, filterFrames, TIMEOUT_CODE, YTDLP_TIMEOUT_MS, ModeAUnavailable, parseShowinfoTimes, sceneFilter, spread, ytdlpArgs } from './video-frames-modea.mjs';

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

describe('process timeouts', () => {
  const fakeChild = (closeOnKill: boolean) => {
    const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: ReturnType<typeof vi.fn> };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = vi.fn(() => {
      if (closeOnKill) setImmediate(() => child.emit('close', null));
    });
    return child;
  };

  it('SIGKILLs a hung process when the timer fires and reports a timeout code', async () => {
    const child = fakeChild(true);
    const res = await execFile('yt-dlp', ['x'], {
      timeoutMs: 300_000,
      spawnImpl: (() => child) as never,
      setTimer: ((fn: () => void) => setTimeout(fn, 0)) as never,
    });
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
    expect(res.code).toBe(TIMEOUT_CODE);
    expect(res.stderr).toContain('killed: yt-dlp exceeded 300s');
  });

  it('clears the timer and never kills a process that exits normally', async () => {
    const child = fakeChild(false);
    const clear = vi.fn();
    const pending = execFile('ffmpeg', [], { spawnImpl: (() => child) as never, setTimer: (() => 7) as never, clearTimer: clear as never });
    child.stdout.emit('data', 'out');
    child.emit('close', 0);
    expect(await pending).toEqual({ code: 0, stdout: 'out', stderr: '' });
    expect(clear).toHaveBeenCalledWith(7);
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('applies 5 min to yt-dlp, 3 min to ffmpeg, and the socket/size caps', async () => {
    expect([YTDLP_TIMEOUT_MS, FFMPEG_TIMEOUT_MS]).toEqual([300_000, 180_000]);
    expect(ytdlpArgs('abc', 'o').join(' ')).toContain('--socket-timeout 30 --max-filesize 400M');
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modea-'));
    const seen: unknown[] = [];
    const exec = async (_c: string, _a: string[], o: unknown) => {
      seen.push(o);
      return { code: TIMEOUT_CODE, stdout: '', stderr: 'killed' };
    };
    await expect(downloadVideo('abc', dir, { exec })).rejects.toThrow(/yt-dlp failed/);
    expect(seen).toEqual([{ timeoutMs: YTDLP_TIMEOUT_MS }]);
  });
});

describe('filterFrames watermark check', () => {
  it('drops ALL frames of a video whose frames share a corner mark, deleting the files', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'logo-'));
    const raw = [] as { file: string; time: number }[];
    for (const seed of [1, 2, 3, 4]) {
      const file = path.join(dir, `f_000${seed}.jpg`);
      await writeFile(file, await stampLogo(await blocky(seed)));
      raw.push({ file, time: seed });
    }
    const out = await filterFrames(raw, { maxFrames: 25 });
    expect(out.kept).toEqual([]);
    expect(out.logo?.corner).toBe('bottom-right');
    expect(await readdir(dir)).toEqual([]);
  });
});
