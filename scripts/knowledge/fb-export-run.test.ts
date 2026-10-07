import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkWorkerEnv,
  ENV_MISSING_SUMMARY,
  ENV_URL_INVALID_SUMMARY,
  failureReason,
  formatComments,
  gateExport,
  ingestOne,
  parseIngestSummary,
  redactReason,
  runCapture,
  runExport as runExportReal,
  runSummary,
  uploadOne,
  uploadSucceeded,
} from './fb-export-run.mjs';

// Real runs preflight the worker env; tests inject a passing check unless they override it.
const runExport = (options: Record<string, unknown> = {}) =>
  runExportReal({ checkEnv: async () => ({ ok: true }), ...options });

const group = { slug: 'group-a', label: 'Group A', groupId: '123' };

describe('failure reasons and env preflight', () => {
  it('uses the last non-empty stderr line, trimmed to 200 chars', async () => {
    const stderr = `first\nfb-export-ingest: SUPABASE_URL not set\n\n`;
    const exec = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { stderr }));
    const r = await ingestOne({ groupSlug: 'g', filePath: 'a.html', exportedAt: new Date() }, exec);
    expect(r).toEqual({ ok: false, reason: 'fb-export-ingest: SUPABASE_URL not set' });
    expect(failureReason({ stderr: 'word '.repeat(100) }, 'x')).toHaveLength(200);
    expect(failureReason({}, 'ingest')).toBe('ingest');
  });

  it('prefers the Error line over trailing stack frames', () => {
    const stderr =
      'Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.\n    at a (x.js:1:1)\n    at async b (y.js:2:2)\n';
    expect(failureReason({ stderr }, 'x')).toBe(
      'Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.',
    );
    expect(failureReason({ stderr: 'plain\nlast line\n' }, 'x')).toBe('last line');
  });

  it('an invalid SUPABASE_URL stops the run before collecting, naming the problem', async () => {
    const collect = vi.fn();
    const result = await runExportReal({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      collect,
      checkEnv: async () => ({ ok: false, urlInvalid: true }),
    });
    expect(result.ok).toBe(false);
    expect(result.summary).toBe(ENV_URL_INVALID_SUMMARY);
    expect(collect).not.toHaveBeenCalled();
  });

  it('redacts keys, tokens and credentialed URLs', () => {
    expect(redactReason('bad SERVICE_ROLE_KEY=abc123def')).toBe('bad SERVICE_ROLE_KEY=[redacted]');
    expect(redactReason('fetch https://user:pw@host.example/x failed')).toBe(
      'fetch [redacted-url] failed',
    );
    expect(redactReason('token eyJhbGciOiJIUzI1NiJ9.payload.sig')).not.toContain('eyJ');
    expect(redactReason('key sk-abcdefghijkl')).not.toContain('abcdefghijkl');
  });

  it('upload failures carry the redacted reason too', async () => {
    const exec = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('x'), { stderr: 'boom password=hunter2\n' }));
    const dir = await mkdtemp(join(tmpdir(), 'fbx-up-'));
    const file = join(dir, 'a.html');
    await writeFile(file, '<p>x</p>');
    const r = await uploadOne(file, exec);
    await rm(dir, { recursive: true, force: true });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('boom password=[redacted]');
    expect(r.reason).not.toContain('hunter2');
  });

  it('checkWorkerEnv needs both keys true', async () => {
    const out = (o: object) => vi.fn().mockResolvedValue({ stdout: `${JSON.stringify(o)}\n` });
    const both = { SUPABASE_URL: true, SUPABASE_SERVICE_ROLE_KEY: true, SUPABASE_URL_VALID: true };
    expect(await checkWorkerEnv(out(both))).toEqual({ ok: true });
    expect(await checkWorkerEnv(out({ ...both, SUPABASE_URL: false }))).toEqual({ ok: false });
    expect(await checkWorkerEnv(out({ ...both, SUPABASE_URL_VALID: false }))).toEqual({
      ok: false,
      urlInvalid: true,
    });
    expect(await checkWorkerEnv(vi.fn().mockRejectedValue(new Error('x')))).toEqual({ ok: false });
  });

  it('a real run stops before collecting when the env is missing; dry-run skips the check', async () => {
    const collect = vi.fn();
    const checkEnv = vi.fn().mockResolvedValue({ ok: false });
    const result = await runExportReal({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      collect,
      checkEnv,
    });
    expect(result.ok).toBe(false);
    expect(result.summary).toBe(ENV_MISSING_SUMMARY);
    expect(collect).not.toHaveBeenCalled();
    await runExportReal({
      dryRun: true,
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      collect: vi.fn().mockResolvedValue([]),
      checkEnv,
    });
    expect(checkEnv).toHaveBeenCalledTimes(1);
  });
});

describe('Facebook export gate', () => {
  it('runs the real parser against a copy and accepts at least one kept post', async () => {
    const html =
      '<div role="article"><a aria-label="Person">Person</a><p>Album discussion</p></div>';
    const remove = vi.fn().mockResolvedValue(undefined);
    const result = await gateExport(
      { status: 'collected', ageRuleMet: true, filePath: 'export.html' } as never,
      group as never,
      { copy: vi.fn(), read: vi.fn().mockResolvedValue(html), remove },
    );
    expect(result).toMatchObject({ ok: true, postCount: 1 });
    expect(remove).toHaveBeenCalledWith('export.html.gate-copy.html', { force: true });
  });

  it('keeps zero-post and age-incomplete files out of upload', async () => {
    expect(
      await gateExport({ status: 'collected', ageRuleMet: false } as never, group as never),
    ).toEqual({ ok: false, reason: 'seven-day age rule not met' });
    expect(
      await gateExport(
        {
          status: 'collected',
          partial: true,
          ageRuleMet: false,
          filePath: 'export.html',
        } as never,
        group as never,
        {
          copy: vi.fn(),
          read: vi
            .fn()
            .mockResolvedValue(
              '<div role="article"><a aria-label="Person">Person</a><p>Post</p></div>',
            ),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      ),
    ).toMatchObject({ ok: true, partial: true });
    expect(
      await gateExport(
        { status: 'collected', ageRuleMet: true, filePath: 'empty.html' } as never,
        group as never,
        {
          copy: vi.fn(),
          read: vi.fn().mockResolvedValue('<html><body></body></html>'),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      ),
    ).toEqual({ ok: false, reason: 'real parser kept 0 posts' });
  });

  it('rejects a low harvest when the feed exposed more than 20 positions', async () => {
    const copy = vi.fn();
    await expect(
      gateExport(
        {
          status: 'collected',
          ageRuleMet: true,
          harvestedCount: 4,
          slotCount: 49,
          filePath: 'export.html',
        } as never,
        group as never,
        { copy } as never,
      ),
    ).resolves.toEqual({ ok: false, reason: 'low harvest' });
    expect(copy).not.toHaveBeenCalled();
  });

  it('reports harvested posts and the normalized stop reason', () => {
    expect(
      runSummary([
        {
          slug: 'group-a',
          status: 'validated',
          harvestedCount: 42,
          stopReason: 'seven-days',
        },
      ]),
    ).toContain('group-a: validated (42 posts, stop: age, covered unknown)');
  });

  it('reports coverage and explicitly lists partial groups', () => {
    const summary = runSummary([
      {
        slug: 'group-a',
        status: 'validated',
        postCount: 412,
        stopReason: 'scroll-cap',
        coverageAgeMs: 2 * 86_400_000,
        partial: true,
      },
    ]);
    expect(summary).toContain('group-a: validated (412 posts, stop: scroll-cap, covered ~2d)');
    expect(summary).toContain('Partial groups: group-a.');
  });

  // Codex round 3 #5: the summary carries comment outcomes — counts only, never a comment.
  it('reports comment counts and collection outcomes, counts only', () => {
    const row = {
      slug: 'group-a',
      status: 'uploaded',
      postCount: 3,
      stopReason: 'seven-days',
      commentCounts: { posts: 2, comments: 12, replies: 4 },
      commentCoverage: { eligible: 3, processed: 2, failed: 1, timedOut: 0 },
    };
    expect(runSummary([row])).toContain(
      'comments: 12 comments + 4 replies on 2 posts; 2/3 posts read, 1 failed, 0 timed out',
    );
    expect(formatComments({ commentCoverage: { error: 'collector-missing' } })).toBe(
      'comments: collection error: collector-missing',
    );
    // Codex round 4 #4: free text is never printed — only a known code, else 'unknown'.
    expect(
      formatComments({ commentCoverage: { error: 'comments failed: Synthetic private QX7' } }),
    ).toBe('comments: collection error: unknown');
    expect(formatComments({})).toBeNull();
    // Kulto-shaped: posts uploaded, comment collection failed -> not a failed group.
    const kulto = runSummary([
      {
        slug: 'kulto',
        status: 'uploaded',
        postCount: 55,
        commentsFailed: 'comments-collection-failed',
        commentCoverage: { eligible: 6, processed: 0, failed: 6, timedOut: 0 },
      },
    ]);
    expect(kulto).toContain('1 done, 0 not joined, 0 unavailable, 0 failed');
    expect(kulto).toContain('kulto: uploaded (55 posts');
    expect(kulto).toContain(
      'comments: FAILED (comments-collection-failed) — posts uploaded; comments need a selector fix (run knowledge:fb-export:capture)',
    );
  });

  it('spawns ingest with the collection time and parses dry-run counts', async () => {
    const exec = vi.fn().mockResolvedValue({
      stdout:
        'fb-export-ingest: a.html — 3 post(s) kept, 1 screened out, 2 lead(s), 1 shop-link candidate(s)\n',
    });
    const exportedAt = new Date('2026-09-30T19:13:00.000Z');
    await expect(
      ingestOne({ groupSlug: 'group-a', filePath: 'a.html', exportedAt, dryRun: true }, exec),
    ).resolves.toEqual({
      ok: true,
      counts: { postsKept: 3, screenedOut: 1, leads: 2, shopLinks: 1 },
    });
    expect(exec.mock.calls[0][1]).toEqual([
      '--import',
      'tsx',
      '--env-file-if-exists=apps/worker/.env',
      'scripts/community/fb-export-ingest.mjs',
      '--group',
      'group-a',
      '--exported-at',
      '2026-09-30T19:13:00.000Z',
      '--dry-run',
      'a.html',
    ]);
    expect(parseIngestSummary('unrecognized')).toBeNull();
  });

  it('requires the exact successful uploader trailer and no KEPT marker', () => {
    expect(uploadSucceeded('x\nknowledge:fb-upload: 1/1 uploaded\n')).toBe(true);
    expect(uploadSucceeded('local copy KEPT\nknowledge:fb-upload: 1/1 uploaded\n')).toBe(false);
    expect(uploadSucceeded('knowledge:fb-upload: 0/1 uploaded\n')).toBe(false);
  });

  it('uploads a copy and deletes the original only after exact confirmation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'fb-export-test-'));
    const file = join(directory, 'fb-group-a-2026-09-30.html');
    try {
      await writeFile(file, '<html></html>');
      const exec = vi.fn().mockResolvedValue({ stdout: 'knowledge:fb-upload: 1/1 uploaded\n' });
      expect(await uploadOne(file, exec)).toEqual({ ok: true });
      await expect(readFile(file)).rejects.toThrow();
      expect(exec.mock.calls[0][1].at(-1)).not.toBe(file);
      expect(exec.mock.calls[0][1].at(-1)).toMatch(/fb-group-a-2026-09-30\.html$/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('keeps the original when uploader confirmation fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'fb-export-test-'));
    const file = join(directory, 'fb-group-a-2026-09-30.html');
    try {
      await writeFile(file, '<html></html>');
      const exec = vi.fn().mockResolvedValue({ stdout: 'knowledge:fb-upload: 0/1 uploaded\n' });
      expect(await uploadOne(file, exec)).toMatchObject({ ok: false });
      expect(await readFile(file, 'utf8')).toBe('<html></html>');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('Facebook export orchestration', () => {
  it('runs the export dependency chain through tsx', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    expect(packageJson.scripts['knowledge:fb-export']).toBe(
      'tsx scripts/knowledge/fb-export-run.mjs',
    );
    expect(packageJson.scripts['knowledge:fb-export:dry']).toBe(
      'tsx scripts/knowledge/fb-export-run.mjs --dry-run',
    );
    expect(packageJson.scripts['knowledge:fb-export:probe']).toBeUndefined();
  });

  it('uploads, records, comments, and closes only a complete real run', async () => {
    const writeLedger = vi.fn();
    const reportIssue = vi.fn();
    const ingest = vi.fn().mockResolvedValue({
      ok: true,
      counts: { postsKept: 3, screenedOut: 0, leads: 3, shopLinks: 0 },
    });
    const upload = vi.fn().mockResolvedValue({ ok: true });
    const result = await runExport({
      now: new Date('2026-09-30T12:00:00'),
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger,
      collect: vi
        .fn()
        .mockResolvedValue([
          { slug: 'group-a', status: 'collected', filePath: 'a.html', ageRuleMet: true },
        ]),
      gate: vi.fn().mockResolvedValue({ ok: true, postCount: 3, filePath: 'a.html' }),
      ingest,
      upload,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(true);
    expect(ingest.mock.invocationCallOrder[0]).toBeLessThan(upload.mock.invocationCallOrder[0]);
    expect(writeLedger).toHaveBeenCalled();
    expect(reportIssue).toHaveBeenCalledWith(70, expect.stringContaining('group-a: uploaded'), {
      close: true,
    });
  });

  it('dry-run collects and gates but never uploads, writes a ledger, or touches issues', async () => {
    const upload = vi.fn();
    const writeLedger = vi.fn();
    const findIssue = vi.fn();
    const result = await runExport({
      dryRun: true,
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      collect: vi
        .fn()
        .mockResolvedValue([
          { slug: 'group-a', status: 'collected', filePath: 'a.html', ageRuleMet: true },
        ]),
      gate: vi.fn().mockResolvedValue({ ok: true, postCount: 2, filePath: 'a.html' }),
      ingest: vi.fn().mockResolvedValue({
        ok: true,
        counts: { postsKept: 2, screenedOut: 0, leads: 2, shopLinks: 0 },
      }),
      upload,
      writeLedger,
      findIssue,
    });
    expect(result.ok).toBe(true);
    expect(result.results[0].status).toBe('validated');
    expect(result.summary).toContain('ingest: 2 kept/2 leads/0 shop');
    expect(upload).not.toHaveBeenCalled();
    expect(writeLedger).not.toHaveBeenCalled();
    expect(findIssue).not.toHaveBeenCalled();
  });

  it('keeps the file out of upload when ingest fails', async () => {
    const upload = vi.fn();
    const result = await runExport({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi
        .fn()
        .mockResolvedValue([
          { slug: 'group-a', status: 'collected', filePath: 'a.html', ageRuleMet: true },
        ]),
      gate: vi.fn().mockResolvedValue({ ok: true, postCount: 2, filePath: 'a.html' }),
      ingest: vi.fn().mockResolvedValue({ ok: false, reason: 'ingest' }),
      upload,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
    });
    expect(result.ok).toBe(false);
    expect(result.results[0]).toMatchObject({ status: 'failed', reason: 'ingest' });
    expect(upload).not.toHaveBeenCalled();
  });

  // Codex round 5 #2: ingest is ledgered before upload, so a failed upload never re-ingests.
  describe('ingest-then-upload retry', () => {
    const counts = { postsKept: 2, screenedOut: 0, leads: 2, shopLinks: 0 };
    const shared = () => {
      let stored: unknown = { groups: {} };
      return {
        readLedger: vi.fn(async () => JSON.parse(JSON.stringify(stored))),
        writeLedger: vi.fn(async (_path: string, value: unknown) => {
          stored = JSON.parse(JSON.stringify(value));
        }),
        get: () => stored as { groups: Record<string, Record<string, unknown>> },
      };
    };
    const run = (
      ledger: ReturnType<typeof shared>,
      over: Record<string, unknown>,
    ): ReturnType<typeof runExport> =>
      runExport({
        now: new Date('2026-09-30T12:00:00'),
        root: 'C:\\outside-repo',
        groups: [group],
        readLedger: ledger.readLedger,
        writeLedger: ledger.writeLedger,
        collect: vi
          .fn()
          .mockResolvedValue([
            { slug: 'group-a', status: 'collected', filePath: 'a.html', ageRuleMet: true },
          ]),
        gate: vi.fn().mockResolvedValue({ ok: true, postCount: 2, filePath: 'a.html' }),
        findIssue: vi.fn().mockResolvedValue(70),
        reportIssue: vi.fn(),
        ...over,
      });

    it('a retry after an upload failure uploads the kept file without ingesting again', async () => {
      const ledger = shared();
      const ingest1 = vi.fn().mockResolvedValue({ ok: true, counts });
      const first = await run(ledger, {
        ingest: ingest1,
        upload: vi.fn().mockResolvedValue({ ok: false, reason: 'upload command failed' }),
      });
      expect(first.ok).toBe(false);
      expect(ingest1).toHaveBeenCalledTimes(1);
      expect(ledger.get().groups['group-a']).toMatchObject({
        status: 'ingested',
        filePath: 'a.html',
        ingestCounts: counts,
      });

      const ingest2 = vi.fn().mockResolvedValue({ ok: true, counts });
      const upload2 = vi.fn().mockResolvedValue({ ok: true });
      const collect2 = vi.fn();
      const second = await run(ledger, {
        ingest: ingest2,
        upload: upload2,
        collect: collect2,
        fileExists: vi.fn().mockResolvedValue(true),
      });
      expect(ingest2).not.toHaveBeenCalled();
      expect(collect2).not.toHaveBeenCalled();
      expect(upload2).toHaveBeenCalledWith('a.html');
      expect(second.ok).toBe(true);
      expect(second.results[0]).toMatchObject({ slug: 'group-a', status: 'uploaded' });
      expect(ledger.get().groups['group-a'].status).toBe('uploaded');
    });

    it('does not re-collect when the ingested file is gone: fails ingested-file-missing', async () => {
      const ledger = shared();
      await run(ledger, {
        ingest: vi.fn().mockResolvedValue({ ok: true, counts }),
        upload: vi.fn().mockResolvedValue({ ok: false, reason: 'upload command failed' }),
      });
      const ingest2 = vi.fn();
      const upload2 = vi.fn();
      const collect2 = vi.fn();
      const reportIssue = vi.fn();
      const second = await run(ledger, {
        ingest: ingest2,
        upload: upload2,
        collect: collect2,
        reportIssue,
        fileExists: vi.fn().mockResolvedValue(false),
      });
      expect(collect2).not.toHaveBeenCalled();
      expect(ingest2).not.toHaveBeenCalled();
      expect(upload2).not.toHaveBeenCalled();
      expect(second.ok).toBe(false);
      expect(second.results[0]).toMatchObject({
        slug: 'group-a',
        status: 'failed',
        reason: 'ingested-file-missing',
      });
      expect(reportIssue).toHaveBeenCalledWith(70, expect.anything(), { close: false });
      expect(ledger.get().groups['group-a'].status).toBe('ingested');
    });

    it('a dry run never ledgers ingested', async () => {
      const ledger = shared();
      await run(ledger, {
        dryRun: true,
        ingest: vi.fn().mockResolvedValue({ ok: true, counts }),
        upload: vi.fn(),
      });
      expect(ledger.writeLedger).not.toHaveBeenCalled();
    });
  });

  // Codex round 3 #2: not-member / unavailable are skips only from a verified profile.
  it('never ledgers an unverified not-member / unavailable skip nor closes the issue on it', async () => {
    const writeLedger = vi.fn();
    const reportIssue = vi.fn();
    const groups = [group, { ...group, slug: 'group-b' }, { ...group, slug: 'group-c' }];
    const result = await runExport({
      now: new Date('2026-09-30T12:00:00'),
      root: 'C:\\outside-repo',
      groups,
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger,
      collect: vi.fn().mockResolvedValue([
        { slug: 'group-a', status: 'not-member' },
        { slug: 'group-b', status: 'unavailable', profileVerified: false },
        { slug: 'group-c', status: 'not-member', profileVerified: true },
      ]),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(false);
    expect(result.results).toEqual([
      {
        slug: 'group-a',
        status: 'failed',
        reason: 'unverified-profile-skip',
        skipStatus: 'not-member',
      },
      {
        slug: 'group-b',
        status: 'failed',
        reason: 'unverified-profile-skip',
        skipStatus: 'unavailable',
      },
      { slug: 'group-c', status: 'not-member', profileVerified: true },
    ]);
    const ledgers = writeLedger.mock.calls.map((c) => c[1].groups);
    expect(ledgers.at(-1)).toEqual({ 'group-c': { status: 'not-member', at: expect.any(String) } });
    expect(ledgers.every((g) => !('group-a' in g) && !('group-b' in g))).toBe(true);
    expect(reportIssue).toHaveBeenCalledWith(
      70,
      expect.stringContaining('unverified-profile-skip'),
      {
        close: false,
      },
    );
    expect(result.summary).toContain(
      'Facebook export: 0 done, 1 not joined, 0 unavailable, 2 failed.',
    );
  });

  it('retries a ledgered not-member group on a later run; only uploaded groups are done', async () => {
    const collect = vi.fn().mockResolvedValue([]);
    const writeLedger = vi.fn();
    const groups = [group, { ...group, slug: 'group-b' }];
    const result = await runExport({
      now: new Date('2026-09-30T12:00:00'),
      root: 'C:\\outside-repo',
      groups,
      readLedger: vi.fn().mockResolvedValue({
        groups: {
          'group-a': { status: 'not-member', at: '2026-09-30T01:00:00Z' },
          'group-b': { status: 'uploaded', postCount: 3, at: '2026-09-30T01:00:00Z' },
        },
      }),
      writeLedger,
      collect,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
    });
    expect(collect).toHaveBeenCalledWith(
      expect.objectContaining({ groups: [expect.objectContaining({ slug: 'group-a' })] }),
    );
    expect(result.results.find((r: { slug: string }) => r.slug === 'group-a')?.status).not.toBe(
      'already-done',
    );
    expect(result.results.find((r: { slug: string }) => r.slug === 'group-b')?.status).toBe(
      'already-done',
    );
  });

  it('omits the coverage detail for rows that never harvested', () => {
    const summary = runSummary([
      { slug: 'group-a', status: 'not-member', profileVerified: true },
      { slug: 'group-b', status: 'failed', reason: 'stalled' },
    ]);
    expect(summary).toContain('- group-a: not-member');
    expect(summary).not.toContain('covered unknown');
  });

  it('treats no recent posts as successful and closes the weekly issue', async () => {
    const reportIssue = vi.fn();
    const result = await runExport({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue([
        {
          slug: 'group-a',
          status: 'no-recent-posts',
          stopReason: 'seven-days',
          coverageAgeMs: 42 * 86_400_000,
        },
      ]),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(true);
    expect(result.summary).toContain('group-a: no-recent-posts (0 posts, stop: age, covered ~42d)');
    expect(reportIssue).toHaveBeenCalledWith(70, expect.any(String), { close: true });
  });

  it('reports failure and leaves the issue open', async () => {
    const reportIssue = vi.fn();
    const result = await runExport({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue([{ slug: 'group-a', status: 'checkpoint' }]),
      gate: vi.fn().mockResolvedValue({ ok: false, reason: 'checkpoint' }),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(false);
    expect(result.results[0]).toEqual({ slug: 'group-a', status: 'checkpoint' });
    expect(result.results).toHaveLength(1);
    expect(reportIssue).toHaveBeenCalledWith(70, expect.stringContaining('checkpoint'), {
      close: false,
    });
  });

  it('reports a wrong-profile abort and never gates or uploads a group', async () => {
    const gate = vi.fn();
    const upload = vi.fn();
    const reportIssue = vi.fn();
    const result = await runExport({
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue({
        results: [{ slug: 'profile', status: 'wrong-profile' }],
        actingPageId: null,
      }),
      gate,
      upload,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(false);
    expect(result.results).toEqual([{ slug: 'profile', status: 'wrong-profile' }]);
    expect(gate).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(reportIssue).toHaveBeenCalledWith(70, expect.stringContaining('wrong-profile'), {
      close: false,
    });
  });

  it('explains tab-hidden in the summary without stopping the run', async () => {
    const result = await runExport({
      root: 'C:/outside-repo',
      groups: [group, { ...group, slug: 'group-b' }],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue({
        results: [
          { slug: 'group-a', status: 'failed', reason: 'tab-hidden', hiddenMs: 600_000 },
          { slug: 'group-b', status: 'failed', reason: 'tab-hidden' },
        ],
        actingPageId: null,
      }),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
    });
    expect(result.ok).toBe(false);
    // Both groups were handed out (not run-stopping) and keep their tab-hidden reason.
    expect(result.results.map((r) => [r.slug, r.status, r.reason])).toEqual([
      ['group-a', 'failed', 'tab-hidden'],
      ['group-b', 'failed', 'tab-hidden'],
    ]);
    expect(result.summary).toContain('Tab hidden (group-a, group-b)');
    expect(result.summary).toContain("don't switch tabs in it");
    expect(result.summary).not.toContain('Feed stunted');
  });

  it('explains an extension that never connected, ids and counts only', async () => {
    const result = await runExport({
      root: 'C:/outside-repo',
      groups: [group, { ...group, slug: 'group-b' }],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue({
        results: [
          { slug: 'group-a', status: 'failed', reason: 'extension-never-connected' },
          { slug: 'group-b', status: 'failed', reason: 'extension-never-connected' },
        ],
        actingPageId: null,
      }),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
    });
    expect(result.results.map((r) => [r.slug, r.reason])).toEqual([
      ['group-a', 'extension-never-connected'],
      ['group-b', 'extension-never-connected'],
    ]);
    expect(result.summary).toContain('Extension never connected: Chrome opened the receiver page');
    expect(result.summary).toContain('chrome://extensions');
    expect(result.summary).not.toContain('collection aborted');
  });

  it('stops the run on a stunted feed, skips later groups and says why', async () => {
    const gate = vi.fn();
    const result = await runExport({
      root: 'C:/outside-repo',
      groups: [group, { ...group, slug: 'group-b' }],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      collect: vi.fn().mockResolvedValue({
        results: [{ slug: 'group-a', status: 'stunted' }],
        actingPageId: null,
      }),
      gate,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
    });
    expect(result.ok).toBe(false);
    expect(gate).not.toHaveBeenCalled();
    expect(result.summary).toContain('Feed stunted');
    expect(result.summary).toContain('Facebook is limiting this browser; stopped');
    expect(result.results.find((r) => r.slug === 'group-b')?.status).toBe('failed');
  });
});

describe('Facebook DOM capture (--capture)', () => {
  const now = new Date('2026-09-30T12:00:00Z');

  it('collects with 3-minute budgets into <root>/debug/<date> and prints counts + paths only', async () => {
    const collect = vi.fn().mockResolvedValue({
      results: [
        {
          slug: 'group-a',
          status: 'captured',
          skeletonCount: 15,
          dropped: 15,
          kept: 6,
          inspected: 24,
          harvestedCount: 24,
          slotCount: 26,
          scrolls: 40,
          stopReason: 'capture-full',
          filePath: 'C:/outside-repo/debug/2026-09-30/group-a.skeleton.json',
        },
        {
          slug: 'group-b',
          status: 'captured',
          skeletonCount: 4,
          dropped: 0,
          kept: 4,
          inspected: 4,
          harvestedCount: 4,
          slotCount: 4,
          scrolls: 12,
          stopReason: 'feed-end',
          filePath: 'C:/outside-repo/debug/2026-09-30/group-b.skeleton.json',
        },
      ],
      actingPageId: null,
    });
    const result = await runCapture({
      root: 'C:/outside-repo',
      now,
      groups: [group, { ...group, slug: 'group-b', wallBudgetMs: 75 * 60_000 }],
      collect,
    });
    expect(collect).toHaveBeenCalledTimes(1);
    const args = collect.mock.calls[0][0];
    expect(
      args.groups.map((g: { slug: string; wallBudgetMs: number }) => [g.slug, g.wallBudgetMs]),
    ).toEqual([
      ['group-a', 180_000],
      ['group-b', 180_000],
    ]);
    expect(args.outputDir.replace(/\\/g, '/')).toMatch(
      /^C:\/outside-repo\/debug\/\d{4}-\d{2}-\d{2}$/,
    );
    expect(result.ok).toBe(true);
    expect(result.summary).toContain('Facebook DOM capture: 2/2 groups captured.');
    expect(result.summary).toContain('nothing was ingested, uploaded or ledgered');
    expect(result.summary).toContain(
      '- group-a: captured 15 skeletons (dropped 15, kept 6, inspected 24; harvested 24, stop: capture-full)',
    );
    expect(result.summary).toContain('C:/outside-repo/debug/2026-09-30/group-a.skeleton.json');
    expect(result.summary).not.toContain('"tree"');
  });

  it('is not ok when a group failed, was not captured or was never reached', async () => {
    const result = await runCapture({
      root: 'C:/outside-repo',
      now,
      groups: [group, { ...group, slug: 'group-b' }, { ...group, slug: 'group-c' }],
      collect: vi.fn().mockResolvedValue({
        results: [
          { slug: 'group-a', status: 'failed', reason: 'capture-unsupported' },
          { slug: 'group-b', status: 'captured', skeletonCount: 0, filePath: null },
        ],
        actingPageId: null,
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.summary).toContain('Facebook DOM capture: 0/3 groups captured.');
    expect(result.summary).toContain('- group-a: failed — capture-unsupported');
    expect(result.summary).toContain('- group-b: captured 0 skeletons');
    expect(result.summary).toContain('- group-c: failed — collection aborted before this group');
  });
});
