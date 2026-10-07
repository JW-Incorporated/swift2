import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildAwarenessMessage,
  buildAwarenessReplyText,
  buildMultipartPayload,
  cleanThreadUrl,
  imageFilename,
  selectBatch,
} from './awareness-message.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { eligibilityRank } from './awareness-eligibility.mjs';

const ACKS = { postedUrl: 'https://x.test/p', skipUrl: 'https://x.test/s' };
const ACK_LINE = '[✅ Posted](<https://x.test/p>) · [Skip](<https://x.test/s>)';
const REF = 'ref: reddit · 11111111-1111-4111-8111-111111111111';

const lead = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  platform: 'reddit',
  community: 'TaylorSwift',
  url: 'https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/?target_user=NegativeRest9507&ref_source=email&ref=email_digest&ref_campaign=email_digest&%24deep_link=true',
  title: 'Rank the eras',
  draft: 'folklore at number one and I will not be taking questions',
  why: 'Era ranking, so a card fits',
  image_ref: 'era:folklore',
  image_comments: 'unknown',
  thread_type: 'ranking',
  ...overrides,
});

describe('cleanThreadUrl', () => {
  it('reduces a Reddit link to the canonical thread URL', () => {
    expect(cleanThreadUrl(lead().url)).toBe(
      'https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/',
    );
    expect(cleanThreadUrl('http://old.reddit.com/r/swifties/comments/x1/slug?utm_source=a#c')).toBe(
      'https://www.reddit.com/r/swifties/comments/x1/slug/',
    );
  });

  it('keeps only the post/comment-identifying params on a Facebook link', () => {
    expect(
      cleanThreadUrl(
        'https://www.facebook.com/groups/123/posts/456/?comment_id=789&__cft__[0]=AZX&__tn__=R]-R&fbclid=IwAR1&mibextid=abc',
      ),
    ).toBe('https://www.facebook.com/groups/123/posts/456/?comment_id=789');
    expect(
      cleanThreadUrl('https://m.facebook.com/permalink.php?story_fbid=1&id=2&ref=bookmarks'),
    ).toBe('https://m.facebook.com/permalink.php?story_fbid=1&id=2');
  });

  it('leaves malformed input alone', () => {
    expect(cleanThreadUrl(' not a url ')).toBe('not a url');
  });
});

describe('awareness Discord messages', () => {
  it('Reddit card with image: the clean link, the ack links, the ref line — nothing else', () => {
    expect(buildAwarenessMessage(lead(), ACKS)).toBe(
      ['<https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/>', ACK_LINE, REF].join(
        '\n',
      ),
    );
    expect(buildAwarenessReplyText(lead())).toEqual({
      text: 'folklore at number one and I will not be taking questions',
      trimmed: false,
    });
  });

  it('Reddit card for a text-only sub renders the same: link only (the image is the attachment, not text)', () => {
    const text = buildAwarenessMessage(lead({ image_comments: 'text_only' }), ACKS);
    expect(text).toBe(
      ['<https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/>', ACK_LINE, REF].join(
        '\n',
      ),
    );
  });

  it('Facebook card: the clean link and the ack links, no ref line', () => {
    const fb = lead({
      platform: 'facebook',
      community: 'Taylor Swift Vault',
      url: 'https://www.facebook.com/groups/123/posts/456/?__cft__[0]=AZX&__tn__=%2CO%2CP-R&fbclid=IwAR1',
      draft: 'The Vault had this one on the timeline too',
    });
    expect(buildAwarenessMessage(fb, ACKS)).toBe(
      ['<https://www.facebook.com/groups/123/posts/456/>', ACK_LINE].join('\n'),
    );
    expect(buildAwarenessReplyText(fb).text).toBe('The Vault had this one on the timeline too');
  });

  it('carries none of the old explanatory lines', () => {
    const text = buildAwarenessMessage(lead(), ACKS);
    for (const fluff of [
      'Awareness reply',
      'r/TaylorSwift ·',
      'unverified',
      'Rank the eras',
      'Reply as u/',
      'Why:',
      'Image:',
      'Sub rule',
      'next message',
      'Done?',
      'folklore at number one',
    ])
      expect(text).not.toContain(fluff);
  });

  it('falls back to the reaction footer without ack links and stays within 2000 chars', () => {
    const text = buildAwarenessMessage(lead({ draft: 'y'.repeat(5000) }));
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text).toContain('React ✅ posted · ⏭️ skip');
    expect(text.split('\n').at(-1)).toBe(REF);
  });

  it('trims only an over-long reply and says so on the card', () => {
    const big = lead({ draft: 'word '.repeat(900) });
    const reply = buildAwarenessReplyText(big);
    expect(reply.trimmed).toBe(true);
    expect(reply.text.length).toBeLessThanOrEqual(2000);
    expect(reply.text.startsWith('word word')).toBe(true);
    expect(buildAwarenessMessage(big, ACKS)).toContain('(Reply trimmed to fit Discord.)');
    expect(buildAwarenessMessage(lead())).not.toContain('trimmed');
  });

  it('sends the reply text alone and verbatim, with no fence or label around it', () => {
    const reply = buildAwarenessReplyText(lead({ draft: '  folklore *is* the one ```  ' }));
    expect(reply).toEqual({ text: 'folklore *is* the one ```', trimmed: false });
  });

  it('neutralises mentions in the reply', () => {
    expect(buildAwarenessReplyText(lead({ draft: 'hey @everyone' })).text).not.toContain(
      '@everyone',
    );
  });

  it('uses the locator when a Facebook lead has no URL', () => {
    const text = buildAwarenessMessage(
      lead({
        platform: 'facebook',
        community: 'Taylor Swift Vault',
        url: null,
        locator: 'Vault - first 80 chars @everyone',
      }),
    );
    expect(text.split('\n')[0]).toMatch(/^Vault - first 80 chars /);
    expect(text).not.toContain('@everyone');
    expect(text).not.toContain('ref: reddit');
  });
});

describe('multipart upload builder', () => {
  it('attaches the PNG as files[0] and declares it in payload_json', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    const form = buildMultipartPayload({
      content: 'hello',
      png,
      filename: imageFilename('moment:vault-x'),
    });
    const payload = JSON.parse(String(form.get('payload_json')));
    expect(payload).toMatchObject({
      content: 'hello',
      username: 'Tree · Awareness replies',
      allowed_mentions: { parse: [] },
      attachments: [{ id: 0, filename: 'moment-vault-x.png' }],
    });
    const file = form.get('files[0]') as File;
    expect(file.name).toBe('moment-vault-x.png');
    expect(file.type).toBe('image/png');
    expect(Buffer.from(await file.arrayBuffer()).equals(png)).toBe(true);
  });

  it('refuses content over the Discord limit', () => {
    expect(() =>
      buildMultipartPayload({ content: 'x'.repeat(2001), png: Buffer.alloc(1), filename: 'a.png' }),
    ).toThrow(/limit/);
  });
});

describe('batch selection', () => {
  const mk = (
    id: string,
    community: string,
    image_comments: string,
    created = '2026-10-01T10:00:00Z',
  ) => ({ id, community, image_comments, created_at: created });
  const opts = { rank: eligibilityRank, tierOf: () => 1 };

  it('puts image-capable subs first and text-only last', () => {
    const picked = selectBatch(
      [mk('t', 'A', 'text_only'), mk('u', 'B', 'unknown'), mk('i', 'C', 'image')],
      { perSubRemaining: { default: 3 }, ...opts },
    );
    expect(picked.map((l: { id: string }) => l.id)).toEqual(['i', 'u', 't']);
  });

  it('enforces the per-sub daily cap net of what was already delivered today', () => {
    const leads = ['1', '2', '3', '4'].map((id) => mk(id, 'A', 'image'));
    expect(selectBatch(leads, { perSubRemaining: { A: 3 - 2, default: 3 }, ...opts })).toHaveLength(
      1,
    );
    expect(selectBatch(leads, { perSubRemaining: { A: 0, default: 3 }, ...opts })).toHaveLength(0);
  });

  it('caps the batch and the day', () => {
    const leads = Array.from({ length: 12 }, (_, i) => mk(String(i), `S${i}`, 'image'));
    expect(
      selectBatch(leads, { perSubRemaining: { default: 3 }, batchCap: 7, ...opts }),
    ).toHaveLength(7);
    expect(
      selectBatch(leads, {
        perSubRemaining: { default: 3 },
        batchCap: 7,
        dailyCap: 20,
        deliveredToday: 17,
        ...opts,
      }),
    ).toHaveLength(3);
    expect(
      selectBatch(leads, {
        perSubRemaining: { default: 3 },
        dailyCap: 20,
        deliveredToday: 20,
        ...opts,
      }),
    ).toHaveLength(0);
  });
});
