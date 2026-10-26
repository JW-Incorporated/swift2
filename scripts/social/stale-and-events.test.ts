// Bots v2 W8: stale-draft retirement, same-day event dispatch, the failure receipt.
import { describe, expect, it } from 'vitest';
import { buildReceipt, causeOf } from './draft-receipt.mjs';
import { collectGithub } from './prepare-draft-inputs.mjs';
import { retiredComment, sweep, MAX_RETIRED_PER_RUN } from './retire-stale-drafts.mjs';
import { staleReason } from './lib/draft-prs.mjs';
import { DISPATCH_LABEL, EVENT_DAILY_CAP, EVENT_WINDOW_HOURS, fromRestIssue, isTrustedAuthor, judgeTitle, pickEvents, siteFrontedMoment } from './lib/event-dispatch.mjs';
import { dispatchPicks } from './dispatch-event-drafts.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const H = 3_600_000;
const ago = (hours: number) => new Date(NOW - hours * H).toISOString();
/** A trusted, undispatched open intake issue `hours` old — the shape pickEvents reads. */
const issueAt = (number: number, title: string, hours: number) => ({ number, title, createdAt: ago(hours), labels: ['intake'], author: 'claude[bot]', authorAssociation: 'CONTRIBUTOR' });
const pr = (over: Record<string, unknown> = {}) => ({ number: 1, createdAt: ago(72), labels: ['social-draft'], queuePaths: ['social/queue/a.json'], failingChecks: [], ...over });
const unstamped = [{ data: { platform: 'x' } }];
const stamped = (hoursAgo: number) => [{ data: { platform: 'x', approval: { at: ago(hoursAgo) } } }];

describe('staleReason — the three dead draft shapes', () => {
  it('retires a draft nobody approved after 48h, and leaves a young one alone', () => {
    expect(staleReason(pr(), unstamped, NOW)).toMatch(/no founder approval stamp/);
    expect(staleReason(pr({ createdAt: ago(40) }), unstamped, NOW)).toBeNull();
  });
  it('retires a PR with no queue files left (every draft was rejected)', () => {
    expect(staleReason(pr({ queuePaths: [] }), [], NOW)).toMatch(/every draft was removed/);
  });
  it('retires an approved-but-stranded PR only when a check is red and the stamp is old', () => {
    expect(staleReason(pr({ failingChecks: ['check-drafts'] }), stamped(60), NOW)).toMatch(/approved 60h ago.*check-drafts failing/);
    expect(staleReason(pr({ failingChecks: [] }), stamped(60), NOW)).toBeNull(); // green: the poll will merge it
    expect(staleReason(pr({ failingChecks: ['check-drafts'] }), stamped(10), NOW)).toBeNull(); // freshly approved
  });
  it('never touches a hold, a partly-stamped PR, or one it could not read (fail closed)', () => {
    expect(staleReason(pr({ labels: ['social-draft', 'hold'] }), unstamped, NOW)).toBeNull();
    expect(staleReason(pr(), [...stamped(60), ...unstamped], NOW)).toBeNull();
    expect(staleReason(pr(), [{ data: null }], NOW)).toBeNull();
  });
});

function fakeGh(prs: Array<Record<string, unknown>>, files: Record<string, unknown>, views: Record<number, Record<string, unknown>> = {}) {
  const calls: string[][] = [];
  const run = (args: string[]) => {
    calls.push(args);
    if (args[0] === 'pr' && args[1] === 'view') {
      const p = { state: 'OPEN', ...prs.find((x) => String(x.number) === args[2]), ...views[Number(args[2])] };
      return JSON.stringify({ ...p, files: ((p.queuePaths as string[]) ?? []).map((path) => ({ path })), statusCheckRollup: [] });
    }
    if (args[0] === 'pr' && args[1] === 'list') return JSON.stringify(prs.map((p) => ({ ...p, files: ((p.queuePaths as string[]) ?? []).map((path) => ({ path })), statusCheckRollup: ((p.failingChecks as string[]) ?? []).map((name) => ({ name, conclusion: 'FAILURE' })) })));
    if (args[0] === 'api') {
      const path = /contents\/([^?]+)\?/.exec(args[1])![1];
      return JSON.stringify({ content: Buffer.from(JSON.stringify(files[path])).toString('base64') });
    }
    return '';
  };
  return { run, calls };
}

describe('sweep', () => {
  const prs = [
    { number: 10, createdAt: ago(72), headRefOid: 'a'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/old.json'] },
    { number: 11, createdAt: ago(5), headRefOid: 'b'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/new.json'] },
    { number: 12, createdAt: ago(72), headRefOid: 'c'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/ok.json'] },
  ];
  const files = { 'social/queue/old.json': { platform: 'x' }, 'social/queue/new.json': { platform: 'x' }, 'social/queue/ok.json': { platform: 'x', approval: { at: ago(3) } } };

  it('a dry run decides but closes nothing', () => {
    const { run, calls } = fakeGh(prs, files);
    const out = sweep(run, { repo: 'o/r', nowMs: NOW });
    expect(out.filter((d: { retire: boolean }) => d.retire).map((d: { pr: number }) => d.pr)).toEqual([10]); // 11 is young; 12 is stamped with a green check
    expect(out.find((d: { pr: number }) => d.pr === 10)).toMatchObject({ retire: true });
    expect(calls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
  });

  it('--apply closes only the stale unapproved one, with a retired: comment (never reject:)', () => {
    const { run, calls } = fakeGh(prs, files);
    sweep(run, { repo: 'o/r', nowMs: NOW, apply: true });
    const closes = calls.filter((c) => c[0] === 'pr' && c[1] === 'close');
    expect(closes).toHaveLength(1);
    expect(closes[0].slice(0, 3)).toEqual(['pr', 'close', '10']);
    expect(closes[0][4]).toMatch(/^retired: open \d+h with no founder approval stamp/);
    expect(retiredComment('x')).not.toMatch(/^reject:/);
  });

  it('re-reads the PR just before closing and skips one that was approved since the list', () => {
    const base = { number: 10, createdAt: ago(72), headRefOid: 'a'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/old.json'] };
    // The list read shows it unapproved; by the time of the close it carries a stamp.
    let reads = 0;
    const calls: string[][] = [];
    const run = (args: string[]) => {
      calls.push(args);
      if (args[0] === 'pr' && args[1] === 'list') return JSON.stringify([{ ...base, files: [{ path: 'social/queue/old.json' }], statusCheckRollup: [] }]);
      if (args[0] === 'pr' && args[1] === 'view') return JSON.stringify({ ...base, state: 'OPEN', files: [{ path: 'social/queue/old.json' }], statusCheckRollup: [] });
      if (args[0] === 'api') {
        reads += 1;
        const data = reads === 1 ? { platform: 'x' } : { platform: 'x', approval: { at: ago(0) } };
        return JSON.stringify({ content: Buffer.from(JSON.stringify(data)).toString('base64') });
      }
      return '';
    };
    const out = sweep(run, { repo: 'o/r', nowMs: NOW, apply: true });
    expect(out[0]).toMatchObject({ pr: 10, retire: false, changed: true });
    expect(calls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
  });

  it('skips a PR that gained a hold, or was closed, between the list and the close', () => {
    for (const view of [{ labels: [{ name: 'social-draft' }, { name: 'hold' }] }, { state: 'CLOSED' }]) {
      const { run, calls } = fakeGh(prs, files, { 10: view });
      sweep(run, { repo: 'o/r', nowMs: NOW, apply: true });
      expect(calls.some((c) => c[0] === 'pr' && c[1] === 'close' && c[2] === '10')).toBe(false);
    }
  });

  it('caps how many it retires in one run', () => {
    const many = Array.from({ length: MAX_RETIRED_PER_RUN + 3 }, (_, i) => ({ number: 100 + i, createdAt: ago(72), headRefOid: 'd'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/old.json'] }));
    const { run } = fakeGh(many, files);
    expect(sweep(run, { repo: 'o/r', nowMs: NOW }).filter((d: { retire: boolean }) => d.retire)).toHaveLength(MAX_RETIRED_PER_RUN);
  });
});

describe('collectGithub degrades to warnings, never throws', () => {
  it('turns an unreadable section into a warning and an empty list', () => {
    const warnings: string[] = [];
    const out = collectGithub(() => { throw new Error('HTTP 502'); }, { nowMs: NOW, repo: 'o/r', warnings });
    expect(out).toEqual({ openDrafts: [], closedPrs: [], intakeIssues: [] });
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatch(/could not be read.*unknown, not as empty/);
  });
});

describe('event dispatch', () => {
  const issue = (number: number, title: string, hoursAgo = 3, labels: string[] = ['intake'], author = 'claude[bot]', authorAssociation = 'CONTRIBUTOR') => ({ number, title, createdAt: ago(hoursAgo), labels, author, authorAssociation });

  it('judges titles: a release is in, a lawsuit or a listing is out', () => {
    expect(judgeTitle("intake: Taylor Swift's 'Patient Zero' music video premieres at the VMAs").ok).toBe(true);
    expect(judgeTitle('intake: Taylor Swift moves to dismiss trademark lawsuit').ok).toBe(false);
    expect(judgeTitle("intake: Taylor Swift's former home listed for $7.9M").ok).toBe(false);
    expect(judgeTitle('codify: L001 — never re-use').ok).toBe(false);
  });

  it('picks newest-first, skips dispatched and covered events, and honours the daily cap', () => {
    const issues = [
      issue(1, 'intake: Taylor Swift announces a new single', 20),
      issue(2, "intake: 'Cleveland!' lyric video drops", 2),
      issue(3, 'intake: Taylor Swift releases a trailer', 5, ['intake', DISPATCH_LABEL]),
      issue(4, 'intake: Taylor Swift wins another award', 30),
      issue(5, "intake: 'Opalite' video teaser released", 6),
      issue(6, 'intake: Taylor Swift announces a tour leg', 60),
    ];
    const covered = [{ data: { body: "the 'Opalite' video teaser is out", campaign: 'c', why: 'w' } }];
    const { picks, skipped } = pickEvents({ issues, socialItems: covered, nowMs: NOW });
    expect(picks.map((p: { number: number }) => p.number)).toEqual([2, 1]);
    expect(skipped.map((s: { why: string }) => s.why)).toEqual(expect.arrayContaining(['already dispatched', 'older than 48h', 'already covered by a posted/queued/drafted item']));
    expect(EVENT_DAILY_CAP).toBe(2);
    expect(pickEvents({ issues, socialItems: covered, nowMs: NOW, dispatchedToday: 1 }).picks).toHaveLength(1);
    expect(pickEvents({ issues, socialItems: covered, nowMs: NOW, dispatchedToday: 2 }).picks).toEqual([]);
  });

  // #6313: the scan bounded itself at 24h while strategy §1(e2) asks for 48, so one
  // missed news-triage or scan run dropped an event out of the window for good.
  it('scans a 48h window, so a 30h-old event is in and only a 60h-old one falls out', () => {
    expect(EVENT_WINDOW_HOURS).toBe(48);
    const issues = [issue(4, 'intake: Taylor Swift wins another award', 30), issue(6, 'intake: Taylor Swift announces a tour leg', 60)];
    const { picks, skipped } = pickEvents({ issues, socialItems: [], nowMs: NOW });
    expect(picks.map((p: { number: number }) => p.number)).toEqual([4]);
    expect(skipped).toEqual([{ number: 6, why: 'older than 48h' }]);
  });
});

// #6313: TIMELY_RE was matching wire headlines only incidentally — on a stray
// `album`/`single`/`video` noun — and missing the event families the news desk
// actually files. Titles here are verbatim from real intake issues.
describe('event dispatch reads the event families the news desk files', () => {
  it('passes a live debut, an appearance and a chart week; still refuses commentary and the blocklist', () => {
    for (const title of [
      'intake: Taylor Swift and Caitlin Clark attend Chiefs-Chargers game at Arrowhead with Este Haim, wears red bodysuit (SI/Fox News-OutKick, Oct 18 2026)',
      'intake: YouTube appearance — Good Morning America: “Taylor Swift tops Billboard 200” (published 2026-10-12)',
      "intake: Taylor Swift performs 'The Fate of Ophelia' live for the first time, four-song full-band set, Dior gown, at Academy Museum Gala (NYT/Rolling Stone, Oct 17 2026)",
      "intake: 'The Life of a Showgirl' logs 15th week at No. 1 on Billboard 200 (Variety/Official Charts, Oct 18-19 2026)",
    ]) expect(judgeTitle(title), title).toMatchObject({ ok: true });

    // Commentary, not a time-boxed event: the daily cap of 2 must not go on these.
    for (const title of [
      'intake: Richard Marx recounts turning down a co-write with 15-year-old Taylor Swift, says he still doesn\'t regret it (Ultimate Classic Rock, Oct 2026)',
      "intake: Bad Gyal says she'd refuse $3M to collaborate with Taylor Swift, calls her music 'dry chicken' (IBTimes/Complex, Oct 15 2026)",
      'intake: Emmitt Smith defends Taylor Swift against NFL-broadcast overexposure criticism (Variety, Oct 14 2026)',
    ]) expect(judgeTitle(title).ok, title).toBe(false);

    expect(judgeTitle('intake: Taylor Swift wins her trademark lawsuit').why).toMatch(/sensitive topic/);
  });
});

// #6313: a moment the site already fronts has passed the news desk's editorial bar,
// so the keyword test is the wrong gate for it (strategy §1(e2): "the site's front
// page is the trigger"). The fixture is the week-to-2026-10-25 new-on-site sheets.
describe('the site-fronted rule', () => {
  const siteMoments = [
    { id: 'm1', title: '"Hey, it\'s Taylor Swift" goes global: the voice trademark push reaches the UK, EU and Australia' },
    { id: 'm2', title: 'Emmitt Smith on the game-day camera: "She\'s not looking for the damn camera!"' },
    { id: 'm3', title: '“The Fate of Ophelia” goes live for the first time, closing the Academy Museum Gala' },
    { id: 'm4', title: 'Caitlin Clark and Este Haim join Taylor at Arrowhead as the Chiefs rout the Chargers' },
    { id: 'm5', title: '"Showgirl" reaches 15 weeks at No. 1 as "Patient Zero" makes it three straight in the UK' },
    { id: 'm6', title: 'Richard Marx on the 15-year-old Taylor he passed on writing with: “I did the right thing”' },
    { id: 'm7', title: 'Selena Gomez on marriage advice for Taylor: “I think she’s probably the best to give me that”' },
    { id: 'm8', title: 'Jason\'s 7:30 a.m. "Squatober" call, and Taylor\'s verdict on it' },
    { id: 'm9', title: 'Bad Gyal says she wouldn’t collaborate with Taylor for $3 million' },
    { id: 'm10', title: 'Confetti on the debut page: "20 years of Taylor Swift"' },
  ];

  it('links an intake issue to the moment it sourced, and never on a common word alone', () => {
    expect(siteFrontedMoment('intake: Taylor Swift expands voice/likeness trademark filings to UK, EU, Australia amid AI deepfake crackdown (MBW, Oct 15 2026)', siteMoments)).toMatchObject({ id: 'm1' });
    expect(siteFrontedMoment('intake: Selena Gomez says Taylor Swift is better suited to give marriage advice, at Rare Impact Fund Benefit (Cheat Sheet, Oct 14-15 2026)', siteMoments)).toMatchObject({ id: 'm7' });
    // growth-coverage's keywordsOf reduced m2 to the token `she` and matched 14 unrelated
    // intake issues; three distinctive shared words must not fire on an unrelated story.
    expect(siteFrontedMoment('intake: YouTube appearance — New Heights: “Mahomes Is Having Fun Again” (published 2026-10-23)', siteMoments)).toBeNull();
    expect(siteFrontedMoment('intake: Taylor Swift wears ruby ring jewelry trend at Chiefs game (Who What Wear, Oct 24 2026)', siteMoments)).toBeNull();
    expect(siteFrontedMoment('intake: x', siteMoments)).toBeNull();
    expect(siteFrontedMoment('intake: Taylor Swift releases a trailer', undefined)).toBeNull();
  });

  it('promotes a site-fronted moment past TIMELY_RE but never past the blocklist', () => {
    const donation = 'intake: Taylor Swift donated $50,000 to Seattle Symphony in 2015 after hearing \'Become Ocean\' (UPI/KIRO7, Dec 2015)';
    const moments = [{ id: 'm11', title: 'Moved by "Become Ocean," she sends the Seattle Symphony $50,000' }];
    expect(judgeTitle(donation).ok).toBe(false); // no time-boxed keyword
    expect(judgeTitle(donation, { siteFronted: true })).toMatchObject({ ok: true, siteFronted: true });
    expect(pickEvents({ issues: [issueAt(11, donation, 3)], socialItems: [], siteMoments: moments, nowMs: NOW }).picks).toMatchObject([{ number: 11, siteFronted: 'm11' }]);
    // The #36 blocklist is not waived by the site fronting it.
    expect(judgeTitle('intake: Taylor Swift named in a trademark lawsuit', { siteFronted: true }).why).toMatch(/sensitive topic/);
  });

  it('picks a site-fronted moment ahead of newer ordinary news, so the cap cannot starve the curated lane', () => {
    const moments = [{ id: 'm4', title: 'Caitlin Clark and Este Haim join Taylor at Arrowhead as the Chiefs rout the Chargers' }];
    const { picks } = pickEvents({
      issues: [
        issueAt(1, 'intake: Taylor Swift releases a trailer', 1),
        issueAt(2, 'intake: Taylor Swift drops a teaser', 2),
        issueAt(3, 'intake: Taylor Swift and Caitlin Clark attend Chiefs-Chargers game at Arrowhead with Este Haim (SI, Oct 18 2026)', 20),
      ],
      socialItems: [], siteMoments: moments, nowMs: NOW,
    });
    expect(picks.map((p: { number: number }) => p.number)).toEqual([3, 1]);
    expect(picks[0].siteFronted).toBe('m4');
  });
});

describe('event dispatch only trusts the news desk and repo insiders', () => {
  const mk = (number: number, author: string, authorAssociation: string | null, title = 'intake: Taylor Swift announces a new single') => ({ number, title, createdAt: ago(2), labels: ['intake'], author, authorAssociation });

  it('trusts claude[bot] (the news desk), OWNER, MEMBER and COLLABORATOR — and nobody else', () => {
    expect(isTrustedAuthor(mk(1, 'claude[bot]', 'CONTRIBUTOR'))).toBe(true);
    for (const a of ['OWNER', 'MEMBER', 'COLLABORATOR']) expect(isTrustedAuthor(mk(1, 'someone', a))).toBe(true);
    for (const a of ['NONE', 'FIRST_TIME_CONTRIBUTOR', 'CONTRIBUTOR', 'FIRST_TIMER', null]) expect(isTrustedAuthor(mk(1, 'stranger', a))).toBe(false);
    expect(isTrustedAuthor(mk(1, 'claude', 'NONE'))).toBe(false); // a user merely named like the bot
  });

  it('ignores a stranger-authored intake: issue and it does not consume the daily cap', () => {
    const issues = [mk(1, 'stranger1', 'NONE'), mk(2, 'stranger2', 'FIRST_TIME_CONTRIBUTOR'), mk(3, 'claude[bot]', 'CONTRIBUTOR', "intake: 'Cleveland!' lyric video drops"), mk(4, 'sffan15-sys', 'MEMBER', 'intake: Taylor Swift wins another award')];
    const { picks, skipped } = pickEvents({ issues, socialItems: [], nowMs: NOW });
    expect(picks.map((p: { number: number }) => p.number).sort()).toEqual([3, 4]);
    expect(skipped.filter((x: { why: string }) => /not the news desk/.test(x.why)).map((x: { number: number }) => x.number)).toEqual([1, 2]);
    expect(pickEvents({ issues: issues.slice(0, 2), socialItems: [], nowMs: NOW, dispatchedToday: 0 }).picks).toEqual([]);
  });

  it('reads a REST issue row, dropping pull requests', () => {
    const row = { number: 9, title: 'intake: x', created_at: ago(1), labels: [{ name: 'intake' }], user: { login: 'claude[bot]' }, author_association: 'CONTRIBUTOR' };
    expect(fromRestIssue(row)).toEqual({ number: 9, title: 'intake: x', createdAt: row.created_at, labels: ['intake'], author: 'claude[bot]', authorAssociation: 'CONTRIBUTOR' });
    expect(fromRestIssue({ ...row, pull_request: {} })).toBeNull();
  });
});

describe('dispatchPicks', () => {
  const picks = [{ number: 1, title: 'a' }, { number: 2, title: 'b' }, { number: 3, title: 'c' }];

  it('one failed rollback does not abort the remaining picks', () => {
    const calls: string[] = [];
    const run = (args: string[]) => {
      calls.push(args.join(' '));
      if (args[0] === 'workflow' && args.includes('issue=1')) throw new Error('dispatch 502');
      if (args.includes('--remove-label')) throw new Error('rollback 500');
      return '';
    };
    const log: string[] = [];
    expect(() => dispatchPicks(run, picks, { log: (m: string) => log.push(m) })).not.toThrow();
    expect(calls.filter((c) => c.startsWith('workflow run'))).toHaveLength(3); // 2 and 3 still dispatched
    expect(log.some((m) => /#1 failed.*label could not be removed.*remaining picks continue/.test(m))).toBe(true);
  });

  it('a dry run touches nothing', () => {
    const calls: string[][] = [];
    dispatchPicks((a: string[]) => { calls.push(a); return ''; }, picks, { dryRun: true, log: () => {} });
    expect(calls).toEqual([]);
  });
});

describe('failure receipt', () => {
  const usage = { numTurns: 51, maxTurns: 50, totalCostUsd: 8.548, diagnostic: { isError: true, resultSubtype: 'error_max_turns' } };

  it('names a turn-cap death with its numbers', () => {
    expect(causeOf(usage)).toBe('hit its turn cap (51/50 turns, $8.55 list-price) before opening a PR');
    expect(causeOf(null)).toMatch(/failed before telemetry/);
  });

  it('says what the pre-compute had decided, so a re-run is understood without opening the log', () => {
    const inputs = {
      backlog: { heldItems: 2, skipAt: 8, skipCalendarDrafting: false }, photos: { neverUsed: 10, library: 54 }, events: { uncovered: [{}] },
      beats: [{ date: '2026-10-01', text: 'x', needsDraft: true, photo: { photoId: 'p1' } }, { date: '2026-10-02', text: null }],
    };
    const body = buildReceipt({ kind: 'daily', result: 'failure', runUrl: 'https://example.com/run', day: '2026-10-01', inputs, usage });
    expect(body).toContain('did not finish — 2026-10-01');
    expect(body).toContain('turn cap (51/50');
    expect(body).toContain('2026-10-01: needed a pair (pre-picked photo `p1`)');
    expect(body).toContain('2026-10-02: no calendar entry');
    expect(body).toContain('never-used photos 10/54');
    expect(body).toMatch(/Tier-2: Tree — daily social draft$/);
    expect(buildReceipt({ kind: 'event', result: 'failure', day: 'd', inputs: null, usage: null })).toMatch(/Tier-2: Tree — event draft$/);
  });
});
