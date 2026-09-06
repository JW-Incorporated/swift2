import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file (same convention as reddit-rss.test.ts)
import {
  rankWeight,
  specificity,
  scoreLead,
  classifyRelevance,
  linkAllowed,
  selectDraftBatch,
  createRelayBudget,
  RELEVANCE_TIERS,
  DAILY_DRAFT_CAP,
  PER_COMMUNITY_DRAFT_CAP,
} from './relevance.mjs';

// 20 real-shape leads (card P1-4's "fixture of 20 real-shape leads"
// requirement) — a mix of Reddit hot-threads, replies-to-us, and Facebook
// leads, against a small fixture knowledge_doc corpus. Titles/context are
// invented-but-plausible fan discourse, never real user data.

const DOCS = [
  {
    id: 'doc:vault-track-1989-tv',
    title: "1989 (Taylor's Version) vault tracks",
    text: "Five vault tracks were released alongside 1989 (Taylor's Version), including Slut! and Suburban Legends, expanding the original 1989 track count.",
    symbols: ['vault', 'rerecording'],
  },
  {
    id: 'doc:eras-tour-surprise-songs',
    title: 'Eras Tour surprise song set',
    text: 'Each night of the Eras Tour, Taylor performs two surprise acoustic songs on guitar or piano, chosen fresh for that show.',
    symbols: ['eras-tour', 'surprise-song'],
  },
  {
    id: 'doc:folklore-cardigan-lyrics',
    title: 'Cardigan (Folklore) lyric breakdown',
    text: 'Cardigan is the lead single from Folklore, exploring a teenage love story told across three linked perspectives with Betty and August.',
    symbols: ['folklore', 'teenage-love-triangle'],
  },
  {
    id: 'doc:merch-friendship-bracelets',
    title: 'Friendship bracelet trading culture',
    text: 'Fans trade handmade friendship bracelets referencing lyrics outside Eras Tour venues, a tradition that began early in the tour.',
    symbols: ['eras-tour', 'fan-tradition'],
  },
];

function rankedFor(leadTokensDoc) {
  // Helper: put the given doc first, the rest after (already-ranked order).
  const rest = DOCS.filter((d) => d.id !== leadTokensDoc.id);
  return [leadTokensDoc, ...rest];
}

const LEADS = [
  // 1-2: reply_to_us, always drafted regardless of relevance
  {
    id: 'lead-01',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'reply_to_us',
    title: 'reply to our comment about vault tracks',
    context: "Someone replied asking which vault tracks were added to 1989 Taylor's Version.",
    status: 'new',
    symbols: ['vault'],
  },
  {
    id: 'lead-02',
    platform: 'reddit',
    community: 'SwiftlyNeutral',
    kind: 'reply_to_us',
    title: 'reply re surprise songs',
    context: 'A reply asking about how surprise songs are picked on the Eras Tour.',
    status: 'new',
    symbols: ['eras-tour'],
  },
  // 3-8: hot_thread, TaylorSwift sub, varying relevance
  {
    id: 'lead-03',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'What vault tracks were added to 1989 TV?',
    context:
      "Thread asking fans to list every vault track on 1989 (Taylor's Version), including Slut! and Suburban Legends.",
    status: 'new',
    symbols: ['vault', 'rerecording'],
  },
  {
    id: 'lead-04',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'How does Taylor pick surprise songs on the Eras Tour?',
    context: 'Fans discussing how surprise acoustic songs are chosen each night of the Eras Tour.',
    status: 'new',
    symbols: ['eras-tour', 'surprise-song'],
  },
  {
    id: 'lead-05',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Cardigan lyrics explained',
    context:
      'A deep dive into the teenage love triangle across Cardigan, August and Betty from Folklore.',
    status: 'new',
    symbols: ['folklore'],
  },
  {
    id: 'lead-06',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'General discussion thread',
    context: 'Open chat, no specific topic, just vibes today.',
    status: 'new',
    symbols: [],
  },
  {
    id: 'lead-07',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Best concert outfit ideas',
    context: 'What should I wear to the Eras Tour this weekend, need outfit inspo.',
    status: 'new',
    symbols: ['eras-tour'],
  },
  {
    id: 'lead-08',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Friendship bracelet trading tips',
    context:
      'Best beads and lyrics to use for trading friendship bracelets outside Eras Tour shows.',
    status: 'new',
    symbols: ['eras-tour', 'fan-tradition'],
  },
  // 9-11: same sub, over the per-community cap of 3 to exercise the cap
  {
    id: 'lead-09',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Another vault track question',
    context:
      "Which vault tracks came with 1989 Taylor's Version again? Slut! and Suburban Legends?",
    status: 'new',
    symbols: ['vault'],
  },
  {
    id: 'lead-10',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Yet another surprise song thread',
    context: 'Discussing surprise acoustic songs on guitar and piano during the Eras Tour again.',
    status: 'new',
    symbols: ['eras-tour', 'surprise-song'],
  },
  {
    id: 'lead-11',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Cardigan again',
    context: 'More Cardigan and Betty and August lyric analysis for Folklore.',
    status: 'new',
    symbols: ['folklore'],
  },
  // 12-14: SwiftlyNeutral sub, its own cap
  {
    id: 'lead-12',
    platform: 'reddit',
    community: 'SwiftlyNeutral',
    kind: 'hot_thread',
    title: 'Vault tracks on 1989 TV',
    context: "Daily discussion: which vault tracks were added to 1989 (Taylor's Version)?",
    status: 'new',
    symbols: ['vault'],
  },
  {
    id: 'lead-13',
    platform: 'reddit',
    community: 'SwiftlyNeutral',
    kind: 'hot_thread',
    title: 'Surprise songs discussion',
    context: 'How are surprise acoustic songs picked each night on the Eras Tour?',
    status: 'new',
    symbols: ['eras-tour'],
  },
  {
    id: 'lead-14',
    platform: 'reddit',
    community: 'SwiftlyNeutral',
    kind: 'digest',
    title: 'Weekly digest',
    context: 'Top posts this week in the sub, general recap, nothing specific.',
    status: 'new',
    symbols: [],
  },
  // 15-16: TaylorSwiftBookClub
  {
    id: 'lead-15',
    platform: 'reddit',
    community: 'TaylorSwiftBookClub',
    kind: 'hot_thread',
    title: 'Cardigan and Betty and August',
    context:
      'Book-club-style close reading of the Cardigan, August, Betty perspective trio from Folklore.',
    status: 'new',
    symbols: ['folklore', 'teenage-love-triangle'],
  },
  {
    id: 'lead-16',
    platform: 'reddit',
    community: 'TaylorSwiftBookClub',
    kind: 'hot_thread',
    title: 'Unrelated book discussion',
    context: 'This week we are discussing an unrelated novel, nothing about Taylor.',
    status: 'new',
    symbols: [],
  },
  // 17-18: Facebook (locator, no url)
  {
    id: 'lead-17',
    platform: 'facebook',
    community: "Taylor Swift's Vault",
    kind: 'hot_thread',
    locator: "Taylor Swift's Vault: which vault tracks came with 1989 TV?",
    title: 'Vault tracks question',
    context: "A member asked which vault tracks were added to 1989 (Taylor's Version).",
    status: 'new',
    symbols: ['vault'],
  },
  {
    id: 'lead-18',
    platform: 'facebook',
    community: 'Taylor Swift Friendship Bracelet Making and Trading NO SALES',
    kind: 'hot_thread',
    locator: 'Friendship Bracelet group: bead ideas for Eras Tour',
    title: 'Bracelet bead ideas',
    context:
      'A member asked for good beads and lyrics for trading friendship bracelets at the Eras Tour.',
    status: 'new',
    symbols: ['eras-tour', 'fan-tradition'],
  },
  // 19: already drafted, should never be re-selected
  {
    id: 'lead-19',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Already drafted vault thread',
    context: 'Vault track discussion already handled in a prior run.',
    status: 'drafted',
    symbols: ['vault'],
  },
  // 20: skipped_redline, should never be re-selected
  {
    id: 'lead-20',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'hot_thread',
    title: 'Redline-skipped thread',
    context: 'A thread that tripped the redline screen in a prior run.',
    status: 'skipped_redline',
    symbols: [],
  },
];

describe('rankWeight', () => {
  it('decays across the first six positions and floors at 0.1', () => {
    expect(rankWeight(0)).toBe(1);
    expect(rankWeight(1)).toBe(0.85);
    expect(rankWeight(5)).toBe(0.25);
    expect(rankWeight(6)).toBe(0.1);
    expect(rankWeight(50)).toBe(0.1);
  });
});

describe('specificity', () => {
  it('scores 0 for a lead with no usable tokens', () => {
    expect(specificity({ title: '', context: '' }, DOCS[0])).toBe(0);
  });

  it("scores high for a lead that closely matches a doc's vocabulary", () => {
    const s = specificity(LEADS[2], DOCS[0]); // lead-03 vs vault doc
    expect(s).toBeGreaterThan(0.3);
  });

  it('scores low for an off-topic lead against an unrelated doc', () => {
    const s = specificity(LEADS[5], DOCS[0]); // general discussion vs vault doc
    expect(s).toBeLessThan(0.2);
  });

  it('adds a bounded bonus for symbol overlap, capped at 1', () => {
    const withSymbols = specificity(
      { title: 'vault', context: 'vault', symbols: ['vault'] },
      { title: 'vault', text: 'vault', symbols: ['vault'] },
    );
    expect(withSymbols).toBeLessThanOrEqual(1);
  });
});

describe('scoreLead + classifyRelevance', () => {
  it('scores every fixture lead and classifies it into a known tier', () => {
    for (const lead of LEADS) {
      const ranked = rankedFor(DOCS[0]); // arbitrary ranking base; real caller supplies FTS order
      const { score, matchedDocIds } = scoreLead(lead, ranked);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(Array.isArray(matchedDocIds)).toBe(true);
      expect(Object.values(RELEVANCE_TIERS)).toContain(classifyRelevance(score));
    }
  });

  it('gives an on-topic lead a materially higher score than an off-topic one against the same corpus', () => {
    const onTopic = scoreLead(LEADS[2], DOCS); // lead-03: vault question
    const offTopic = scoreLead(LEADS[5], DOCS); // lead-06: general discussion
    expect(onTopic.score).toBeGreaterThan(offTopic.score);
  });

  it('returns a zero score with no candidates for an empty doc list', () => {
    expect(scoreLead(LEADS[0], [])).toEqual({ score: 0, matchedDocIds: [], bestDocId: null });
  });

  it('classifies at the documented thresholds', () => {
    expect(classifyRelevance(0.9)).toBe(RELEVANCE_TIERS.WITH_LINK);
    expect(classifyRelevance(0.75)).toBe(RELEVANCE_TIERS.WITH_LINK);
    expect(classifyRelevance(0.6)).toBe(RELEVANCE_TIERS.WITHOUT_LINK);
    expect(classifyRelevance(0.45)).toBe(RELEVANCE_TIERS.WITHOUT_LINK);
    expect(classifyRelevance(0.2)).toBe(RELEVANCE_TIERS.LOW_RELEVANCE);
    expect(classifyRelevance(0)).toBe(RELEVANCE_TIERS.LOW_RELEVANCE);
  });
});

describe('linkAllowed — the etiquette gate (§6.5)', () => {
  it('allows a link only when all three conditions hold', () => {
    expect(
      linkAllowed({ tier: RELEVANCE_TIERS.WITH_LINK, redditNonPromo: 20, allowsLinks: true }),
    ).toBe(true);
  });

  it('fails closed under the ledger threshold', () => {
    expect(
      linkAllowed({ tier: RELEVANCE_TIERS.WITH_LINK, redditNonPromo: 19, allowsLinks: true }),
    ).toBe(false);
  });

  it('fails closed when the watchlist disallows links', () => {
    expect(
      linkAllowed({ tier: RELEVANCE_TIERS.WITH_LINK, redditNonPromo: 25, allowsLinks: false }),
    ).toBe(false);
  });

  it('fails closed when allowsLinks was never verified (null, not false)', () => {
    expect(
      linkAllowed({ tier: RELEVANCE_TIERS.WITH_LINK, redditNonPromo: 25, allowsLinks: null }),
    ).toBe(false);
  });

  it('fails closed for a low-relevance tier regardless of ledger/watchlist', () => {
    expect(
      linkAllowed({ tier: RELEVANCE_TIERS.WITHOUT_LINK, redditNonPromo: 100, allowsLinks: true }),
    ).toBe(false);
  });

  it('treats a missing redditNonPromo as 0 (fails closed)', () => {
    expect(linkAllowed({ tier: RELEVANCE_TIERS.WITH_LINK, allowsLinks: true })).toBe(false);
  });
});

describe('selectDraftBatch — §2.5 step 7 caps', () => {
  it('always includes every reply_to_us lead', () => {
    const leadsWithRelevance = LEADS.map((l) => ({
      ...l,
      relevance: l.kind === 'hot_thread' ? 0.5 : undefined,
    }));
    const batch = selectDraftBatch(leadsWithRelevance);
    const replyIds = batch.filter((l) => l.kind === 'reply_to_us').map((l) => l.id);
    expect(replyIds).toEqual(['lead-01', 'lead-02']);
  });

  it('caps at 3 per community, excluding reply_to_us from that cap', () => {
    const leadsWithRelevance = LEADS.map((l, i) => ({ ...l, relevance: 1 - i * 0.01 }));
    const batch = selectDraftBatch(leadsWithRelevance);
    const perCommunity = new Map();
    for (const l of batch) {
      if (l.kind === 'reply_to_us') continue;
      perCommunity.set(l.community, (perCommunity.get(l.community) ?? 0) + 1);
    }
    for (const count of perCommunity.values()) {
      expect(count).toBeLessThanOrEqual(PER_COMMUNITY_DRAFT_CAP);
    }
  });

  it('never exceeds the daily cap of 12', () => {
    const leadsWithRelevance = LEADS.map((l, i) => ({ ...l, relevance: 1 - i * 0.01 }));
    const batch = selectDraftBatch(leadsWithRelevance);
    expect(batch.length).toBeLessThanOrEqual(DAILY_DRAFT_CAP);
  });

  it('never selects a lead whose status is not "new"', () => {
    const leadsWithRelevance = LEADS.map((l, i) => ({ ...l, relevance: 1 - i * 0.01 }));
    const batch = selectDraftBatch(leadsWithRelevance);
    const ids = batch.map((l) => l.id);
    expect(ids).not.toContain('lead-19'); // status: drafted
    expect(ids).not.toContain('lead-20'); // status: skipped_redline
  });

  it('picks the highest-relevance leads first within an over-quota community', () => {
    const leadsWithRelevance = LEADS.map((l) => ({
      ...l,
      relevance: l.id === 'lead-09' ? 0.9 : 0.5,
    }));
    const batch = selectDraftBatch(leadsWithRelevance);
    const taylorSwiftHotThreads = batch.filter(
      (l) => l.community === 'TaylorSwift' && l.kind === 'hot_thread',
    );
    expect(taylorSwiftHotThreads.map((l) => l.id)).toContain('lead-09');
  });

  it('respects custom caps passed by the caller', () => {
    const leadsWithRelevance = LEADS.map((l, i) => ({ ...l, relevance: 1 - i * 0.01 }));
    const batch = selectDraftBatch(leadsWithRelevance, { dailyCap: 3, perCommunityCap: 1 });
    expect(batch.length).toBeLessThanOrEqual(3);
  });
});

describe('createRelayBudget — §6.4 bounded home-relay use', () => {
  it('allows exactly the configured cap of calls, then refuses', () => {
    const budget = createRelayBudget(5);
    for (let i = 0; i < 5; i += 1) expect(budget.tryUse()).toBe(true);
    expect(budget.tryUse()).toBe(false);
    expect(budget.used).toBe(5);
    expect(budget.remaining).toBe(0);
  });

  it("defaults to the Answerer's documented cap of 5", () => {
    const budget = createRelayBudget();
    for (let i = 0; i < 5; i += 1) budget.tryUse();
    expect(budget.tryUse()).toBe(false);
  });

  it('tracks remaining correctly as calls are used', () => {
    const budget = createRelayBudget(3);
    expect(budget.remaining).toBe(3);
    budget.tryUse();
    expect(budget.remaining).toBe(2);
  });
});
