import { describe, expect, it } from 'vitest';
import { bucketBySeverity, issueBody } from './dependabot-alerts-snapshot.mjs';

function alert(overrides: Record<string, unknown> = {}) {
  return {
    number: 1,
    html_url: 'https://github.com/JW-Incorporated/swift2/security/dependabot/1',
    state: 'open',
    dependency: { package: { name: 'left-pad' } },
    security_advisory: { severity: 'high', summary: 'left-pad has a bug', vulnerabilities: [{ first_patched_version: { identifier: '2.0.0' } }] },
    ...overrides,
  };
}

describe('bucketBySeverity', () => {
  it('groups alerts under their real severity', () => {
    const buckets = bucketBySeverity([
      alert({ number: 1, security_advisory: { severity: 'critical' } }),
      alert({ number: 2, security_advisory: { severity: 'low' } }),
    ]);
    expect(buckets.critical).toHaveLength(1);
    expect(buckets.low).toHaveLength(1);
    expect(buckets.high).toHaveLength(0);
  });

  it('falls back an unrecognised severity into low rather than dropping it', () => {
    const buckets = bucketBySeverity([alert({ security_advisory: { severity: 'weird' } })]);
    expect(buckets.low).toHaveLength(1);
  });

  it('sorts each bucket by package name', () => {
    const buckets = bucketBySeverity([
      alert({ dependency: { package: { name: 'zebra' } }, security_advisory: { severity: 'high' } }),
      alert({ dependency: { package: { name: 'alpha' } }, security_advisory: { severity: 'high' } }),
    ]);
    expect(buckets.high.map((a) => a.dependency.package.name)).toEqual(['alpha', 'zebra']);
  });
});

describe('issueBody', () => {
  it('flags a missing PAT rather than silently reporting zero alerts', () => {
    const body = issueBody(null, '2026-08-24T00:00:00Z');
    expect(body).toMatch(/PAT not configured yet/);
    expect(body).toMatch(/HUMAN-ACTIONS\.md.*#21/);
  });

  it('says plainly when there are zero open alerts', () => {
    const body = issueBody([], '2026-08-24T00:00:00Z');
    expect(body).toMatch(/0 open alerts/);
  });

  it('renders a severity-ranked table for real alerts', () => {
    const body = issueBody(
      [
        alert({ number: 5, dependency: { package: { name: 'axios' } }, security_advisory: { severity: 'critical', vulnerabilities: [{ first_patched_version: { identifier: '1.2.3' } }] } }),
      ],
      '2026-08-24T00:00:00Z',
    );
    expect(body).toContain('critical');
    expect(body).toContain('axios');
    expect(body).toContain('1.2.3');
    expect(body).toContain('#5');
  });

  it('includes the fetch timestamp for staleness checks', () => {
    const body = issueBody([], '2026-08-24T12:00:00Z');
    expect(body).toContain('2026-08-24T12:00:00Z');
  });
});
