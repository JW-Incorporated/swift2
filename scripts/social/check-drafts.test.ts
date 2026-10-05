import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bodySimilarity, checkSchema, checkVoice, checkOpeners, checkCampaignPair, checkSimultaneousPair, checkCrossPostCopy, checkFastLaneDisplacement, checkLength, weightedTweetLength, checkMedia, checkCritique, checkDraft } from './check-drafts.mjs';
import { contentHash } from './lib/queue.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';

const VALID_CRITIQUE = {
  v: 1,
  scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 },
  total: 23,
  rationale: "This is the Decode thread's origin-story beat, using a dated, verifiable 2012 detail rather than a vibe.",
  rulesChecked: [],
  revision: 1,
};

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

describe('09-08 paired launch preview', () => {
  const photo = {
    photoId: 'fearless-inglewood-2023',
    media: ['/social/library/photos/taylor-fearless-eras-inglewood-2023.jpg'],
    mediaKind: 'photo',
    mediaCredit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
    mediaSource: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_(53109821975).jpg',
    critique: VALID_CRITIQUE,
  };
  const campaign = 'launch:shop-the-look:announce:2026-09-08';
  const queue = [
    { file: '2026-09-08-shop-the-look-ig.json', data: { platform: 'instagram', body: 'Taylor looks have a new home in the app. Find the era, open the look, and see where the details lead.', scheduledAt: '2026-09-08T23:00:00Z', campaign, ...photo } },
    { file: '2026-09-08-shop-the-look-x.json', data: { platform: 'x', body: 'The Taylor look you keep thinking about is now easier to explore. Pick an era and follow the details from there.', scheduledAt: '2026-09-08T23:00:00Z', campaign, ...photo } },
  ];

  it('keeps the 09-08 Instagram/X planner pair credited, inventory-bound, and image-backed', async () => {
    for (const target of queue) {
      expect(target.data.media).toEqual(photo.media);
      expect(target.data.photoId).toBe(photo.photoId);
      expect(target.data.mediaCredit).toBe(photo.mediaCredit);
      expect(target.data.mediaSource).toBe(photo.mediaSource);

      const findings = await checkDraft(target, { allQueue: queue, allPosted: [], openerContext: [], recentIg: [] });
      expect(findings.filter((finding) => !finding.startsWith('length: warning —'))).toEqual([]);
    }
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

describe('checkCampaignPair', () => {
  // The exact shape that broke on 2026-08-26: PR #3356 added two X-only
  // drafts, nothing on the merge path objected, and the day shipped five X
  // posts and zero Instagram ones.
  it('fails an X draft whose campaign has no Instagram sibling', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'track-fact:red-22-favorite-year', body: 'b' } };
    const findings = checkCampaignPair('x.json', x.data, [x], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no instagram sibling');
  });

  it('fails an Instagram draft whose campaign has no X sibling', () => {
    const ig = { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b' } };
    const findings = checkCampaignPair('ig.json', ig.data, [ig], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no x sibling');
  });

  it('passes when the sibling is in the same queue', () => {
    const all = [
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b' } },
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b' } },
    ];
    expect(checkCampaignPair('x.json', all[0].data, all, [])).toEqual([]);
    expect(checkCampaignPair('ig.json', all[1].data, all, [])).toEqual([]);
  });

  // A sibling that already went live weeks ago still satisfies the rule.
  it('passes when the sibling already posted', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b' } };
    const posted = [{ file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b' } }];
    expect(checkCampaignPair('x.json', x.data, [x], posted)).toEqual([]);
  });

  // The exception mechanism was removed entirely 2026-08-26 (Joey: "Always
  // an IG copy. Always.") — no marker, however genuinely worded, suppresses
  // the pairing finding any more. These used to pass under the (now-gone)
  // format-incompatibility carve-out; they must now fail like any other
  // unpaired draft.
  it('rejects a well-worded format-incompatibility marker — no exception exists any more', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', why: 'Single-platform exception: this is a reply in a live X thread and has no standalone IG form.' } };
    const findings = checkCampaignPair('x.json', x.data, [x], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no instagram sibling');
  });

  it('rejects a marker declared on the campaign sibling rather than this file', () => {
    const all = [
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b' } },
      { file: 'x2.json', data: { platform: 'x', campaign: 'c1', body: 'b2', why: 'Single-platform exception: a two-tweet thread with no IG analogue.' } },
    ];
    expect(checkCampaignPair('x.json', all[0].data, all, [])).toHaveLength(1);
  });

  // Verbatim from the two drafts that shipped X-only on 2026-08-26 while
  // Instagram got nothing all day — still fails, same as any other marker.
  it('rejects the calendar/dropped-slot pretext that was actually used', () => {
    const why =
      "Campaign story-unique (findPostedDuplicate matches platform+campaign). Single-platform exception: heartbeat track-fact slot — the calendar assigns this subject to X only; today's IG slot is a different, dropped subject, so there is deliberately no IG sibling for this story.";
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', why } };
    const findings = checkCampaignPair('x.json', x.data, [x], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no instagram sibling');
  });

  it('rejects a missing-media pretext', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', why: 'Single-platform exception: no cleared photo could be sourced for the Instagram half today.' } };
    expect(checkCampaignPair('x.json', x.data, [x], [])).toHaveLength(1);
  });

  it('rejects vague prose as an exception', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', why: 'this one works better on X' } };
    expect(checkCampaignPair('x.json', x.data, [x], [])).toHaveLength(1);
  });

  it('flags a draft with no campaign at all — nothing can be paired to it', () => {
    const findings = checkCampaignPair('x.json', { platform: 'x', body: 'b' }, [], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no `campaign` value');
  });

  it('defers to checkSchema for an unrecognized platform', () => {
    expect(checkCampaignPair('x.json', { platform: 'tiktok', campaign: 'c1', body: 'b' }, [], [])).toEqual([]);
  });

  // 2026-09-05 (#3584) added an `appearance:`-family exemption to this rule;
  // 2026-09-10 (kanban t_bac31b1a, "no single-platform exception of any
  // kind") removed it again — an appearance-lane draft is paired exactly
  // like every other campaign now.
  it('rejects an appearance:-family campaign with no Instagram sibling — the fast-lane exemption is gone', () => {
    const x = { file: 'x.json', data: { platform: 'x', campaign: 'appearance:dQw4w9WgXcQ', body: 'b' } };
    const findings = checkCampaignPair('x.json', x.data, [x], []);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('no instagram sibling');
  });
});

describe('checkSimultaneousPair', () => {
  // "All at once" (2026-09-10, kanban t_bac31b1a, Joey: "one idea goes out
  // to X, Instagram... all together"): the real 2026-08-30/08-28 shape —
  // one platform at 15:00Z, the other hours later same day or the day
  // before — must now fail.
  it('fails when the paired sibling is scheduled hours apart, same day', () => {
    const all = [
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', scheduledAt: '2026-08-30T15:00:00Z' } },
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b', scheduledAt: '2026-08-30T23:00:00Z' } },
    ];
    const findings = checkSimultaneousPair('x.json', all[0].data, all);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('ig.json');
    expect(findings[0]).toContain('480 minute');
  });

  it('passes when both siblings share the exact same scheduledAt', () => {
    const all = [
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' } },
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' } },
    ];
    expect(checkSimultaneousPair('x.json', all[0].data, all)).toEqual([]);
    expect(checkSimultaneousPair('ig.json', all[1].data, all)).toEqual([]);
  });

  it('passes when siblings are within the tight window (a few minutes apart)', () => {
    const all = [
      { file: 'x.json', data: { platform: 'x', campaign: 'c1', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' } },
      { file: 'ig.json', data: { platform: 'instagram', campaign: 'c1', body: 'b', scheduledAt: '2026-09-09T23:03:00Z' } },
    ];
    expect(checkSimultaneousPair('x.json', all[0].data, all)).toEqual([]);
  });

  it('is a no-op when there is no sibling in the queue at all (checkCampaignPair already flags that)', () => {
    const all = [{ file: 'x.json', data: { platform: 'x', campaign: 'lonely', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' } }];
    expect(checkSimultaneousPair('x.json', all[0].data, all)).toEqual([]);
  });

  it('is a no-op when there is no campaign at all (checkCampaignPair already flags that)', () => {
    expect(checkSimultaneousPair('x.json', { platform: 'x', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' }, [])).toEqual([]);
  });

  it('is a no-op for an unrecognized platform or invalid scheduledAt (checkSchema already flags those)', () => {
    expect(checkSimultaneousPair('x.json', { platform: 'tiktok', campaign: 'c1', body: 'b', scheduledAt: '2026-09-09T23:00:00Z' }, [])).toEqual([]);
    expect(checkSimultaneousPair('x.json', { platform: 'x', campaign: 'c1', body: 'b', scheduledAt: 'not-a-date' }, [])).toEqual([]);
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

describe('checkFastLaneDisplacement (Tree Overhaul T6 — spec AC#9)', () => {
  it('fails a merch X item sharing a platform + UTC day with a calendar X item (AC#9)', () => {
    const all = [
      { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'calendar-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T23:00:00Z' } },
    ];
    const findings = checkFastLaneDisplacement('merch-x.json', all[0].data, all);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('calendar-x.json');
  });

  it('fires symmetrically when checking the calendar item instead', () => {
    const all = [
      { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'calendar-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T23:00:00Z' } },
    ];
    const findings = checkFastLaneDisplacement('calendar-x.json', all[1].data, all);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('merch-x.json');
  });

  it('passes a fast-lane item and a calendar item on different UTC days', () => {
    const all = [
      { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'calendar-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-19T23:00:00Z' } },
    ];
    expect(checkFastLaneDisplacement('merch-x.json', all[0].data, all)).toEqual([]);
  });

  it('passes a fast-lane item and a calendar item on the same day but different platforms', () => {
    const all = [
      { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'calendar-ig.json', data: { platform: 'instagram', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T23:00:00Z' } },
    ];
    expect(checkFastLaneDisplacement('merch-x.json', all[0].data, all)).toEqual([]);
  });

  it('is silent between two fast-lane items, or two calendar items, on the same day (not this check\'s job)', () => {
    const twoFastLane = [
      { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'appearance-x.json', data: { platform: 'x', lane: 'appearance', body: 'b', scheduledAt: '2026-09-18T20:00:00Z' } },
    ];
    expect(checkFastLaneDisplacement('merch-x.json', twoFastLane[0].data, twoFastLane)).toEqual([]);
    const twoCalendar = [
      { file: 'cal1-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } },
      { file: 'cal2-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T20:00:00Z' } },
    ];
    expect(checkFastLaneDisplacement('cal1-x.json', twoCalendar[0].data, twoCalendar)).toEqual([]);
  });

  it('is a no-op for a reddit-lane item (not part of this pairing)', () => {
    const all = [{ file: 'reddit.json', data: { platform: 'x', lane: 'reddit', body: 'b', scheduledAt: '2026-09-18T15:00:00Z' } }];
    expect(checkFastLaneDisplacement('reddit.json', all[0].data, all)).toEqual([]);
  });

  it('is a no-op for an unrecognized platform or invalid scheduledAt (checkSchema already flags those)', () => {
    expect(checkFastLaneDisplacement('x.json', { platform: 'tiktok', lane: 'merch', scheduledAt: '2026-09-18T15:00:00Z' }, [])).toEqual([]);
    expect(checkFastLaneDisplacement('x.json', { platform: 'x', lane: 'merch', scheduledAt: 'not-a-date' }, [])).toEqual([]);
  });

  it('is wired into checkDraft alongside the other rule families', async () => {
    const target = { file: 'merch-x.json', data: { platform: 'x', lane: 'merch', body: 'a perfectly fine fan post.', scheduledAt: '2026-09-18T15:00:00Z', media: ['/social/library/photos/a.jpg'], altText: ['alt'], critique: { v: 2, scores: { onStrategy: 5, onVoice: 5, specific: 5, mediaEarnsItsPlace: 5, notEmbarrassed: 5, timely: 5 }, total: 30, rationale: 'r', rulesChecked: [], revision: 1 } } };
    const calendarSibling = { file: 'calendar-x.json', data: { platform: 'x', lane: 'calendar', body: 'b', scheduledAt: '2026-09-18T23:00:00Z' } };
    const findings = await checkDraft(target, { allQueue: [target, calendarSibling], openerContext: [], recentIg: [] });
    expect(findings.some((f) => f.includes('fast-lane displacement'))).toBe(true);
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
  const CORPUS_PHOTO_ID = 'lover-minneapolis-2023';
  const CORPUS_PHOTO_CREDIT = 'Michael Hicks (CC BY 2.0), via Wikimedia Commons';
  const CORPUS_PHOTO_SOURCE = 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg';

  it('warns but does not reject a credited photo that repeats recent history, preventing a finite-library deadlock', async () => {
    const recentIg = [{ platform: 'instagram', media: [CORPUS_PHOTO], postedAt: '2026-08-01T00:00:00Z' }];
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE }, recentIg);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^length: warning — media:/);
  });

  it('warns but does not reject a credited photo also scheduled in another queue item', async () => {
    const other = { file: 'b.json', data: { platform: 'instagram', media: [CORPUS_PHOTO] } };
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE }, [], [other]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^length: warning — media:.*also scheduled in b\.json/);
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

  it('requires an exact inventory binding for every credited photo tile', async () => {
    const missingId = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE },
      [],
    );
    expect(missingId.some((f) => f.includes('requires `photoId`'))).toBe(true);

    const mismatchedCredit = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: 'Someone Else', mediaSource: CORPUS_PHOTO_SOURCE },
      [],
    );
    expect(mismatchedCredit.some((f) => f.includes('must use its inventory media path, exact credit, and exact source'))).toBe(true);
  });

  // 2026-09-10 (kanban t_75ec7106) — the founder-reported bug: a reputation
  // post shipped a Lover-era tour photo. This locks in check-drafts.mjs's
  // (draft-time) mirror of queue-schema.mjs's photoEra binding.
  it('hard-fails a themed draft whose bound photo is not tagged for its declared photoEra', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, photoEra: 'reputation' },
      [],
    );
    expect(findings.some((f) => f.includes('photoEra'))).toBe(true);
  });

  it('accepts a themed draft whose bound photo IS tagged for its declared photoEra', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, photoEra: 'lover' },
      [],
    );
    expect(findings).toEqual([]);
  });

  // Fable ruling round 4 (kanban t_75ec7106, PR #4062): a themed campaign
  // family must require photoEra, not treat it as opt-in.
  it('hard-fails a themed-campaign photo draft with no photoEra at all', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'thread:easter-eggs:interactive-challenge:2026-09-find' },
      [],
    );
    expect(findings.some((f) => f.includes('belongs to a themed family'))).toBe(true);
  });

  it('does not require photoEra on a non-themed campaign family', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:shop-the-look:announce' },
      [],
    );
    expect(findings).toEqual([]);
  });

  it('accepts an exactly credited, sourced, inventory-bound photo tile with no findings', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE },
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
    // campaign: launch:test — site-screen is launch-only as of 2026-08-31,
    // and (2026-08-31 round 2) must ride a carousel behind a real Taylor
    // photo tile at media[0] per strategy §2(a).
    const ok = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO, '/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:test' }, []);
    expect(ok).toEqual([]);
    for (const tile of ['/social/2026-07-17-electric-lady-1.png', CORPUS_PHOTO]) {
      const bad = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO, tile], mediaKind: 'site-screen', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:test' }, []);
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

  it('rejects a text-only X sibling from a paired campaign', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', body: 'text only', campaign: 'launch:shop-the-look:announce' }, []);
    expect(findings.some((f) => f.includes('require at least one credited image'))).toBe(true);
  });

  it('rejects an X draft with mediaKind "video-thumb" — the value is no longer schema-recognized (2026-09-10, kanban t_bac31b1a)', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', body: 'text only', campaign: 'appearance:video-id', mediaKind: 'video-thumb' }, []);
    expect(findings.some((f) => f.includes('require at least one credited image'))).toBe(true);
  });

  it('rejects an X draft that declares a site-screen tile', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'x', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen' },
      [],
    );
    expect(findings.some((f) => f.includes('X drafts may not use mediaKind "site-screen"'))).toBe(true);
  });

  it('continues to allow an Instagram site-screen tile on a launch campaign', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO, '/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:shop-the-look' },
      [],
    );
    expect(findings).toEqual([]);
  });

  it('requires an exact inventory-bound photoId for a launch carousel grid tile', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO, '/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:shop-the-look' },
      [],
    );
    expect(findings.some((f) => f.includes('requires `photoId`'))).toBe(true);
  });

  // 2026-08-31 (Joey, kanban t_895c2ba8): a site-screen used to be legal on
  // ANY campaign, which is how the grid drifted to mostly website
  // screenshots instead of Taylor photos. Strategy §2 always said a
  // screenshot is only legitimate for a launch/how-to post — this is the
  // gate that actually enforces it.
  it('rejects an Instagram site-screen tile on a non-launch campaign', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', campaign: 'heartbeat:on-this-day' },
      [],
    );
    expect(findings.some((f) => f.includes('only allowed on a `launch:`-family campaign'))).toBe(true);
  });

  it('rejects an Instagram site-screen tile with no campaign at all', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen' },
      [],
    );
    expect(findings.some((f) => f.includes('only allowed on a `launch:`-family campaign'))).toBe(true);
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
    const findings = await checkMedia('a.json', { platform: 'instagram', media: [CORPUS_PHOTO, '/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE, campaign: 'launch:test' }, []);
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
      const findings = await checkMedia('a.json', { platform: 'instagram', media: [TALL_FIXTURE_REL], mediaKind: 'site-screen', campaign: 'launch:test' }, []);
      expect(findings.some((f) => f.includes("outside Instagram's accepted") && f.includes('780x1688'))).toBe(true);
    });
  });

  it('accepts an in-range 1080x1350 Instagram image (aspect gate passes)', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/library/thread-fashion-intro.png'], mediaKind: 'site-screen', campaign: 'launch:test' }, []);
    expect(findings.some((f) => f.includes('aspect'))).toBe(false);
  });

  it('does NOT apply the aspect-ratio gate to X drafts', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', media: ['/social/library/mood-chat-screen.png'], mediaKind: 'site-screen' }, []);
    expect(findings.some((f) => f.includes('aspect'))).toBe(false);
  });

  // ── #3584 (2026-09-05, Fable ruling on kanban t_36d74b87): a rehosted
  //    YouTube/broadcaster thumbnail is NOT a "photo" — see the
  //    VIDEO_THUMBNAIL_CREDIT_RE / CLEARED_PHOTO_ALLOWLIST block comment in
  //    check-drafts.mjs. ──
  it('rejects a "photo" tile whose credit reads like a rehosted video thumbnail', async () => {
    const findings = await checkMedia(
      'a.json',
      {
        platform: 'instagram',
        media: [`${CORPUS_PHOTO.replace('taylor-lover-eras-minneapolis-2023.jpg', 'appearance-dQw4w9WgXcQ.jpg')}`],
        mediaKind: 'photo',
        mediaCredit: 'Video thumbnail: Republic Records',
        mediaSource: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      [],
    );
    expect(findings.some((f) => f.includes('cannot be mediaKind "photo"') && f.includes('rehosted video thumbnail'))).toBe(true);
  });

  it('rejects a "photo" tile under the photo prefix that is not in the cleared allowlist, even with an innocuous credit', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: ['/social/library/photos/some-new-uncleared-file.jpg'], mediaKind: 'photo', mediaCredit: 'A Photographer', mediaSource: 'https://example.com' },
      [],
    );
    expect(findings.some((f) => f.includes('cannot be mediaKind "photo"') && f.includes('not in the credited photo inventory'))).toBe(true);
  });

  it('accepts a "photo" tile that is inventory-bound with exact attribution', async () => {
    const findings = await checkMedia(
      'a.json',
      { platform: 'instagram', media: [CORPUS_PHOTO], mediaKind: 'photo', photoId: CORPUS_PHOTO_ID, mediaCredit: CORPUS_PHOTO_CREDIT, mediaSource: CORPUS_PHOTO_SOURCE },
      [],
    );
    expect(findings).toEqual([]);
  });

  // ── Regression coverage for the three appearance-discovery items #3584
  //    named as already-shipped/queued bad items (kanban t_ed5fb547): confirm
  //    the mediaKind "photo" gate (rehosted-thumbnail credit regex AND the
  //    tiny CLEARED_PHOTO_ALLOWLIST) rejects all three shapes, not just the
  //    Taylor-absent one. None of these three files are in the allowlist, so
  //    each is rejected on that signal alone even where the credit text
  //    itself doesn't literally say "thumbnail"/"youtube"/"video" — a
  //    branded-quote-card or a genuinely-Taylor-but-low-quality frame gets
  //    no free pass just because the wording is innocuous. ──
  it('rejects the GMA Dolly-memorial branded quote card (ldBrFonU8NA) as mediaKind "photo"', async () => {
    const findings = await checkMedia(
      'a.json',
      {
        platform: 'instagram',
        media: ['/social/library/photos/appearance-ldBrFonU8NA.jpg'],
        mediaKind: 'photo',
        mediaCredit: 'Video thumbnail: Good Morning America',
        mediaSource: 'https://www.youtube.com/watch?v=ldBrFonU8NA',
      },
      [],
    );
    expect(findings.some((f) => f.includes('cannot be mediaKind "photo"'))).toBe(true);
  });

  it('rejects the Taylor-free animated tree/tire-swing frame (XwCWKSO0F8s) as mediaKind "photo" even with an innocuous credit', async () => {
    const findings = await checkMedia(
      'a.json',
      {
        platform: 'instagram',
        media: [CORPUS_PHOTO.replace('taylor-lover-eras-minneapolis-2023.jpg', 'appearance-XwCWKSO0F8s.jpg')],
        mediaKind: 'photo',
        // Deliberately innocuous wording (no "thumbnail"/"youtube"/"video")
        // to prove the allowlist signal alone still catches it.
        mediaCredit: 'Republic Records',
        mediaSource: 'https://www.youtube.com/watch?v=XwCWKSO0F8s',
      },
      [],
    );
    expect(findings.some((f) => f.includes('cannot be mediaKind "photo"'))).toBe(true);
  });

  it('rejects the genuinely-Taylor but letterboxed/low-quality Icon Sessions frame (T6iTnTV-Rgw) as mediaKind "photo"', async () => {
    const findings = await checkMedia(
      'a.json',
      {
        platform: 'instagram',
        media: [CORPUS_PHOTO.replace('taylor-lover-eras-minneapolis-2023.jpg', 'appearance-T6iTnTV-Rgw.jpg')],
        mediaKind: 'photo',
        mediaCredit: 'The Grammy Museum',
        mediaSource: 'https://www.youtube.com/watch?v=T6iTnTV-Rgw',
      },
      [],
    );
    expect(findings.some((f) => f.includes('cannot be mediaKind "photo"'))).toBe(true);
  });

  it('mediaKind "video-thumb" is no longer schema-recognized — falls through to the "no declared mediaKind" style rejection', async () => {
    const findings = await checkMedia('a.json', { platform: 'instagram', media: ['/social/library/photos/appearance-dQw4w9WgXcQ.jpg'], mediaKind: 'video-thumb' }, []);
    expect(findings.some((f) => f.includes('cannot be mediaKind') || f.includes('not in the credited photo inventory') || f.includes('no declared'))).toBe(true);
  });

  it('rejects mediaKind "video-thumb" on X too — no exempt lane remains (2026-09-10, kanban t_bac31b1a)', async () => {
    const findings = await checkMedia('a.json', { platform: 'x', campaign: 'appearance:video-id', mediaKind: 'video-thumb', body: 'text with a link' }, []);
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe('checkCritique (Tree Overhaul T2 — spec AC#4)', () => {
  it('passes a well-formed critique', () => {
    expect(checkCritique({ critique: VALID_CRITIQUE })).toEqual([]);
  });

  // AC#4's exact quoted format, naming the dimension and its score.
  it('fails a below-threshold draft with a message naming the dimension and its score', () => {
    const critique = { ...VALID_CRITIQUE, scores: { ...VALID_CRITIQUE.scores, notEmbarrassed: 3 }, total: 21 };
    expect(checkCritique({ critique })).toContain('critique.notEmbarrassed is 3, needs 4');
  });

  // AC#10's testable half: a fixture engineered to fail `specific` names
  // that dimension (the daily run's own PR-body naming of the failing
  // dimension is the runner prompt's job, not something check-drafts.mjs
  // can produce — see the PR body for that caveat).
  it('names `specific` when that is the dimension a fixture is engineered to fail', () => {
    const critique = { ...VALID_CRITIQUE, scores: { ...VALID_CRITIQUE.scores, specific: 2 }, total: 20 };
    expect(checkCritique({ critique })).toContain('critique.specific is 2, needs 3');
  });

  it('flags a missing critique entirely', () => {
    expect(checkCritique({}).some((f) => f.includes('critique'))).toBe(true);
  });

  // Real-CI regression (PR #4144): an item already carrying a
  // shape/hash-valid approval (any real content, no critique — exactly
  // the four live 2026-09-12/13 social/queue/ items, which predate T2) is
  // exempt from critique entirely — checkCritique shares
  // findCritiqueIssues, so this is the same rule as queue-schema.test.ts's,
  // re-verified at this gate too so the two can never drift on which items
  // are exempt. `sig` below is NOT a valid signature (round 2 LOW rename —
  // it's an all-zero forgery, deliberately: this checks the unkeyed
  // shape/hash-only path checkCritique actually uses, same as
  // queue-schema.test.ts's dedicated forged-approval security test).
  it('is exempt once the item already carries a shape/hash-valid approval — even with no critique at all', () => {
    const base = { platform: 'x', body: 'a real tweet', scheduledAt: '2026-08-12T23:00:00Z', media: ['/social/library/photos/a.jpg'], altText: ['alt'] };
    const approved = {
      ...base,
      approval: {
        v: 2,
        by: SOCIAL_APPROVERS[0],
        at: '2026-09-11T16:26:33.227Z',
        pr: 4108,
        message: '1',
        contentHash: contentHash(base),
        sig: `hmac-sha256:${'0'.repeat(64)}`, // unsigned forgery, not a real signature — see comment above
      },
    };
    expect(checkCritique(approved)).toEqual([]);
  });

  it('is wired into checkDraft alongside the other rule families', async () => {
    // Same fixture as "runs the full rule set for a schema-valid item"
    // above (no media, so checkMedia short-circuits on its own "requires at
    // least one image" finding rather than touching disk) — proves a
    // missing `critique` now ALSO surfaces alongside that finding.
    const target = { file: 'no-critique.json', data: { platform: 'instagram', body: 'a perfectly fine fan post about the eras tour.', scheduledAt: '2026-08-11T00:00:00Z' } };
    const findings = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [] });
    expect(findings.some((f) => f.includes('critique'))).toBe(true);
  });

  // Round 2 review (real CI-only-vs-PR-time gate drift, T5): this is the
  // draft-time gate — the one that is supposed to stop a bad draft before a
  // PR is ever opened. It must reject exactly what queue-schema.mjs's CI
  // backstop rejects, or the rule only ever surfaces as an avoidable red CI
  // check on an already-opened PR.
  it('rejects empty rulesChecked when activeLessonIds is non-empty, accepts it when omitted (matches queue-schema.mjs)', () => {
    const critique = { ...VALID_CRITIQUE, rulesChecked: [] };
    expect(checkCritique({ critique }, { activeLessonIds: ['L001'] })).toContain(
      'critique.rulesChecked: must be non-empty — social/lessons.md has active rules that must be checked and recorded.',
    );
    expect(checkCritique({ critique })).toEqual([]);
    expect(checkCritique({ critique }, { activeLessonIds: [] })).toEqual([]);
  });

  it('threads activeLessonIds through checkDraft, not just checkCritique directly', async () => {
    const target = { file: 'empty-rules.json', data: { platform: 'instagram', body: 'a perfectly fine fan post about the eras tour.', scheduledAt: '2026-08-11T00:00:00Z', critique: { ...VALID_CRITIQUE, rulesChecked: [] } } };
    const withLessons = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [], activeLessonIds: ['L001'] });
    expect(withLessons.some((f) => f.includes('critique.rulesChecked: must be non-empty'))).toBe(true);
    const withoutLessons = await checkDraft(target, { allQueue: [], openerContext: [], recentIg: [] });
    expect(withoutLessons.some((f) => f.includes('critique.rulesChecked'))).toBe(false);
  });
});
