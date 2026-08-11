import { describe, expect, it } from 'vitest';
import { bodySimilarity, checkVoice, checkOpeners, checkCrossPostCopy, checkMedia } from './check-drafts.mjs';

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

  it('flags undeclared era art (era-cover path with no mediaKind)', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/eras/red.png'] }, []);
    expect(findings.some((f) => f.includes('mediaKind'))).toBe(true);
  });

  it('passes declared era art not in the recent-posted window', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/eras/red.png'], mediaKind: 'era-art' }, []);
    expect(findings).toEqual([]);
  });

  it('flags declared era art that repeats the recent-posted window', async () => {
    const recentIg = [{ platform: 'instagram', media: ['/eras/red.png'], postedAt: '2026-08-01T00:00:00Z' }];
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/eras/red.png'], mediaKind: 'era-art' }, recentIg);
    expect(findings.some((f) => f.includes('repeats'))).toBe(true);
  });

  it('flags a non-era dedicated photo that repeats the recent-posted window', async () => {
    const dedicated = '/social/2026-07-17-electric-lady-1.png'; // a real, committed, non-era-art file
    const recentIg = [{ platform: 'instagram', media: [dedicated], postedAt: '2026-08-01T00:00:00Z' }];
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [dedicated] }, recentIg);
    expect(findings.some((f) => f.includes('repeats'))).toBe(true);
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
});
