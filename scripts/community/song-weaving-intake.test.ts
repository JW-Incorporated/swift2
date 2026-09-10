import { describe, expect, it } from 'vitest';
import {
  WEAVING_MENTION_FLOOR,
  planWeavingFilings,
  theoryIdsIn,
  fingerprintMarker,
  issueBody,
  parseArgs,
} from './song-weaving-intake.mjs';

function theory(overrides = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Vault Track Countdown',
    claim: 'Fans believe the countdown clock predicts a new vault track.',
    status: 'rumor',
    trackSlug: 'fortnight',
    mentionCount: WEAVING_MENTION_FLOOR,
    communities: ['TaylorSwift'],
    ...overrides,
  };
}

const emptyLedger = { ids: new Set(), issues: 0, complete: true };

describe('planWeavingFilings', () => {
  it('files a persistent theory that clears the mention floor and has a track_slug', () => {
    const plan = planWeavingFilings([theory()], { ledger: emptyLedger, max: 10 });
    expect(plan.toFile).toHaveLength(1);
    expect(plan.skipped).toHaveLength(0);
    expect(plan.refuse).toBeNull();
  });

  it('skips a theory with no track_slug', () => {
    const plan = planWeavingFilings([theory({ trackSlug: null })], { ledger: emptyLedger });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('no-track-slug');
  });

  it('skips a debunked theory', () => {
    const plan = planWeavingFilings([theory({ status: 'debunked' })], { ledger: emptyLedger });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('debunked');
  });

  it('skips a theory below the weaving mention floor', () => {
    const plan = planWeavingFilings([theory({ mentionCount: WEAVING_MENTION_FLOOR - 1 })], {
      ledger: emptyLedger,
    });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('below-weaving-mention-floor');
  });

  it('skips a theory already in the ledger', () => {
    const t = theory();
    const ledger = { ids: new Set([t.id]), issues: 1, complete: true };
    const plan = planWeavingFilings([t], { ledger });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('already-filed');
  });

  it('caps at max per run', () => {
    const rows = [
      theory({ id: 'a'.repeat(8) + '-1111-1111-1111-111111111111' }),
      theory({ id: 'b'.repeat(8) + '-1111-1111-1111-111111111111' }),
    ];
    const plan = planWeavingFilings(rows, { ledger: emptyLedger, max: 1 });
    expect(plan.toFile).toHaveLength(1);
    expect(plan.skipped[0].reason).toBe('over-per-run-cap');
  });

  it('refuses to file when the ledger is unavailable (fail closed)', () => {
    const plan = planWeavingFilings([theory()], { ledger: null, max: 10 });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.refuse).toMatch(/unavailable/);
  });

  it('refuses to file when the ledger listing may be truncated (fail closed)', () => {
    const ledger = { ids: new Set(), issues: 1000, complete: false };
    const plan = planWeavingFilings([theory()], { ledger, max: 10 });
    expect(plan.toFile).toHaveLength(0);
    expect(plan.refuse).toMatch(/truncated/);
  });
});

describe('theoryIdsIn / fingerprintMarker', () => {
  it('round-trips a theory id through the fingerprint marker', () => {
    const t = theory();
    const marker = fingerprintMarker(t.id);
    expect(theoryIdsIn([`some text ${marker} more text`])).toEqual(new Set([t.id]));
  });

  it('finds nothing in text with no marker', () => {
    expect(theoryIdsIn(['no marker here'])).toEqual(new Set());
  });
});

describe('issueBody', () => {
  it('carries the fingerprint marker for dedupe', () => {
    const t = theory();
    expect(issueBody(t)).toContain(fingerprintMarker(t.id));
  });

  it('states this is a lead, never the copy', () => {
    expect(issueBody(theory())).toMatch(/never the copy/);
  });

  it('restates the hard scope guardrail', () => {
    expect(issueBody(theory())).toMatch(/relationships, private life, sexuality, family, or identity/);
  });

  it('includes the track slug and mention count', () => {
    const t = theory({ trackSlug: 'cardigan', mentionCount: 12 });
    const body = issueBody(t);
    expect(body).toContain('`cardigan`');
    expect(body).toContain('12');
  });
});

describe('parseArgs', () => {
  it('defaults to dry run with max 10', () => {
    expect(parseArgs([])).toEqual({ fileMode: false, max: 10 });
  });

  it('parses --file and --max', () => {
    expect(parseArgs(['--file', '--max', '3'])).toEqual({ fileMode: true, max: 3 });
  });

  it('ignores a malformed --max and keeps the default', () => {
    expect(parseArgs(['--max', 'abc'])).toEqual({ fileMode: false, max: 10 });
  });
});
