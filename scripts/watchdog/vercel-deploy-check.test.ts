import { describe, expect, it } from 'vitest';
import { evaluate, latestProductionDeploys, WATCHED_PROJECT } from './vercel-deploy-check.mjs';

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

  it('treats a legitimate Vercel auto-skip (CANCELED + "not affected") as confirmed-ok, not a failure', () => {
    // swift2#4616 (2026-09-29): PR #4615 was a data-only commit that didn't
    // touch the built app; Vercel's own "skip unaffected projects" monorepo
    // feature correctly canceled the build rather than running it, and the
    // watchdog paged a founder over nothing. errorMessage is the tell.
    const latest = latestProductionDeploys([
      dep({ readyState: 'CANCELED', errorMessage: 'The Deployment has been canceled because this project was not affected' }),
    ]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-ok');
    expect(out.reason).toMatch(/auto-skipped/);
  });

  it('is case-insensitive matching the auto-skip errorMessage', () => {
    const latest = latestProductionDeploys([
      dep({ readyState: 'CANCELED', errorMessage: 'Canceled: Not Affected by this change' }),
    ]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-ok');
  });

  it('still alarms on a CANCELED deploy with no errorMessage at all (genuine cancel/abort)', () => {
    const latest = latestProductionDeploys([dep({ readyState: 'CANCELED', errorMessage: null })]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-failure');
  });

  it('still alarms on a CANCELED deploy with an unrelated errorMessage (build timeout etc)', () => {
    const latest = latestProductionDeploys([
      dep({ readyState: 'CANCELED', errorMessage: 'Canceled: build exceeded the 45 minute limit' }),
    ]);
    const out = evaluate({ latest, watchProject: 'swift2-web' });
    expect(out.status).toBe('confirmed-failure');
  });

  it('does not treat a "not affected" errorMessage as a skip unless the state is CANCELED', () => {
    // Sanity guard: the discriminator is state AND message together, never
    // the message alone, in case an unrelated field ever echoes similar text.
    const latest = latestProductionDeploys([
      dep({ readyState: 'ERROR', errorMessage: 'not affected' }),
    ]);
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
