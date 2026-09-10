import { describe, expect, it } from 'vitest';
import { buildSocialDraftPair } from './social-draft.mjs';
import { validateQueueItem } from '../../social/lib/queue-schema.mjs';
import { checkSchema, checkOpeners, checkCampaignPair, checkCrossPostCopy, checkLength } from '../../social/check-drafts.mjs';
import { weightedTweetLength } from '../../social/lib/x-length.mjs';

const NOW = new Date('2026-08-25T13:40:00Z');

const candidate = (overrides = {}) => ({
  videoId: 'dQw4w9WgXcQ',
  title: 'Taylor Swift Performs "Fortnight" Live at the VMAs',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  channelName: 'Republic Records',
  channelWhy: "Taylor's label",
  published: '2026-08-25T12:00:00Z',
  rule: 'taylor-swift',
  ...overrides,
});

const PHOTO_LIBRARY = [
  {
    id: 'lover-minneapolis-2023',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_4.jpg',
  },
];

const build = (c, opts = {}) => buildSocialDraftPair(c, { photoLibrary: PHOTO_LIBRARY, postedHistory: [], ...opts });

const findX = (pair) => {
  const x = pair.drafts.find(({ item }) => item.platform === 'x');
  if (!x) throw new Error('draft missing X item');
  return x;
};
const findIg = (pair) => {
  const ig = pair.drafts.find(({ item }) => item.platform === 'instagram');
  if (!ig) throw new Error('draft missing Instagram item');
  return ig;
};

describe('buildSocialDraftPair', () => {
  // 2026-09-10 (kanban t_bac31b1a, founder directive: "there's never a time
  // where we post to only X, or only IG — everything should be the same"):
  // this lane now MUST author both siblings, credited photo included on
  // both. The 2026-09-05 #3584 X-only carve-out was itself the exact
  // single-platform exception the founder had already closed unconditionally
  // and is gone.
  it('authors BOTH platforms — X and Instagram, both carrying the credited photo', () => {
    const { drafts } = build(candidate(), { now: NOW });
    expect(drafts.map(({ item }) => item.platform).sort()).toEqual(['instagram', 'x']);
    for (const { item } of drafts) {
      expect(item.media).toEqual(['/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg']);
      expect(item.mediaKind).toBe('photo');
      expect(item.photoId).toBe('lover-minneapolis-2023');
    }
  });

  it('tags both siblings with the same campaign appearance:<videoId>, and passes the pairing gate', () => {
    const { drafts } = build(candidate(), { now: NOW });
    const x = findX({ drafts });
    const ig = findIg({ drafts });
    expect(x.item.campaign).toBe('appearance:dQw4w9WgXcQ');
    expect(ig.item.campaign).toBe('appearance:dQw4w9WgXcQ');
    const allQueue = drafts.map((d) => ({ file: d.filename, data: d.item }));
    expect(checkCampaignPair(x.filename, x.item, allQueue, [])).toEqual([]);
    expect(checkCampaignPair(ig.filename, ig.item, allQueue, [])).toEqual([]);
  });

  it('throws rather than staging an X-only draft when the photo library is empty', () => {
    expect(() => buildSocialDraftPair(candidate(), { now: NOW, photoLibrary: [], postedHistory: [] })).toThrow(
      /no credited photo available/,
    );
  });

  it('produces items that pass the real queue schema gate', () => {
    const { drafts } = build(candidate(), { now: NOW });
    for (const { item } of drafts) {
      expect(validateQueueItem(item)).toEqual([]);
      expect(checkSchema(item)).toEqual([]);
    }
    expect(checkLength(findX({ drafts }).item)).toEqual([]);
  });

  it('names the files <scheduledDay>-appearance-<videoId>-x.json and -ig.json', () => {
    const { drafts } = build(candidate(), { now: NOW });
    const x = findX({ drafts });
    const ig = findIg({ drafts });
    expect(x.filename).toBe(`${x.item.scheduledAt.slice(0, 10)}-appearance-dQw4w9WgXcQ-x.json`);
    expect(ig.filename).toBe(`${ig.item.scheduledAt.slice(0, 10)}-appearance-dQw4w9WgXcQ-ig.json`);
  });

  it('schedules both siblings at the exact same instant, 72 hours out from `now`', () => {
    const { drafts } = build(candidate(), { now: NOW });
    const x = findX({ drafts });
    const ig = findIg({ drafts });
    expect(x.item.scheduledAt).toBe(ig.item.scheduledAt);
    const deltaMs = new Date(x.item.scheduledAt).getTime() - NOW.getTime();
    expect(deltaMs).toBe(72 * 60 * 60 * 1000);
  });

  it('carries the real watch URL on X and the video\'s own title on both platforms, never a fabricated claim about content', () => {
    const { drafts } = build(candidate(), { now: NOW });
    const x = findX({ drafts });
    const ig = findIg({ drafts });
    expect(x.item.body).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(x.item.body.toLowerCase()).toContain('fortnight');
    expect(ig.item.body.toLowerCase()).toContain('fortnight');
  });

  it('never claims engagement with unwatched media ("come watch with me" style copy is gone)', () => {
    const { drafts } = build(candidate(), { now: NOW });
    for (const { item } of drafts) {
      expect(item.body.toLowerCase()).not.toMatch(/come watch with me|i haven'?t watched|my whole day is now about/);
    }
  });

  // The opener rule (check-drafts.mjs's checkOpeners) fails a draft whose
  // first 6 words match any other post from the last 14 days or any other
  // queue item — a channel-name-FIRST template would collide with itself on
  // that same channel's very next upload. Title-first avoids that because
  // each video's own title is what makes it a distinct, already-deduped item.
  it('does not collide on the opener rule across two different uploads from the SAME channel (X body)', () => {
    const a = findX(build(candidate({ videoId: 'aaaaaaaaaaa', title: 'Taylor Swift Surprises Fans at the VMAs' }), { now: NOW }));
    const b = findX(build(candidate({ videoId: 'bbbbbbbbbbb', title: 'Taylor Swift Debuts New Eras Tour Outfit' }), { now: NOW }));
    const findings = checkOpeners(b.filename, b.item, [{ file: a.filename, body: a.item.body }]);
    expect(findings).toEqual([]);
  });

  it('never opens with the banned "did you know" formula on either platform', () => {
    const { drafts } = build(candidate(), { now: NOW });
    for (const { item } of drafts) {
      expect(checkOpeners('x.json', item, [])).toEqual([]);
    }
  });

  it('does not trip the cross-post-copy rule against its own sibling — the IG caption is deliberately a different shape', () => {
    const { drafts } = build(candidate(), { now: NOW });
    const x = findX({ drafts });
    const allQueue = drafts.map((d) => ({ file: d.filename, data: d.item }));
    expect(checkCrossPostCopy(x.filename, x.item, allQueue)).toEqual([]);
  });

  it('truncates an implausibly long title and stays under X\'s weighted limit', () => {
    const longTitle = `Taylor Swift ${'performs a very long segment title '.repeat(15)}live`;
    const { drafts } = build(candidate({ title: longTitle }), { now: NOW });
    const x = findX({ drafts });
    expect(weightedTweetLength(x.item.body)).toBeLessThanOrEqual(280);
    expect(checkLength(x.item)).toEqual([]);
  });

  it('sanitizes an embedded double-quote in the title so it cannot break the X body\'s own quoting', () => {
    const { drafts } = build(candidate({ title: 'She said "hi" to fans' }), { now: NOW });
    const x = findX({ drafts });
    // Exactly the two quotes this template itself wraps the title in — none
    // from the title should survive as a raw `"`.
    expect(x.item.body.split('"').length - 1).toBe(2);
  });

  it('keeps "Taylor" capitalized (house style) even though the rest of the body is lowercase', () => {
    const { drafts } = build(candidate({ title: 'Taylor Swift performs' }), { now: NOW });
    const x = findX({ drafts });
    expect(x.item.body).toContain('Taylor');
    expect(x.item.body).not.toMatch(/\btaylor\b/); // no accidentally-lowercased occurrence
  });

  // Regression: a real live feed during testing produced "Taylor swift" —
  // the full-name phrase was split word-by-word, so "Taylor" alone kept its
  // capital but the "Swift" immediately after it got lowercased anyway.
  it('keeps "Taylor Swift" as a properly capitalized two-word unit, not "Taylor swift"', () => {
    const { drafts } = build(
      candidate({ title: "The Icon Sessions with Taylor Swift — Presented by the Recording Academy" }),
      { now: NOW },
    );
    const x = findX({ drafts });
    expect(x.item.body).toContain('Taylor Swift');
    expect(x.item.body).not.toContain('Taylor swift');
  });
});
