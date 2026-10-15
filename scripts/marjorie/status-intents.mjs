// Cheap path for common questions on the permanent status issue. Jev selects
// one fixed intent; deterministic templates then answer only from the same
// live sources used by status-page.mjs. Anything uncertain stays with Claude.
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { choiceQuestion, createJevClient } from '../lib/jev.mjs';
import { gatherStatusData } from './lib/status-data.mjs';
import { findStatusIssue } from './lib/status-issue.mjs';
import { planSummary } from './lib/status-sections.mjs';
import { readPreserved } from './lib/status-render.mjs';
import { buildView } from './lib/status-view.mjs';
import { sortNeedsYou } from './lib/status-ha.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STRATEGY_URL = (repo) => `https://github.com/${repo}/blob/main/docs/strategy/growth-strategy.md`;
const ACTIONS_URL = (repo) => `https://github.com/${repo}/blob/main/HUMAN-ACTIONS.md`;

export const STATUS_INTENT_CONFIDENCE = 0.72;
export const STATUS_INTENTS = [
  { id: 'overview', label: 'Overall status, health, or a general update' },
  { id: 'needs_you', label: 'Blockers, decisions, or work waiting on the owner' },
  { id: 'next_up', label: 'Next priorities, weekly plan, or work in flight' },
  { id: 'shipped', label: 'Recently shipped changes or what changed' },
  { id: 'growth', label: 'Growth, traffic, followers, or whether growth is working' },
  { id: 'tree', label: 'Social posts, Tree output, or drafts awaiting approval' },
  { id: 'strategy', label: 'Growth strategy or how the site plans to grow' },
  { id: 'free_form', label: 'Action request, diagnosis, test, role question, or anything else' },
];

const QUESTION = choiceQuestion(
  'intent',
  'Classify the owner message by the single status-page intent it asks about. Use free_form whenever it asks to act, diagnose, change, approve, explain a specific issue, or is not plainly answered by one status section.',
  STATUS_INTENTS,
);

const linkedCount = (n, singular, plural, url) => `[${n} ${n === 1 ? singular : plural}](${url})`;
const clean = (value, cap = 180) => {
  const flat = String(value || '').replace(/[[\]`<>|*_~]/g, '').replace(/\s+/g, ' ').trim();
  return flat.length > cap ? `${flat.slice(0, cap - 1).trimEnd()}…` : flat;
};
const delta = (now, before) => (typeof before !== 'number' ? '' : ` (${now - before >= 0 ? '+' : ''}${now - before})`);

export async function classifyStatusIntent(text, client) {
  const result = await client.ask({
    caller: 'marjorie-status-intents',
    state: text,
    questions: [QUESTION],
  });
  const answer = result.answers.intent;
  if (answer?.type !== 'choice') throw new Error('Jev did not return a status intent choice');
  return { intent: answer.optionId, confidence: answer.confidence };
}

function sourceUnavailable(intent, warnings) {
  const required = {
    overview: ['HUMAN-ACTIONS.md', 'merged PRs', 'open PRs'],
    needs_you: ['HUMAN-ACTIONS.md'],
    next_up: ['weekly plan', 'open PRs'],
    shipped: ['merged PRs'],
    growth: ['growth metrics'],
    tree: ['published posts', 'open PRs'],
    strategy: [],
  }[intent] || [];
  return required.some((name) => warnings.includes(name));
}

export function buildStatusTemplate(intent, live) {
  const { data, view, issue, repo } = live;
  if (sourceUnavailable(intent, data.warnings || [])) return null;
  const statusUrl = issue.url;
  if (intent === 'overview') {
    const blocking = view.items.filter((item) => item.tag === 'BLOCKING').length;
    return `Right now the live page shows ${linkedCount(view.items.length, 'item waiting on you', 'items waiting on you', statusUrl)}, ${linkedCount(view.shipped.length, 'change shipped in 7 days', 'changes shipped in 7 days', statusUrl)}, and ${linkedCount(view.inFlight.length, 'PR in flight', 'PRs in flight', `${statusUrl}#next-up`)}. ${linkedCount(blocking, 'item', 'items', statusUrl)} are marked blocking; the status page has the current details and links.`;
  }
  if (intent === 'needs_you') {
    const items = sortNeedsYou(view.items);
    if (!items.length) return `Nothing is waiting on you right now. The [live status page](${statusUrl}) will show the next verified action as soon as one appears.`;
    const top = items.slice(0, 3).map((item) => `[#${item.number} ${clean(item.title, 90)}](${ACTIONS_URL(repo)}#${item.anchor})`).join(' · ');
    return `${linkedCount(items.length, 'item', 'items', statusUrl)} are waiting on you: ${top}. The linked instructions say exactly what counts as done; the status page has the full list.`;
  }
  if (intent === 'next_up') {
    const plan = data.plan;
    const summary = plan ? clean(planSummary(plan.body), 300) : '';
    const lead = plan ? `The current plan is [${clean(plan.title, 100)}](${plan.url})${summary ? `: ${summary}` : '.'}` : 'There is no open weekly plan right now.';
    return `${lead} There are ${linkedCount(view.inFlight.length, 'non-draft PR', 'non-draft PRs', `${statusUrl}#next-up`)} in flight on the live page.`;
  }
  if (intent === 'shipped') {
    if (!view.shipped.length) return `No non-housekeeping change has shipped in the last 7 days. The [live shipped section](${statusUrl}) updates hourly.`;
    const latest = view.shipped.slice(0, 3).map((pr) => `[#${pr.number} ${clean(pr.title, 90)}](${pr.url})`).join(' · ');
    return `${linkedCount(view.shipped.length, 'change', 'changes', statusUrl)} shipped in the last 7 days. Latest: ${latest}.`;
  }
  if (intent === 'growth') {
    const latest = data.metricsLatest;
    const prior = data.metricsPrior;
    const followers = ['instagram', 'x', 'facebook'].filter((key) => typeof latest?.followers?.[key] === 'number')
      .map((key) => `${key === 'x' ? 'X' : key[0].toUpperCase() + key.slice(1)} ${latest.followers[key]}${delta(latest.followers[key], prior?.followers?.[key])}`);
    const traffic = data.traffic ? ` Site traffic for the last 7 days is ${data.traffic.v} visitors and ${data.traffic.pv} pageviews.` : '';
    if (!followers.length && !data.traffic) return null;
    return `The latest [growth snapshot](${statusUrl}#growth) shows ${followers.join(' · ') || 'no follower totals yet'}.${traffic}`;
  }
  if (intent === 'tree') {
    const published = data.posted || [];
    const pending = data.draftPrs || [];
    return `Tree has ${linkedCount(published.length, 'post published in 7 days', 'posts published in 7 days', `${statusUrl}#tree`)} and ${linkedCount(pending.length, 'draft awaiting approval', 'drafts awaiting approval', `${statusUrl}#tree`)}. The live Tree section links the newest posts and every pending draft.`;
  }
  if (intent === 'strategy') {
    const bullets = (data.strategy?.bullets || []).slice(0, 3).map((line) => clean(line.replace(/^[-*]\s*/, ''), 150));
    if (!bullets.length) return null;
    return `The current strategy is: ${bullets.join(' · ')}. The [living strategy](${STRATEGY_URL(repo)}) and [weekly plan](${data.plan?.url || statusUrl}) are the sources of truth.`;
  }
  return null;
}

export async function loadLiveStatus({ api = ghApi, repo = DEFAULT_REPO, root = ROOT, now = Date.now() } = {}) {
  const issue = await findStatusIssue(api, repo);
  if (!issue) throw new Error('no open status-page issue');
  const data = await gatherStatusData({ api, repo, root, now, existingBody: issue.body || '', readPreserved });
  return { data, view: buildView(data, now), issue, repo };
}

export async function handleStatusRequest(context, {
  client, loadStatus = loadLiveStatus, postComment, repo = DEFAULT_REPO, log = console.log,
} = {}) {
  const match = await classifyStatusIntent(context.text, client);
  if (match.intent === 'free_form' || match.confidence < STATUS_INTENT_CONFIDENCE) {
    return { handled: false, reason: match.intent === 'free_form' ? 'free-form' : 'low-confidence', ...match };
  }
  const live = await loadStatus({ repo });
  const body = buildStatusTemplate(match.intent, live);
  if (!body) return { handled: false, reason: 'live-source-unavailable', ...match };
  await postComment(context.issue_number, body);
  log(`status intents: answered ${match.intent} at confidence ${match.confidence.toFixed(3)}`);
  return { handled: true, body, ...match };
}

function usageLogger(env, log) {
  return (usage) => {
    const line = `Jev usage: ${usage.caller} · input ${usage.inputTokens} · output ${usage.outputTokens} · estimated $${usage.estCostUsd.toFixed(8)}`;
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `\n- ${line}\n`);
    else log(line);
  };
}

const writeHandled = (env, handled) => {
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `handled=${handled ? 'true' : 'false'}\n`);
};

export async function main(argv = process.argv.slice(2), {
  env = process.env, clientFactory = createJevClient, loadStatus = loadLiveStatus, gh = ghRun, log = console.log,
} = {}) {
  const file = argv[0];
  if (!file) throw new Error('usage: status-intents.mjs <status-comment.json>');
  if (!env.TYPESAFE_API_KEY) {
    log('status intents: TYPESAFE_API_KEY is absent; using the Claude fallback');
    writeHandled(env, false);
    return 0;
  }
  try {
    const context = JSON.parse(readFileSync(file, 'utf8'));
    const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
    const client = clientFactory({ apiKey: env.TYPESAFE_API_KEY, logUsage: usageLogger(env, log) });
    const result = await handleStatusRequest(context, {
      client, loadStatus, repo, log,
      postComment: (number, body) => gh(['issue', 'comment', String(number), '--repo', repo, '--body', body]),
    });
    writeHandled(env, result.handled);
    if (!result.handled) log(`status intents: ${result.reason}; using the Claude fallback`);
  } catch (error) {
    writeHandled(env, false);
    log(`status intents: ${error instanceof Error ? error.message : String(error)}; using the Claude fallback`);
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-intents' });
}
