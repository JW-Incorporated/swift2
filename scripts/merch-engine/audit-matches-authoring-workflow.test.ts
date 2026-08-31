import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('E3 manually confirmed authoring workflow', () => {
  it('keeps vision judgment manual, secret-bound, capped, cached, and artifact-only', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-audit-authoring.yml'), 'utf8');

    expect(workflow).toMatch(/^on:\n\x20{2}workflow_dispatch:/m);
    expect(workflow).not.toMatch(/^\x20{2}(push|schedule):/m);
    expect(workflow).toContain('confirmation:');
    expect(workflow).toContain('required: true');
    expect(workflow).toContain('RUN_AUTHORED_VISION_AUDIT');
    expect(workflow).toContain("inputs.confirmation == 'RUN_AUTHORED_VISION_AUDIT'");
    expect(workflow).toContain('ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('GH_TOKEN: ${{ github.token }}');
    expect(workflow).toContain('id: author');
    expect(workflow).toContain('Initialize or refresh the authoring receipt');
    expect(workflow).toContain('detectorReceipt, unscored: queue.unscored');
    expect(workflow).toContain("!cancelled() && steps.author.conclusion != 'skipped'");
    expect(workflow).toContain('audit-matches.mjs --detect');
    expect(workflow).toContain('audit-matches-authoring.mjs --receipt');
    expect(workflow).toContain('actions/cache/restore');
    expect(workflow).toContain('actions/cache/save');
    expect(workflow).toContain('actions/upload-artifact');
    expect(workflow).toContain('merch-audit-authoring-artifact');
    expect(workflow).not.toMatch(/git (add|commit|push)|gh pr|supabase\/seed|apps\/web\/lib\/longlive\/content/i);
  });
});
