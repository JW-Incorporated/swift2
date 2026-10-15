import { readFileSync } from 'node:fs';
import { isEstablishedDomain, isOfficialDomain } from '@swift2/shared/news';
import { fetchArticleText } from '../../apps/worker/src/sources/fetch-article-text.ts';
import {
  independentStorySources,
  normalizeOutletName,
  storySourceOutletDomain,
  storyVerification,
} from '../../apps/worker/src/pipeline/story-sources.ts';

const ownership = JSON.parse(readFileSync(new URL('./outlet-owners.json', import.meta.url), 'utf8'));
const PAYWALL = /\b(?:(?:subscribe|subscription)\s+(?:to|for)|already a subscriber|(?:sign|log) in to continue|register to continue|subscriber(?:s)? only|subscription required|unlock (?:this|the) article|(?:continue|keep) reading.{0,40}(?:subscribe|sign in))\b/i;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const canonicalText = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

function anchorsOf(source) {
  return [...new Set([source.headline ?? source.title, source.dek ?? source.snippet]
    .map(canonicalText).filter(Boolean))];
}

function ownershipEntry(domain) {
  if (!domain) return undefined;
  const key = Object.keys(ownership.outlets)
    .find((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
  return key ? ownership.outlets[key] : undefined;
}

function sourceOwner(candidate) {
  const domain = storySourceOutletDomain(candidate);
  const configured = ownershipEntry(domain);
  const fallback = normalizeOutletName(
    candidate.outletName,
    candidate.publisherUrl,
    candidate.articleUrl,
  ).toLocaleLowerCase('en-US');
  return configured?.owner ?? (domain ? `outlet:${domain}` : `outlet:${fallback}`);
}

function sourceProfile(candidate) {
  const domain = storySourceOutletDomain(candidate);
  const configured = ownershipEntry(domain);
  return {
    domain: domain ?? null,
    owner: sourceOwner(candidate),
    tier1: configured?.tier1 === true,
    official: isOfficialDomain(candidate.articleUrl),
    established: isEstablishedDomain(candidate.articleUrl),
  };
}

async function checkedSource(source, claim, options) {
  if (source.paywalled === true) return null;
  let articleText = options.forceFetch ? null : source.articleText;
  if (!articleText) articleText = await options.fetchArticle(source.articleUrl);
  if (!articleText || PAYWALL.test(articleText)) return null;
  const page = canonicalText(articleText);
  const matchedAnchors = anchorsOf(source).filter((anchor) => page.includes(anchor));
  if (matchedAnchors.length === 0) return null;
  const judgment = await options.judgeSource({ claim, passage: page, source });
  if (judgment.supportsProbability < 0.8 || judgment.settledProbability < 0.8) return null;
  const candidate = {
    ...source,
    articleText: page,
    repStatement: source.repStatement === true || judgment.repStatementProbability >= 0.8,
  };
  const profile = sourceProfile(candidate);
  if (!profile.official && !profile.established) return null;
  return { ...candidate, ...profile, matchedAnchors };
}

/** Sequential, paced outlet reads. A blocked or paywalled source simply does not count. */
export async function checkSourceEvidence(story, options) {
  const fetchArticle = options.fetchArticle ?? fetchArticleText;
  const sleep = options.sleep ?? pause;
  const paceMs = options.paceMs ?? 1_000;
  const checked = [];
  for (let index = 0; index < story.sources.length; index += 1) {
    const source = story.sources[index];
    const needsFetch = options.forceFetch || !source.articleText;
    const result = await checkedSource(source, story.claim, {
      ...options,
      fetchArticle,
    });
    if (result) checked.push(result);
    if (needsFetch && index < story.sources.length - 1 && paceMs > 0) await sleep(paceMs);
  }
  return independentStorySources(checked, sourceOwner);
}

export function codeBasis(classification, sources) {
  const official = sources.find((source) => source.official);
  if (official) return 'official_source';
  if (classification === 'critical_personal') {
    if (sources.some((source) => source.tier1 && source.repStatement === true)) {
      return 'tier1_rep_statement';
    }
    return sources.filter((source) => source.tier1).length >= 2
      ? 'two_independent_tier1_outlets' : null;
  }
  return storyVerification(sources, sourceOwner).status === 'corroborated'
    ? 'two_independent_established_outlets' : null;
}

export function publicSources(sources) {
  return sources.map((source) => ({
    outlet: source.outletName,
    url: source.articleUrl,
    owner: source.owner,
    official: source.official,
    tier1: source.tier1,
    anchors: source.matchedAnchors,
  }));
}

export function verifierSources(sources) {
  return sources.map((source) => ({
    outlet: source.outletName,
    official: source.official,
    tier1: source.tier1,
    repStatement: source.repStatement === true,
    passage: source.articleText.slice(0, 2_000),
  }));
}
