import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import {
  sourceOf,
  selectUntriagedSubmissions,
  renderFounderMarker,
  pendingFounderIssues,
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
  const own = (body: string) => ({ viewerDidAuthor: true, body });
  const other = (body: string) => ({ viewerDidAuthor: false, body });

  it('includes an issue with a pending marker and no posted marker', () => {
    const issue = { number: 10, comments: [own(renderFounderMarker('pending'))] };
    expect(pendingFounderIssues([issue])).toEqual([10]);
  });

  it('excludes an issue whose pending marker is followed by a posted marker', () => {
    const issue = {
      number: 11,
      comments: [own(renderFounderMarker('pending')), own(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('excludes an issue with no pending marker at all', () => {
    const issue = { number: 12, comments: [own('just a regular comment')] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('only returns numbers for issues that qualify, across a mixed batch', () => {
    const pending = { number: 13, comments: [own(renderFounderMarker('pending'))] };
    const resolved = {
      number: 14,
      comments: [own(renderFounderMarker('pending')), own(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([pending, resolved])).toEqual([13]);
  });

  // This repo is PUBLIC — any GitHub account can comment on these issues, so
  // both markers are only trustworthy on a comment the routine's own
  // credential authored (Codex review, PR #4229, finding 1).
  it('ignores a forged pending marker from a comment the routine did not post', () => {
    const issue = { number: 20, comments: [other(renderFounderMarker('pending'))] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });

  it('does not let a forged posted marker suppress a real pending handoff', () => {
    const issue = {
      number: 21,
      comments: [own(renderFounderMarker('pending')), other(renderFounderMarker('posted'))],
    };
    expect(pendingFounderIssues([issue])).toEqual([21]);
  });

  it('ignores a marker whose viewerDidAuthor is missing entirely, not just false', () => {
    const issue = { number: 22, comments: [{ body: renderFounderMarker('pending') }] };
    expect(pendingFounderIssues([issue])).toEqual([]);
  });
});
