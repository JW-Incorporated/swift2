import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  HANDLER_CLASS,
  BACKSTOP_AFTER_MS,
  handlerClass,
  isFounderFacing,
  backstopState,
  notifyStamp,
  renderSuppressedComment,
  renderBackstopComment,
} from './alert-notify.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { matchAlertTitle } from './alert-router.mjs';

const CLI_PATH = fileURLToPath(new URL('./alert-notify.mjs', import.meta.url));

function mine(body: string) {
  return { viewerDidAuthor: true, body };
}

describe('isFounderFacing', () => {
  // One case per watchdog condition, keyed by its live ALERT_TITLE in
  // .github/workflows/watchdog.yml.
  const FOUNDER_FACING: string[] = [
    // Paging: site down (and a human action, always, immediately).
    'Watchdog: prod smoke check failing',
    // Paging: site down. Not in the handler table at all — unknown titles
    // default founder-facing, and this is also the one caller that passes
    // ALERT_MENTION_FOUNDER=1.
    'Watchdog: Vercel production deploy failed',
    // `human-action`: key rotation is founder-only.
    'Watchdog: news-worker rotated key looks broken',
    // `human-action`: Facebook has no API, so the export is always a person's job.
    'Watchdog: no FB group export closed in 9 days',
  ];

  const SELF_HANDLED: string[] = [
    "Watchdog: no Founders' Brief",
    'Watchdog: scheduled workflow(s) not succeeding',
    'Watchdog: routine-karen-nightly.yml failed its last 2 scheduled runs',
    'Watchdog: PR(s) stuck on a failing or missing check',
    'Watchdog: Karen scanned but filed no tickets',
    'Watchdog: routine-vault-run scheduled cadence',
    'Watchdog: an OPEN [BLOCKING] human action is aging silently',
    'Watchdog: work is going unowned',
    'Watchdog: Karen post-repair still unconfirmed',
    "Watchdog: content hasn't produced a PR in 48h",
    'Watchdog: knowledge engine current-tier data is stale',
  ];

  it.each(FOUNDER_FACING)('%s reaches the founders channel', (title) => {
    expect(isFounderFacing(title)).toBe(true);
  });

  it.each(SELF_HANDLED)('%s holds its line', (title) => {
    expect(isFounderFacing(title)).toBe(false);
  });

  it('keeps the aging-human-action alert quiet despite its subject', () => {
    // The handler table says "Posts: nothing" for this row — the brief's
    // "Waiting on you" already lists it daily. A title-keyword rule would
    // get this wrong; the handler class gets it right.
    const title = 'Watchdog: an OPEN [BLOCKING] human action is aging silently';
    expect(handlerClass(title)).toBe('comment-only');
    expect(isFounderFacing(title)).toBe(false);
  });

  it('defaults an unknown title to founder-facing', () => {
    expect(matchAlertTitle('Watchdog: something nobody has mapped yet')).toBeNull();
    expect(handlerClass('Watchdog: something nobody has mapped yet')).toBeNull();
    expect(isFounderFacing('Watchdog: something nobody has mapped yet')).toBe(true);
  });

  it('leaves the non-watchdog callers of upsert-alert.sh loud', () => {
    // mobile-parity.yml, social-poster.yml, production-backup.yml and
    // chat-alarm.mjs share this script; none of their titles is a watchdog
    // condition, so none of them may be quietened by this change.
    for (const title of [
      'Watchdog: a social post permanently failed',
      'Watchdog: mobile parity diverged',
      'Watchdog: production backup failed',
      'Doorbell is not answering',
      '',
    ]) {
      expect(isFounderFacing(title)).toBe(true);
    }
  });

  it.each([
    'Watchdog: the site is down',
    'Watchdog: production outage on the reader',
    'Watchdog: legal exposure in a published post',
    'Watchdog: safety incident reported by a fan',
    'Watchdog: security breach in the worker',
    'Watchdog: runaway cost on the knowledge worker',
    'Watchdog: Anthropic spend exceeded budget',
  ])('pages for the paging condition in %s', (title) => {
    expect(isFounderFacing(title)).toBe(true);
  });

  it('classifies every handler key alert-router can return', () => {
    // A new row in alert-router.mjs with no class here would silently fall
    // through to founder-facing; this keeps the two files in step.
    const keys = [
      'no-founders-brief',
      'prod-smoke-check-failing',
      'scheduled-workflows-not-succeeding',
      'prs-stuck',
      'karen-no-tickets',
      'vault-run-cadence',
      'blocking-human-action-aging',
      'work-unowned',
      'karen-post-repair-removed',
      'news-worker-rotation-removed',
      'fb-export-due',
      'knowledge-stale',
      'workflow-failed-last-2-runs',
      'lane-quiet',
    ];
    for (const key of keys) expect(HANDLER_CLASS.get(key)).toBeTruthy();
    expect(HANDLER_CLASS.size).toBe(keys.length);
  });
});

describe('backstopState', () => {
  const held = '2026-10-09T12:00:00Z';
  const suppressed = mine(
    renderSuppressedComment({ title: 'Watchdog: work is going unowned', at: new Date(held) }),
  );

  it('is none when no line was ever held', () => {
    expect(backstopState([mine('just a normal watchdog comment')])).toBe('none');
    expect(backstopState([])).toBe('none');
  });

  it('waits until 24h have passed', () => {
    const now = new Date(Date.parse(held) + BACKSTOP_AFTER_MS - 1000);
    expect(backstopState([suppressed], { now })).toBe('waiting');
  });

  it('is pending exactly at 24h', () => {
    const now = new Date(Date.parse(held) + BACKSTOP_AFTER_MS);
    expect(backstopState([suppressed], { now })).toBe('pending');
  });

  it('fires once, then is done forever', () => {
    const now = new Date(Date.parse(held) + 5 * BACKSTOP_AFTER_MS);
    expect(backstopState([suppressed], { now })).toBe('pending');
    const afterPost = [suppressed, mine(renderBackstopComment({ at: now }))];
    expect(backstopState(afterPost, { now })).toBe('done');
    // And still done an hour later, which is what stops the hourly re-post.
    expect(backstopState(afterPost, { now: new Date(now.getTime() + 60 * 60 * 1000) })).toBe(
      'done',
    );
  });

  it('measures from the earliest hold so a flapping alert cannot reset its clock', () => {
    const later = new Date(Date.parse(held) + 20 * 60 * 60 * 1000);
    const comments = [
      mine(renderSuppressedComment({ title: 'Watchdog: work is going unowned', at: later })),
      suppressed,
    ];
    const now = new Date(Date.parse(held) + BACKSTOP_AFTER_MS + 1000);
    expect(backstopState(comments, { now })).toBe('pending');
  });

  it('ignores a marker the querying credential did not author', () => {
    const forged = { viewerDidAuthor: false, body: `<!-- watchdog-notify backstop=${held} -->` };
    const now = new Date(Date.parse(held) + BACKSTOP_AFTER_MS);
    expect(backstopState([suppressed, forged], { now })).toBe('pending');
    expect(backstopState([forged], { now })).toBe('none');
  });

  it('ignores a malformed stamp rather than treating it as now', () => {
    expect(backstopState([mine('<!-- watchdog-notify suppressed=2026-10-09 -->')])).toBe('none');
    expect(backstopState([mine('<!-- watchdog-notify suppressed=yesterday -->')])).toBe('none');
    // A trailing-content marker must not truncation-match a valid one.
    expect(
      backstopState([mine(`<!-- watchdog-notify backstop=${held} oops -->`)], {
        now: new Date(held),
      }),
    ).toBe('none');
  });
});

describe('rendered comments', () => {
  it('names the handler class and reads as text in the UI', () => {
    const body = renderSuppressedComment({
      title: 'Watchdog: scheduled workflow(s) not succeeding',
      at: new Date('2026-10-09T12:00:00Z'),
    });
    expect(body).toContain('`redispatch`');
    expect(body.split('\n')[0]).toMatch(/^🔇 /);
    expect(body).toContain('<!-- watchdog-notify suppressed=2026-10-09T12:00:00Z -->');
    expect(backstopState([mine(body)], { now: new Date('2026-10-10T12:00:00Z') })).toBe('pending');
  });

  it('stamps at seconds precision, the only form the marker accepts', () => {
    expect(notifyStamp(new Date('2026-10-09T12:00:00.123Z'))).toBe('2026-10-09T12:00:00Z');
  });
});

describe('wiring', () => {
  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
  const read = (rel: string) => readFileSync(`${repoRoot}/${rel}`, 'utf8');

  it('gates upsert-alert.sh’s open path on this module and fails open', () => {
    const sh = read('scripts/watchdog/upsert-alert.sh');
    expect(sh).toContain(
      'FACING=$(node scripts/marjorie/lib/alert-notify.mjs founder-facing "$TITLE" || echo founder-facing)',
    );
    // Only `open` is gated -- a `close` is a recovery notice and still posts.
    expect(sh).toContain('if [ "$NOTIFY" = "1" ] && [ "$ACTION" = "open" ]; then');
    expect(sh).toContain('suppressed-comment "$TITLE"');
  });

  it('runs the 24h backstop hourly in watchdog.yml', () => {
    const yml = read('.github/workflows/watchdog.yml');
    const step = yml.slice(yml.indexOf('Held alert still open 24h'));
    expect(step).toContain('if: always()');
    expect(step).toContain('alert-notify.mjs backstop-state');
    expect(step).toContain('alert-notify.mjs backstop-comment');
    expect(step).toContain('--mention-founder');
  });

  it('decides every ALERT_TITLE watchdog.yml can actually emit', () => {
    const yml = read('.github/workflows/watchdog.yml');
    const titles = [...yml.matchAll(/ALERT_TITLE="([^"]+)"/g)].map(([, t]) =>
      // The two dynamic rows interpolate a workflow/lane name and a window.
      t
        .replace('${WF}', 'routine-karen-nightly.yml')
        .replace('${LANE}', 'content')
        .replace('${WINDOW}', '48'),
    );
    // 13 since 2026-10-09: the brief-missing alert ("no Founders' Brief") was retired with the brief; its title only closes now.
    expect(titles.length).toBeGreaterThanOrEqual(13);
    const loud = titles.filter((t) => isFounderFacing(t));
    expect(loud.sort()).toEqual(
      [
        // Paging: site down, twice over.
        'Watchdog: prod smoke check failing',
        'Watchdog: Vercel production deploy failed',
        // `human-action`: Facebook has no API for groups you do not run.
        'Watchdog: no FB group export closed in 9 days',
        // Not in the handler table -- it predates no row and gets the
        // unknown-title default. Loud on purpose until someone classifies it.
        'Watchdog: news-worker knowledge-extract degraded for 24h',
      ].sort(),
    );
  });
});

describe('CLI', () => {
  function run(args: string[], input?: string) {
    return execFileSync('node', [CLI_PATH, ...args], { input, encoding: 'utf8' }).trim();
  }

  it('answers founder-facing for the shell gate', () => {
    expect(run(['founder-facing', 'Watchdog: prod smoke check failing'])).toBe('founder-facing');
    expect(run(['founder-facing', 'Watchdog: work is going unowned'])).toBe('self-handled');
    expect(run(['class', 'Watchdog: no FB group export closed in 9 days'])).toBe('human-action');
    expect(run(['class', 'Watchdog: nothing maps this'])).toBe('unknown');
  });

  it('round-trips backstop-state through stdin', () => {
    expect(run(['backstop-state'], '[]')).toBe('none');
    const body = renderSuppressedComment({ title: 'Watchdog: work is going unowned' });
    expect(run(['backstop-state'], JSON.stringify([mine(body)]))).toBe('waiting');
  });

  it('exits 3 on a failed lookup rather than reporting "no marker"', () => {
    const result = spawnSync('node', [CLI_PATH, 'backstop-state'], { input: '', encoding: 'utf8' });
    expect(result.status).toBe(3);
    expect(result.stdout.trim()).toBe('');
  });

  it('exits 2 on an unknown verb', () => {
    const result = spawnSync('node', [CLI_PATH, 'nope'], { encoding: 'utf8' });
    expect(result.status).toBe(2);
  });
});
