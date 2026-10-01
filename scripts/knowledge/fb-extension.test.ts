import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';
import * as harvest from './fb-export-harvest.mjs';
import * as helpers from './fb-export-helpers.mjs';

// Synthetic fixtures only — no real Facebook post or comment text.
// LLFB_EXT_DIR lets a reviewer point the suite at an older copy of the extension to prove a
// regression test fails on the pre-fix code.
const DIR =
  process.env.LLFB_EXT_DIR || join(dirname(fileURLToPath(import.meta.url)), 'fb-extension');
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
    expect(manifest.permissions.sort()).toEqual(['alarms', 'storage', 'tabs']);
    expect(manifest.host_permissions).toEqual(['http://127.0.0.1/*']);
    const fb = manifest.content_scripts.find((entry: Any) =>
      entry.matches.includes('https://www.facebook.com/groups/*'),
    );
    expect(fb.js).toEqual(['harvest-core.js', 'comments.js', 'skeleton.js', 'content.js']);
    const start = manifest.content_scripts.find((entry: Any) =>
      entry.matches.includes('http://127.0.0.1/start*'),
    );
    expect(start.js).toContain('content.js');
  });

  it('never fetches from a content script', () => {
    for (const file of ['content.js', 'harvest-core.js', 'skeleton.js', 'comments.js'])
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

  it('drops a pinned unit with a readable old timestamp from the output (Codex round 4 #3)', () => {
    const units = feeds.pinnedOld;
    // pinned 30 d, 1 d, 8 d, unreadable, 9 d → only the 1 d post and the unreadable one survive.
    expect(plain(core.recentHarvestUnits(units, NOW)).map((u: Any) => u.position)).toEqual([2, 4]);
    expect(helpers.recentHarvestUnits(units, NOW).map((u: Any) => u.position)).toEqual([2, 4]);
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

  // Deliberate divergence (Codex round 2 #3): the extension no longer reads challenge words from
  // page text — see "classifyPage: challenge only from the URL or dedicated challenge UI".
  it('classifyPage agrees on URL, join, password and unavailable inputs', () => {
    const cases = [
      { url: 'https://www.facebook.com/checkpoint/123' },
      { url: 'https://www.facebook.com/two_step_verification/two_factor/' },
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
    // html differs on purpose: the extension serializes a comment-free clone (see the
    // "comment subtrees never leave the page" tests); every other field must match.
    const strip = (s: Any) => ({
      ...s,
      units: s.units.map((u: Any) => ({ ...withoutEngagement(u), html: undefined })),
    });
    expect(strip(ported)).toEqual(strip(plain(original)));
    // html is built positively (author, timestamps, message, media, counts) — never the raw
    // outerHTML, even for a post without comments.
    expect(ported.units[1].html).not.toBe((original as Any).units[1].html);
    for (const kept of [
      'aria-label="Admin"',
      'datetime="2026-09-01T00:00:00Z"',
      'Synthetic body two',
      '1204 reactions',
    ])
      expect(ported.units[1].html).toContain(kept);
    expect(ported.units[0].html).not.toContain('99 comments');
    expect(ported.units[0].html).toContain('7 comments');
    expect(ported.units[0].html).toContain('12 reactions');
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
    // A missing i_user cookie proves nothing (it may be HttpOnly): unverified, never "personal".
    expect(core.detectWrongProfile({ cookie: 'c_user=1' })).toBeNull();
    expect(core.detectWrongProfile({ cookie: 'i_user=42', readAs: 'page' })).toBe(false);
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
  function makeEnv(
    html: string,
    overrides: Record<string, unknown> = {},
    files = ['harvest-core.js', 'content.js'],
  ) {
    const dom = new JSDOM(html);
    let clock = 0;
    const scrolls: number[] = [];
    const beats: Any[] = [];
    (dom.window as Any).scrollBy = ({ top }: { top: number }) => scrolls.push(top);
    const LLFB = loadCore({ LLFB: {}, URL }, files);
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
    `<a href="/groups/1/posts/${position}/">${age}</a>` +
    `<div data-ad-preview="message">Synthetic ${position}</div>` +
    `<span>${position} comments</span></div></div>`;

  it('reports failed{redirected} when the page is not the job’s group, before reading anything', async () => {
    const { LLFB, env, scrolls } = makeEnv(
      `<body><div role="feed">${post(1, '1 h')}</div></body>`,
      { url: 'https://www.facebook.com/groups/2?sorting_setting=CHRONOLOGICAL' },
    );
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ status: 'failed', message: 'redirected', units: [] });
    expect(scrolls).toHaveLength(0);
  });

  it('reports not-member without scrolling, carrying the profile verdict', async () => {
    const { LLFB, env, scrolls } = makeEnv(
      '<body><div role="feed"></div><div role="button">Join group</div></body>',
    );
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({
      v: 1,
      slug: 'group-a',
      status: 'not-member',
      units: [],
      coverage: { profileVerified: false },
    });
    expect(scrolls).toHaveLength(0);
  });

  it('reports wrong-profile when acting as a Page', async () => {
    const { LLFB, env } = makeEnv(`<body><div role="feed">${post(1, '1 h')}</div></body>`, {
      cookie: 'i_user=77',
    });
    expect((await LLFB.runJob(job, env)).status).toBe('wrong-profile');
  });

  // Codex round 3 #2: a Page session that sees "Join group" is wrong-profile, not not-member.
  it('a Page session on a join-group page is wrong-profile, not a membership fact', async () => {
    const { LLFB, env } = makeEnv(
      '<body><div role="feed"></div><div role="button">Join group</div></body>',
      { cookie: 'i_user=77' },
    );
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
    expect(seen).toEqual([
      { keys: ['pos:1', 'pos:2'], options: { ...job.comments, maxMs: 15 * 60_000 } },
    ]);
    expect(result.comments).toEqual([]); // the bare-array shape carries no coverage: refused
    expect(result.commentCoverage).toEqual({ error: 'bad-shape' });
    expect(result.coverage.profileVerified).toBe(false); // no banner → unverified
    expect(beats[0]).toMatchObject({ slug: 'group-a' });
  });

  it('sends comments + commentCoverage from the {comments, coverage} shape', async () => {
    const feed = [post(1, '1 h'), post(2, '2 d'), post(3, '8 d'), post(4, '9 d'), post(5, '10 d')];
    const { LLFB, env } = makeEnv(`<body><div role="feed">${feed.join('')}</div></body>`);
    const coverage = { eligible: 2, processed: 1, failed: 1, timedOut: 0 };
    LLFB.collectComments = async () => ({
      comments: [{ postKey: 'pos:1', postUrl: 'u', comments: [] }],
      coverage,
    });
    const result = plain(await LLFB.runJob(job, env));
    expect(result.comments).toEqual([{ postKey: 'pos:1', postUrl: 'u', comments: [] }]);
    expect(result.commentCoverage).toEqual(coverage);
  });

  it('uses profileCheck when present: stops only on wrong-profile, reports profileVerified', async () => {
    const feed = [post(1, '1 h'), post(2, '2 d'), post(3, '8 d'), post(4, '9 d'), post(5, '10 d')];
    const html = `<body><div role="feed">${feed.join('')}</div></body>`;
    const calls: Any[] = [];
    const verdicts: Record<string, Any> = {
      ok: { status: 'ok', profileVerified: true },
      unverified: { status: 'unverified', profileVerified: false },
      wrong: { status: 'wrong-profile', profileVerified: false },
    };
    const outcomes: Any[] = [];
    for (const key of ['ok', 'unverified', 'wrong']) {
      const { LLFB, env } = makeEnv(html, { cookie: 'c=1' });
      LLFB.profileCheck = (args: Any) => (calls.push(args), verdicts[key]);
      const result = plain(
        await LLFB.runJob({ ...job, readAs: 'personal', actingPage: { id: '9' } }, env),
      );
      outcomes.push([result.status, result.coverage?.profileVerified ?? null]);
    }
    expect(outcomes).toEqual([
      ['collected', true],
      ['collected', false],
      ['wrong-profile', null],
    ]);
    expect(calls[0]).toMatchObject({ cookie: 'c=1', readAs: 'personal', actingPage: { id: '9' } });
    expect(calls[0].doc).toBeDefined();
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
      throw new Error('Synthetic private comment text QX7');
    };
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ status: 'collected', stopReason: 'feed-end', comments: [] });
    // Codex round 4 #4: a fixed code only — the exception text never reaches the result body.
    expect(result.commentCoverage).toEqual({ error: 'collector-threw' });
    expect(result.message).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('QX7');
    expect(result.coverage.recentCount).toBe(4);
  });

  it('a missing comment collector is an explicit coverage error', async () => {
    const feed = [1, 2, 3, 4].map((p) => post(p, `${p} h`)).join('');
    const { LLFB, env } = makeEnv(`<body><div role="feed">${feed}</div></body>`);
    delete LLFB.collectComments;
    const result = plain(await LLFB.runJob(job, env));
    expect(result.status).toBe('collected');
    expect(result.commentCoverage).toEqual({ error: 'collector-missing' });
  });

  const oldFeed = [post(1, '1 h'), post(2, '2 d'), post(3, '8 d'), post(4, '9 d'), post(5, '10 d')];

  it('caps comments at the remaining group wall budget minus 60 s', async () => {
    const { LLFB, env } = makeEnv(`<body><div role="feed">${oldFeed.join('')}</div></body>`);
    const seen: Any[] = [];
    LLFB.collectComments = async (_units: Any[], options: Any) => {
      seen.push(options);
      return [];
    };
    // 15 of 20 minutes already spent on the feed → 5 min left → comments get 4 min.
    const result = plain(await LLFB.runJob({ ...job, startedAtMs: -15 * 60_000 }, env));
    expect(result.status).toBe('collected');
    expect(seen).toHaveLength(1);
    expect(seen[0].maxMs).toBe(4 * 60_000);
    expect(seen[0].topN).toBe(20);
  });

  it('skips comments when less than 60 s of the group wall budget is left', async () => {
    const { LLFB, env } = makeEnv(`<body><div role="feed">${oldFeed.join('')}</div></body>`);
    let calls = 0;
    LLFB.collectComments = async () => {
      calls += 1;
      return [];
    };
    const result = plain(await LLFB.runJob({ ...job, startedAtMs: -(19 * 60_000 + 30_000) }, env));
    expect(result).toMatchObject({ status: 'collected', stopReason: 'seven-days', comments: [] });
    expect(calls).toBe(0);
    // The two eligible posts (commentCount > 0) are reported timed out, never silently skipped.
    expect(result.commentCoverage).toEqual({ eligible: 2, processed: 0, failed: 0, timedOut: 2 });
    expect(result.message).toMatch(/comments skipped/);
    expect(LLFB.commentsBudgetMs({ wallBudgetMs: 20 * 60_000 }, 0)).toBe(15 * 60_000);
    expect(LLFB.commentsBudgetMs({ wallBudgetMs: 75 * 60_000 }, 70 * 60_000)).toBe(4 * 60_000);
    expect(LLFB.commentsBudgetMs({ wallBudgetMs: 20 * 60_000 }, 19.5 * 60_000)).toBe(0);
  });

  it('capture mode: sends skeletons only — no units, no comments, no post text', async () => {
    const bare = (position: number, age: string) =>
      `<div aria-posinset="${position}"><div role="article"><a aria-label="Fan ${position}">Fan</a>` +
      `<a href="/groups/1/posts/${position}/">${age}</a>` +
      `<div dir="auto">Synthetic secret sentence ${position} about a concert in Manila</div>` +
      `<span>${position} comments</span></div></div>`;
    const feed = [post(1, '1 h'), post(2, '2 d'), bare(3, '3 h'), bare(4, '4 h'), bare(5, '5 h')];
    const { LLFB, env, scrolls } = makeEnv(
      `<body><div role="feed">${feed.join('')}</div></body>`,
      {},
      ['harvest-core.js', 'skeleton.js', 'content.js'],
    );
    LLFB.collectComments = async () => {
      throw new Error('comments must never run in capture mode');
    };
    const result = plain(
      await LLFB.runJob({ ...job, capture: true, wallBudgetMs: 3 * 60_000 }, env),
    );
    expect(result).toMatchObject({
      status: 'collected',
      stopReason: 'feed-end',
      units: [],
      comments: [],
      commentCoverage: null,
      coverage: {
        harvestedCount: 5,
        recentCount: 5,
        sanitizeDropped: 3,
        captureInspected: 5,
        captureDropped: 3,
        captureKept: 2,
      },
    });
    expect(scrolls.length).toBeGreaterThan(0);
    expect(result.skeletons.map((s: Any) => [s.key, s.diagnosis.message])).toEqual([
      ['pos:3', 'no-message-container'],
      ['pos:4', 'no-message-container'],
      ['pos:5', 'no-message-container'],
      ['pos:1', 'ok'],
      ['pos:2', 'ok'],
    ]);
    const json = JSON.stringify(result).toLowerCase();
    for (const word of ['synthetic', 'secret', 'manila', 'concert', 'fan'])
      expect(json, word).not.toContain(word);
    for (const skeleton of result.skeletons)
      expect(LLFB.isRedactedSkeleton(skeleton)).toEqual({ ok: true });
  });

  it('capture mode stops early (capture-full) once 15 dropped + 3 kept units are pooled', async () => {
    const bare = (position: number) =>
      `<div aria-posinset="${position}"><div role="article"><a aria-label="Fan ${position}">Fan</a>` +
      `<a href="/groups/1/posts/${position}/">1 h</a><div dir="auto">${'x'.repeat(320)}</div></div></div>`;
    const feed = [
      ...Array.from({ length: 18 }, (_, i) => bare(i + 1)),
      ...Array.from({ length: 4 }, (_, i) => post(i + 19, '1 h')),
    ];
    const { LLFB, env } = makeEnv(`<body><div role="feed">${feed.join('')}</div></body>`, {}, [
      'harvest-core.js',
      'skeleton.js',
      'content.js',
    ]);
    const result = plain(await LLFB.runJob({ ...job, capture: true }, env));
    expect(result).toMatchObject({ status: 'collected', stopReason: 'capture-full' });
    expect(result.skeletons).toHaveLength(15);
    expect(result.coverage).toMatchObject({ captureDropped: 15, captureKept: 4, scrolls: 0 });
  });

  it('a feed without aria-posinset counts merged units as slots (not stunted)', async () => {
    const children = [1, 2, 3, 4, 5, 6]
      .map(
        (n) =>
          `<div><div role="article"><a aria-label="Fan ${n}">Fan</a>` +
          `<a href="/groups/1/posts/${n}/">${n} h</a>` +
          `<div data-ad-preview="message">Synthetic ${n}</div></div></div>`,
      )
      .join('\n'); // separated, or the page text reads "…2Fan3…" and trips the 2fa check
    const { LLFB, env } = makeEnv(`<body><div role="feed">${children}</div></body>`);
    const result = plain(await LLFB.runJob(job, env));
    expect(result).toMatchObject({ status: 'collected', stopReason: 'feed-end' });
    expect(result.coverage.slotCount).toBe(6);
    expect(result.coverage.scrolls).toBeLessThan(20);
    expect(LLFB.harvestSlotCount({ maxPosinset: 0, units: [1, 2, 3, 4] })).toBe(4);
    expect(LLFB.harvestSlotCount({ maxPosinset: 9, units: [1] })).toBe(9);
  });
});

// A post with a rendered comment thread, a reply, the comment composer and the comment-list
// controls. Every string here is synthetic.
const THREAD_HTML = `<!doctype html><html><body><div role="feed">
  <div aria-posinset="1"><div role="article">
    <a aria-label="Fan Poster" href="/u/1">Fan Poster</a>
    <a href="https://www.facebook.com/groups/1/posts/555/"><span>3 h</span></a>
    <div data-ad-preview="message">Synthetic post body about the eras setlist</div>
    <span>All reactions:14</span><span>2 comments</span>
    <div role="button">Most relevant</div>
    <ul>
      <li><div role="article" aria-label="Comment by Synthetic Commenter 2 hours ago">
        <a href="/groups/1/posts/555/?comment_id=900">Synthetic Commenter</a>
        <div dir="auto">SYNTHETIC-COMMENT-TEXT alpha</div>
        <ul><li><div role="article" aria-label="Reply by Synthetic Replier 1 hour ago">
          <div dir="auto">SYNTHETIC-REPLY-TEXT beta</div>
        </div></li></ul>
      </div></li>
    </ul>
    <div role="button">View more comments</div>
    <div role="button">View 3 replies</div>
    <form><div contenteditable="true" role="textbox" aria-label="Write a comment…">SYNTHETIC-DRAFT</div></form>
  </div></div>
</div></body></html>`;

describe('comment subtrees never leave the page', () => {
  it('sanitized unit html passes the real parser and carries no comment text', async () => {
    const { buildHarvestedHtml } = await import('./fb-export-harvest.mjs');
    const { buildIngestResult } = await import('../community/fb-export-ingest.mjs');
    const dom = new JSDOM(THREAD_HTML);
    const core = loadCore();
    const snapshot = core.captureVisibleUnits(dom.window.document, dom.window);
    const merged = core.mergeHarvest(core.emptyHarvest(), snapshot);
    const { units } = plain(
      core.buildCoverage({
        harvest: merged,
        now: NOW,
        stopReason: 'feed-end',
        ageRuleMet: true,
        scrolls: 1,
        wallMs: 1,
      }),
    );
    expect(units).toHaveLength(1);
    const html = buildHarvestedHtml('Synthetic group', units);
    for (const leaked of [
      'SYNTHETIC-COMMENT-TEXT',
      'SYNTHETIC-REPLY-TEXT',
      'SYNTHETIC-DRAFT',
      'Synthetic Commenter',
      'Synthetic Replier',
      'comment_id=',
      'View more comments',
      'Most relevant',
      'View 3 replies',
    ])
      expect(html).not.toContain(leaked);
    // Post body, author, timestamp, permalink and the engagement labels survive.
    for (const kept of [
      'Synthetic post body about the eras setlist',
      'aria-label="Fan Poster"',
      '3 h',
      'https://www.facebook.com/groups/1/posts/555/',
      '2 comments',
    ])
      expect(html).toContain(kept);
    const parsed = buildIngestResult(html, {
      groupSlug: 'synthetic-group',
      groupName: 'Synthetic group',
      exportedAt: NOW,
    });
    expect(parsed.fanSignal.volume).toBe(1);
    expect(units[0]).toMatchObject({ ownTimestamp: '3 h', reactions: 14, commentCount: 2 });
    // The live page itself is untouched (the clone is what gets serialized).
    expect(dom.window.document.body.innerHTML).toContain('SYNTHETIC-COMMENT-TEXT');
  });

  // Codex round 2 #1: a comment rendered as plain divs (no nested role=article, no "Comment by"
  // label) after the post's action toolbar must still never reach the uploaded html.
  const toolbarPost = (labels: string[], tail: string) =>
    `<!doctype html><html><body><div role="feed"><div aria-posinset="1"><div role="article">
    <a aria-label="Fan Poster" href="/u/1">Fan Poster</a>
    <a href="https://www.facebook.com/groups/1/posts/556/"><span>3 h</span></a>
    <div data-ad-preview="message">Synthetic post body about the surprise songs</div>
    <div><span>All reactions:5</span><span>4 comments</span></div>
    <div class="bar">${labels
      .map((l) => `<div><div role="button" aria-label="${l}"><span>${l}</span></div></div>`)
      .join('')}</div>
    ${tail}
  </div></div></div></body></html>`;
  const plainComment =
    '<div><div><a href="/u/9">Synthetic Plain Commenter</a>' +
    '<div dir="auto">SYNTHETIC-PLAIN-COMMENT gamma</div>' +
    '<div><div role="button">Like</div><div role="button">Reply</div></div></div></div>';

  async function sanitizedRun(html: string) {
    const dom = new JSDOM(html);
    const core = loadCore();
    const snapshot = core.captureVisibleUnits(dom.window.document, dom.window);
    const merged = core.mergeHarvest(core.emptyHarvest(), snapshot);
    return plain(
      core.buildCoverage({
        harvest: merged,
        now: NOW,
        stopReason: 'feed-end',
        ageRuleMet: true,
        scrolls: 1,
        wallMs: 1,
      }),
    );
  }

  for (const [name, labels] of [
    ['English labels', ['Like', 'Comment', 'Share']],
    ['structure only (non-English labels)', ['Gefällt mir', 'Kommentieren', 'Teilen']],
  ] as const)
    it(`cuts everything after the action toolbar: ${name}`, async () => {
      const { buildHarvestedHtml } = await import('./fb-export-harvest.mjs');
      const { buildIngestResult } = await import('../community/fb-export-ingest.mjs');
      const { units, coverage } = await sanitizedRun(toolbarPost([...labels], plainComment));
      expect(units).toHaveLength(1);
      const html = buildHarvestedHtml('Synthetic group', units);
      expect(html).not.toContain('SYNTHETIC-PLAIN-COMMENT');
      expect(html).not.toContain('Synthetic Plain Commenter');
      expect(html).toContain('Synthetic post body about the surprise songs');
      expect(html).toContain('4 comments');
      expect(coverage.sanitizeDropped).toBe(0);
      const parsed = buildIngestResult(html, {
        groupSlug: 'synthetic-group',
        groupName: 'Synthetic group',
        exportedAt: NOW,
      });
      expect(parsed.fanSignal.volume).toBe(1);
    });

  const postShell = (inner: string) =>
    '<!doctype html><html><body><div role="feed"><div aria-posinset="1"><div role="article">' +
    `${inner}</div></div></div></body></html>`;
  const header =
    '<a aria-label="Fan Poster" href="/u/1">Fan Poster</a>' +
    '<a href="https://www.facebook.com/groups/1/posts/556/"><span>3 h</span></a>';

  // Codex round 3 #1: a comment Facebook renders in NO recognised shape — no toolbar before it,
  // no nested role=article, no "Comment by" label, no comment permalink — must still never reach
  // the upload. The positive build never copies it because it is not a post-owned element.
  it('positive build: an unrecognisable plain-div comment never reaches the html', async () => {
    const { buildHarvestedHtml } = await import('./fb-export-harvest.mjs');
    const { buildIngestResult } = await import('../community/fb-export-ingest.mjs');
    const html = postShell(
      `${header}<div data-ad-preview="message">Synthetic body about the bridge</div>` +
        '<div><span>All reactions:5</span><span>4 comments</span></div>' +
        '<div><a href="/u/9">Synthetic Plain Commenter</a>' +
        '<div dir="auto">SYNTHETIC-PLAIN-COMMENT delta</div></div>',
    );
    const { units, coverage } = await sanitizedRun(html);
    expect(units).toHaveLength(1);
    expect(coverage.sanitizeDropped).toBe(0);
    const out = buildHarvestedHtml('Synthetic group', units);
    expect(out).not.toContain('SYNTHETIC-PLAIN-COMMENT');
    expect(out).not.toContain('Synthetic Plain Commenter');
    for (const kept of [
      'aria-label="Fan Poster"',
      'https://www.facebook.com/groups/1/posts/556/',
      '3 h',
      'Synthetic body about the bridge',
      '5 reactions',
      '4 comments',
    ])
      expect(out).toContain(kept);
    const parsed = buildIngestResult(out, {
      groupSlug: 'synthetic-group',
      groupName: 'Synthetic group',
      exportedAt: NOW,
    });
    expect(parsed.fanSignal.volume).toBe(1);
    expect(parsed.engagementLeads[0].locator).toContain('Synthetic body about the bridge');
  });

  it('copies only post-owned media and keeps residue after the body out', async () => {
    const core = loadCore();
    const residues = [
      '<div><a href="/groups/1/posts/556/?comment_id=901">x</a><div>SYNTHETIC-RESIDUE</div></div>',
      '<div aria-label="Comment from a synthetic fan"><div>SYNTHETIC-RESIDUE</div></div>',
      // a plain-div comment with a photo and NO marker before it
      '<div><img src="https://cdn.example/comment.jpg" alt="SYNTHETIC-RESIDUE image"></div>' +
        '<div role="article" aria-label="Comment by Synthetic Fan">SYNTHETIC-RESIDUE</div>',
    ];
    for (const residue of residues) {
      // Post media is bounded by the message above and the reaction/comment count bar below.
      const html = postShell(
        `${header}<div data-ad-preview="message">Synthetic body</div>` +
          '<img src="https://cdn.example/post.jpg" alt="Synthetic post image">' +
          '<div><span>All reactions:5</span><span>4 comments</span></div>' +
          residue,
      );
      const unitEl = new JSDOM(html).window.document.querySelector('[aria-posinset]');
      const out = core.sanitizeUnitElement(unitEl);
      expect(out, residue).not.toBeNull();
      expect(out, residue).not.toContain('SYNTHETIC-RESIDUE');
      expect(out, residue).not.toContain('comment_id');
      expect(out, residue).toContain('https://cdn.example/post.jpg');
      expect(out, residue).not.toContain('comment.jpg');
    }
  });

  it('fails closed: no established post/comment boundary drops the unit html', async () => {
    const core = loadCore();
    const cases: [string, string][] = [
      // no message container at all: nothing is positively the post's body
      ['no message container', `${header}<p>Synthetic body in a plain paragraph</p>`],
      // the only message container sits after a comment marker: it is not the post's
      [
        'message after a comment marker',
        `${header}<div role="article" aria-label="Comment by Synthetic Fan">x</div>` +
          '<div data-ad-preview="message">SYNTHETIC-RESIDUE</div>',
      ],
      [
        'message after the action toolbar',
        `${header}<div class="bar"><div><div role="button">Like</div></div>` +
          '<div><div role="button">Comment</div></div><div><div role="button">Share</div></div></div>' +
          '<div data-ad-preview="message">SYNTHETIC-RESIDUE</div>',
      ],
      // the message container itself holds comment markers
      [
        'comment permalink inside the message',
        `${header}<div data-ad-preview="message">Synthetic body` +
          '<a href="/groups/1/posts/556/?reply_comment_id=902">x</a></div>',
      ],
      [
        'nested article inside the message',
        `${header}<div data-ad-preview="message">Synthetic body` +
          '<div role="article">SYNTHETIC-RESIDUE</div></div>',
      ],
      [
        'composer inside the message',
        `${header}<div data-ad-preview="message">Synthetic body<form></form></div>`,
      ],
      [
        'Comment/Reply label inside the message',
        `${header}<div data-ad-preview="message">Synthetic body` +
          '<div aria-label="Reply from a synthetic fan">SYNTHETIC-RESIDUE</div></div>',
      ],
    ];
    for (const [name, inner] of cases) {
      const html = postShell(inner);
      const unitEl = new JSDOM(html).window.document.querySelector('[aria-posinset]');
      expect(core.sanitizeUnitElement(unitEl), name).toBeNull();
      const { units, coverage } = await sanitizedRun(html);
      expect(units, name).toHaveLength(0);
      expect(coverage, name).toMatchObject({ recentCount: 1, sanitizeDropped: 1 });
    }
  });
});

describe('tab ↔ group binding helpers', () => {
  const core = loadCore();

  it('groupSegment normalizes the group segment of a facebook.com group url', () => {
    expect(core.groupSegment('https://www.facebook.com/groups/2254218764714763?x=1')).toBe(
      '2254218764714763',
    );
    expect(core.groupSegment('https://www.facebook.com/groups/Taylor.Vault/posts/1/')).toBe(
      'taylor.vault',
    );
    expect(core.groupSegment('https://www.facebook.com/groups/a%20b/')).toBe('a b');
    for (const url of [
      'https://www.facebook.com/groups/',
      'https://www.facebook.com/groups/../x',
      'https://www.facebook.com/login/?next=g',
      'https://m.facebook.com/groups/1',
      'http://www.facebook.com/groups/1',
      '',
    ])
      expect(core.groupSegment(url), url).toBeNull();
  });

  it('groupMatches accepts only the job’s id, its url segment or a configured alias', () => {
    const job = {
      groupId: '111',
      url: 'https://www.facebook.com/groups/111?x',
      aliases: ['vault'],
    };
    for (const url of [
      'https://www.facebook.com/groups/111',
      'https://www.facebook.com/groups/111/?sorting_setting=CHRONOLOGICAL',
      'https://www.facebook.com/groups/Vault/',
    ])
      expect(core.groupMatches(url, job), url).toBe(true);
    for (const url of [
      'https://www.facebook.com/groups/222',
      'https://www.facebook.com/groups/1111',
      'https://www.facebook.com/groups/other-vault',
      'https://www.facebook.com/checkpoint/1',
      '',
    ])
      expect(core.groupMatches(url, job), url).toBe(false);
    expect(
      core.groupMatches('https://www.facebook.com/groups/1', {
        url: 'https://www.facebook.com/groups/1',
      }),
    ).toBe(true);
    expect(core.groupMatches('https://www.facebook.com/groups/1', {})).toBe(false);
  });
});

describe('classifyPage: challenge only from the URL or dedicated challenge UI', () => {
  const core = loadCore();
  const feedPage = (postText: string, extra = '') =>
    new JSDOM(
      `<body>${extra}<div role="feed"><div aria-posinset="1"><div role="article">` +
        `<a aria-label="Fan">Fan</a><p>${postText}</p></div></div></div></body>`,
    ).window.document;
  const groupUrl = 'https://www.facebook.com/groups/1?sorting_setting=CHRONOLOGICAL';

  it('a rendered feed is ready whatever its post text says (Codex round 2 #3)', () => {
    for (const text of [
      'I got a captcha and a 2FA prompt while buying tickets',
      'Two-factor auth and a security check, required to confirm my email',
      'Shared post: This content isn’t available right now',
    ])
      expect(core.inspectPage(feedPage(text), groupUrl), text).toBe('ready');
  });

  it('still stops on challenge URLs, challenge UI, login and join-group', () => {
    expect(core.inspectPage(feedPage('x'), 'https://www.facebook.com/checkpoint/1')).toBe(
      'checkpoint',
    );
    expect(
      core.inspectPage(feedPage('x'), 'https://www.facebook.com/two_step_verification/x'),
    ).toBe('checkpoint');
    expect(core.inspectPage(feedPage('x'), 'https://www.facebook.com/login/?next=g')).toBe('login');
    const bare = (body: string) => new JSDOM(`<body>${body}</body>`).window.document;
    expect(
      core.inspectPage(bare('<iframe src="https://www.fbsbx.com/captcha/x"></iframe>'), groupUrl),
    ).toBe('captcha');
    expect(
      core.inspectPage(
        bare('<form action="/checkpoint/?next"><input name="approvals_code"></form>'),
        groupUrl,
      ),
    ).toBe('checkpoint');
    expect(core.inspectPage(bare('<input type="password" name="pass">'), groupUrl)).toBe('login');
    expect(core.inspectPage(bare('<p>This content isn’t available</p>'), groupUrl)).toBe(
      'unavailable',
    );
    // No feed + challenge words in plain text only → not a challenge (no URL, no challenge UI).
    expect(core.inspectPage(bare('<p>Enter the 2FA code from captcha</p>'), groupUrl)).toBe(
      'ready',
    );
    expect(core.inspectPage(feedPage('x', '<div role="button">Join group</div>'), groupUrl)).toBe(
      'not-member',
    );
  });
});

describe('profile verification is positive, absence is unverified', () => {
  const core = loadCore();
  const banner = (inner: string) =>
    new JSDOM(`<body><div role="banner">${inner}</div><div role="feed"></div></body>`).window
      .document;
  const actingPage = { name: 'Synthetic Page', id: '4242' };

  it('personal actor in the top bar → ok; Page actor or readable i_user → wrong-profile', () => {
    const personal = banner(
      '<div role="button" aria-label="Your profile"><svg aria-label="Synthetic Person" role="img"></svg></div>',
    );
    const asPage = banner(
      '<div role="button" aria-label="Your profile"><svg aria-label="Synthetic Page" role="img"></svg></div>',
    );
    const asPageById = banner(
      '<a aria-label="Your profile" href="/profile.php?id=4242"><span>p</span></a>',
    );
    const check = (doc: Any, cookie = '', readAs = 'personal') =>
      plain(core.profileCheck({ doc, cookie, readAs, actingPage }));
    expect(check(personal)).toEqual({ status: 'ok', profileVerified: true });
    expect(check(asPage)).toEqual({ status: 'wrong-profile', profileVerified: false });
    expect(check(asPageById)).toEqual({ status: 'wrong-profile', profileVerified: false });
    expect(check(personal, 'i_user=4242')).toEqual({
      status: 'wrong-profile',
      profileVerified: false,
    });
    expect(check(asPage, '', 'page')).toEqual({ status: 'ok', profileVerified: true });
    expect(check(personal, '', 'page')).toEqual({
      status: 'wrong-profile',
      profileVerified: false,
    });
  });

  // Codex round 3 #2: a Page that is not the configured one used to read as personal.
  it('any acting-as-a-Page signal is wrong-profile while reading as personal', () => {
    const otherPage = banner(
      '<div role="button" aria-label="Your profile"><svg aria-label="Some Other Page" role="img"></svg></div>' +
        '<div role="button" aria-label="Switch now">Switch now</div>',
    );
    const switchBarOnly = banner('<div role="button" aria-label="Switch back">x</div>');
    const yourPage = banner(
      '<a aria-label="Your Page" href="/profile.php?id=9"><span>p</span></a>',
    );
    const check = (doc: Any) =>
      plain(core.profileCheck({ doc, cookie: 'c_user=1', readAs: 'personal', actingPage }));
    for (const doc of [otherPage, switchBarOnly, yourPage])
      expect(check(doc)).toEqual({ status: 'wrong-profile', profileVerified: false });
  });

  it('no actor signal → unverified (keep going, coverage.profileVerified false)', () => {
    const none = new JSDOM('<body><div role="feed"></div></body>').window.document;
    expect(plain(core.profileCheck({ doc: none, cookie: 'c_user=1', actingPage }))).toEqual({
      status: 'unverified',
      profileVerified: false,
    });
    expect(core.detectWrongProfile({ doc: none, cookie: 'c_user=1', actingPage })).toBeNull();
    const cov = (extra: Any) =>
      plain(
        core.buildCoverage({
          harvest: core.emptyHarvest(),
          now: NOW,
          stopReason: 'feed-end',
          ageRuleMet: true,
          scrolls: 0,
          wallMs: 0,
          ...extra,
        }),
      ).coverage;
    expect(cov({}).profileVerified).toBe(false);
    expect(cov({ profileVerified: true }).profileVerified).toBe(true);
  });
});

// ---- background.js: durable delivery across a service-worker restart ----------------------

type Call = { method: string; path: string; body?: Any; url?: string; redirect?: string };

function fakeChrome(store: Record<string, Any>, alarms: Map<string, Any> = new Map()) {
  const listeners: { message?: Any; updated?: Any; alarm?: Any } = {};
  const tabUpdates: Any[] = [];
  const chrome = {
    storage: {
      session: {
        get: async (key: string) =>
          key in store ? { [key]: JSON.parse(JSON.stringify(store[key])) } : {},
        set: async (items: Record<string, Any>) => {
          for (const [k, v] of Object.entries(items)) store[k] = JSON.parse(JSON.stringify(v));
        },
      },
    },
    runtime: {
      getManifest: () => ({ version: '9.9.9' }),
      onMessage: { addListener: (fn: Any) => (listeners.message = fn) },
    },
    tabs: {
      update: async (tabId: number, props: Any) => void tabUpdates.push({ tabId, ...props }),
      onUpdated: { addListener: (fn: Any) => (listeners.updated = fn) },
    },
    alarms: {
      create: async (name: string, info: Any) => void alarms.set(name, info),
      clear: async (name: string) => alarms.delete(name),
      onAlarm: { addListener: (fn: Any) => (listeners.alarm = fn) },
    },
  };
  return { chrome, listeners, tabUpdates };
}

// Boots one service-worker instance over a shared session store. `respond` decides each
// receiver answer; returning null leaves the request hanging (the worker dies mid-request).
// GET /hello (the /start token validation) is answered {ok, runId} unless `hello` overrides it.
const HELLO = { status: 200, json: { ok: true, runId: 'run-1' } };
function bootWorker(
  store: Record<string, Any>,
  respond: (call: Call) => { status: number; json?: Any } | null,
  alarms: Map<string, Any> = new Map(),
  hello: (call: Call) => { status: number; json?: Any } | null = () => HELLO,
) {
  const calls: Call[] = [];
  const delays: number[] = [];
  const { chrome, listeners, tabUpdates } = fakeChrome(store, alarms);
  const fetch = async (url: string, init: Any) => {
    const call: Call = {
      method: init.method,
      path: new URL(url).pathname,
      body: init.body ? JSON.parse(init.body) : undefined,
      url,
      redirect: init.redirect,
    };
    calls.push(call);
    const answer = call.path === '/hello' ? hello(call) : respond(call);
    if (!answer) return new Promise(() => {});
    return {
      status: answer.status,
      ok: answer.status >= 200 && answer.status < 300,
      json: async () => answer.json ?? {},
    };
  };
  const context: Any = vm.createContext({
    chrome,
    fetch,
    console: { warn: () => {}, log: () => {} },
    URL,
    setTimeout: (fn: () => void, ms: number) => {
      delays.push(ms);
      return setTimeout(fn, 0);
    },
  });
  context.importScripts = (file: string) =>
    vm.runInContext(readFileSync(join(DIR, file), 'utf8'), context, { filename: file });
  vm.runInContext(readFileSync(join(DIR, 'background.js'), 'utf8'), context, {
    filename: 'background.js',
  });
  const send = (message: Any, sender: Any) =>
    new Promise<Any>((resolve) => {
      const async = listeners.message(message, sender, resolve);
      if (!async) resolve(undefined);
    });
  const settle = async () => {
    for (let i = 0; i < 50; i += 1) await new Promise((r) => setTimeout(r, 0));
  };
  const fireAlarm = (name: string) => listeners.alarm?.({ name });
  return {
    calls,
    delays,
    tabUpdates,
    send,
    settle,
    fireAlarm,
    alarms,
    ready: context.LLFB?.backgroundReady,
  };
}

describe('background.js outbox survives a worker restart', () => {
  const TOKEN = 'ab'.repeat(16);
  const startSender = { url: 'http://127.0.0.1:4567/start', tab: { id: 7 } };
  const groupSender = { url: 'https://www.facebook.com/groups/1', tab: { id: 7 } };
  const groupJob = {
    done: false,
    slug: 'group-a',
    url: 'https://www.facebook.com/groups/1',
    wallBudgetMs: 20 * 60_000,
  };
  const result = { v: 1, slug: 'group-a', status: 'collected', units: [], comments: [] };

  async function startAndDispatch(store: Record<string, Any>, resultAnswer: () => Any) {
    const worker = bootWorker(store, (call) => {
      if (call.path === '/next') return { status: 200, json: groupJob };
      if (call.path === '/result') return resultAnswer();
      return { status: 200, json: { ok: true } };
    });
    expect(
      await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender),
    ).toEqual({ ok: true });
    await worker.settle(); // (lets the pre-fix, un-awaited nextJob() reach the same point)
    expect(worker.tabUpdates).toEqual([{ tabId: 7, url: groupJob.url }]);
    expect((await worker.send({ type: 'llfb-ready' }, groupSender)).job.slug).toBe('group-a');
    return worker;
  }

  it('re-sends the persisted result after a restart between harvest and ack', async () => {
    const store: Record<string, Any> = {};
    // Worker 1 dies while POST /result is in flight.
    const first = await startAndDispatch(store, () => null);
    void first.send({ type: 'llfb-result', result }, groupSender);
    await first.settle();
    expect(first.calls.filter((c) => c.path === '/result')).toHaveLength(1);
    expect(store.llfb.outbox).toMatchObject({ phase: 'deliver' });
    expect(store.llfb.outbox.pendingResult).toMatchObject({ slug: 'group-a', extVersion: '9.9.9' });

    // Worker 2 boots on the same session storage and resumes the delivery.
    const second = bootWorker(store, (call) =>
      call.path === '/next' ? { status: 200, json: { done: true } } : { status: 200, json: {} },
    );
    await second.ready;
    await second.settle();
    expect(second.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /result',
      'GET /next',
      'POST /finished',
    ]);
    expect(second.calls[0].body).toMatchObject({ slug: 'group-a', status: 'collected' });
    expect(store.llfb).toMatchObject({ outbox: null, phase: 'done', finished: true });
  });

  it('counts a 409 duplicate as delivered and backs off on transient failures', async () => {
    const store: Record<string, Any> = {};
    const first = await startAndDispatch(store, () => null);
    void first.send({ type: 'llfb-result', result }, groupSender);
    await first.settle();
    let resultPosts = 0;
    const second = bootWorker(store, (call) => {
      if (call.path === '/result') {
        resultPosts += 1;
        return { status: resultPosts === 1 ? 500 : 409 };
      }
      return call.path === '/next'
        ? { status: 200, json: { done: true } }
        : { status: 200, json: {} };
    });
    await second.ready;
    await second.settle();
    expect(resultPosts).toBe(2);
    expect(second.delays).toContain(1_000);
    expect(store.llfb).toMatchObject({ outbox: null, finished: true });
  });

  it('answers llfb-result only after the receiver acknowledged it', async () => {
    const store: Record<string, Any> = {};
    const order: string[] = [];
    const worker = await startAndDispatch(store, () => {
      order.push('ack');
      return { status: 200, json: { ok: true } };
    });
    const response = await worker.send({ type: 'llfb-result', result }, groupSender);
    order.push('response');
    expect(response).toEqual({ ok: true });
    expect(order).toEqual(['ack', 'response']);
    expect(store.llfb.outbox).toBeNull();
  });
});

describe('background.js wake alarm and receiver pinning', () => {
  const TOKEN = 'cd'.repeat(16);
  const startSender = { url: 'http://127.0.0.1:4567/start', tab: { id: 7 } };
  const groupSender = { url: 'https://www.facebook.com/groups/1', tab: { id: 7 } };
  const groupJob = {
    done: false,
    slug: 'group-a',
    groupId: '1',
    url: 'https://www.facebook.com/groups/1?sorting_setting=CHRONOLOGICAL',
  };

  // Codex round 3 #4: the /start token is validated with the receiver before it may replace any
  // session state; a refused token (or an unreachable port) never overwrites a live session.
  it('validates the /start token with GET /hello before touching a live session', async () => {
    const live = {
      port: 4000,
      token: 'ef'.repeat(16),
      runId: 'run-live',
      tabId: 7,
      job: { ...groupJob, dispatched: true, startedAtMs: 1 },
      outbox: null,
      phase: 'job',
      finished: false,
    };
    for (const refusal of [
      () => ({ status: 403 }),
      () => ({ status: 200, json: { ok: true } }), // no runId
      () => ({ status: 200, json: { ok: false, runId: 'x' } }),
      () => ({ status: 503 }),
    ]) {
      const store: Record<string, Any> = { llfb: JSON.parse(JSON.stringify(live)) };
      const worker = bootWorker(store, () => ({ status: 200, json: groupJob }), new Map(), refusal);
      expect(
        await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender),
      ).toEqual({ ok: false });
      await worker.settle();
      expect(store.llfb).toEqual(live); // untouched
      expect(worker.calls.map((c) => c.path).filter((p) => p !== '/hello')).toEqual([]);
      expect(worker.calls[0]).toMatchObject({ method: 'GET', path: '/hello' });
    }
    // Accepted: the new run replaces the old one.
    const store: Record<string, Any> = { llfb: JSON.parse(JSON.stringify(live)) };
    const worker = bootWorker(store, () => ({ status: 200, json: groupJob }));
    expect(
      await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender),
    ).toEqual({ ok: true });
    await worker.settle();
    expect(store.llfb).toMatchObject({ port: 4567, token: TOKEN, runId: 'run-1', phase: 'job' });
    expect(worker.calls[0]).toMatchObject({
      method: 'GET',
      path: '/hello',
      url: 'http://127.0.0.1:4567/hello',
    });
  }, 30_000);

  // Codex round 3 #3: the job goes only to a page on the job's group; any other group page
  // (a redirect, a navigation) reports the job failed{redirected} — or the challenge status its
  // URL names — and gets no job.
  it('binds the job to the group url: another group is reported redirected, never harvested', async () => {
    const cases: [string, Record<string, unknown>][] = [
      ['https://www.facebook.com/groups/2', { status: 'failed', message: 'redirected' }],
      ['https://www.facebook.com/groups/11/', { status: 'failed', message: 'redirected' }],
      ['https://www.facebook.com/checkpoint/1', { status: 'checkpoint', message: 'redirected' }],
      ['https://www.facebook.com/login/?next=g', { status: 'login', message: 'redirected' }],
    ];
    for (const [url, expected] of cases) {
      const store: Record<string, Any> = {};
      let served = 0;
      const worker = bootWorker(store, (call) => {
        if (call.path === '/next')
          return { status: 200, json: served++ ? { done: true } : groupJob };
        return { status: 200, json: { ok: true } };
      });
      await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
      await worker.settle();
      const wrongPage = { url, tab: { id: 7, url } };
      expect(await worker.send({ type: 'llfb-ready' }, wrongPage), url).toEqual({ job: null });
      await worker.settle();
      const posted = worker.calls.find((c) => c.path === '/result');
      expect(posted?.body, url).toMatchObject({ slug: 'group-a', units: [], ...expected });
      expect(store.llfb.job, url).toBeNull();
    }
    // The right page still gets the job; heartbeats/results from another page are refused.
    const store: Record<string, Any> = {};
    const worker = bootWorker(store, (call) =>
      call.path === '/next' ? { status: 200, json: groupJob } : { status: 200, json: { ok: true } },
    );
    await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
    await worker.settle();
    const other = { url: 'https://www.facebook.com/groups/2', tab: { id: 7 } };
    expect(await worker.send({ type: 'llfb-heartbeat', scrolls: 1, slotCount: 1 }, other)).toEqual({
      ok: false,
    });
    expect(
      await worker.send(
        { type: 'llfb-result', result: { v: 1, slug: 'group-a', status: 'collected', units: [] } },
        other,
      ),
    ).toEqual({ ok: false });
    expect(worker.calls.filter((c) => c.path === '/result' || c.path === '/heartbeat')).toEqual([]);
    expect((await worker.send({ type: 'llfb-ready' }, groupSender)).job.slug).toBe('group-a');
  }, 30_000);

  it('schedules a wake alarm when /next is unreachable and clears it after the transition', async () => {
    const store: Record<string, Any> = {};
    const alarms = new Map<string, Any>();
    let up = false;
    const worker = bootWorker(
      store,
      (call) => {
        if (!up) return { status: 503 };
        if (call.path === '/next') return { status: 200, json: groupJob };
        return { status: 200, json: { ok: true } };
      },
      alarms,
    );
    await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
    await worker.settle();
    expect(store.llfb.phase).toBe('next');
    expect(worker.tabUpdates).toEqual([]);
    expect(alarms.get('llfb-resume')).toMatchObject({ periodInMinutes: 1 });

    // Still down at the first wake: the alarm stays armed.
    worker.fireAlarm('llfb-resume');
    await worker.settle();
    expect(alarms.has('llfb-resume')).toBe(true);

    up = true;
    worker.fireAlarm('llfb-resume');
    await worker.settle();
    expect(worker.tabUpdates).toEqual([{ tabId: 7, url: groupJob.url }]);
    expect(store.llfb.phase).toBe('job');
    expect(alarms.has('llfb-resume')).toBe(false);
  });

  it('wakes to re-deliver a persisted result after the in-worker retries ran out', async () => {
    const store: Record<string, Any> = {};
    const alarms = new Map<string, Any>();
    let resultStatus = 500;
    const worker = bootWorker(
      store,
      (call) => {
        if (call.path === '/next')
          return { status: 200, json: store.llfb?.lastDelivered ? { done: true } : groupJob };
        if (call.path === '/result') return { status: resultStatus };
        return { status: 200, json: { ok: true } };
      },
      alarms,
    );
    await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
    await worker.settle();
    await worker.send({ type: 'llfb-ready' }, groupSender);
    const result = { v: 1, slug: 'group-a', status: 'collected', units: [], comments: [] };
    expect(await worker.send({ type: 'llfb-result', result }, groupSender)).toEqual({ ok: true });
    expect(store.llfb.phase).toBe('deliver');
    expect(alarms.has('llfb-resume')).toBe(true);

    resultStatus = 200;
    worker.fireAlarm('llfb-resume');
    await worker.settle();
    expect(store.llfb).toMatchObject({ phase: 'done', finished: true, outbox: null });
    expect(alarms.has('llfb-resume')).toBe(false);
    expect(worker.calls.at(-1)?.path).toBe('/finished');
  });

  it('refuses a /start whose claimed port is not the page it came from', async () => {
    const store: Record<string, Any> = {};
    const worker = bootWorker(store, () => ({ status: 200, json: groupJob }));
    const claims = [
      [{ port: 9999 }, startSender],
      [{ port: 4567 }, { url: 'http://127.0.0.1:4567/other', tab: { id: 7 } }],
      [{ port: 4567 }, { url: 'http://localhost:4567/start', tab: { id: 7 } }],
      [{ port: 4567 }, { url: 'http://127.0.0.1:4567/startx', tab: { id: 7 } }],
    ];
    for (const [claim, sender] of claims)
      expect(await worker.send({ type: 'llfb-start', token: TOKEN, ...claim }, sender)).toEqual({
        ok: false,
      });
    expect(worker.calls).toEqual([]);
    expect(store.llfb).toBeUndefined();
  });

  it('only talks to the /start port, never follows a redirect, and refuses non-group job urls', async () => {
    const bad = [
      'https://www.facebook.com/groups/',
      'https://www.facebook.com/groups/../settings',
      'https://www.facebook.com/groupsx/1',
      'https://www.facebook.com.evil.example/groups/1',
      'https://evil.example/https://www.facebook.com/groups/1',
      'http://www.facebook.com/groups/1',
      'https://www.facebook.com/groups/1#x',
    ];
    for (const url of bad) {
      const store: Record<string, Any> = {};
      let served = false;
      const worker = bootWorker(store, (call) => {
        if (call.path === '/next') {
          const job = served ? { done: true } : { ...groupJob, url };
          served = true;
          return { status: 200, json: job };
        }
        return { status: 200, json: { ok: true } };
      });
      await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
      await worker.settle();
      expect(worker.tabUpdates, url).toEqual([]);
      const posted = worker.calls.find((c) => c.path === '/result');
      expect(posted?.body, url).toMatchObject({ slug: 'group-a', status: 'failed' });
      expect(
        worker.calls.every(
          (c) => c.url?.startsWith('http://127.0.0.1:4567/') && c.redirect === 'error',
        ),
      ).toBe(true);
    }
    for (const url of [
      'https://www.facebook.com/groups/1',
      'https://www.facebook.com/groups/taylor.swift_vault-1/',
      'https://www.facebook.com/groups/1?sorting_setting=CHRONOLOGICAL',
    ]) {
      const worker = bootWorker({}, (call) =>
        call.path === '/next' ? { status: 200, json: { ...groupJob, url } } : { status: 200 },
      );
      await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
      await worker.settle();
      expect(worker.tabUpdates).toEqual([{ tabId: 7, url }]);
    }
  }, 30_000);

  it('acknowledges a re-sent result it already took (worker stopped before answering)', async () => {
    const store: Record<string, Any> = {};
    const worker = bootWorker(store, (call) => {
      if (call.path === '/next')
        return { status: 200, json: store.llfb?.lastDelivered ? { done: true } : groupJob };
      return { status: 200, json: { ok: true } };
    });
    await worker.send({ type: 'llfb-start', port: 4567, token: TOKEN }, startSender);
    await worker.settle();
    await worker.send({ type: 'llfb-ready' }, groupSender);
    const result = { v: 1, slug: 'group-a', status: 'collected', units: [], comments: [] };
    expect(await worker.send({ type: 'llfb-result', result }, groupSender)).toEqual({ ok: true });
    expect(await worker.send({ type: 'llfb-result', result }, groupSender)).toEqual({ ok: true });
    expect(worker.calls.filter((c) => c.path === '/result')).toHaveLength(1);
    const other = { ...result, slug: 'group-b' };
    expect(await worker.send({ type: 'llfb-result', result: other }, groupSender)).toEqual({
      ok: false,
    });
  });
});
