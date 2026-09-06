#!/usr/bin/env node
// E5 detection is deliberately zero-LLM: it gathers candidates and files issues.
// The separate judged curation lane calls curateCandidate before any seed authoring.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { httpsRequest } from '../lib/gh.mjs';
import { fetchSubredditPosts } from '../lib/reddit-rss.mjs';
import {
  ETSY_FAILURE_ISSUE_PREFIX,
  ETSY_FAILURE_LABEL,
  ETSY_QUERIES,
  FANMADE_CANDIDATE_LABEL,
  FANMADE_ISSUE_PREFIX,
  REDDIT_SUBREDDITS,
  SHOP_DOMAIN_ALLOWLIST,
  SHOP_DOMAIN_SUFFIX_ALLOWLIST,
  SUBMISSION_LABEL,
} from './fanmade-sources.mjs';
import { FAN_MADE } from '../../supabase/seed/merch/fanmade.mjs';

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

// The GitHub calls in this file (issue list/create, label create) are all
// `api.github.com`. Routed through `scripts/lib/gh.mjs`'s `httpsRequest` —
// the one transport in this repo proven to honour HTTPS_PROXY in cloud
// runners (#1869/#2008) — rather than a bare `fetch`, which silently bypasses
// the proxy unless the process was booted with `--use-env-proxy`. Wrapped to
// look like the fetch Response shape so callers (and their test doubles,
// which already speak that shape) are unaffected.
async function githubFetch(url, options = {}) {
  const { method = 'GET', headers = {}, body } = options;
  const res = await httpsRequest(String(url), { method, headers, body });
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    headers: res.headers,
    async json() {
      return res.text ? JSON.parse(res.text) : null;
    },
    async text() {
      return res.text ?? '';
    },
  };
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname === 'etsy.com' || url.hostname === 'www.etsy.com') url.search = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_')) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function formatEtsyPrice(price) {
  const amount = Number(price?.amount);
  const divisor = Number(price?.divisor);
  const currency = text(price?.currency_code);
  return Number.isFinite(amount) && Number.isFinite(divisor) && divisor > 0 && currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / divisor)
    : null;
}

function isAllowedShopUrl(value) {
  const url = canonicalUrl(value);
  if (!url) return false;
  const hostname = new URL(url).hostname;
  return SHOP_DOMAIN_ALLOWLIST.includes(hostname) || SHOP_DOMAIN_SUFFIX_ALLOWLIST.some((suffix) => hostname.endsWith(suffix));
}

function isMerchSubmission(issue) {
  return /^\[Link submission\]\s+merch:/i.test(text(issue?.title) || '');
}

function provenance(discoveredVia, discoveredAt, sourceUrl, query) {
  return { discoveredVia, discoveredAt: discoveredAt || null, sourceUrl: sourceUrl || null, ...(query ? { query } : {}) };
}

export function normalizeEtsyListing(listing, query, discoveredAt = null) {
  const renderedPrice = formatEtsyPrice(listing?.price);
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

// Accepts the RSS-shaped post from `fetchSubredditPosts` (`id`, `permalink`
// — already an absolute reddit.com URL, `url`, `createdAt` ISO string,
// `rank`). RSS has no score field (see scripts/lib/reddit-rss.mjs header),
// so `rank` — 1-based position in the `sort=top&t=week` feed, lower is more
// hyped this week — is recorded as the hype signal in place of `score`.
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
    rank: Number.isFinite(post?.rank) ? post.rank : null,
    provenance: [provenance('reddit', text(post?.createdAt), text(post?.permalink) || url)],
  };
}

export function normalizeSubmission(issue) {
  const bodyUrl = text(issue?.body)?.match(/https?:\/\/[^\s)>`]+/i)?.[0] || null;
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
  return jsonResponse(response, requestUrl);
}

async function jsonResponse(response, requestUrl) {
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status}) for ${requestUrl}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function retryAfterDelay(response) {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter?.trim()) return 1_000;
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : 1_000;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function etsyJson(fetchImpl, url, options, sleep) {
  const requestUrl = String(url);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetchImpl(requestUrl, options);
    if (response.status === 429 && attempt === 0) {
      await sleep(retryAfterDelay(response));
      continue;
    }
    return jsonResponse(response, requestUrl);
  }
  throw new Error(`Request retry limit reached for ${requestUrl}`);
}

function isEligibleEtsyListing(listing, query, now) {
  const candidate = normalizeEtsyListing(listing, query, now);
  const amount = Number(listing?.price?.amount);
  const divisor = Number(listing?.price?.divisor);
  const dollars = divisor > 0 ? amount / divisor : NaN;
  const reviewSignal = Number(listing?.shop?.review_count ?? listing?.shop?.transaction_count);
  return candidate.url &&
    candidate.item &&
    candidate.brand &&
    candidate.price &&
    candidate.imageUrl &&
    listing?.shop?.is_vacation === false &&
    Number.isFinite(reviewSignal) && reviewSignal > 0 &&
    Number.isFinite(dollars) && dollars >= 2 && dollars <= 500
    ? candidate
    : null;
}

export async function collectEtsyEvidence({ etsyApiKey, fetchImpl = fetch, now = new Date().toISOString(), queries = ETSY_QUERIES, requireCredentials = false, sleep = wait } = {}) {
  if (!etsyApiKey) {
    if (requireCredentials) throw new Error('Etsy API credentials are required');
    return { rawQueries: [], candidates: [], queryErrors: [] };
  }
  const candidates = [];
  const rawQueries = [];
  const queryErrors = [];
  const listingDetailsById = new Map();
  const missingListingIds = new Set();
  for (const query of queries) {
    const url = new URL('https://openapi.etsy.com/v3/application/listings/active');
    url.searchParams.set('keywords', query);
    url.searchParams.set('sort_on', 'created');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '10');
    let payload;
    try {
      payload = await etsyJson(fetchImpl, url, { headers: { 'x-api-key': etsyApiKey } }, sleep);
    } catch (error) {
      // Non-fatal: a single query's search request failing (403, 5xx) must not
      // abort the whole discovery run. Record it and move on to the next query.
      queryErrors.push({ query, status: error?.status ?? null, message: error?.message || String(error) });
      continue;
    }
    rawQueries.push({ query, payload });
    for (const searchResult of (payload.results || []).slice(0, 10)) {
      if (!searchResult?.listing_id) continue;
      const listingId = String(searchResult.listing_id);
      if (missingListingIds.has(listingId)) continue;
      let listing = listingDetailsById.get(listingId);
      if (!listing) {
        const detailUrl = new URL(`https://openapi.etsy.com/v3/application/listings/${listingId}`);
        detailUrl.searchParams.set('includes', 'Images,Shop');
        try {
          listing = await etsyJson(fetchImpl, detailUrl, { headers: { 'x-api-key': etsyApiKey } }, sleep);
        } catch (error) {
          if (error?.status === 404) {
            missingListingIds.add(listingId);
            continue;
          }
          // Non-fatal: a single listing detail failure (403, 5xx) must not
          // abort this query's remaining listings or the rest of the run.
          queryErrors.push({ query, listingId, status: error?.status ?? null, message: error?.message || String(error) });
          continue;
        }
        listingDetailsById.set(listingId, listing);
      }
      const candidate = isEligibleEtsyListing(listing, query, now);
      if (!candidate) continue;
      candidates.push(candidate);
    }
  }
  return {
    rawQueries,
    listingDetails: [...listingDetailsById].map(([listingId, detail]) => ({ listingId, detail })),
    candidates: mergeCandidates(candidates),
    queryErrors,
  };
}

async function discoverEtsy({ etsyApiKey, fetchImpl, now, queries = ETSY_QUERIES }) {
  const evidence = await collectEtsyEvidence({ etsyApiKey, fetchImpl, now, queries });
  // A query-level failure (search request itself failed, no listingId) means
  // that whole query contributed zero results. If every configured query
  // failed that way, Etsy is down or credentials are bad for this whole run.
  const searchLevelFailures = evidence.queryErrors.filter((error) => !error.listingId);
  const totalFailure = Boolean(etsyApiKey) && queries.length > 0 && searchLevelFailures.length >= queries.length;
  return { candidates: evidence.candidates, queryErrors: evidence.queryErrors, totalFailure };
}

async function discoverReddit({ fetchImpl, warn = console.warn }) {
  const candidates = [];
  let forbiddenCount = 0;
  for (const subreddit of REDDIT_SUBREDDITS) {
    let result;
    try {
      result = await fetchSubredditPosts(subreddit, { sort: 'top', time: 'week', limit: 100, fetchImpl });
    } catch (error) {
      if (error?.status === 403) {
        forbiddenCount += 1;
        continue;
      }
      throw error;
    }
    for (const post of result.posts) {
      const candidate = normalizeRedditPost(post);
      if (candidate) candidates.push(candidate);
    }
  }
  if (forbiddenCount > 0) {
    warn(`fanmade-discovery: Reddit RSS returned 403 for ${forbiddenCount}/${REDDIT_SUBREDDITS.length} subreddit(s) this run`);
  }
  return candidates;
}

export async function discoverCandidates({ etsyApiKey, fetchImpl = fetch, submissions = [], now = new Date().toISOString(), queries = ETSY_QUERIES } = {}) {
  const [etsy, reddit] = await Promise.all([
    discoverEtsy({ etsyApiKey, fetchImpl, now, queries }),
    discoverReddit({ fetchImpl }),
  ]);
  return {
    candidates: mergeCandidates([...etsy.candidates, ...reddit, ...submissions.filter(isMerchSubmission).map(normalizeSubmission)]),
    etsyQueryErrors: etsy.queryErrors,
    etsyTotalFailure: etsy.totalFailure,
  };
}

function etsyListingId(value) {
  const url = canonicalUrl(value);
  if (!url) return null;
  const { hostname, pathname } = new URL(url);
  if (hostname !== 'etsy.com' && hostname !== 'www.etsy.com') return null;
  return pathname.match(/^\/listing\/(\d+)(?:\/|$)/)?.[1] || null;
}

export async function reverifyFanmadeListings({ entries = FAN_MADE, etsyApiKey, fetchImpl = fetch, verifiedAt = new Date().toISOString() } = {}) {
  const reverified = [];
  for (const entry of entries) {
    const url = canonicalUrl(entry?.url);
    const seedPrice = text(entry?.price);
    const listingId = etsyListingId(url);
    if (!listingId) {
      reverified.push({ url, status: 'unsupported-retailer', price: null, seedPrice, verifiedAt });
      continue;
    }
    if (!etsyApiKey) {
      reverified.push({ url, status: 'not-checked', price: null, seedPrice, verifiedAt });
      continue;
    }
    const endpoint = new URL(`https://openapi.etsy.com/v3/application/listings/${listingId}`);
    endpoint.searchParams.set('includes', 'Images,Shop');
    try {
      const response = await fetchImpl(String(endpoint), { headers: { 'x-api-key': etsyApiKey } });
      if (response.status === 404) {
        reverified.push({ url, status: 'dead', price: null, seedPrice, verifiedAt });
        continue;
      }
      if (!response.ok) {
        reverified.push({ url, status: 'unknown', price: null, seedPrice, verifiedAt });
        continue;
      }
      const listing = await response.json();
      reverified.push({
        url,
        status: listing.state && listing.state !== 'active' ? 'dead' : 'live',
        price: formatEtsyPrice(listing.price),
        seedPrice,
        verifiedAt,
      });
    } catch {
      reverified.push({ url, status: 'unknown', price: null, seedPrice, verifiedAt });
    }
  }
  return { reverified };
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

const FANMADE_REVERIFICATION_LABEL = 'fanmade-reverification';
const FANMADE_REVERIFICATION_PREFIX = 'fanmade-reverification:';

function revalidationTitle(result) {
  return `${FANMADE_REVERIFICATION_PREFIX}${result.url}`;
}

function revalidationBody(result) {
  return [
    'Automated E5 re-verification requires the mending lane to review this listing before it remains purchasable.',
    '',
    `Listing URL: ${result.url}`,
    `Liveness status: ${result.status}`,
    `Seed price: ${result.seedPrice || 'unavailable'}`,
    `Observed price: ${result.price || 'unavailable'}`,
    `Verified at: ${result.verifiedAt}`,
  ].join('\n');
}

export async function fileReverificationIssues({ repository, token, reverified, fetchImpl, dryRun }) {
  const actionable = reverified.filter((result) => result.status === 'dead' || (result.status === 'live' && (result.price === null || result.price !== result.seedPrice)));
  if (!repository || !token || dryRun) return { filed: [], skipped: actionable.map((result) => result.url) };
  const label = await fetchImpl(`https://api.github.com/repos/${repository}/labels`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ name: FANMADE_REVERIFICATION_LABEL, color: 'b60205' }),
  });
  if (!label.ok && label.status !== 422) throw new Error(`Could not ensure re-verification label (${label.status})`);
  const existing = await githubIssues({ repository, token, label: FANMADE_REVERIFICATION_LABEL, fetchImpl });
  const titles = new Set(existing.map((issue) => issue.title));
  const filed = [];
  for (const result of actionable) {
    if (titles.has(revalidationTitle(result))) continue;
    const response = await fetchImpl(`https://api.github.com/repos/${repository}/issues`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
      body: JSON.stringify({ title: revalidationTitle(result), body: revalidationBody(result), labels: [FANMADE_REVERIFICATION_LABEL] }),
    });
    if (!response.ok) throw new Error(`Could not file re-verification issue for ${result.url} (${response.status})`);
    filed.push(result.url);
  }
  return { filed, skipped: actionable.filter((result) => titles.has(revalidationTitle(result))).map((result) => result.url) };
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

function etsyOutageTitle(now) {
  // One outage ticket per UTC day so a sustained failure doesn't spam issues.
  return `${ETSY_FAILURE_ISSUE_PREFIX}${now.slice(0, 10)}`;
}

function etsyOutageBody({ queryErrors, now }) {
  return [
    'Automated E5 detection could not reach the Etsy API for any configured query on this run.',
    'Etsy and Reddit/submission intake are independent; this outage only affects Etsy-sourced candidates.',
    '',
    `Detected at: ${now}`,
    '',
    'Errors observed:',
    ...queryErrors.map((error) => `- query "${error.query}"${error.listingId ? ` (listing ${error.listingId})` : ''}: status ${error.status ?? 'unknown'} — ${error.message}`),
    '',
    'Check Etsy API credentials/quota and sustained rate-limiting or outage status before assuming this is a code defect.',
  ].join('\n');
}

export async function fileEtsyOutageIssue({ repository, token, queryErrors, now = new Date().toISOString(), fetchImpl, dryRun }) {
  if (!queryErrors?.length) return { filed: false, skipped: false };
  if (!repository || !token || dryRun) return { filed: false, skipped: true };
  const label = await fetchImpl(`https://api.github.com/repos/${repository}/labels`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ name: ETSY_FAILURE_LABEL, color: 'd93f0b' }),
  });
  if (!label.ok && label.status !== 422) throw new Error(`Could not ensure Etsy outage label (${label.status})`);
  const existing = await githubIssues({ repository, token, label: ETSY_FAILURE_LABEL, fetchImpl });
  const title = etsyOutageTitle(now);
  if (existing.some((issue) => issue.title === title)) return { filed: false, skipped: true };
  const response = await fetchImpl(`https://api.github.com/repos/${repository}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ title, body: etsyOutageBody({ queryErrors, now }), labels: [ETSY_FAILURE_LABEL] }),
  });
  if (!response.ok) throw new Error(`Could not file Etsy outage issue (${response.status})`);
  return { filed: true, skipped: false };
}

// Etsy v3 requires x-api-key to hold the keystring and shared secret joined by a colon.
function etsyApiKeyFromEnv() {
  const { ETSY_API_KEY, ETSY_SHARED_SECRET } = process.env;
  return ETSY_API_KEY && ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : null;
}

async function main() {
  const dryRun = !process.argv.includes('--file');
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  const etsyApiKey = etsyApiKeyFromEnv();
  if (process.argv.includes('--e5-evidence')) {
    const outputDir = process.env.E5_EVIDENCE_DIR;
    if (!outputDir) throw new Error('E5_EVIDENCE_DIR is required when collecting manual E5 evidence');
    const evidence = await collectEtsyEvidence({ etsyApiKey, requireCredentials: true });
    await mkdir(join(outputDir, 'listings'), { recursive: true });
    await Promise.all(evidence.rawQueries.map((rawQuery, index) => writeFile(
      join(outputDir, `query-${index}.json`),
      `${JSON.stringify(rawQuery.payload, null, 2)}\n`,
    )));
    await Promise.all(evidence.listingDetails.map(({ listingId, detail }) => writeFile(
      join(outputDir, 'listings', `${listingId}.json`),
      `${JSON.stringify(detail, null, 2)}\n`,
    )));
    console.log(JSON.stringify({ candidates: evidence.candidates }, null, 2));
    return;
  }
  const submissions = await githubIssues({ repository, token, label: SUBMISSION_LABEL, fetchImpl: githubFetch });
  const discovery = await discoverCandidates({ etsyApiKey, submissions });
  const revalidation = await reverifyFanmadeListings({ etsyApiKey });
  const revalidationFiling = await fileReverificationIssues({ repository, token, reverified: revalidation.reverified, fetchImpl: githubFetch, dryRun });
  const filing = await fileCandidateIssues({ repository, token, candidates: discovery.candidates, fetchImpl: githubFetch, dryRun });
  const etsyOutageFiling = discovery.etsyTotalFailure
    ? await fileEtsyOutageIssue({ repository, token, queryErrors: discovery.etsyQueryErrors, fetchImpl: githubFetch, dryRun })
    : { filed: false, skipped: false };
  console.log(JSON.stringify({ ...discovery, ...revalidation, revalidationFiling, ...filing, etsyOutageFiling, dryRun }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
