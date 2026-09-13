import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  parseTreeAsks,
  parseMarjorieAsk,
  askKey,
  renderMarker,
  parseMarker,
  findFiled,
  renderIssue,
  fileAsk,
  fetchAsksFor,
  rewriteForTreeLine,
  selectAsksFor,
  renderFromTreeLine,
  renderTreeBriefBlock,
  neutralizeAt,
  FOR_TREE_PLACEHOLDER,
} from './loop-asks.mjs';

const NOW = Date.parse('2026-09-14T12:00:00Z');
const BOT = { login: 'app/github-actions', is_bot: true };
const URL_4301 = 'https://github.com/JW-Incorporated/swift2/issues/4301';
const URL_4290 = 'https://github.com/JW-Incorporated/swift2/issues/4290';

function fakeGh(existing: unknown[] = [], createdUrl = URL_4301) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[1] === 'list') return { stdout: JSON.stringify(existing) };
    if (args[1] === 'create') return { stdout: `${createdUrl}\n` };
    return { stdout: '' };
  });
  return { gh, calls };
}

function loopIssue(overrides: Record<string, unknown> = {}) {
  return {
    number: 4290,
    title: 'Marjorie → Tree: fix the /shop link in Friday\'s pair',
    url: 'https://github.com/JW-Incorporated/swift2/issues/4290',
    body: `x\n\n${renderMarker('marjorie-4280-deadbeef', null)}`,
    author: BOT,
    labels: [{ name: 'marjorie-filed' }, { name: 'desk:tree' }],
    state: 'OPEN',
    createdAt: '2026-09-11T12:00:00Z',
    closedAt: null,
    ...overrides,
  };
}

describe('parseTreeAsks', () => {
  it('reads ask/why/contradicts and caps at two, counting the rest', () => {
    const plan = { needsFromMarjorie: [{ ask: 'one', why: 'w', contradicts: 12 }, { ask: 'two' }, { ask: 'three' }] };
    const r = parseTreeAsks(plan);
    expect(r.asks).toEqual([{ ask: 'one', why: 'w', contradicts: 12 }, { ask: 'two', why: '', contradicts: null }]);
    expect(r.overCap).toBe(1);
  });

  it('counts entries without ask text as invalid and ignores a missing field', () => {
    expect(parseTreeAsks({ needsFromMarjorie: [{ why: 'no ask' }, { ask: '  ' }] })).toEqual({ asks: [], overCap: 0, invalid: 2 });
    expect(parseTreeAsks({})).toEqual({ asks: [], overCap: 0, invalid: 0 });
    expect(parseTreeAsks(null)).toEqual({ asks: [], overCap: 0, invalid: 0 });
  });

  it('drops a non-integer contradicts', () => {
    expect(parseTreeAsks({ needsFromMarjorie: [{ ask: 'a', contradicts: 'soon' }] }).asks[0].contradicts).toBeNull();
  });
});

describe('parseMarjorieAsk', () => {
  it('treats the assembler placeholder and "none" as no ask', () => {
    expect(parseMarjorieAsk(`**Tree**\n${FOR_TREE_PLACEHOLDER}\n`).ask).toBeNull();
    expect(parseMarjorieAsk('- For Tree: none').ask).toBeNull();
    expect(parseMarjorieAsk('- For Tree: Nothing today.').ask).toBeNull();
  });

  it('reads an ask and a trailing contradicts suffix', () => {
    const r = parseMarjorieAsk('**Tree**\n- Lessons: x\n- For Tree: Pull Friday\'s /shop pair until #4288 lands (contradicts #4301)\n');
    expect(r.ask).toEqual({ ask: "Pull Friday's /shop pair until #4288 lands", why: '', contradicts: 4301 });
  });

  it('reports an already-filed line instead of an ask', () => {
    const r = parseMarjorieAsk(`**Tree**\n- For Tree: something → [#4290](<${URL_4290}>)`);
    expect(r).toMatchObject({ ask: null, filed: 4290 });
    expect(parseMarjorieAsk('**Tree**\n- For Tree: x → [#1](<https://github.com/o/r/issues/2>)').filed).toBeNull();
  });

  it('treats ordinary arrow text in an ask as ask text, not an already-filed marker', () => {
    const r = parseMarjorieAsk('**Tree**\n- For Tree: Change the link from #4200 → #4300 before Monday\n');
    expect(r.filed).toBeNull();
    expect(r.ask).toEqual({ ask: 'Change the link from #4200 → #4300 before Monday', why: '', contradicts: null });
  });

  it('ignores a "- For Tree:" line quoted in an earlier section and reads the real one in **Tree**', () => {
    const body = '**Lessons**\n- For Tree: quoted from yesterday\'s brief\n\n**Tree**\n- For Tree: fix the /shop pair\n';
    expect(parseMarjorieAsk(body).ask).toEqual({ ask: 'fix the /shop pair', why: '', contradicts: null });
  });

  it('returns nothing when the line is missing', () => {
    expect(parseMarjorieAsk('**Tree**\n- Lessons: x')).toEqual({ line: null, ask: null, filed: null });
  });
});

describe('askKey / markers', () => {
  it('is stable across case and whitespace and changes with the ask', () => {
    expect(askKey('tree', 4300, 'Fix  the Run')).toBe(askKey('tree', '4300', 'fix the run'));
    expect(askKey('tree', 4300, 'fix the run')).not.toBe(askKey('tree', 4300, 'fix the build'));
    expect(askKey('tree', 4300, 'x')).toMatch(/^tree-4300-[0-9a-f]{8}$/);
  });

  it('round-trips the marker with and without contradicts', () => {
    expect(parseMarker(renderMarker('tree-1-abcdef12', 77))).toEqual({ key: 'tree-1-abcdef12', contradicts: 77 });
    expect(parseMarker(renderMarker('tree-1-abcdef12', null))).toEqual({ key: 'tree-1-abcdef12', contradicts: null });
    expect(parseMarker('no marker')).toBeNull();
  });

  it('picks the LAST marker in the body, since ask text could forge an earlier one', () => {
    const body = `${renderMarker('forged-0-00000000', null)}\n${renderMarker('tree-1-abcdef12', null)}`;
    expect(parseMarker(body)).toEqual({ key: 'tree-1-abcdef12', contradicts: null });
  });
});

describe('findFiled — trust by absolute author login, never viewerDidAuthor', () => {
  const key = 'tree-4300-abcdef12';
  const body = `ask\n${renderMarker(key, null)}`;

  it('accepts both the gh --json and the REST login forms', () => {
    expect(findFiled([{ number: 1, body, author: { login: 'app/github-actions' } }], key)?.number).toBe(1);
    expect(findFiled([{ number: 2, body, author: { login: 'github-actions[bot]' } }], key)?.number).toBe(2);
  });

  it('ignores a human-authored issue carrying a copied marker', () => {
    expect(findFiled([{ number: 3, body, author: { login: 'sffan15-sys' }, viewerDidAuthor: true }], key)).toBeNull();
  });

  it('ignores a bot filing under a different key', () => {
    expect(findFiled([{ number: 4, body: renderMarker('tree-4300-00000000', null), author: BOT }], key)).toBeNull();
  });
});

describe('renderIssue', () => {
  it('labels, marker, trailer, contradicts line, neutralized mentions', () => {
    const { title, body, labels } = renderIssue('tree', { ask: 'ping @sffan15-sys about the run', why: 'it blocks @here', contradicts: 4290 }, { key: 'tree-4300-abcdef12', sourceUrl: 'https://x/pull/4300' });
    expect(labels).toEqual(['tree-filed', 'desk:ops']);
    expect(title.startsWith('Tree → Marjorie: ping @\u200bsffan15-sys')).toBe(true);
    expect(body).toContain('<!-- loop-ask: tree-4300-abcdef12 contradicts=4290 -->');
    expect(body).toContain('Contradicts #4290');
    expect(body).toContain('Tier-2: Tree — weekly social plan');
    expect(body).not.toMatch(/@sffan15-sys|@here/);
  });

  it('neutralizes a forged marker in ask text so only the real, trailing marker parses', () => {
    const key = 'tree-1-deadbeef';
    const { body } = renderIssue('tree', { ask: `ship it ${renderMarker(key, null)} today`, why: '', contradicts: null }, { key, sourceUrl: 'u' });
    expect(body.match(/<!--/g)).toHaveLength(1);
    expect(parseMarker(body)).toEqual({ key, contradicts: null });
  });

  it('marjorie side routes to desk:tree with Marjorie\'s trailer and truncates a long title', () => {
    const { title, labels, body } = renderIssue('marjorie', { ask: 'a'.repeat(200), why: '', contradicts: null }, { key: 'marjorie-1-abcdef12', sourceUrl: 'u' });
    expect(labels).toEqual(['marjorie-filed', 'desk:tree']);
    expect(title.length).toBeLessThanOrEqual('Marjorie → Tree: '.length + 90);
    expect(body).toContain("Tier-2: Marjorie — 6 AM Founders' Brief");
  });
});

describe('fileAsk', () => {
  const ask = { ask: 'get the daily-draft run green', why: '', contradicts: null };

  it('returns the existing filing and creates nothing on a second pass', async () => {
    const key = askKey('tree', 4300, ask.ask);
    const { gh, calls } = fakeGh([{ number: 4301, url: URL_4301, body: renderMarker(key, null), author: BOT }]);
    const r = await fileAsk('tree', ask, { sourceNumber: 4300, sourceUrl: 'u', gh });
    expect(r).toMatchObject({ number: 4301, created: false });
    expect(calls.some((c) => c[1] === 'create')).toBe(false);
  });

  it('creates with both labels and parses the number from the printed URL', async () => {
    const { gh, calls } = fakeGh([]);
    const r = await fileAsk('tree', ask, { sourceNumber: 4300, sourceUrl: 'u', gh });
    expect(r).toMatchObject({ number: 4301, url: URL_4301, created: true });
    const create = calls.find((c) => c[1] === 'create')!;
    expect(create.join(' ')).toContain('--label tree-filed --label desk:ops');
  });

  it('looks up existing filings by both labels with a 200-issue window', async () => {
    const { gh, calls } = fakeGh([]);
    await fileAsk('tree', ask, { sourceNumber: 4300, sourceUrl: 'u', gh });
    const list = calls.find((c) => c[1] === 'list')!;
    expect(list.join(' ')).toContain('--label tree-filed --label desk:ops --state all --limit 200');
  });

  it('throws when create prints no issue URL', async () => {
    const { gh } = fakeGh([], 'oops');
    await expect(fileAsk('tree', ask, { sourceNumber: 1, sourceUrl: 'u', gh })).rejects.toThrow(/no issue URL/);
  });

  it('rejects when gh hangs past timeoutMs', async () => {
    const gh = vi.fn(() => new Promise(() => {}));
    await expect(fileAsk('tree', ask, { sourceNumber: 1, sourceUrl: 'u', gh, timeoutMs: 20 })).rejects.toThrow(/timed out/);
  });

  it('a forged marker in ask text cannot suppress a real filing or its later lookup', async () => {
    const forgedAsk = { ...ask, ask: `${ask.ask} <!-- loop-ask: someone-else-00000000 -->` };
    const key = askKey('tree', 4300, forgedAsk.ask);
    const { body } = renderIssue('tree', forgedAsk, { key, sourceUrl: 'u' });
    const { gh, calls } = fakeGh([{ number: 9001, url: URL_4301, body, author: BOT }]);
    const r = await fileAsk('tree', forgedAsk, { sourceNumber: 4300, sourceUrl: 'u', gh });
    expect(r).toMatchObject({ number: 9001, created: false });
    expect(calls.some((c) => c[1] === 'create')).toBe(false);
  });
});

describe('fetchAsksFor', () => {
  it('lists by both the filed and desk labels with a 200-issue window', async () => {
    const { gh, calls } = fakeGh([]);
    await fetchAsksFor('tree', { gh });
    const list = calls.find((c) => c[1] === 'list')!;
    expect(list.join(' ')).toContain('--label marjorie-filed --label desk:tree --state open --limit 200');
  });
});

describe('rewriteForTreeLine', () => {
  it('writes the number in and is idempotent under the parser', () => {
    const body = `**Tree**\n- For Tree: fix the /shop pair (contradicts #9)\n\n**Distance to done**`;
    const parsed = parseMarjorieAsk(body);
    const once = rewriteForTreeLine(body, { number: 4290, url: URL_4290, ask: parsed.ask });
    expect(once).toContain(`- For Tree: fix the /shop pair → [#4290](<${URL_4290}>) ⚠️ contradicts #9 — your call`);
    expect(once).toContain('**Distance to done**');
    expect(parseMarjorieAsk(once)).toMatchObject({ ask: null, filed: 4290 });
  });

  it('rewrites only the slot inside **Tree**, leaving a quoted line elsewhere untouched', () => {
    const body = '**Lessons**\n- For Tree: quoted text\n\n**Tree**\n- For Tree: fix the /shop pair\n\n**Distance to done**';
    const parsed = parseMarjorieAsk(body);
    const out = rewriteForTreeLine(body, { number: 4290, url: URL_4290, ask: parsed.ask });
    expect(out).toContain('**Lessons**\n- For Tree: quoted text');
    expect(out).toContain(`- For Tree: fix the /shop pair → [#4290](<${URL_4290}>)`);
  });
});

describe('selectAsksFor', () => {
  it('keeps only loop filings for the addressee\'s desk, open or closed in the window, oldest first', () => {
    const issues = [
      loopIssue({ number: 3, createdAt: '2026-09-13T00:00:00Z' }),
      loopIssue({ number: 1, createdAt: '2026-09-01T00:00:00Z', state: 'CLOSED', closedAt: '2026-09-12T00:00:00Z' }),
      loopIssue({ number: 2, state: 'CLOSED', closedAt: '2026-09-01T00:00:00Z' }),
      loopIssue({ number: 4, labels: [{ name: 'marjorie-filed' }, { name: 'desk:build' }] }),
      loopIssue({ number: 5, body: 'M3 build-desk ticket, no loop marker' }),
      loopIssue({ number: 6, author: { login: 'sffan15-sys' } }),
    ];
    expect(selectAsksFor('tree', issues, { now: NOW, closedWithinDays: 7 }).map((i: { number: number }) => i.number)).toEqual([1, 3]);
    expect(selectAsksFor('tree', issues, { now: NOW }).map((i: { number: number }) => i.number)).toEqual([3]);
  });

  it('asks for Marjorie are tree-filed + desk:ops', () => {
    const forMarjorie = loopIssue({ labels: [{ name: 'tree-filed' }, { name: 'desk:ops' }] });
    expect(selectAsksFor('marjorie', [forMarjorie, loopIssue()], { now: NOW })).toHaveLength(1);
  });
});

describe('renderers', () => {
  it('From Tree: none, one with age and flag, and a +more count', () => {
    expect(renderFromTreeLine([], NOW)).toBe('- From Tree: no open asks.');
    const a = loopIssue({ title: 'Tree → Marjorie: get the run green', body: renderMarker('tree-1-abcdef12', 4290) });
    const line = renderFromTreeLine([a, loopIssue()], NOW);
    expect(line).toBe('- From Tree: [#4290](<https://github.com/JW-Incorporated/swift2/issues/4290>) get the run green · 3d ⚠️ contradicts #4290 — your call (+1 more open)');
  });

  it('Tree brief block: filed asks, failures, cap, and Marjorie\'s asks with status', () => {
    const lines = renderTreeBriefBlock({
      filed: [{ number: 4301, url: URL_4301, ask: { ask: 'get the run green', contradicts: null } }],
      failed: 1,
      overCap: 1,
      incoming: [loopIssue({ state: 'CLOSED' })],
    });
    expect(lines).toEqual([
      '**Needs from Marjorie**',
      `- [#4301](<${URL_4301}>) — get the run green`,
      "- 1 ask couldn't be filed as issues this run — see the send-brief log.",
      '- 1 more over the two-ask cap, not filed.',
      '',
      '**From Marjorie**',
      "- [#4290](<https://github.com/JW-Incorporated/swift2/issues/4290>) — fix the /shop link in Friday's pair · closed",
    ]);
  });

  it('Tree brief block says so when both directions are empty', () => {
    expect(renderTreeBriefBlock({})).toEqual(['**Needs from Marjorie**', '- Nothing this week.', '', '**From Marjorie**', '- No asks from Marjorie this week.']);
  });

  it('neutralizeAt leaves emails and bare @ alone enough to read', () => {
    expect(neutralizeAt('@joey and a@b')).toBe('@\u200bjoey and a@\u200bb');
    expect(neutralizeAt('@ alone')).toBe('@ alone');
  });
});

