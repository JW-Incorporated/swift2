import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('E5 manual evidence workflow', () => {
  it('keeps Etsy evidence collection manual, secret-bound, and artifact-only', () => {
    const workflow = readFileSync(resolve('.github/workflows/merch-e5-evidence.yml'), 'utf8');

    expect(workflow).toMatch(/^on:\n\x20{2}workflow_dispatch:/m);
    expect(workflow).not.toMatch(/^\x20{2}(push|schedule):/m);
    expect(workflow).toContain('confirmation:');
    expect(workflow).toContain('required: true');
    expect(workflow).toContain('COLLECT_E5_EVIDENCE');
    expect(workflow).toContain("inputs.confirmation == 'COLLECT_E5_EVIDENCE'");
    expect(workflow).toContain('ETSY_API_KEY: ${{ secrets.ETSY_API_KEY }}');
    expect(workflow).toContain('fanmade-discovery.mjs');
    expect(workflow).toMatch(/mkdir -p \.artifacts\/merch-e5-evidence\s+E5_EVIDENCE_DIR=[\s\S]+> \.artifacts\/merch-e5-evidence\/candidates\.json/);
    expect(workflow).toContain('actions/upload-artifact');
    expect(workflow).toContain('merch-e5-evidence-artifact');
    expect(workflow).toContain('retention-days: 7');
    expect(workflow).not.toMatch(/git (add|commit|push)|gh pr|supabase\/seed|social\//i);
  });
});
