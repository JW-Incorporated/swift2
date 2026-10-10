import { afterEach, describe, expect, it, vi } from 'vitest';
import { familyOf } from '../../../scripts/social/lib/scorecard-report.mjs';
import { CAMPAIGN_FAMILIES, campaignVisitScope, recordCampaignVisit } from './campaign-visit';

const scope = (qs: string, headers: Record<string, string> = {}, method = 'GET', path = '/') =>
  campaignVisitScope(method, new URL(`https://longlivets.com${path}?${qs}`), new Headers(headers));

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('campaignVisitScope', () => {
  it('keeps its family list in step with the social scorecard', () => {
    for (const f of CAMPAIGN_FAMILIES) expect(familyOf(f)).toBe(f);
  });

  it('maps a social arrival to its campaign family', () => {
    expect(scope('utm_source=x&utm_medium=social&utm_campaign=thread:love-story:quiz')).toBe('utm-visit:thread');
    expect(scope('utm_medium=Social&utm_campaign=MOOD')).toBe('utm-visit:mood');
  });

  it('buckets unknown campaigns into other so crafted URLs cannot mint rows', () => {
    expect(scope('utm_medium=social&utm_campaign=zzz-random-123')).toBe('utm-visit:other');
  });

  it('ignores non-social, untagged, non-GET, api/embed, prefetch and crawler requests', () => {
    expect(scope('utm_medium=email&utm_campaign=thread')).toBeNull();
    expect(scope('utm_medium=social')).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', {}, 'POST')).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', {}, 'GET', '/api/x')).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', {}, 'GET', '/embed/y')).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', { purpose: 'prefetch' })).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', { 'next-router-prefetch': '1' })).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', { 'user-agent': 'Twitterbot/1.0' })).toBeNull();
    expect(scope('utm_medium=social&utm_campaign=thread', { 'user-agent': 'facebookexternalhit/1.1' })).toBeNull();
  });
});

describe('recordCampaignVisit', () => {
  it('bumps the usage_daily RPC with the scope only', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    const f = vi.fn(async () => ({ ok: true }));
    expect(await recordCampaignVisit('utm-visit:thread', f as never)).toBe(true);
    const [url, init] = f.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe('https://example.supabase.co/rest/v1/rpc/increment_usage_daily');
    expect(init.body).toBe('{"p_scope":"utm-visit:thread"}');
  });

  it('degrades to false without env, on a non-2xx, and on a throw', async () => {
    expect(await recordCampaignVisit('utm-visit:thread', (async () => ({ ok: true })) as never)).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    expect(await recordCampaignVisit('s', (async () => ({ ok: false })) as never)).toBe(false);
    expect(await recordCampaignVisit('s', (async () => { throw new Error('down'); }) as never)).toBe(false);
  });
});
