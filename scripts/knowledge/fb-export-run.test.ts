import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gateExport, runExport, uploadOne, uploadSucceeded } from './fb-export-run.mjs';

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
    expect(await gateExport({ status: 'scroll-cap' } as never, group as never)).toEqual({
      ok: false,
      reason: 'scroll-cap',
    });
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
  it('uploads, records, comments, and closes only a complete real run', async () => {
    const writeLedger = vi.fn();
    const reportIssue = vi.fn();
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
      upload: vi.fn().mockResolvedValue({ ok: true }),
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue,
    });
    expect(result.ok).toBe(true);
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
      upload,
      writeLedger,
      findIssue,
    });
    expect(result.ok).toBe(true);
    expect(result.results[0].status).toBe('validated');
    expect(upload).not.toHaveBeenCalled();
    expect(writeLedger).not.toHaveBeenCalled();
    expect(findIssue).not.toHaveBeenCalled();
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
    expect(reportIssue).toHaveBeenCalledWith(70, expect.stringContaining('checkpoint'), {
      close: false,
    });
  });
});
