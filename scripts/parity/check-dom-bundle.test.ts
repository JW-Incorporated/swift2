import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script
import { checkDomBundle, findForbiddenSources, pickSentinel } from './check-dom-bundle.mjs';

const SENTINELS = [
  { kind: 'moment', text: 'MOMENT SENTINEL TITLE' },
  { kind: 'track', text: 'TRACK SENTINEL' },
  { kind: 'merch', text: 'MERCH SENTINEL' },
];

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
        '/r/apps/web/lib/longlive/tracks.generated.ts',
        '/r/apps/web/lib/other/merch.generated.ts',
        '/r/apps/web/lib/longlive/era-secrets.ts',
      ]),
    ).toHaveLength(5);
  });

  it('picks a plain ASCII sentinel with no quotes or backslashes', () => {
    expect(pickSentinel(['short', 'A long enough moment title for sentinel'])).toBe('A long enough moment title for sentinel');
    expect(pickSentinel(['has "quotes" and is quite long enough for it', "it's quite long enough for the picker"])).toBeNull();
    expect(pickSentinel(['Tim McGraw'], 12)).toBeNull();
    expect(pickSentinel(['Picture to Burn'], 12)).toBe('Picture to Burn');
  });

  it('passes a clean ReaderSpike bundle', () => {
    const root = fixture(['/r/apps/mobile/dom/ReaderSpike.tsx'], 'var x=1');
    expect(checkDomBundle(root, SENTINELS).problems).toEqual([]);
  });

  it('fails when baked content or the sentinel is present, or no ReaderSpike map', () => {
    const baked = fixture(
      ['/r/apps/mobile/dom/ReaderSpike.tsx', '/r/apps/web/lib/longlive/generated/c.generated.ts'],
      'var t="MOMENT SENTINEL TITLE"',
    );
    expect(checkDomBundle(baked, SENTINELS).problems).toHaveLength(2);
    const oneEach = fixture(['/r/apps/mobile/dom/ReaderSpike.tsx'], 'var a="TRACK SENTINEL",b="MERCH SENTINEL"');
    expect(checkDomBundle(oneEach, SENTINELS).problems.map((p: string) => p.split(' sentinel')[0])).toEqual([
      'a.js: contains track',
      'a.js: contains merch',
    ]);
    const none = fixture(['/r/apps/mobile/dom/SharedUiTest.tsx'], 'var x=1');
    expect(checkDomBundle(none, SENTINELS).problems).toHaveLength(1);
  });
});
