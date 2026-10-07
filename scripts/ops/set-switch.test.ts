import { describe, expect, it } from 'vitest';
import { setSwitch, validate } from './set-switch.mjs';

function fakes(old = 'false') {
  const calls: string[][] = [];
  const ledger: string[] = [];
  const gh = (args: string[]) => {
    calls.push(args);
    if (args[1] === 'get') {
      if (old === '') throw new Error('not found');
      return `${old}\n`;
    }
    return '';
  };
  return { calls, ledger, deps: { gh, appendLedger: (l: string) => ledger.push(l), now: () => new Date('2026-10-06T21:00:00Z') } };
}

describe('set-switch', () => {
  it('sets an allowlisted *_ENABLED switch and logs old -> new', () => {
    const f = fakes('false');
    const r = setSwitch({ name: 'COMMUNITY_SCAN_ENABLED', value: 'true', reason: 'launch' }, f.deps);
    expect(r.ok).toBe(true);
    expect(f.calls).toContainEqual(['variable', 'set', 'COMMUNITY_SCAN_ENABLED', '--repo', 'JW-Incorporated/swift2', '--body', 'true']);
    expect(f.ledger[0]).toContain('| COMMUNITY_SCAN_ENABLED | false -> true | launch |');
  });

  it('records (unset) when the variable did not exist', () => {
    const f = fakes('');
    setSwitch({ name: 'BOT_CHAT_ENABLED', value: 'true', reason: 'x' }, f.deps);
    expect(f.ledger[0]).toContain('(unset) -> true');
  });

  it('allows on-only switches (freezes, code scanning) set to true', () => {
    for (const n of ['SOCIAL_FREEZE', 'CONTENT_AUTOMERGE_FREEZE', 'CODE_SCANNING_ENABLED']) {
      const f = fakes('');
      expect(setSwitch({ name: n, value: 'true', reason: 'brake' }, f.deps).ok).toBe(true);
    }
  });

  it('refuses lifting any on-only switch (false/0/empty/other) without calling gh', () => {
    for (const n of ['SOCIAL_FREEZE', 'CONTENT_AUTOMERGE_FREEZE', 'CODE_SCANNING_ENABLED']) {
      for (const v of ['false', '0', '', 'yes']) {
        const f = fakes();
        expect(setSwitch({ name: n, value: v, reason: 'x' }, f.deps).ok).toBe(false);
        expect(f.calls).toEqual([]);
      }
    }
  });

  it('refuses denylisted and secret-looking names', () => {
    for (const n of ['MARJORIE_EMAIL', 'DISCORD_FOUNDER_IDS', 'OWNER_DISCORD_ID', 'HOME_RELAY_URL', 'X_API_KEY', 'DISCORD_WEBHOOK_URL', 'GH_TOKEN', 'FB_SHOP_LINKS_FILE']) {
      const f = fakes();
      expect(setSwitch({ name: n, value: 'true', reason: 'x' }, f.deps).ok).toBe(false);
      expect(f.calls).toEqual([]);
    }
  });

  it('refuses bad values', () => {
    expect(validate('BOT_CHAT_ENABLED', 'yes', 'x')).toMatch(/true.*false/);
    expect(validate('COMMUNITY_CRAWL_BUDGET', '0', 'x')).toMatch(/positive integer/);
    expect(validate('COMMUNITY_CRAWL_BUDGET', '-3', 'x')).toMatch(/positive integer/);
    expect(validate('COMMUNITY_CRAWL_BUDGET', '12', 'x')).toBeNull();
  });

  it('refuses a missing or blank reason', () => {
    const f = fakes();
    expect(setSwitch({ name: 'BOT_CHAT_ENABLED', value: 'true', reason: undefined }, f.deps).ok).toBe(false);
    expect(setSwitch({ name: 'BOT_CHAT_ENABLED', value: 'true', reason: '  ' }, f.deps).ok).toBe(false);
    expect(f.calls).toEqual([]);
  });
});
