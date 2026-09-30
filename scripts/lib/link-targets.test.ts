import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { enumerateTargets, extractUrls, isProbeable, stripComments } from './link-targets.mjs';

describe('extractUrls', () => {
  it('keeps an apostrophe inside a double-quoted URL', () => {
    expect(extractUrls(`url: "https://en.wikipedia.org/wiki/Say_Don't_Go",`)).toEqual([
      "https://en.wikipedia.org/wiki/Say_Don't_Go",
    ]);
  });

  it('keeps balanced parentheses but drops an unbalanced trailing one', () => {
    expect(extractUrls("wiki('https://en.wikipedia.org/wiki/Bad_Blood_(Taylor_Swift_song)')")).toEqual([
      'https://en.wikipedia.org/wiki/Bad_Blood_(Taylor_Swift_song)',
    ]);
    expect(extractUrls('see (https://example.org/post).')).toEqual(['https://example.org/post']);
  });

  it('keeps a trailing exclamation mark (Wikipedia song pages such as CANCELLED!)', () => {
    expect(extractUrls("wiki('CANCELLED!', 'https://en.wikipedia.org/wiki/CANCELLED!')")).toEqual(['https://en.wikipedia.org/wiki/CANCELLED!']);
  });

  it('ignores commented-out URLs', () => {
    const text = [
      "// url: 'https://old.example.net/dead'",
      '/* https://blocked.example.net/x */',
      "url: 'https://live.example.net/a',",
    ].join('\n');
    expect(stripComments(text)).not.toContain('old.example.net');
    expect(extractUrls(text)).toEqual(['https://live.example.net/a']);
  });
});

describe('isProbeable', () => {
  it.each([
    ['https://www.billboard.com/music/pop/story/'],
    ['https://www.etsy.com/listing/123/item'],
    ['https://www.youtube.com/watch?v=abcdefghijk'],
  ])('probes %s', (url) => expect(isProbeable(url)).toBe(true));

  it.each([
    ['https://upload.wikimedia.org/wikipedia/en/a.png'],
    ['https://i.ytimg.com/vi/abc/hqdefault.jpg'],
    ['https://people.com/thmb/xyz=/4000x0/photo'],
    ['https://api.anthropic.com/v1/messages'],
    ['https://schema.org/OutOfStock'],
    ['https://www.youtube.com/oembed?url=x'],
    ['https://www.longlivets.com/content'],
    ['https://www.ralphlauren.com/...exact-product-page'],
    ['https://youtu.be/ID'],
    ['https://example.com/${slug}'],
  ])('skips %s', (url) => expect(isProbeable(url)).toBe(false));
});

describe('enumerateTargets', () => {
  let root = '';
  afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }); });

  it('collects every class, deduplicates, and skips staged/test/generated files', async () => {
    root = await mkdtemp(join(tmpdir(), 'link-targets-'));
    const write = async (rel: string, body: string) => {
      const p = join(root, rel);
      await mkdir(join(p, '..'), { recursive: true });
      await writeFile(p, body);
    };
    await write('supabase/seed/content/demo.mjs', `export default { era: 'demo', items: [{ id: 'a', moment: {
      sources: [{ url: 'https://press.example.net/story' }],
      products: [{ url: 'https://shop.example.net/p/1', altListing: { url: 'https://alt.example.net/p/1' } }] } }] };`);
    await write('supabase/seed/merch/official.mjs', `export const OFFICIAL = [{ url: 'https://store.example.net/products/tee', category: 'tee' }];`);
    await write('supabase/seed/candidates/staged.mjs', `export default ['https://staged.example.net/never'];`);
    await write('supabase/seed/content/_example.mjs', `export default ['https://template.example.net/never'];`);
    await write('data/communities.json', JSON.stringify({ communities: [{ url: 'https://forum.example.net/taylor' }] }));
    await write('apps/web/lib/links.ts', `export const OUT = 'https://press.example.net/story'; export const ONLY_APP = 'https://app.example.net/x';`);
    await write('apps/web/lib/links.test.ts', `const t = 'https://test.example.net/never';`);
    await write('apps/web/lib/x.generated.ts', `const g = 'https://generated.example.net/never';`);

    const rows = await enumerateTargets(root);
    const byUrl = Object.fromEntries(rows.map((r) => [r.url, r.classes]));

    expect(byUrl['https://press.example.net/story']).toEqual(['app', 'source']);
    expect(byUrl['https://shop.example.net/p/1']).toEqual(['shop', 'source']);
    expect(byUrl['https://alt.example.net/p/1']).toEqual(['shop', 'source']);
    expect(byUrl['https://store.example.net/products/tee']).toEqual(['shop', 'source']);
    expect(byUrl['https://forum.example.net/taylor']).toEqual(['community']);
    expect(byUrl['https://app.example.net/x']).toEqual(['app']);
    const all = JSON.stringify(rows);
    for (const never of ['staged.', 'template.', 'test.example', 'generated.']) expect(all).not.toContain(never);
    expect(rows.filter((r) => r.url === 'https://press.example.net/story')).toHaveLength(1);
  });

  it('restricts to the requested classes', async () => {
    root = await mkdtemp(join(tmpdir(), 'link-targets-'));
    await mkdir(join(root, 'data'), { recursive: true });
    await writeFile(join(root, 'data', 'c.json'), '{"u":"https://forum.example.net/a"}');
    const rows = await enumerateTargets(root, ['community']);
    expect(rows.map((r) => r.url)).toEqual(['https://forum.example.net/a']);
    expect(await enumerateTargets(root, ['shop'])).toEqual([]);
  });
});
