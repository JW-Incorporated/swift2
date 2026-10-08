import { describe, expect, it, vi } from 'vitest';
import { checkCheckout, uploadWithRetry } from './fb-export-resilience.mjs';
import { runExport as runExportReal } from './fb-export-run.mjs';

const runExport = (options: Record<string, unknown> = {}) =>
  runExportReal({ checkEnv: async () => ({ ok: true }), ...options });

const group = { slug: 'group-a', label: 'Group A', groupId: '123' };
const ingestOk = {
  ok: true,
  counts: { postsKept: 3, screenedOut: 0, leads: 3, shopLinks: 0 },
};

const baseOptions = (extra: Record<string, unknown> = {}) => {
  const disk: { groups: Record<string, { status: string; filePath?: string }> }[] = [];
  return {
    disk,
    options: {
      now: new Date('2026-09-30T12:00:00'),
      root: 'C:\\outside-repo',
      groups: [group],
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(async (_p: string, value: { groups: never }) => {
        disk.push(JSON.parse(JSON.stringify(value)));
      }),
      collect: vi
        .fn()
        .mockResolvedValue([
          { slug: 'group-a', status: 'collected', filePath: 'a.html', ageRuleMet: true },
        ]),
      gate: vi.fn().mockResolvedValue({ ok: true, postCount: 3, filePath: 'a.html' }),
      ingest: vi.fn().mockResolvedValue(ingestOk),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn(),
      ...extra,
    },
  };
};

describe('upload failure keeps the ledger (#4879)', () => {
  it('retries once, then leaves the group ingested with its file and reports it', async () => {
    const upload = vi.fn().mockResolvedValue({ ok: false, reason: 'boom' });
    const { disk, options } = baseOptions({ upload });
    const result = await runExport(options);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(disk.at(-1)?.groups['group-a']).toMatchObject({
      status: 'ingested',
      filePath: 'a.html',
    });
    expect(result.ok).toBe(false);
    expect(result.summary).toContain('group-a: failed');
  });

  it('a retry success ledgers uploaded', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: 'flaky' })
      .mockResolvedValueOnce({ ok: true });
    const { disk, options } = baseOptions({ upload });
    const result = await runExport(options);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(disk.at(-1)?.groups['group-a'].status).toBe('uploaded');
    expect(result.ok).toBe(true);
  });

  it('uploadWithRetry does not retry a first-attempt success', async () => {
    const upload = vi.fn().mockResolvedValue({ ok: true });
    await uploadWithRetry(upload, 'a.html');
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('survives a ledger write failure after the upload fails', async () => {
    const upload = vi.fn().mockResolvedValue({ ok: false, reason: 'boom' });
    const { options } = baseOptions({ upload });
    let calls = 0;
    options.writeLedger = vi.fn(async () => {
      calls += 1;
      if (calls > 1) throw new Error('EBUSY');
    });
    const result = await runExport(options);
    expect(result.summary).toContain('ledger write failed');
  });
});

describe('GitHub failures never hide the summary (#4879)', () => {
  it('returns the summary with a warning when findIssue throws', async () => {
    const upload = vi.fn().mockResolvedValue({ ok: true });
    const { options } = baseOptions({
      upload,
      findIssue: vi.fn().mockRejectedValue(new Error('gh CLI not found AND no GitHub token')),
    });
    const result = await runExport(options);
    expect(result.ok).toBe(false);
    expect(result.summary).toContain('group-a: uploaded');
    expect(result.summary).toContain('GitHub issue lookup failed: gh CLI not found');
    expect(result.warnings).toHaveLength(1);
  });

  it('warns when reportIssue throws', async () => {
    const { options } = baseOptions({
      upload: vi.fn().mockResolvedValue({ ok: true }),
      reportIssue: vi.fn().mockRejectedValue(new Error('rate limited')),
    });
    const result = await runExport(options);
    expect(result.summary).toContain('GitHub issue report failed: rate limited');
  });
});

describe('checkout preflight (#4870)', () => {
  const probeFor = (branch: string, dirty = '') =>
    vi.fn(async (args: string[]) => (args[0] === 'rev-parse' ? `${branch}\n` : dirty));

  it('runs on a clean main', async () => {
    const { options } = baseOptions({
      upload: vi.fn().mockResolvedValue({ ok: true }),
      preflight: probeFor('main'),
    });
    const result = await runExport(options);
    expect(result.ok).toBe(true);
  });

  it('refuses on a feature branch without collecting', async () => {
    const { options } = baseOptions({ preflight: probeFor('feature/x') });
    const result = await runExport(options);
    expect(result.ok).toBe(false);
    expect(result.summary).toContain("on 'feature/x', not 'main'");
    expect((options.collect as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0);
  });

  it('refuses when the export code is dirty', async () => {
    const { options } = baseOptions({
      preflight: probeFor('main', ' M scripts/knowledge/x.mjs\n'),
    });
    const result = await runExport(options);
    expect(result.ok).toBe(false);
    expect(result.summary).toContain('uncommitted change');
  });

  it('refuses when git itself fails (detached HEAD reads as HEAD)', async () => {
    expect((await checkCheckout(probeFor('HEAD'))).ok).toBe(false);
    const broken = vi.fn().mockRejectedValue(new Error('git missing'));
    expect((await checkCheckout(broken)).reason).toContain('git check failed');
  });
});
