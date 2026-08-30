#!/usr/bin/env node
// E5 detection is deliberately zero-LLM: it gathers candidates and files issues.
// The separate judged curation lane calls curateCandidate before any seed authoring.

import { pathToFileURL } from 'node:url';
import {
  ETSY_QUERIES,
  FANMADE_CANDIDATE_LABEL,
  FANMADE_ISSUE_PREFIX,
  REDDIT_SUBREDDITS,
  SHOP_DOMAIN_ALLOWLIST,
  SHOP_DOMAIN_SUFFIX_ALLOWLIST,
  SUBMISSION_LABEL,
} from './fanmade-sources.mjs';

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_')) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isAllowedShopUrl(value) {
  const url = canonicalUrl(value);
  if (!url) return false;
  const hostname = new URL(url).hostname;
  return SHOP_DOMAIN_ALLOWLIST.includes(hostname) || SHOP_DOMAIN_SUFFIX_ALLOWLIST.some((suffix) => hostname.endsWith(suffix));
}

function isoFromUnix(seconds) {
  return Number.isFinite(Number(seconds)) ? new Date(Number(seconds) * 1000).toISOString() : null;
}

function isMerchSubmission(issue) {
  return /^\[Link submission\]\s+merch:/i.test(text(issue?.title) || '');
}

function provenance(discoveredVia, discoveredAt, sourceUrl, query) {
  return { discoveredVia, discoveredAt: discoveredAt || null, sourceUrl: sourceUrl || null, ...(query ? { query } : {}) };
}

export function normalizeEtsyListing(listing, query, discoveredAt = null) {
  const price = listing?.price;
  const amount = Number(price?.amount);
  const divisor = Number(price?.divisor);
  const currency = text(price?.currency_code);
  const renderedPrice = Number.isFinite(amount) && Number.isFinite(divisor) && divisor > 0 && currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / divisor)
    : null;
  const url = canonicalUrl(listing?.url);
  return {
    id: listing?.listing_id ? `etsy:${listing.listing_id}` : null,
    item: text(listing?.title),
    url,
    brand: text(listing?.shop?.shop_name),
    price: renderedPrice,
    imageUrl: canonicalUrl(listing?.images?.[0]?.url_fullxfull),
    provenance: [provenance('etsy-search', discoveredAt, url, query)],
  };
}

export function normalizeRedditPost(post) {
  const url = canonicalUrl(post?.url);
  if (!isAllowedShopUrl(url)) return null;
  return {
    id: text(post?.id) ? `reddit:${post.id}` : null,
    item: text(post?.title),
    url,
    brand: null,
    price: null,
    imageUrl: null,
    provenance: [provenance(
      'reddit',
      isoFromUnix(post?.created_utc),
      text(post?.permalink) ? `https://www.reddit.com${post.permalink}` : url,
    )],
  };
}

export function normalizeSubmission(issue) {
  const bodyUrl = text(issue?.body)?.match(/https?:\/\/[^\s)>]+/i)?.[0] || null;
  const url = canonicalUrl(bodyUrl);
  return {
    id: issue?.number ? `submission:${issue.number}` : null,
    item: text(issue?.title),
    url,
    brand: null,
    price: null,
    imageUrl: null,
    provenance: [provenance('submission', text(issue?.created_at), text(issue?.html_url))],
  };
}

function mergeCandidates(candidates) {
  const byUrl = new Map();
  for (const candidate of candidates) {
    if (!candidate?.url) continue;
    const current = byUrl.get(candidate.url);
    if (!current) {
      byUrl.set(candidate.url, { ...candidate, provenance: [...candidate.provenance] });
      continue;
    }
    for (const item of candidate.provenance) {
      if (!current.provenance.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) current.provenance.push(item);
    }
    for (const field of ['id', 'item', 'brand', 'price', 'imageUrl']) current[field] ||= candidate[field];
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url));
}

async function json(fetchImpl, url, options) {
  const requestUrl = String(url);
  const response = await fetchImpl(requestUrl, options);
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status}) for ${requestUrl}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function discoverEtsy({ etsyApiKey, fetchImpl, now }) {
  if (!etsyApiKey) return [];
  const candidates = [];
  for (const query of ETSY_QUERIES) {
    const url = new URL('https://openapi.etsy.com/v3/application/listings/active');
    url.searchParams.set('keywords', query);
    url.searchParams.set('sort_on', 'created');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '25');
    url.searchParams.set('includes', 'Images,Shop');
    const payload = await json(fetchImpl, url, { headers: { 'x-api-key': etsyApiKey } });
    for (const listing of payload.results || []) {
      const candidate = normalizeEtsyListing(listing, query, now);
      const amount = Number(listing?.price?.amount);
      const divisor = Number(listing?.price?.divisor);
      const dollars = divisor > 0 ? amount / divisor : NaN;
      const reviewSignal = Number(listing?.shop?.review_count ?? listing?.shop?.transaction_count);
      if (
        candidate.url &&
        candidate.item &&
        candidate.brand &&
        candidate.price &&
        candidate.imageUrl &&
        listing?.shop?.is_vacation === false &&
        Number.isFinite(reviewSignal) && reviewSignal > 0 &&
        Number.isFinite(dollars) && dollars >= 2 && dollars <= 500
      ) candidates.push(candidate);
    }
  }
  return candidates;
}

async function discoverReddit({ fetchImpl }) {
  const candidates = [];
  for (const subreddit of REDDIT_SUBREDDITS) {
    let payload;
    try {
      payload = await json(fetchImpl, `https://www.reddit.com/r/${subreddit}/new.json?limit=100`, {
        headers: { 'user-agent': 'LongLiveFanMadeDiscovery/1.0' },
      });
    } catch (error) {
      if (error?.status === 403) continue;
      throw error;
    }
    for (const child of payload?.data?.children || []) {
      const candidate = normalizeRedditPost(child.data);
      if (candidate) candidates.push(candidate);
    }
  }
  return candidates;
}

export async function discoverCandidates({ etsyApiKey, fetchImpl = fetch, submissions = [], now = new Date().toISOString() } = {}) {
  const [etsy, reddit] = await Promise.all([
    discoverEtsy({ etsyApiKey, fetchImpl, now }),
    discoverReddit({ fetchImpl }),
  ]);
  return { candidates: mergeCandidates([...etsy, ...reddit, ...submissions.filter(isMerchSubmission).map(normalizeSubmission)]) };
}

const PROHIBITED_MATERIAL = new Set(['official-artwork', 'tour-graphic', 'taylor-photo']);

/**
 * The judged curation lane supplies `judgment` and prohibitedMaterial. This
 * function is fail-closed: no item reaches the seed unless D3 and E1/E2 pass.
 */
export function curateCandidate(candidate, verifiedAt = new Date().toISOString()) {
  if (PROHIBITED_MATERIAL.has(candidate?.prohibitedMaterial)) return { accepted: false, reason: 'd3-prohibited-material' };
  if (candidate?.judgment !== 'inspired-original' || candidate?.prohibitedMaterial !== 'none') {
    return { accepted: false, reason: 'd3-judgment-required' };
  }
  if (candidate?.listingVerified !== true) return { accepted: false, reason: 'e1-listing-not-verified' };
  if (candidate?.imageVerified !== true) return { accepted: false, reason: 'e2-image-not-verified' };
  if (!text(candidate.item) || !canonicalUrl(candidate.url) || !text(candidate.brand) || !text(candidate.price) || !text(candidate.kind) || !canonicalUrl(candidate.imageUrl)) {
    return { accepted: false, reason: 'missing-required-source-facts' };
  }
  const firstSource = candidate.provenance?.[0];
  if (!firstSource?.discoveredVia || !firstSource?.sourceUrl) return { accepted: false, reason: 'provenance-required' };
  return {
    accepted: true,
    seed: {
      brand: candidate.brand,
      item: candidate.item,
      kind: candidate.kind,
      retailer: new URL(candidate.url).hostname,
      url: canonicalUrl(candidate.url),
      price: candidate.price,
      imageUrl: canonicalUrl(candidate.imageUrl),
      inStock: true,
      discoveredVia: firstSource.discoveredVia,
      discoveredAt: firstSource.discoveredAt || verifiedAt,
      verifiedAt,
      provenance: candidate.provenance,
    },
  };
}

async function githubIssues({ repository, token, label, fetchImpl }) {
  if (!repository || !token) return [];
  const issues = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`https://api.github.com/repos/${repository}/issues`);
    url.searchParams.set('state', 'all');
    url.searchParams.set('labels', label);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    const batch = await json(fetchImpl, url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    issues.push(...batch);
    if (batch.length < 100) return issues;
  }
}

function issueTitle(candidate) {
  return `${FANMADE_ISSUE_PREFIX}${candidate.url}`;
}

function issueBody(candidate) {
  return [
    'Automated E5 detection candidate. This is intake metadata, not a product claim or approval.',
    '',
    `Candidate URL: ${candidate.url}`,
    `Title observed: ${candidate.item || 'unknown'}`,
    `Observed maker: ${candidate.brand || 'unknown'}`,
    `Observed price: ${candidate.price || 'unknown'}`,
    `Observed image: ${candidate.imageUrl || 'unknown'}`,
    '',
    'Curation must apply D3 (inspired-by original only; reject official artwork, tour graphics, and Taylor photos) and pass E1 listing plus E2 image verification before authoring fanmade.mjs.',
    '',
    'Provenance:',
    ...candidate.provenance.map((item) => `- ${item.discoveredVia}: ${item.sourceUrl || 'unknown source'}`),
  ].join('\n');
}

async function fileCandidateIssues({ repository, token, candidates, fetchImpl, dryRun }) {
  if (!repository || !token || dryRun) return { filed: [], skipped: candidates.map((candidate) => candidate.url) };
  const label = await fetchImpl(`https://api.github.com/repos/${repository}/labels`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ name: FANMADE_CANDIDATE_LABEL, color: '7057ff' }),
  });
  if (!label.ok && label.status !== 422) throw new Error(`Could not ensure candidate label (${label.status})`);
  const existing = await githubIssues({ repository, token, label: FANMADE_CANDIDATE_LABEL, fetchImpl });
  const titles = new Set(existing.map((issue) => issue.title));
  const filed = [];
  for (const candidate of candidates) {
    if (titles.has(issueTitle(candidate))) continue;
    const response = await fetchImpl(`https://api.github.com/repos/${repository}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
      body: JSON.stringify({ title: issueTitle(candidate), body: issueBody(candidate), labels: [FANMADE_CANDIDATE_LABEL] }),
    });
    if (!response.ok) throw new Error(`Could not file candidate issue for ${candidate.url} (${response.status})`);
    filed.push(candidate.url);
  }
  return { filed, skipped: candidates.filter((candidate) => titles.has(issueTitle(candidate))).map((candidate) => candidate.url) };
}

async function main() {
  const dryRun = !process.argv.includes('--file');
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  const submissions = await githubIssues({ repository, token, label: SUBMISSION_LABEL, fetchImpl: fetch });
  const discovery = await discoverCandidates({ etsyApiKey: process.env.ETSY_API_KEY, submissions });
  const filing = await fileCandidateIssues({ repository, token, candidates: discovery.candidates, fetchImpl: fetch, dryRun });
  console.log(JSON.stringify({ ...discovery, ...filing, dryRun }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
