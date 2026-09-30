import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFacebookExport } from '../../apps/worker/src/sources/facebook-groups-parser';
import { collectGroup } from './fb-export-collect.mjs';

describe('Facebook virtualized feed harvest', () => {
  it('retains scrolled-away units and emits one parser article per post', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'fb-harvest-test-'));
    const unit = (position: number, age = '1 h') => ({
      position,
      identity: `post-${position}`,
      textLength: 20,
      hasAuthor: true,
      html: `<section aria-posinset="${position}"><div role="article"><a aria-label="Fan ${position}">Fan ${position}</a><p>Album discussion ${position}</p><span>${position} reactions</span><span>${position} comments</span><div role="article"><p>Nested comment ${position}</p></div></div></section>`,
      timestamps: [age],
    });
    const emptyShell = (position: number) => ({
      position,
      identity: `post-${position}`,
      textLength: 20,
      hasAuthor: false,
      html: `<section aria-posinset="${position}"></section>`,
      timestamps: [],
    });
    const snapshots = [
      { units: [unit(1), unit(2)], maxPosinset: 2 },
      { units: [emptyShell(1), emptyShell(2), unit(3), unit(4)], maxPosinset: 4 },
      { units: [emptyShell(3), emptyShell(4), unit(5), unit(6, '8 d')], maxPosinset: 6 },
    ];
    let captureIndex = 0;
    const page = {
      goto: vi.fn(),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      url: () => 'https://www.facebook.com/groups/123',
      evaluate: vi.fn(async (callback: () => unknown) => {
        const source = callback.toString();
        if (source.includes('hasPassword'))
          return { text: '', hasPassword: false, hasJoinGroup: false };
        if (source.includes('maxPosinset')) return snapshots[captureIndex++];
        return source.includes('count += 1') ? 0 : undefined;
      }),
    };

    try {
      const result = await collectGroup(
        page as never,
        { slug: 'group-a', label: 'Group A', groupId: '123' } as never,
        {
          outputDir: directory,
          now: new Date('2026-09-30T12:00:00Z'),
          sleep: vi.fn(),
          random: () => 0,
        },
      );
      expect(result).toMatchObject({
        status: 'collected',
        stopReason: 'seven-days',
        harvestedCount: 6,
        slotCount: 6,
      });
      if (!('filePath' in result)) throw new Error('collector did not produce a file');
      const html = await readFile(result.filePath, 'utf8');
      expect(html).toMatch(/^<!doctype html>\n<html><head><meta charset="utf-8">/);
      expect(html.match(/role="article"/g)).toHaveLength(6);
      expect(html.match(/data-fb-role="comment-article"/g)).toHaveLength(12);
      expect(html).toContain('Album discussion 1');
      expect(parseFacebookExport(html, { groupSlug: 'group-a' }).volume).toBe(6);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
