#!/usr/bin/env node
// E0 detector: generates checked-in programme metadata only; it never wraps links.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIRECTORY = 'apps/web/lib/longlive/awin-advertisers.json';
const PROGRAMMES_URL = 'https://api.awin.com/publishers/{publisherId}/programmes';

function hostname(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
  } catch {
    return null;
  }
}

function programmeInfo(programme) {
  return programme?.programmeInfo ?? programme ?? {};
}

function advertiserId(programme) {
  const value = programmeInfo(programme).id ?? programme?.advertiserId ?? programme?.id;
  return value === undefined || value === null ? null : String(value);
}

function domains(programme) {
  const info = programmeInfo(programme);
  return [info.displayUrl, info.primaryDomain, ...(info.validDomains ?? info.domains ?? [])]
    .flatMap((value) => (typeof value === 'object' ? [value?.domain ?? value?.url ?? value?.name] : [value]))
    .map(hostname)
    .filter(Boolean);
}

function status(programme) {
  return String(programmeInfo(programme).membershipStatus ?? programme?.membershipStatus ?? '').toLowerCase();
}

export function buildAdvertiserDirectory({ joined = [], directory = [], retailerHosts = new Set(), generatedAt }) {
  const joinedIds = new Set(joined.map(advertiserId).filter(Boolean));
  const retailers = new Set([...retailerHosts].map(hostname).filter(Boolean));
  const entries = new Map();
  for (const programme of directory) {
    const awinmid = advertiserId(programme);
    if (!awinmid) continue;
    const joinedProgramme = joinedIds.has(awinmid) || status(programme) === 'joined';
    for (const retailer of domains(programme)) {
      if (!retailers.has(retailer)) continue;
      const existing = entries.get(retailer);
      if (!existing || joinedProgramme) entries.set(retailer, { retailer, awinmid, joined: joinedProgramme });
    }
  }
  return {
    source: 'E0 Awin Publisher API cross-reference',
    generatedAt,
    advertisers: [...entries.values()].sort((left, right) => left.retailer.localeCompare(right.retailer)),
  };
}

export function jitterDelay(random = Math.random) {
  return 10_000 + Math.floor(Math.max(0, Math.min(0.999999, random())) * 110_001);
}

async function retailersFromCatalogue() {
  const { MERCH_CATALOGUE } = await import('../../apps/web/lib/longlive/merch.ts');
  return new Set(Object.values(MERCH_CATALOGUE).flat().map((product) => product.retailer));
}

async function requestProgrammes({ publisherId, token, relationship, fetchImpl = fetch }) {
  const url = new URL(PROGRAMMES_URL.replace('{publisherId}', encodeURIComponent(publisherId)));
  url.searchParams.set('relationship', relationship);
  const response = await fetchImpl(url, { headers: { authorization: `Bearer ${token}`, accept: 'application/json' } });
  if (!response.ok) throw new Error(`Awin programme request failed (${response.status})`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : payload?.programmes ?? payload?.data ?? [];
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const output = args.includes('--output') ? args[args.indexOf('--output') + 1] : DIRECTORY;
  if (!output || output.startsWith('--')) throw new Error('--output requires a path');
  const token = required(process.env.AWIN_API_TOKEN, 'AWIN_API_TOKEN');
  const publisherId = required(process.env.AWIN_PUBLISHER_ID, 'AWIN_PUBLISHER_ID');
  await new Promise((done) => setTimeout(done, jitterDelay()));
  const [joined, directory, retailerHosts] = await Promise.all([
    requestProgrammes({ publisherId, token, relationship: 'joined' }),
    requestProgrammes({ publisherId, token, relationship: 'any' }),
    retailersFromCatalogue(),
  ]);
  const generated = buildAdvertiserDirectory({ joined, directory, retailerHosts, generatedAt: new Date().toISOString() });
  const target = resolve(ROOT, output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ advertisers: generated.advertisers.length, joined: generated.advertisers.filter((entry) => entry.joined).length }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`merch-awin-programmes: ${error.message}`);
    process.exitCode = 1;
  });
}
