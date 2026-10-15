import { readFile } from 'node:fs/promises';

import { choiceQuestion, noulQuestion } from '../lib/jev.mjs';
import { callClaude } from '../lib/claude-call.mjs';
import { canonicalUrl, curateCandidate } from './fanmade-discovery.mjs';
import { defaultVerifyUrl } from './match-moments-authoring.mjs';
import { verifyImage } from './verify-images.mjs';
import { fetchClaudeImage } from './merch-claude.mjs';

export const D3_MODEL = 'claude-haiku-5-5';
const CONFIG = JSON.parse(await readFile(new URL('../../config/tidewatch.json', import.meta.url)));
const FANMADE_CONFIG = CONFIG.classes.merch_fan;
export const FANMADE_WEEKLY_CAP = FANMADE_CONFIG.thresholds.weeklyCap;
export function safeFanmadePriority(priority) {
  return priority === 'P2' ? 'P2' : 'P3';
}
export const FANMADE_PRIORITY = safeFanmadePriority(FANMADE_CONFIG.priority);
export const BOOTLEG_REJECT_THRESHOLD = CONFIG.classes.merch_fan.thresholds.bootlegReject;
export const MERCH_KIND_THRESHOLD = CONFIG.classes.merch_fan.thresholds.act;

const MERCH_KINDS = [
  ['official_store', 'An official Taylor Swift store product.'],
  ['fan_original', 'A fan-made product with an original inspired design.'],
  ['bootleg_reprint', 'A product reproducing official art, tour graphics, or Taylor Swift photos.'],
  ['not_product', 'Not a purchasable merchandise listing.'],
];

export const JEV_QUESTIONS = [
  choiceQuestion('q_merch_kind', 'Classify the listing into exactly one merchandise kind.',
    MERCH_KINDS.map(([id, label]) => ({ id, label }))),
  noulQuestion('q_bootleg', 'Is this likely a bootleg or unauthorized reproduction of official artwork, tour graphics, or a Taylor Swift photograph?'),
];

export const D3_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['judgment', 'prohibitedMaterial', 'basis', 'kind', 'depicts', 'officialArtwork', 'tourGraphic', 'taylorPhoto'],
  properties: {
    judgment: { type: 'string', enum: ['inspired-original', 'reject'] },
    prohibitedMaterial: { type: 'string', enum: ['none', 'official-artwork', 'tour-graphic', 'taylor-photo', 'other'] },
    basis: { type: 'string' },
    kind: { type: 'string', enum: ['accessory', 'apparel', 'home-decor', 'jewelry', 'other', 'print'] },
    depicts: { type: 'string' },
    officialArtwork: { type: 'boolean' },
    tourGraphic: { type: 'boolean' },
    taylorPhoto: { type: 'boolean' },
  },
};

function mondayUtc(value) {
  const date = new Date(value);
  const day = date.getUTCDay() || 7;
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

export function remainingWeeklyCapacity(catalog, now, cap = FANMADE_WEEKLY_CAP) {
  const start = mondayUtc(now).getTime();
  const used = catalog.filter((item) => {
    const verified = new Date(item?.verifiedAt).getTime();
    return Number.isFinite(verified) && verified >= start && verified <= new Date(now).getTime();
  }).length;
  return Math.max(0, cap - used);
}

function rejection(issueNumber, reason) {
  return { issueNumber, reason };
}

function productId(url) {
  return new URL(url).pathname.match(/\/listing\/(\d+)/)?.[1] || url;
}

function d3Passed(d3) {
  return d3?.judgment === 'inspired-original' && d3.prohibitedMaterial === 'none'
    && !d3.officialArtwork && !d3.tourGraphic && !d3.taylorPhoto;
}

async function classifyWithJev(candidate, client) {
  return client.ask({
    caller: 'merch-fanmade-curate',
    state: JSON.stringify({ title: candidate.item, maker: candidate.brand, price: candidate.price, url: candidate.url }),
    questions: JEV_QUESTIONS,
  });
}

async function judgeD3(candidate, image, callClaudeImpl) {
  return callClaudeImpl({
    caller: 'merch-fanmade-curate-d3', priority: FANMADE_PRIORITY, model: D3_MODEL,
    system: 'Judge whether a fan-made listing image uses only an original inspired design. Reject official artwork, tour graphics, Taylor Swift photographs, or other copied protected imagery. Describe only visible evidence.',
    user: `Listing title: ${candidate.item || 'unknown'}\nMaker: ${candidate.brand || 'unknown'}\nReturn the D3 judgment for the staged listing image.`,
    schema: D3_SCHEMA, images: [image], maxCalls: 10, maxInputTokens: 5_000,
  });
}

export async function curateFanmadeIssues({
  issues,
  existingCatalog = [],
  now = new Date().toISOString(),
  jevClient,
  callClaudeImpl = callClaude,
  verifyProductUrlImpl = defaultVerifyUrl,
  verifyImageImpl = verifyImage,
  fetchImageImpl = fetchClaudeImage,
  log = console.log,
} = {}) {
  const accepted = [];
  const rejected = [];
  const unresolved = [];
  const capacity = remainingWeeklyCapacity(existingCatalog, now);
  const existingUrls = new Set(existingCatalog.map((item) => canonicalUrl(item.url)).filter(Boolean));
  if (capacity === 0) return { accepted, rejected, unresolved, capacity, status: 'capped' };

  function leaveUnresolved(issueNumber, reason) {
    log(`fanmade-curation: ${reason}; issue #${issueNumber} left open`);
    unresolved.push({ issueNumber, reason });
  }

  for (const issue of issues) {
    if (accepted.length >= capacity) break;
    const number = issue?.issueNumber ?? issue?.number;
    const normalizedUrl = canonicalUrl(issue?.url);
    if (!normalizedUrl) { rejected.push(rejection(number, 'invalid candidate metadata')); continue; }
    if (existingUrls.has(normalizedUrl)) { rejected.push(rejection(number, 'listing is already curated')); continue; }
    const candidate = { ...issue, url: normalizedUrl };
    let jev;
    try {
      jev = await classifyWithJev(candidate, jevClient);
    } catch (error) {
      log(`fanmade-curation: Jev unavailable; issue #${number} left open (${error?.message || error})`);
      unresolved.push({ issueNumber: number, reason: 'Jev unavailable' });
      return { accepted: [], rejected, unresolved, capacity, status: 'unavailable' };
    }
    const bootleg = jev.answers.q_bootleg;
    const kind = jev.answers.q_merch_kind;
    if (bootleg?.type !== 'noul' || kind?.type !== 'choice') {
      unresolved.push({ issueNumber: number, reason: 'Jev response invalid' });
      return { accepted: [], rejected, unresolved, capacity, status: 'unavailable' };
    }
    if (bootleg.probability > BOOTLEG_REJECT_THRESHOLD) {
      rejected.push(rejection(number, `bootleg probability ${bootleg.probability.toFixed(2)} exceeds ${BOOTLEG_REJECT_THRESHOLD}`));
      continue;
    }
    if (kind.optionId !== 'fan_original' || kind.confidence < MERCH_KIND_THRESHOLD) {
      rejected.push(rejection(number, `merch kind is ${kind.optionId} at ${kind.confidence.toFixed(2)} confidence`));
      continue;
    }
    let listingVerification;
    try { listingVerification = await verifyProductUrlImpl(candidate.url); }
    catch (error) {
      leaveUnresolved(number, `E1 listing verification unavailable: ${error?.message || error}`);
      continue;
    }
    if (['blocked', 'unavailable'].includes(listingVerification?.verdict)
      || [403, 429].includes(listingVerification?.status) || listingVerification?.status >= 500) {
      leaveUnresolved(number, `E1 listing verification unavailable${listingVerification.status ? ` (HTTP ${listingVerification.status})` : ''}`);
      continue;
    }
    if ([404, 410].includes(listingVerification?.status)) {
      rejected.push(rejection(number, `E1 listing verification failed (HTTP ${listingVerification.status})`));
      continue;
    }
    if (!(listingVerification === true || listingVerification?.verdict === 'ok')) {
      leaveUnresolved(number, 'E1 listing verification unavailable');
      continue;
    }
    let imageVerification;
    try { imageVerification = candidate.imageUrl && await verifyImageImpl(candidate.imageUrl); }
    catch (error) {
      leaveUnresolved(number, `E2 image verification unavailable: ${error?.message || error}`);
      continue;
    }
    if (['blocked', 'unavailable'].includes(imageVerification?.verdict)
      || [403, 429].includes(imageVerification?.status) || imageVerification?.status >= 500) {
      leaveUnresolved(number, `E2 image verification unavailable${imageVerification?.status ? ` (HTTP ${imageVerification.status})` : ''}`);
      continue;
    }
    if (imageVerification?.verdict !== 'ok') {
      const suffix = imageVerification?.status ? ` (HTTP ${imageVerification.status})` : '';
      rejected.push(rejection(number, `E2 image verification failed${suffix}`));
      continue;
    }
    let image;
    try { image = await fetchImageImpl(candidate.imageUrl); }
    catch (error) {
      if ([404, 410].includes(error?.status) || ['unsupported', 'too large'].includes(error?.code)) {
        rejected.push(rejection(number, `E2 image download failed: ${error.message}`));
      } else {
        leaveUnresolved(number, `E2 image download unavailable: ${error?.message || error}`);
      }
      continue;
    }
    let vision;
    try { vision = await judgeD3(candidate, image, callClaudeImpl); }
    catch { vision = { status: 'unavailable', reason: 'wrapper call failed' }; }
    if (vision.status !== 'ok') {
      log(`fanmade-curation: wrapper unavailable; issue #${number} left open (${vision.reason})`);
      unresolved.push({ issueNumber: number, reason: 'vision wrapper unavailable' });
      return { accepted: [], rejected, unresolved, capacity, status: 'unavailable' };
    }
    if (!d3Passed(vision.data)) { rejected.push(rejection(number, 'D3 vision check rejected prohibited imagery')); continue; }
    const evidence = {
      ...candidate.provenance[0],
      d3: { judgment: vision.data.judgment, prohibitedMaterial: vision.data.prohibitedMaterial, basis: vision.data.basis, verifiedAt: now },
      e1: { listingVerified: true, evidenceUrl: candidate.url, productId: productId(candidate.url), available: true, price: candidate.price, title: candidate.item, verifiedAt: now },
      e2: { imageVerified: true, evidenceUrl: candidate.imageUrl, officialArtwork: vision.data.officialArtwork, tourGraphic: vision.data.tourGraphic, taylorPhoto: vision.data.taylorPhoto, depicts: vision.data.depicts, verifiedAt: now },
    };
    const result = curateCandidate({ ...candidate, ...vision.data, listingVerified: true, imageVerified: true, kind: vision.data.kind, provenance: [evidence] }, now);
    if (!result.accepted) { rejected.push(rejection(number, result.reason)); continue; }
    accepted.push({ issueNumber: number, seed: result.seed });
    existingUrls.add(candidate.url);
  }
  return { accepted, rejected, unresolved, capacity, status: 'ok' };
}
