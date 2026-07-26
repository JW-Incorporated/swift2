import { describe, expect, it } from 'vitest';
import { planRest } from './gh.mjs';

// These cover the REST fallback's argv→request translation, which is the part
// that silently does the wrong thing if it's wrong. The failure mode we're
// guarding against is a run that reports success while filing nothing —
// exactly what Karen's 2026-07-26 nightly did (623 findings, zero tickets).

const REPO = 'JW-Incorporated/swift2';

describe('planRest — label create', () => {
  it('maps to POST /labels and tolerates the already-exists 422 that --force implies', () => {
    const p = planRest(['label', 'create', 'cie:P1', '--color', 'd93f0b', '--description', 'major', '--force'], REPO);
    expect(p.method).toBe('POST');
    expect(p.path).toBe(`/repos/${REPO}/labels`);
    expect(p.body).toEqual({ name: 'cie:P1', color: 'd93f0b', description: 'major' });
    expect(p.tolerate).toContain(422);
  });
});

describe('planRest — issue list', () => {
  it('carries the fingerprint search through, so dedupe still works', () => {
    const p = planRest(['issue', 'list', '--state', 'all', '--search', 'cie-fp:abc123 in:body', '--json', 'number', '--limit', '1'], REPO);
    const q = decodeURIComponent(p.path.split('q=')[1].split('&')[0]);
    expect(q).toContain('cie-fp:abc123 in:body');
    expect(q).toContain(`repo:${REPO}`);
    expect(q).toContain('type:issue');
    // --state all must NOT pin a state, or closed duplicates get re-filed.
    expect(q).not.toContain('state:');
  });

  it('translates label and state filters', () => {
    const p = planRest(['issue', 'list', '--repo', REPO, '--label', 'founder-decision', '--state', 'open', '--limit', '100', '--json', 'number,title'], REPO);
    const q = decodeURIComponent(p.path.split('q=')[1].split('&')[0]);
    expect(q).toContain('label:"founder-decision"');
    expect(q).toContain('state:open');
    expect(p.fields).toEqual(['number', 'title']);
  });

  it('caps per_page at the REST maximum of 100', () => {
    const p = planRest(['issue', 'list', '--limit', '5000', '--json', 'number'], REPO);
    expect(p.path).toContain('per_page=100');
  });
});

describe('planRest — pr list', () => {
  it('searches type:pr and expresses merged as is:merged', () => {
    const p = planRest(['pr', 'list', '--repo', REPO, '--state', 'merged', '--limit', '30', '--json', 'number,title,mergedAt'], REPO);
    const q = decodeURIComponent(p.path.split('q=')[1].split('&')[0]);
    expect(q).toContain('type:pr');
    expect(q).toContain('is:merged');
    expect(q).not.toContain('state:merged');
  });
});

describe('planRest — issue create', () => {
  it('reads --body-file from disk, since bodies never go through argv', () => {
    const p = planRest(['issue', 'create', '--title', 'T', '--body-file', 'package.json', '--label', 'cie', '--label', 'cie:P1'], REPO);
    expect(p.method).toBe('POST');
    expect(p.path).toBe(`/repos/${REPO}/issues`);
    expect(p.body.title).toBe('T');
    expect(p.body.labels).toEqual(['cie', 'cie:P1']);
    expect(p.body.body.length).toBeGreaterThan(0);
  });
});

describe('planRest — unsupported', () => {
  it('returns null rather than guessing, so gh() can throw a named error', () => {
    expect(planRest(['release', 'create', 'v1'], REPO)).toBeNull();
  });
});
