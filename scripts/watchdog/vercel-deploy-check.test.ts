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
