import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateIntent, readIntents, INTENT_LANES, INTENT_STATUSES, isExpired, selectFastLane, closeIntent, FAST_LANE_ROLLING_WINDOW_CAP } from './inbox.mjs';

const validMerch = {
  v: 1,
  id: 'merch-2026-09-18-folklore-cardigan',
  source: 'merch-official-sync',
  lane: 'merch',
  createdAt: '2026-09-18T08:17:44Z',
  deadline: '2026-09-21T08:17:44Z',
  status: 'open',
  facts: { name: 'folklore cardigan', availability: 'in stock', productUrl: 'https://example.com', firstSeenAt: '2026-09-18T08:17:44Z' },
  media: ['/social/library/merch/folklore-cardigan.jpg'],
  links: { pr: null, issue: null },
};

const validAppearance = {
  v: 1,
  id: 'appearance-2026-09-18-abc12345678',
  source: 'appearance-discovery',
  lane: 'appearance',
  createdAt: '2026-09-18T22:05:00Z',
  deadline: '2026-09-20T22:05:00Z',
  status: 'open',
  facts: {
    channelName: 'The Graham Norton Show',
    videoTitle: 'Taylor Swift on …',
    publishedAt: '2026-09-18T22:00:00Z',
    videoId: 'abc12345678',
    url: 'https://www.youtube.com/watch?v=abc12345678',
  },
  media: [],
  links: { pr: null, issue: 4321 },
};

describe('validateIntent', () => {
  it('accepts the two real shapes the side doors actually write', () => {
    expect(validateIntent(validMerch)).toEqual([]);
    expect(validateIntent(validAppearance)).toEqual([]);
  });

  it('rejects a non-object', () => {
    expect(validateIntent(null)).toEqual(['not a JSON object']);
    expect(validateIntent([validMerch])).toEqual(['not a JSON object']);
  });

  it('rejects a lane outside the two-value enum this module writes', () => {
    expect(INTENT_LANES).toEqual(['merch', 'appearance']);
    expect(validateIntent({ ...validMerch, lane: 'calendar' }).some((f) => f.startsWith('lane:'))).toBe(true);
  });

  it('rejects a status outside the four-value enum', () => {
    expect(INTENT_STATUSES).toEqual(['open', 'drafted', 'declined', 'expired']);
    expect(validateIntent({ ...validMerch, status: 'posted' }).some((f) => f.startsWith('status:'))).toBe(true);
  });

  it('requires v to be exactly 1', () => {
    expect(validateIntent({ ...validMerch, v: 2 }).some((f) => f.startsWith('v:'))).toBe(true);
  });

  it('requires createdAt/deadline to be ISO instants', () => {
    expect(validateIntent({ ...validMerch, createdAt: 'not-a-date' }).some((f) => f.startsWith('createdAt:'))).toBe(true);
    expect(validateIntent({ ...validMerch, deadline: 'not-a-date' }).some((f) => f.startsWith('deadline:'))).toBe(true);
  });

  it('requires every field of the lane-appropriate facts shape', () => {
    const missingName = { ...validMerch, facts: { ...validMerch.facts, name: undefined } };
    expect(validateIntent(missingName).some((f) => f.startsWith('facts.name:'))).toBe(true);
    const missingVideoId = { ...validAppearance, facts: { ...validAppearance.facts, videoId: undefined } };
    expect(validateIntent(missingVideoId).some((f) => f.startsWith('facts.videoId:'))).toBe(true);
  });

  it('requires links to be an object', () => {
    expect(validateIntent({ ...validMerch, links: undefined }).some((f) => f.startsWith('links:'))).toBe(true);
  });
});

describe('readIntents', () => {
  it('reads every *.json intent in the directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'inbox-test-'));
    try {
      await writeFile(join(dir, 'a.json'), JSON.stringify(validMerch));
      await writeFile(join(dir, 'b.json'), JSON.stringify(validAppearance));
      await writeFile(join(dir, 'notes.txt'), 'ignore me');
      const intents = await readIntents(dir);
      expect(intents.map((i) => i.file).sort()).toEqual(['a.json', 'b.json']);
      expect(intents.find((i) => i.file === 'a.json')?.data).toEqual(validMerch);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('returns [] for a missing directory rather than throwing', async () => {
    expect(await readIntents(join(tmpdir(), 'inbox-test-does-not-exist-xyz'))).toEqual([]);
  });

  it('skips one corrupt file rather than failing the whole read', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'inbox-test-'));
    try {
      await writeFile(join(dir, 'good.json'), JSON.stringify(validMerch));
      await writeFile(join(dir, 'corrupt.json'), '{ not valid json');
      const intents = await readIntents(dir);
      expect(intents.map((i) => i.file)).toEqual(['good.json']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('isExpired', () => {
  it('is false one second before the deadline, true one second after', () => {
    expect(isExpired({ deadline: '2026-09-21T08:17:44Z' }, new Date('2026-09-21T08:17:43Z'))).toBe(false);
    expect(isExpired({ deadline: '2026-09-21T08:17:44Z' }, new Date('2026-09-21T08:17:45Z'))).toBe(true);
  });

  it('is false (not thrown) for a missing or unparseable deadline', () => {
    expect(isExpired({}, new Date())).toBe(false);
    expect(isExpired({ deadline: 'not-a-date' }, new Date())).toBe(false);
  });
});

describe('selectFastLane', () => {
  const now = new Date('2026-09-18T12:00:00Z');
  const nearest = { file: 'appearance.json', data: { ...validAppearance, status: 'open', deadline: '2026-09-19T00:00:00Z' } };
  const later = { file: 'merch.json', data: { ...validMerch, status: 'open', deadline: '2026-09-22T00:00:00Z' } };
  const drafted = { file: 'drafted.json', data: { ...validMerch, status: 'drafted', deadline: '2026-09-18T13:00:00Z' } };
  const expired = { file: 'expired.json', data: { ...validMerch, status: 'open', deadline: '2026-09-01T00:00:00Z' } };

  it('picks the nearest-deadline OPEN intent (AC#5)', () => {
    expect(selectFastLane([later, nearest, drafted], [], now)?.file).toBe('appearance.json');
  });

  it('returns at most one intent (a single entry, not an array)', () => {
    const picked = selectFastLane([later, nearest], [], now);
    expect(Array.isArray(picked)).toBe(false);
    expect(picked?.file).toBe('appearance.json');
  });

  it('returns null when nothing is open', () => {
    expect(selectFastLane([drafted], [], now)).toBeNull();
  });

  it('ignores an intent past its deadline even when status is still "open"', () => {
    expect(selectFastLane([expired], [], now)).toBeNull();
  });

  // Codex review round 1, MEDIUM 2: a malformed deadline used to survive the
  // `open` filter (isExpired reads it as not-expired) and could then win the
  // sort via a NaN comparison rather than losing to a genuinely valid,
  // nearer-deadline intent — reproduced exactly with this ordering.
  it('never selects an intent with a malformed deadline, even ahead of a valid one in the input order', () => {
    const badDeadline = { file: 'bad.json', data: { ...validMerch, status: 'open', deadline: 'not-a-date' } };
    expect(selectFastLane([badDeadline, nearest], [], now)?.file).toBe('appearance.json');
    expect(selectFastLane([badDeadline], [], now)).toBeNull();
  });

  it('returns none when two fast-lane campaigns already posted in the rolling 7 days (AC#5)', () => {
    expect(FAST_LANE_ROLLING_WINDOW_CAP).toBe(2);
    const postedWindow = ['2026-09-15T00:00:00Z', '2026-09-16T00:00:00Z'];
    expect(selectFastLane([later, nearest], postedWindow, now)).toBeNull();
  });

  it('still selects when only one fast-lane campaign posted in the rolling 7 days', () => {
    expect(selectFastLane([later, nearest], ['2026-09-15T00:00:00Z'], now)?.file).toBe('appearance.json');
  });

  it('ignores a posted timestamp outside the rolling 7-day window', () => {
    const postedWindow = ['2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z'];
    expect(selectFastLane([later, nearest], postedWindow, now)?.file).toBe('appearance.json');
  });
});

describe('closeIntent', () => {
  it('transitions to "declined" and requires a non-empty declinedReason (AC#10)', () => {
    const closed = closeIntent(validMerch, 'declined', 'a competitor already covered this drop first');
    expect(closed.status).toBe('declined');
    expect(closed.declinedReason).toBe('a competitor already covered this drop first');
  });

  it('throws for "declined" with no reason', () => {
    expect(() => closeIntent(validMerch, 'declined', '')).toThrow();
    expect(() => closeIntent(validMerch, 'declined', undefined)).toThrow();
  });

  it('transitions to "expired" with no declinedReason required', () => {
    const closed = closeIntent(validMerch, 'expired');
    expect(closed.status).toBe('expired');
    expect(closed.declinedReason).toBeUndefined();
  });

  it('rejects any status other than declined/expired', () => {
    expect(() => closeIntent(validMerch, 'drafted')).toThrow();
    expect(() => closeIntent(validMerch, 'open')).toThrow();
  });

  it('does not mutate the input intent', () => {
    const copy = { ...validMerch };
    closeIntent(validMerch, 'expired');
    expect(validMerch).toEqual(copy);
  });
});
