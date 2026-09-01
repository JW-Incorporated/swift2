#!/usr/bin/env node
// E6 matcher — deterministic candidate selection only. The separate authoring
// lane supplies descriptors, candidates, and vision scores; this script never
// calls a model, a retailer, or a paid search provider.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TIER_BY_SCORE = [
  [90, 'exact'],
  [70, 'close'],
  [45, 'similar'],
];
const SEARCH_SOURCES = ['awin-index', 'brand-direct', 'paid-search'];

export function tierForMatchScore(score) {
  if (!Number.isFinite(score)) return null;
  for (const [minimum, tier] of TIER_BY_SCORE) {
    if (score >= minimum) return tier;
  }
  return null;
}

/** Mirrors merch-filters.ts: unpriceable candidates cannot claim a price band. */
export function priceBandFor(price) {
  if (!price) return undefined;
  const numeric = price.replace(/[^0-9.]/g, '');
  const value = Number(numeric);
  if (!Number.isFinite(value) || numeric === '') return undefined;
  if (value < 50) return 'under50';
  if (value <= 200) return '50to200';
  return '200plus';
}

export function buildReSourceTicket(moment, reason) {
  return {
    key: `merch-re-source:moment:${moment.id}`,
    momentId: moment.id,
    momentTitle: moment.title,
    reason,
    retryAfterDays: 14,
  };
}

/** The data-only contract consumed by the separate re-source authoring lane. */
export function reSourceAuthoringRequestFor(tickets) {
  return { lane: 'merch-re-source-authoring', queue: tickets };
}

/**
 * E1 and E2 are pre-merge gates. A matcher result can only be authored when
 * both have verified the candidate's listing and product image.
 */
export function hasPassedVerification(candidate) {
  return candidate?.urlVerified === true && candidate?.imageVerified === true;
}

function candidateOrder(left, right) {
  const leftAwin = left.source === 'awin-index';
  const rightAwin = right.source === 'awin-index';
  // R6: Awin is a tie-breaker only. This comparator runs after tier filtering.
  if (leftAwin !== rightAwin) return leftAwin ? -1 : 1;
  if (right.score !== left.score) return right.score - left.score;
  return String(left.id).localeCompare(String(right.id));
}

function tierRank(tier) {
  return TIER_BY_SCORE.findIndex(([, name]) => name === tier);
}

function rankedCandidateOrder(left, right) {
  const tierDifference = tierRank(left.matchTier) - tierRank(right.matchTier);
  return tierDifference || candidateOrder(left, right);
}

/**
 * Scores candidates from E0, brand-direct, and paid search together. It keeps
 * the strongest match first, then up to two alternatives. A lower-tier Awin
 * candidate is excluded so monetization never creates a weaker alternative.
 */
export function matchMoment({ moment, candidates }) {
  const qualifying = (candidates ?? [])
    .filter(hasPassedVerification)
    .map((candidate) => ({ ...candidate, matchTier: tierForMatchScore(candidate.score) }))
    .filter((candidate) => candidate.matchTier !== null);

  if (qualifying.length === 0) {
    return { momentId: moment.id, products: [], ticket: buildReSourceTicket(moment, 'no-qualifying-candidate') };
  }

  const ranked = qualifying.sort(rankedCandidateOrder);
  const [best, ...remaining] = ranked;
  const usedPriceBands = new Set([priceBandFor(best.price)].filter(Boolean));
  const products = [
    best,
    ...remaining
      .filter((candidate) => {
        if (candidate.source === 'awin-index' && candidate.matchTier !== best.matchTier) return false;
        const priceBand = priceBandFor(candidate.price);
        if (!priceBand || usedPriceBands.has(priceBand)) return false;
        usedPriceBands.add(priceBand);
        return true;
      })
      .slice(0, 2),
  ];

  return { momentId: moment.id, products, ticket: null };
}

/** Returns a ticket instead of permitting a metered request beyond the cap. */
export function planPaidSearch({ moment, callsUsed, cap }) {
  if (!Number.isInteger(callsUsed) || callsUsed < 0 || !Number.isInteger(cap) || cap < 0) {
    throw new Error('callsUsed and cap must be non-negative integers');
  }
  if (callsUsed >= cap) {
    return { allowed: false, ticket: buildReSourceTicket(moment, 'paid-search-cap-reached') };
  }
  return { allowed: true, ticket: null };
}

/** Preserves the mandatory no-cost-first search order for the authoring lane. */
export function searchPlanFor({ moment, callsUsed, cap }) {
  return { sources: SEARCH_SOURCES, paidSearch: planPaidSearch({ moment, callsUsed, cap }) };
}

export function buildMatcherPlan({ moments, paidSearch }) {
  if (!Array.isArray(moments)) throw new Error('input must contain a moments array');
  // Thread a running counter across no-candidate moments so each subsequent
  // paid-search check sees calls actually consumed by earlier moments in
  // this run, rather than the same static snapshot every time.
  let callsUsed = paidSearch?.callsUsed ?? 0;
  const matches = moments.map(({ moment, candidates }) => {
    const match = matchMoment({ moment, candidates });
    let paidSearchTicket = null;
    if (match.products.length === 0 && paidSearch) {
      const plan = planPaidSearch({ moment, callsUsed, cap: paidSearch.cap });
      paidSearchTicket = plan.ticket;
      if (plan.allowed) callsUsed += 1;
    }
    return { ...match, ticket: paidSearchTicket ?? match.ticket };
  });
  const tickets = matches.flatMap((match) => (match.ticket ? [match.ticket] : []));
  return { matches, tickets, authoring: reSourceAuthoringRequestFor(tickets) };
}

async function inputFrom(path) {
  const input = JSON.parse(await readFile(resolve(path), 'utf8'));
  if (!Array.isArray(input.moments)) throw new Error('input must contain a moments array');
  return input;
}

async function main() {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');
  if (inputIndex < 0 || !args[inputIndex + 1] || outputIndex < 0 || !args[outputIndex + 1]) {
    throw new Error('usage: match-moments.mjs --input <candidates.json> --output <plan.json>');
  }

  const input = await inputFrom(args[inputIndex + 1]);
  const output = buildMatcherPlan(input);
  const target = resolve(args[outputIndex + 1]);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ moments: output.matches.length, products: output.matches.reduce((total, match) => total + match.products.length, 0), tickets: output.tickets.length }));
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-matcher: ${error.message}`);
    process.exitCode = 1;
  });
}
