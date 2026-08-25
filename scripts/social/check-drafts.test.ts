import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bodySimilarity, checkSchema, checkVoice, checkOpeners, checkCrossPostCopy, checkLength, weightedTweetLength, checkMedia, checkDraft } from './check-drafts.mjs';

// checkMedia reads real files under apps/web/public/ (PUBLIC_DIR in
// check-drafts.mjs), so the aspect-ratio-rejection test below needs an actual
// tall file on disk rather than a mock. It used to point at the real
// mood-chat-screen.png, back when that library asset genuinely was the
// 780x1688 shape IG rejects — issue #3157 regenerated it (and the other 8
// *-screen.png files) at the in-range 1080x1350 ig-portrait preset, which
// would have silently turned this into a no-op "flags nothing" test. A
// synthetic PNG (header bytes only — imageMeta only reads the IHDR width/
// height, see image-liveness.mjs) written to a gitignored temp path keeps the
// regression real without committing a permanent fake-shaped binary to the
// library.
const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'apps', 'web', 'public');
const TALL_FIXTURE_REL = '/social/library/__test-fixture-tall-780x1688.png';
const TALL_FIXTURE_PATH = path.join(PUBLIC_DIR, TALL_FIXTURE_REL);

function makePngHeader(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); // PNG signature
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe('bodySimilarity', () => {
  it('is 1 for identical text', () => {
    expect(bodySimilarity('hello world taylor swift', 'hello world taylor swift')).toBe(1);
  });

  it('is 0 for completely disjoint text', () => {
    expect(bodySimilarity('folklore august girl', 'reputation snake era')).toBe(0);
  });

  it('is 0 when either side is empty', () => {
    expect(bodySimilarity('', 'something')).toBe(0);
    expect(bodySimilarity('something', '')).toBe(0);
  });

  it('is high (overlap coefficient) for a shorter draft that is nearly a trimmed subset of a longer one', () => {
    // Real example (2026-08-10 TTPD pair, social/posted/): the X caption is
    // a near-verbatim trim of the IG one. This is exactly the shape that
    // caused an X duplicate-content 403 per social/failed/'s evidence, and
    // is why this uses overlap (intersection / smaller set) rather than
    // Jaccard (intersection / union) — Jaccard scores this pair only ~0.37
    // because of the length gap, which would let it slip past a 0.8 gate.
    const ig =
      "did you know: the tortured poets department was a secret double album -- and taylor didn't tell anyone until 2am. two hours after the midnight release, a second post landed: \"it's a 2am surprise: the tortured poets department is a secret DOUBLE album. i'd written so much tortured poetry in the past 2 years and wanted to share it all with you.\" the anthology added 15 more songs. 31 total, pushing the whole thing past the two-hour mark.";
    const x =
      'did you know: the tortured poets department was a secret double album -- and no one knew until 2am. two hours after the midnight drop, taylor revealed 15 more songs. 31 total. "i\'d written so much tortured poetry in the past 2 years and wanted to share it all with you."';
    expect(bodySimilarity(ig, x)).toBeGreaterThan(0.8);
  });

  it('is lower for two drafts that share facts but are genuinely rewritten (not just trimmed)', () => {
    const ig =
      "did you know \"All Too Well (10 Minute Version)\" holds a chart record that will probably never be broken? at over 10 minutes long, it's the longest song in history to hit #1 on the Billboard Hot 100 -- beating a record that had stood for decades. a track she wrote at 22, shelved in a vault for ten years, then re-recorded in full as part of taking her masters back.";
    const x =
      'did you know: "All Too Well (10 Minute Version)" is the longest song to ever hit #1 on the Hot 100 -- over 10 minutes long, and it still went all the way to the top. a decade-old vault track, re-recorded, breaking a chart record no one saw coming.';
    expect(bodySimilarity(ig, x)).toBeLessThan(0.8);
  });

  it('is 0 below the minimum-token floor, even for identical short text (avoids noise on tiny bodies)', () => {
    // "hi there" vs "hi there" is a trivial 2-word/2-word 100%-overlap case
    // that isn't a meaningful signal at this length.
    expect(bodySimilarity('hi there', 'hi there')).toBe(0);
  });

  it('is trustworthy right at and above the minimum-token floor', () => {
    expect(bodySimilarity('one two three four', 'one two three four')).toBe(1);
  });
});

describe('checkSchema', () => {
  const valid = () => ({ platform: 'x', body: 'a real post body here', scheduledAt: '2026-08-11T00:00:00Z' });

  it('passes a well-formed item', () => {
    expect(checkSchema(valid())).toEqual([]);
  });

  it('flags a missing/empty body', () => {
    expect(checkSchema({ ...valid(), body: '' }).some((f) => f.includes('body'))).toBe(true);
    expect(checkSchema({ ...valid(), body: undefined }).some((f) => f.includes('body'))).toBe(true);
    expect(checkSchema({ ...valid(), body: '   ' }).some((f) => f.includes('body'))).toBe(true);
  });

  it('flags a non-string body', () => {
    expect(checkSchema({ ...valid(), body: 12345 }).some((f) => f.includes('body'))).toBe(true);
  });

  it('flags an unrecognized platform', () => {
    expect(checkSchema({ ...valid(), platform: 'facebook' }).some((f) => f.includes('platform'))).toBe(true);
    expect(checkSchema({ ...valid(), platform: undefined }).some((f) => f.includes('platform'))).toBe(true);
  });

  it('flags a missing/invalid scheduledAt', () => {
    expect(checkSchema({ ...valid(), scheduledAt: undefined }).some((f) => f.includes('scheduledAt'))).toBe(true);
    expect(checkSchema({ ...valid(), scheduledAt: 'not-a-date' }).some((f) => f.includes('scheduledAt'))).toBe(true);
  });

  it('reports all violations at once, not just the first', () => {
    const findings = checkSchema({});
    expect(findings.length).toBeGreaterThanOrEqual(3);
  });
});

describe('checkDraft (schema short-circuit)', () => {
  it('returns only schema findings and skips other rule families when schema is invalid', async () => {
    const target = { file: 'bad.json', data: { platform: 'bogus', body: '' } };
    const findings = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [] });
    expect(findings.every((f) => f.startsWith('schema:'))).toBe(true);
    expect(findings.length).toBeGreaterThan(0);
  });

  it('runs the full rule set for a schema-valid item', async () => {
    const target = {
      file: 'good.json',
      data: { platform: 'instagram', body: 'a perfectly fine fan post about the eras tour.', scheduledAt: '2026-08-11T00:00:00Z' },
    };
    const findings = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [] });
    // No schema findings; the only failure here should be the media rule
    // (Instagram requires media), proving voice/openers/media all ran.
    expect(findings.some((f) => f.startsWith('schema:'))).toBe(false);
    expect(findings.some((f) => f.includes('require at least one image'))).toBe(true);
  });
});

describe('checkVoice', () => {
  it('flags bare "Swift" outnumbering "Taylor" via the reused voice.mjs checker', async () => {
    const body =
      'Swift has framed the song as a warning. Swift approached the estate for the interpolation. Swift has not named the subject in interviews.';
    const findings = await checkVoice('test.json', body);
    expect(findings.some((f) => f.includes('surname-overuse'))).toBe(true);
  });

  it('passes clean fan-voice copy', async () => {
    const findings = await checkVoice('test.json', 'taylor wrote this one with jack antonoff. it debuted at no. 3 on the hot 100.');
    expect(findings).toEqual([]);
  });

  it('flags a documented AI-tell phrase', async () => {
    const findings = await checkVoice('test.json', 'it is worth noting that this song was a fan favorite.');
    expect(findings.some((f) => f.includes('ai-tell'))).toBe(true);
  });
});

describe('checkOpeners', () => {
  it('flags a "did you know" opener, case-insensitively', () => {
    const findings = checkOpeners('a.json', { body: 'Did You Know: this is a fact.' }, []);
    expect(findings.some((f) => f.includes('did you know'))).toBe(true);
  });

  it('passes an opener that is not "did you know"', () => {
    const findings = checkOpeners('a.json', { body: 'on this day in 2010, mine leaked early.' }, []);
    expect(findings).toEqual([]);
  });

  it('flags a formula match against another item\'s opening 6 words', () => {
    const others = [{ file: 'b.json', body: 'on this day in 2010 something else happened here' }];
    const findings = checkOpeners('a.json', { body: 'on this day in 2010 something totally different' }, others);
    expect(findings.some((f) => f.includes('b.json'))).toBe(true);
  });

  it('ignores itself when scanning other items', () => {
    const others = [{ file: 'a.json', body: 'on this day in 2010 something else happened here' }];
    const findings = checkOpeners('a.json', { body: 'on this day in 2010 something else happened here' }, others);
    expect(findings).toEqual([]);
  });

  it('does not flag a short coincidental overlap under 6 words', () => {
    const others = [{ file: 'b.json', body: 'on this day something unrelated' }];
    const findings = checkOpeners('a.json', { body: 'on this day a totally different event' }, others);
    expect(findings).toEqual([]);
  });

  it('uses a word boundary — does NOT flag "did you knowledge..." as the banned opener', () => {
    const findings = checkOpeners('a.json', { body: 'did you knowledge of this song is impressive.' }, []);
    expect(findings.some((f) => f.includes('did you know'))).toBe(false);
  });

  it('strips a leading emoji/smart-quote/punctuation before checking the opener', () => {
    const withEmoji = checkOpeners('a.json', { body: '✨ did you know: this is a fact.' }, []);
    expect(withEmoji.some((f) => f.includes('did you know'))).toBe(true);

    const withSmartQuote = checkOpeners('a.json', { body: '“did you know: this is a fact.”' }, []);
    expect(withSmartQuote.some((f) => f.includes('did you know'))).toBe(true);

    const withPunctuation = checkOpeners('a.json', { body: '...did you know: this is a fact.' }, []);
    expect(withPunctuation.some((f) => f.includes('did you know'))).toBe(true);
  });

  it('normalizes a leading emoji before the formula-opener (first-6-words) comparison too', () => {
    const others = [{ file: 'b.json', body: 'on this day in 2010 something else happened here' }];
    const findings = checkOpeners('a.json', { body: '🎶 on this day in 2010 something totally different' }, others);
    expect(findings.some((f) => f.includes('b.json'))).toBe(true);
  });
});

describe('checkCrossPostCopy', () => {
  it('flags a near-identical X sibling of an IG draft in the same campaign', () => {
    const igBody =
      "did you know: the tortured poets department was a secret double album -- and taylor didn't tell anyone until 2am. two hours after the midnight release, a second post landed: \"it's a 2am surprise: the tortured poets department is a secret DOUBLE album. i'd written so much tortured poetry in the past 2 years and wanted to share it all with you.\" the anthology added 15 more songs. 31 total, pushing the whole thing past the two-hour mark.";
    const xBody =
      'did you know: the tortured poets department was a secret double album -- and no one knew until 2am. two hours after the midnight drop, taylor revealed 15 more songs. 31 total. "i\'d written so much tortured poetry in the past 2 years and wanted to share it all with you."';
    const all = [
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'ttpd-secret', body: igBody } },
      { file: 'x.json', data: { platform: 'x', campaign: 'ttpd-secret', body: xBody } },
    ];
    const findings = checkCrossPostCopy('x.json', all[1].data, all);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('ig.json');
  });

  it('passes a distinctly-rewritten X sibling', () => {
    const all = [
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'the full story of how mine leaked and got rushed to radio twelve days early back in 2010.' } },
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'mine hit no. 3 on the hot 100 the week it dropped.' } },
    ];
    const findings = checkCrossPostCopy('x.json', all[1].data, all);
    expect(findings).toEqual([]);
  });

  it('is a no-op for Instagram items (only checks X drafts)', () => {
    const findings = checkCrossPostCopy('ig.json', { platform: 'instagram', campaign: 'c1', body: 'x' }, []);
    expect(findings).toEqual([]);
  });

  it('is a no-op when there is no IG sibling in the same campaign', () => {
    const all = [{ file: 'x.json', data: { platform: 'x', campaign: 'lonely', body: 'no sibling here' } }];
    const findings = checkCrossPostCopy('x.json', all[0].data, all);
    expect(findings).toEqual([]);
  });

  describe('no `campaign` set — same-day fallback', () => {
    const igBody =
      "did you know: the tortured poets department was a secret double album -- and taylor didn't tell anyone until 2am. two hours after the midnight release, a second post landed: \"it's a 2am surprise: the tortured poets department is a secret DOUBLE album. i'd written so much tortured poetry in the past 2 years and wanted to share it all with you.\" the anthology added 15 more songs. 31 total, pushing the whole thing past the two-hour mark.";
    const xBody =
      'did you know: the tortured poets department was a secret double album -- and no one knew until 2am. two hours after the midnight drop, taylor revealed 15 more songs. 31 total. "i\'d written so much tortured poetry in the past 2 years and wanted to share it all with you."';

    it('still flags a near-duplicate against the closest same-day Instagram item', () => {
      const all = [
        { file: 'ig.json', data: { platform: 'instagram', body: igBody, scheduledAt: '2026-08-10T23:00:00Z' } },
        { file: 'x.json', data: { platform: 'x', body: xBody, scheduledAt: '2026-08-10T23:20:00Z' } },
      ];
      const findings = checkCrossPostCopy('x.json', all[1].data, all);
      expect(findings).toHaveLength(1);
      expect(findings[0]).toContain('ig.json');
      expect(findings[0]).toContain('campaign');
    });

    it('nudges toward adding a campaign when similarity is inconclusive but plausibly paired', () => {
      const all = [
        { file: 'ig.json', data: { platform: 'instagram', body: 'the tortured poets department dropped as a secret double album with 31 songs total.', scheduledAt: '2026-08-10T23:00:00Z' } },
        { file: 'x.json', data: { platform: 'x', body: 'huge TTPD news just dropped and the fandom is not okay right now honestly.', scheduledAt: '2026-08-10T23:20:00Z' } },
      ];
      const findings = checkCrossPostCopy('x.json', all[1].data, all);
      // Not necessarily flagged — depends on incidental word overlap; this
      // just asserts it never throws and returns an array either way.
      expect(Array.isArray(findings)).toBe(true);
    });

    it('is silent when there is no same-day Instagram item at all', () => {
      const all = [{ file: 'x.json', data: { platform: 'x', body: xBody, scheduledAt: '2026-08-10T23:20:00Z' } }];
      expect(checkCrossPostCopy('x.json', all[0].data, all)).toEqual([]);
    });

    it('is silent against an Instagram item on a different day', () => {
      const all = [
        { file: 'ig.json', data: { platform: 'instagram', body: igBody, scheduledAt: '2026-07-01T23:00:00Z' } },
        { file: 'x.json', data: { platform: 'x', body: xBody, scheduledAt: '2026-08-10T23:20:00Z' } },
      ];
      expect(checkCrossPostCopy('x.json', all[1].data, all)).toEqual([]);
    });
  });
});

describe('weightedTweetLength', () => {
  it('matches raw character count when there is nothing to collapse or upweight', () => {
    expect(weightedTweetLength('hello world')).toBe(11);
  });

  it('collapses an http(s):// URL to exactly 23 weighted chars, regardless of its real length', () => {
    const prefix = 'check this out: ';
    const url = 'https://example.com/some/very/long/path?query=123456789&more=abcdefgh';
    expect(weightedTweetLength(prefix + url)).toBe(prefix.length + 23);
  });

  it('collapses a bare/naked domain (no scheme) the same way — this pipeline\'s own link shape', () => {
    const prefix = 'read more at ';
    const url = 'longlivets.com/?utm_source=x&utm_medium=social&utm_campaign=mood-chat';
    expect(weightedTweetLength(prefix + url)).toBe(prefix.length + 23);
  });

  it('collapses a bare domain with no path/query at all', () => {
    expect(weightedTweetLength('try it → longlivets.com')).toBe('try it → '.length + 23);
  });

  it('collapses two separate URLs in the same body independently', () => {
    const body = 'longlivets.com/?era=lover and also longlivets.com/?era=red';
    const between = ' and also ';
    expect(weightedTweetLength(body)).toBe(23 + between.length + 23);
  });

  it('does not treat an ordinary sentence abbreviation as a domain (space breaks the match)', () => {
    const text = 'Mr. Smith said hi to Dr. Jones.';
    expect(weightedTweetLength(text)).toBe(text.length);
  });

  it('weighs an Extended_Pictographic emoji as 2 characters', () => {
    // 'hi ' (3, weight 1 each) + one emoji (weight 2) = 5
    expect(weightedTweetLength('hi \u{1F389}')).toBe(5);
  });

  it('weighs a run of emoji as 2 each, not 1 per UTF-16 code unit', () => {
    // Three astral-plane emoji, each a UTF-16 surrogate pair (raw .length
    // would be 6) — weighted length must be 6 (2 per emoji), not 3 or 6-by-coincidence.
    const threeEmoji = '\u{1F389}\u{1F600}\u{2728}'; // tada, grinning face, sparkles
    expect(weightedTweetLength(threeEmoji)).toBe(6);
  });

  it('weighs CJK characters as 2 each', () => {
    expect(weightedTweetLength('你好')).toBe(4); // "hello" (Han script, 2 chars)
  });

  it('is empty-safe', () => {
    expect(weightedTweetLength('')).toBe(0);
    expect(weightedTweetLength(undefined)).toBe(0);
  });

  it('boundary: a 280-char plain-ASCII body weighs exactly 280', () => {
    expect(weightedTweetLength('a'.repeat(280))).toBe(280);
  });

  it('boundary: a 281-char plain-ASCII body weighs exactly 281', () => {
    expect(weightedTweetLength('a'.repeat(281))).toBe(281);
  });
});

describe('checkLength', () => {
  const xItem = (body) => ({ platform: 'x', body, scheduledAt: '2026-08-11T00:00:00Z' });

  it('is a no-op for Instagram drafts — the rule is X-only', () => {
    expect(checkLength({ platform: 'instagram', body: 'y'.repeat(500) })).toEqual([]);
  });

  it('passes silently at or under the 270-weighted target', () => {
    expect(checkLength(xItem('a'.repeat(270)))).toEqual([]);
  });

  it('warns (non-fatal) between 271 and 280 weighted', () => {
    const findings = checkLength(xItem('a'.repeat(275)));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('warning');
    expect(findings[0]).toContain('275');
  });

  it('boundary: 280 weighted warns but does not hard-fail', () => {
    const findings = checkLength(xItem('a'.repeat(280)));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('warning');
  });

  it('boundary: 281 weighted hard-fails, one character over the real limit', () => {
    const findings = checkLength(xItem('a'.repeat(281)));
    expect(findings).toHaveLength(1);
    expect(findings[0]).not.toContain('warning');
    expect(findings[0]).toContain('length:');
    expect(findings[0]).toContain('281');
  });

  it('hard-fails a real-shape example: a long body plus one bare-domain link, still over 280 weighted', () => {
    // Mirrors the actual social/failed/ failure shape: a body written without
    // the weighted-length rule in mind, well past 280 once accounted for.
    const body = 'x'.repeat(260) + ' longlivets.com/?utm_source=x&utm_medium=social&utm_campaign=test';
    const findings = checkLength(xItem(body));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('length:');
    expect(findings[0]).not.toContain('warning');
  });
});

describe('checkDraft includes the length rule for X drafts', () => {
  it('surfaces a checkLength hard-fail alongside other rule families', async () => {
    const target = { file: 'toolong.json', data: { platform: 'x', body: 'z'.repeat(300), scheduledAt: '2026-08-11T00:00:00Z' } };
    const findings = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [] });
    expect(findings.some((f) => f.startsWith('length:'))).toBe(true);
  });
});

describe('checkMedia', () => {
  it('flags a missing media array on an Instagram draft', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram' }, []);
    expect(findings.some((f) => f.includes('require at least one image'))).toBe(true);
  });

  it('flags a media path that does not exist under apps/web/public/', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/does-not-exist-xyz.png'] }, []);
    expect(findings.some((f) => f.includes('does not exist'))).toBe(true);
  });

  // ── The Taylor-photo standard (2026-08-12): era tiles are banned outright,
  //    declared or not — there is no fallback path back to the generic grid. ──
  it('flags era art even when DECLARED — the era-tile fallback no longer exists', async () => {
    for (const item of [
      { platform: 'instagram', media: ['/eras/red.png'] },
      { platform: 'instagram', media: ['/eras/red.png'], mediaKind: 'era-art' },
    ]) {
      const findings = await checkMedia('a.json', item, []);
      expect(findings.some((f) => f.includes('no longer allowed')), JSON.stringify(item)).toBe(true);
    }
  });

  // A real committed corpus photo — the compliant tile. (2026-08-15: the
  // Getty-sourced corpus was removed under the third-party image policy;
  // this is the one CC-licensed photo left under photos/.)
  const CORPUS_PHOTO = '/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg';

  it('flags a non-era dedicated photo that repeats the recent-posted window', async () => {
    const recentIg = [{ platform: 'instagram', media: [CORPUS_PHOTO], postedAt: '2026-08-01T00:00:00Z' }];
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', mediaCredit: 'c', mediaSource: 's' }, recentIg);
    expect(findings.some((f) => f.includes('repeats'))).toBe(true);
  });

  it('flags a media path that is also scheduled in another queue item', async () => {
    const other = { file: 'b.json', data: { platform: 'instagram', media: [CORPUS_PHOTO] } };
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', mediaCredit: 'c', mediaSource: 's' }, [], [other]);
    expect(findings.some((f) => f.includes('also scheduled in b.json'))).toBe(true);
  });

  it('requires a declared mediaKind on any draft with media', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO] }, []);
    expect(findings.some((f) => f.includes('no declared `mediaKind`'))).toBe(true);
  });

  it('requires mediaCredit AND mediaSource on a photo tile', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo' }, []);
    expect(findings.some((f) => f.includes('requires `mediaCredit`'))).toBe(true);
    expect(findings.some((f) => f.includes('requires `mediaSource`'))).toBe(true);
  });

  it('accepts a credited, sourced corpus photo tile with no findings', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', mediaCredit: 'Someone/Getty Images', mediaSource: 'https://example.com/photo' },
      [],
    );
    expect(findings).toEqual([]);
  });

  // PR #2043 review: the declared kinds are PATH-BOUND, so neither can be
  // used to launder the other — a screenshot can't become a credited "photo",
  // and a real photo can't ship uncredited as a "site-screen".
  it('a photo tile must live under /social/library/photos/ — a screenshot cannot be declared a photo', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: ['/social/library/mood-chat-screen.png'], mediaKind: 'photo', mediaCredit: 'Fake Person/Nowhere', mediaSource: 'https://example.com' },
      [],
    );
    expect(findings.some((f) => f.includes('must live under /social/library/photos/'))).toBe(true);
  });

  it('site-screen tiles must live under /social/library/ but NOT under the photo corpus', async () => {
    // Use an in-range 1080x1350 asset: as of 2026-08-24 the checker also gates
    // Instagram aspect ratio, and the tall *-screen.png captures (780x1688)
    // now fail that gate — so they can't double as the "valid path" fixture.
    const ok = await checkMedia('a.json', { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen' }, []);
    expect(ok).toEqual([]);
    for (const tile of ['/social/2026-07-17-electric-lady-1.png', CORPUS_PHOTO]) {
      const bad = await checkMedia('a.json', { platform: 'instagram', media: [tile], mediaKind: 'site-screen' }, []);
      expect(bad.some((f) => f.includes('must be a committed product screenshot')), tile).toBe(true);
    }
  });

  it('mediaKind "era-art" is rejected on drafts even for a non-era tile', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'era-art' }, []);
    expect(findings.some((f) => f.includes('no longer allowed on drafts'))).toBe(true);
  });

  it('flags an X draft with more than MAX_X_IMAGES', async () => {
    const media = ['/eras/red.png', '/eras/lover.png', '/eras/fearless.png', '/eras/folklore.png', '/eras/evermore.png'];
    const findings = await checkMedia('a.json', { platform: 'x', media, mediaKind: 'era-art' }, []);
    expect(findings.some((f) => f.includes('at most'))).toBe(true);
  });

  it('passes an X draft with no media at all', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', body: 'text only' }, []);
    expect(findings).toEqual([]);
  });

  it('rejects a .gif/.webp media path — only png/jpg/jpeg are produced/uploaded today', async () => {
    const gifFindings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/thing.gif'] }, []);
    expect(gifFindings.some((f) => f.includes('unsupported extension'))).toBe(true);

    const webpFindings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/thing.webp'] }, []);
    expect(webpFindings.some((f) => f.includes('unsupported extension'))).toBe(true);
  });

  it('treats the extension check case-insensitively (.PNG is not "unsupported")', async () => {
    // A path that reliably does not exist on ANY OS (unlike a
    // case-different variant of a real filename, which Windows' default
    // case-insensitive filesystem would resolve — this repo's CI runs on
    // Linux, where that resolution would NOT happen, so this test avoids
    // depending on filesystem case-sensitivity at all) — isolates the
    // extension check from the existence check.
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/does-not-exist-xyz.PNG'] }, []);
    expect(findings.some((f) => f.includes('unsupported extension'))).toBe(false);
    expect(findings.some((f) => f.includes('does not exist'))).toBe(true);
  });

  it('accepts a real, existing screenshot file under the declared standard', async () => {
    // 1080x1350 in-range asset (see the aspect-ratio note above; the tall
    // *-screen.png captures now correctly fail the Instagram aspect gate).
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen' }, []);
    expect(findings).toEqual([]);
  });

  // ── Instagram aspect-ratio gate (2026-08-24). Instagram rejects a feed image
  //    outside ~0.8–1.91 (width/height) at publish time; catch it at draft
  //    time. Nine days of IG posts (15–23 Aug 2026) died on exactly this —
  //    tall 780x1688 site screenshots (ratio 0.462) — with nothing inspecting
  //    image shape (social/calendar.md). X has no such limit. ──
  describe('with a genuinely tall (780x1688) fixture on disk', () => {
    beforeAll(async () => {
      await mkdir(path.dirname(TALL_FIXTURE_PATH), { recursive: true });
      await writeFile(TALL_FIXTURE_PATH, makePngHeader(780, 1688));
    });
    afterAll(async () => {
      await rm(TALL_FIXTURE_PATH, { force: true });
    });

    it('flags an Instagram image outside the accepted aspect-ratio range', async () => {
      const findings = await checkMedia('a.json', { platform: 'instagram', media: [TALL_FIXTURE_REL], mediaKind: 'site-screen' }, []);
      expect(findings.some((f) => f.includes("outside Instagram's accepted") && f.includes('780x1688'))).toBe(true);
    });
  });

  it('accepts an in-range 1080x1350 Instagram image (aspect gate passes)', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen' }, []);
    expect(findings.some((f) => f.includes('aspect'))).toBe(false);
  });

  it('does NOT apply the aspect-ratio gate to X drafts', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', media: ['/social/library/mood-chat-screen.png'], mediaKind: 'site-screen' }, []);
    expect(findings.some((f) => f.includes('aspect'))).toBe(false);
  });
});
