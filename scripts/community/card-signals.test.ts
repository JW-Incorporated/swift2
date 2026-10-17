import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { formatCount, leadHeat, signalParts, skipReason } from './card-signals.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  buildAwarenessMessage,
  buildAwarenessReplyText,
  selectBatch,
} from './awareness-message.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { buildReplyOpportunity } from './reply-opportunity.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { eligibilityRank } from './awareness-eligibility.mjs';

const NOW = new Date('2026-10-17T12:00:00Z');
const FOOTER = 'Done? React ✅ posted · ❌ skip. Nothing posts automatically.';

const reddit = (overrides: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  platform: 'reddit',
  kind: 'awareness_reply',
  community: 'TaylorSwift',
  url: 'https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/?utm_source=x',
  title: 'Rank the eras',
  draft: 'folklore at number one',
  why: 'Era ranking',
  image_comments: 'unknown',
  score: 1234,
  num_comments: 340,
  reactions: null,
  thread_created_at: '2026-10-17T09:00:00Z',
  rank_score: null,
  ...overrides,
});

const facebook = (overrides: Record<string, unknown> = {}) =>
  reddit({
    id: '22222222-2222-4222-8222-222222222222',
    platform: 'facebook',
    community: 'facebook:taylor-swifts-vault',
    locator: 'Taylor Swift Vault — which era has the best bridge',
    url: 'https://www.facebook.com/groups/123/posts/456/?fbclid=zzz',
    title: 'Which era has the best bridge',
    score: null,
    num_comments: 4,
    reactions: 12,
    ...overrides,
  });

describe('formatCount', () => {
  it('compacts thousands and millions', () => {
    expect([950, 1000, 1234, 15400, 2_300_000].map(formatCount)).toEqual([
      '950',
      '1k',
      '1.2k',
      '15k',
      '2.3M',
    ]);
  });
});

describe('Reddit card', () => {
  it('full signals: sub, position, score, comments, age', () => {
    expect(buildAwarenessMessage(reddit(), { position: 2, total: 5, now: NOW })).toBe(
      [
        '**Rank the eras**',
        'r/TaylorSwift · #2/5 · ▲ 1.2k · 340 comments · 3h',
        '<https://www.reddit.com/r/TaylorSwift/comments/abc/rank_the_eras/>',
        FOOTER,
        'ref: reddit · 11111111-1111-4111-8111-111111111111',
      ].join('\n'),
    );
  });

  it('partial signals: only what is known', () => {
    const text = buildAwarenessMessage(
      reddit({ score: null, thread_created_at: null, num_comments: 1 }),
      { now: NOW },
    );
    expect(text.split('\n')[1]).toBe('r/TaylorSwift · 1 comment');
  });

  it('missing signals: just the sub, never undefined or a false zero', () => {
    const text = buildAwarenessMessage(
      reddit({ score: undefined, num_comments: undefined, thread_created_at: undefined }),
      { now: NOW },
    );
    expect(text.split('\n')[1]).toBe('r/TaylorSwift');
    const zeros = buildAwarenessMessage(reddit({ score: 0, num_comments: 0 }), { now: NOW });
    for (const t of [text, zeros]) {
      expect(t).not.toMatch(/undefined|NaN|null| 0 comments|▲ 0/);
    }
  });

  it('keeps the reply as its own code-box message and the ref line last', () => {
    const text = buildAwarenessMessage(reddit(), { now: NOW });
    expect(text.split('\n').at(-1)).toBe('ref: reddit · 11111111-1111-4111-8111-111111111111');
    expect(text).not.toContain('folklore at number one');
    expect(buildAwarenessReplyText(reddit()).text).toBe('```\nfolklore at number one\n```');
  });
});

describe('Facebook card', () => {
  it('full signals: group, reactions, comments, age; no ref line', () => {
    expect(buildAwarenessMessage(facebook(), { now: NOW })).toBe(
      [
        '**Which era has the best bridge**',
        'Taylor Swift Vault · 👍 12 · 4 comments · 3h',
        '<https://www.facebook.com/groups/123/posts/456/>',
        FOOTER,
      ].join('\n'),
    );
  });

  it('missing signals: just the group name', () => {
    const text = buildAwarenessMessage(
      facebook({ reactions: null, num_comments: null, thread_created_at: null }),
      { now: NOW },
    );
    expect(text.split('\n')[1]).toBe('Taylor Swift Vault');
  });

  it('a lead without a permalink keeps the find-it line first, signals only', () => {
    const text = buildAwarenessMessage(facebook({ url: null }), { now: NOW });
    expect(text.split('\n')[0]).toBe('👍 12 · 4 comments · 3h');
    expect(text).toContain('Find it in:');
    expect(text).not.toContain('**');
  });
});

describe('mailer-lane card', () => {
  const mailer = (o: Record<string, unknown> = {}) => ({
    ...reddit({ kind: 'hot_thread', relevance: 0.8 }),
    thread_created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    ...o,
  });

  it('adds the signal line under the title when known, nothing when not', () => {
    const lines = buildReplyOpportunity(mailer()).split('\n');
    expect(lines[1]).toBe('**Rank the eras**');
    expect(lines[2]).toBe('▲ 1.2k · 340 comments · 3h');
    const bare = buildReplyOpportunity(
      mailer({ score: null, num_comments: null, thread_created_at: null }),
    );
    expect(bare.split('\n')[2]).toMatch(/^<https:/);
    expect(bare).toContain(FOOTER);
  });
});

describe('skip rules', () => {
  it('skips crowded, downvoted and stale threads', () => {
    expect(skipReason(reddit({ num_comments: 500 }), NOW)).toBe('crowded');
    expect(skipReason(reddit({ score: -4 }), NOW)).toBe('downvoted');
    expect(skipReason(reddit({ thread_created_at: '2026-10-10T00:00:00Z' }), NOW)).toBe('stale');
  });

  it('keeps unknowns, healthy threads and replies to our own comments', () => {
    expect(skipReason(reddit(), NOW)).toBeNull();
    expect(
      skipReason(reddit({ score: null, num_comments: null, thread_created_at: null }), NOW),
    ).toBeNull();
    expect(skipReason(reddit({ kind: 'reply_to_us', num_comments: 900 }), NOW)).toBeNull();
    expect(skipReason(facebook({ score: -1 }), NOW)).toBeNull();
  });
});

describe('ranking', () => {
  it('fresh active threads outrank old quiet ones; unknown signals rank last', () => {
    const fresh = reddit({
      score: 80,
      num_comments: 40,
      thread_created_at: '2026-10-17T11:00:00Z',
    });
    const old = reddit({ score: 80, num_comments: 40, thread_created_at: '2026-10-15T12:00:00Z' });
    expect(leadHeat(fresh, NOW)!).toBeGreaterThan(leadHeat(old, NOW)!);
    expect(leadHeat(reddit({ score: null, num_comments: null }), NOW)).toBeNull();
    expect(leadHeat(reddit({ rank_score: 7 }), NOW)).toBe(7);
  });

  it('selectBatch orders by heat after eligibility and tier, then oldest first', () => {
    const mk = (id: string, heat: number | null, created: string) => ({
      id,
      community: 'A',
      image_comments: 'unknown',
      created_at: created,
      heat,
    });
    const picked = selectBatch(
      [
        mk('quiet-old', null, '2026-10-17T01:00:00Z'),
        mk('hot', 9, '2026-10-17T03:00:00Z'),
        mk('warm', 3, '2026-10-17T02:00:00Z'),
        mk('quiet-new', null, '2026-10-17T05:00:00Z'),
      ],
      {
        perSubRemaining: { default: 9 },
        rank: eligibilityRank,
        tierOf: () => 1,
        heatOf: (l: { heat: number | null }) => l.heat,
      },
    );
    expect(picked.map((l: { id: string }) => l.id)).toEqual([
      'hot',
      'warm',
      'quiet-old',
      'quiet-new',
    ]);
  });
});

describe('signalParts', () => {
  it('returns nothing for an empty lead', () => {
    expect(signalParts({}, NOW)).toEqual([]);
  });
});
