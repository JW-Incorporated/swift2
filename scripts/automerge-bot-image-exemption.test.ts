import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFilesMeta, uncoveredSocialImages } from './automerge-bot-image-exemption.mjs';

const IMG = 'apps/web/public/social/library/merch-drop-123456.png';
const INBOX = 'social/inbox/merch-2026-10-05-some-shirt-9999.json';
const BRANCH = 'merch-official-sync/123456';
const add = (filename: string) => ({ status: 'added', filename });

describe('merch drop-card image exemption', () => {
  it('exempts the exact drop image on the sync branch with an added inbox sheet', () => {
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG), add(INBOX), add('docs/ops/AFFILIATE-COVERAGE.md')] })).toEqual([]);
  });

  it('declines the same image on another branch', () => {
    expect(uncoveredSocialImages({ branch: 'tree/2026-10-05', files: [add(IMG), add(INBOX)] })).toEqual([IMG]);
    expect(uncoveredSocialImages({ branch: 'merch-official-sync', files: [add(IMG), add(INBOX)] })).toEqual([IMG]);
    expect(uncoveredSocialImages({ branch: 'merch-official-sync/', files: [add(IMG), add(INBOX)] })).toEqual([IMG]);
  });

  it('declines a drop image without an inbox fact sheet', () => {
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG)] })).toEqual([IMG]);
  });

  it('does not count a modified or non-merch inbox file', () => {
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG), { status: 'modified', filename: INBOX }] })).toEqual([IMG]);
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG), add('social/inbox/other-thing.json')] })).toEqual([IMG]);
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG), add('social/inbox/sub/merch-x.json')] })).toEqual([IMG]);
  });

  it('declines a non-merch-drop image on the sync branch', () => {
    const other = 'apps/web/public/social/library/other-card.png';
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(other), add(INBOX)] })).toEqual([other]);
    const jpg = 'apps/web/public/social/library/merch-drop-1.jpg';
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(jpg), add(INBOX)] })).toEqual([jpg]);
    const alpha = 'apps/web/public/social/library/merch-drop-abc.png';
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(alpha), add(INBOX)] })).toEqual([alpha]);
  });

  it('declines traversal and different-directory paths', () => {
    for (const p of [
      'apps/web/public/social/library/../merch-drop-1.png',
      'apps/web/public/social/library/sub/merch-drop-1.png',
      'apps/web/public/social/merch-drop-1.png',
      'apps/web/public/social/library/merch-drop-1.png/../x.png',
    ]) {
      expect(uncoveredSocialImages({ branch: BRANCH, files: [add(p), add(INBOX)] })).toEqual([p]);
    }
  });

  it('declines a modified (not newly added) drop image', () => {
    expect(uncoveredSocialImages({ branch: BRANCH, files: [{ status: 'modified', filename: IMG }, add(INBOX)] })).toEqual([IMG]);
  });

  it('one exempt image does not cover a stray second image', () => {
    const stray = 'apps/web/public/social/library/evil.png';
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(IMG), add(stray), add(INBOX)] })).toEqual([stray]);
  });

  it('ignores non-images and parses the TSV file list', () => {
    expect(uncoveredSocialImages({ branch: BRANCH, files: [add(INBOX)] })).toEqual([]);
    expect(parseFilesMeta(`added\t${IMG}\t\nadded\t${INBOX}\t\n`)).toEqual([add(IMG), add(INBOX)]);
  });

  describe('concert-photo-sourcing library photo exemption', () => {
    const PHOTO = 'apps/web/public/social/library/photos/reddit-erastour-1ptssc4-ig45.jpg';
    const LIB = 'social/photo-library.json';
    const PB = 'social/concert-photo-sourcing';
    const mod = (filename: string) => ({ status: 'modified', filename });

    it('exempts added photos with a modified or added photo-library.json', () => {
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO), mod(LIB)] })).toEqual([]);
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO), add(LIB)] })).toEqual([]);
      for (const ext of ['jpeg', 'png', 'webp']) {
        const p = `apps/web/public/social/library/photos/x-1.${ext}`;
        expect(uncoveredSocialImages({ branch: PB, files: [add(p), mod(LIB)] })).toEqual([]);
      }
    });

    it('declines the same photo on another branch', () => {
      for (const b of ['tree/2026-10-06', 'social/concert-photo-sourcing-2', 'social/concert-photo-sourcing/x', '']) {
        expect(uncoveredSocialImages({ branch: b, files: [add(PHOTO), mod(LIB)] })).toEqual([PHOTO]);
      }
    });

    it('declines photos without a photo-library.json change', () => {
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO)] })).toEqual([PHOTO]);
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO), { status: 'removed', filename: LIB }] })).toEqual([PHOTO]);
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO), mod('social/photo-library.json.bak')] })).toEqual([PHOTO]);
    });

    it('declines a modified or renamed (not newly added) photo', () => {
      expect(uncoveredSocialImages({ branch: PB, files: [mod(PHOTO), mod(LIB)] })).toEqual([PHOTO]);
      expect(uncoveredSocialImages({ branch: PB, files: [{ status: 'renamed', filename: PHOTO }, mod(LIB)] })).toEqual([PHOTO]);
    });

    it('declines subdirectory, traversal, wrong directory and wrong extension', () => {
      for (const p of [
        'apps/web/public/social/library/photos/sub/x.jpg',
        'apps/web/public/social/library/photos/../x.jpg',
        'apps/web/public/social/library/photos/../../x.png',
        'apps/web/public/social/library/photos/x.jpg/../y.jpg',
        'apps/web/public/social/library/x.jpg',
        'apps/web/public/social/photos/x.jpg',
        'apps/web/public/social/library/photos/x.svg.png.exe.jpg/y.png',
      ]) {
        expect(uncoveredSocialImages({ branch: PB, files: [add(p), mod(LIB)] })).toEqual([p]);
      }
      expect(uncoveredSocialImages({ branch: PB, files: [add('apps/web/public/social/library/photos/x.gif'), mod(LIB)] })).toEqual([]);
    });

    it('one exempt photo does not cover a stray image, and merch cards do not ride the photo branch', () => {
      const stray = 'apps/web/public/social/library/evil.png';
      expect(uncoveredSocialImages({ branch: PB, files: [add(PHOTO), add(stray), mod(LIB)] })).toEqual([stray]);
      expect(uncoveredSocialImages({ branch: PB, files: [add(IMG), add(INBOX)] })).toEqual([IMG]);
      expect(uncoveredSocialImages({ branch: BRANCH, files: [add(PHOTO), mod(LIB)] })).toEqual([PHOTO]);
    });
  });

  it('is wired into the workflow image gate', () => {
    const wf = readFileSync('.github/workflows/auto-merge-content.yml', 'utf8');
    expect(wf).toContain('node scripts/automerge-bot-image-exemption.mjs');
  });
});
