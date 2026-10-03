import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd().replaceAll('\\', '/');
const fonts = join(root, 'packages/ui/fonts');
const sha = (buf: Buffer) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

// The generator writes `<file>.<hash>.woff2` URLs for web and base64 data URIs
// for the DOM host; both must name the same bytes (pixel parity, WP2.1-C).
const webHashes = [
  ...readFileSync(join(fonts, 'fonts.web.css'), 'utf8').matchAll(
    /url\('\/fonts\/([\w-]+)\.([0-9a-f]{8})\.woff2'\)/g,
  ),
].map((m) => `${m[1]}:${m[2]}`);
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

  it('keeps the --font-* variable names in both CSS files', () => {
    for (const f of ['fonts.web.css', 'fonts.dom.css']) {
      const css = readFileSync(join(fonts, f), 'utf8');
      for (const v of ['inter', 'playfair', 'typewriter', 'script', 'bodoni']) {
        expect(css).toContain(`--font-${v}:`);
      }
    }
  });

  it('the web layout no longer uses next/font/google', () => {
    expect(readFileSync(join(root, 'apps/web/app/layout.tsx'), 'utf8')).not.toContain(
      'next/font/google',
    );
  });
});
