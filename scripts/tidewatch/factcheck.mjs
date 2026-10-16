#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { createJevSourceJudge, verifyWithSonnet } from './factcheck-judgment.mjs';
import {
  checkSourceEvidence,
  codeBasis,
  publicSources,
  verifierSources,
} from './factcheck-sources.mjs';
import { loadStoredStory, markStoryVerified } from './factcheck-store.mjs';

const ELIGIBLE_CLASSES = new Set(['critical_breaking', 'critical_personal']);
const PERSONAL_RECHECK_MS = 10 * 60_000;
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function notConfirmed(basis, sources = []) {
  return { verdict: 'not_confirmed', basis, sources: publicSources(sources) };
}

function sourceOptions(deps, judgeSource, overrides = {}) {
  return {
    judgeSource,
    fetchArticle: deps.fetchArticle,
    sleep: deps.fetchSleep,
    paceMs: deps.fetchPaceMs,
    ...overrides,
  };
}

async function initialEvidence(story, deps) {
  let judgeSource = deps.judgeSource;
  if (!judgeSource) {
    try {
      judgeSource = createJevSourceJudge(deps.jevClient);
    } catch {
      return { error: 'citation_checker_unavailable' };
    }
  }
  try {
    const sources = await checkSourceEvidence(story, sourceOptions(deps, judgeSource));
    return { sources, judgeSource };
  } catch {
    return { error: 'source_check_unavailable' };
  }
}

async function recheckPersonal(story, deps, judgeSource) {
  await (deps.recheckSleep ?? pause)(deps.recheckDelayMs ?? PERSONAL_RECHECK_MS);
  let refreshed = story;
  if (deps.recheckStory) refreshed = await deps.recheckStory(story);
  return checkSourceEvidence(refreshed, sourceOptions(deps, judgeSource, {
    forceFetch: deps.forceFetchOnRecheck ?? true,
  }));
}

/** Inert fact-check library: it returns a verdict and never publishes or routes anything. */
export async function factCheckStory(story, deps = {}) {
  if (!story || !story.storyId || !story.claim || !Array.isArray(story.sources)) {
    return notConfirmed('invalid_story');
  }
  if (!ELIGIBLE_CLASSES.has(story.classification)) return notConfirmed('ineligible_class');
  const initial = await initialEvidence(story, deps);
  if (initial.error) return notConfirmed(initial.error);
  let sources = initial.sources;
  let basis = codeBasis(story.classification, sources);
  if (!basis) return notConfirmed('code_bar_not_met', sources);

  if (story.classification === 'critical_personal') {
    try {
      sources = await recheckPersonal(story, deps, initial.judgeSource);
    } catch {
      return notConfirmed('personal_recheck_unavailable', sources);
    }
    basis = codeBasis(story.classification, sources);
    if (!basis) return notConfirmed('personal_recheck_failed', sources);
  }

  const verify = deps.verify ?? ((input) => verifyWithSonnet(input, deps.callClaude));
  let verification;
  try {
    verification = await verify({
      claim: story.claim,
      classification: story.classification,
      codeBasis: basis,
      sources: verifierSources(sources),
    });
  } catch {
    return notConfirmed('sonnet_verifier_unavailable', sources);
  }
  if (!verification?.agreed) {
    return notConfirmed(
      verification?.status === 'ok' ? 'sonnet_disagreed' : 'sonnet_verifier_unavailable',
      sources,
    );
  }

  const verifiedAt = new Date(deps.now ?? Date.now()).toISOString();
  if (deps.markVerified) {
    try {
      await deps.markVerified(story.storyId, verifiedAt);
    } catch {
      return notConfirmed('timeline_write_failed', sources);
    }
  }
  return { verdict: 'confirmed', basis, sources: publicSources(sources) };
}

export async function factCheckStoredStory(input, deps = {}) {
  const story = await loadStoredStory(input.db, input.storyId, input.classification);
  return factCheckStory(story, {
    ...deps,
    markVerified: (storyId, verifiedAt) => markStoryVerified(input.db, storyId, verifiedAt),
  });
}

function parseArgs(argv) {
  if (argv.length === 2 && argv[0] === '--input') return { input: argv[1] };
  throw new Error('usage: node scripts/tidewatch/factcheck.mjs --input <story.json>');
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const story = JSON.parse(await readFile(path.resolve(options.input), 'utf8'));
  const result = await factCheckStory(story, deps);
  (deps.log ?? console.log)(JSON.stringify(result, null, 2));
  return result;
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-factcheck' });
