import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('weekly merch revenue workflow', () => {
  it('ingests the checked-in network input configuration and delivers the report through a PR', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-revenue.yml'), 'utf8');

    expect(workflow).toContain('scripts/merch-engine/data/revenue-report-inputs.json');
    expect(workflow).toContain('npm run merch:revenue');
    expect(workflow).toContain('actions/upload-artifact');
    expect(workflow).toContain('secrets.SOCIAL_POSTER_PAT');
    expect(workflow).toContain('BRANCH="merch-revenue/${GITHUB_RUN_ID}"');
    expect(workflow).toContain('gh pr create');
    expect(workflow).toContain('gh pr merge "$BRANCH" --squash --auto --delete-branch');
    expect(workflow).not.toContain('git push\n');
  });
});