#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { factCheckStory } from './factcheck.mjs';

const REPLAY_PATH = 'docs/projects/tidewatch/replay/replay.json';
const RELABELLED_PATH = 'docs/projects/tidewatch/replay/replay-relabelled.json';
const OUTPUT_PATH = 'docs/projects/tidewatch/replay/factcheck-eval-results.json';
const FIXTURE_PATH = new URL('./fixtures/factcheck-source-pages.json', import.meta.url);

function fixtureKey(outlet) {
  const name = outlet.toLocaleLowerCase('en-US');
  return Object.keys(pages.outlets).find((key) => name.includes(key));
}

const pages = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));

function fixtureSource(item, outlet, index) {
  const claim = item.title ?? `Recorded official announcement ${item.id}`;
  const official = outlet?.tier === 'official';
  const page = official ? pages.official : pages.outlets[fixtureKey(outlet?.outlet ?? '')]
    ?? pages.unverified;
  const outletName = official ? page.outletName : (outlet?.outlet ?? 'Unverified fixture');
  const headline = `${outletName} confirms ${claim}`;
  return {
    storyId: item.id,
    rawItemId: `${item.id}:source:${index}`,
    externalId: `${item.id}:external:${index}`,
    title: headline,
    headline,
    snippet: null,
    dek: null,
    outletName,
    publisherUrl: page.publisherUrl ?? page.url,
    articleUrl: page.articleUrl ?? page.url,
    url: page.articleUrl ?? page.url,
    tier: official ? 'official' : (outlet?.tier ?? page.tier),
    articleText: `${headline} ${page.body} fixture-source-${index}`,
    repStatement: item.class === 'critical_personal' && /representative/i.test(claim),
  };
}

function fixtureStory(item) {
  let outlets = item.meta?.outlets ?? [];
  if (outlets.length === 0 && item.answers?.q_official === true) {
    outlets = [{ outlet: 'Taylor Swift official channel', tier: 'official' }];
  }
  return {
    storyId: item.id,
    claim: item.title ?? `Recorded official announcement ${item.id}`,
    classification: item.class,
    sources: outlets.map((outlet, index) => fixtureSource(item, outlet, index)),
  };
}

const fakeJudge = async () => ({ supportsProbability: 1, settledProbability: 1 });
const fakeVerifier = async () => ({ agreed: true, status: 'ok', reason: 'offline fixture' });

async function evaluateItems(items) {
  const outcomes = [];
  for (const item of items) {
    const result = await factCheckStory(fixtureStory(item), {
      judgeSource: fakeJudge,
      verify: fakeVerifier,
      recheckDelayMs: 0,
      recheckSleep: async () => undefined,
      forceFetchOnRecheck: false,
      fetchPaceMs: 0,
      now: '2026-10-15T00:00:00.000Z',
    });
    outcomes.push({ item, confirmed: result.verdict === 'confirmed' });
  }
  return outcomes;
}

function metric(outcomes, predicate) {
  const matches = outcomes.filter(({ item }) => predicate(item));
  return {
    confirmed: matches.filter(({ confirmed }) => confirmed).length,
    total: matches.length,
  };
}

export async function evaluateReplay(replay, labels) {
  const labelById = new Map(labels?.items.map((item) => [item.id, item.class]) ?? []);
  const items = replay.items.map((item) => ({ ...item, class: labelById.get(item.id) ?? item.class }));
  const outcomes = await evaluateItems(items);
  return {
    total: outcomes.length,
    critical: metric(outcomes, (item) => item.class.startsWith('critical_')),
    criticalWork: metric(outcomes, (item) => item.class === 'critical_breaking'),
    criticalPersonal: metric(outcomes, (item) => item.class === 'critical_personal'),
    rumor: metric(outcomes, (item) => item.class === 'rumor'),
    singleSource: metric(outcomes, (item) =>
      item.meta?.sourceCount === 1 && item.meta?.verificationStatus !== 'official'),
  };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  if (argv.length > 0) throw new Error('factcheck-eval takes no arguments');
  const read = deps.readFile ?? readFile;
  const replay = JSON.parse(await read(REPLAY_PATH, 'utf8'));
  const relabelled = JSON.parse(await read(RELABELLED_PATH, 'utf8'));
  const results = {
    version: 1,
    verifier: 'fake',
    network: false,
    original: await evaluateReplay(replay),
    relabelled: await evaluateReplay(replay, relabelled),
  };
  await (deps.writeFile ?? writeFile)(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`);
  (deps.log ?? console.log)(JSON.stringify(results));
  return results;
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-factcheck-eval' });
