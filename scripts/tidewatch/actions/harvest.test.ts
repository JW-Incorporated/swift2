import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routeDecisions } from '../route.mjs';
import {
  buildHarvestArtifact,
  loadHarvestQueue,
  mineHarvestedDuplicates,
  privacySafeClaudeCaller,
  runHarvestAction,
} from './harvest.mjs';

function chain(result: { data?: unknown; error?: unknown }) {
  const value: Record<string, unknown> = {
    then: (resolve: (resolved: typeof result) => void) => resolve(result),
  };
  for (const method of [
    'select', 'insert', 'eq', 'in', 'like', 'not', 'order', 'limit', 'maybeSingle', 'update', 'single',
  ]) {
    value[method] = () => value;
  }
  return value;
}

function theoryDb(inserted: Record<string, unknown>[]) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'symbol_lexicon') return chain({ data: [], error: null });
      if (table === 'theory_mined_bundle') return chain({ data: [], error: null });
      if (table === 'usage_daily') return chain({ data: null, error: null });
      if (table === 'fan_theory_candidate') {
        const value = chain({ data: null, error: null }) as Record<string, unknown>;
        value.maybeSingle = () => Promise.resolve({ data: null, error: null });
        value.insert = (row: Record<string, unknown>) => {
          inserted.push(row);
          return chain({ data: { id: `candidate-${inserted.length}` }, error: null });
        };
        return value;
      }
      throw new Error(`unexpected table ${table}`);
    }),
    rpc: vi.fn(() => chain({ error: null })),
  } as unknown as SupabaseClient;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('duplicate harvest action', () => {
  it('keeps shadow output byte-identical and never calls harvest', async () => {
    const record = vi.fn(async () => true);
    const harvest = vi.fn();
    const config = { classes: { duplicate: {
      enabled: true,
      thresholds: { act: 0.85 },
      action: { route: 'harvest_then_discard' },
    } } };
    await routeDecisions({
      decisions: [{ id: 'duplicate-1', class: 'duplicate', confidence: 1, answers: {},
        action_ref: null, watch_item: { story_id: null } }],
      store: { record }, config, live: false,
      actionHandlers: { harvest_then_discard: harvest }, actionRunners: {},
    });
    expect(harvest).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith('duplicate-1',
      '{"version":1,"class":"duplicate","impliedClass":"duplicate","state":"planned","actions":["harvest_then_discard"]}', null);
    expect(runHarvestAction({ class: 'duplicate' }, { live: false }))
      .toEqual({ acted: false, reason: 'router-not-live' });
    expect(runHarvestAction({ class: 'duplicate' }, { live: true }))
      .toEqual({ acted: true, action: 'harvest_then_discard', queued: true });
  });

  it('gives Facebook only counts and an existing our-words summary', () => {
    expect(buildHarvestArtifact([{
      platform: 'facebook', community: 'Swifties', postId: 'facebook-lead-1',
      title: 'Facebook duplicate discussion', summary: 'Fans noticed a recurring clock motif.',
      numComments: 17, permalink: 'https://facebook.example/member-post',
    }])).toEqual({ subreddits: [{ subreddit: 'facebook:Swifties', posts: [{
      postId: 'facebook-lead-1', title: 'Facebook duplicate discussion', numComments: 17,
      comments: [{ author: null, body: 'Fans noticed a recurring clock motif.' }],
    }] }] });
  });

  it('loads only unmined live-routed community duplicates into the home queue', async () => {
    const decisions = [
      { id: 'decision-reddit', action_ref: '{"routerStatus":"succeeded"}',
        watch_item: { source: 'reddit', source_ref: 'lead-reddit' } },
      { id: 'decision-facebook', action_ref: '{"routerStatus":"succeeded"}',
        watch_item: { source: 'facebook', source_ref: 'lead-facebook' } },
    ];
    const leads = [
      { id: 'lead-reddit', platform: 'reddit', community: 'reddit:TaylorSwift',
        thread_id: 'abc123', url: 'https://www.reddit.com/r/TaylorSwift/comments/abc123/clue/',
        title: 'Clue thread', context: null, reactions: null, num_comments: 12 },
      { id: 'lead-facebook', platform: 'facebook', community: 'facebook:Swifties',
        thread_id: null, url: 'https://www.facebook.com/groups/example/posts/1', title: null,
        context: 'Fans noticed a recurring clock motif.', reactions: 8, num_comments: 5 },
    ];
    const db = { from: vi.fn((table: string) => chain({
      data: table === 'watch_decision' ? decisions
        : table === 'engagement_lead' ? leads
          : [{ bundle_key: 'bundle:abc123:1' }],
      error: null,
    })) };

    await expect(loadHarvestQueue(db)).resolves.toEqual([{
      decisionId: 'decision-facebook', actionRef: '{"routerStatus":"succeeded"}',
      platform: 'facebook', sourceRef: 'lead-facebook',
      postId: 'facebook-lead-facebook', community: 'Swifties',
      title: 'Facebook duplicate discussion', summary: 'Fans noticed a recurring clock motif.',
      numComments: 13,
    }]);
  });

  it('calls Haiku only for Jev positives and stores no username or comment text', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const inserted: Record<string, unknown>[] = [];
    const shouldMine = vi.fn(async (post: { postId: string }) => post.postId === 'positive');
    const claude = vi.fn(async () => ({
      status: 'ok',
      data: { theories: [{
        name: 'Blue-star countdown',
        claim: 'SwiftieJane believes three blue stars form a countdown clue.',
        theory_key: 'swiftiejane-blue-star-countdown',
        evidence_summary: '@SwiftieJane connected the stars with the clock motif.',
        stance: 'believed',
      }], redline_flags: [] },
    }));
    const entries = [
      { platform: 'reddit', community: 'TaylorSwift', postId: 'positive', title: 'Clue thread',
        permalink: 'https://www.reddit.com/r/TaylorSwift/comments/positive/clue/', numComments: 4,
        comments: [{ author: null, body: 'u/SwiftieJane spotted three blue stars around the clock.' }] },
      { platform: 'reddit', community: 'TaylorSwift', postId: 'negative', title: 'Tour photos',
        permalink: 'https://www.reddit.com/r/TaylorSwift/comments/negative/photos/', numComments: 2,
        comments: [{ author: null, body: 'These photos are lovely.' }] },
    ];

    const result = await mineHarvestedDuplicates(theoryDb(inserted), entries, {
      createPrefilter: () => ({ shouldMine, stats: () => ({ calls: 2, capped: 0, cap: 40 }) }),
      createLoggedClaudeCaller: () => claude,
      loadStage: () => import('../../../apps/worker/src/extract/run-theory-miner-stage.ts'),
    });

    expect(result).toMatchObject({ bundlesConsidered: 2, prefiltered: 1, theoriesUpserted: 1 });
    expect(shouldMine).toHaveBeenCalledTimes(2);
    expect(claude).toHaveBeenCalledTimes(1);
    expect(inserted).toHaveLength(1);
    const stored = JSON.stringify(inserted[0]);
    expect(stored).not.toMatch(/SwiftieJane|spotted three blue stars around the clock/i);
    expect(inserted[0]).toMatchObject({
      claim: 'believes three blue stars form a countdown clue.',
      mention_count: 1,
      sample_urls: ['https://www.reddit.com/r/TaylorSwift/comments/positive/clue/'],
    });
  });

  it('drops a Haiku theory that copies a Reddit comment verbatim', async () => {
    const callClaude = vi.fn(async () => ({ status: 'ok', data: { theories: [{
      name: 'Copied theory',
      claim: 'The four blue stars around the clock predict a release.',
      theory_key: 'copied-theory',
      stance: 'believed',
    }] } }));
    const call = privacySafeClaudeCaller(callClaude, [{
      platform: 'reddit', comments: [{ author: null,
        body: 'The four blue stars around the clock predict a release.' }],
    }]);
    await expect(call({ system: 'Theory prompt' })).resolves.toMatchObject({
      status: 'ok', data: { theories: [] },
    });
  });
});
