#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';

export const REPLAY_PATH = 'docs/projects/tidewatch/replay/replay.json';
export const RELABELLED_PATH = 'docs/projects/tidewatch/replay/replay-relabelled.json';
export const REPORT_PATH = 'docs/projects/tidewatch/replay/replay-relabel-report.json';

const PROPERTY_TERMS = /\b(?:historic home|homes?|houses?|propert(?:y|ies)|real[- ]estate|residences?|mansions?|estates?)\b/i;
const NON_PROPERTY_HOME = /\bstay home\b/i;
const DETAIL_ONLY = /\b(?:pre-?orders?|premiere(?:\s+time)?|presales?|on-sale|schedule|tracklist)\b/i;
const NEW_WORK = /\b(?:albums?|singles?|songs?|music|tours?)\b/i;
const RELEASE_ACTION = /\b(?:announc\w*|releas\w*|drops?|arrives?|reveal\w*)\b/i;

export const RULES = [
  {
    id: 'property_privacy_redline',
    description: 'News stories about homes, property, real estate or residences become privacy_redline.',
  },
  {
    id: 'critical_new_official_work_only',
    description: 'critical_breaking is reserved for official announcements or releases of new music, albums or tours; premiere times, pre-orders and schedule details become official_drop.',
  },
];

function propertyStory(item) {
  const title = item.title ?? '';
  return item.kind === 'news_story' && PROPERTY_TERMS.test(title) && !NON_PROPERTY_HOME.test(title);
}

function actualNewOfficialWork(item) {
  const title = item.title ?? '';
  const official = item.meta?.verificationStatus === 'official' || item.answers?.q_official === true;
  return official && !DETAIL_ONLY.test(title) && NEW_WORK.test(title) && RELEASE_ACTION.test(title);
}

export function relabelItem(item) {
  if (propertyStory(item)) return { class: 'privacy_redline', rule: RULES[0].id };
  if (item.class === 'critical_breaking' && !actualNewOfficialWork(item)) {
    return { class: 'official_drop', rule: RULES[1].id };
  }
  return { class: item.class, rule: null };
}

function countClasses(items) {
  const counts = {};
  for (const item of items) counts[item.class] = (counts[item.class] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function relabelReplay(replay) {
  const changes = [];
  const items = replay.items.map((item) => {
    const next = relabelItem(item);
    if (next.class !== item.class) {
      changes.push({ id: item.id, oldLabel: item.class, newLabel: next.class, rule: next.rule });
    }
    return { id: item.id, class: next.class };
  });
  const countsByRule = Object.fromEntries(RULES.map((rule) => [
    rule.id,
    changes.filter((change) => change.rule === rule.id).length,
  ]));
  return {
    relabelled: {
      version: 1,
      source: REPLAY_PATH,
      frozenAt: replay.frozenAt,
      rules: RULES,
      counts: { total: items.length, byClass: countClasses(items) },
      items,
    },
    report: { version: 1, countsByRule, changes },
  };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  if (argv.length > 0) throw new Error('relabel-replay takes no arguments');
  const read = deps.readFile ?? readFile;
  const write = deps.writeFile ?? writeFile;
  const replay = JSON.parse(await read(REPLAY_PATH, 'utf8'));
  const output = relabelReplay(replay);
  await write(RELABELLED_PATH, `${JSON.stringify(output.relabelled)}\n`);
  await write(REPORT_PATH, `${JSON.stringify(output.report, null, 2)}\n`);
  (deps.log ?? console.log)(JSON.stringify(output.report.countsByRule));
  return output;
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-relabel-replay' });
