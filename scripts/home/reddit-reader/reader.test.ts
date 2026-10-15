import { describe, expect, it } from 'vitest';
// @ts-expect-error plain JavaScript module
import { buildSources, parseArgs } from './reader.mjs';

describe('home Reddit reader configuration', () => {
  it('uses anonymous server-rendered pages and puts theory new first', () => {
    const config = {
      subs: [{ name: 'TaylorSwift' }, { name: 'TaylorSwiftTheories' }],
      search: { queries: ['"taylor swift"'] },
    };
    const sources = buildSources(config, ['TaylorSwiftTheories']);
    expect(sources[0]).toMatchObject({
      id: 'theory:TaylorSwiftTheories:new',
      theory: true,
    });
    expect(
      sources.every((source: { url: string }) => source.url.startsWith('https://old.reddit.com/')),
    ).toBe(true);
  });

  it('requires a bounded page budget', () => {
    expect(parseArgs(['--dry-run', '--max-pages', '3'])).toEqual({ dryRun: true, maxPages: 3 });
    expect(() => parseArgs(['--max-pages', '301'])).toThrow(/1 to 300/);
  });
});
