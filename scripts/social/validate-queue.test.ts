// Tree Overhaul T5 (docs/specs/tree-overhaul/t5-lessons-ledger.md, spec
// AC#3) — confirms validate-queue.mjs's own wiring: it reads social/lessons.md
// from a real file on disk, parses it via lib/lessons.mjs, and threads the
// active rule ids into validateQueueItem. lib/queue-schema.test.ts already
// covers validateQueueItem's own rulesChecked enforcement in isolation; this
// file is only about the disk-reading glue validate-queue.mjs adds on top,
// against real fixture files (never the repo's own social/lessons.md).
import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readActiveLessonIds, validateDir } from './validate-queue.mjs';

const validCritique = {
  v: 1,
  scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 },
  total: 23,
  rationale: 'A real pitch sentence, plain English, well under the character cap for this fixture.',
  rulesChecked: [],
  revision: 1,
};

// site-screen (not "photo") so validatePhotoInventoryBinding — which
// validateDir also runs, against the REAL social/photo-library.json — is a
// documented no-op (queue-schema.mjs: `mediaKind !== 'photo' && no photo
// tiles` returns `[]` immediately), independent of this task's fixtures.
function validItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'instagram',
    lane: 'calendar',
    body: 'a real caption',
    media: ['/social/library/mood-chat-screen.png'],
    altText: ['A screenshot of the mood chat feature.'],
    mediaKind: 'site-screen',
    scheduledAt: '2026-08-12T23:00:00Z',
    critique: validCritique,
    ...overrides,
  };
}

const oneActiveRuleLedger = [
  '### L002 — Second rule',
  '',
  '- **Status:** active',
  '- **First seen:** 2026-09-01 (PR #1)',
  '- **Times fired:** 1',
  '- **Last fired:** 2026-09-01 (PR #1)',
  '- **Evidence:** [#1 ✏️](https://example.com)',
  '- **Codify:** —',
  '',
  '**You said:** "example"',
  '',
  '**So I:** do the thing.',
].join('\n');

describe('readActiveLessonIds', () => {
  it("reads a fixture ledger's active rule ids from a real file on disk", async () => {
    const root = await mkdtemp(join(tmpdir(), 'validate-queue-test-'));
    try {
      await mkdir(join(root, 'social'), { recursive: true });
      await writeFile(join(root, 'social', 'lessons.md'), oneActiveRuleLedger);
      expect(await readActiveLessonIds(root)).toEqual(['L002']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('returns [] when social/lessons.md does not exist yet, rather than throwing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'validate-queue-test-'));
    try {
      expect(await readActiveLessonIds(root)).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('validateDir wiring of activeLessonIds (spec AC#3)', () => {
  it('fails empty rulesChecked when activeLessonIds is non-empty, passes the identical item when it is empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'validate-queue-test-'));
    try {
      await writeFile(join(dir, 'a.json'), JSON.stringify(validItem()));

      const withLessons = await validateDir(dir, ['L001']);
      expect(withLessons.failures).toHaveLength(1);
      expect(withLessons.failures[0].findings.some((f: string) => f.includes('critique.rulesChecked: must be non-empty'))).toBe(true);

      const withoutLessons = await validateDir(dir, []);
      expect(withoutLessons.failures).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('defaults activeLessonIds to [] when the caller omits it, preserving pre-T5 behavior', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'validate-queue-test-'));
    try {
      await writeFile(join(dir, 'a.json'), JSON.stringify(validItem()));
      expect((await validateDir(dir)).failures).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
