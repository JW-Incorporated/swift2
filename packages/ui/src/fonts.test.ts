import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd().replaceAll('\\', '/');
const fonts = join(root, 'packages/ui/fonts');
const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

// The generator writes `<file>.<hash>.woff2` URLs for web and base64 data URIs
// for the DOM host; both must name the same bytes (pixel parity, WP2.1-C).
const LATIN = new Set([
  'inter',
  'playfair-display',
  'special-elite',
  'dancing-script',
  'bodoni-moda',
  'bodoni-moda-italic',
]);
const webHashes = [
  ...readFileSync(join(fonts, 'fonts.web.css'), 'utf8').matchAll(
    /url\('\/fonts\/([\w-]+)\.([0-9a-f]{8})\.woff2'\)/g,
  ),
]
  .map((m) => `${m[1]}:${m[2]}`)
  .filter((h) => LATIN.has(h.split(':')[0] as string));
const domHashes = [
  ...readFileSync(join(fonts, 'fonts.dom.css'), 'utf8').matchAll(
    /url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/g,
  ),
].map((m) => sha(Buffer.from(m[1] as string, 'base64')));

describe('self-hosted reader fonts', () => {
  it('generated files are up to date with the woff2 sources', () => {
    const run = () =>
      execFileSync('node', ['packages/ui/scripts/build-fonts.mjs', '--check'], {
        cwd: root,
        stdio: 'pipe',
      });
    expect(run).not.toThrow();
  });

  it('web CSS and DOM CSS reference the same font bytes, face for face', () => {
    expect(webHashes.length).toBe(6);
    expect(domHashes).toEqual(webHashes.map((h) => h.split(':')[1]));
  });

  it('every web URL hash matches the committed source file', () => {
    for (const h of webHashes) {
      const [name, hash] = h.split(':') as [string, string];
      expect(sha(readFileSync(join(fonts, `${name}.woff2`)))).toBe(hash);
    }
  });

  const fixture = JSON.parse(
    readFileSync(join(fonts, '..', 'src/fixtures/next-font-fallbacks.json'), 'utf8'),
  ) as {
    faces: Record<
      string,
      { src: string; ascent: number; descent: number; lineGap: number; sizeAdjust: number }
    >;
    preloadedFaces: number;
  };
  const fallbackRules = (css: string) =>
    Object.fromEntries(
      [...css.matchAll(/@font-face \{\s*font-family: '([^']+) Fallback';[^}]*\}/g)].map((m) => {
        const num = (k: string) =>
          Number.parseFloat(new RegExp(`${k}: ([\\d.]+)%`).exec(m[0])?.[1] ?? 'NaN');
        return [
          m[1],
          {
            src: /local\('([^']+)'\)/.exec(m[0])?.[1],
            ascent: num('ascent-override'),
            descent: num('descent-override'),
            lineGap: num('line-gap-override'),
            sizeAdjust: num('size-adjust'),
          },
        ];
      }),
    );

  it('fallback faces equal next/font values recorded from a main build', () => {
    for (const f of ['fonts.web.css', 'fonts.dom.css']) {
      expect(fallbackRules(readFileSync(join(fonts, f), 'utf8'))).toEqual(fixture.faces);
    }
  });

  it('fallback faces equal next own calculator', () => {
    const { calculateSizeAdjustValues } = createRequire(import.meta.url)(
      'next/dist/server/font-utils',
    ) as {
      calculateSizeAdjustValues: (family: string) => {
        ascent: string;
        descent: string;
        lineGap: string;
        sizeAdjust: string;
        fallbackFont: string;
      };
    };
    for (const [family, want] of Object.entries(fixture.faces)) {
      const n = calculateSizeAdjustValues(family);
      expect({
        src: n.fallbackFont,
        ascent: Number(n.ascent),
        descent: Number(n.descent),
        lineGap: Number(n.lineGap),
        sizeAdjust: Number(n.sizeAdjust),
      }).toEqual(want);
    }
  });

  it('preloads every face, as next/font did on every page', () => {
    const m = JSON.parse(readFileSync(join(fonts, 'fonts.manifest.json'), 'utf8')) as {
      preload: string[];
    };
    expect(m.preload.length).toBe(fixture.preloadedFaces);
    expect(new Set(m.preload).size).toBe(webHashes.length);
  });

  it('keeps the --font-* variable names in both CSS files', () => {
    for (const f of ['fonts.web.css', 'fonts.dom.css']) {
      const css = readFileSync(join(fonts, f), 'utf8');
      for (const v of ['inter', 'playfair', 'typewriter', 'script', 'bodoni']) {
        expect(css).toContain(`--font-${v}:`);
      }
    }
  });

  it('web CSS declares every subset face next/font/google declared (24: 6 latin + 18)', () => {
    const css = readFileSync(join(fonts, 'fonts.web.css'), 'utf8');
    expect(css.match(/url\('\/fonts\//g)?.length).toBe(24);
    expect(css.match(/unicode-range: U\+0000-00FF/g)?.length).toBe(6);
  });

  it('the web layout no longer uses next/font/google', () => {
    expect(readFileSync(join(root, 'apps/web/app/layout.tsx'), 'utf8')).not.toContain(
      'next/font/google',
    );
  });
});
