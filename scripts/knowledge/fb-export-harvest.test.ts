import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFacebookExport } from '../../apps/worker/src/sources/facebook-groups-parser';
import { collectGroup } from './fb-export-collect.mjs';
import { firstOwnTimestamp } from './fb-export-harvest.mjs';

describe('Facebook virtualized feed harvest', () => {
  it('uses the first readable top-level timestamp value', () => {
    expect(firstOwnTimestamp(['Fan Name', '2 h', '6 weeks'])).toBe('2 h');
    expect(firstOwnTimestamp(['October 13', '3 h'], new Date('2026-09-30T12:00:00-07:00'))).toBe(
      '3 h',
    );
  });
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
      {
        units: [emptyShell(3), emptyShell(4), unit(5, '8 d'), unit(6, '9 d'), unit(7, '10 d')],
        maxPosinset: 7,
      },
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
        harvestedCount: 7,
        recentCount: 4,
        coverageAgeMs: 8 * 86_400_000,
        slotCount: 7,
      });
      if (!('filePath' in result)) throw new Error('collector did not produce a file');
      const html = await readFile(result.filePath, 'utf8');
      expect(html).toMatch(/^<!doctype html>\n<html><head><meta charset="utf-8">/);
      expect(html.match(/role="article"/g)).toHaveLength(4);
      expect(html.match(/data-fb-role="comment-article"/g)).toHaveLength(8);
      expect(html).toContain('Album discussion 1');
      expect(html).not.toContain('Album discussion 5');
      expect(parseFacebookExport(html, { groupSlug: 'group-a' }).volume).toBe(4);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reports no-recent-posts when every harvested unit is outside seven days', async () => {
    const snapshot = {
      units: [1, 2, 3].map((position) => ({
        position,
        identity: `old-post-${position}`,
        textLength: 20,
        hasAuthor: true,
        html: `<div role="article"><a aria-label="Fan">Fan</a><p>Old post ${position}</p></div>`,
        ownTimestamp: `${7 + position} d`,
      })),
      maxPosinset: 3,
    };
    const page = {
      goto: vi.fn(),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      url: () => 'https://www.facebook.com/groups/123',
      evaluate: vi.fn(async (callback: () => unknown) => {
        const source = callback.toString();
        if (source.includes('hasPassword'))
          return { text: '', hasPassword: false, hasJoinGroup: false };
        if (source.includes('maxPosinset')) return snapshot;
        return source.includes('count += 1') ? 0 : undefined;
      }),
    };
    await expect(
      collectGroup(page as never, { slug: 'group-a', label: 'Group A', groupId: '123' } as never, {
        outputDir: 'unused',
        sleep: vi.fn(),
      }),
    ).resolves.toMatchObject({
      status: 'no-recent-posts',
      harvestedCount: 3,
      recentCount: 0,
      stopReason: 'seven-days',
      coverageAgeMs: 8 * 86_400_000,
    });
  });
});
