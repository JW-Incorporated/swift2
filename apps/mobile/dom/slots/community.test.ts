import { beforeEach, describe, expect, it } from 'vitest';
import { CommunitySection } from '@swift2/ui/reader/community/CommunitySection';
import { createSlotRegistry } from './registry';
import { resetSlotsForTests, slots } from './instance';

describe('community slice', () => {
  beforeEach(() => resetSlotsForTests());

  it('registers surface:community directly from @swift2/ui', async () => {
    const mod = await import('./community');
    expect(Object.keys(mod.COMMUNITY_SLOTS)).toEqual(['surface:community']);
    expect(mod.COMMUNITY_SLOTS['surface:community']).toBe(CommunitySection);
  });

  it('registers into the app registry and is idempotent on re-register', async () => {
    const mod = await import('./community');
    const r = createSlotRegistry();
    r.register({ slice: mod.COMMUNITY_SLICE, slots: mod.COMMUNITY_SLOTS });
    r.register({ slice: mod.COMMUNITY_SLICE, slots: mod.COMMUNITY_SLOTS });
    expect(Object.keys(r.slots())).toEqual(['surface:community']);
    expect(Object.keys(slots())).toEqual([]);
  });
});
