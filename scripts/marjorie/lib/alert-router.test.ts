import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  matchAlertTitle,
  deriveHandledState,
  renderHandledMarker,
  renderFbGroupLines,
  renderFbHumanAction,
} from './alert-router.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FB_GROUPS_CHECKLIST } from '../../knowledge/fb-groups-checklist.mjs';

const CLI_PATH = fileURLToPath(new URL('./alert-router.mjs', import.meta.url));

function runStateCli(stdinComments: unknown[]) {
  return execFileSync('node', [CLI_PATH, 'state'], {
    input: JSON.stringify(stdinComments),
    encoding: 'utf8',
  }).trim();
}

describe('matchAlertTitle', () => {
  const cases: Array<[string, string]> = [
    ["Watchdog: no Founders' Brief", 'no-founders-brief'],
    ['Watchdog: prod smoke check failing', 'prod-smoke-check-failing'],
    ['Watchdog: scheduled workflow(s) not succeeding', 'scheduled-workflows-not-succeeding'],
    [
      'Watchdog: routine-karen-nightly.yml failed its last 2 scheduled runs',
      'workflow-failed-last-2-runs',
    ],
    ['Watchdog: PR(s) stuck on a failing or missing check', 'prs-stuck'],
    ['Watchdog: Karen scanned but filed no tickets', 'karen-no-tickets'],
    ['Watchdog: routine-vault-run scheduled cadence', 'vault-run-cadence'],
    ['Watchdog: an OPEN [BLOCKING] human action is aging silently', 'blocking-human-action-aging'],
    ['Watchdog: work is going unowned', 'work-unowned'],
    ['Watchdog: Karen post-repair still unconfirmed', 'karen-post-repair-removed'],
    ['Watchdog: news-worker rotated key looks broken', 'news-worker-rotation-removed'],
    ["Watchdog: vault/ hasn't produced a PR in 36h", 'lane-quiet'],
    ['Watchdog: no FB group export closed in 9 days', 'fb-export-due'],
    ['Watchdog: knowledge engine current-tier data is stale', 'knowledge-stale'],
  ];

  it.each(cases)('matches %s -> %s', (title, key) => {
    expect(matchAlertTitle(title)).toBe(key);
  });

  it('returns null for a title that matches none of the 14 rows', () => {
    expect(matchAlertTitle('Mobile parity: iOS and Android have diverged')).toBeNull();
  });
});

describe('deriveHandledState', () => {
  // 2026-09-13, third iteration: `viewerDidAuthor` (a GitHub GraphQL
  // boolean — "did the credential running this query post this comment")
  // replaces every earlier identity-string comparison (a hardcoded guess,
  // then a live-queried guess, then a guess-plus-suffix-normalization —
  // all three broke on a real run in one way or another; see the module's
  // own header comment for the full history).
  const own = (body: string) => ({ viewerDidAuthor: true, body });

  it('is unhandled for a fresh alert with no ledger comment', () => {
    expect(deriveHandledState([])).toBe('unhandled');
    expect(deriveHandledState([own('just a regular comment, no marker')])).toBe('unhandled');
  });

  it('is handled-awaiting-watchdog when a marker dated today is present', () => {
    const marker = renderHandledMarker({ action: 'redispatch', date: '2026-09-12' });
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe(
      'handled-awaiting-watchdog',
    );
  });

  it('is escalated for an escalate marker from any past date', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2026-08-01' });
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('is escalated (permanent) for a human-action marker from a past date, not just today', () => {
    const marker = renderHandledMarker({ action: 'human-action', date: '2026-08-01' });
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('is escalated (permanent) for a build-desk-issue marker from a past date', () => {
    const marker = renderHandledMarker({ action: 'build-desk-issue', date: '2026-08-01' });
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('reverts to unhandled the day after a non-escalate marker', () => {
    const marker = renderHandledMarker({ action: 'comment-only', date: '2026-09-11' });
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('throws on an unknown action', () => {
    expect(() => renderHandledMarker({ action: 'nonsense' })).toThrow();
  });

  it('ignores a forged marker from a comment the routine did not post', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2099-99-99' });
    expect(
      deriveHandledState([{ viewerDidAuthor: false, body: marker }], { today: '2026-09-12' }),
    ).toBe('unhandled');
  });

  it('ignores a marker whose viewerDidAuthor is missing entirely, not just false', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2099-99-99' });
    expect(deriveHandledState([{ body: marker }], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('requires viewerDidAuthor strictly === true, not merely truthy (Codex round-3, PR #4225)', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2099-99-99' });
    for (const truthyNonBoolean of [1, 'true', {}, []]) {
      expect(
        deriveHandledState([{ viewerDidAuthor: truthyNonBoolean, body: marker }], {
          today: '2026-09-12',
        }),
      ).toBe('unhandled');
    }
  });

  it("ignores an unrecognized action value even on the routine's own comment, dated today", () => {
    const forged = '<!-- marjorie-ops-handled date=2026-09-12 action=nonsense-action -->';
    expect(deriveHandledState([own(forged)], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('ignores a marker hidden inside a code fence on a comment the routine did not post', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2026-08-01' });
    const body = ['```', marker, '```'].join('\n');
    expect(deriveHandledState([{ viewerDidAuthor: false, body }], { today: '2026-09-12' })).toBe(
      'unhandled',
    );
  });

  it('does not truncation-match a malformed action as a valid prefix (Codex round-2, PR #4216)', () => {
    const variants = [
      '<!-- marjorie-ops-handled date=2026-09-12 action=escalate123 -->',
      '<!-- marjorie-ops-handled date=2026-09-12 action=escalate_fake -->',
      '<!-- marjorie-ops-handled date=2026-09-12 action=human-action/invalid -->',
    ];
    for (const body of variants) {
      expect(deriveHandledState([own(body)], { today: '2026-09-12' })).toBe('unhandled');
    }
  });
});

describe('renderFbHumanAction', () => {
  it('byte-matches the spec text, modulo #NN and the filed date', () => {
    const rendered = renderFbHumanAction({ number: 69, date: '2026-09-12' });
    expect(rendered).toBe(EXPECTED('69', '2026-09-12'));
  });

  it('regenerates the group list from the live checklist, not a hard-coded copy', () => {
    const lines = renderFbGroupLines(FB_GROUPS_CHECKLIST);
    expect(lines.split('\n')).toHaveLength(FB_GROUPS_CHECKLIST.length);
    expect(lines).toContain("- Taylor Swift's Vault → `taylor-swifts-vault`");
  });
});

function EXPECTED(number: string, date: string): string {
  return `## #${number} 🔴 [BLOCKING] Run or repair this week's automated Facebook export (~10 min)
<!-- ha filed=${date} -->

**Why:** The deterministic local Facebook collector did not close this week's
reminder issue within nine days. It runs from Joey's personal account under the
2026-09-30 owner decision, so only Joey's logged-in Windows session can inspect
a stopped task, checkpoint, 2FA prompt, CAPTCHA, or expired DPAPI credential.
**Steps:**
1. In the project folder, run \`npm run knowledge:fb-export\`.
2. If the visible browser stops at a checkpoint, 2FA prompt, or CAPTCHA,
   complete it yourself and rerun the command. If the credential is missing or
   expired, recreate it with HUMAN-ACTIONS #88's exact DPAPI commands.
3. If it prints a selector-repair prompt or another failure, paste that status
   into the project chat; never attach or paste the credential file.
**Worked if:** the current \`FB group export due — week of ...\` issue closes
with uploaded/not-member counts and no group says \`failed\`.`;
}

// Subprocess test against the real CLI — confirms `main()`'s `state`
// dispatch actually plumbs `viewerDidAuthor` through to `deriveHandledState`
// unchanged, since that's the only interface the routine's Bash-only tool
// set can reach (it can't `import` this module directly).
describe('state CLI', () => {
  it('honors a marker on a comment the routine posted', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2020-01-01' });
    expect(runStateCli([{ viewerDidAuthor: true, body: marker }])).toBe('escalated');
  });

  it('ignores a marker on a comment the routine did not post', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2020-01-01' });
    expect(runStateCli([{ viewerDidAuthor: false, body: marker }])).toBe('unhandled');
  });

  // #4226: a failed upstream `gh issue view` pipes nothing; that must not read
  // as a fresh, ledger-less alert.
  function runRaw(input: string, args: string[] = []) {
    return spawnSync('node', [CLI_PATH, 'state', ...args], { input, encoding: 'utf8' });
  }

  it('treats empty stdin as a failed lookup (exit 3, logged), not unhandled', () => {
    for (const input of ['', '  \n']) {
      const r = runRaw(input);
      expect(r.status).toBe(3);
      expect(r.stdout.trim()).toBe('');
      expect(r.stderr).toContain('lookup failed');
    }
  });

  it('treats non-JSON or non-array stdin as a failed lookup', () => {
    for (const input of ['gh: HTTP 502', '{"message":"Not Found"}', 'null']) {
      expect(runRaw(input).status).toBe(3);
    }
  });

  it('still reads a genuine zero-comment issue ([]) as unhandled', () => {
    const r = runRaw('[]');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('unhandled');
  });

  it('exits 2 with usage when --targets has no value or an empty value', () => {
    for (const args of [['--targets'], ['--targets', ''], ['--targets', ',']]) {
      const r = runRaw('[]', args);
      expect(r.status).toBe(2);
      expect(r.stderr).toContain('--targets');
      expect(r.stdout.trim()).toBe('');
    }
    const m = spawnSync('node', [CLI_PATH, 'marker', 'escalate', '--targets'], {
      encoding: 'utf8',
    });
    expect(m.status).toBe(2);
  });

  it('passes --targets through to deriveHandledState', () => {
    const marker = renderHandledMarker({
      action: 'escalate',
      date: '2020-01-01',
      targets: ['a.yml'],
    });
    const input = JSON.stringify([{ viewerDidAuthor: true, body: marker }]);
    expect(runRaw(input, ['--targets', 'a.yml']).stdout.trim()).toBe('escalated');
    expect(runRaw(input, ['--targets', 'a.yml,b.yml']).stdout.trim()).toBe('unhandled');
  });
});

// #4219: a handled marker covers only the aggregate-alert targets it names.
describe('per-target handled markers', () => {
  const own = (body: string) => ({ viewerDidAuthor: true, body });
  const today = '2026-09-12';

  it('renders a sorted, deduped targets suffix and round-trips it', () => {
    const marker = renderHandledMarker({
      action: 'escalate',
      date: today,
      targets: ['b.yml', 'a.yml', 'a.yml'],
    });
    expect(marker).toBe(
      '<!-- marjorie-ops-handled date=2026-09-12 action=escalate targets=a.yml,b.yml -->',
    );
    expect(deriveHandledState([own(marker)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'escalated',
    );
  });

  it('rejects a target that would break out of the marker', () => {
    expect(() => renderHandledMarker({ action: 'escalate', targets: ['a b'] })).toThrow();
    expect(() => renderHandledMarker({ action: 'escalate', targets: ['a-->'] })).toThrow();
  });

  it('does not let a permanent marker suppress a newly added target', () => {
    const marker = renderHandledMarker({
      action: 'escalate',
      date: '2026-08-01',
      targets: ['a.yml'],
    });
    expect(deriveHandledState([own(marker)], { today, targets: ['a.yml'] })).toBe('escalated');
    expect(deriveHandledState([own(marker)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'unhandled',
    );
  });

  it('unions coverage across several markers', () => {
    const a = renderHandledMarker({
      action: 'human-action',
      date: '2026-08-01',
      targets: ['a.yml'],
    });
    const b = renderHandledMarker({ action: 'escalate', date: '2026-09-01', targets: ['b.yml'] });
    expect(deriveHandledState([own(a), own(b)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'escalated',
    );
  });

  it('scopes a same-day redispatch marker to its targets too', () => {
    const marker = renderHandledMarker({ action: 'redispatch', date: today, targets: ['a.yml'] });
    expect(deriveHandledState([own(marker)], { today, targets: ['a.yml'] })).toBe(
      'handled-awaiting-watchdog',
    );
    expect(deriveHandledState([own(marker)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'unhandled',
    );
  });

  it('grandfathers a legacy permanent marker: it covers a new target too', () => {
    const legacy = renderHandledMarker({ action: 'human-action', date: '2026-08-01' });
    expect(deriveHandledState([own(legacy)], { today })).toBe('escalated');
    expect(deriveHandledState([own(legacy)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'escalated',
    );
  });

  it('grandfathers a legacy same-day marker, then it expires tomorrow', () => {
    const legacy = renderHandledMarker({ action: 'comment-only', date: today });
    expect(deriveHandledState([own(legacy)], { today, targets: ['a.yml', 'b.yml'] })).toBe(
      'handled-awaiting-watchdog',
    );
    expect(deriveHandledState([own(legacy)], { today: '2026-09-13', targets: ['a.yml'] })).toBe(
      'unhandled',
    );
  });

  it('targeted markers still catch a new target alongside no legacy marker', () => {
    const t = renderHandledMarker({ action: 'escalate', date: '2026-08-01', targets: ['a.yml'] });
    const sameDay = renderHandledMarker({
      action: 'comment-only',
      date: today,
      targets: ['b.yml'],
    });
    expect(deriveHandledState([own(t), own(sameDay)], { today, targets: ['a.yml', 'c.yml'] })).toBe(
      'unhandled',
    );
  });

  it('ignores a forged targeted marker from a comment the routine did not post', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: today, targets: ['a.yml'] });
    expect(
      deriveHandledState([{ viewerDidAuthor: false, body: marker }], { today, targets: ['a.yml'] }),
    ).toBe('unhandled');
  });
});
