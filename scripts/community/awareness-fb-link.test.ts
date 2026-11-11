import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { facebookFallbackLine, facebookLeadUrl } from './awareness-fb-link.mjs';

const checklist = [{ slug: 'fixture-group', label: 'Fixture Group', groupId: '123456' }];
const lead = {
  platform: 'facebook',
  community: 'facebook:fixture-group',
  locator: 'Fixture Group — The first photos from a surprise acoustic performance appeared today',
  url: null,
};

describe('Facebook lead destinations', () => {
  it('uses distinctive excerpt words in a group-scoped search', () => {
    const url = facebookLeadUrl(lead, { communities: [], checklist });
    expect(url).toBe(
      'https://www.facebook.com/groups/123456/search/?q=first%20photos%20surprise%20acoustic%20performance%20appeared',
    );
    expect(facebookFallbackLine(lead, { communities: [], checklist })).toContain(`[search](<${url}>)`);
  });

  it('keeps a real post permalink unchanged', () => {
    const url = 'https://www.facebook.com/groups/123456/posts/987654/';
    expect(facebookLeadUrl({ ...lead, url }, { communities: [], checklist })).toBe(url);
  });

  it('keeps the existing no-group-id fallback', () => {
    expect(facebookLeadUrl(lead, { communities: [], checklist: [] })).toBeNull();
    expect(facebookFallbackLine(lead, { communities: [], checklist: [] })).toBeNull();
  });
});
