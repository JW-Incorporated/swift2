import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as L from './legal';

const sha = (v: unknown): string => createHash('sha256').update(JSON.stringify(v)).digest('hex');

// Fingerprints of the pre-split legal.ts exports. Any copy change must update these.
const EXPECTED: Record<string, string> = {
  LEGAL_DOCS: '08b80a604efdbca26e94d961d38fa4b7c756f46170cf8fd6be587ed6b655adb2',
  LEGAL_DRAFT_BANNER: 'b4d6759cf3d0800924a021ab8d90d10f70196ddac3209a4f3610e57c8c2131d0',
  LEGAL_FACTS: '6c9423fc2dbd4cfa7761940150071c8d9c6a85d8720d0048b69f3f9c2243cde8',
  LEGAL_LINKS: '7abea3142f3fc080f5cf2a42163176cb7431cf8947d8ef8981b5da54b833abc7',
  LEGAL_STATUS: '6ae048f08fcab44bfbc8463f074bfdb40f94c6bdf56d3aad9a7e1c05e5d5b5c1',
  PRIVACY_POLICY: 'c2108c3b2cfcb1a5363a4495a3abce8884b868a62f88bfbfc25cd68ed880e263',
  TERMS_OF_USE: 'b10dceba5a1a52621c5279b4e4020a028bf0a9237655839d4745b6ed91b9f460',
};
const EXPECTED_FN = 'd9080ea8f00a88dcd4232fe74944d2421bc529453ee0174f3cd5fba0aa035d51';

describe('legal.ts split is a pure move', () => {
  it.each(Object.entries(EXPECTED))('%s is byte-identical', (name, hash) => {
    expect(sha((L as Record<string, unknown>)[name])).toBe(hash);
  });

  it('helper functions and export surface are unchanged', () => {
    const out = [
      L.legalPlaceholders(),
      L.legalRobots(),
      L.legalRobots('approved'),
      L.legalSitemapEntries('approved'),
      L.legalSitemapEntries(),
      L.legalEffectiveLine(),
      L.legalEffectiveLine('approved'),
      L.hasPlaceholder('[FOUNDERS: a]'),
      Object.keys(L).sort(),
    ];
    expect(sha(out)).toBe(EXPECTED_FN);
  });
});
