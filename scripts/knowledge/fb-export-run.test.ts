import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  formatComments,
  gateExport,
  ingestOne,
  parseIngestSummary,
  runExport,
  runSummary,
  uploadOne,
  uploadSucceeded,
} from './fb-export-run.mjs';

const group = { slug: 'group-a', label: 'Group A', groupId: '123' };

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
    expect(
      runSummary([
        {
          slug: 'group-a',
          status: 'failed',
          reason: 'comments-collection-failed',
          commentCoverage: { eligible: 2, processed: 0, failed: 2, timedOut: 0 },
        },
      ]),
    ).toContain(
      'group-a: failed (covered unknown, comments: 0/2 posts read, 2 failed, 0 timed out) — comments-collection-failed',
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

    it('re-collects when the ingested file is gone but still skips ingest', async () => {
      const ledger = shared();
      await run(ledger, {
        ingest: vi.fn().mockResolvedValue({ ok: true, counts }),
        upload: vi.fn().mockResolvedValue({ ok: false, reason: 'upload command failed' }),
      });
      const ingest2 = vi.fn();
      const upload2 = vi.fn().mockResolvedValue({ ok: true });
      const collect2 = vi
        .fn()
        .mockResolvedValue([
          { slug: 'group-a', status: 'collected', filePath: 'b.html', ageRuleMet: true },
        ]);
      const second = await run(ledger, {
        ingest: ingest2,
        upload: upload2,
        collect: collect2,
        gate: vi.fn().mockResolvedValue({ ok: true, postCount: 2, filePath: 'b.html' }),
        fileExists: vi.fn().mockResolvedValue(false),
      });
      expect(collect2).toHaveBeenCalledTimes(1);
      expect(ingest2).not.toHaveBeenCalled();
      expect(upload2).toHaveBeenCalledWith('b.html');
      expect(second.ok).toBe(true);
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
