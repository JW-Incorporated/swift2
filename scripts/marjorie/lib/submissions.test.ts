import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  sourceOf,
  selectUntriagedSubmissions,
  renderFounderMarker,
  pendingFounderIssues,
  countLabelSince,
} from './submissions.mjs';

describe('sourceOf', () => {
  it('does not match a title without the bracketed prefix', () => {
    expect(sourceOf('Feedback on the new landing page')).toBeNull();
  });

  it('matches [Feedback] -> feedback', () => {
    expect(sourceOf('[Feedback] the page is blank')).toBe('feedback');
  });

  it('matches [Intake] -> intake', () => {
    expect(sourceOf('[Intake] Eras Tour stop added')).toBe('intake');
  });

  it('matches [Link submission] -> link-submission', () => {
    expect(sourceOf('[Link submission] Eras: example.com')).toBe('link-submission');
  });

  it('does not match mid-string (startsWith only, never a regex)', () => {
    expect(sourceOf('re: [Feedback] the page is blank')).toBeNull();
  });
});

describe('selectUntriagedSubmissions', () => {
  const base = { number: 1, title: '[Feedback] the page is blank', labels: [], body: '', url: '', createdAt: '' };

  it('selects a matching, untriaged issue and annotates it with .source', () => {
    const result = selectUntriagedSubmissions([base]);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('feedback');
  });

  it('excludes an issue already carrying marjorie-triaged, even with a matching prefix', () => {
    const triaged = { ...base, labels: [{ name: 'marjorie-triaged' }] };
    expect(selectUntriagedSubmissions([triaged])).toHaveLength(0);
  });

  it('excludes an issue with no matching prefix, regardless of labels', () => {
    const unrelated = { ...base, title: 'Feedback on the new landing page', labels: [{ name: 'founder-decision' }] };
    expect(selectUntriagedSubmissions([unrelated])).toHaveLength(0);
  });

  it('tags [Intake] and [Link submission] issues with their own source', () => {
    const intake = { ...base, number: 2, title: '[Intake] Eras Tour stop added' };
    const link = { ...base, number: 3, title: '[Link submission] Eras: example.com' };
    const result = selectUntriagedSubmissions([intake, link]);
    expect(result.find((i) => i.number === 2)?.source).toBe('intake');
    expect(result.find((i) => i.number === 3)?.source).toBe('link-submission');
  });
});

describe('countLabelSince', () => {
  const now = Date.parse('2026-09-12T12:00:00Z');
  const withinWindow = new Date(now - 60_000).toISOString();

  it('counts an issue created within the window that has no marjorie-triaged label', async () => {
    const gh = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([{ createdAt: withinWindow, labels: [] }]),
    });
    const count = await countLabelSince('owner/repo', 'feedback', now - 86_400_000, { gh });
    expect(count).toBe(1);
  });

  it('excludes an otherwise-identical issue already carrying marjorie-triaged', async () => {
    const gh = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([{ createdAt: withinWindow, labels: [{ name: 'marjorie-triaged' }] }]),
    });
    const count = await countLabelSince('owner/repo', 'feedback', now - 86_400_000, { gh });
    expect(count).toBe(0);
  });
});

describe('renderFounderMarker', () => {
  it('renders the pending marker', () => {
    expect(renderFounderMarker('pending')).toBe('<!-- marjorie-triage-founder:pending -->');
  });

  it('renders the posted marker', () => {
    expect(renderFounderMarker('posted')).toBe('<!-- marjorie-triage-founder:posted -->');
  });

  it('throws on an unknown state', () => {
    expect(() => renderFounderMarker('nonsense')).toThrow();
  });
});

describe('pendingFounderIssues', () => {
  // `pending` is authored by the `run` job's agent credential (`claude`) and
  // trusted by login, since `deliver` reads it under a DIFFERENT credential
  // (cross-job — viewerDidAuthor can't work here, see submissions.mjs).
  const pendingByClaude = (body: string) => ({ author: { login: 'claude' }, body });
  const pendingForged = (body: string) => ({ author: { login: 'someone-else' }, body });
  // `posted` is both written AND read back by `deliver` itself — same job
  // type, same credential every time — so `viewerDidAuthor: true` is the
  // correct, real shape `gh issue view --json comments` returns for it.
  // Its `author.login` is realistically `github-actions`/`github-actions[bot]`,
  // NOT `claude` — deliberately NOT in TRUSTED_TRIAGE_LOGINS, to prove the
  // posted check doesn't (and must not) depend on that allowlist.
  const postedByDeliver = (body: string) => ({
    author: { login: 'github-actions' },
    viewerDidAuthor: true,
    body,
  });
  const postedForged = (body: string) => ({
    author: { login: 'someone-else' },
    viewerDidAuthor: false,
    body,
  });

  it('includes an issue with a pending marker and no posted marker', () => {
    const issue = { number: 10, comments: [pendingByClaude(renderFounderMarker('pending'))] };
    expect(pendingFounderIssues([issue])).toEqual([10]);
  });

  it('excludes an issue whose pending marker is followed by a real posted marker', () => {
    const issue = {
      number: 11,
      comments: [pendingByClaude(renderFounderMarker('pending')), postedByDeliver(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('excludes an issue with no pending marker at all', () => {
    const issue = { number: 12, comments: [pendingByClaude('just a regular comment')] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('only returns numbers for issues that qualify, across a mixed batch', () => {
    const pending = { number: 13, comments: [pendingByClaude(renderFounderMarker('pending'))] };
    const resolved = {
      number: 14,
      comments: [pendingByClaude(renderFounderMarker('pending')), postedByDeliver(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([pending, resolved])).toEqual([13]);
  });

  // This repo is PUBLIC — any GitHub account can comment on these issues, so
  // both markers are only trustworthy on a comment from their real source
  // (Codex review, PR #4229 finding 1; PR #4238 finding 1 on why that
  // source differs per marker).
  it('ignores a forged pending marker from a comment the run job did not post', () => {
    const issue = { number: 20, comments: [pendingForged(renderFounderMarker('pending'))] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('does not let a forged posted marker (viewerDidAuthor false) suppress a real pending handoff', () => {
    const issue = {
      number: 21,
      comments: [pendingByClaude(renderFounderMarker('pending')), postedForged(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([issue])).toEqual([21]);
  });

  it('ignores a pending marker whose comment has no author at all', () => {
    const issue = { number: 22, comments: [{ body: renderFounderMarker('pending') }] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('trusts the claude[bot] login spelling for pending too (same identity, different API surface)', () => {
    const botSpelling = (body: string) => ({ author: { login: 'claude[bot]' }, body });
    const issue = { number: 23, comments: [botSpelling(renderFounderMarker('pending'))] };
    expect(pendingFounderIssues([issue])).toEqual([23]);
  });

  // Codex review, PR #4238 finding 1: a naive fix reused the `pending`
  // allowlist (`claude`/`claude[bot]`) for the `posted` check too. `deliver`
  // never authors as `claude`, so that would make a REAL posted marker
  // unrecognizable forever — the same needs-founder issue would be reposted
  // to Discord on every single sweep. This is the regression test for that.
  it('recognizes a real posted marker even though its author.login is never in the pending allowlist', () => {
    const issue = {
      number: 24,
      comments: [pendingByClaude(renderFounderMarker('pending')), postedByDeliver(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });
});
