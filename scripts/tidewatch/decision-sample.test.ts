import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module
import { MAX_ITEMS, SYSTEM, main, renderMarkdown, sampleRows, scoreCollapsed, scorePairs } from './decision-sample.mjs';
// @ts-expect-error plain .mjs module
import { SYSTEM as BASE_SYSTEM } from './label-replay.mjs';

type Row = { id: string; class: string; decider: string; watch_item: { excerpt: string } };
const mk = (id: string, cls: string, decider: string): Row => ({ id, class: cls, decider, watch_item: { excerpt: `SECRET-TEXT-${id}` } });
const many = (prefix: string, cls: string, decider: string, n: number) => Array.from({ length: n }, (_, i) => mk(`${prefix}${i}`, cls, decider));

const rows: Row[] = [
  ...many('rum', 'rumor', 'haiku', 5), ...many('noi', 'noise', 'jev', 4), ...many('fan', 'fan_discussion', 'haiku', 3),
  ...many('cp', 'critical_personal', 'jev', 2), ...many('cb', 'critical_breaking', 'haiku', 2),
  ...many('nn', 'normal_news', 'jev', 200), ...many('dup', 'duplicate', 'code', 80), ...many('red', 'privacy_redline', 'code', 50),
  ...many('nc', 'normal_news', 'code', 10), mk('blank', 'rumor', 'jev'),
];
rows[rows.length - 1].watch_item.excerpt = '  ';

describe('sampleRows', () => {
  const sample = sampleRows(rows, { seed: 'a' });
  const ids = (list: Row[]) => list.map((r) => r.id);

  it('keeps every forced class and fills normal_news to 100 total', () => {
    expect(sample.tierA).toHaveLength(100);
    expect(sample.tierA.filter((r: Row) => r.class === 'rumor')).toHaveLength(5);
    expect(sample.tierA.filter((r: Row) => r.class === 'normal_news')).toHaveLength(100 - 16);
    expect(sample.skippedNoText).toBe(1);
  });
  it('never puts a code row in Tier A and keeps Tier C to 30 per class', () => {
    expect(sample.tierA.every((r: Row) => r.decider !== 'code')).toBe(true);
    expect(sample.tierC.every((r: Row) => r.decider === 'code' && ['duplicate', 'privacy_redline'].includes(r.class))).toBe(true);
    expect(sample.tierC.filter((r: Row) => r.class === 'duplicate')).toHaveLength(30);
    expect(sample.tierC.filter((r: Row) => r.class === 'privacy_redline')).toHaveLength(30);
    expect(sample.tierA.length + sample.tierC.length).toBeLessThanOrEqual(MAX_ITEMS);
  });
  it('is deterministic per seed and differs across seeds', () => {
    expect(ids(sampleRows(rows, { seed: 'a' }).tierA)).toEqual(ids(sample.tierA));
    expect(ids(sampleRows(rows, { seed: 'b' }).tierA)).not.toEqual(ids(sample.tierA));
  });
  it('takes no normal_news when the forced classes already fill the total', () => {
    const forcedOnly = sampleRows([...many('r', 'rumor', 'jev', 120), ...many('n', 'normal_news', 'jev', 9)], { seed: 'a' });
    expect(forcedOnly.tierA.filter((r: Row) => r.class === 'normal_news')).toHaveLength(0);
  });
});

describe('scorePairs', () => {
  const pairs = [
    { decided: 'rumor', decider: 'haiku', sonnet: 'rumor' },
    { decided: 'rumor', decider: 'haiku', sonnet: 'critical_breaking' },
    { decided: 'critical_breaking', decider: 'jev', sonnet: 'normal_news' },
    { decided: 'normal_news', decider: 'jev', sonnet: 'normal_news' },
    { decided: 'duplicate', decider: 'code', sonnet: 'normal_news' },
  ];
  const score = scorePairs(pairs);
  it('computes per-class precision, confusion and decider splits', () => {
    expect(score.perClass.rumor).toEqual({ n: 2, sonnetAgree: 1, precision: 0.5 });
    expect(score.perClass.normal_news.precision).toBe(1);
    expect(score.perClass.duplicate.precision).toBeNull();
    expect(score.confusion.rumor).toEqual({ critical_breaking: 1, rumor: 1 });
    expect(score.byDecider.haiku).toEqual({ n: 2, sonnetAgree: 1, precision: 0.5 });
    expect(score.byDecider.jev.n).toBe(2);
  });
  it('counts Tier A critical misses both ways', () => {
    expect(score.tierAMisses).toEqual({ missedCritical: 1, falseCritical: 1 });
  });
  it('replaces non-taxonomy class strings', () => {
    const odd = scorePairs([{ decided: 'http://x.example/a b', decider: 'jev', sonnet: 'rumor' }]);
    expect(Object.keys(odd.perClass)).toEqual(['_other']);
  });
});

describe('scoreCollapsed', () => {
  const score = scoreCollapsed([
    { decided: 'noise', decider: 'jev', sonnet: 'normal_news' },
    { decided: 'fan_discussion', decider: 'jev', sonnet: 'rumor' },
    { decided: 'rumor', decider: 'haiku', sonnet: 'rumor' },
    { decided: 'normal_news', decider: 'jev', sonnet: 'fan_discussion' },
    { decided: 'duplicate', decider: 'code', sonnet: 'normal_news' },
  ]);
  it('merges the three low-stakes classes on both sides', () => {
    expect(score.perBucket.low_stakes).toEqual({ n: 3, sonnetAgree: 2, precision: 0.667 });
    expect(score.perBucket.rumor).toEqual({ n: 1, sonnetAgree: 1, precision: 1 });
    expect(Object.keys(score.perBucket)).not.toContain('noise');
  });
  it('scores overall over scorable buckets only', () => {
    expect(score.perBucket.duplicate.precision).toBeNull();
    expect({ n: score.n, agree: score.sonnetAgree, precision: score.precision }).toEqual({ n: 4, agree: 3, precision: 0.75 });
  });
  it('returns null precision for no pairs', () => {
    expect(scoreCollapsed([]).precision).toBeNull();
  });
});

describe('prompt', () => {
  it('extends the label-replay prompt with the D-c rulings', () => {
    expect(SYSTEM.startsWith(BASE_SYSTEM)).toBe(true);
    expect(SYSTEM).toMatch(/D-c/);
    expect(SYSTEM).toMatch(/VMAs/);
    expect(SYSTEM).toMatch(/home or property/);
  });
});

describe('main', () => {
  const fakeClient = (data: Row[]) => {
    const q: Record<string, unknown> = {};
    const self = new Proxy(q, { get: (_t, prop) => (prop === 'range' ? async () => ({ data, error: null }) : () => self) });
    return { from: () => self };
  };
  // Echo every item back as a Sonnet label of general_news (-> normal_news).
  const call = async ({ user }: { user: string }) => {
    const count = Number(/Label these (\d+) items/.exec(user)?.[1]);
    return { status: 'ok', data: { labels: Array.from({ length: count }, (_, i) => ({
      id: `i${i + 1}`, c: 'general_news', o: false, s: 'stated_fact', u: 2, p: false, x: false, f: false, m: 'not_product', b: false, t: false, d: 3, i: false })) } };
  };

  it('writes a report and summary with class ids and numbers only', async () => {
    const written: string[] = [];
    const logs: string[] = [];
    const summary: string[] = [];
    const out = await main(['--seed', 's'], {
      client: fakeClient(rows), call, env: { GITHUB_STEP_SUMMARY: 'summary.md' }, now: new Date('2026-10-22T00:00:00Z'),
      writeFile: async (_f: string, text: string) => { written.push(text); },
      appendFile: async (_f: string, text: string) => { summary.push(text); },
      log: (line: string) => logs.push(line),
    });
    expect(out.report.sample.tierA).toBe(100);
    expect(out.report.sample.tierC).toBe(60);
    expect(out.report.tierA.perClass.normal_news.precision).toBe(1);
    expect(out.report.tierC.perClass.privacy_redline.precision).toBe(0);
    const everything = [...written, ...logs, ...summary, renderMarkdown(out.report)].join('\n');
    expect(everything).not.toMatch(/SECRET-TEXT/);
    expect(everything).not.toMatch(/https?:\/\//);
    expect(everything).not.toMatch(/\b(?:rum|noi|fan|cp|cb|nn|dup|red|nc)\d+\b/);
  });

  const run = async (argv: string[], data: Row[]) => {
    const written: string[] = [];
    const logs: string[] = [];
    const summary: string[] = [];
    const out = await main(argv, {
      client: fakeClient(data), call, env: { GITHUB_STEP_SUMMARY: 'summary.md' }, now: new Date('2026-10-22T00:00:00Z'),
      writeFile: async (_f: string, text: string) => { written.push(text); },
      appendFile: async (_f: string, text: string) => { summary.push(text); },
      log: (line: string) => logs.push(line),
    });
    return { out, written, logs, summary };
  };

  it('emits the collapsed block in report, markdown and JSON', async () => {
    const { out, written, logs } = await run(['--seed', 's'], rows);
    expect(out.report.collapsed.tierA.perBucket.low_stakes.precision).toBe(1);
    expect(JSON.parse(written[0]).collapsed.tierA.perBucket.low_stakes.n).toBeGreaterThan(0);
    expect(logs.join('\n')).toContain('Collapsed (normal_news + noise + fan_discussion -> low_stakes)');
  });

  it('rejects seeds outside /^[\\w-]{1,32}$/', async () => {
    for (const bad of ['', 'a b', 'a/b', '../x', 'x'.repeat(33), 'sé']) {
      await expect(run(['--seed', bad], rows)).rejects.toThrow(/--seed/);
    }
    await expect(run(['--seed', 'ok-Seed_1'], rows)).resolves.toBeDefined();
  });

  it('never leaks a canary excerpt into logs, summary or JSON', async () => {
    const canary = 'CANARY-9f3c1e7a-excerpt';
    const data = [...many('cn', 'rumor', 'haiku', 3), ...many('cm', 'normal_news', 'jev', 5), ...many('cd', 'duplicate', 'code', 2)]
      .map((r) => ({ ...r, watch_item: { excerpt: `${canary} ${r.id}` } }));
    const { out, written, logs, summary } = await run(['--seed', 's'], data);
    expect(out.report.sample.tierA).toBe(8);
    const everything = [...written, ...logs, ...summary, renderMarkdown(out.report)].join('\n');
    expect(everything).not.toContain(canary);
    expect(everything).not.toMatch(/CANARY/i);
  });
});

describe('--since', () => {
  const recordingClient = (seen: string[]) => {
    const q: Record<string, unknown> = {};
    const self = new Proxy(q, {
      get: (_t, prop) => {
        if (prop === 'range') return async () => ({ data: [], error: null });
        if (prop === 'gte') return (_col: string, value: string) => { seen.push(value); return self; };
        return () => self;
      },
    });
    return { from: () => self };
  };
  const quiet = { writeFile: async () => {}, appendFile: async () => {}, log: () => {}, call: async () => ({ status: 'ok', data: { labels: [] } }) };

  it.each(['2026-10-20', '2026-10-20T12:00Z', '2026-10-20T12:00:30.5Z'])('accepts %s', async (since) => {
    await expect(main(['--since', since], { ...quiet, client: recordingClient([]), env: {}, now: new Date('2026-10-22T00:00:00Z') })).resolves.toBeDefined();
  });

  it.each(['', '2026-10-20T12:00', '2026-13-01', '2026-10-20 12:00Z', 'yesterday', '2026-10-20T12Z'])('rejects %j', async (since) => {
    await expect(main(['--since', since], { ...quiet, client: recordingClient([]), env: {} })).rejects.toThrow(/--since/);
  });

  it('passes a later since as the fetch start', async () => {
    const seen: string[] = [];
    await main(['--since', '2026-10-21T00:00Z'], { ...quiet, client: recordingClient(seen), env: {}, now: new Date('2026-10-22T00:00:00Z') });
    expect(seen).toEqual(['2026-10-21T00:00Z']);
  });

  it('keeps the default start when since is earlier', async () => {
    const seen: string[] = [];
    await main(['--since', '2026-10-01'], { ...quiet, client: recordingClient(seen), env: {}, now: new Date('2026-10-22T00:00:00Z') });
    expect(seen).toEqual(['2026-10-16T02:49:00Z']);
  });

  it('writes since into the JSON and markdown header', async () => {
    const written: string[] = [];
    await main(['--since', '2026-10-21'], { ...quiet, client: recordingClient([]), env: {}, now: new Date('2026-10-22T00:00:00Z'),
      writeFile: async (_f: string, text: string) => { written.push(text); } });
    expect(JSON.parse(written[0]).since).toBe('2026-10-21');
    expect(renderMarkdown(JSON.parse(written[0]))).toContain('since 2026-10-21');
  });
});
