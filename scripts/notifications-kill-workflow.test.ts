import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const wf = readFileSync('.github/workflows/notifications-kill.yml', 'utf8').replace(/\r\n/g, '\n');

describe('notifications-kill.yml', () => {
  it('is manual only, main only, read-only token', () => {
    expect(wf).toMatch(/\non:\n {2}workflow_dispatch:\n/);
    expect(wf).not.toMatch(/\n {2}(schedule|push|pull_request\w*):/);
    expect(wf).toContain("if: github.ref == 'refs/heads/main'");
    expect(wf).toMatch(/\npermissions:\n {2}contents: read\n/);
  });
  it('offers list (default) and apply only', () => {
    expect(wf).toMatch(/mode:[\s\S]*default: list\n {8}type: choice\n {8}options:\n {10}- list\n {10}- apply\n/);
  });
  it('rejects apply without the exact confirmation, before checkout', () => {
    expect(wf.indexOf('KILL-STALE-BACKLOG"')).toBeGreaterThan(-1);
    expect(wf.indexOf('Check confirmation')).toBeLessThan(wf.indexOf('actions/checkout'));
    expect(wf).toContain('[ "$CONFIRM" != "KILL-STALE-BACKLOG" ]');
  });
  it('runs the script directly with its real flags, not the env-file npm script', () => {
    expect(wf).toContain('node scripts/notifications-kill.mjs --kill --all-pending --apply');
    expect(wf).toContain('node scripts/notifications-kill.mjs --list');
    expect(wf).not.toContain('npm run notifications:kill');
    expect(wf.match(/secrets\.[A-Z_]+/g)).toEqual(['secrets.SUPABASE_URL', 'secrets.SUPABASE_SERVICE_ROLE_KEY']);
  });
});
