#!/usr/bin/env node
// E3 Match Auditor — unscheduled authoring lane. This is the only E3 script
// permitted to call the vision model; the scheduled detector remains zero-LLM.
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { tierForScore } from './audit-matches.mjs';

export const MODEL = 'claude-sonnet-5';
export const MAX_RUN_COST_USD = 5;
export const RESERVATION_PER_PAIR_USD = ((2 * 4_784 + 512) * 3 + 256 * 15) / 1_000_000;
export const CAP_STOP_REASON = 'run cap would be reached before next request';

const ANTHROPIC_VERSION = '2023-06-01';
const execFileAsync = promisify(execFile);
const THINKING = { type: 'disabled' };
const KINDS = new Set([
  'dress',
  'top',
  'bottom',
  'outerwear',
  'knitwear',
  'shoes',
  'jewelry',
  'bag',
  'hat',
  'eyewear',
  'beauty',
  'accessory',
  'music',
  'collectible',
  'home',
  'other',
]);

const AUDIT_TOOL = {
  name: 'record_match_judgment',
  description:
    'Record one evidence-based visual comparison of a product image and a source-moment image.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'number', minimum: 0, maximum: 100 },
      kind: { type: 'string', enum: [...KINDS] },
      reasons: {
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
    },
    required: ['score', 'kind', 'reasons'],
  },
};

function unresolved(pair, reason) {
  return {
    productId: pair.productId,
    cacheKey: pair.cacheKey ?? null,
    productUrl: pair.productUrl ?? null,
    productImageUrl: pair.productImageUrl ?? null,
    momentImageUrl: pair.momentImageUrl ?? null,
    score: null,
    tier: 'unresolved',
    kind: null,
    reasons: [reason],
  };
}

function isResolved(judgment) {
  return (
    Number.isFinite(judgment?.score) &&
    judgment.score >= 0 &&
    judgment.score <= 100 &&
    typeof judgment.kind === 'string' &&
    KINDS.has(judgment.kind) &&
    Array.isArray(judgment.reasons) &&
    judgment.reasons.length > 0 &&
    ['exact', 'close', 'similar', 'inspired', 'mismatch'].includes(judgment.tier)
  );
}

function normalizeJudgment(pair, response) {
  if (!response || typeof response !== 'object') return null;
  if (!Number.isFinite(response.score) || response.score < 0 || response.score > 100) return null;
  if (typeof response.kind !== 'string' || !KINDS.has(response.kind)) return null;
  if (
    !Array.isArray(response.reasons) ||
    response.reasons.length === 0 ||
    response.reasons.some((reason) => typeof reason !== 'string' || !reason.trim())
  )
    return null;
  return {
    productId: pair.productId,
    cacheKey: pair.cacheKey,
    productUrl: pair.productUrl ?? null,
    productImageUrl: pair.productImageUrl,
    momentImageUrl: pair.momentImageUrl,
    score: response.score,
    tier: tierForScore(response.score),
    kind: response.kind,
    reasons: response.reasons.map((reason) => reason.trim()),
  };
}

function eligible(pair) {
  return (
    typeof pair?.cacheKey === 'string' &&
    pair.cacheKey &&
    typeof pair.productImageUrl === 'string' &&
    pair.productImageUrl &&
    typeof pair.momentImageUrl === 'string' &&
    pair.momentImageUrl
  );
}

export function requiresApiKey(receipt, queue) {
  const receiptByProduct = new Map(
    (Array.isArray(receipt?.judgments) ? receipt.judgments : []).map((judgment) => [
      judgment.productId,
      judgment,
    ]),
  );
  return (Array.isArray(queue?.queue) ? queue.queue : []).some((queued) =>
    eligible({ ...receiptByProduct.get(queued.productId), ...queued }),
  );
}

export function capIssueContent(artifact) {
  if (artifact?.run?.stopReason !== CAP_STOP_REASON) return null;
  const remaining = (artifact.judgments ?? []).filter((judgment) =>
    judgment.reasons?.includes('not judged before run cap'),
  );
  return {
    title: 'E3 vision judgment: pairs remaining after run cap',
    body: [
      'The E3 authoring runner stopped before the next pre-call reservation would reach its cap.',
      '',
      `Cap: $${artifact.run.capUsd}; reserved: $${artifact.run.reservedCostUsd}; completed: ${artifact.run.completedJudgments}.`,
      '',
      'Remaining detector pairs:',
      ...remaining.map(
        (judgment) => `- ${judgment.productId} (${judgment.cacheKey ?? 'no cache key'})`,
      ),
    ].join('\n'),
  };
}

export async function upsertCapIssue(
  content,
  { execImpl = (args) => execFileAsync('gh', args) } = {},
) {
  if (!content) return null;
  const search = await execImpl([
    'issue',
    'list',
    '--search',
    `"${content.title}" in:title`,
    '--state',
    'open',
    '--json',
    'number,url,title',
  ]);
  const issues = JSON.parse(search.stdout || '[]');
  const existing = issues.find((issue) => issue.title === content.title);
  if (existing) {
    await execImpl(['issue', 'comment', String(existing.number), '--body', content.body]);
    return existing.url;
  }
  const created = await execImpl([
    'issue',
    'create',
    '--title',
    content.title,
    '--body',
    content.body,
  ]);
  return created.stdout.trim();
}

function unavailableReason(pair) {
  if (!pair?.productImageUrl) return 'product image unavailable';
  if (!pair?.momentImageUrl) return 'moment image unavailable';
  return 'detector pair cache key unavailable';
}

function toolInput(body) {
  const content = body?.content;
  if (!Array.isArray(content)) return null;
  return (
    content.find((block) => block?.type === 'tool_use' && block.name === AUDIT_TOOL.name)?.input ??
    null
  );
}

export async function judgePairWithClaude(pair, { apiKey, fetchImpl = fetch }) {
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      thinking: THINKING,
      tools: [AUDIT_TOOL],
      tool_choice: { type: 'tool', name: AUDIT_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: pair.productImageUrl } },
            { type: 'image', source: { type: 'url', url: pair.momentImageUrl } },
            {
              type: 'text',
              text: 'Compare the product image first with the source-moment photo second. Score visual match from 0 to 100 using silhouette, color or pattern, garment type, and notable details. Return only the required judgment tool input; do not infer details not visible in the images.',
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`anthropic vision request failed (${response.status})`);
  return toolInput(await response.json());
}

export async function runAuthoring({ receipt, queue, judge, capUsd = MAX_RUN_COST_USD }) {
  if (!receipt || typeof receipt !== 'object') throw new Error('receipt must be an object');
  if (!queue || !Array.isArray(queue.queue))
    throw new Error('detector queue must contain a queue array');
  if (!Number.isFinite(capUsd) || capUsd <= 0 || capUsd > MAX_RUN_COST_USD)
    throw new Error(`capUsd must be greater than zero and at most ${MAX_RUN_COST_USD}`);

  const receiptJudgments = Array.isArray(receipt.judgments) ? receipt.judgments : [];
  const receiptByProduct = new Map(
    receiptJudgments.map((judgment) => [judgment.productId, judgment]),
  );
  const cached = new Map();
  const attempted = new Set();
  for (const judgment of receiptJudgments) {
    if (judgment?.cacheKey && isResolved(judgment)) cached.set(judgment.cacheKey, judgment);
  }

  let reservedCostUsd = 0;
  let completedJudgments = 0;
  let eligibleCount = 0;
  let stoppedAtCap = false;
  const judgments = [];

  for (const queued of queue.queue) {
    const pair = { ...receiptByProduct.get(queued.productId), ...queued };
    if (!eligible(pair)) {
      judgments.push(unresolved(pair, unavailableReason(pair)));
      continue;
    }
    eligibleCount += 1;
    const existing = cached.get(pair.cacheKey);
    if (existing) {
      judgments.push({
        ...pair,
        score: existing.score,
        tier: existing.tier,
        kind: existing.kind,
        reasons: existing.reasons,
      });
      completedJudgments += 1;
      continue;
    }
    if (attempted.has(pair.cacheKey)) {
      judgments.push(unresolved(pair, 'same detector pair was unresolved'));
      continue;
    }
    // Reserve before invoking the network. Equality stops too: the cap is a
    // circuit breaker, not a target to fill.
    if (reservedCostUsd + RESERVATION_PER_PAIR_USD >= capUsd) {
      stoppedAtCap = true;
      judgments.push(unresolved(pair, 'not judged before run cap'));
      continue;
    }
    reservedCostUsd += RESERVATION_PER_PAIR_USD;
    attempted.add(pair.cacheKey);
    try {
      const normalized = normalizeJudgment(pair, await judge(pair));
      if (!normalized) {
        judgments.push(unresolved(pair, 'invalid judgment response'));
        continue;
      }
      cached.set(pair.cacheKey, normalized);
      judgments.push(normalized);
      completedJudgments += 1;
    } catch {
      judgments.push(unresolved(pair, 'vision request failed'));
    }
  }

  const unresolvedCount = judgments.filter((judgment) => judgment.tier === 'unresolved').length;
  const stopReason =
    eligibleCount === 0 ? 'no eligible image pairs' : stoppedAtCap ? CAP_STOP_REASON : null;
  return {
    schemaVersion: 1,
    providerModel: MODEL,
    thinking: 'disabled',
    status: unresolvedCount === 0 ? 'complete' : 'partial',
    detectorReceipt: receipt.detectorReceipt,
    run: {
      capUsd,
      reservedCostUsd,
      observedCostUsd: null,
      stopReason,
      completedJudgments,
    },
    judgments,
    unscored: receipt.unscored ?? [],
    summary: {
      queued: receipt.detectorReceipt?.queued ?? judgments.length,
      resolved: completedJudgments,
      unresolved: unresolvedCount,
    },
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function argValue(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const receiptPath = argValue(args, '--receipt');
  const queuePath = argValue(args, '--queue');
  const writePath = argValue(args, '--write');
  if (!receiptPath || !queuePath || !writePath) {
    throw new Error(
      'usage: audit-matches-authoring.mjs --receipt receipt.json --queue queue.json --write judged.json',
    );
  }
  const receipt = await readJson(resolve(receiptPath));
  const queue = await readJson(resolve(queuePath));
  if (requiresApiKey(receipt, queue) && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required when eligible image pairs are present');
  }
  const artifact = await runAuthoring({
    receipt,
    queue,
    judge: (pair) => judgePairWithClaude(pair, { apiKey: process.env.ANTHROPIC_API_KEY }),
  });
  const issue = capIssueContent(artifact);
  let issueError = null;
  if (issue) {
    try {
      artifact.run.followUpIssue = await upsertCapIssue(issue);
    } catch (error) {
      artifact.run.followUpIssue = null;
      issueError = error instanceof Error ? error.message : String(error);
    }
  }
  const target = resolve(writePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  if (issueError) {
    console.error(`merch-audit-authoring: failed to file cap follow-up issue: ${issueError}`);
    process.exitCode = 1;
  }
  console.log(
    JSON.stringify({
      status: artifact.status,
      reservedCostUsd: artifact.run.reservedCostUsd,
      completedJudgments: artifact.run.completedJudgments,
      stopReason: artifact.run.stopReason,
    }),
  );
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-audit-authoring: ${error.message}`);
    process.exitCode = 1;
  });
}
