#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';

export const REPLAY_PATH = 'docs/projects/tidewatch/replay/replay.json';
export const RELABELLED_PATH = 'docs/projects/tidewatch/replay/replay-relabelled.json';
export const REPORT_PATH = 'docs/projects/tidewatch/replay/replay-relabel-report.json';

const PROPERTY_TERMS = /\b(?:homes?|houses?|propert(?:y|ies)|real[- ]estate|residences?|mansions?|estates?)\b/i;
const TAYLOR_POSSESSIVE = /\bTaylor Swift(?:'s|\u2019s)\b/i;
const TAYLOR_AND_PARTNER = /\b(?:Taylor Swift.{0,40}(?:Travis )?Kelce|Swift.{0,40}Kelce|(?:Travis )?Kelce.{0,40}(?:Taylor )?Swift)\b/i;
const QUOTED_WORK_PROPERTY = /\bTaylor Swift(?:'s|\u2019s)\s+['"\u2018\u201c].+?['"\u2019\u201d]\s+(?:home|house|property|estate)\b/i;
const DETAIL_ONLY = /\b(?:pre-?orders?|premiere(?:\s+times?)?|presales?|on-sale|schedules?|tracklists?|merch(?:andise)?|festivals?)\b/i;
const NEW_WORK = /\b(?:albums?|singles?|songs?|tracks?|tours?|films?|music videos?)\b/i;
const RELEASE_ACTION = /\b(?:announc\w*|releas\w*|drops?|arrives?|reveal\w*)\b/i;

export const RULES = [
  {
    id: 'property_privacy_redline',
    description: "News stories about Taylor Swift's own or shared homes, property, real estate or residences become privacy_redline.",
  },
  {
    id: 'critical_new_official_work_only',
    description: 'critical_breaking is reserved by event type for announcements or releases of new songs, albums, tours or films; premiere times, pre-orders, schedules, merch and festival line-ups become official_drop.',
  },
];

function propertyStory(item) {
  const title = item.title ?? '';
  return item.kind === 'news_story' && !QUOTED_WORK_PROPERTY.test(title) &&
    PROPERTY_TERMS.test(title) &&
    (TAYLOR_POSSESSIVE.test(title) || TAYLOR_AND_PARTNER.test(title));
}

function actualNewWork(item) {
  const title = item.title ?? '';
  return !DETAIL_ONLY.test(title) && NEW_WORK.test(title) && RELEASE_ACTION.test(title);
}

export function relabelItem(item) {
  if (!item.title?.trim()) return { class: item.class, rule: null };
  if (propertyStory(item)) return { class: 'privacy_redline', rule: RULES[0].id };
  if (item.class === 'critical_breaking' && !actualNewWork(item)) {
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
