import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  matchAlertTitle,
  deriveHandledState,
  renderHandledMarker,
  renderFbGroupLines,
  renderFbHumanAction,
  DEFAULT_TRUSTED_AUTHOR,
} from './alert-router.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FB_GROUPS_CHECKLIST } from '../../knowledge/fb-groups-checklist.mjs';

const CLI_PATH = fileURLToPath(new URL('./alert-router.mjs', import.meta.url));

function runStateCli(args: string[], stdinComments: unknown[], env: Record<string, string> = {}) {
  // Explicitly clear any ambient MARJORIE_OPS_AUTHOR first — these tests
  // assert on the CLI's own precedence logic, not on whatever happens to
  // be set in the shell running the suite.
  const cleanEnv = { ...process.env };
  delete cleanEnv.MARJORIE_OPS_AUTHOR;
  return execFileSync('node', [CLI_PATH, 'state', ...args], {
    input: JSON.stringify(stdinComments),
    encoding: 'utf8',
    env: { ...cleanEnv, ...env },
  }).trim();
}

describe('matchAlertTitle', () => {
  const cases: Array<[string, string]> = [
    ["Watchdog: no Founders' Brief", 'no-founders-brief'],
    ['Watchdog: prod smoke check failing', 'prod-smoke-check-failing'],
    ['Watchdog: scheduled workflow(s) not succeeding', 'scheduled-workflows-not-succeeding'],
    ['Watchdog: routine-karen-nightly.yml failed its last 2 scheduled runs', 'workflow-failed-last-2-runs'],
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
  const trusted = (body: string) => ({ author: DEFAULT_TRUSTED_AUTHOR, body });

  it('is unhandled for a fresh alert with no ledger comment', () => {
    expect(deriveHandledState([])).toBe('unhandled');
    expect(deriveHandledState([trusted('just a regular comment, no marker')])).toBe('unhandled');
  });

  it('is handled-awaiting-watchdog when a marker dated today is present', () => {
    const marker = renderHandledMarker({ action: 'redispatch', date: '2026-09-12' });
    expect(deriveHandledState([trusted(marker)], { today: '2026-09-12' })).toBe('handled-awaiting-watchdog');
  });

  it('is escalated for an escalate marker from any past date', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2026-08-01' });
    expect(deriveHandledState([trusted(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('is escalated (permanent) for a human-action marker from a past date, not just today', () => {
    const marker = renderHandledMarker({ action: 'human-action', date: '2026-08-01' });
    expect(deriveHandledState([trusted(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('is escalated (permanent) for a build-desk-issue marker from a past date', () => {
    const marker = renderHandledMarker({ action: 'build-desk-issue', date: '2026-08-01' });
    expect(deriveHandledState([trusted(marker)], { today: '2026-09-12' })).toBe('escalated');
  });

  it('reverts to unhandled the day after a non-escalate marker', () => {
    const marker = renderHandledMarker({ action: 'comment-only', date: '2026-09-11' });
    expect(deriveHandledState([trusted(marker)], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('throws on an unknown action', () => {
    expect(() => renderHandledMarker({ action: 'nonsense' })).toThrow();
  });

  it('ignores a forged marker from an untrusted commenter', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2099-99-99' });
    expect(deriveHandledState([{ author: 'random-commenter', body: marker }], { today: '2026-09-12' })).toBe(
      'unhandled',
    );
  });

  it('honors the same marker when posted by the trusted author', () => {
    const marker = renderHandledMarker({ action: 'redispatch', date: '2026-09-12' });
    expect(
      deriveHandledState([{ author: DEFAULT_TRUSTED_AUTHOR, body: marker }], { today: '2026-09-12' }),
    ).toBe('handled-awaiting-watchdog');
  });

  it('honors a custom trustedAuthor override', () => {
    const marker = renderHandledMarker({ action: 'redispatch', date: '2026-09-12' });
    expect(
      deriveHandledState([{ author: 'some-other-bot', body: marker }], {
        today: '2026-09-12',
        trustedAuthor: 'some-other-bot',
      }),
    ).toBe('handled-awaiting-watchdog');
  });

  it('ignores an unrecognized action value even from the trusted author, dated today', () => {
    const forged = '<!-- marjorie-ops-handled date=2026-09-12 action=nonsense-action -->';
    expect(deriveHandledState([trusted(forged)], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('ignores a marker hidden inside a code fence from an untrusted author', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2026-08-01' });
    const body = ['```', marker, '```'].join('\n');
    expect(deriveHandledState([{ author: 'random-commenter', body }], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('does not truncation-match a malformed action as a valid prefix (Codex round-2, PR #4216)', () => {
    const variants = [
      '<!-- marjorie-ops-handled date=2026-09-12 action=escalate123 -->',
      '<!-- marjorie-ops-handled date=2026-09-12 action=escalate_fake -->',
      '<!-- marjorie-ops-handled date=2026-09-12 action=human-action/invalid -->',
    ];
    for (const body of variants) {
      expect(deriveHandledState([trusted(body)], { today: '2026-09-12' })).toBe('unhandled');
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
  return `## #${number} 🟡 [DECIDE] Save this week's Facebook group pages and upload them (~30 min)
<!-- ha filed=${date} -->

**Why:** The fan-signal engine reads what Swifties are actually saying in six
Facebook groups. Facebook has no API for groups you don't run and forbids
automated collection, so this is the one step a person has to do. Nothing has
been exported yet — the watchdog has been flagging it since 2026-09-07
(issue #4009) and two weekly reminders are open (#3911, #3536). Until one
export lands, nobody knows whether the parser works.
**Steps:**
1. In a normal logged-in browser (never a bot), open each group below in turn.
   All six were found by desk research and **nobody has confirmed you are a
   member** — if you are not in one, skip it and say which in your reply:
   - Taylor Swift's Vault → \`taylor-swifts-vault\`
   - Friendship Bracelet Making and Trading → \`friendship-bracelet-making-trading\`
   - Swiftie Super Worldwide Friendship Bracelet Trade → \`swiftie-super-worldwide-bracelet-trade\`
   - Kulto ni TAYLOR SWIFT → \`kulto-ni-taylor-swift\`
   - Taylor Swift Swifties → \`taylor-swift-swifties\`
   - Friendship Bracelets Buy/Sell/Trade → \`friendship-bracelets-buy-sell-trade\`
2. In the group, sort posts by **New activity** (not Top).
3. Scroll down until the posts you can see are older than 7 days. Click
   "See more" on any long post so its full text is on screen. Do not open
   comment threads one by one.
4. Press \`Ctrl+S\` (Windows) or \`Cmd+S\` (Mac). In the save dialog choose
   **"Webpage, Complete"**. Name the file exactly
   \`fb-<slug>-<YYYY-MM-DD>.html\` using the slug from step 1 and today's date —
   for example \`fb-taylor-swifts-vault-2026-09-14.html\`. Save to Downloads.
5. Repeat steps 2-4 for each group you are a member of.
6. Open a terminal in the project folder and run, exactly:
   \`npm run knowledge:fb-upload -- ~/Downloads/fb-*.html\`
   It prints one line per file. Each says either \`uploaded, local copy
   deleted\` or gives a reason and \`local copy KEPT\`. A kept file was not
   uploaded — re-run that one file by name.
7. Close the open reminder issues #3911 and #3536.
**Worked if:** step 6 ends with \`knowledge:fb-upload: N/N uploaded\` where N is
the number of groups you saved, and no line says \`local copy KEPT\`.`;
}

// Subprocess tests against the real CLI (Codex round-2 review of PR #4224:
// the trusted-author precedence logic in main() was previously covered
// only indirectly, through deriveHandledState's own options — this exercises
// the actual `node alert-router.mjs state [trustedAuthor]` dispatch, since
// that's the only interface the routine's Bash-only tool set can reach.
function markerComment(author: string) {
  // `escalate` is permanent (no `today` dependency) so this test doesn't
  // need to inject or match the real America/Los_Angeles calendar date.
  return { author, body: renderHandledMarker({ action: 'escalate', date: '2020-01-01' }) };
}

describe('state CLI trusted-author precedence', () => {
  it('a CLI argument is honored', () => {
    expect(runStateCli(['right-author'], [markerComment('right-author')])).toBe('escalated');
  });

  it('falls back to MARJORIE_OPS_AUTHOR when no CLI argument is given', () => {
    expect(runStateCli([], [markerComment('env-author')], { MARJORIE_OPS_AUTHOR: 'env-author' })).toBe('escalated');
  });

  it('a CLI argument wins over a stale MARJORIE_OPS_AUTHOR env var', () => {
    expect(runStateCli(['right-author'], [markerComment('right-author')], { MARJORIE_OPS_AUTHOR: 'wrong-author' })).toBe('escalated');
  });

  it('falls back to DEFAULT_TRUSTED_AUTHOR when neither is given', () => {
    expect(runStateCli([], [markerComment(DEFAULT_TRUSTED_AUTHOR)])).toBe('escalated');
  });

  it('still rejects a marker from an untrusted author even with a CLI argument set', () => {
    expect(runStateCli(['right-author'], [markerComment('someone-else')])).toBe('unhandled');
  });
});
