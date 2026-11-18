import { describe, expect, it } from 'vitest';
import { ERAS, getEra } from '@swift2/experience';

import keys from './lyric-track-keys.json';
import { CONTENT } from './content';
import { clampOnWord, resolveShareTarget } from './share-target';

describe('resolveShareTarget', () => {
  it('resolves a bundled item by id and by slug with its own title and summary', () => {
    const item = CONTENT.find((c) => c.slug && c.summary)!;
    const byId = resolveShareTarget({ item: item.id });
    expect(byId?.param).toBe(`item=${encodeURIComponent(item.id)}`);
    expect(byId?.title).toBe(clampOnWord(item.title, 100));
    expect(byId?.description).toBe(clampOnWord(item.summary, 160));
    expect(byId?.card.subtitle).toBe(item.summary);
    expect(resolveShareTarget({ item: item.slug })).toEqual(byId);
  });

  it('resolves an era to its name, with years, tagline and intro as the description', () => {
    const era = getEra('fearless');
    expect(resolveShareTarget({ era: 'fearless' })).toMatchObject({
      param: 'era=fearless',
      title: era.name,
      description: clampOnWord(`${era.yearLabel}: ${era.tagline} ${era.intro}`, 155),
      card: { kicker: era.yearLabel, title: era.name, subtitle: era.tagline },
      path: '/?era=fearless',
      imageAlt: `Long Live card: ${era.name} (${era.yearLabel})`,
    });
  });

  it('gives every era a share description of 120 to 156 characters', () => {
    expect(ERAS.length).toBeGreaterThan(0);
    for (const { id } of ERAS) {
      const t = resolveShareTarget({ era: id });
      expect(t?.param, id).toBe(`era=${encodeURIComponent(id)}`);
      if (!t) continue;
      expect(t.description.length, id).toBeGreaterThanOrEqual(120);
      expect(t.description.length, id).toBeLessThanOrEqual(156);
    }
  });

  it('resolves a lens to its thread title and blurb', () => {
    const target = resolveShareTarget({ lens: 'hidden-clues' });
    expect(target?.param).toBe('lens=hidden-clues');
    expect(target?.title).toBeTruthy();
    expect(target?.description).toBeTruthy();
  });

  it('resolves every committed song key, with the album as description', () => {
    for (const key of Object.values(keys as Record<string, string>)) {
      const target = resolveShareTarget({ song: key });
      expect(target, key).not.toBeNull();
      expect(target?.param).toBe(`song=${encodeURIComponent(key)}`);
      expect(target?.description).toBe(clampOnWord(getEra(key.split('::')[0]!).album, 160));
    }
  });

  it('does not resolve human-form or slug song values (the reader does not accept them)', () => {
    expect(resolveShareTarget({ song: 'Cruel Summer' })).toBeNull();
    expect(resolveShareTarget({ song: 'cruel-summer' })).toBeNull();
  });

  it('falls back to null for unknown targets, including a live-only or hidden item id', () => {
    expect(resolveShareTarget({})).toBeNull();
    expect(resolveShareTarget({ item: 'nope' })).toBeNull();
    expect(resolveShareTarget({ era: 'not-an-era' })).toBeNull();
    expect(resolveShareTarget({ lens: 'not-real' })).toBeNull();
    expect(resolveShareTarget({ mode: 'constructor' })).toBeNull();
  });

  it('follows the reader precedence and skips unresolved params', () => {
    expect(resolveShareTarget({ lens: 'fashion', era: 'fearless' })?.param).toBe('lens=fashion');
    expect(resolveShareTarget({ item: 'nope', era: 'fearless' })?.param).toBe('era=fearless');
  });
});

describe('clampOnWord', () => {
  it('leaves short text alone and trims long text on a word boundary', () => {
    expect(clampOnWord('short text', 160)).toBe('short text');
    const out = clampOnWord('alpha beta gamma delta', 12);
    expect(out).toBe('alpha beta…');
    expect(clampOnWord('x'.repeat(400), 160).length).toBeLessThanOrEqual(161);
  });
});
