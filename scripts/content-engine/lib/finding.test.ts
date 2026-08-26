import { describe, expect, it } from 'vitest';
import { fingerprint, legacyFingerprint, makeFinding } from './finding.mjs';

// #487: the old fingerprint hashed the raw excerpt verbatim, so a reslice of
// the same underlying defect (a checker/agent capturing a few more or fewer
// boundary words around the same span) minted a new fingerprint and re-filed
// a duplicate. The new scheme hashes a normalized word set instead.

const base = {
  checker: 'fact.slop',
  severity: 'P2',
  title: 't',
  itemRef: { type: 'moment', file: 'f.mjs', key: 'k', field: 'context' },
};

describe('fingerprint — stability against reslicing (#487)', () => {
  it('is unchanged when the excerpt window gains or loses a short boundary word', () => {
    const a = makeFinding({ ...base, excerpt: 'she announced her engagement with Travis' });
    const b = makeFinding({ ...base, excerpt: 'announced her engagement with Travis' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('is unchanged by whitespace/case differences alone', () => {
    const a = makeFinding({ ...base, excerpt: 'Taylor Announced Her Engagement' });
    const b = makeFinding({ ...base, excerpt: '  taylor   announced her engagement  ' });
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('still differs for a genuinely different excerpt on the same field', () => {
    const a = makeFinding({ ...base, excerpt: 'Taylor announced her engagement in October' });
    const b = makeFinding({ ...base, excerpt: 'Travis broke the franchise scoring record' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('still differs across checkers/items/fields', () => {
    const a = makeFinding({ ...base, excerpt: 'same text' });
    const b = makeFinding({ ...base, checker: 'fact.cross-check', excerpt: 'same text' });
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it('is deterministic — same input, same output, every time', () => {
    const f = makeFinding({ ...base, excerpt: 'a stable excerpt' });
    expect(fingerprint(f)).toBe(fingerprint(f));
  });
});

describe('legacyFingerprint — the pre-#487 scheme, kept for dedupe lookups only', () => {
  it('hashes the raw excerpt, so a resliced excerpt DOES change it (the bug being fixed)', () => {
    const a = makeFinding({ ...base, excerpt: 'Taylor announced her engagement in October' });
    const b = makeFinding({ ...base, excerpt: 'announced her engagement in October 2026' });
    expect(legacyFingerprint(a)).not.toBe(legacyFingerprint(b));
  });

  it('reproduces a known historical fingerprint exactly (#1716 / #813)', () => {
    // The real collision the old scheme allowed: both issues carry this exact
    // marker in their body. legacyFingerprint must keep producing it forever
    // so the grandfathering lookup in lib/issues.mjs still recognizes them.
    expect(
      legacyFingerprint({ checker: 'content.image-overuse', itemRef: { key: 'rollup' }, excerpt: '9' }),
    ).toBe('e4dc909b86b64e19');
  });
});
