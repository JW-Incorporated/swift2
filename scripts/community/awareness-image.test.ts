import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  cardUrlForRef,
  fetchCardPng,
  loadCatalog,
  mentionedEra,
  parseImageRef,
  pickImageRef,
  suggestMoments,
  validateImageRef,
} from './awareness-image.mjs';

const catalog = {
  eras: ['debut', 'folklore', 'ttpd', 'tloas'].map((id) => ({ id, name: id })),
  moments: [
    {
      id: 'vault-folklore-surprise-debut',
      eraId: 'folklore',
      title: "folklore's surprise debut: 846,000 units and her seventh No. 1 album",
    },
    {
      id: 'vault-folklore-cardigan-merch',
      eraId: 'folklore',
      title: 'The original folklore cardigan sells out',
    },
    {
      id: 'vault-ttpd-announcement',
      eraId: 'ttpd',
      title: 'Tortured Poets Department announced at the Grammys',
    },
  ],
};

describe('image selection and validation', () => {
  it('detects the era a title names, including fan aliases', () => {
    expect(mentionedEra('Which Folklore song is the saddest?')).toBe('folklore');
    expect(mentionedEra('TTPD is growing on me')).toBe('ttpd');
    expect(mentionedEra('the life of a showgirl era is here')).toBe('tloas');
    expect(mentionedEra('What should I eat tonight')).toBeNull();
  });

  it('picks a specific moment when the title overlaps one (needs two shared words)', () => {
    const pick = pickImageRef('When did the folklore surprise album debut?', catalog);
    expect(pick).toEqual({ ref: 'moment:vault-folklore-surprise-debut', basis: 'moment' });
    expect(suggestMoments('folklore was great', catalog, { eraId: 'folklore' })).toEqual([]);
  });

  it('falls back to the era card, then to the newest era card', () => {
    expect(pickImageRef('Ranking every folklore track', catalog)).toEqual({
      ref: 'era:folklore',
      basis: 'era',
    });
    expect(pickImageRef('Anything at all', catalog)).toEqual({
      ref: 'era:tloas',
      basis: 'fallback',
    });
  });

  it('validates a ref against the real catalogue, rejecting unknown ids and bad shapes', () => {
    expect(validateImageRef('moment:vault-folklore-cardigan-merch', catalog)).toEqual({
      ok: true,
      ref: 'moment:vault-folklore-cardigan-merch',
    });
    expect(validateImageRef('era:ttpd', catalog).ok).toBe(true);
    expect(validateImageRef('moment:does-not-exist', catalog)).toEqual({
      ok: false,
      reason: 'unknown-id',
    });
    expect(validateImageRef('era:midnights', catalog).ok).toBe(false);
    expect(validateImageRef('https://evil.example/x.png', catalog)).toEqual({
      ok: false,
      reason: 'bad-format',
    });
    expect(parseImageRef('moment:a b')).toBeNull();
  });

  it('builds only share-card route URLs for validated refs', () => {
    expect(cardUrlForRef('era:ttpd')).toBe(
      'https://www.longlivets.com/api/share-card?era=ttpd&size=portrait',
    );
    expect(cardUrlForRef('moment:vault-folklore-cardigan-merch')).toBe(
      'https://www.longlivets.com/api/share-card?item=vault-folklore-cardigan-merch&size=portrait',
    );
    expect(() => cardUrlForRef('nonsense')).toThrow(/bad image ref/);
  });

  it('downloads a PNG card and refuses anything that is not one', async () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(32),
    ]);
    const ok = vi.fn(async () => new Response(png, { status: 200 }));
    const card = await fetchCardPng('era:ttpd', { fetchImpl: ok });
    expect(card.png.length).toBe(png.length);
    expect(card.url).toContain('era=ttpd');
    await expect(
      fetchCardPng('era:ttpd', { fetchImpl: async () => new Response('<html/>', { status: 200 }) }),
    ).rejects.toThrow(/did not return a PNG/);
    await expect(
      fetchCardPng('era:ttpd', { fetchImpl: async () => new Response('x', { status: 500 }) }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it('loads the real era catalogue (moments only when the vault was generated)', async () => {
    const real = await loadCatalog({ vaultFile: '/nonexistent/vault.generated.ts' });
    expect(real.eras.map((e: { id: string }) => e.id)).toContain('tloas');
    expect(real.moments).toEqual([]);
    expect(validateImageRef('era:tloas', real).ok).toBe(true);
  });
});

describe('committed sub list', () => {
  const config = JSON.parse(
    readFileSync(new URL('./awareness-subs.json', import.meta.url), 'utf8'),
  );
  it('is well formed, never includes NSFW or excluded subs, and keeps a note per sub', () => {
    const names = config.subs.map((s: { name: string }) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain('SwiftlyNSFW');
    for (const sub of config.subs) {
      expect(sub.notes?.length).toBeGreaterThan(10);
      expect(sub.selfPromoNote?.length).toBeGreaterThan(10);
      expect([1, 2, 3]).toContain(sub.tier);
    }
    for (const excluded of config.excluded) expect(names).not.toContain(excluded.name);
    expect(config.defaults.perSubDailyDeliveryCap).toBeLessThanOrEqual(3);
    expect(config.defaults.feedRequestsPerRun).toBeLessThanOrEqual(2);
    const big = config.subs.filter((s: { dailyCap?: number }) => s.dailyCap === 4);
    expect(big.map((s: { name: string }) => s.name)).toEqual(['TaylorSwift', 'swifties']);
    expect(JSON.stringify(config)).not.toMatch(/authed|oauth|REDDIT_CLIENT/i);
    for (const s of config.subs) expect(s.dailyCap ?? 3).toBeLessThanOrEqual(4);
    expect(config.search.queries.length).toBeGreaterThanOrEqual(2);
    expect(config.search.queries[0]).toContain('taylor swift');
  });
});
