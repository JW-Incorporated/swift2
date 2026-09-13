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
    expect(deriveHandledState([own(marker)], { today: '2026-09-12' })).toBe('handled-awaiting-watchdog');
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
    expect(deriveHandledState([{ viewerDidAuthor: false, body: marker }], { today: '2026-09-12' })).toBe(
      'unhandled',
    );
  });

  it('ignores a marker whose viewerDidAuthor is missing entirely, not just false', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2099-99-99' });
    expect(deriveHandledState([{ body: marker }], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('ignores an unrecognized action value even on the routine\'s own comment, dated today', () => {
    const forged = '<!-- marjorie-ops-handled date=2026-09-12 action=nonsense-action -->';
    expect(deriveHandledState([own(forged)], { today: '2026-09-12' })).toBe('unhandled');
  });

  it('ignores a marker hidden inside a code fence on a comment the routine did not post', () => {
    const marker = renderHandledMarker({ action: 'escalate', date: '2026-08-01' });
    const body = ['```', marker, '```'].join('\n');
    expect(deriveHandledState([{ viewerDidAuthor: false, body }], { today: '2026-09-12' })).toBe('unhandled');
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
});
