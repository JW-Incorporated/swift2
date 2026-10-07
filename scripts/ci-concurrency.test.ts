// `main` CI must run on every merged commit. A shared `main` concurrency group
// silently drops queued runs when merges cluster (GitHub keeps one pending run
// per group), so `main` pushes are grouped per commit; PRs stay per-ref and
// cancel superseded runs. See the comment above `concurrency:` in ci.yml.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ROOT } from './lib/generated-content.mjs';

const ci = parse(readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));

describe('ci.yml concurrency', () => {
  it('groups main pushes per commit so none is ever replaced while queued', () => {
    expect(ci.concurrency.group).toContain('github.sha');
    expect(ci.concurrency.group).not.toBe('ci-${{ github.ref }}');
  });

  it('only cancels in-progress runs for pull requests', () => {
    expect(ci.concurrency['cancel-in-progress']).toBe("${{ github.event_name == 'pull_request' }}");
  });
});
