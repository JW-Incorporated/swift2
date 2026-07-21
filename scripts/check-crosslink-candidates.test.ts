import { describe, expect, it } from 'vitest';

// @ts-expect-error — plain .mjs script, no types
import { definedIds, parseCandidate, refToId, validate } from './check-crosslink-candidates.mjs';

// The distinction that caused the false positive on 2026-07-21: an id is
// DEFINED without the `moment:` prefix and REFERENCED with it.
const VAULT_SAMPLE = `
  { id: "vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl", title: "..." ,
    relatedIds: ["moment:vault-tloas-the-life-of-a-showgirl-arrives"] },
  { id: "vault-tloas-the-life-of-a-showgirl-arrives", title: "..." },
  { id: 'vault-ttpd-2-61-million-in-week-one', title: "..." },
`;

const candidate = (number: number, obj: unknown) => ({
  number,
  body: `Cross-link found by Lex.\n\n\`\`\`json\n${JSON.stringify(obj)}\n\`\`\`\n`,
});

describe('definedIds', () => {
  it('collects ids from their definitions, not their references', () => {
    const ids = definedIds(VAULT_SAMPLE);
    expect(ids.has('vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl')).toBe(true);
    expect(ids.has('vault-ttpd-2-61-million-in-week-one')).toBe(true);
    // The prefixed reference form must never enter the defined set.
    expect(ids.has('moment:vault-tloas-the-life-of-a-showgirl-arrives')).toBe(false);
    expect(ids.size).toBe(3);
  });
});

describe('refToId', () => {
  it('strips the moment: prefix and passes bare ids through', () => {
    expect(refToId('moment:vault-x-y')).toBe('vault-x-y');
    expect(refToId('vault-x-y')).toBe('vault-x-y');
  });
});

describe('parseCandidate', () => {
  it('finds the JSON object inside a prose body', () => {
    expect(parseCandidate(candidate(1, { from: 'a', to: 'b' }).body)).toEqual({
      from: 'a',
      to: 'b',
    });
  });
  it('returns null rather than throwing on junk', () => {
    expect(parseCandidate('no json here')).toBeNull();
    expect(parseCandidate('{ not: valid json }')).toBeNull();
    expect(parseCandidate(undefined)).toBeNull();
  });
});

describe('validate', () => {
  const defined = definedIds(VAULT_SAMPLE);

  it('passes a candidate whose ends both exist — the real 2026-07-21 case', () => {
    // This exact pair was reported dangling by an ad-hoc grep. It is valid.
    const ok = candidate(1003, {
      from: 'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl',
      to: 'moment:vault-tloas-the-life-of-a-showgirl-arrives',
    });
    expect(validate([ok], defined)).toEqual([]);
  });

  it('catches a genuinely dangling end', () => {
    const bad = candidate(1, {
      from: 'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl',
      to: 'moment:vault-tloas-a-page-that-does-not-exist',
    });
    const problems = validate([bad], defined);
    expect(problems).toHaveLength(1);
    expect(problems[0].kind).toBe('dangling');
    expect(problems[0].detail).toContain('to:');
  });

  it('catches a self-link, which would render as a page linking to itself', () => {
    const same = 'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl';
    const problems = validate([candidate(2, { from: same, to: same })], defined);
    expect(problems.some((p: { kind: string }) => p.kind === 'self-link')).toBe(true);
  });

  it('reports an unparseable body instead of skipping it silently', () => {
    const problems = validate([{ number: 3, body: 'Lex forgot the JSON' }], defined);
    expect(problems).toEqual([{ number: 3, kind: 'unparseable', detail: 'no JSON object in body' }]);
  });

  it('reports a missing field', () => {
    const problems = validate([candidate(4, { from: 'moment:vault-ttpd-2-61-million-in-week-one' })], defined);
    expect(problems.some((p: { kind: string }) => p.kind === 'missing-field')).toBe(true);
  });
});
