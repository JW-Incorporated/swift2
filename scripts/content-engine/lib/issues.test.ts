import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Every test here guards ONE failure mode: the engine reporting success while
// findings it detected never reached the tracker. That has happened twice for
// real (2026-07-26 `spawn gh ENOENT`, 623 findings; 2026-08-09 `401 Bad
// credentials`, 597 findings) and produced duplicates a third way (a dedupe
// lookup that failed open). None of it was covered by a test.

const ghMock = vi.hoisted(() => vi.fn());
vi.mock('../../lib/gh.mjs', () => ({ gh: ghMock }));

const { createIssues, ensureLabels, rollupFingerprint, errText } = await import('./issues.mjs');
const { fingerprint, legacyFingerprint } = await import('./finding.mjs');

afterEach(() => ghMock.mockReset());

// A fresh temp file per test that needs one — createIssues persists a local
// fingerprint cache (#487) next to `.findings/`, and tests must never read or
// write the real repo copy of that file, or leak state between test cases.
const freshFpCachePath = () => join(mkdtempSync(join(tmpdir(), 'cie-fpcache-')), 'filed-fingerprints.json');

const finding = (over = {}) => ({
  checker: 'image.host-reputation',
  severity: 'P2',
  title: 't',
  source: 'deterministic',
  itemRef: { type: 'moment', file: 'f.mjs', era: 'e', key: 'k', field: null },
  excerpt: 'x',
  evidence: '',
  suggestedFix: '',
  confidence: 0.9,
  escalate: false,
  sources: [],
  ...over,
});

/** Route a gh argv to a canned response. */
function route(handlers: Record<string, (args: string[]) => unknown>) {
  ghMock.mockImplementation(async (args: string[]) => {
    const key = `${args[0]} ${args[1]}`;
    const h = handlers[key];
    if (!h) throw new Error(`unrouted gh call: ${args.join(' ')}`);
    const r = h(args);
    if (r instanceof Error) throw r;
    return { stdout: typeof r === 'string' ? r : JSON.stringify(r) };
  });
}

/**
 * A prefetch response that is exactly AT the requested limit — i.e. possibly
 * truncated, so createIssues must NOT treat a miss as authoritative and must
 * fall through to the per-finding search. (A shorter list is proof of
 * completeness, and a miss then files without touching /search.)
 */
const truncatedPrefetch = (bodies: string[] = []) =>
  Array.from({ length: 1000 }, (_, i) => ({ number: i + 1, body: bodies[i] ?? '' }));

describe('rollup identity', () => {
  it('does not include the item count', () => {
    // The bug: `fingerprint({... excerpt: `${fs.length}` })`. 9 items one night
    // and 10 the next produced two different identities for the same standing
    // defect class, which is how image.host-reputation ended up with 5 open
    // rollups (#137, #647, #815, #883, #1723). legacyFingerprint is the exact
    // pre-#487 algorithm this bug shipped under; the current fingerprint()
    // no longer hashes the raw excerpt at all (see lib/finding.test.ts).
    const nine = legacyFingerprint({
      checker: 'content.image-overuse',
      itemRef: { key: 'rollup' },
      excerpt: '9',
    });
    const ten = legacyFingerprint({
      checker: 'content.image-overuse',
      itemRef: { key: 'rollup' },
      excerpt: '10',
    });
    expect(nine).not.toBe(ten); // the old scheme, for the record

    expect(rollupFingerprint('content.image-overuse')).toBe(
      rollupFingerprint('content.image-overuse'),
    );
    expect(rollupFingerprint('content.image-overuse')).not.toBe(
      rollupFingerprint('image.host-reputation'),
    );
  });

  it('reproduces the real collision the old scheme allowed', () => {
    // #1716 and #813 are both open and both carry cie-fp:e4dc909b86b64e19 —
    // identical fingerprints, filed twice, because existsByFp() failed open.
    // legacyFingerprint must keep reproducing this exact value forever so the
    // grandfathering lookup in createIssues still recognizes both issues.
    expect(
      legacyFingerprint({ checker: 'content.image-overuse', itemRef: { key: 'rollup' }, excerpt: '9' }),
    ).toBe('e4dc909b86b64e19');
  });
});

describe('dedupe lookup fails CLOSED', () => {
  it('does not file when the existence check errors', async () => {
    route({
      'issue list': (args) =>
        args.includes('--search')
          ? new Error('GitHub REST GET /search/issues → 403 forbidden')
          : truncatedPrefetch(), // possibly-truncated prefetch → the search must run, and it errors
      'issue create': () => 'https://github.com/x/y/issues/1',
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });

    expect(res.created).toHaveLength(0);
    expect(res.unfiled).toHaveLength(1);
    expect(res.unfiled[0].reason).toMatch(/dedupe lookup failed/);
    // The whole point: no create was attempted on an unknown.
    expect(ghMock.mock.calls.filter((c) => c[0][1] === 'create')).toHaveLength(0);
  });

  it('files normally when the check says "not present"', async () => {
    route({ 'issue list': () => [], 'issue create': () => 'https://github.com/x/y/issues/7' });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
  });

  it('skips when the check says "already present"', async () => {
    route({
      'issue list': (args) => (args.includes('--search') ? [{ number: 5 }] : truncatedPrefetch()),
      'issue create': () => new Error('should never be called'),
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.created).toHaveLength(0);
    expect(res.skipped).toBe(1);
    expect(res.unfiled).toHaveLength(0);
  });
});

describe('fingerprint prefetch', () => {
  it('is a positive-only cache — a hit skips without a per-finding search', async () => {
    const f = finding({ severity: 'P1' });
    const fp = fingerprint(f);
    route({
      'issue list': (args) => {
        if (args.includes('--search')) return new Error('must not reach the per-finding search');
        return [{ number: 1, body: `something\n<!-- cie-fp:${fp} -->` }];
      },
    });
    const res = await createIssues([f], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.skipped).toBe(1);
    expect(res.created).toHaveLength(0);
  });

  it('a MISS in a POSSIBLY-TRUNCATED prefetch still falls through to the per-finding search', async () => {
    let searched = 0;
    route({
      'issue list': (args) => {
        if (args.includes('--search')) {
          searched++;
          return [{ number: 9 }];
        }
        return truncatedPrefetch(['<!-- cie-fp:0000000000000000 -->']); // other issues, at the limit
      },
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(searched).toBe(1);
    expect(res.skipped).toBe(1); // the search found it; the truncated prefetch had not
  });

  it('a MISS in a COMPLETE prefetch files without touching /search (403-forbidden in cloud, #1869)', async () => {
    // The 2026-08-09 shape after #1887: repo-scoped list works, /search never
    // does. A sub-limit prefetch is the whole cie history, so a miss is proof —
    // requiring the search here would leave every NEW finding unfiled in cloud.
    route({
      'issue list': (args) =>
        args.includes('--search')
          ? new Error('GitHub REST GET /search/issues → 403 repo-scoped sessions')
          : [{ number: 1, body: '<!-- cie-fp:0000000000000000 -->' }], // short of the limit → complete
      'issue create': () => 'https://github.com/x/y/issues/11',
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
    expect(ghMock.mock.calls.filter((c) => c[0].includes('--search'))).toHaveLength(0);
  });

  it('a failed prefetch degrades to per-finding lookups rather than filing blind', async () => {
    route({
      'issue list': (args) => (args.includes('--search') ? [] : new Error('prefetch exploded')),
      'issue create': () => 'https://github.com/x/y/issues/3',
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
  });
});

describe('legacy fingerprint grandfathering (#487)', () => {
  it('recognizes an issue filed under the pre-#487 scheme as already filed', async () => {
    const f = finding({ severity: 'P1' });
    const legacyFp = legacyFingerprint(f);
    // The prefetch scans real issue bodies verbatim — an old issue carries the
    // OLD-scheme marker, never the new one. Only the legacy lookup can match it.
    route({
      'issue list': (args) => {
        if (args.includes('--search')) return new Error('must not reach the per-finding search');
        return [{ number: 42, body: `pre-#487 finding\n<!-- cie-fp:${legacyFp} -->` }];
      },
    });
    const res = await createIssues([f], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.skipped).toBe(1);
    expect(res.created).toHaveLength(0);
  });

  it('falls back to a legacy /search lookup when the prefetch is truncated', async () => {
    const f = finding({ severity: 'P1' });
    const fp = fingerprint(f);
    const legacyFp = legacyFingerprint(f);
    const searched: string[] = [];
    route({
      'issue list': (args) => {
        if (args.includes('--search')) {
          const term = args[args.indexOf('--search') + 1];
          searched.push(term);
          return term.includes(legacyFp) ? [{ number: 5 }] : [];
        }
        return truncatedPrefetch(); // possibly-truncated → both lookups must run
      },
      'issue create': () => new Error('should never be called — legacy match found'),
    });
    const res = await createIssues([f], { dryRun: false, fpCachePath: freshFpCachePath() });
    expect(res.skipped).toBe(1);
    expect(searched).toContain(`cie-fp:${fp} in:body`);
    expect(searched).toContain(`cie-fp:${legacyFp} in:body`);
  });
});

describe('local fingerprint cache (#487 — GitHub search-index lag)', () => {
  it('a fingerprint confirmed filed this run is never re-searched for a second finding sharing it', async () => {
    const cachePath = freshFpCachePath();
    const f = finding({ severity: 'P1' });
    route({ 'issue list': () => [], 'issue create': () => 'https://github.com/x/y/issues/9' });
    const first = await createIssues([f], { dryRun: false, fpCachePath: cachePath });
    expect(first.created).toHaveLength(1);

    // A second, separate createIssues() call (simulating a quick re-run) with
    // a prefetch that has NOT caught up yet (GitHub search-index lag) — the
    // local cache from the first run must still catch it without a network call.
    route({
      'issue list': (args) => (args.includes('--search') ? new Error('must not reach /search — cache should hit first') : truncatedPrefetch()),
      'issue create': () => new Error('should never be called — cache should skip'),
    });
    const second = await createIssues([f], { dryRun: false, fpCachePath: cachePath });
    expect(second.created).toHaveLength(0);
    expect(second.skipped).toBe(1);
  });
});

describe('create failures are counted, never swallowed', () => {
  it('one failed create does not abort the rest, and every loss is reported', async () => {
    let n = 0;
    route({
      'issue list': () => [],
      'issue create': () =>
        ++n === 1 ? new Error('GitHub REST POST /issues → 401 Bad credentials') : 'https://x/2',
    });
    const res = await createIssues(
      [
        finding({ severity: 'P1', title: 'a', excerpt: 'a' }),
        finding({ severity: 'P1', title: 'b', excerpt: 'b' }),
      ],
      { dryRun: false, fpCachePath: freshFpCachePath() },
    );
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(1);
    expect(res.unfiled[0].reason).toMatch(/401 Bad credentials/);
  });

  it('a dry run touches the network not at all', async () => {
    ghMock.mockImplementation(async () => {
      throw new Error('no network in a dry run');
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: true });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
    expect(ghMock).not.toHaveBeenCalled();
  });
});

describe('ensureLabels — the write preflight', () => {
  it('throws when every label upsert fails, so a broken credential is found in 1s not 20min', async () => {
    ghMock.mockImplementation(async () => {
      throw new Error('GitHub REST POST /labels → 401 Bad credentials');
    });
    await expect(ensureLabels()).rejects.toThrow(/not writable/i);
  });

  it('tolerates already-exists (that is what --force means)', async () => {
    ghMock.mockImplementation(async () => {
      throw new Error('422 already_exists');
    });
    await expect(ensureLabels()).resolves.toEqual([]);
  });

  it('tolerates a single flaky label without failing the run', async () => {
    let n = 0;
    ghMock.mockImplementation(async () => {
      if (++n === 2) throw new Error('502 bad gateway');
      return { stdout: '' };
    });
    await expect(ensureLabels()).resolves.toHaveLength(1);
  });
});

describe('errText', () => {
  it('prefers stderr, collapses whitespace, and bounds the length', () => {
    expect(errText({ stderr: '  boom\n  happened  ', message: 'ignored' })).toBe('boom happened');
    expect(errText(new Error('x'.repeat(900))).length).toBe(400);
  });
});
