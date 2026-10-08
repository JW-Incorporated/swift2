import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { classifyFounderGate, asksInBrief, askHistory, resolveAsk, partitionAsks, ESCALATE_AFTER } from './founder-gate.mjs';

const NOW = new Date('2026-08-11T19:00:00Z').getTime();
const DAY = 86_400_000;
const label = (...names: string[]) => names.map((name) => ({ name }));

describe('classifyFounderGate', () => {
  it('gates on provable membership, not on keywords in the body', () => {
    expect(classifyFounderGate({ number: 1, title: 'a thing', labels: label('founder-decision'), body: '' }).gated).toBe(true);
    expect(classifyFounderGate({ number: 2, title: 'a thing', labels: [], body: '### Tier\nTX — founder-only' }).gated).toBe(true);
  });

  it('does not gate a build ticket that merely says "token"', () => {
    // #1869 is a Build ticket about a REST fallback; an early keyword-only
    // classifier put it on the founders' checklist as "needs a credential".
    const issue = { number: 1869, title: 'Build: assemble-brief cannot run in cloud', labels: [], body: 'the GH_TOKEN is proxy-scoped, so the api key path fails' };
    expect(classifyFounderGate(issue).gated).toBe(false);
  });

  it('never gates a brief, which quotes every open ask by construction', () => {
    const brief = { number: 1640, title: "Founders' Brief — 2026-07-31", labels: label('founders-brief'), body: 'privacy policy · terms of service · billing' };
    expect(classifyFounderGate(brief).gated).toBe(false);
  });

  it('gates a launch-gate ticket whose TITLE names a founder-only act', () => {
    const legal = { number: 800, title: 'LEGAL launch gate: drafts for IP-counsel review', labels: label('launch-gate'), body: '' };
    const g = classifyFounderGate(legal);
    expect(g.gated).toBe(true);
    expect(g.reasons).toContain('needs legal sign-off');
  });
});

describe('asksInBrief', () => {
  it('reads only checkbox lines, so mentions elsewhere are not treated as asks', () => {
    const body = [
      '- [ ] [Turn on the scanners](https://github.com/o/r/issues/979) (2 min)',
      '- [x] [Analytics](https://github.com/o/r/issues/799)',
      '| PLUMBING | 🟡 | E2E re-anchor #669 |',
      'Some note referencing #1234.',
    ].join('\n');
    const asks = asksInBrief(body);
    expect(asks.map((a: { issues: number[] }) => a.issues)).toEqual([[979], [799]]);
    expect(asks[1].ticked).toBe(true);
  });

  // 2026-09-05 audit: `HA#22 …` lines registered a phantom ask against
  // GitHub issue #22, and every HUMAN-ACTIONS line did the same.
  it('does not read HA#NN (a HUMAN-ACTIONS item) as GitHub issue #NN', () => {
    const body = [
      '- [ ] [BLOCKING] HA#22 Photo-Enrichment egress block — waiting 11d',
      '- [ ] 🔴 HA#4 API accounts (#3584 related) — waiting 21d',
    ].join('\n');
    const asks = asksInBrief(body);
    expect(asks[0].issues).toEqual([]);
    expect(asks[1].issues).toEqual([3584]);
  });
});

describe('founder-task issues — the second phantom-ask loop', () => {
  it('gates a founder-task by label, so it goes through resolveAsk like a decision', () => {
    const g = classifyFounderGate({ number: 2195, title: 'founder-task: social reach week of 2026-08-17', labels: label('founder-task'), body: '' });
    expect(g.gated).toBe(true);
    expect(g.reasons).toContain('founder-task');
  });

  it('resolves a founder-task when the founder answered on the task itself (#2195, 2026-08-17)', () => {
    const task = {
      number: 2195, title: 'founder-task: social reach week of 2026-08-17', state: 'OPEN',
      labels: label('founder-task'), createdAt: '2026-08-12T00:00:00Z',
      comments: [{ author: { login: 'sffan15-sys' }, createdAt: '2026-08-17T23:09:20Z', body: 'All 3 tasks are complete. Image requested is attached.' }],
    };
    const briefs = [{ number: 2300, createdAt: '2026-08-16T12:00:00Z', body: '- [ ] [#2195](https://github.com/o/r/issues/2195) **founder-task**' }];
    const { open, resolved } = partitionAsks([task], { briefs, now: new Date('2026-08-18T12:00:00Z').getTime() });
    expect(open).toEqual([]);
    expect(resolved.map((r: { number: number }) => r.number)).toEqual([2195]);
    expect(resolved[0].resolution.how).toBe('answered-on-ticket');
  });
});

describe('resolveAsk — the phantom-checklist fix', () => {
  const raisedAt = '2026-07-31T12:00:00Z';

  it('resolves when the issue is simply closed', () => {
    // #799 was closed 2026-07-29 and re-asked in five later briefs.
    const r = resolveAsk({ number: 799, state: 'CLOSED', closedAt: '2026-07-29T17:04:59Z' }, { raisedAt });
    expect(r).toMatchObject({ resolved: true, how: 'closed' });
  });

  it('resolves on a founder comment posted on the TICKET, not in the brief', () => {
    // The real event: Joey commented "Done" on #799 on 2026-08-01.
    const r = resolveAsk({
      number: 799,
      state: 'OPEN',
      comments: [{ author: { login: 'sffan15-sys' }, createdAt: '2026-08-01T14:19:34Z', body: 'Done' }],
    }, { raisedAt });
    expect(r.how).toBe('answered-on-ticket');
    expect(r.evidence).toContain('sffan15-sys');
  });

  it('ignores an agent comment and a founder comment predating the ask', () => {
    const stale = { author: { login: 'sffan15-sys' }, createdAt: '2026-07-01T00:00:00Z', body: 'Done' };
    const agent = { author: { login: 'some-bot' }, createdAt: '2026-08-05T00:00:00Z', body: 'Done' };
    expect(resolveAsk({ number: 1, state: 'OPEN', comments: [stale, agent] }, { raisedAt }).resolved).toBe(false);
  });

  it('still honours a ticked box when the brief body was founder-edited', () => {
    const previousBrief = {
      number: 1870, createdAt: '2026-08-10T12:00:00Z', founderEditedBody: true,
      body: '- [x] [do the thing](https://github.com/o/r/issues/42)',
    };
    expect(resolveAsk({ number: 42, state: 'OPEN', comments: [] }, { raisedAt, previousBrief }).how).toBe('ticked-in-brief');
  });

  it('does not honour a ticked box on a brief no founder edited', () => {
    const previousBrief = {
      number: 1870, createdAt: '2026-08-10T12:00:00Z', founderEditedBody: false,
      body: '- [x] [do the thing](https://github.com/o/r/issues/42)',
    };
    expect(resolveAsk({ number: 42, state: 'OPEN', comments: [] }, { raisedAt, previousBrief }).resolved).toBe(false);
  });
});

describe('askHistory + partitionAsks', () => {
  const briefs = Array.from({ length: 4 }, (_, i) => ({
    number: 1800 + i,
    createdAt: new Date(NOW - (i + 1) * DAY).toISOString(),
    body: '- [ ] [Turn on the scanners](https://github.com/o/r/issues/979)',
  }));

  it('counts how many briefs have carried the same ask', () => {
    expect(askHistory(briefs).get(979).timesAsked).toBe(4);
  });

  it(`escalates an ask carried ${ESCALATE_AFTER}+ times instead of re-listing it politely`, () => {
    const issue = { number: 979, title: 'Turn on the scanners', state: 'OPEN', labels: label('founder-decision'), body: '', createdAt: new Date(NOW - 20 * DAY).toISOString(), comments: [] };
    const p = partitionAsks([issue], { briefs, now: NOW });
    expect(p.open).toHaveLength(0);
    expect(p.escalated[0].escalateReason).toContain('asked 4×');
  });

  it('escalates a bank item that has aged 21+ days without ever being asked', () => {
    // Four such items were open on 2026-08-11, the oldest at 31 days.
    const issue = { number: 459, title: 'Theme pills do nothing', state: 'OPEN', labels: label('founder-decision'), body: '', createdAt: new Date(NOW - 31 * DAY).toISOString(), comments: [] };
    const p = partitionAsks([issue], { briefs: [], now: NOW });
    expect(p.escalated[0].escalateReason).toContain('never once put in front of you');
  });

  it('drops a resolved ask from the checklist and records it as a phantom', () => {
    const issue = { number: 979, title: 'Turn on the scanners', state: 'CLOSED', closedAt: new Date(NOW - 2 * 3_600_000).toISOString(), labels: label('founder-decision'), body: '', createdAt: new Date(NOW - 20 * DAY).toISOString(), comments: [] };
    const p = partitionAsks([issue], { briefs, now: NOW });
    expect(p.open.concat(p.escalated)).toHaveLength(0);
    expect(p.resolved.map((r: { number: number }) => r.number)).toEqual([979]);
    expect(p.phantom.map((r: { number: number }) => r.number)).toEqual([979]);
  });

  it('does not report every ticket the org closed as "cleared"', () => {
    const unrelated = { number: 5000, title: 'a content fix', state: 'CLOSED', closedAt: new Date(NOW - 3_600_000).toISOString(), labels: [], body: '', createdAt: new Date(NOW - DAY).toISOString(), comments: [] };
    expect(partitionAsks([unrelated], { briefs, now: NOW }).resolved).toHaveLength(0);
  });
});
