#!/usr/bin/env node
// E3 Match Auditor — unscheduled authoring lane. This is the only E3 script
// permitted to call the vision model; the scheduled detector remains zero-LLM.
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { auditCacheKey, tierForScore } from './audit-matches.mjs';
import { extractReplacementImage } from './verify-images.mjs';

export const MODEL = 'claude-sonnet-5';
export const MAX_RUN_COST_USD = 5;
export const TRANSIENT_RETRY_ATTEMPTS = 3;
export const RESERVATION_PER_REQUEST_USD = ((2 * 4_784 + 512) * 3 + 256 * 15) / 1_000_000;
export const RESERVATION_PER_PAIR_USD = RESERVATION_PER_REQUEST_USD * TRANSIENT_RETRY_ATTEMPTS;
export const CAP_STOP_REASON = 'run cap would be reached before next request';
export const RETAILER_FETCH_TIMEOUT_MS = 10_000;
export const HYDRATION_BUDGET_MS = 5 * 60_000;
export const IMAGE_FETCH_TIMEOUT_MS = 10_000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ANTHROPIC_VERSION = '2023-06-01';
const execFileAsync = promisify(execFile);
const THINKING = { type: 'disabled' };
const SUPPORTED_IMAGE_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
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
    response.reasons.length < 1 ||
    response.reasons.length > 4 ||
    response.reasons.some(
      (reason) => typeof reason !== 'string' || !reason.trim() || reason.trim().length > 240,
    )
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
  return (Array.isArray(queue?.queue) ? queue.queue : []).some((queued) => {
    const pair = { ...receiptByProduct.get(queued.productId), ...queued };
    return eligible(pair) || (typeof pair.productUrl === 'string' && !!pair.momentImageUrl);
  });
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

/**
 * Spec P2 (issue #3447): a below-25 `mismatch` must not stay in place. This
 * builds one E6 re-source ticket per demoted product carrying the auditor's
 * own reasons, so a human/E6 lane can find a replacement candidate without
 * re-deriving why the original was rejected. Filed the same way as the cap
 * follow-up issue (one exact-title issue, reused via comment on repeat runs)
 * so re-running authoring never spawns duplicate tickets.
 */
export function reSourceIssueContent(artifact) {
  const demotions = Array.isArray(artifact?.demotions) ? artifact.demotions : [];
  if (demotions.length === 0) return null;
  return {
    title: 'E3 vision judgment: products demoted below match-tier floor',
    body: [
      'The E3 auditor scored these products below 25 (mismatch) against their',
      'source moment photo. Per spec P2, they must be removed from the',
      "moment's products and re-sourced — do not restore the same listing",
      'without a new, higher-scoring vision judgment.',
      '',
      ...demotions.map((demotion) => {
        const reasons = Array.isArray(demotion.auditorReasons)
          ? demotion.auditorReasons.map((reason) => `  - ${reason}`).join('\n')
          : '  - (reasons not attached)';
        return [
          `- ${demotion.productId}`,
          `  url: ${demotion.url ?? '(unknown)'}`,
          reasons,
        ].join('\n');
      }),
    ].join('\n'),
  };
}

function unavailableReason(pair) {
  if (!pair?.productImageUrl) return 'product image unavailable';
  if (!pair?.momentImageUrl) return 'moment image unavailable';
  return 'detector pair cache key unavailable';
}

export async function retailerOgImage(
  productUrl,
  { fetchImpl = fetch, timeoutMs = RETAILER_FETCH_TIMEOUT_MS } = {},
) {
  if (typeof productUrl !== 'string' || !productUrl) return null;
  const response = await fetchImpl(productUrl, {
    method: 'GET',
    redirect: 'follow',
    signal: globalThis.AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return null;
  const imageUrl = extractReplacementImage(await response.text());
  return typeof imageUrl === 'string' && imageUrl.startsWith('https://') ? imageUrl : null;
}

function toolInput(body) {
  const content = body?.content;
  if (!Array.isArray(content)) return null;
  return (
    content.find((block) => block?.type === 'tool_use' && block.name === AUDIT_TOOL.name)?.input ??
    null
  );
}

function imageFailure(message, status = null) {
  return new Error(status ? `image source ${message} (HTTP ${status})` : `image source ${message}`);
}

async function imageContent(url, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: globalThis.AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS),
    });
  } catch {
    throw imageFailure('unavailable');
  }
  if (!response.ok) throw imageFailure('unavailable', response.status);
  const mediaType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (!SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType)) throw imageFailure('unsupported');
  const declaredSize = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES)
    throw imageFailure('too large');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw imageFailure('too large');
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: Buffer.from(bytes).toString('base64') },
  };
}

export async function judgePairWithClaude(pair, { apiKey, fetchImpl = fetch }) {
  const [productImage, momentImage] = await Promise.all([
    imageContent(pair.productImageUrl, fetchImpl),
    imageContent(pair.momentImageUrl, fetchImpl),
  ]);
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
            productImage,
            momentImage,
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

function isRetryableVisionError(error) {
  if (error instanceof Error && error.message.startsWith('image source ')) return false;
  const status = error instanceof Error ? /\((\d{3})\)$/.exec(error.message)?.[1] : null;
  return !status || status === '429' || status.startsWith('5');
}

function visionFailureReason(error) {
  if (error instanceof Error && error.message.startsWith('image source ')) return error.message;
  const status = error instanceof Error ? /\((\d{3})\)$/.exec(error.message)?.[1] : null;
  if (status) return `vision request failed (HTTP ${status})`;
  const rawDetail = error instanceof Error && error.message ? error.message : String(error);
  const detail = rawDetail.length > 160 ? `${rawDetail.slice(0, 160)}…` : rawDetail;
  return `vision request failed (${detail})`;
}

async function judgeWithRetry(pair, judge, sleep, reserveAttempt) {
  let lastError;
  for (let attempt = 1; attempt <= TRANSIENT_RETRY_ATTEMPTS; attempt += 1) {
    if (!reserveAttempt()) return { capReached: true };
    try {
      return { response: await judge(pair) };
    } catch (error) {
      lastError = error;
      if (!isRetryableVisionError(error) || attempt === TRANSIENT_RETRY_ATTEMPTS) break;
      await sleep(250 * 2 ** (attempt - 1));
    }
  }
  return { error: lastError };
}

export async function runAuthoring({
  receipt,
  queue,
  judge,
  resolveProductImage = (pair) => retailerOgImage(pair.productUrl),
  capUsd = MAX_RUN_COST_USD,
  hydrationBudgetMs = HYDRATION_BUDGET_MS,
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
}) {
  if (!receipt || typeof receipt !== 'object') throw new Error('receipt must be an object');
  if (!queue || !Array.isArray(queue.queue))
    throw new Error('detector queue must contain a queue array');
  if (!Number.isFinite(capUsd) || capUsd <= 0 || capUsd > MAX_RUN_COST_USD)
    throw new Error(`capUsd must be greater than zero and at most ${MAX_RUN_COST_USD}`);
  if (!Number.isFinite(hydrationBudgetMs) || hydrationBudgetMs < 0)
    throw new Error('hydrationBudgetMs must be zero or greater');

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
  const hydrationStartedAt = performance.now();

  for (const queued of queue.queue) {
    const prior = receiptByProduct.get(queued.productId);
    let pair = { ...prior, ...queued };
    if (!pair.productImageUrl && prior?.productImageUrl) {
      const productImageUrl = prior.productImageUrl;
      pair = {
        ...pair,
        productImageUrl,
        cacheKey: auditCacheKey({ ...pair, productImageUrl }),
      };
    }
    if (
      !pair.productImageUrl &&
      pair.productUrl &&
      performance.now() - hydrationStartedAt < hydrationBudgetMs
    ) {
      try {
        const productImageUrl = await resolveProductImage(pair);
        if (productImageUrl) {
          pair = {
            ...pair,
            productImageUrl,
            cacheKey: auditCacheKey({ ...pair, productImageUrl }),
          };
        }
      } catch {
        // Keep the pair as unresolved evidence when a retailer page is unavailable.
      }
    }
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
    attempted.add(pair.cacheKey);
    const result = await judgeWithRetry(pair, judge, sleep, () => {
      // Reserve each network attempt immediately before dispatching it.
      // Equality stops too: the cap is a circuit breaker, not a target to fill.
      if (reservedCostUsd + RESERVATION_PER_REQUEST_USD >= capUsd) return false;
      reservedCostUsd += RESERVATION_PER_REQUEST_USD;
      return true;
    });
    if (result.capReached) {
      stoppedAtCap = true;
      judgments.push(unresolved(pair, 'not judged before run cap'));
      continue;
    }
    if (result.error) {
      judgments.push(unresolved(pair, visionFailureReason(result.error)));
      continue;
    }
    const normalized = normalizeJudgment(pair, result.response);
    if (!normalized) {
      judgments.push(unresolved(pair, 'invalid judgment response'));
      continue;
    }
    cached.set(pair.cacheKey, normalized);
    judgments.push(normalized);
    completedJudgments += 1;
  }

  const unresolvedCount = judgments.filter((judgment) => judgment.tier === 'unresolved').length;
  const stopReason =
    eligibleCount === 0 ? 'no eligible image pairs' : stoppedAtCap ? CAP_STOP_REASON : null;
  // Below-25 (mismatch) is demoted, never treated as a durable reusable tier
  // (spec P2, issue #3447): fold this run's freshly-judged mismatches in
  // alongside any the detector already identified from a cached score, so
  // one artifact carries the complete demotion list for the content lane.
  const freshDemotions = judgments
    .filter((judgment) => judgment.tier === 'mismatch')
    .map((judgment) => ({
      productId: judgment.productId,
      url: judgment.productUrl ?? null,
      reason: 'vision-audited-mismatch',
      auditorReasons: judgment.reasons,
    }));
  const demotions = [...(Array.isArray(queue.demotions) ? queue.demotions : []), ...freshDemotions];
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
    demotions,
    summary: {
      queued: receipt.detectorReceipt?.queued ?? judgments.length,
      resolved: completedJudgments,
      unresolved: unresolvedCount,
      demoted: demotions.length,
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
  const reSourceIssue = reSourceIssueContent(artifact);
  let reSourceIssueError = null;
  if (reSourceIssue) {
    try {
      artifact.reSourceIssue = await upsertCapIssue(reSourceIssue);
    } catch (error) {
      artifact.reSourceIssue = null;
      reSourceIssueError = error instanceof Error ? error.message : String(error);
    }
  }
  const target = resolve(writePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  if (issueError) {
    console.error(`merch-audit-authoring: failed to file cap follow-up issue: ${issueError}`);
    process.exitCode = 1;
  }
  if (reSourceIssueError) {
    console.error(`merch-audit-authoring: failed to file re-source issue: ${reSourceIssueError}`);
    process.exitCode = 1;
  }
  console.log(
    JSON.stringify({
      status: artifact.status,
      reservedCostUsd: artifact.run.reservedCostUsd,
      completedJudgments: artifact.run.completedJudgments,
      stopReason: artifact.run.stopReason,
      demoted: artifact.demotions?.length ?? 0,
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
