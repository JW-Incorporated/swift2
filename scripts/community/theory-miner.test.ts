import { describe, expect, it } from 'vitest';
import { parseArgs } from './theory-miner.mjs';

describe('parseArgs', () => {
  it('defaults to .artifacts/community-crawl.json', () => {
    expect(parseArgs([]).artifact).toBe('.artifacts/community-crawl.json');
  });

  it('honors --artifact', () => {
    expect(parseArgs(['--artifact', 'custom/path.json']).artifact).toBe('custom/path.json');
  });

  it('honors COMMUNITY_CRAWL_ARTIFACT env when no flag is given', () => {
    const original = process.env.COMMUNITY_CRAWL_ARTIFACT;
    process.env.COMMUNITY_CRAWL_ARTIFACT = 'env/path.json';
    try {
      expect(parseArgs([]).artifact).toBe('env/path.json');
    } finally {
      if (original === undefined) delete process.env.COMMUNITY_CRAWL_ARTIFACT;
      else process.env.COMMUNITY_CRAWL_ARTIFACT = original;
    }
  });

  it('a flag overrides the env var', () => {
    const original = process.env.COMMUNITY_CRAWL_ARTIFACT;
    process.env.COMMUNITY_CRAWL_ARTIFACT = 'env/path.json';
    try {
      expect(parseArgs(['--artifact', 'flag/path.json']).artifact).toBe('flag/path.json');
    } finally {
      if (original === undefined) delete process.env.COMMUNITY_CRAWL_ARTIFACT;
      else process.env.COMMUNITY_CRAWL_ARTIFACT = original;
    }
  });
});
