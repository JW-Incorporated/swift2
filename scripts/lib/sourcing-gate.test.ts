import { describe, expect, it } from 'vitest';
import {
  SINGLE_OUTLET_LEGACY,
  TWO_OUTLET_CATEGORIES,
  UNSOURCED_LEGACY,
  classifySource,
  independentOutlets,
  isWeakSource,
  momentKey,
  registrableDomain,
} from './sourcing-gate.mjs';

// --- the ratchet, asserted -------------------------------------------------
// Both lists are grandfather lists for records that predate their gate. The
// gate is only worth anything if the lists can shrink and never grow, so the
// ceilings below are the sizes on the day each gate went up (2026-08-11).
// Sourcing a record and deleting its entry makes these pass with room to
// spare. Adding an entry to make a build green makes them FAIL — which is the
// entire point, and is why this is a test and not a comment.
const UNSOURCED_CEILING = 1;
const SINGLE_OUTLET_CEILING = 25;

describe('the grandfather lists only ever shrink', () => {
  it(`UNSOURCED_LEGACY never exceeds its ${UNSOURCED_CEILING}-entry ceiling`, () => {
    expect(UNSOURCED_LEGACY.size).toBeLessThanOrEqual(UNSOURCED_CEILING);
  });

  it(`SINGLE_OUTLET_LEGACY never exceeds its ${SINGLE_OUTLET_CEILING}-entry ceiling`, () => {
    expect(SINGLE_OUTLET_LEGACY.size).toBeLessThanOrEqual(SINGLE_OUTLET_CEILING);
  });

  it('every entry is a <file>#<identity> key, so a typo cannot become a silent exemption', () => {
    // validate-content.mjs also errors on any entry matching no record; this
    // catches the shape before it gets that far.
    for (const key of [...UNSOURCED_LEGACY, ...SINGLE_OUTLET_LEGACY]) {
      expect(key, key).toMatch(/^[a-z0-9-]+\.mjs#[a-z0-9-]+$/);
    }
  });

  it('no key is on both lists (they answer different questions)', () => {
    for (const key of UNSOURCED_LEGACY) expect(SINGLE_OUTLET_LEGACY.has(key)).toBe(false);
  });
});

describe('isWeakSource', () => {
  it('rejects the three types the rubric says never satisfy a factual claim', () => {
    for (const source_type of ['wiki', 'fan_forum', 'social']) {
      expect(isWeakSource({ url: 'https://example.com/a', source_type })).toBe(true);
    }
  });

  it('rejects a wiki/forum/social HOST even when source_type is missing', () => {
    // Most pre-audit citations carry no source_type at all, so type alone
    // would wave through exactly the "sourced entirely to Wikipedia" case.
    for (const url of [
      'https://en.wikipedia.org/wiki/Fearless',
      'https://taylorswift.fandom.com/wiki/Red',
      'https://www.reddit.com/r/TaylorSwift/comments/x',
      'https://x.com/taylorswift13/status/1',
      'https://www.instagram.com/p/ABC/',
    ]) {
      expect(isWeakSource({ url }), url).toBe(true);
    }
  });

  it('accepts a reputable outlet', () => {
    expect(isWeakSource({ url: 'https://www.npr.org/a', source_type: 'reputable_press' })).toBe(
      false,
    );
    expect(isWeakSource({ url: 'https://www.grammy.com/news/a' })).toBe(false);
  });

  it('treats a missing/garbage citation as weak rather than assuming the best', () => {
    expect(isWeakSource(null)).toBe(true);
    expect(isWeakSource({})).toBe(true);
  });
});

describe('independentOutlets', () => {
  it('counts two different outlets as two', () => {
    expect(
      independentOutlets([
        { url: 'https://www.npr.org/a', publisher: 'NPR' },
        { url: 'https://time.com/b', publisher: 'TIME' },
      ]),
    ).toBe(2);
  });

  it('counts two articles from the SAME outlet as one', () => {
    // The common near-miss: two Billboard pieces about one chart week are not
    // independent corroboration, however differently they are titled.
    expect(
      independentOutlets([
        { url: 'https://www.billboard.com/a', publisher: 'Billboard' },
        { url: 'https://www.billboard.com/b', publisher: 'Billboard (chart beat)' },
      ]),
    ).toBe(1);
  });

  it('ignores www so one outlet is not double-counted by url style', () => {
    expect(
      independentOutlets([
        { url: 'https://www.npr.org/a' },
        { url: 'https://npr.org/b' },
      ]),
    ).toBe(1);
  });

  it('does not let a wiki make up the second outlet', () => {
    expect(
      independentOutlets([
        { url: 'https://time.com/a', publisher: 'TIME' },
        { url: 'https://en.wikipedia.org/wiki/A', publisher: 'Wikipedia' },
      ]),
    ).toBe(1);
  });

  it('returns 0 for nothing, and for a citation list with no url', () => {
    expect(independentOutlets(undefined)).toBe(0);
    expect(independentOutlets([])).toBe(0);
    expect(independentOutlets([{ publisher: 'Nowhere' }])).toBe(0);
  });

  it('reads either the legacy `url` or the audit §5 `source_url`', () => {
    expect(
      independentOutlets([
        { url: 'https://time.com/a' },
        { source_url: 'https://www.npr.org/b' },
      ]),
    ).toBe(2);
  });
});

// --- issue #2036: outlet identity, not hostname ----------------------------
// The regression that filed the ticket: independence was keyed on URL host,
// so any youtube.com link — including an anonymous fan re-upload — counted
// as one full independent outlet, and two fan re-uploads counted as two.
// Two real records were promoted over the two-outlet bar on exactly that.
describe('video platforms are evidence, never outlets (issue #2036)', () => {
  it('REGRESSION #2036: two fan re-uploads of the same event are zero independent outlets', () => {
    expect(
      independentOutlets([
        { url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa', source_type: 'video' },
        { url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb', source_type: 'video' },
      ]),
    ).toBe(0);
  });

  it('REGRESSION #2036: a fan re-upload cannot be the second outlet behind a claim', () => {
    expect(
      independentOutlets([
        { url: 'https://www.billboard.com/a', publisher: 'Billboard' },
        { url: 'https://www.youtube.com/watch?v=ccccccccccc', publisher: 'YouTube' },
      ]),
    ).toBe(1);
  });

  it('an OFFICIAL-channel upload plus one press outlet is still one outlet — an official upload is the subject\'s own primary source, not independent corroboration', () => {
    expect(
      independentOutlets([
        { url: 'https://www.youtube.com/watch?v=ddddddddddd', source_type: 'official' },
        { url: 'https://www.npr.org/a', publisher: 'NPR' },
      ]),
    ).toBe(1);
  });

  it('unknown provenance counts conservatively: like a fan upload, zero', () => {
    // No source_type at all — the common case. Never assume official.
    expect(independentOutlets([{ url: 'https://youtu.be/eeeeeeeeeee' }])).toBe(0);
    expect(classifySource({ url: 'https://youtu.be/eeeeeeeeeee' })).toEqual({
      role: 'evidence',
      provenance: 'unknown',
    });
  });

  it('official upload and fan re-upload stay distinguishable in classification', () => {
    expect(
      classifySource({ url: 'https://www.youtube.com/watch?v=x', source_type: 'official' }),
    ).toEqual({ role: 'evidence', provenance: 'official' });
    expect(
      classifySource({ url: 'https://www.youtube.com/watch?v=x', source_type: 'fan_archive' }),
    ).toEqual({ role: 'evidence', provenance: 'fan' });
  });

  it('subdomains and short-link domains of a platform are the platform', () => {
    for (const url of [
      'https://music.youtube.com/watch?v=x',
      'https://youtu.be/x',
      'https://vimeo.com/12345',
      'https://www.dailymotion.com/video/x',
    ]) {
      expect(classifySource({ url }).role, url).toBe('evidence');
    }
  });

  it('a video-platform link is NOT "weak" — it satisfies the one-source minimum, it just corroborates nothing', () => {
    // Same behavior as before #2036: the link-first model still accepts an
    // official upload as a moment's source; only the independence count changed.
    expect(isWeakSource({ url: 'https://www.youtube.com/watch?v=x', source_type: 'official' })).toBe(
      false,
    );
  });
});

describe('outlet identity is the registrable domain, and unknowns count zero', () => {
  it('two subdomains of one outlet are ONE identity — url styling cannot mint a second outlet', () => {
    expect(
      independentOutlets([
        { url: 'https://music.example.com/a' },
        { url: 'https://www.example.com/b' },
      ]),
    ).toBe(1);
  });

  it('keeps UK-style outlets apart: bbc.co.uk is not "co.uk"', () => {
    expect(registrableDomain('www.bbc.co.uk')).toBe('bbc.co.uk');
    expect(
      independentOutlets([
        { url: 'https://www.bbc.co.uk/news/a' },
        { url: 'https://www.theguardian.com/b' },
      ]),
    ).toBe(2);
  });

  it('an unparseable URL identifies nobody and counts zero (it used to count as a full outlet)', () => {
    expect(classifySource({ url: 'not a url at all' })).toEqual({ role: 'unusable' });
    expect(
      independentOutlets([{ url: 'not a url at all' }, { url: 'also::not::a::url' }]),
    ).toBe(0);
  });
});

describe('momentKey', () => {
  it('prefers the item slug when it has one', () => {
    expect(momentKey('red.mjs', { slug: 'red-snl', title: 'A run of TV performances' })).toBe(
      'red.mjs#red-snl',
    );
  });

  it('falls back to slugify(title) — most moments carry no slug', () => {
    expect(momentKey('lover.mjs', { title: "She's Billboard's first-ever Woman of the Decade" })).toBe(
      'lover.mjs#shes-billboards-first-ever-woman-of-the-decade',
    );
  });
});

describe('TWO_OUTLET_CATEGORIES', () => {
  it('is exactly the two categories the editorial doc names', () => {
    expect([...TWO_OUTLET_CATEGORIES].sort()).toEqual(['business', 'relationship']);
  });
});
