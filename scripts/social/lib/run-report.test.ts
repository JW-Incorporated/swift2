import { describe, expect, it } from 'vitest';
import {
  OUTCOME,
  hasBlockingFailure,
  groupOutcomes,
  summarizeRun,
  formatReportMarkdown,
  formatAnnotations,
  formatPostedNotification,
  isStuck,
  STUCK_AFTER_HOURS,
} from './run-report.mjs';

const failedX = {
  kind: OUTCOME.FAILED,
  file: '2026-08-04-mine-rush-release-x.json',
  platform: 'x',
  attempts: 3,
  error: 'X post failed (403): {"detail":"You are not permitted to perform this action."}',
};
const retryingX = {
  kind: OUTCOME.RETRYING,
  file: 'b-x.json',
  platform: 'x',
  attempts: 1,
  error: 'X post failed (429): rate limited',
};
const postedIg = {
  kind: OUTCOME.POSTED,
  file: 'c-ig.json',
  platform: 'instagram',
  url: 'https://instagram.com/p/1',
};
const skippedIg = {
  kind: OUTCOME.SKIPPED,
  file: 'd-ig.json',
  platform: 'instagram',
  error: 'generic era art',
};

describe('hasBlockingFailure', () => {
  it('is true when any item permanently failed', () => {
    expect(hasBlockingFailure([postedIg, failedX])).toBe(true);
  });

  it('is false for a clean run', () => {
    expect(hasBlockingFailure([postedIg])).toBe(false);
    expect(hasBlockingFailure([])).toBe(false);
  });

  it('is false for a mid-retry attempt — the item is still queued', () => {
    expect(hasBlockingFailure([retryingX])).toBe(false);
  });

  it('is false for a deliberately skipped item', () => {
    expect(hasBlockingFailure([skippedIg])).toBe(false);
  });
});

describe('groupOutcomes', () => {
  it('buckets by kind and ignores unknown kinds', () => {
    const groups = groupOutcomes([postedIg, failedX, retryingX, skippedIg, { kind: 'weird' }]);
    expect(groups.posted).toEqual([postedIg]);
    expect(groups.failed).toEqual([failedX]);
    expect(groups.retrying).toEqual([retryingX]);
    expect(groups.skipped).toEqual([skippedIg]);
  });
});

describe('summarizeRun', () => {
  it('reads "nothing due" for an empty run', () => {
    expect(summarizeRun([])).toBe('nothing due');
  });

  it('leads with successes then shouts about permanent failures', () => {
    expect(summarizeRun([postedIg, failedX, retryingX])).toBe(
      '1 posted (instagram 1) · 1 PERMANENTLY FAILED (x 1) · 1 retrying (x 1)',
    );
  });

  it('omits zero-count segments', () => {
    expect(summarizeRun([postedIg])).toBe('1 posted (instagram 1)');
  });

  it('breaks counts down per platform so a dark X is visible', () => {
    expect(
      summarizeRun([
        failedX,
        { ...failedX, file: 'e-x.json' },
        { ...failedX, file: 'f-ig.json', platform: 'instagram' },
      ]),
    ).toBe('3 PERMANENTLY FAILED (instagram 1, x 2)');
  });
});

describe('formatReportMarkdown', () => {
  it('puts the permanent failure above the successes, with the platform error text', () => {
    const md = formatReportMarkdown([postedIg, failedX]);
    expect(md.indexOf('⛔')).toBeLessThan(md.indexOf('✅'));
    expect(md).toContain('2026-08-04-mine-rush-release-x.json');
    expect(md).toContain('You are not permitted to perform this action.');
    expect(md).toContain('NOT published');
  });

  it('names the retry attempt number', () => {
    expect(formatReportMarkdown([retryingX])).toContain('attempt 1');
  });

  it('links the run when the Actions context is present', () => {
    expect(formatReportMarkdown([postedIg], { runUrl: 'https://example.test/run/1' })).toContain(
      'https://example.test/run/1',
    );
  });

  it('says so plainly when nothing was due', () => {
    expect(formatReportMarkdown([])).toContain('Nothing was due this run.');
  });

  it('surfaces a failed Facebook cross-post on the posted item instead of dropping it', () => {
    const md = formatReportMarkdown([
      { ...postedIg, facebookError: 'Facebook Page post failed: {"error":{"message":"(#200) requires pages_manage_posts"}}' },
    ]);
    expect(md).toContain('Facebook Page cross-post FAILED');
    expect(md).toContain('pages_manage_posts');
    expect(md).toContain('https://instagram.com/p/1'); // the primary post is still reported as live
  });

  it('replaces the headline for an aborted run — "nothing due" would be a lie', () => {
    const md = formatReportMarkdown([], { abortReason: 'required credentials are missing (x: missing X_API_KEY)' });
    expect(md).toContain('RUN ABORTED');
    expect(md).toContain('X_API_KEY');
    expect(md).not.toContain('Nothing was due this run.');
  });
});

describe('formatAnnotations', () => {
  it('emits an ::error:: for a permanent failure so the run page shows it', () => {
    const [annotation] = formatAnnotations([failedX]);
    expect(annotation).toMatch(/^::error title=social-poster: x post permanently failed::/);
    expect(annotation).toContain('2026-08-04-mine-rush-release-x.json');
    expect(annotation).toContain('403');
  });

  it('emits only warnings for retries and skips', () => {
    expect(formatAnnotations([retryingX, skippedIg]).every((a) => a.startsWith('::warning'))).toBe(
      true,
    );
  });

  it('emits nothing for a clean run', () => {
    expect(formatAnnotations([postedIg])).toEqual([]);
  });

  it('warns (never errors) when a posted item\'s Facebook cross-post failed', () => {
    const annotations = formatAnnotations([
      { ...postedIg, facebookError: 'Facebook Page post failed: token expired' },
    ]);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatch(/^::warning title=social-poster: facebook cross-post failed::/);
    expect(annotations[0]).toContain('token expired');
  });

  it('emits an ::error:: for an aborted run', () => {
    const annotations = formatAnnotations([], { abortReason: 'required credentials are missing' });
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatch(/^::error title=social-poster: run aborted::/);
  });
});

describe('formatPostedNotification', () => {
  it('returns null when nothing posted this run — no empty email', () => {
    expect(formatPostedNotification([])).toBeNull();
    expect(formatPostedNotification([failedX, retryingX, skippedIg])).toBeNull();
  });

  it('links the real platform post, not just "a post was made"', () => {
    const notification = formatPostedNotification([postedIg]);
    expect(notification).not.toBeNull();
    expect(notification!.subject).toContain('1 post went live');
    expect(notification!.subject).toContain('instagram 1');
    expect(notification!.body).toContain('https://instagram.com/p/1');
  });

  it('lists a Facebook cross-post link separately when it also succeeded', () => {
    const notification = formatPostedNotification([
      { ...postedIg, facebookUrl: 'https://facebook.com/page/posts/1' },
    ]);
    expect(notification!.body).toContain('Also cross-posted to Facebook');
    expect(notification!.body).toContain('https://facebook.com/page/posts/1');
  });

  it('notes a failed cross-post without hiding the primary link', () => {
    const notification = formatPostedNotification([
      { ...postedIg, facebookError: 'token expired' },
    ]);
    expect(notification!.body).toContain('https://instagram.com/p/1');
    expect(notification!.body).toContain('Facebook Page cross-post failed');
    expect(notification!.body).toContain('token expired');
    expect(notification!.body).not.toContain('Also cross-posted');
  });

  it('covers every posted item, ignoring failures/retries/skips in the same run', () => {
    const secondPost = { ...postedIg, file: 'e-x.json', platform: 'x', url: 'https://x.com/status/9' };
    const notification = formatPostedNotification([postedIg, secondPost, failedX, retryingX]);
    expect(notification!.subject).toContain('2 posts went live');
    expect(notification!.body).toContain('https://instagram.com/p/1');
    expect(notification!.body).toContain('https://x.com/status/9');
    expect(notification!.body).not.toContain(failedX.error);
  });

  it('includes the run log link when provided', () => {
    const notification = formatPostedNotification([postedIg], { runUrl: 'https://example.test/run/1' });
    expect(notification!.body).toContain('https://example.test/run/1');
  });
});

// --- waiting-on-deploy + stuck escalation (2026-08-11) -------------------
const waiting = {
  kind: OUTCOME.WAITING,
  file: '2026-08-12-real-photo-ig.json',
  platform: 'instagram',
  error: 'its media is not live at https://www.longlivets.com yet — HEAD .../a.png returned 404.',
  overdueHours: 0.5,
};
const stuckSkip = {
  kind: OUTCOME.SKIPPED,
  file: '2026-08-09-august-augustine-ig.json',
  platform: 'instagram',
  error: 'its media (/eras/folklore.png) is generic era-cover art already used in a recent Instagram post.',
  overdueHours: 50,
};
const stuckWait = { ...waiting, file: 'stuck-wait-ig.json', overdueHours: 26 };

describe('waiting outcomes', () => {
  it('is a benign, non-blocking state while it is young', () => {
    expect(hasBlockingFailure([waiting])).toBe(false);
    expect(summarizeRun([waiting])).toBe('1 waiting on deploy (instagram 1)');
  });

  it('reads as holding, not failing, in the markdown', () => {
    const md = formatReportMarkdown([waiting]);
    expect(md).toContain('waiting on deploy');
    expect(md).toContain('ships automatically on the first run after its image PR is merged');
    expect(md).not.toContain('permanently failed');
  });

  it('annotates as a warning, not an error', () => {
    const annotations = formatAnnotations([waiting]);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain('::warning');
    expect(annotations[0]).toContain('waiting on deploy');
  });
});

describe('stuck escalation', () => {
  // The class this exists for: a skip that spends no attempt can never reach
  // social/failed/, so without this it stays invisible forever inside green
  // runs — which is what 2026-08-09-august-augustine-ig.json did for 2 days.
  it('turns the run red once a no-attempt block passes the threshold', () => {
    expect(isStuck(stuckSkip)).toBe(true);
    expect(isStuck(stuckWait)).toBe(true);
    expect(hasBlockingFailure([stuckSkip])).toBe(true);
    expect(hasBlockingFailure([stuckWait])).toBe(true);
  });

  it('does not escalate a block that is still inside the threshold', () => {
    expect(isStuck({ ...stuckSkip, overdueHours: STUCK_AFTER_HOURS - 0.1 })).toBe(false);
    expect(hasBlockingFailure([{ ...stuckSkip, overdueHours: 1 }])).toBe(false);
  });

  it('escalates exactly at the threshold', () => {
    expect(isStuck({ ...stuckSkip, overdueHours: STUCK_AFTER_HOURS })).toBe(true);
  });

  it('never escalates a posted or retrying outcome by overdue time', () => {
    expect(isStuck({ ...retryingX, overdueHours: 999 })).toBe(false);
  });

  it('leads the headline and the markdown with the stuck item', () => {
    expect(summarizeRun([stuckSkip])).toContain(`1 STUCK >${STUCK_AFTER_HOURS}h`);
    const md = formatReportMarkdown([stuckSkip]);
    expect(md).toContain('STUCK more than');
    expect(md).toContain('overdue 2d 2h');
    expect(md).toContain('a human has to change the item');
  });

  it('annotates a stuck item as an error — its only possible escalation', () => {
    const annotations = formatAnnotations([stuckSkip]);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain('::error');
    expect(annotations[0]).toContain('cannot unblock itself');
  });

  it('keeps stuck items out of the plain skipped/waiting sections', () => {
    const md = formatReportMarkdown([stuckSkip, waiting]);
    expect(md).toContain('1 item STUCK');
    expect(md).toContain('1 waiting on deploy');
    expect(md).not.toContain('1 skipped (left in the queue');
  });
});
