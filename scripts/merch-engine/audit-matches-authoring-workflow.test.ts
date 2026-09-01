import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('E3 manually confirmed authoring workflow', () => {
  const workflow = readFileSync(resolve('.github/workflows/merch-audit-authoring.yml'), 'utf8');
  // Isolate the `author:` job's own text (up to the next top-level job
  // key) so the "stays artifact-only" assertion below judges ONLY that
  // job — the separate `apply-demotions:` job legitimately commits and
  // opens a PR (spec P2, issue #3447), same pattern merch-official-sync.yml
  // already uses for its own `author` job.
  const authorJob = workflow.slice(0, workflow.indexOf('\n  apply-demotions:'));

  it('keeps vision judgment manual, secret-bound, capped, cached, and artifact-only', () => {
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
    // Renewable score cache (#3447 P1): the save key must be run-scoped so
    // an immutable pinned key can never go stale, and restore must fall
    // back through a prefix so the newest saved key is always picked up.
    expect(workflow).toContain('merch-audit-scores-v1-${{ github.ref_name }}-${{ github.run_id }}');
    expect(workflow).toContain('restore-keys');
    expect(workflow).toContain('buildScoreCache');
    expect(authorJob).not.toMatch(/git (add|commit|push)|gh pr|supabase\/seed|apps\/web\/lib\/longlive\/content/i);
  });

  it('applies demotions to moment content in a separate, gated PR-opening job (#3447 P2)', () => {
    expect(workflow).toContain('apply-demotions:');
    expect(workflow).toContain('needs: author');
    expect(workflow).toContain("needs.author.outputs.demoted != '0'");
    expect(workflow).toContain('apply-demotions.mjs');
    expect(workflow).toContain('sync:content');
    expect(workflow).toContain('SOCIAL_POSTER_PAT');
    expect(workflow).toContain('merch-audit-authoring/${GITHUB_RUN_ID}');
    expect(workflow).toContain('gh pr merge "$BRANCH" --squash --auto --delete-branch');
  });

  it('never lets a transient issue-filing failure block demotion removal (#3447 P2 review fix)', () => {
    // The `author` step must continue-on-error so a re-source/cap issue API
    // failure can't fail the whole job and skip the dependent
    // apply-demotions job — the vision model's mismatch judgment is already
    // conclusive by that point and must not be held hostage by GitHub
    // Issues flakiness.
    expect(authorJob).toContain('continue-on-error: true');
    expect(authorJob).toContain("steps.author.outcome == 'failure'");
  });
});
