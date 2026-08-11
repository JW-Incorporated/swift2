import { afterEach, describe, expect, it, vi } from 'vitest';

// Every test here guards ONE failure mode: the engine reporting success while
// findings it detected never reached the tracker. That has happened twice for
// real (2026-07-26 `spawn gh ENOENT`, 623 findings; 2026-08-09 `401 Bad
// credentials`, 597 findings) and produced duplicates a third way (a dedupe
// lookup that failed open). None of it was covered by a test.

const ghMock = vi.hoisted(() => vi.fn());
vi.mock('../../lib/gh.mjs', () => ({ gh: ghMock }));

const { createIssues, ensureLabels, rollupFingerprint, errText } = await import('./issues.mjs');
const { fingerprint } = await import('./finding.mjs');

afterEach(() => ghMock.mockReset());

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

describe('rollup identity', () => {
  it('does not include the item count', () => {
    // The bug: `fingerprint({... excerpt: `${fs.length}` })`. 9 items one night
    // and 10 the next produced two different identities for the same standing
    // defect class, which is how image.host-reputation ended up with 5 open
    // rollups (#137, #647, #815, #883, #1723).
    const nine = fingerprint({
      checker: 'content.image-overuse',
      itemRef: { key: 'rollup' },
      excerpt: '9',
    });
    const ten = fingerprint({
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
    expect(
      fingerprint({ checker: 'content.image-overuse', itemRef: { key: 'rollup' }, excerpt: '9' }),
    ).toBe('e4dc909b86b64e19');
  });
});

describe('dedupe lookup fails CLOSED', () => {
  it('does not file when the existence check errors', async () => {
    route({
      'issue list': (args) =>
        args.includes('--search')
          ? new Error('GitHub REST GET /search/issues → 403 forbidden')
          : [],
      'issue create': () => 'https://github.com/x/y/issues/1',
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false });

    expect(res.created).toHaveLength(0);
    expect(res.unfiled).toHaveLength(1);
    expect(res.unfiled[0].reason).toMatch(/dedupe lookup failed/);
    // The whole point: no create was attempted on an unknown.
    expect(ghMock.mock.calls.filter((c) => c[0][1] === 'create')).toHaveLength(0);
  });

  it('files normally when the check says "not present"', async () => {
    route({ 'issue list': () => [], 'issue create': () => 'https://github.com/x/y/issues/7' });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
  });

  it('skips when the check says "already present"', async () => {
    route({
      'issue list': (args) => (args.includes('--search') ? [{ number: 5 }] : []),
      'issue create': () => new Error('should never be called'),
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false });
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
    const res = await createIssues([f], { dryRun: false });
    expect(res.skipped).toBe(1);
    expect(res.created).toHaveLength(0);
  });

  it('a MISS still falls through to the per-finding search (truncated lists cannot cause duplicates)', async () => {
    let searched = 0;
    route({
      'issue list': (args) => {
        if (args.includes('--search')) {
          searched++;
          return [{ number: 9 }];
        }
        return [{ number: 1, body: '<!-- cie-fp:0000000000000000 -->' }]; // some OTHER issue
      },
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false });
    expect(searched).toBe(1);
    expect(res.skipped).toBe(1); // the search found it; the truncated prefetch had not
  });

  it('a failed prefetch degrades to per-finding lookups rather than filing blind', async () => {
    route({
      'issue list': (args) => (args.includes('--search') ? [] : new Error('prefetch exploded')),
      'issue create': () => 'https://github.com/x/y/issues/3',
    });
    const res = await createIssues([finding({ severity: 'P1' })], { dryRun: false });
    expect(res.created).toHaveLength(1);
    expect(res.unfiled).toHaveLength(0);
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
      { dryRun: false },
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
