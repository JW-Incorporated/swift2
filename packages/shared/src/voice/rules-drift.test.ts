import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import rules from './rules.json';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.scratch', 'dist', 'coverage', 'artifacts', 'docs']);
const SOURCE_EXT = /\.(?:ts|tsx|mjs|js|cjs)$/;
const SELF = 'packages/shared/src/voice/rules-drift.test.ts';

// TODO(S7): scripts/social/check-drafts.mjs is the social surface; Claude repoints it in slice S7.
const ALLOWLIST = new Set(['scripts/social/check-drafts.mjs']);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) sourceFiles(join(dir, entry.name), out);
    } else if (SOURCE_EXT.test(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const patterns = [
  ...rules.aiTells.core,
  ...rules.aiTells.newsExtra,
  ...rules.aiTells.communityExtra,
  ...rules.formulaFrames.contrast,
  ...rules.formulaFrames.tagAFriend,
].map((entry) => entry.pattern);

describe('voice rules drift', () => {
  it('no source file hard-codes a copy of a rules.json pattern', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(ROOT)) {
      const rel = relative(ROOT, file).split(sep).join('/');
      if (rel === SELF || ALLOWLIST.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      const hit = patterns.find((pattern) => text.includes(pattern) || text.includes(pattern.replace(/\\/g, '\\\\')));
      if (hit) offenders.push(`${rel}: ${hit}`);
    }
    expect(offenders).toEqual([]);
  });
});
