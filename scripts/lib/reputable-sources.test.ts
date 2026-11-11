import { describe, expect, it } from 'vitest';
import {
  isOfficialDomain as isSharedOfficial,
  OFFICIAL_DOMAINS as SHARED_OFFICIAL_DOMAINS,
  OFFICIAL_TICKETING_IDS as SHARED_TICKETING_IDS,
  OFFICIAL_YOUTUBE_CHANNEL_IDS as SHARED_YOUTUBE_IDS,
} from '../../packages/shared/src/source-tiers';
import {
  isOfficialDomain as isScriptOfficial,
  OFFICIAL_DOMAINS as SCRIPT_OFFICIAL_DOMAINS,
  OFFICIAL_TICKETING_IDS as SCRIPT_TICKETING_IDS,
  OFFICIAL_YOUTUBE_CHANNEL_IDS as SCRIPT_YOUTUBE_IDS,
} from './reputable-sources.mjs';
import {
  OFFICIAL_DOMAINS as GENERATED_OFFICIAL_DOMAINS,
  OFFICIAL_TICKETING_IDS as GENERATED_TICKETING_IDS,
  OFFICIAL_YOUTUBE_CHANNEL_IDS as GENERATED_YOUTUBE_IDS,
} from './source-tiers.generated.mjs';

const CASES = [
  ['https://taylorswift.com/', true],
  ['https://www.republicrecords.com/artists/taylor-swift', true],
  ['https://umusic.com/taylorswift', true],
  ['https://www.universalmusic.com/drake-announces-tour', false],
  ['https://www.republicrecords.com/collections/ariana-grande', false],
  ['https://www.youtube.com/channel/UCqECaJ8Gagnn7YCbPEzWH6g', true],
  ['https://www.youtube.com/channel/not-taylor', false],
  ['https://www.ticketmaster.com/taylor-swift-tickets/artist/1094215', true],
  ['https://app.ticketmaster.com/discovery/v2/attractions/K8vZ9175dV7.json', true],
  ['https://www.ticketmaster.com/someone-else-tickets/artist/12345', false],
  ['https://www.ticketmaster.com/venue/1094215', false],
  ['https://www.ticketmaster.com/?eventId=1094215', false],
  ['https://ticketmaster.com.evil.example/artist/1094215', false],
  ['https://evil-ticketmaster.com/artist/1094215', false],
] as const;

describe('reputable-source mirror parity', () => {
  it('keeps OFFICIAL_DOMAINS identical to the shared source of truth', () => {
    expect([...SCRIPT_OFFICIAL_DOMAINS].sort()).toEqual([...SHARED_OFFICIAL_DOMAINS].sort());
    expect([...GENERATED_OFFICIAL_DOMAINS].sort()).toEqual([...SHARED_OFFICIAL_DOMAINS].sort());
  });

  it('keeps YouTube channel ids and Ticketmaster ids identical in all three modules', () => {
    expect([...SCRIPT_YOUTUBE_IDS].sort()).toEqual([...SHARED_YOUTUBE_IDS].sort());
    expect([...GENERATED_YOUTUBE_IDS].sort()).toEqual([...SHARED_YOUTUBE_IDS].sort());
    expect([...SCRIPT_TICKETING_IDS].sort()).toEqual([...SHARED_TICKETING_IDS].sort());
    expect([...GENERATED_TICKETING_IDS].sort()).toEqual([...SHARED_TICKETING_IDS].sort());
  });

  it.each(CASES)('matches shared official URL behavior for %s', (url, expected) => {
    expect(isScriptOfficial(url)).toBe(expected);
    expect(isSharedOfficial(url)).toBe(expected);
  });
});
