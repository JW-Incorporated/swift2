import { describe, expect, it, vi } from 'vitest';
import { factCheckStory } from './factcheck.mjs';
import { verifyWithSonnet } from './factcheck-judgment.mjs';

const CLAIM = 'Taylor Swift announces a new studio album';
const WORDS = {
  music: 'album studio producer track release artwork vinyl composer recording melody chorus bridge catalog credits launch worldwide midnight listening celebration',
  broadcast: 'newsroom editor correspondent interview statement publication bulletin audience camera desk report verified documents public record timestamp confirmation',
  fashion: 'designer runway garment collection fabric silhouette atelier season tailoring accessories showcase editorial photography style archive publication review',
};

function source(outletName, articleUrl, body = WORDS.music, overrides = {}) {
  const headline = `${outletName} confirms ${CLAIM}`;
  return {
    storyId: 'story-1',
    rawItemId: `raw-${outletName}`,
    externalId: `external-${outletName}`,
    title: headline,
    headline,
    snippet: null,
    dek: null,
    outletName,
    publisherUrl: new URL(articleUrl).origin,
    articleUrl,
    url: articleUrl,
    tier: 'established',
    articleText: `${headline} ${body}`,
    ...overrides,
  };
}

function story(classification, sources) {
  return { storyId: 'story-1', claim: CLAIM, classification, sources };
}

function dependencies(overrides = {}) {
  return {
    judgeSource: async () => ({ supportsProbability: 1, settledProbability: 1 }),
    verify: async () => ({ agreed: true, status: 'ok', reason: 'fixture' }),
    recheckSleep: async () => undefined,
    recheckDelayMs: 0,
    forceFetchOnRecheck: false,
    fetchPaceMs: 0,
    now: '2026-10-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('Tidewatch fact-check module', () => {
  it('confirms official critical work only after Sonnet agrees and marks the timeline', async () => {
    const markVerified = vi.fn();
    const official = source(
      'Taylor Swift official channel',
      'https://www.youtube.com/channel/UCqECaJ8Gagnn7YCbPEzWH6g',
      WORDS.music,
      { tier: 'official' },
    );
    const result = await factCheckStory(
      story('critical_breaking', [official]),
      dependencies({ markVerified }),
    );

    expect(result).toMatchObject({ verdict: 'confirmed', basis: 'official_source' });
    expect(markVerified).toHaveBeenCalledWith('story-1', '2026-10-15T00:00:00.000Z');
  });

  it('requires two established outlets with independent owners', async () => {
    const independent = await factCheckStory(story('critical_breaking', [
      source('Billboard', 'https://www.billboard.com/music/fixture', WORDS.music),
      source('BBC News', 'https://www.bbc.com/news/fixture', WORDS.broadcast),
    ]), dependencies());
    const penskeSisters = await factCheckStory(story('critical_breaking', [
      source('Billboard', 'https://www.billboard.com/music/fixture', WORDS.music),
      source('WWD', 'https://wwd.com/eye/fixture', WORDS.fashion),
    ]), dependencies());

    expect(independent).toMatchObject({
      verdict: 'confirmed',
      basis: 'two_independent_established_outlets',
    });
    expect(penskeSisters).toMatchObject({ verdict: 'not_confirmed', basis: 'code_bar_not_met' });
  });

  it('counts syndicated AP copies once through the P1-08c source grouping', async () => {
    const wire = `Associated Press syndicated report ${WORDS.broadcast} ${WORDS.music}`;
    const result = await factCheckStory(story('critical_breaking', [
      source('BBC News', 'https://www.bbc.com/news/wire-a', wire),
      source('Billboard', 'https://www.billboard.com/music/wire-b', `${wire} update`),
    ]), dependencies());

    expect(result).toMatchObject({ verdict: 'not_confirmed', basis: 'code_bar_not_met' });
    expect(result.sources).toHaveLength(1);
  });

  it('fails closed on a paywall, a weak citation, or Sonnet disagreement', async () => {
    const official = source(
      'Taylor Swift official channel',
      'https://www.youtube.com/channel/UCqECaJ8Gagnn7YCbPEzWH6g',
      WORDS.music,
      { tier: 'official' },
    );
    const paywall = await factCheckStory(
      story('critical_breaking', [{
        ...official,
        articleText: `${official.headline} Unlock this article to continue reading.`,
      }]),
      dependencies(),
    );
    const weak = await factCheckStory(story('critical_breaking', [official]), dependencies({
      judgeSource: async () => ({ supportsProbability: 0.79, settledProbability: 1 }),
    }));
    const disagreement = await factCheckStory(story('critical_breaking', [official]), dependencies({
      verify: async () => ({ agreed: false, status: 'ok', reason: 'conflict' }),
    }));

    expect(paywall.basis).toBe('code_bar_not_met');
    expect(weak.basis).toBe('code_bar_not_met');
    expect(disagreement.basis).toBe('sonnet_disagreed');
  });

  it('applies the personal-life official, rep, two-tier1, and re-check bar', async () => {
    const official = source('Taylor official site', 'https://www.taylorswift.com/news/fixture', WORDS.music, {
      tier: 'official',
    });
    const peopleRep = source('People', 'https://people.com/fixture', WORDS.fashion, {
      repStatement: true,
    });
    const bbc = source('BBC News', 'https://www.bbc.com/news/fixture', WORDS.broadcast);
    const reuters = source('Reuters', 'https://www.reuters.com/world/fixture', WORDS.music);

    await expect(factCheckStory(story('critical_personal', [official]), dependencies()))
      .resolves.toMatchObject({ verdict: 'confirmed', basis: 'official_source' });
    await expect(factCheckStory(story('critical_personal', [peopleRep]), dependencies()))
      .resolves.toMatchObject({ verdict: 'confirmed', basis: 'tier1_rep_statement' });
    await expect(factCheckStory(story('critical_personal', [bbc, reuters]), dependencies()))
      .resolves.toMatchObject({ verdict: 'confirmed', basis: 'two_independent_tier1_outlets' });
    await expect(factCheckStory(story('critical_personal', [bbc]), dependencies()))
      .resolves.toMatchObject({ verdict: 'not_confirmed', basis: 'code_bar_not_met' });
  });

  it('requires the ten-minute re-check to keep meeting the personal bar', async () => {
    const official = source('Taylor official site', 'https://www.taylorswift.com/news/fixture', WORDS.music, {
      tier: 'official',
    });
    const result = await factCheckStory(story('critical_personal', [official]), dependencies({
      recheckStory: async (input) => ({ ...input, sources: [] }),
    }));
    expect(result).toMatchObject({ verdict: 'not_confirmed', basis: 'personal_recheck_failed' });
  });

  it('never evaluates rumors or other non-critical classes', async () => {
    const result = await factCheckStory(story('rumor', [
      source('BBC News', 'https://www.bbc.com/news/fixture', WORDS.broadcast),
      source('Reuters', 'https://www.reuters.com/world/fixture', WORDS.music),
    ]), dependencies());
    expect(result).toEqual({ verdict: 'not_confirmed', basis: 'ineligible_class', sources: [] });
  });

  it('uses the subscription wrapper as a P0 Sonnet 5.5 structured call', async () => {
    const invoke = vi.fn().mockResolvedValue({
      status: 'ok',
      data: { verdict: 'confirmed', reason: 'supported' },
    });
    await verifyWithSonnet({ claim: CLAIM, sources: [] }, invoke);
    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
      caller: 'tidewatch-breaking-verifier',
      priority: 'P0',
      model: 'claude-sonnet-5-5',
      maxCalls: 10,
      schema: expect.any(Object),
    }));
  });
});
