import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { fileMarjorie, fileTree } from './loop-asks.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { fileAsk } from './lib/loop-asks.mjs';

const NOW = Date.parse('2026-09-14T12:00:00Z');
const URL_4301 = 'https://github.com/JW-Incorporated/swift2/issues/4301';

function fakeGh(existing: unknown[] = [], createdUrl = URL_4301) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') return { stdout: JSON.stringify(existing) };
    if (args[1] === 'create') return { stdout: `${createdUrl}\n` };
    return { stdout: '' };
  });
  return { gh, calls };
}

describe('CLI', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'loop-asks-'));

  it('file-marjorie files, rewrites the body, and edits the brief issue', async () => {
    const bodyFile = path.join(dir, 'brief.md');
    writeFileSync(bodyFile, '**Tree**\n- For Tree: fix the /shop pair\n');
    const { gh, calls } = fakeGh([]);
    const code = await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': bodyFile, out: bodyFile }, { gh });
    expect(code).toBe(0);
    expect(readFileSync(bodyFile, 'utf8')).toContain('→ [#4301]');
    expect(calls.find((c) => c[1] === 'edit')?.slice(0, 3)).toEqual(['issue', 'edit', '4280']);
  });

  it('file-marjorie leaves the body unchanged and exits 0 when GitHub fails', async () => {
    const bodyFile = path.join(dir, 'brief-fail.md');
    writeFileSync(bodyFile, '**Tree**\n- For Tree: fix the /shop pair\n');
    const gh = vi.fn(async () => { throw new Error('HTTP 502'); });
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await fileMarjorie({ issue: '1', 'issue-url': 'u', 'body-file': bodyFile, out: bodyFile }, { gh })).toBe(0);
    expect(readFileSync(bodyFile, 'utf8')).toBe('**Tree**\n- For Tree: fix the /shop pair\n');
    expect(log.mock.calls.flat().join('\n')).toContain('::warning::');
    log.mockRestore();
  });

  it('file-marjorie exits 0 and leaves the body unchanged when gh hangs past timeoutMs', async () => {
    const bodyFile = path.join(dir, 'brief-hang.md');
    writeFileSync(bodyFile, '**Tree**\n- For Tree: fix the /shop pair\n');
    const gh = vi.fn(() => new Promise(() => {}));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await fileMarjorie({ issue: '1', 'issue-url': 'u', 'body-file': bodyFile, out: bodyFile }, { gh, timeoutMs: 20 });
    expect(code).toBe(0);
    expect(readFileSync(bodyFile, 'utf8')).toBe('**Tree**\n- For Tree: fix the /shop pair\n');
    log.mockRestore();
  });

  it('file-marjorie handles a CRLF brief: files the ask and keeps the CRLF endings (Codex round 2)', async () => {
    const CRLF = String.fromCharCode(13, 10);
    const bodyFile = path.join(dir, 'brief-crlf.md');
    writeFileSync(bodyFile, ['**Tree**', '- For Tree: fix the /shop pair', '**Distance to done**', ''].join(CRLF));
    const { gh, calls } = fakeGh([]);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': bodyFile, out: bodyFile }, { gh });
    log.mockRestore();
    expect(calls.some((c) => c[1] === 'create')).toBe(true);
    expect(readFileSync(bodyFile, 'utf8')).toBe(['**Tree**', `- For Tree: fix the /shop pair → [#4301](<${URL_4301}>)`, '**Distance to done**', ''].join(CRLF));
  });

  it('file-marjorie replaces the out file atomically — no temp file left behind (Codex round 2)', async () => {
    const bodyFile = path.join(dir, 'brief-atomic.md');
    writeFileSync(bodyFile, '**Tree**\n- For Tree: fix the /shop pair\n');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': bodyFile, out: bodyFile }, { gh: fakeGh([]).gh });
    log.mockRestore();
    expect(readdirSync(dir).filter((f) => f.includes('.tmp-'))).toEqual([]);
    expect(readFileSync(bodyFile, 'utf8')).toContain('→ [#4301]');
  });

  it('a settled gh call leaves no timeout timer pending (Codex round 2)', async () => {
    vi.useFakeTimers();
    try {
      await fileAsk('tree', { ask: 'x', why: '', contradicts: null }, { sourceNumber: 1, sourceUrl: 'u', gh: fakeGh([]).gh });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('file-tree writes the brief block even when the plan file is unreadable', async () => {
    const out = path.join(dir, 'loop.json');
    const { gh } = fakeGh([]);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await fileTree({ plan: path.join(dir, 'missing.json'), pr: '4300', 'pr-url': 'u', out }, { gh, now: NOW });
    log.mockRestore();
    expect(JSON.parse(readFileSync(out, 'utf8')).lines[1]).toBe('- Nothing this week.');
  });
});
