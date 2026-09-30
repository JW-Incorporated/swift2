import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import * as harvest from './fb-export-harvest.mjs';
import * as helpers from './fb-export-helpers.mjs';

// Synthetic fixtures only — no real Facebook post or comment text.
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'fb-extension');
const DAY = 86_400_000;
const NOW = new Date('2026-09-30T12:00:00Z');

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function loadCore(extra: Record<string, unknown> = {}, files = ['harvest-core.js']) {
  const context = vm.createContext({ ...extra });
  for (const file of files)
    vm.runInContext(readFileSync(join(DIR, file), 'utf8'), context, { filename: file });
  return (context as Any).LLFB;
}

// vm objects come from another realm; round-trip through JSON for plain comparisons.
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

// The extension adds reactions/commentCount; everything else must equal the original.
const withoutEngagement = (unit: Any) => {
  const copy = { ...unit };
  delete copy.reactions;
  delete copy.commentCount;
  return copy;
};

const unit = (position: number, age: string, extra: Record<string, unknown> = {}) => ({
  key: `pos:${position}`,
  position,
  html: `<p>Synthetic post ${position}</p>`,
  ownTimestamp: age,
  ignoreForAge: false,
  ...extra,
});

describe('fb-extension manifest', () => {
  it('parses and declares the MV3 contract', () => {
    const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background.service_worker).toBe('background.js');
    expect(manifest.permissions.sort()).toEqual(['storage', 'tabs']);
    expect(manifest.host_permissions).toEqual(['http://127.0.0.1/*']);
    const fb = manifest.content_scripts.find((entry: Any) =>
      entry.matches.includes('https://www.facebook.com/groups/*'),
    );
    expect(fb.js).toEqual(['harvest-core.js', 'comments.js', 'content.js']);
    const start = manifest.content_scripts.find((entry: Any) =>
      entry.matches.includes('http://127.0.0.1/start*'),
    );
    expect(start.js).toContain('content.js');
  });

  it('never fetches from a content script', () => {
    for (const file of ['content.js', 'harvest-core.js'])
      expect(readFileSync(join(DIR, file), 'utf8')).not.toMatch(/\bfetch\(|XMLHttpRequest/);
    expect(readFileSync(join(DIR, 'background.js'), 'utf8')).toContain("'X-LLFB-Token'");
  });
});

describe('harvest-core pure ports match the originals', () => {
  const core = loadCore();
  const ageSamples = [
    'just now',
    'Yesterday at 3:15 pm',
    '5 m',
    '2 hrs ago',
    '3 d',
    '2 w',
    'September 20',
    'October 13',
    'February 30',
    'March 3, 2025 at 11:04 am',
    '2026-09-01T10:00:00Z',
    'Fan Name',
    '',
  ];

  it('relativeAgeMs / firstOwnTimestamp / neutralizeArticleRoles', () => {
    for (const sample of ageSamples)
      expect(core.relativeAgeMs(sample, NOW)).toBe(helpers.relativeAgeMs(sample, NOW));
    expect(core.firstOwnTimestamp(['Fan Name', '2 h', '6 weeks'], NOW)).toBe(
      harvest.firstOwnTimestamp(['Fan Name', '2 h', '6 weeks'], NOW),
    );
    const html = `<div role="article"><div role='article'>x</div></div>`;
    expect(core.neutralizeArticleRoles(html)).toBe(harvest.neutralizeArticleRoles(html));
  });

  const feeds: Record<string, Any[]> = {
    recentOnly: [unit(1, '1 h'), unit(2, '2 d'), unit(3, '6 d')],
    trailingOld: [
      unit(1, '1 h'),
      unit(2, '3 d'),
      unit(3, '8 d'),
      unit(4, '9 d'),
      unit(5, '10 d'),
      unit(6, '11 d'),
    ],
    pinnedOld: [
      unit(1, '30 d', { ignoreForAge: true }),
      unit(2, '1 d'),
      unit(3, '8 d'),
      unit(4, 'Fan'),
      unit(5, '9 d'),
    ],
    outlier: [unit(1, '1 h'), unit(2, '2 h'), unit(3, '3 h'), unit(4, '6 d')],
    unordered: [unit(5, '12 d'), unit(1, '2 h'), unit(4, '10 d'), unit(3, '9 d'), unit(2, '1 d')],
  };

  it.each(Object.keys(feeds))('age/coverage helpers agree on %s', (name) => {
    const units = feeds[name];
    expect(plain(core.trailingOldBoundary(units, NOW))).toEqual(
      helpers.trailingOldBoundary(units, NOW),
    );
    expect(plain(core.recentHarvestUnits(units, NOW))).toEqual(
      helpers.recentHarvestUnits(units, NOW),
    );
    for (const reason of [null, 'seven-days', 'feed-end'])
      expect(core.harvestCoverageAge(units, NOW, reason)).toBe(
        helpers.harvestCoverageAge(units, NOW, reason),
      );
  });

  it('stopDecision agrees', () => {
    const cases = [
      { ageStopMet: true, stagnantScrolls: 0, scrollCount: 0 },
      { stagnantScrolls: 3, scrollCount: 5 },
      { stagnantScrolls: 0, scrollCount: 250 },
      { stagnantScrolls: 0, scrollCount: 10, scrollCap: 10 },
      { stagnantScrolls: 0, scrollCount: 1, elapsedMs: 20 * 60_000 },
      { stagnantScrolls: 0, scrollCount: 1, elapsedMs: 5, wallBudgetMs: 5 },
      { stagnantScrolls: 2, scrollCount: 1 },
    ];
    for (const input of cases)
      expect(plain(core.stopDecision(input))).toEqual(helpers.stopDecision(input));
  });

  it('classifyPage agrees', () => {
    const cases = [
      { url: 'https://www.facebook.com/checkpoint/123' },
      { text: 'Enter the two-factor code' },
      { text: 'Please complete the security check' },
      { text: 'This content isn’t available right now' },
      { hasJoinGroup: true },
      { hasPassword: true },
      { url: 'https://www.facebook.com/login/?next=x' },
      { url: 'https://www.facebook.com/groups/1', text: 'feed' },
    ];
    for (const input of cases) expect(core.classifyPage(input)).toBe(helpers.classifyPage(input));
  });

  it('mergeHarvest agrees on every original field and carries engagement', () => {
    const capture = (position: number | null, extra: Record<string, unknown> = {}) => ({
      position,
      identity: `post-${position ?? 'x'}`,
      textLength: 20,
      hasAuthor: true,
      html: `<section><div role="article">Synthetic ${position}</div></section>`,
      timestamps: ['2 h'],
      ...extra,
    });
    const snapshots = [
      { units: [capture(1, { reactions: 3 }), capture(2)], maxPosinset: 2 },
      {
        units: [
          capture(1, { html: '<i>short</i>', reactions: 5, commentCount: 2, ignoreForAge: true }),
          capture(3, { hasAuthor: false }),
          capture(null, { identity: 'direct-a', ownTimestamp: '4 d' }),
        ],
        maxPosinset: 3,
      },
      {
        units: [
          capture(null, { identity: 'direct-a', html: '<p>longer synthetic direct unit</p>' }),
        ],
        maxPosinset: 0,
      },
    ];
    let original: Any = { units: [], nextSyntheticPosition: 1, maxPosinset: 0 };
    let ported: Any = core.emptyHarvest();
    for (const snapshot of snapshots) {
      original = harvest.mergeHarvest(original, snapshot);
      ported = core.mergeHarvest(ported, snapshot);
    }
    const strip = (state: Any) => ({
      ...state,
      units: state.units.map(withoutEngagement),
    });
    expect(strip(plain(ported))).toEqual(original);
    const first = ported.units.find((u: Any) => u.key === 'pos:1');
    expect([first.reactions, first.commentCount]).toEqual([5, 2]);
    expect(ported.units.find((u: Any) => u.key === 'pos:2').reactions).toBeNull();
  });
});

const FEED_HTML = `<!doctype html><html><body><div role="feed">
  <div aria-posinset="1"><div role="article">
    <a aria-label="Fan One" href="/u/1">Fan One</a>
    <a href="https://www.facebook.com/groups/1/posts/111/"><span>2 h</span></a>
    <div data-ad-preview="message">Synthetic body one <div role="button">See more</div></div>
    <span aria-hidden="true">All reactions:</span><span>1.2K</span>
    <span>All reactions:12</span><span>7 comments</span>
    <div role="article"><abbr title="9 w">9 w</abbr><span>99 comments</span></div>
  </div></div>
  <div aria-posinset="2"><div role="article">
    <strong>Pinned post</strong><a aria-label="Admin" href="/u/2">Admin</a>
    <time datetime="2026-09-01T00:00:00Z">Sep 1</time>
    <div data-ad-comet-preview="message">Synthetic body two</div>
    <div role="button" aria-label="1,204 reactions"></div>
  </div></div>
  <div aria-posinset="4"><div>No author, short</div></div>
</div></body></html>`;

describe('harvest-core DOM ports match the page.evaluate originals', () => {
  const saved: Record<string, unknown> = {};
  function useDom(html: string) {
    const dom = new JSDOM(html);
    for (const key of ['document', 'window', 'Node']) saved[key] = (globalThis as Any)[key];
    Object.assign(globalThis, {
      document: dom.window.document,
      window: dom.window,
      Node: dom.window.Node,
    });
    return dom;
  }
  afterEach(() => Object.assign(globalThis, saved));
  const page = { evaluate: async (fn: () => unknown) => fn() };

  it('captureVisibleUnits: same snapshot as the original, plus engagement', async () => {
    const dom = useDom(FEED_HTML);
    const core = loadCore();
    const original = await harvest.captureVisibleUnits(page as never);
    const ported = plain(core.captureVisibleUnits(dom.window.document, dom.window));
    const strip = (s: Any) => ({
      ...s,
      units: s.units.map(withoutEngagement),
    });
    expect(strip(ported)).toEqual(plain(original));
    expect(ported.maxPosinset).toBe(4);
    expect(ported.units[0].ownTimestamp).toBe('2 h');
    expect(ported.units[1].ignoreForAge).toBe(true);
    // Guessed labels: first own match wins; nested comment articles are ignored.
    expect([ported.units[0].reactions, ported.units[0].commentCount]).toEqual([12, 7]);
    expect([ported.units[1].reactions, ported.units[1].commentCount]).toEqual([1204, null]);
    expect([ported.units[2].reactions, ported.units[2].commentCount]).toEqual([null, null]);
  });

  it('expandVisibleUnits: clicks the same See more controls as the original', async () => {
    const dom = useDom(FEED_HTML);
    const core = loadCore();
    let clicks = 0;
    dom.window.document.addEventListener('click', () => (clicks += 1));
    const original = await harvest.expandVisibleUnits(page as never);
    const ported = core.expandVisibleUnits(dom.window.document, dom.window);
    expect(ported).toBe(original);
    expect(ported).toBe(1);
    expect(clicks).toBe(2);
  });

  it('parseCount', () => {
    const core = loadCore();
    expect(['12', '1,204', '1.2K', '3M', 'x', ''].map(core.parseCount)).toEqual([
      12,
      1204,
      1200,
      3_000_000,
      null,
      null,
    ]);
  });
});

describe('extension-only rules', () => {
  const core = loadCore();

  it('detectWrongProfile: i_user readable while reading as personal', () => {
    expect(core.detectWrongProfile({ cookie: 'c_user=1; i_user=42', readAs: 'personal' })).toBe(
      true,
    );
    expect(core.detectWrongProfile({ cookie: 'c_user=1' })).toBe(false);
    expect(core.detectWrongProfile({ cookie: 'i_user=42', readAs: 'page' })).toBeNull();
  });

  it('tickDecision: stunted after 20 scrolls with ≤ 3 slots, feed-end suppressed before', () => {
    const base = {
      units: [unit(1, '1 h')],
      now: NOW,
      elapsedMs: 0,
      scrollCap: 250,
      wallBudgetMs: 20 * 60_000,
    };
    expect(
      plain(core.tickDecision({ ...base, slotCount: 3, stagnantScrolls: 5, scrollCount: 10 })),
    ).toMatchObject({ stop: false });
    expect(
      plain(core.tickDecision({ ...base, slotCount: 3, stagnantScrolls: 5, scrollCount: 20 })),
    ).toMatchObject({ stop: true, status: 'stunted', reason: 'stunted-feed' });
    expect(
      plain(core.tickDecision({ ...base, slotCount: 4, stagnantScrolls: 3, scrollCount: 5 })),
    ).toMatchObject({ stop: true, status: 'collected', reason: 'feed-end' });
    const old = [unit(1, '8 d'), unit(2, '9 d'), unit(3, '10 d')];
    expect(
      plain(
        core.tickDecision({
          ...base,
          units: old,
          slotCount: 3,
          stagnantScrolls: 0,
          scrollCount: 30,
        }),
      ),
    ).toMatchObject({ stop: true, status: 'collected', reason: 'seven-days' });
  });

  it('madeProgress: a human tick is stagnant only at the bottom of an unchanged page', () => {
    const same = {
      snapshotMaxPosinset: 5,
      previousMaxPosinset: 5,
      harvestCount: 5,
      previousHarvestCount: 5,
    };
    expect(core.madeProgress({ ...same, nearBottom: false })).toBe(true);
    expect(
      core.madeProgress({ ...same, nearBottom: true, scrollHeight: 10, previousScrollHeight: 5 }),
    ).toBe(true);
    expect(
      core.madeProgress({ ...same, nearBottom: true, scrollHeight: 5, previousScrollHeight: 5 }),
    ).toBe(false);
    expect(core.madeProgress({ ...same, snapshotMaxPosinset: 6, nearBottom: true })).toBe(true);
  });

  it('humanScrollStep keeps the proven rhythm', () => {
    const at = (values: number[]) => {
      let i = 0;
      return core.humanScrollStep(() => values[i++]);
    };
    expect(plain(at([0, 0.5, 0]))).toEqual({ top: 350, pauseMs: 1200 });
    expect(plain(at([0.999, 0.5, 0.999])).top).toBe(800);
    expect(plain(at([0.5, 0.05, 1])).pauseMs).toBe(8000);
    expect(plain(at([0.5, 0.5, 1])).pauseMs).toBe(3200);
  });
});

describe('content.js runJob against a synthetic group page', () => {
  function makeEnv(html: string, overrides: Record<string, unknown> = {}) {
    const dom = new JSDOM(html);
    let clock = 0;
    const scrolls: number[] = [];
    const beats: Any[] = [];
    (dom.window as Any).scrollBy = ({ top }: { top: number }) => scrolls.push(top);
    const LLFB = loadCore({ LLFB: {} }, ['harvest-core.js', 'content.js']);
    const env = {
      doc: dom.window.document,
      win: dom.window,
      url: 'https://www.facebook.com/groups/1?sorting_setting=CHRONOLOGICAL',
      cookie: '',
      sleep: async (ms: number) => void (clock += ms),
      random: () => 0.5,
      clock: () => clock,
      now: () => NOW,
      heartbeat: (beat: Any) => beats.push(beat),
      every: (fn: () => void) => (fn(), () => {}),
      ...overrides,
    };
    return { LLFB, env, scrolls, beats, dom };
  }
  const job = {
    slug: 'group-a',
    label: 'Group A',
    url: 'https://www.facebook.com/groups/1',
    wallBudgetMs: 20 * 60_000,
    maxScrolls: 250,
    comments: { topN: 20, maxPerPost: 50, pacingMs: [2000, 5000] },
  };
  const post = (position: number, age: string) =>
    `<div aria-posinset="${position}"><div role="article"><a aria-label="Fan ${position}">Fan</a>` +
    `<a href="/groups/1/posts/${position}/">${age}</a><p>Synthetic ${position}</p>` +
    `<span>${position} comments</span></div></div>`;

  it('reports not-member without scrolling', async () => {
    const { LLFB, env, scrolls } = makeEnv(
      '<body><div role="feed"></div><div role="button">Join group</div></body>',
    );
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ v: 1, slug: 'group-a', status: 'not-member', units: [] });
    expect(scrolls).toHaveLength(0);
  });

  it('reports wrong-profile when acting as a Page', async () => {
    const { LLFB, env } = makeEnv(`<body><div role="feed">${post(1, '1 h')}</div></body>`, {
      cookie: 'i_user=77',
    });
    expect((await LLFB.runJob(job, env)).status).toBe('wrong-profile');
  });

  it('stops seven-days, sends only recent units, then asks comments.js', async () => {
    const feed = [post(1, '1 h'), post(2, '2 d'), post(3, '8 d'), post(4, '9 d'), post(5, '10 d')];
    const { LLFB, env, beats } = makeEnv(`<body><div role="feed">${feed.join('')}</div></body>`);
    const seen: Any[] = [];
    LLFB.collectComments = async (units: Any[], options: Any) => {
      seen.push({ keys: units.map((u) => u.key), options });
      return [{ postKey: 'pos:1', postUrl: 'u', comments: [] }];
    };
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({
      status: 'collected',
      stopReason: 'seven-days',
      coverage: {
        harvestedCount: 5,
        recentCount: 2,
        slotCount: 5,
        coverageAgeMs: 8 * DAY,
        partial: false,
        ageRuleMet: true,
        scrolls: 0,
      },
    });
    expect(result.units.map((u: Any) => [u.key, u.commentCount])).toEqual([
      ['pos:1', 1],
      ['pos:2', 2],
    ]);
    expect(Object.keys(result.units[0]).sort()).toEqual(
      [
        'commentCount',
        'html',
        'ignoreForAge',
        'key',
        'ownTimestamp',
        'position',
        'reactions',
      ].sort(),
    );
    expect(seen).toEqual([{ keys: ['pos:1', 'pos:2'], options: job.comments }]);
    expect(result.comments).toHaveLength(1);
    expect(beats[0]).toMatchObject({ slug: 'group-a' });
  });

  it('flags a stunted feed (≤ 3 slots after 20 scrolls)', async () => {
    const { LLFB, env, scrolls } = makeEnv(
      `<body><div role="feed">${post(1, '1 h')}${post(2, '2 h')}</div></body>`,
    );
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ status: 'stunted', stopReason: 'stunted-feed', comments: [] });
    expect(result.coverage.scrolls).toBe(20);
    expect(scrolls).toHaveLength(20);
    expect(scrolls.every((top) => top >= 350 && top <= 800)).toBe(true);
  });

  it('stops at feed-end on a stagnant bottom and survives a throwing collectComments', async () => {
    const feed = [1, 2, 3, 4].map((p) => post(p, `${p} h`)).join('');
    const { LLFB, env } = makeEnv(`<body><div role="feed">${feed}</div></body>`);
    LLFB.collectComments = async () => {
      throw new Error('synthetic');
    };
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ status: 'collected', stopReason: 'feed-end', comments: [] });
    expect(result.message).toMatch(/comments failed/);
    expect(result.coverage.recentCount).toBe(4);
  });
});
