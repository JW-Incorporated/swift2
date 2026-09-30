import { describe, expect, it, vi } from 'vitest';
import {
  collectAll,
  collectGroup,
  collectorLaunchOptions,
  establishSession,
  readDpapiPassword,
} from './fb-export-collect.mjs';

const groups = [
  { slug: 'group-a', groupId: '123' },
  { slug: 'group-b', groupId: '456' },
];

function collectorPage({ acting = false } = {}) {
  let url = 'https://www.facebook.com/';
  const groupVisits: string[] = [];
  const page = {
    goto: vi.fn(async (next: string) => {
      url = next;
      if (next.includes('/groups/')) groupVisits.push(next);
    }),
    url: () => url,
    evaluate: vi.fn(async () => ({ text: '', hasPassword: false, hasJoinGroup: false })),
    cookies: vi.fn(async () => [
      { name: 'c_user', value: '123', domain: '.facebook.com' },
      ...(acting ? [{ name: 'i_user', value: '987', domain: '.facebook.com' }] : []),
    ]),
    $$eval: vi.fn(async () => (acting ? ['Long Live'] : ['Account controls'])),
    // No control ever matches: every switch strategy finds nothing to click.
    evaluateHandle: vi.fn(async () => ({ asElement: () => null, dispose: async () => {} })),
    deleteCookie: vi.fn(async ({ name }: { name: string }) => {
      if (name === 'i_user') acting = false;
    }),
  };
  return { page, groupVisits };
}

function loginPage() {
  let url = 'https://www.facebook.com/login';
  let hasPassword = true;
  let checkpoint = false;
  let checkpointAfterSubmit = false;
  let cookie = false;
  const passwordInput = { type: vi.fn() };
  const submit = {
    click: vi.fn(async () => {
      hasPassword = false;
      checkpoint = checkpointAfterSubmit;
      url = checkpoint
        ? 'https://www.facebook.com/checkpoint/'
        : 'https://www.facebook.com/';
    }),
  };
  const page = {
    goto: vi.fn(),
    url: () => url,
    evaluate: vi.fn(async () => ({
      text: checkpoint ? 'Security checkpoint' : '',
      hasPassword,
      hasJoinGroup: false,
    })),
    cookies: vi.fn(async () =>
      cookie ? [{ name: 'c_user', domain: '.facebook.com' }] : [],
    ),
    $: vi.fn(async (selector: string) =>
      selector.includes('password') ? (hasPassword ? passwordInput : null) : submit,
    ),
    $eval: vi.fn(async () => 'saved@example.com'),
    waitForNavigation: vi.fn().mockResolvedValue(undefined),
  };
  return {
    page,
    passwordInput,
    setCheckpoint: () => {
      checkpointAfterSubmit = true;
    },
    completeManualLogin: () => {
      url = 'https://www.facebook.com/';
      hasPassword = false;
      cookie = true;
    },
  };
}

describe('Facebook collector boundaries', () => {
  it('uses an injectable page and treats Join group as a successful skip', async () => {
    const page = {
      goto: vi.fn(),
      url: () => 'https://www.facebook.com/groups/123',
      evaluate: vi
        .fn()
        .mockResolvedValue({ text: 'Private group', hasPassword: false, hasJoinGroup: true }),
    };
    const result = await collectGroup(page as never, { slug: 'group-a', groupId: '123' } as never, {
      outputDir: 'unused',
    });
    expect(page.goto).toHaveBeenCalledWith(
      'https://www.facebook.com/groups/123?sorting_setting=CHRONOLOGICAL',
      expect.anything(),
    );
    expect(result).toEqual({ slug: 'group-a', status: 'not-member' });
  });

  it("classifies Facebook's unavailable-content page without trying to parse it", async () => {
    const page = {
      goto: vi.fn(),
      url: () => 'https://www.facebook.com/groups/123',
      evaluate: vi.fn(async () => ({
        text: "This content isn't available right now",
        hasPassword: false,
        hasJoinGroup: false,
      })),
    };
    await expect(
      collectGroup(page as never, { slug: 'group-a', groupId: '123' } as never, {
        outputDir: 'unused',
      }),
    ).resolves.toEqual({ slug: 'group-a', status: 'unavailable' });
  });

  it('reads DPAPI through PowerShell stdout without putting the password in arguments', async () => {
    const exec = vi.fn().mockResolvedValue({ stdout: 'not-a-real-password' });
    const value = await readDpapiPassword({ exec, root: 'C:\\safe' });
    expect(value).toBe('not-a-real-password');
    expect(JSON.stringify(exec.mock.calls)).not.toContain('not-a-real-password');
    expect(exec.mock.calls[0][1]).toContain('-NonInteractive');
  });

  it('turns credential errors into a fixed message that cannot leak stderr', async () => {
    const exec = vi.fn().mockRejectedValue(new Error('stderr contains secret-value'));
    await expect(readDpapiPassword({ exec, root: 'C:\\safe' })).rejects.toThrow(
      'credential could not be read',
    );
    await expect(readDpapiPassword({ exec, root: 'C:\\safe' })).rejects.not.toThrow('secret-value');
  });

  it('requires a facebook.com c_user cookie for an authenticated session', async () => {
    const fake = loginPage();
    fake.completeManualLogin();
    expect(await establishSession(fake.page as never)).toBe('ready');
    expect(fake.page.goto).toHaveBeenCalledTimes(1);
  });

  it('does not navigate while waiting for an interactive login to finish', async () => {
    const fake = loginPage();
    fake.page.$eval.mockResolvedValue('');
    const sleep = vi.fn(async () => fake.completeManualLogin());
    expect(
      await establishSession(fake.page as never, {
        interactiveSetup: true,
        interactiveTimeoutMs: 100,
        pollIntervalMs: 1,
        sleep,
      }),
    ).toBe('ready');
    expect(sleep).toHaveBeenCalledOnce();
    expect(fake.page.goto).toHaveBeenCalledTimes(1);
    expect(fake.page.goto).toHaveBeenCalledWith('https://www.facebook.com/', expect.anything());
  });

  it('makes one automated login attempt and aborts all groups at a checkpoint', async () => {
    const fake = loginPage();
    fake.setCheckpoint();
    const passwordReader = vi.fn().mockResolvedValue('not-a-real-password');
    const browser = {
      pages: vi.fn().mockResolvedValue([fake.page]),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const result = await collectAll({
      groups: groups as never,
      outputDir: 'unused',
      browserFactory: vi.fn().mockResolvedValue(browser) as never,
      sessionOptions: { passwordReader },
    });
    expect(result).toEqual({
      results: [{ slug: 'group-a', status: 'checkpoint' }],
      actingPageId: null,
    });
    expect(passwordReader).toHaveBeenCalledOnce();
    expect(fake.passwordInput.type).toHaveBeenCalledOnce();
    expect(fake.page.goto).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledOnce();
  });

  it('returns login-failed after one attempt when the session cookie is still missing', async () => {
    const fake = loginPage();
    const passwordReader = vi.fn().mockResolvedValue('not-a-real-password');
    const browser = {
      pages: vi.fn().mockResolvedValue([fake.page]),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const result = await collectAll({
      groups: groups as never,
      outputDir: 'unused',
      browserFactory: vi.fn().mockResolvedValue(browser) as never,
      sessionOptions: { passwordReader, automatedTimeoutMs: 0 },
    });
    expect(result).toEqual({
      results: [{ slug: 'group-a', status: 'login-failed' }],
      actingPageId: null,
    });
    expect(passwordReader).toHaveBeenCalledOnce();
    expect(fake.page.goto).toHaveBeenCalledTimes(1);
  });

  it('launches visible Chrome without Puppeteer automation markers', () => {
    expect(collectorLaunchOptions('chrome.exe', 'profile')).toMatchObject({
      headless: false,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--disable-blink-features=AutomationControlled'],
    });
  });

  it('aborts every group when all Page-switch strategies fail', async () => {
    const fake = collectorPage();
    const browser = {
      pages: vi.fn().mockResolvedValue([fake.page]),
      close: vi.fn().mockResolvedValue(undefined),
    };
    await expect(
      collectAll({
        groups: groups as never,
        outputDir: 'unused',
        browserFactory: vi.fn().mockResolvedValue(browser) as never,
        profileOptions: { sleep: vi.fn(), random: () => 0 },
        readAs: 'page',
      }),
    ).resolves.toEqual({
      results: [{ slug: 'profile', status: 'wrong-profile' }],
      actingPageId: null,
    });
    expect(fake.groupVisits).toEqual([]);
  });

  it('personal mode drops a lingering acting-Page cookie before reading groups', async () => {
    const fake = collectorPage({ acting: true });
    const browser = {
      pages: vi.fn().mockResolvedValue([fake.page]),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const result = await collectAll({
      groups: groups as never,
      outputDir: 'unused',
      browserFactory: vi.fn().mockResolvedValue(browser) as never,
      probeProfile: true,
      readAs: 'personal',
      profileOptions: { log: vi.fn() },
    });
    expect(fake.page.deleteCookie).toHaveBeenCalledWith({ name: 'i_user', domain: '.facebook.com' });
    expect(result).toEqual({ results: [], actingPageId: null });
    expect(fake.groupVisits).toEqual([]);
  });

  it('probe mode checks the profile and never visits a group', async () => {
    const fake = collectorPage({ acting: true });
    const browser = {
      pages: vi.fn().mockResolvedValue([fake.page]),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const result = await collectAll({
      groups: groups as never,
      outputDir: 'unused',
      browserFactory: vi.fn().mockResolvedValue(browser) as never,
      probeProfile: true,
      readAs: 'page',
      profileOptions: { log: vi.fn(), sleep: vi.fn() },
    });
    expect(result).toEqual({ results: [], actingPageId: '987' });
    expect(fake.groupVisits).toEqual([]);
  });
});
