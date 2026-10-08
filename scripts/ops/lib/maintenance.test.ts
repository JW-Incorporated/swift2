import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ESM helper, no type declarations
import {
  DEPENDABOT_GRACE_DAYS,
  formatMaintenanceSection,
  rollUp,
  summarizeDependabot,
  summarizeGithubActionsUsage,
  summarizeSupabaseAdvisors,
  summarizeSupabaseHealth,
  summarizeVercelDeployments,
  summarizeVercelSpend,
  summarizeWorkflowFailures,
} from './maintenance.mjs';

const NOW = '2026-08-11T12:00:00.000Z';
const hoursAgo = (h: number) => Date.parse(NOW) - h * 3_600_000;

describe('summarizeVercelDeployments', () => {
  it('returns null (not an empty summary) when the fetch failed', () => {
    expect(summarizeVercelDeployments(null, { now: NOW })).toBeNull();
  });

  it('counts only ERROR deployments inside the window, grouped by project', () => {
    const out = summarizeVercelDeployments(
      [
        { name: 'foray-web', readyState: 'ERROR', createdAt: hoursAgo(2) },
        { name: 'foray-web', readyState: 'ERROR', createdAt: hoursAgo(6) },
        { name: 'foray-web', readyState: 'READY', createdAt: hoursAgo(1) },
        { name: 'swift2-web', readyState: 'READY', createdAt: hoursAgo(3) },
        // Outside the 24h window — must not count.
        { name: 'swift2-web', readyState: 'ERROR', createdAt: hoursAgo(72) },
      ],
      { now: NOW, windowHours: 24 },
    );
    expect(out.totalErrors).toBe(2);
    expect(out.projects).toHaveLength(1);
    expect(out.projects[0]).toMatchObject({ project: 'foray-web', errors: 2, total: 3 });
    expect(out.projects[0].firstFailureAt).toBe(new Date(hoursAgo(6)).toISOString());
    expect(out.projects[0].lastFailureAt).toBe(new Date(hoursAgo(2)).toISOString());
  });

  it('separates production failures from preview failures', () => {
    const out = summarizeVercelDeployments(
      [{ name: 'swift2-web', readyState: 'ERROR', target: 'production', createdAt: hoursAgo(1) }],
      { now: NOW },
    );
    expect(out.productionErrors).toBe(1);
  });
});

describe('summarizeVercelSpend', () => {
  it('separates billed cost from list cost', () => {
    const out = summarizeVercelSpend(
      [
        { ServiceName: 'Functions', BilledCost: 1.5, ListCost: 4, BillingCurrency: 'USD' },
        { ServiceName: 'Bandwidth', BilledCost: 0, ListCost: 6 },
      ],
      { includedAllowanceUsd: 20 },
    );
    expect(out.billedUsd).toBe(1.5);
    expect(out.listUsd).toBe(10);
    expect(out.fractionOfAllowance).toBe(0.5);
    expect(out.byProduct[0]).toEqual({ product: 'Functions', usd: 1.5 });
  });

  it('leaves fractionOfAllowance null when no allowance is configured', () => {
    expect(summarizeVercelSpend([{ BilledCost: 3 }]).fractionOfAllowance).toBeNull();
  });
});

describe('summarizeSupabaseAdvisors', () => {
  it('counts by level and surfaces the worst first', () => {
    const out = summarizeSupabaseAdvisors([
      { name: 'unused_index', title: 'Unused index', level: 'INFO' },
      { name: 'rls_disabled_in_public', title: 'RLS disabled', level: 'ERROR' },
      { name: 'auth_otp_long_expiry', title: 'OTP expiry', level: 'WARN' },
    ]);
    expect(out.counts).toEqual({ ERROR: 1, WARN: 1, INFO: 1 });
    expect(out.top[0].name).toBe('rls_disabled_in_public');
  });
});

describe('summarizeSupabaseHealth', () => {
  it('reads status, not the deprecated healthy boolean', () => {
    const out = summarizeSupabaseHealth([
      { name: 'db', status: 'ACTIVE_HEALTHY', healthy: true },
      // `healthy: true` but status says otherwise — status must win.
      { name: 'auth', status: 'UNHEALTHY', healthy: true },
    ]);
    expect(out.allHealthy).toBe(false);
    expect(out.unhealthy).toEqual([{ name: 'auth', status: 'UNHEALTHY' }]);
  });
});

describe('summarizeGithubActionsUsage', () => {
  const items = [
    {
      product: 'actions',
      sku: 'Actions Linux',
      quantity: 1613,
      unitType: 'Minutes',
      grossAmount: 9.678,
      netAmount: 0,
      repositoryName: 'swift2',
    },
    {
      product: 'actions',
      sku: 'Actions macOS 3-core',
      quantity: 32,
      unitType: 'Minutes',
      grossAmount: 1.984,
      netAmount: 0,
      repositoryName: 'foray',
    },
    {
      product: 'actions',
      sku: 'Actions storage',
      quantity: 89.06,
      unitType: 'GigabyteHours',
      grossAmount: 0.03,
      netAmount: 0,
      repositoryName: 'swift2',
    },
    // A different product must be ignored entirely.
    { product: 'copilot', quantity: 1, unitType: 'Seats', grossAmount: 19, netAmount: 19 },
  ];

  it('sums Actions minutes only from Minutes-unit rows', () => {
    const out = summarizeGithubActionsUsage(items);
    expect(out.minutes).toBe(1645);
    expect(out.payingOverage).toBe(false);
    expect(out.byRepo[0]).toEqual({ repo: 'swift2', minutes: 1613, netUsd: 0 });
  });

  it('flags overage when netAmount survives the included-plan discount', () => {
    const out = summarizeGithubActionsUsage([
      { product: 'actions', quantity: 100, unitType: 'Minutes', grossAmount: 5, netAmount: 2.5 },
    ]);
    expect(out.payingOverage).toBe(true);
    expect(out.netUsd).toBe(2.5);
  });

  it('can scope to a single repository', () => {
    expect(summarizeGithubActionsUsage(items, { repo: 'foray' }).minutes).toBe(32);
  });
});

describe('summarizeWorkflowFailures', () => {
  it('counts failures but never cancellations', () => {
    const out = summarizeWorkflowFailures(
      [
        { name: 'CI', conclusion: 'failure', created_at: new Date(hoursAgo(3)).toISOString() },
        { name: 'CI', conclusion: 'cancelled', created_at: new Date(hoursAgo(3)).toISOString() },
        { name: 'CI', conclusion: 'success', created_at: new Date(hoursAgo(3)).toISOString() },
        {
          name: 'watchdog',
          conclusion: 'failure',
          created_at: new Date(hoursAgo(5)).toISOString(),
        },
        { name: 'CI', conclusion: 'failure', created_at: new Date(hoursAgo(50)).toISOString() },
      ],
      { now: NOW, windowHours: 24 },
    );
    expect(out.total).toBe(2);
    expect(out.workflows).toEqual([
      { workflow: 'CI', failures: 1 },
      { workflow: 'watchdog', failures: 1 },
    ]);
  });
});

describe('summarizeDependabot', () => {
  const alert = (severity: string, ageDays: number, name: string) => ({
    security_advisory: { severity },
    dependency: { package: { name } },
    created_at: new Date(Date.parse(NOW) - ageDays * 86_400_000).toISOString(),
  });

  it('counts by severity and only stales high/critical past the grace period', () => {
    const out = summarizeDependabot(
      [
        alert('high', DEPENDABOT_GRACE_DAYS + 3, 'image-size'),
        alert('high', 1, 'nanoid'),
        alert('medium', 30, 'uuid'),
      ],
      { now: NOW },
    );
    expect(out.counts).toEqual({ critical: 0, high: 2, medium: 1, low: 0 });
    expect(out.stale).toEqual([{ package: 'image-size', severity: 'high', ageDays: 10 }]);
  });
});

describe('rollUp', () => {
  const green = {
    vercel: {
      deployments: { windowHours: 24, projects: [], totalErrors: 0, productionErrors: 0 },
      spend: null,
    },
    supabase: {
      advisors: { counts: { ERROR: 0, WARN: 0, INFO: 0 }, total: 0, top: [] },
      health: { allHealthy: true, unhealthy: [], checked: 7 },
    },
    github: {
      actions: { payingOverage: false, netUsd: 0, minutes: 10, byRepo: [] },
      workflows: { windowHours: 24, total: 0, workflows: [] },
      dependabot: { counts: {}, total: 0, stale: [] },
    },
  };

  it('is green only when every source answered and nothing is wrong', () => {
    expect(rollUp(green).status).toBe('green');
    expect(rollUp(green).headline).toBe('all green');
  });

  it('never reports green when a source could not be reached', () => {
    const v = rollUp({ ...green, supabase: null });
    expect(v.status).toBe('amber');
    expect(v.unknown).toEqual(['Supabase']);
    expect(v.headline).toContain('cannot confirm');
  });

  it('goes red on a Supabase ERROR advisor', () => {
    const v = rollUp({
      ...green,
      supabase: {
        ...green.supabase,
        advisors: { counts: { ERROR: 2, WARN: 0, INFO: 0 }, total: 2, top: [] },
      },
    });
    expect(v.status).toBe('red');
    expect(v.headline).toContain('Supabase security advisor ERROR');
  });

  it('goes red on repeated preview failures but amber on a single one', () => {
    const withFailures = (errors: number) => ({
      ...green,
      vercel: {
        spend: null,
        deployments: {
          windowHours: 24,
          totalErrors: errors,
          productionErrors: 0,
          projects: [{ project: 'foray-web', errors, productionErrors: 0, total: errors }],
        },
      },
    });
    expect(rollUp(withFailures(5)).status).toBe('red');
    expect(rollUp(withFailures(1)).status).toBe('amber');
  });

  it('goes red on any failed production deploy', () => {
    const v = rollUp({
      ...green,
      vercel: {
        spend: null,
        deployments: {
          windowHours: 24,
          totalErrors: 1,
          productionErrors: 1,
          projects: [{ project: 'swift2-web', errors: 1, productionErrors: 1, total: 1 }],
        },
      },
    });
    expect(v.status).toBe('red');
  });

  it('treats on-demand spend as amber, not invisible', () => {
    const v = rollUp({
      ...green,
      vercel: {
        deployments: green.vercel.deployments,
        spend: { onDemandUsd: 4.2, fractionOfAllowance: null },
      },
    });
    expect(v.status).toBe('amber');
    expect(v.ambers[0]).toContain('$4.20');
  });
});

describe('formatMaintenanceSection', () => {
  it('leads with the punchline emoji and headline', () => {
    const lines = formatMaintenanceSection({
      verdict: {
        status: 'red',
        headline: 'Supabase is down',
        reds: ['Supabase is down'],
        ambers: [],
        unknown: [],
      },
    });
    expect(lines[0]).toBe('🔴 **Maintenance** — Supabase is down');
    // The headline is not repeated as its own detail bullet.
    expect(lines).toHaveLength(1);
  });

  it('names the sources it could not check', () => {
    const lines = formatMaintenanceSection({
      verdict: {
        status: 'amber',
        headline: 'cannot confirm',
        reds: [],
        ambers: [],
        unknown: ['Vercel'],
      },
    });
    expect(lines[0]).toBe('🟡 **Maintenance** — cannot confirm');
    expect(lines[1]).toBe('  - Not checked (missing token): Vercel');
  });
});
