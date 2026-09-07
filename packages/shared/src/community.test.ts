import { describe, expect, it } from 'vitest';
import {
  COMMUNITY_PLATFORMS,
  ENGAGEMENT_LEAD_KINDS,
  ENGAGEMENT_LEAD_STATUSES,
  FAN_THEORY_PREDICTS,
  FAN_THEORY_STANCES,
  FAN_THEORY_CANDIDATE_STATUSES,
  type CommunityWatchlistEntry,
  type EngagementLead,
  type CommunityPostLedgerEntry,
  type FanTheoryCandidate,
} from './community';

// Mirrors the CHECK constraints in
// supabase/migrations/20260917000000_community_engine.sql by hand (same
// convention as current-types.test.ts's absence — this repo type-checks
// shapes via constructed fixtures, not a schema-reflection test).

describe('community engine enums', () => {
  it('lists both platforms', () => {
    expect(COMMUNITY_PLATFORMS).toEqual(['reddit', 'facebook']);
  });

  it('lists the four engagement_lead kinds', () => {
    expect(ENGAGEMENT_LEAD_KINDS).toEqual(['alert', 'digest', 'hot_thread', 'reply_to_us']);
  });

  it('lists the seven engagement_lead statuses (including P1-5\'s founder-skip outcome)', () => {
    expect(ENGAGEMENT_LEAD_STATUSES).toEqual([
      'new',
      'drafted',
      'emailed',
      'posted',
      'skipped_redline',
      'skipped_low_relevance',
      'skipped_by_founder',
    ]);
  });

  it('lists the seven fan_theory_candidate.predicts values', () => {
    expect(FAN_THEORY_PREDICTS).toEqual([
      'release',
      're-record',
      'setlist',
      'feature',
      'title',
      'date',
      'other',
    ]);
  });

  it('lists the three stance values', () => {
    expect(FAN_THEORY_STANCES).toEqual(['believed', 'contested', 'debunked_by_fans']);
  });

  it('lists the four candidate pipeline statuses', () => {
    expect(FAN_THEORY_CANDIDATE_STATUSES).toEqual(['candidate', 'accepted', 'merged', 'rejected']);
  });
});

describe('community engine shapes', () => {
  it('builds a minimal CommunityWatchlistEntry', () => {
    const entry: CommunityWatchlistEntry = {
      id: 'reddit:TaylorSwift',
      platform: 'reddit',
      name: 'TaylorSwift',
      scan: true,
      crawl: true,
    };
    expect(entry.allowsLinks).toBeUndefined();
  });

  it('builds a minimal EngagementLead (facebook, no thread id)', () => {
    const lead: EngagementLead = {
      id: 'lead-1',
      platform: 'facebook',
      community: "Taylor Swift's Vault",
      kind: 'hot_thread',
      locator: "Taylor Swift's Vault: someone asked about the vinyl variant...",
      matchedDocIds: [],
      status: 'new',
      redlineOk: false,
    };
    expect(lead.threadId).toBeUndefined();
    expect(lead.url).toBeUndefined();
  });

  it('builds a minimal CommunityPostLedgerEntry', () => {
    const row: CommunityPostLedgerEntry = {
      id: 'row-1',
      platform: 'reddit',
      community: 'TaylorSwift',
      linkIncluded: false,
      postedAt: '2026-09-06T00:00:00Z',
    };
    expect(row.leadId).toBeUndefined();
  });

  it('builds a minimal FanTheoryCandidate', () => {
    const candidate: FanTheoryCandidate = {
      id: 'candidate-1',
      claim: 'Fans believe a vault track references the tour setlist order.',
      theoryKey: '1989-tv-vault-track-count',
      symbols: ['vault'],
      firstSeenOn: '2026-09-01',
      lastSeenOn: '2026-09-06',
      mentionCount: 12,
      peakScore: 0.8,
      communities: ['TaylorSwift'],
      stance: 'contested',
      status: 'candidate',
      redlineOk: true,
      sampleUrls: [],
    };
    expect(candidate.sampleUrls.length).toBeLessThanOrEqual(3);
  });
});
