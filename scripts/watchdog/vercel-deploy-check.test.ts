import { describe, expect, it } from 'vitest';
import {
  applySkipOverride,
  evaluate,
  isLegitimateSkipStatus,
  latestProductionDeploys,
  WATCHED_PROJECT,
} from './vercel-deploy-check.mjs';

const dep = (overrides = {}) => ({
  name: 'swift2-web',
  target: 'production',
  readyState: 'READY',
  createdAt: Date.parse('2026-09-23T00:00:00.000Z'),
  uid: 'dpl_1',
  url: 'swift2-web.vercel.app',
  ...overrides,
});

describe('latestProductionDeploys', () => {
  it('returns null when the fetch failed', () => {
    expect(latestProductionDeploys(null)).toBeNull();
  });

  it('ignores non-production deployments', () => {
    const out = latestProductionDeploys([dep({ target: 'preview', readyState: 'ERROR' })]);
    expect(out).toEqual([]);
  });

  it('picks the NEWEST production deployment per project, not the first in the array', () => {
    const out = latestProductionDeploys([
      dep({ readyState: 'ERROR', createdAt: Date.parse('2026-09-23T01:00:00.000Z'), uid: 'dpl_old' }),
      dep({ readyState: 'READY', createdAt: Date.parse('2026-09-23T02:00:00.000Z'), uid: 'dpl_new' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ project: 'swift2-web', state: 'READY', uid: 'dpl_new' });
  });

  it('tracks multiple projects independently', () => {
    const out = latestProductionDeploys([
      dep({ name: 'swift2-web', readyState: 'READY' }),
      dep({ name: 'foray-web', readyState: 'ERROR' }),
    ]);
    expect(out).toHaveLength(2);
    expect(out.find((p) => p.project === 'foray-web')).toMatchObject({ state: 'ERROR' });
  });

  it('falls back to projectId, then "unknown", when name is absent', () => {
    const out = latestProductionDeploys([{ ...dep(), name: undefined, projectId: 'prj_123' }]);
    expect(out[0].project).toBe('prj_123');
  });
});

describe('evaluate', () => {
  it('is unknown (alarm-worthy) when the fetch itself failed — never silently clear', () => {
    const out = evaluate({ latest: null, fetchOk: false });
    expect(out.status).toBe('unknown');
  });

  it('is unknown when the watched project has no production deployment on record', () => {
    const out = evaluate({ latest: [], watchProject: 'swift2-web' });
    expect(out.status).toBe('unknown');
  });

  it('is confirmed-failure when the LATEST deploy is ERROR', () => {
    const latest = latestProductionDeploys([dep({ readyState: 'ERROR' })]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-failure');
    expect(out.deploy.state).toBe('ERROR');
  });

  it('treats CANCELED the same as ERROR', () => {
    const latest = latestProductionDeploys([dep({ readyState: 'CANCELED' })]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-failure');
  });

  it('is confirmed-ok when the latest deploy is READY, even if an older one failed', () => {
    const latest = latestProductionDeploys([
      dep({ readyState: 'ERROR', createdAt: Date.parse('2026-09-23T01:00:00.000Z') }),
      dep({ readyState: 'READY', createdAt: Date.parse('2026-09-23T02:00:00.000Z') }),
    ]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-ok');
  });

  it('self-heals within one retry: a fast redeploy after a failure clears the alarm with no separate reset bookkeeping', () => {
    // Simulates the exact t_3dab9cf8 shape: PR merge fails, a follow-up
    // redeploy immediately after succeeds — the check must see the SECOND
    // deploy as authoritative with no memory of the first ever needed.
    const failedThenFixed = latestProductionDeploys([
      dep({ readyState: 'ERROR', uid: 'dpl_e17860a', createdAt: Date.parse('2026-09-23T02:16:00.000Z') }),
    ]);
    expect(evaluate({ latest: failedThenFixed, watchProject: 'swift2-web' }).status).toBe(
      'confirmed-failure',
    );

    const afterRedeploy = latestProductionDeploys([
      dep({ readyState: 'ERROR', uid: 'dpl_e17860a', createdAt: Date.parse('2026-09-23T02:16:00.000Z') }),
      dep({ readyState: 'READY', uid: 'dpl_b1c276b', createdAt: Date.parse('2026-09-23T02:56:00.000Z') }),
    ]);
    expect(evaluate({ latest: afterRedeploy, watchProject: 'swift2-web' }).status).toBe('confirmed-ok');
  });

  it('defaults watchProject to WATCHED_PROJECT ("swift2-web" unless overridden by env)', () => {
    expect(WATCHED_PROJECT).toBe('swift2-web');
  });
});

describe('isLegitimateSkipStatus (issue #4616 false-alarm signal)', () => {
  it('recognizes the exact confirmed shape from the false alarm', () => {
    expect(
      isLegitimateSkipStatus({ context: 'Vercel', state: 'success', description: 'Skipped - Not affected' }),
    ).toBe(true);
  });

  it('is case-insensitive on the description wording', () => {
    expect(isLegitimateSkipStatus({ context: 'Vercel', description: 'skipped - not affected' })).toBe(true);
  });

  it('rejects a status from a different context, even with "skip" in the description', () => {
    expect(isLegitimateSkipStatus({ context: 'some-other-check', description: 'Skipped - Not affected' })).toBe(
      false,
    );
  });

  it('rejects a genuine Vercel failure status with no skip wording', () => {
    expect(isLegitimateSkipStatus({ context: 'Vercel', state: 'error', description: 'Build failed' })).toBe(
      false,
    );
  });

  it('rejects null/undefined/non-object input', () => {
    expect(isLegitimateSkipStatus(null)).toBe(false);
    expect(isLegitimateSkipStatus(undefined)).toBe(false);
    expect(isLegitimateSkipStatus('Skipped - Not affected')).toBe(false);
  });
});

describe('applySkipOverride (issue #4616: distinguish auto-skip from a real cancel/abort)', () => {
  it('(a) leaves a genuine ERROR alarming — ERROR is never skip-eligible, regardless of skipConfirmed', () => {
    const latest = latestProductionDeploys([dep({ readyState: 'ERROR', uid: 'dpl_real_error' })]);
    const failed = evaluate({ latest, watchProject: 'swift2-web' });
    expect(failed.status).toBe('confirmed-failure');

    const out = applySkipOverride(failed, true);
    expect(out.status).toBe('confirmed-failure');
  });

  it('(b) leaves a genuine aborted CANCELED (no skip signal) alarming', () => {
    const latest = latestProductionDeploys([dep({ readyState: 'CANCELED', uid: 'dpl_real_cancel' })]);
    const failed = evaluate({ latest, watchProject: 'swift2-web' });
    expect(failed.status).toBe('confirmed-failure');

    // skipConfirmed === false: GitHub API answered, no skip status found.
    expect(applySkipOverride(failed, false).status).toBe('confirmed-failure');
    // skipConfirmed === undefined: cross-check couldn't run at all — must
    // still alarm ("null never renders as green"), never silently clear.
    expect(applySkipOverride(failed, undefined).status).toBe('confirmed-failure');
  });

  it('(c) clears a CANCELED that is positively confirmed as a legitimate Vercel auto-skip — does not alarm', () => {
    // Mirrors the real issue #4616 incident: dpl_ApJCx54DfzffC9jSQi3vSYwcXKvW,
    // sha ce7f39e0, readyState CANCELED, GitHub commit status "Skipped - Not affected".
    const latest = latestProductionDeploys([
      dep({
        readyState: 'CANCELED',
        uid: 'dpl_ApJCx54DfzffC9jSQi3vSYwcXKvW',
        meta: { githubCommitSha: 'ce7f39e0512e2a3b151b9faeb5d5528b1f888b22' },
      }),
    ]);
    const failed = evaluate({ latest, watchProject: 'swift2-web' });
    expect(failed.status).toBe('confirmed-failure');
    expect(failed.deploy.commitSha).toBe('ce7f39e0512e2a3b151b9faeb5d5528b1f888b22');

    const out = applySkipOverride(failed, true);
    expect(out.status).toBe('confirmed-skipped');
    // Must not read as a founder-@-mention-worthy alarm string.
    expect(out.reason).toMatch(/legitimate/i);
    expect(out.status).not.toBe('confirmed-failure');
  });

  it('is a no-op on an already confirmed-ok or unknown result', () => {
    const ok = evaluate({ latest: latestProductionDeploys([dep({ readyState: 'READY' })]), watchProject: 'swift2-web' });
    expect(applySkipOverride(ok, true)).toBe(ok);

    const unknown = evaluate({ latest: null, fetchOk: false });
    expect(applySkipOverride(unknown, true)).toBe(unknown);
  });
});
