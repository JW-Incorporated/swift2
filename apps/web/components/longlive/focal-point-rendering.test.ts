import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentSource = (relPath: string) =>
  readFileSync(new URL(relPath, import.meta.url), 'utf8');

/**
 * #746: these are every Long Live component that cover-crops an ImageRef.
 * Keep this list in sync when a new ImageRef photo surface is added: reducing
 * an ImageRef to its URL loses the authored subject/face position.
 */
describe('ImageRef cover crops respect authored focal points (#746)', () => {
  it.each([
    ['../../../../packages/ui/src/reader/era/MomentCardButton.tsx', 3],
    ['./MomentDetail.tsx', 3],
    ['../../../../packages/ui/src/reader/threads/FromTheEras.tsx', 1],
    ['../../../../packages/ui/src/reader/threads/proposal/ProposalThread.tsx', 1],
    ['../../../../packages/ui/src/reader/threads/runway/RunwayThread.tsx', 2],
  ])('%s applies focalPointOf at every ImageRef cover crop', (relPath, expectedUses) => {
    const src = componentSource(relPath);
    expect(src).toContain('focalPointOf');
    expect(src.match(/objectPosition:\s*focalPointOf\(/g)).toHaveLength(expectedUses);
  });
});
