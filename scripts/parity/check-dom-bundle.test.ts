import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script
import { checkDomBundle, findForbiddenSources, pickSentinel } from './check-dom-bundle.mjs';

function fixture(sources: string[], js: string) {
  const root = mkdtempSync(path.join(tmpdir(), 'dom-bundle-'));
  const dir = path.join(root, 'www.bundle');
  mkdirSync(dir);
  writeFileSync(path.join(dir, 'a.map'), JSON.stringify({ sources }));
  writeFileSync(path.join(dir, 'a.js'), js);
  return root;
}

describe('check-dom-bundle', () => {
  it('flags generated sources and the dev loader, in either slash style', () => {
    expect(
      findForbiddenSources([
        '/r/apps/web/lib/longlive/generated/content.generated.ts',
        'C:\\r\\apps\\web\\lib\\longlive\\generated\\x.ts',
        '/r/apps/mobile/dom/spike/dev-loader.ts',
        '/r/apps/web/lib/longlive/store/index.tsx',
      ]),
    ).toHaveLength(3);
  });

  it('picks a plain long title as the sentinel', () => {
    expect(pickSentinel([{ title: 'short' }, { title: 'A long enough moment title for sentinel' }])).toBe(
      'A long enough moment title for sentinel',
    );
    expect(pickSentinel([{ title: 'has "quotes" and is quite long enough for it' }])).toBeNull();
  });

  it('passes a clean ReaderSpike bundle', () => {
    const root = fixture(['/r/apps/mobile/dom/ReaderSpike.tsx'], 'var x=1');
    expect(checkDomBundle(root, 'SENTINEL TITLE').problems).toEqual([]);
  });

  it('fails when baked content or the sentinel is present, or no ReaderSpike map', () => {
    const baked = fixture(
      ['/r/apps/mobile/dom/ReaderSpike.tsx', '/r/apps/web/lib/longlive/generated/c.generated.ts'],
      'var t="SENTINEL TITLE"',
    );
    expect(checkDomBundle(baked, 'SENTINEL TITLE').problems).toHaveLength(2);
    const none = fixture(['/r/apps/mobile/dom/SharedUiTest.tsx'], 'var x=1');
    expect(checkDomBundle(none, 'S').problems).toHaveLength(1);
  });
});
