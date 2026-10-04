import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script
import { canonicalizeSource, checkDomBundle, findForbiddenSources, pickSentinel, sentinelsFromPublishedBundle } from './check-dom-bundle.mjs';

const SENTINELS = [
  { kind: 'moment', text: 'MOMENT SENTINEL TITLE' },
  { kind: 'track', text: 'TRACK SENTINEL' },
  { kind: 'merch', text: 'MERCH SENTINEL' },
];

const FIXTURE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__/content-root');

function fixture(sources: string[], js: string, opts: { mapped?: boolean } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'dom-bundle-'));
  const dir = path.join(root, 'apps/mobile/www.bundle');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'a.map'), JSON.stringify({ sources, debugId: 'id-1' }));
  writeFileSync(path.join(dir, 'a.js'), `${js}
//# debugId=${opts.mapped === false ? 'id-other' : 'id-1'}
`);
  return root;
}

const exportDirOf = (root: string) => path.join(root, 'apps/mobile');

describe('check-dom-bundle', () => {
  it('flags generated sources and the dev loader, in either slash style', () => {
    expect(
      findForbiddenSources([
        '/r/apps/web/lib/longlive/generated/content.generated.ts',
        'C:\\r\\apps\\web\\lib\\longlive\\generated\\x.ts',
        '/r/apps/mobile/dom/reader/dev-loader.ts',
        '/r/apps/web/lib/longlive/store/index.tsx',
        '/r/apps/web/lib/longlive/tracks.generated.ts',
        '/r/apps/web/lib/other/merch.generated.ts',
        '/r/apps/web/lib/longlive/era-secrets.ts',
      ]),
    ).toHaveLength(5);
  });

  it('matches forbidden paths case-insensitively and after URL-decoding', () => {
    expect(findForbiddenSources(['/r/apps/mobile/DOM/Reader/Dev-Loader.ts'])).toHaveLength(1);
    expect(findForbiddenSources(['/r/apps/mobile/dom/reader/dev-loader%2Ets', '/r/apps/web/lib/x%2Egenerated%2Ets'])).toHaveLength(2);
    expect(findForbiddenSources(['/r/%E0%A4%A/index.web.ts'])).toHaveLength(1);
  });

  it('picks a plain ASCII sentinel with no quotes or backslashes', () => {
    expect(pickSentinel(['short', 'A long enough moment title for sentinel'])).toBe('A long enough moment title for sentinel');
    expect(pickSentinel(['has "quotes" and is quite long enough for it', "it's quite long enough for the picker"])).toBeNull();
    expect(pickSentinel(['Tim McGraw'], 12)).toBeNull();
    expect(pickSentinel(['Picture to Burn'], 12)).toBe('Picture to Burn');
  });

  it('a stale ReaderSpike export no longer satisfies the check', () => {
    const root = fixture(['/r/apps/mobile/dom/ReaderSpike.tsx'], 'var x=1');
    expect(checkDomBundle(exportDirOf(root), SENTINELS, root).problems.join()).toMatch(/AppReader/);
  });

  it('passes a clean AppReader bundle', () => {
    const root = fixture(['/r/apps/mobile/dom/AppReader.tsx'], 'var x=1');
    expect(checkDomBundle(exportDirOf(root), SENTINELS, root).problems).toEqual([]);
  });

  it('fails when baked content or the sentinel is present, or no AppReader map', () => {
    const baked = fixture(
      ['/r/apps/mobile/dom/AppReader.tsx', '/r/apps/web/lib/longlive/generated/c.generated.ts'],
      'var t="MOMENT SENTINEL TITLE"',
    );
    expect(checkDomBundle(exportDirOf(baked), SENTINELS, baked).problems).toHaveLength(2);
    const oneEach = fixture(['/r/apps/mobile/dom/AppReader.tsx'], 'var a="TRACK SENTINEL",b="MERCH SENTINEL"');
    expect(checkDomBundle(exportDirOf(oneEach), SENTINELS, oneEach).problems.map((p: string) => p.split(' sentinel')[0])).toEqual([
      'a.js: contains track',
      'a.js: contains merch',
    ]);
    const none = fixture(['/r/apps/mobile/dom/SharedUiTest.tsx'], 'var x=1');
    expect(checkDomBundle(exportDirOf(none), SENTINELS, none).problems).toHaveLength(1);
  });
  it('fails a chunk with no sourcemap, naming it', () => {
    const root = fixture(['/r/apps/mobile/dom/AppReader.tsx'], 'var x=1', { mapped: false });
    expect(checkDomBundle(exportDirOf(root), SENTINELS, root).problems).toEqual(['a.js: chunk has no sourcemap (debugId id-other)']);
  });

  it('canonicalizes relative sources before matching', () => {
    const root = fixture(['../../web/lib/x.generated.ts', '/apps/mobile/dom/AppReader.tsx'], 'var x=1');
    expect(checkDomBundle(exportDirOf(root), SENTINELS, root).problems).toEqual(['a.map: forbidden source apps/web/lib/x.generated.ts']);
    const map = path.join(root, 'apps/mobile/www.bundle/a.map');
    expect(canonicalizeSource('/apps/mobile/dom/AppReader.tsx', map, undefined, root)).toBe('apps/mobile/dom/AppReader.tsx');
    expect(canonicalizeSource('x.generated.ts', map, '../../web/lib', root)).toBe('apps/web/lib/x.generated.ts');
  });

  it('extracts all four sentinel kinds from a committed content fixture', () => {
    expect(sentinelsFromPublishedBundle(FIXTURE_ROOT)).toEqual([
      { kind: 'moment', text: 'Fixture moment title long enough for sentinel' },
      { kind: 'track', text: 'Fixture Track Title' },
      { kind: 'theory', text: 'Fixture theory title long enough to qualify' },
      { kind: 'merch', text: 'Fixture merch item name' },
    ]);
  });

  it('throws with the sync:content hint when content is missing', () => {
    expect(() => sentinelsFromPublishedBundle(mkdtempSync(path.join(tmpdir(), 'no-content-')))).toThrow(/sync:content/);
  });
});
