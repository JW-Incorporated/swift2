import { describe, expect, it } from 'vitest';
import { matchPredictions, buildResolutionsReport } from './theory-resolve.mjs';

const baseCandidate = {
  id: 'cand-1',
  claim: 'Fans believe the countdown clock predicts a new vault track.',
  symbols: ['13'],
  predicts: 'release',
  predictedDate: '2026-09-01',
};

const baseMoment = {
  id: 'moment:tloas:vault-track-drop',
  title: 'Vault track drop announced',
  date: '2026-09-03',
  symbols: ['13', 'butterfly'],
};

describe('matchPredictions', () => {
  it('matches a candidate to a moment sharing a symbol on/after the predicted date', () => {
    const matches = matchPredictions([baseCandidate], [baseMoment]);
    expect(matches).toHaveLength(1);
    expect(matches[0].candidate.id).toBe('cand-1');
    expect(matches[0].moment.id).toBe(baseMoment.id);
  });

  it('does not match when there is no shared symbol', () => {
    const moment = { ...baseMoment, symbols: ['snake'] };
    expect(matchPredictions([baseCandidate], [moment])).toHaveLength(0);
  });

  it('does not match a moment far before the predicted date (outside the grace window)', () => {
    const moment = { ...baseMoment, date: '2026-01-01' };
    expect(matchPredictions([baseCandidate], [moment])).toHaveLength(0);
  });

  it('does not match a moment far after the predicted date (outside the upper grace window)', () => {
    const moment = { ...baseMoment, date: '2027-06-01' }; // ~9 months after predicted_date
    expect(matchPredictions([baseCandidate], [moment])).toHaveLength(0);
  });

  it('matches a moment slightly before the predicted date (within the grace window)', () => {
    const moment = { ...baseMoment, date: '2026-08-25' }; // 7 days before predicted_date
    expect(matchPredictions([baseCandidate], [moment])).toHaveLength(1);
  });

  it('picks the closest-dated match, not the first one in the list', () => {
    const far = { ...baseMoment, id: 'moment:far', date: '2026-09-20' }; // 19 days after
    const near = { ...baseMoment, id: 'moment:near', date: '2026-09-02' }; // 1 day after
    const matches = matchPredictions([baseCandidate], [far, near]);
    expect(matches).toHaveLength(1);
    expect(matches[0].moment.id).toBe('moment:near');
  });

  it('skips candidates with no predicts/predicted_date set', () => {
    const noPrediction = { ...baseCandidate, predicts: null, predictedDate: null };
    expect(matchPredictions([noPrediction], [baseMoment])).toHaveLength(0);
  });

  it('skips a moment with no date', () => {
    const moment = { ...baseMoment, date: null };
    expect(matchPredictions([baseCandidate], [moment])).toHaveLength(0);
  });
});

describe('buildResolutionsReport', () => {
  it('renders an honest empty state with zero matches', () => {
    const report = buildResolutionsReport({ matches: [], generatedAt: '2026-09-07T00:00:00.000Z' });
    expect(report).toContain('No new resolutions this run.');
  });

  it('renders one row per match with the theory, prediction and moment', () => {
    const report = buildResolutionsReport({
      matches: [{ candidate: baseCandidate, moment: baseMoment }],
      generatedAt: '2026-09-07T00:00:00.000Z',
    });
    expect(report).toContain('release');
    expect(report).toContain('2026-09-01');
    expect(report).toContain(baseMoment.title);
    expect(report).toContain(baseMoment.id);
  });
});
