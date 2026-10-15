import { describe, expect, it } from 'vitest';
import {
  isOfficialDomain as isSharedOfficial,
  OFFICIAL_DOMAINS as SHARED_OFFICIAL_DOMAINS,
} from '../../packages/shared/src/source-tiers';
import {
  isOfficialDomain as isScriptOfficial,
  OFFICIAL_DOMAINS as SCRIPT_OFFICIAL_DOMAINS,
} from './reputable-sources.mjs';

const CASES = [
  ['https://taylorswift.com/', true],
  ['https://www.republicrecords.com/blogs/news', true],
  ['https://umusic.com/press', true],
  ['https://www.universalmusic.com/news', true],
  ['https://www.youtube.com/channel/UCqECaJ8Gagnn7YCbPEzWH6g', true],
  ['https://www.youtube.com/channel/not-taylor', false],
  ['https://www.ticketmaster.com/taylor-swift-tickets/artist/1094215', true],
  ['https://app.ticketmaster.com/discovery/v2/attractions/K8vZ9175dV7.json', true],
  ['https://www.ticketmaster.com/someone-else-tickets/artist/12345', false],
] as const;

describe('reputable-source mirror parity', () => {
  it('keeps OFFICIAL_DOMAINS identical to the shared source of truth', () => {
    expect([...SCRIPT_OFFICIAL_DOMAINS].sort()).toEqual([...SHARED_OFFICIAL_DOMAINS].sort());
  });

  it.each(CASES)('matches shared official URL behavior for %s', (url, expected) => {
    expect(isScriptOfficial(url)).toBe(expected);
    expect(isSharedOfficial(url)).toBe(expected);
  });
});
