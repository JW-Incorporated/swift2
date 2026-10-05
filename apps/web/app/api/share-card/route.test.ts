import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ERAS, getEra } from '@swift2/experience';

const confirmed = {
  id: 'interrupted-speech',
  slug: 'interrupted-speech-slug',
  eraId: 'fearless',
  title: 'The interrupted speech',
  dateLabel: 'September 2009',
  summary: 'A defining public turning point.',
};
const rumor = {
  id: 'rumored-collab',
  eraId: 'tloas',
  title: 'A rumored collaboration',
  dateLabel: 'August 2025',
  summary: 'Reported by one outlet, nothing official yet.',
  confidence: 'reputable_reporting',
};
const items = [confirmed, rumor];

vi.mock('../../../lib/longlive/vault-wiring', () => ({}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/longlive/content', () => ({
  getContentItemByIdOrSlug: (id: string) =>
    items.find((i) => i.id === id || (i as { slug?: string }).slug === id),
}));

import { buildShareCardTree, SHARE_CARD_CACHE_CONTROL } from '@/lib/longlive/share-card';
import { SHARE_CARD_WATERMARK, STORY_SAFE_Y } from '@/lib/longlive/share-card-frame';
import {
  canonicalShareCardPath,
  leadSentences,
} from '@/lib/longlive/share-card-spec';
import { parseShareCardRequestFromModules } from '@/lib/longlive/share-card-spec.server';
import { GET } from './route';

const parse = (qs: string) =>
  parseShareCardRequestFromModules(new URL(`https://www.longlivets.com/api/share-card${qs}`));

function raw(qs: string): Response {
  return GET(new Request(`http://localhost/api/share-card${qs}`) as never);
}

/** Like a browser: follow the route's 308 to the canonical URL, once. */
function get(qs: string): Promise<Response> {
  const res = raw(qs);
  if (res.status !== 308) return Promise.resolve(res);
  const location = new URL(res.headers.get('location')!);
  return get(location.search);
}

async function pngSize(res: Response): Promise<{ width: number; height: number; bytes: number }> {
  const buf = new DataView(await res.arrayBuffer());
  return { width: buf.getUint32(16), height: buf.getUint32(20), bytes: buf.byteLength };
}

type Style = Record<string, unknown>;

/** Expand function components and visit every host element's style + text. */
function walk(node: ReactNode, onStyle: (s: Style) => void, onText: (t: string) => void): void {
  if (node == null || typeof node === 'boolean') return;
  if (typeof node === 'string' || typeof node === 'number') return onText(String(node));
  if (Array.isArray(node)) return node.forEach((n) => walk(n, onStyle, onText));
  if (!isValidElement(node)) return;
  const el = node as ReactElement<{ children?: ReactNode; style?: Style }>;
  if (typeof el.type === 'function')
    return walk((el.type as (p: unknown) => ReactNode)(el.props), onStyle, onText);
  if (el.props.style) onStyle(el.props.style);
  walk(el.props.children, onStyle, onText);
}

function textOf(node: ReactNode): string {
  const parts: string[] = [];
  walk(
    node,
    () => undefined,
    (t) => parts.push(t),
  );
  return parts.join(' ');
}

function stylesOf(node: ReactNode): Style[] {
  const out: Style[] = [];
  walk(
    node,
    (s) => out.push(s),
    () => undefined,
  );
  return out;
}

describe('GET /api/share-card', { timeout: 60_000 }, () => {
  it('renders a 1080x1350 PNG for size=portrait', async () => {
    const res = await get('?item=interrupted-speech&size=portrait');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(await pngSize(res)).toMatchObject({ width: 1080, height: 1350 });
  });

  it('renders a 1080x1920 PNG for size=story', async () => {
    const res = await get('?item=interrupted-speech&size=story');
    expect(await pngSize(res)).toMatchObject({ width: 1080, height: 1920 });
  });

  it('renders every era in both formats without error', async () => {
    for (const era of ERAS) {
      expect(await pngSize(await get(`?era=${era.id}&size=portrait`))).toMatchObject({
        width: 1080,
        height: 1350,
      });
    }
    expect(await pngSize(await get('?eras=red,1989,lover&m=25&e=5&f=3&size=story'))).toMatchObject({
      width: 1080,
      height: 1920,
    });
  });

  it('defaults to portrait for a missing or unknown size', async () => {
    expect(await pngSize(await get('?item=interrupted-speech'))).toMatchObject({
      width: 1080,
      height: 1350,
    });
    expect(await pngSize(await get('?size=huge'))).toMatchObject({ width: 1080, height: 1350 });
  });

  it('returns the default card (200, never 500) for invalid input', async () => {
    for (const qs of [
      '',
      '?item=nope',
      '?item=__proto__',
      '?item=constructor&size=story',
      '?era=not-an-era',
      '?era=constructor',
      '?eras=,,,',
      '?eras=bogus,worse',
      `?item=${'x'.repeat(5000)}`,
      '?eras=red&m=NaN&e=-4&f=1e9',
    ]) {
      const res = await get(qs);
      expect(res.status, qs).toBe(200);
      expect(res.headers.get('content-type')).toBe('image/png');
      expect((await pngSize(res)).width, qs).toBe(1080);
    }
  });

  it('sets CDN cache headers on every render, including the fallback', async () => {
    for (const qs of ['?item=interrupted-speech', '?item=nope', '']) {
      expect((await get(qs)).headers.get('cache-control')).toBe(SHARE_CARD_CACHE_CONTROL);
    }
  });
});

describe('canonical redirects', () => {
  const canonicalOf = (qs: string) => canonicalShareCardPath(parse(qs));
  const location = (qs: string) => {
    const res = raw(qs);
    expect(res.status, qs).toBe(308);
    const url = new URL(res.headers.get('location')!);
    return url.pathname + url.search;
  };

  it('serves the canonical URL directly with no redirect', async () => {
    for (const qs of [
      '?item=interrupted-speech&size=portrait',
      '?era=red&size=story',
      '?eras=red%2Clover&m=25&e=0&f=1&size=portrait',
      '?size=portrait',
    ]) {
      expect(canonicalOf(qs), qs).toBe(`/api/share-card${qs}`);
      expect(raw(qs).status, qs).toBe(200);
    }
  });

  it('308s extra keys to the canonical URL', () => {
    expect(location('?item=interrupted-speech&size=portrait&utm=1&cb=abc')).toBe(
      '/api/share-card?item=interrupted-speech&size=portrait',
    );
  });

  it('308s a missing size, a slug, and unbucketed counts', () => {
    expect(location('?item=interrupted-speech')).toBe(
      '/api/share-card?item=interrupted-speech&size=portrait',
    );
    expect(location(`?item=${confirmed.slug}&size=story`)).toBe(
      '/api/share-card?item=interrupted-speech&size=story',
    );
    expect(location('?eras=red&m=37&e=999999&f=2&size=portrait')).toBe(
      '/api/share-card?eras=red&m=25&e=1000&f=1&size=portrait',
    );
  });

  it('308s a deduped, allowlisted, capped era list', () => {
    expect(location('?eras=red,bogus,red,lover,1989,debut&m=1&e=1&f=1&size=story')).toBe(
      '/api/share-card?eras=red%2Clover%2C1989&m=1&e=1&f=1&size=story',
    );
  });

  it('308s conflicting item + era to the item card', () => {
    expect(location('?item=interrupted-speech&era=red&size=portrait')).toBe(
      '/api/share-card?item=interrupted-speech&size=portrait',
    );
  });

  it('308s invalid ids to the canonical default card, which then renders', async () => {
    for (const qs of [
      '?item=nope&size=story',
      '?era=constructor&size=story',
      '?eras=zz&size=story',
      '?size=story&x=1',
    ]) {
      expect(location(qs), qs).toBe('/api/share-card?size=story');
    }
    expect(raw('?size=story').status).toBe(200);
  });

  it('cannot loop: every redirect target is itself canonical', () => {
    for (const qs of [
      '?item=nope',
      '?eras=red,red&m=7',
      `?item=${'x'.repeat(300)}&era=red`,
      '?a=1&b=2',
    ]) {
      const target = new URL(raw(qs).headers.get('location')!);
      expect(raw(target.search).status, qs).toBe(200);
    }
  });
});

describe('parseShareCardRequest', () => {
  it('resolves a moment by id or slug', () => {
    expect(parse('?item=interrupted-speech').spec).toMatchObject({
      kind: 'moment',
      title: confirmed.title,
      stamp: null,
    });
    expect(parse(`?item=${confirmed.slug}`).spec).toMatchObject({ kind: 'moment' });
  });

  it('falls back to the default card for unknown ids and inherited property names', () => {
    for (const qs of ['?item=nope', '?item=toString', '?era=hasOwnProperty', '?eras=__proto__']) {
      expect(parse(qs).spec.kind, qs).toBe('default');
    }
  });

  it('allowlists, dedupes and caps the My Eras list at three', () => {
    const spec = parse('?eras=red,bogus,red,lover,1989,debut&m=1&e=1&f=1').spec;
    expect(spec.kind).toBe('myEras');
    if (spec.kind === 'myEras')
      expect(spec.eras.map((e) => e.id)).toEqual(['red', 'lover', '1989']);
  });

  it('buckets counts so arbitrary numbers cannot mint cache keys', () => {
    const spec = parse('?eras=red&m=37&e=999999&f=2').spec;
    expect(spec).toMatchObject({ kind: 'myEras', moments: 25, eggs: 1000, favorites: 1 });
    expect(parse('?eras=red&m=abc&e=-3&f=').spec).toMatchObject({
      moments: 0,
      eggs: 0,
      favorites: 0,
    });
  });
});

describe('leadSentences', () => {
  it('keeps whole sentences within the budget and never splits "No. 13"', () => {
    const text =
      'Fans are reading the tea leaves on album No. 13. The signs so far are thin. A third, much longer sentence follows here.';
    expect(leadSentences(text, 90)).toBe(
      'Fans are reading the tea leaves on album No. 13. The signs so far are thin.',
    );
    expect(leadSentences(text, 60)).toBe('Fans are reading the tea leaves on album No. 13.');
  });

  it('word-truncates a lone sentence that is over budget', () => {
    const long = `${'word '.repeat(80)}end.`;
    const out = leadSentences(long, 100);
    expect(out.length).toBeLessThanOrEqual(104);
    expect(out.endsWith('…') || out.endsWith('...')).toBe(true);
  });
});

describe('card content', () => {
  const treeText = (qs: string) => {
    const { spec, size } = parse(qs);
    return textOf(buildShareCardTree(spec, size));
  };

  it('stamps a sub-confirmed moment "Unconfirmed" and a confirmed one not at all', () => {
    expect(treeText('?item=rumored-collab')).toContain('Unconfirmed');
    expect(treeText('?item=interrupted-speech')).not.toContain('Unconfirmed');
  });

  it('carries the watermark on every format and size', () => {
    for (const size of ['portrait', 'story']) {
      for (const qs of ['?item=interrupted-speech', '?era=red', '?eras=red,lover', '?item=nope']) {
        expect(treeText(`${qs}${qs ? '&' : '?'}size=${size}`)).toContain(SHARE_CARD_WATERMARK);
      }
    }
    expect(SHARE_CARD_WATERMARK).toBe('Fan-made · longlivets.com');
  });

  it('never renders era lyrics', () => {
    for (const era of ERAS) {
      if (!era.lyric) continue;
      expect(treeText(`?era=${era.id}`)).not.toContain(era.lyric.line);
      expect(treeText(`?item=interrupted-speech&era=${era.id}`)).not.toContain(era.lyric.line);
    }
  });

  it('paints with the era palette, not a hard-coded one', () => {
    for (const id of ['fearless', 'red', 'ttpd']) {
      const { spec, size } = parse(`?era=${id}`);
      const css = JSON.stringify(stylesOf(buildShareCardTree(spec, size)));
      expect(css).toContain(getEra(id).theme.accent);
      expect(css).toContain(getEra(id).theme.ink);
    }
  });

  it('keeps all content inside the story safe zones', () => {
    const { spec, size } = parse('?item=interrupted-speech&size=story');
    const column = stylesOf(buildShareCardTree(spec, size)).find(
      (s) => typeof s.top === 'number' && typeof s.bottom === 'number' && s.top >= 0,
    );
    expect(column).toBeDefined();
    expect(column!.top).toBeGreaterThanOrEqual(250);
    expect(column!.bottom).toBeGreaterThanOrEqual(250);
    expect(STORY_SAFE_Y).toBeGreaterThanOrEqual(250);
  });
});

describe('GET /api/share-card rate limit', () => {
  it('returns 429 once a single IP exceeds the per-minute limit', () => {
    const hit = () =>
      GET(new Request('http://localhost/api/share-card?bogus=1', { headers: { 'x-real-ip': '203.0.113.8' } }) as never);
    for (let i = 0; i < 120; i++) expect(hit().status).not.toBe(429);
    const limited = hit();
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
  });
});
