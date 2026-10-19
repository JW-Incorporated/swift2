import { describe, expect, it } from 'vitest';
import { buildCommunityReport, computeAcceptance } from './outcomes-report.mjs';

const now = new Date('2026-10-19T12:00:00Z');
const ledgers = [
  { id: 'r1', platform: 'reddit', comment_url: 'https://reddit.test/1', posted_at: '2026-10-17T12:00:00Z' },
  { id: 'r2', platform: 'reddit', comment_url: null, posted_at: '2026-10-16T12:00:00Z' },
  { id: 'fresh', platform: 'reddit', comment_url: null, posted_at: '2026-10-19T06:00:00Z' },
  { id: 'f1', platform: 'facebook', comment_url: 'https://facebook.test/1', posted_at: '2026-10-12T13:00:00Z' },
  { id: 'old-r', platform: 'reddit', comment_url: 'https://reddit.test/old', posted_at: '2026-10-10T12:00:00Z' },
];
const outcomes = [
  { post_ledger_id: 'r1', horizon: '24h', score: 5, replies: 0, checked_at: '2026-10-18T12:00:00Z' },
  { post_ledger_id: 'r1', horizon: '7d', score: 7, replies: 2, checked_at: '2026-10-18T12:00:00Z' },
  { post_ledger_id: 'r2', horizon: '24h', score: 3, replies: 0, checked_at: '2026-10-17T12:00:00Z' },
  { post_ledger_id: 'f1', horizon: '7d', score: 2, replies: 0, checked_at: '2026-10-19T10:00:00Z' },
  { post_ledger_id: 'old-r', horizon: '7d', score: 1, replies: 0, checked_at: '2026-10-18T10:00:00Z' },
];

describe('community outcomes report', () => {
  it('computes acceptance from comments old enough to have a 24h snapshot', () => {
    expect(computeAcceptance(ledgers, outcomes, now)).toEqual({
      target: 0.9, eligiblePosted: 3, pendingUnder24h: 1,
      complete: 1, rate: 0.3333, passes: false,
    });
  });

  it('writes the stable weekly dashboard shape and counts Gmail reply_to_us leads', () => {
    const report = buildCommunityReport({
      ledgers, outcomes, now,
      replyLeads: [{ platform: 'reddit' }, { platform: 'reddit' }, { platform: 'facebook' }],
    });
    expect(report).toMatchObject({
      version: 1,
      window: { days: 7, start: '2026-10-12T12:00:00.000Z', end: now.toISOString() },
      score24h: { reddit: { measured: 2, median: 4 } },
      replies7d: {
        reddit: { measured: 2, withReplies: 1, share: 0.5 },
        facebook: { measured: 1, withReplies: 0, share: 0 },
      },
      inboundReplies: {
        gmailReplyToUs: { reddit: 2, facebook: 1, total: 3 },
        facebookPage: { measured: null },
      },
    });
  });
});
