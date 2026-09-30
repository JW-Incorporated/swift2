import { describe, expect, it, vi } from 'vitest';
import { ensureActingAsPage } from './fb-export-profile.mjs';

function profilePage({ acting = false, strategy = 'none' } = {}) {
  let url = 'https://www.facebook.com/';
  let iUser = acting ? '987' : '';
  let controls: Array<{ name: string; click?: () => void }> = acting
    ? [{ name: 'Long Live' }]
    : [{ name: 'Account controls' }];
  const clicks: string[] = [];
  const setActing = () => {
    iUser = '987';
    controls = [{ name: 'Long Live' }];
  };
  const page = {
    goto: vi.fn(async (next: string) => {
      url = next;
      if (next === 'https://www.facebook.com/longlive') {
        controls =
          strategy === 'a'
            ? [{ name: 'Switch now', click: setActing }]
            : [{ name: 'Account controls' }];
      }
      if (next.includes('/pages/?')) controls = [{ name: 'Switch' }];
    }),
    url: () => url,
    cookies: vi.fn(async () => [
      { name: 'c_user', value: '123', domain: '.facebook.com' },
      ...(iUser ? [{ name: 'i_user', value: iUser, domain: '.facebook.com' }] : []),
    ]),
    $$eval: vi.fn(async (_selector: string, _fn: unknown, source?: string, flags?: string) => {
      if (source === undefined) return controls.map((control) => control.name);
      const matcher = new RegExp(source, flags);
      const control = controls.find((candidate) => matcher.test(candidate.name));
      if (!control) return false;
      clicks.push(control.name);
      if (control.name === 'Account controls' && strategy === 'b') {
        controls = [{ name: 'See all profiles' }];
      } else if (control.name === 'See all profiles') {
        controls = [{ name: 'Long Live', click: setActing }];
      } else {
        control.click?.();
      }
      return true;
    }),
  };
  return { page, clicks };
}

describe('Facebook acting Page switch', () => {
  it('accepts an already-active Page without clicking', async () => {
    const fake = profilePage({ acting: true });
    await expect(
      ensureActingAsPage(fake.page as never, {
        actingPage: { name: 'Long Live' },
        sleep: vi.fn(),
      }),
    ).resolves.toEqual({ status: 'ready', actingPageId: '987' });
    expect(fake.clicks).toEqual([]);
  });

  it('switches from the Page URL with strategy a', async () => {
    const fake = profilePage({ strategy: 'a' });
    await expect(
      ensureActingAsPage(fake.page as never, {
        actingPage: { name: 'Long Live', url: 'https://www.facebook.com/longlive' },
        sleep: vi.fn(),
        random: () => 0,
      }),
    ).resolves.toEqual({ status: 'ready', actingPageId: '987' });
    expect(fake.clicks).toEqual(['Switch now']);
  });

  it('falls back to the account-menu strategy b', async () => {
    const fake = profilePage({ strategy: 'b' });
    await expect(
      ensureActingAsPage(fake.page as never, {
        actingPage: { name: 'Long Live', url: 'https://www.facebook.com/longlive' },
        sleep: vi.fn(),
        random: () => 0,
      }),
    ).resolves.toEqual({ status: 'ready', actingPageId: '987' });
    expect(fake.clicks).toEqual(['Account controls', 'See all profiles', 'Long Live']);
  });
});
