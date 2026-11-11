import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('fan-made discovery workflow', () => {
  it('installs workspace dependencies before importing the RSS-backed discovery script', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-fanmade.yml'), 'utf8').replace(/\r\n/g, '\n');

    expect(workflow).toMatch(
      /actions\/setup-node@v7[\s\S]*?\n\s+- run: npm ci\n[\s\S]*?node scripts\/merch-engine\/fanmade-discovery\.mjs/,
    );
  });

  it('runs schedules live while preserving the workflow_dispatch dry-run default', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-fanmade.yml'), 'utf8').replace(/\r\n/g, '\n');

    expect(workflow).toMatch(/workflow_dispatch:[\s\S]*?dry_run:[\s\S]*?default: true/);
    expect(workflow).toMatch(/if \[ "\$\{\{ github\.event_name \}\}" = "schedule" \]; then\n\s+DRY_RUN=false/);
    expect(workflow).toContain('echo "dryRun=${DRY_RUN}"');
  });
});
