import { performance } from 'node:perf_hooks';
import { auditCacheKey, tierForScore } from './audit-matches.mjs';
import {
  CAP_STOP_REASON,
  HYDRATION_BUDGET_MS,
  KINDS,
  MAX_RUN_COST_USD,
  MODEL,
  RESERVATION_PER_REQUEST_USD,
  TRANSIENT_RETRY_ATTEMPTS,
} from './audit-matches-authoring-config.mjs';
import { retailerOgImage } from './audit-matches-authoring-vision.mjs';

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
    Number.isFinite(judgment?.score) && judgment.score >= 0 && judgment.score <= 100 &&
    typeof judgment.kind === 'string' && KINDS.has(judgment.kind) &&
    Array.isArray(judgment.reasons) && judgment.reasons.length > 0 &&
    ['exact', 'close', 'similar', 'inspired', 'mismatch'].includes(judgment.tier)
  );
}

function normalizeJudgment(pair, response) {
  if (!response || typeof response !== 'object') return null;
  if (!Number.isFinite(response.score) || response.score < 0 || response.score > 100) return null;
  if (typeof response.kind !== 'string' || !KINDS.has(response.kind)) return null;
  if (
    !Array.isArray(response.reasons) || response.reasons.length < 1 ||
    response.reasons.length > 4 || response.reasons.some(
      (reason) => typeof reason !== 'string' || !reason.trim() || reason.trim().length > 240,
    )
  ) return null;
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
    typeof pair?.cacheKey === 'string' && pair.cacheKey &&
    typeof pair.productImageUrl === 'string' && pair.productImageUrl &&
    typeof pair.momentImageUrl === 'string' && pair.momentImageUrl
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

function unavailableReason(pair) {
  if (!pair?.productImageUrl) return 'product image unavailable';
  if (!pair?.momentImageUrl) return 'moment image unavailable';
  return 'detector pair cache key unavailable';
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
      pair = { ...pair, productImageUrl, cacheKey: auditCacheKey({ ...pair, productImageUrl }) };
    }
    if (
      !pair.productImageUrl && pair.productUrl &&
      performance.now() - hydrationStartedAt < hydrationBudgetMs
    ) {
      try {
        const productImageUrl = await resolveProductImage(pair);
        if (productImageUrl) {
          pair = { ...pair, productImageUrl, cacheKey: auditCacheKey({ ...pair, productImageUrl }) };
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
    run: { capUsd, reservedCostUsd, observedCostUsd: null, stopReason, completedJudgments },
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
