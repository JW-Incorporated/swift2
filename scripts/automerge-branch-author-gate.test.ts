import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_LANE_BRANCH_PREFIXES,
  CONTENT_LANE_EXACT_BRANCHES,
  KNOWN_CONTENT_AUTHORS,
  isContentLaneBranch,
  isKnownContentAuthor,
  evaluateBranchAuthorGate,
} from './automerge-branch-author-gate.mjs';
import { ROOT } from './lib/generated-content.mjs';

describe('isContentLaneBranch', () => {
  it('matches every documented prefix with a real dated example', () => {
    const examples: Record<string, string> = {
      'content-shift/': 'content-shift/2026-08-24',
      'vault/': 'vault/2026-08-24-run2',
      'growth/': 'growth/2026-08-24',
      'tree/': 'tree/2026-08-24',
      'depth/answerer-': 'depth/answerer-2026-08-24',
      'content/rumor-desk-': 'content/rumor-desk-2026-08-17-reapply',
      'content/stylist-': 'content/stylist-2026-08-16',
      'social-poster/state-': 'social-poster/state-20260824153850',
      'appearance-discovery/': 'appearance-discovery/123456789',
      'merch-revenue/': 'merch-revenue/123456789',
      'merch-official-sync/': 'merch-official-sync/123456789',
      'claude/pensive-galileo-': 'claude/pensive-galileo-tx2nu4',
    };
    for (const [prefix, example] of Object.entries(examples)) {
      expect(isContentLaneBranch(example), example).toBe(true);
      expect(CONTENT_LANE_BRANCH_PREFIXES, prefix).toContain(prefix);
    }
  });

  it('matches the two exact fixed content-lane branch names', () => {
    expect(CONTENT_LANE_EXACT_BRANCHES.length).toBeGreaterThan(0);
    for (const b of CONTENT_LANE_EXACT_BRANCHES) {
      expect(isContentLaneBranch(b), b).toBe(true);
    }
  });

  it('does NOT match an unrelated/unexpected branch, even one that looks content-ish', () => {
    for (const b of [
      'main',
      'feature/some-new-thing',
      'fix/a11y-p2-batch',
      'fix/karen-tickets-evil',
      'austin/issue-2230',
      'claude/jolly-sagan-rtm8rd',
      'content-shift-evil/2026-08-24',
      'vaultx/2026-08-24',
      'random',
      '',
    ]) {
      expect(isContentLaneBranch(b), b).toBe(false);
    }
  });

  it('does NOT treat the fixed exact branches as prefixes', () => {
    expect(isContentLaneBranch('fix/karen-tickets/extra')).toBe(false);
    expect(isContentLaneBranch('kevin/user-fixes-2')).toBe(false);
  });
});

describe('isKnownContentAuthor', () => {
  it('recognizes the two founder logins and the Claude Code app identity', () => {
    expect(KNOWN_CONTENT_AUTHORS.length).toBeGreaterThanOrEqual(3);
    for (const a of KNOWN_CONTENT_AUTHORS) expect(isKnownContentAuthor(a), a).toBe(true);
  });

  it('rejects an unexpected author', () => {
    for (const a of ['some-random-user', 'dependabot[bot]', 'claude', '', 'sffan15-sys ']) {
      expect(isKnownContentAuthor(a), a).toBe(false);
    }
  });
});

describe('evaluateBranchAuthorGate', () => {
  it('passes only when BOTH branch and author check out', () => {
    expect(evaluateBranchAuthorGate({ branch: 'vault/2026-08-24', author: 'sffan15-sys' }).ok).toBe(true);
    expect(evaluateBranchAuthorGate({ branch: 'content-shift/2026-08-24', author: 'wjduvall-cmd' }).ok).toBe(true);
    expect(evaluateBranchAuthorGate({ branch: 'vault/2026-08-24', author: 'claude[bot]' }).ok).toBe(true);
  });

  it('fails a PR from an unexpected branch even with a legitimate author (zero risky files still fails)', () => {
    // The injection scenario #1969 names: a compromised content-lane agent
    // (or an override of its "seed files only" instruction) pushing from a
    // branch that doesn't match its own routine's documented naming
    // convention — even though the author is a real founder/routine identity
    // and the PR might touch nothing but content paths.
    const r = evaluateBranchAuthorGate({ branch: 'feature/looks-like-content', author: 'sffan15-sys' });
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.includes('head branch'))).toBe(true);
  });

  it('fails a PR with a content-lane-shaped branch but an unrecognized author', () => {
    // A spoofed/forked PR that guessed the branch naming convention.
    const r = evaluateBranchAuthorGate({ branch: 'vault/2026-08-24', author: 'some-attacker' });
    expect(r.ok).toBe(false);
    expect(r.reasons.some((x) => x.includes('author'))).toBe(true);
  });

  it('fails a PR matching neither, with both reasons named', () => {
    const r = evaluateBranchAuthorGate({ branch: 'main', author: 'some-attacker' });
    expect(r.ok).toBe(false);
    expect(r.reasons.length).toBe(2);
  });
});

// ── the workflow must keep mirroring this gate (a security control must not
//    be silently droppable, same contract automerge-content-guard.test.ts
//    already enforces for guard-code) ────────────────────────────────────
describe('the auto-merge workflow mirrors this gate', () => {
  const wf = readFileSync(join(ROOT, '.github/workflows/auto-merge-content.yml'), 'utf8');

  it('references every documented content-lane branch pattern', () => {
    for (const prefix of CONTENT_LANE_BRANCH_PREFIXES) {
      expect(wf, prefix).toContain(prefix);
    }
    for (const branch of CONTENT_LANE_EXACT_BRANCHES) {
      expect(wf, branch).toContain(branch);
    }
  });

  it('references every known content-lane author identity', () => {
    for (const author of KNOWN_CONTENT_AUTHORS) {
      expect(wf, author).toContain(author);
    }
  });

  it('reads the PR head branch into the enable job', () => {
    expect(wf).toContain('github.event.pull_request.head.ref');
  });
});
