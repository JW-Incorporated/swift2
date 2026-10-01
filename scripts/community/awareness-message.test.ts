import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildAwarenessHeader,
  buildAwarenessMessage,
  buildMultipartPayload,
  imageFilename,
  selectBatch,
  whyFor,
} from './awareness-message.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { eligibilityRank } from './awareness-eligibility.mjs';

const lead = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  platform: 'reddit',
  community: 'TaylorSwift',
  url: 'https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/',
  title: 'Rank the eras',
  draft: 'folklore at number one and I will not be taking questions',
  why: 'Era ranking, so a card fits',
  image_ref: 'era:folklore',
  image_comments: 'image',
  thread_type: 'ranking',
  ...overrides,
});

describe('awareness Discord message', () => {
  it('keeps a Reddit message within 2000 chars with the account-switched link', () => {
    const text = buildAwarenessMessage(lead({ draft: 'y'.repeat(5000) }));
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text).toContain('target_user=NegativeRest9507');
  });

  it('carries sub, title, link, why, copy block and the ack links, with the ref line last', () => {
    const text = buildAwarenessMessage(lead(), {
      postedUrl: 'https://x.test/p',
      skipUrl: 'https://x.test/s',
    });
    expect(text).toContain('Awareness reply · r/TaylorSwift');
    expect(text).toContain('image comments allowed');
    expect(text).toContain('**Rank the eras**');
    const link = text
      .split('\n')
      .find((l) =>
        l.startsWith('<https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/'),
      );
    expect(link).toMatch(/target_user=NegativeRest9507.*>$/);
    expect(text).toContain('↪️ Reply as u/NegativeRest9507');
    expect(text).toContain('Why: Era ranking, so a card fits');
    expect(text).toContain('```\nfolklore at number one and I will not be taking questions\n```');
    expect(text).toContain('[✅ Posted](<https://x.test/p>) · [Skip](<https://x.test/s>)');
    expect(text.split('\n').at(-1)).toBe('ref: reddit · 11111111-1111-4111-8111-111111111111');
  });

  it('labels text-only subs and falls back to the reaction footer without ack links', () => {
    const text = buildAwarenessMessage(lead({ image_comments: 'text_only' }));
    expect(text).toContain('text-only sub');
    expect(text).toContain('React ✅ posted');
  });

  it('stays within the Discord limit and trims only the reply', () => {
    const text = buildAwarenessMessage(lead({ draft: 'word '.repeat(900) }), {
      postedUrl: 'https://x.test/p',
      skipUrl: 'https://x.test/s',
    });
    expect(text.length).toBeLessThanOrEqual(2000);
    expect(text).toContain('(Reply trimmed to fit Discord.)');
    expect(text).toContain('Rank the eras');
  });

  it('neutralises mentions and fences in untrusted text', () => {
    const text = buildAwarenessMessage(
      lead({ title: '@everyone [x](http://evil)', draft: 'a ``` b' }),
    );
    expect(text).not.toContain('@everyone');
    expect(text).toContain('\\[x\\]');
    expect((text.match(/```/g) ?? []).length).toBe(2);
  });

  it('writes a facebook lead without a ref line and with its locator', () => {
    const text = buildAwarenessMessage(
      lead({
        platform: 'facebook',
        community: 'Taylor Swift Vault',
        url: null,
        locator: 'Vault - first 80 chars',
      }),
    );
    expect(text).toContain('Find it in: Vault - first 80 chars');
    expect(text).not.toContain('ref: reddit');
  });

  it('falls back to a thread-type why', () => {
    expect(whyFor(lead({ why: null, thread_type: 'timeline' }))).toContain('Timeline question');
  });
});

describe('batch header', () => {
  it('reads "Awareness replies — N today" with the batch size', () => {
    expect(buildAwarenessHeader(13, 6)).toMatch(
      /^🎯 \*\*Awareness replies — 13 today\*\*\nThis batch: 6 new opportunities\./,
    );
    expect(buildAwarenessHeader(1, 1)).toContain('1 new opportunity');
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
