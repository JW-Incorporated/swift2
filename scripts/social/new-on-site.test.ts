// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildFeed, latestFeedFile, momentIds, newMoments, primaryMedia, run, staleFeedFiles } from './new-on-site.mjs';

const photo = { url: 'https://upload.wikimedia.org/a.jpg', credit: 'x' };
const withMedia = (title: string, extra: Record<string, unknown> = {}) => ({ year: 2026, month: 10, day: 9, category: 'music', title, moment: { photos: [photo] }, ...extra });
const noMedia = (title: string) => ({ year: 2026, month: 10, title, moment: { photos: [] } });

describe('newMoments (pure diff)', () => {
  const baseline = [withMedia('Old one'), noMedia('Was bare')];
  const current = [withMedia('Old one'), withMedia('Fresh with photo'), noMedia('Fresh bare'), withMedia('Was bare'), withMedia('Defining thing', { significance: 'defining', thumbnailUrl: 'https://img.test/t.jpg' })];
  const out = newMoments([{ eraSlug: 'the-life-of-a-showgirl', current, baseline }]);

  it('keeps in-window moments with media, drops no-media and unchanged ones', () => {
    expect(out.map((m: { title: string }) => m.title)).toEqual(['Defining thing', 'Fresh with photo', 'Was bare']);
  });

  it('sorts by significance then id, and maps the era id and deep link', () => {
    expect(out[0]).toMatchObject({ significance: 'defining', eraId: 'tloas', mediaKind: 'thumbnail', deepLink: 'https://longlivets.com/?item=vault-tloas-defining-thing' });
    expect(out.map((m: { significance: string }) => m.significance)).toEqual(['defining', 'routine', 'routine']);
  });

  it('counts a moment that only gained media inside the window', () => {
    expect(out.find((m: { title: string }) => m.title === 'Was bare')).toBeTruthy();
  });

  it('is deterministic', () => {
    expect(JSON.stringify(newMoments([{ eraSlug: 'the-life-of-a-showgirl', current: [...current].reverse(), baseline }]))).toBe(JSON.stringify(out));
  });
});

describe('ids and media', () => {
  it('mirrors the site id scheme including collision suffixes', () => {
    expect(momentIds('lover', [{ title: 'Same Title' }, { title: 'Same title' }])).toEqual(['vault-lover-same-title', 'vault-lover-same-title-2']);
  });
  it('picks thumbnail, photo, video, instagram in order and rejects a media-less item', () => {
    expect(primaryMedia(withMedia('a'))?.kind).toBe('photo');
    expect(primaryMedia({ title: 'v', video: { youtubeId: 'abcdefghijk', title: 't' } })?.kind).toBe('video');
    expect(primaryMedia({ title: 'i', socialPost: { platform: 'instagram', shortcode: 'Cabc_1', label: 'l' } })?.ref).toBe('https://www.instagram.com/p/Cabc_1/');
    expect(primaryMedia(noMedia('n'))).toBeNull();
  });
});

describe('feed file housekeeping', () => {
  it('builds a 7-day window and a media list that validate-content accepts', () => {
    const feed = buildFeed('2026-10-15', newMoments([{ eraSlug: 'lover', current: [withMedia('A')], baseline: [] }]));
    expect(feed).toMatchObject({ since: '2026-10-08T00:00:00.000Z', count: 1, media: [photo.url] });
  });
  it('finds the latest feed and the stale ones', () => {
    const names = ['.gitkeep', 'merch-x.json', 'new-on-site-2026-09-20.json', 'new-on-site-2026-10-14.json', 'new-on-site-2026-10-01.json'];
    expect(latestFeedFile(names)).toBe('new-on-site-2026-10-14.json');
    expect(staleFeedFiles(names, '2026-10-15')).toEqual(['new-on-site-2026-09-20.json']);
  });
});

describe('run against a real git history', () => {
  const git = (cwd: string, args: string[], date?: string) =>
    execFileSync('git', args, { cwd, env: { ...process.env, ...(date ? { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } : {}) }, stdio: 'pipe' });
  const era = (titles: string[]) =>
    `export default { eraSlug: 'lover', items: [${titles.map((t) => `{ year: 2026, month: 10, title: ${JSON.stringify(t)}, thumbnailUrl: ${t.startsWith('Bare') ? 'null' : "'https://img.test/t.jpg'"} }`).join(', ')}] };\n`;

  it('lists only items added after the window opened, writes once, then no-ops', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'nos-'));
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 't@example.test']);
    git(root, ['config', 'user.name', 't']);
    mkdirSync(path.join(root, 'supabase/seed/content'), { recursive: true });
    const file = path.join(root, 'supabase/seed/content/lover.mjs');
    writeFileSync(file, era(['Out of window']));
    git(root, ['add', '.']);
    git(root, ['commit', '-q', '-m', 'old'], '2026-09-20T12:00:00Z');
    writeFileSync(file, era(['Out of window', 'In window', 'Bare in window']));
    git(root, ['commit', '-q', '-am', 'new'], '2026-10-12T12:00:00Z');

    const outDir = path.join(root, 'social/inbox');
    const first = await run({ root, date: '2026-10-15', outDir });
    expect(first).toMatchObject({ written: true, count: 1 });
    const feed = JSON.parse(readFileSync(path.join(outDir, 'new-on-site-2026-10-15.json'), 'utf8'));
    expect(feed.moments.map((m: { id: string }) => m.id)).toEqual(['vault-lover-in-window']);

    const second = await run({ root, date: '2026-10-16', outDir });
    expect(second.written).toBe(false);
    expect(readdirSync(outDir)).toEqual(['new-on-site-2026-10-15.json']);

    const empty = await run({ root, date: '2026-10-25', outDir });
    expect(empty).toMatchObject({ written: true, count: 0 });
  });
});
