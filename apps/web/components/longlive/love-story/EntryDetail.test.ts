import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('EntryDetail solo narrative', () => {
  it('renders the deeper story and its citations', () => {
    const source = readFileSync(new URL('./EntryDetail.tsx', import.meta.url), 'utf8');

    expect(source).toContain('{soloContext}');
    expect(source).toContain("soloSources.map((source, index)");
    expect(source).toContain('href={source.url}');
    expect(source).toContain('rel="noopener noreferrer"');
  });
});
