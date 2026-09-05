import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The resource CSP ships Report-Only with script-src 'unsafe-inline' because
// the app renders no unescaped user- or content-derived HTML today — see the
// "WHY THE CSP IS SPLIT IN TWO" note in security-headers.mjs. That is a fact
// about the current codebase, not something CSP enforces, so it needs its own
// guard: the day a new dangerouslySetInnerHTML sink appears, this test must
// fail loudly rather than let the "no sink" assumption quietly go stale
// (issue #1975's explicit ask). Each sink counted here is JSON.stringify()'d
// structured data with the same `<` → `\u003c` strip as the original
// app/layout.tsx sink, never raw string interpolation — that's what keeps
// them reviewed-safe rather than a real HTML-injection surface.
//
// Scoped to app/ + components/ — where page content renders — not lib/ or
// scripts, and not node_modules/.next build output.
const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['app', 'components'];

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) out.push(...listSourceFiles(abs));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(abs);
  }
  return out;
}

describe('no user/content HTML sink (issue #1975)', () => {
  const hits: { file: string; line: number }[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of listSourceFiles(join(ROOT, dir))) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (line.includes('dangerouslySetInnerHTML')) hits.push({ file, line: i + 1 });
      });
    }
  }

  it('has only the reviewed JSON-LD sinks', () => {
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => hit.file.replace(/\\/g, '/'))).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/app\/layout\.tsx$/),
        expect.stringMatching(/\/components\/longlive\/merch\/MerchCard\.tsx$/),
      ]),
    );
  });
});
