// S2 (docs/decisions.md 2026-10-01): taste thresholds live in
// social/strategy-params.json; guardrail checks stay hard-coded.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkOpeners, checkCampaignPair, checkLength, checkMedia, checkDraft } from './check-drafts.mjs';
import { checkPhotoReuse } from './lib/photo-reuse.mjs';
import { findCodifiableRules } from './lib/lessons.mjs';
import { DEFAULT_PARAMS, mergeParams, validateStrategyParams, loadStrategyParams } from './lib/strategy-params.mjs';
import { checkCardMedia, checkExperiment, photoMixWarning } from './lib/draft-taste.mjs';
import { buildCardUrl, cardFileName, fetchShareCard } from './fetch-share-card.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public');
const CARD_REL = '/social/library/cards/__test-fixture-card.png';
const CARD_URL = 'https://www.longlivets.com/api/share-card?type=era&id=midnights';

const withParams = (patch: Record<string, Record<string, unknown>>) => mergeParams(Object.fromEntries(Object.entries(patch)));

function pngHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe('the committed social/strategy-params.json', () => {
  it('is valid, and every section carries a `why`', async () => {
    const raw = JSON.parse(await readFile(path.join(ROOT, 'social', 'strategy-params.json'), 'utf8'));
    expect(validateStrategyParams(raw)).toEqual([]);
  });

  it('loads to the same thresholds the checker hard-coded before S2 (plus card)', () => {
    const p = loadStrategyParams(ROOT);
    expect(p.openers).toEqual({ wordWindow: 6, postedLookbackDays: 14, bannedOpeners: ['did you know'] });
    expect(p.photoReuse.igHistoryWindow).toBe(10);
    expect(p.pairing.simultaneousWindowMinutes).toBe(5);
    expect(p.crossPost).toEqual({ similarityThreshold: 0.8, pairedLookingFloor: 0.15 });
    expect(p.xLength.warnAt).toBe(270);
    expect(p.media.allowedKinds).toEqual(['photo', 'site-screen', 'card']);
  });
});

describe('strategy-params loading', () => {
  it('falls back to the defaults when the file is missing', () => {
    expect(loadStrategyParams(path.join(ROOT, 'does-not-exist'))).toEqual(mergeParams(null));
    expect(mergeParams(null).openers).toEqual(DEFAULT_PARAMS.openers);
  });

  it('keeps the default for an invalid field and takes valid ones', () => {
    const p = mergeParams({ openers: { wordWindow: -3, postedLookbackDays: 30 }, xLength: { warnAt: 999 } });
    expect(p.openers.wordWindow).toBe(6);
    expect(p.openers.postedLookbackDays).toBe(30);
    expect(p.xLength.warnAt).toBe(270); // never above X's 280 limit
  });

  it('refuses unknown media kinds (era-art can never be re-enabled from the file)', () => {
    expect(mergeParams({ media: { allowedKinds: ['photo', 'era-art'] } }).media.allowedKinds).toEqual(DEFAULT_PARAMS.media.allowedKinds);
  });

  it('flags a section with no `why` and an unknown key', () => {
    const problems = validateStrategyParams({ ...DEFAULT_PARAMS, openers: { ...DEFAULT_PARAMS.openers, extra: 1 } });
    expect(problems.some((m: string) => m.includes('"openers"') && m.includes('why'))).toBe(true);
    expect(problems.some((m: string) => m.includes('unknown key "extra"'))).toBe(true);
  });
});

describe('taste thresholds are read from params', () => {
  it('opener word window and banned phrases', () => {
    const others = [{ file: 'b.json', body: 'One two three four five six seven' }];
    const item = { body: 'One two three four five six eight' };
    expect(checkOpeners('a.json', item, others, withParams({ openers: { wordWindow: 6 } }))).toHaveLength(1);
    expect(checkOpeners('a.json', item, others, withParams({ openers: { wordWindow: 7 } }))).toEqual([]);
    const banned = withParams({ openers: { bannedOpeners: ['hot take'] } });
    expect(checkOpeners('a.json', { body: 'Hot take: it is fine' }, [], banned)).toHaveLength(1);
    expect(checkOpeners('a.json', { body: 'Did you know it is fine' }, [], banned)).toEqual([]);
  });

  it('the both-platforms default, but never the story-unique campaign key', () => {
    const off = withParams({ pairing: { requireBothPlatforms: false } });
    const x = { platform: 'x', campaign: 'solo:one' };
    expect(checkCampaignPair('a.json', x, [], [])).toHaveLength(1);
    expect(checkCampaignPair('a.json', x, [], [], off)).toEqual([]);
    expect(checkCampaignPair('a.json', { platform: 'x' }, [], [], off)).toHaveLength(1);
  });

  it('the X warn threshold moves, the 280 hard limit does not', () => {
    const body = 'a'.repeat(260);
    expect(checkLength({ platform: 'x', body })).toEqual([]);
    expect(checkLength({ platform: 'x', body }, withParams({ xLength: { warnAt: 250 } }))[0]).toMatch(/warning/);
    expect(checkLength({ platform: 'x', body: 'a'.repeat(281) }, withParams({ xLength: { warnAt: 270 } }))[0]).toMatch(/exceeds X's real 280/);
  });

  it('photo reuse scope "none" turns the check off; the default flags it', () => {
    const lib = [{ id: 'p1', mediaPath: '/social/library/photos/a.jpg' }];
    const item = { campaign: 'c:new', photoId: 'p1', media: ['/social/library/photos/a.jpg'] };
    const posted = [{ file: 'old.json', data: { campaign: 'c:old', photoId: 'p1', media: ['/social/library/photos/a.jpg'] } }];
    expect(checkPhotoReuse('a.json', item, [], posted, lib)).toHaveLength(1);
    expect(checkPhotoReuse('a.json', item, [], posted, lib, { scope: 'none' })).toEqual([]);
    const aged = [{ file: 'old.json', data: { ...posted[0].data, postedAt: '2020-01-01T00:00:00Z' } }];
    expect(checkPhotoReuse('a.json', item, [], aged, lib, { shippedWindowDays: 30 })).toEqual([]);
  });

  it('a media kind removed from allowedKinds is rejected', async () => {
    const f = await checkMedia('a.json', { platform: 'x', media: ['/social/library/mood-chat-screen.png'], mediaKind: 'site-screen' }, [], [], withParams({ media: { allowedKinds: ['photo', 'card'] } }));
    expect(f.some((m) => m.includes('not currently allowed'))).toBe(true);
  });

  it('site-screen campaign prefixes and the photo grid tile are Tree\'s', async () => {
    const item = { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', campaign: 'howto:x' };
    expect((await checkMedia('a.json', item, [])).some((m) => m.includes('only allowed on'))).toBe(true);
    const loose = withParams({ siteScreen: { allowedCampaignPrefixes: ['launch:', 'howto:'], requirePhotoGridTile: false } });
    expect(await checkMedia('a.json', item, [], [], loose)).toEqual([]);
  });

  it('photo mix is advisory: a warning, only once the window is full', () => {
    const params = mergeParams(null);
    const recent = Array.from({ length: 10 }, () => ({ mediaKind: 'site-screen' }));
    expect(photoMixWarning({ platform: 'instagram', mediaKind: 'site-screen' }, recent, params)).toMatch(/0% of the last 10/);
    expect(photoMixWarning({ platform: 'instagram', mediaKind: 'photo' }, recent, params)).toBeNull();
    expect(photoMixWarning({ platform: 'instagram', mediaKind: 'card' }, recent.slice(0, 3), params)).toBeNull();
  });
});

describe('mediaKind "card"', () => {
  beforeAll(async () => {
    await mkdir(path.dirname(path.join(PUBLIC_DIR, CARD_REL)), { recursive: true });
    await writeFile(path.join(PUBLIC_DIR, CARD_REL), pngHeader(1080, 1350));
  });
  afterAll(async () => {
    await rm(path.join(PUBLIC_DIR, CARD_REL), { force: true });
  });

  const card = { platform: 'instagram', media: [CARD_REL], mediaKind: 'card', cardUrl: CARD_URL, mediaCredit: 'Long Live' };

  it('accepts a committed share-card render credited "Long Live"', async () => {
    expect(await checkMedia('a.json', card, [])).toEqual([]);
  });

  it('requires cardUrl from the real route, the credit, and the cards/ path', () => {
    expect(checkCardMedia({ ...card, cardUrl: undefined }, CARD_REL).some((m) => m.includes('cardUrl'))).toBe(true);
    expect(checkCardMedia({ ...card, cardUrl: 'https://evil.example/api/share-card?x=1' }, CARD_REL)).toHaveLength(1);
    expect(checkCardMedia({ ...card, mediaCredit: 'Getty' }, CARD_REL).some((m) => m.includes('Long Live'))).toBe(true);
    expect(checkCardMedia(card, '/social/library/photos/a.png').some((m) => m.includes('cards/'))).toBe(true);
  });

  it('is rejected if Tree removes it from allowedKinds', async () => {
    const f = await checkMedia('a.json', card, [], [], withParams({ media: { allowedKinds: ['photo'] } }));
    expect(f.some((m) => m.includes('not currently allowed'))).toBe(true);
  });
});

describe('experiment object', () => {
  it('is optional, and when present names hypothesis, variant and metric', () => {
    expect(checkExperiment({})).toEqual([]);
    expect(checkExperiment({ experiment: { hypothesis: 'h', variant: 'v', metric: 'site clicks' } })).toEqual([]);
    expect(checkExperiment({ experiment: { hypothesis: 'h', variant: '' } })).toHaveLength(2);
    expect(checkExperiment({ experiment: 'yes' })).toHaveLength(1);
  });

  it('checkDraft reports a malformed experiment', async () => {
    const target = { file: 'a.json', data: { body: 'hello there world', platform: 'x', scheduledAt: '2026-10-02T12:00:00Z', experiment: { hypothesis: 'h' } } };
    const findings = await checkDraft(target, { allQueue: [target], openerContext: [], recentIg: [], params: mergeParams(null) });
    expect(findings.filter((m: string) => m.startsWith('experiment:'))).toHaveLength(2);
  });
});

describe('lessons autoCodify', () => {
  const rules = { active: [{ id: 'L001', timesFired: 6, codify: '—' }], retired: [] };
  it('is Tree\'s explicit choice: off returns nothing, on keeps the threshold arithmetic', () => {
    expect(findCodifiableRules(rules, { autoCodify: false })).toEqual([]);
    expect(findCodifiableRules(rules, { autoCodify: true })).toEqual(rules.active);
    expect(findCodifiableRules(rules)).toEqual(rules.active);
  });
});

describe('fetch-share-card', () => {
  it('only accepts the site\'s own /api/share-card URL', () => {
    expect(buildCardUrl({ query: 'type=era&id=midnights' })).toBe(CARD_URL);
    expect(() => buildCardUrl({ url: 'https://example.com/api/share-card?a=1' })).toThrow(/must be/);
  });

  it('slugs the file name and refuses an empty one', () => {
    expect(cardFileName('Midnights Era!')).toBe('midnights-era.png');
    expect(() => cardFileName('')).toThrow();
  });

  it('saves a PNG into cards/, following the redirect URL, and rejects a non-PNG', async () => {
    const dir = path.join(PUBLIC_DIR, 'social', 'library', 'cards', '__test-fetch');
    try {
      const png = Buffer.concat([pngHeader(1080, 1350), Buffer.alloc(10)]);
      const ok = async () => ({ ok: true, status: 200, url: CARD_URL, headers: new Headers(), arrayBuffer: async () => png });
      const r = await fetchShareCard({ query: 'type=era&id=midnights&x=1', name: 'midnights' }, { fetchImpl: ok as never, dir });
      expect(r).toMatchObject({ media: '/social/library/cards/midnights.png', cardUrl: CARD_URL });
      expect((await readFile(path.join(dir, 'midnights.png'))).length).toBe(png.length);
      const html = async () => ({ ok: true, status: 200, url: CARD_URL, headers: new Headers(), arrayBuffer: async () => Buffer.from('<html>') });
      await expect(fetchShareCard({ query: 'type=era', name: 'x' }, { fetchImpl: html as never, dir })).rejects.toThrow(/PNG/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
