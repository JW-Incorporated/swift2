import { describe, expect, it } from 'vitest';
import {
  hasLeakedMarkup,
  isContaminatedLead,
  knownFacebookCommunities,
  parseArgs,
  summarizeByCommunity,
} from './fb-lead-scrub.mjs';

/** A row shaped like the ones the pre-fix ingest actually wrote (#4885). */
function contaminatedRow(overrides = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    platform: 'facebook',
    community: 'facebook:taylor-swifts-vault',
    kind: 'hot_thread',
    locator: 'Taylor Swift\u0027s Vault — role="article" data-posinset="65"> Jane Fan the vault door…',
    context: 'role="article" data-posinset="65"> Jane Fan the vault door…',
    status: 'new',
    created_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

/** A row shaped like the FIXED parser's output. */
function cleanRow(overrides = {}) {
  return {
    id: '00000000-0000-0000-0000-000000000002',
    platform: 'facebook',
    community: 'facebook:taylor-swifts-vault',
    kind: 'hot_thread',
    locator: "Taylor Swift's Vault — the vault door theory is back and I'm obsessed…",
    context: "the vault door theory is back and I'm obsessed…",
    status: 'new',
    created_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('hasLeakedMarkup', () => {
  it('detects the #4885 tag fragment in a context value', () => {
    expect(hasLeakedMarkup('role="article" data-posinset="65"> Jane Fan hello')).toBe(true);
  });

  it('detects it behind the locator\u0027s group-name prefix', () => {
    expect(hasLeakedMarkup(contaminatedRow().locator)).toBe(true);
  });

  it('does not fire on clean stripped text', () => {
    expect(hasLeakedMarkup(cleanRow().context)).toBe(false);
    expect(hasLeakedMarkup(cleanRow().locator)).toBe(false);
  });

  it('does not fire on a group name that contains an apostrophe', () => {
    expect(hasLeakedMarkup("The Swiftie's Society — anyone going to night two")).toBe(false);
  });

  // Regression: an earlier signature flagged ANY angle bracket in the first 60
  // chars, which would have deleted these clean rows. On a delete script a
  // false positive is data loss, so each of these is a hard requirement.
  it('does not fire on clean post text that starts with an angle bracket', () => {
    expect(hasLeakedMarkup('Taylor Swift (Swifties) — >>> look at this bracelet')).toBe(false);
    expect(hasLeakedMarkup('>>> look at this bracelet')).toBe(false);
  });

  it('does not fire on clean post text that contains an angle bracket', () => {
    expect(hasLeakedMarkup("Taylor Swift- swifties — selling these for > $20 each, dm me")).toBe(false);
    expect(hasLeakedMarkup('selling these for > $20 each, dm me')).toBe(false);
  });

  // "X > Y" ranking phrasing is extremely common in these groups; an earlier
  // signature matched a bare word-run ending in `>` and would have deleted
  // every one of these.
  it('does not fire on era-ranking phrasing', () => {
    for (const text of [
      'this era > reputation',
      'taylor > everyone else',
      'rep > 1989 > lover',
      'folklore>evermore fight me',
    ]) {
      expect(hasLeakedMarkup(text)).toBe(false);
      expect(hasLeakedMarkup(`Taylor Swift's Vault — ${text}`)).toBe(false);
    }
  });

  it('does not fire on clean post text containing attribute-looking words', () => {
    expect(hasLeakedMarkup('is it era=1989 or era=rep? the aria label thing is confusing')).toBe(false);
  });

  it('fires on the exact pre-fix tag-tail shape with a single attribute', () => {
    expect(hasLeakedMarkup('role="article"> Jane Fan hello')).toBe(true);
  });

  it('fires on a tag tail the 80-char excerpt cut before its closing bracket', () => {
    expect(hasLeakedMarkup('role="article" data-posinset="65" class="x1yztbdb x1n2onr6"')).toBe(true);
  });

  it('is safe on empty/non-string values', () => {
    expect(hasLeakedMarkup('')).toBe(false);
    expect(hasLeakedMarkup(null)).toBe(false);
    expect(hasLeakedMarkup(undefined)).toBe(false);
  });
});

describe('isContaminatedLead', () => {
  it('matches a contaminated facebook status=new row in a known group', () => {
    expect(isContaminatedLead(contaminatedRow())).toBe(true);
  });

  it('leaves a clean row alone', () => {
    expect(isContaminatedLead(cleanRow())).toBe(false);
  });

  it('never touches a non-facebook row', () => {
    expect(isContaminatedLead(contaminatedRow({ platform: 'reddit' }))).toBe(false);
  });

  it('never touches a row past status=new (emailed/posted/skipped)', () => {
    for (const status of ['drafted', 'emailed', 'posted', 'skipped_redline']) {
      expect(isContaminatedLead(contaminatedRow({ status }))).toBe(false);
    }
  });

  it('never touches a community outside the export checklist', () => {
    expect(isContaminatedLead(contaminatedRow({ community: 'facebook:some-other-group' }))).toBe(false);
  });

  it('is safe on a missing row', () => {
    expect(isContaminatedLead(null)).toBe(false);
  });
});

describe('knownFacebookCommunities', () => {
  it('derives facebook:<slug> ids from the export checklist', () => {
    const ids = knownFacebookCommunities();
    expect(ids).toContain('facebook:taylor-swifts-vault');
    expect(ids.every((id: string) => id.startsWith('facebook:'))).toBe(true);
  });

  it('covers the 7 group slugs named in issue #4885', () => {
    const ids = knownFacebookCommunities();
    for (const slug of [
      'kulto-ni-taylor-swift',
      'taylor-swifts-vault-2-0',
      'taylor-swift-group-563881396975983',
      'taylor-swift-group-458298915485042',
      'taylor-swift-swifties',
      'taylor-swift-swifties-2',
      'the-swifties-society',
    ]) {
      expect(ids).toContain(`facebook:${slug}`);
    }
  });
});

describe('parseArgs', () => {
  it('defaults to a dry run', () => {
    expect(parseArgs([])).toEqual({ apply: false, jsonOut: null });
  });

  it('reads --apply and --json-out', () => {
    expect(parseArgs(['--apply', '--json-out', '/tmp/out.json'])).toEqual({
      apply: true,
      jsonOut: '/tmp/out.json',
    });
  });
});

describe('summarizeByCommunity', () => {
  it('counts candidates per community, sorted', () => {
    expect(
      summarizeByCommunity([
        { community: 'facebook:b' },
        { community: 'facebook:a' },
        { community: 'facebook:b' },
      ]),
    ).toEqual([
      { community: 'facebook:a', count: 1 },
      { community: 'facebook:b', count: 2 },
    ]);
  });
});
