import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #4364: byte/hash fixtures and source-text contract tests are LF-authored.
// On Windows (core.autocrlf=true) they only pass if the checkout stays LF,
// which the repo-wide .gitattributes default guarantees.
describe('.gitattributes line-ending policy (#4364)', () => {
  const attrs = readFileSync('.gitattributes', 'utf8').replace(/\r\n/g, '\n');

  it('pins every text file to LF on checkout, before the narrower rules', () => {
    const lines = attrs.split('\n');
    const idx = lines.indexOf('* text=auto eol=lf');
    expect(idx).toBeGreaterThanOrEqual(0);
    // A later `-text`/`eol=crlf` override for the fixtures would defeat it.
    expect(attrs).not.toMatch(/fixtures\/bundle.*(-text|eol=crlf)/);
  });

  it('keeps the byte-exact fixture bundle free of CR bytes in this checkout', () => {
    const manifest = readFileSync('packages/content/src/fixtures/bundle/manifest.json', 'utf8');
    expect(manifest).not.toContain('\r');
  });
});
