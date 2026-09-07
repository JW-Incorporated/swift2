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

const buildSocialDraft = (...args: Parameters<typeof buildSocialDraftPair>) => {
  const pair = buildSocialDraftPair(...args);
  const x = pair.drafts.find(({ item }) => item.platform === 'x');
  if (!x) throw new Error('draft missing X item');
  return x;
};

describe('buildSocialDraft', () => {
  // 2026-09-05 (#3584, Fable ruling on kanban t_36d74b87): this lane no
  // longer authors an Instagram sibling at all — it has no license-cleared
  // photo to offer, so Instagram is skipped entirely rather than shipping a
  // rehosted YouTube thumbnail mislabeled as a "photo". See
  // scripts/appearance-discovery/lib/social-draft.mjs's header for the full
  // ruling.
  it('authors X-only — no Instagram sibling, no media', () => {
    const { drafts } = buildSocialDraftPair(candidate(), { now: NOW });
    expect(drafts.map(({ item }) => item.platform)).toEqual(['x']);
    expect(drafts[0].item.media).toBeUndefined();
    expect(drafts[0].item.mediaKind).toBeUndefined();
  });

  it('tags the campaign as appearance:<videoId>, exempt from the cross-platform pairing gate', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.campaign).toBe('appearance:dQw4w9WgXcQ');
    expect(checkCampaignPair('x.json', item, [{ file: 'x.json', data: item }], [])).toEqual([]);
  });

  it('produces an item that passes the real queue schema gate', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(validateQueueItem(item)).toEqual([]);
    expect([...checkSchema(item), ...checkLength(item)]).toEqual([]);
  });

  it('names the file <scheduledDay>-appearance-<videoId>-x.json', () => {
    const { filename, item } = buildSocialDraft(candidate(), { now: NOW });
    expect(filename).toBe(`${item.scheduledAt.slice(0, 10)}-appearance-dQw4w9WgXcQ-x.json`);
  });

  it('schedules exactly 72 hours out from `now`', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    const deltaMs = new Date(item.scheduledAt).getTime() - NOW.getTime();
    expect(deltaMs).toBe(72 * 60 * 60 * 1000);
  });

  it('tags the campaign with the video id, for dedupe/idempotency', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.campaign).toBe('appearance:dQw4w9WgXcQ');
  });

  it('platform is x — no photo/site-screen media to source for an unverified drop', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.platform).toBe('x');
    expect(item.media).toBeUndefined();
  });

  it('carries the real watch URL and the video\'s own title, never a fabricated claim about content', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.body).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(item.body.toLowerCase()).toContain('fortnight');
  });

  it('never claims engagement with unwatched media ("come watch with me" style copy is gone)', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(item.body.toLowerCase()).not.toMatch(/come watch with me|i haven'?t watched|my whole day is now about/);
  });

  // The opener rule (check-drafts.mjs's checkOpeners) fails a draft whose
  // first 6 words match any other post from the last 14 days or any other
  // queue item — a channel-name-FIRST template would collide with itself on
  // that same channel's very next upload. Title-first avoids that because
  // each video's own title is what makes it a distinct, already-deduped item.
  it('does not collide on the opener rule across two different uploads from the SAME channel', () => {
    const a = buildSocialDraft(candidate({ videoId: 'aaaaaaaaaaa', title: 'Taylor Swift Surprises Fans at the VMAs' }), { now: NOW });
    const b = buildSocialDraft(candidate({ videoId: 'bbbbbbbbbbb', title: 'Taylor Swift Debuts New Eras Tour Outfit' }), { now: NOW });
    const findings = checkOpeners(b.filename, b.item, [{ file: a.filename, body: a.item.body }]);
    expect(findings).toEqual([]);
  });

  it('never opens with the banned "did you know" formula', () => {
    const { item } = buildSocialDraft(candidate(), { now: NOW });
    expect(checkOpeners('x.json', item, [])).toEqual([]);
  });

  it('does not trip the cross-post-copy rule with no queue siblings', () => {
    const { item, filename } = buildSocialDraft(candidate(), { now: NOW });
    expect(checkCrossPostCopy(filename, item, [{ file: filename, data: item }])).toEqual([]);
  });

  it('truncates an implausibly long title and stays under X\'s weighted limit', () => {
    const longTitle = `Taylor Swift ${'performs a very long segment title '.repeat(15)}live`;
    const { item } = buildSocialDraft(candidate({ title: longTitle }), { now: NOW });
    expect(weightedTweetLength(item.body)).toBeLessThanOrEqual(280);
    expect(checkLength(item)).toEqual([]);
  });

  it('sanitizes an embedded double-quote in the title so it cannot break the body\'s own quoting', () => {
    const { item } = buildSocialDraft(candidate({ title: 'She said "hi" to fans' }), { now: NOW });
    // Exactly the two quotes this template itself wraps the title in — none
    // from the title should survive as a raw `"`.
    expect(item.body.split('"').length - 1).toBe(2);
  });

  it('keeps "Taylor" capitalized (house style) even though the rest of the body is lowercase', () => {
    const { item } = buildSocialDraft(candidate({ title: 'Taylor Swift performs' }), { now: NOW });
    expect(item.body).toContain('Taylor');
    expect(item.body).not.toMatch(/\btaylor\b/); // no accidentally-lowercased occurrence
  });

  // Regression: a real live feed during testing produced "Taylor swift" —
  // the full-name phrase was split word-by-word, so "Taylor" alone kept its
  // capital but the "Swift" immediately after it got lowercased anyway.
  it('keeps "Taylor Swift" as a properly capitalized two-word unit, not "Taylor swift"', () => {
    const { item } = buildSocialDraft(
      candidate({ title: "The Icon Sessions with Taylor Swift — Presented by the Recording Academy" }),
      { now: NOW },
    );
    expect(item.body).toContain('Taylor Swift');
    expect(item.body).not.toContain('Taylor swift');
  });
});
