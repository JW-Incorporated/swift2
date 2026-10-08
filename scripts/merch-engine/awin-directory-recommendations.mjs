#!/usr/bin/env node
// E0 Awin join-recommendation list: read-only directory browse, no catalog matching,
// no auto-join, no affiliate links. Joey evaluates and joins manually via the Awin
// publisher dashboard.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requestProgrammes } from './awin-directory-shortlist.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Real Awin API sector taxonomy strings (UK English spelling), confirmed against a
// live unfiltered directory probe of this publisher's account (t_a57b0362, 2026-08-30).
// See awin-directory-shortlist.mjs for full rationale — must stay in sync with that file.
const TARGET_SECTORS = ['Clothing', 'Clothing Accessories', 'Jewellery', 'Health & Beauty'];
const RELATIONSHIPS = ['joined', 'pending', 'suspended', 'rejected', 'notjoined'];

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function programmeInfo(programme) {
  return programme?.programmeInfo ?? programme ?? {};
}

function advertiserId(programme) {
  const value = programmeInfo(programme).id ?? programme?.advertiserId ?? programme?.id;
  return value == null ? null : String(value);
}

function advertiserName(programme) {
  return text(programmeInfo(programme).name) ?? text(programme?.name) ?? null;
}

function programmeCountry(programme) {
  return (
    text(programmeInfo(programme).primaryRegion?.countryCode) ??
    text(programme?.primaryRegion?.countryCode) ??
    null
  );
}

function relationshipStatus(programme) {
  const info = programmeInfo(programme);
  return (
    text(programme.relationship) ??
    text(info.membershipStatus) ??
    text(programme.membershipStatus) ??
    'unknown'
  );
}

function programmeSectors(programme) {
  const info = programmeInfo(programme);
  const values = [
    info.primarySector,
    info.sectors,
    info.sector,
    info.categories,
    info.category,
    programme.primarySector,
    programme.sectors,
    programme.sector,
    programme.categories,
    programme.category,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .flatMap((value) =>
      typeof value === 'object' && value
        ? [value.name, value.label, value.category, value.sector]
        : [value],
    )
    .map(text)
    .filter(Boolean);
  return [...new Set(values)];
}

function primarySector(programme, targetSectors) {
  const sectors = programmeSectors(programme);
  const targetSet = new Set(targetSectors.map((sector) => sector.toLowerCase()));
  return sectors.find((sector) => targetSet.has(sector.toLowerCase())) ?? sectors[0] ?? null;
}

// The Awin Publisher API does not return a documented "join" URL field. Only surface
// one if the programme payload actually provides it — never fabricate a link.
const JOIN_URL_FIELDS = ['joinUrl', 'applyUrl', 'applicationUrl', 'programmeUrl'];

function joinUrl(programme) {
  const info = programmeInfo(programme);
  for (const field of JOIN_URL_FIELDS) {
    const value = text(info[field]) ?? text(programme?.[field]);
    if (value) return value;
  }
  return null;
}

function commissionStatus(programme) {
  const info = programmeInfo(programme);
  return (
    text(info.commissionStatus) ??
    text(programme?.commissionStatus) ??
    text(info.commissionRange) ??
    text(programme?.commissionRange) ??
    null
  );
}

function validationStatus(programme) {
  const info = programmeInfo(programme);
  return (
    text(info.validationStatus) ??
    text(programme?.validationStatus) ??
    text(info.validationPeriod) ??
    text(programme?.validationPeriod) ??
    null
  );
}

function candidateRow(programme, targetSectors, feedAdvertiserIds) {
  const id = advertiserId(programme);
  return {
    advertiserId: id,
    advertiserName: advertiserName(programme),
    primarySector: primarySector(programme, targetSectors),
    country: programmeCountry(programme),
    relationshipStatus: relationshipStatus(programme),
    joinUrl: joinUrl(programme),
    productFeedAvailable: id ? feedAdvertiserIds.has(id) : false,
    commissionStatus: commissionStatus(programme),
    validationStatus: validationStatus(programme),
  };
}

export function buildRecommendations({
  programmes = [],
  feedAdvertiserIds = new Set(),
  targetSectors = TARGET_SECTORS,
  generatedAt = new Date().toISOString(),
} = {}) {
  const targetSet = new Set(targetSectors.map((sector) => sector.toLowerCase()));
  const seen = new Set();
  const candidates = [];
  for (const programme of programmes) {
    const id = advertiserId(programme);
    const name = advertiserName(programme);
    if (!id || !name) continue;
    if (programmeCountry(programme) !== 'US') continue;
    if (relationshipStatus(programme) === 'joined') continue;
    if (!programmeSectors(programme).some((sector) => targetSet.has(sector.toLowerCase())))
      continue;
    if (seen.has(id)) continue;
    seen.add(id);
    candidates.push(candidateRow(programme, targetSectors, feedAdvertiserIds));
  }
  candidates.sort(
    (left, right) =>
      (left.primarySector ?? '').localeCompare(right.primarySector ?? '') ||
      left.advertiserName.localeCompare(right.advertiserName) ||
      left.advertiserId.localeCompare(right.advertiserId),
  );
  const bySector = {};
  for (const sector of targetSectors) {
    bySector[sector] = candidates.filter((row) => row.primarySector === sector).length;
  }
  return {
    version: 1,
    generatedAt,
    source: 'Awin Publisher API GET programmes filtered by countryCode=US and target sectors',
    label: 'candidates to evaluate and join manually — not automatic joins',
    targetSectors,
    summary: {
      total: candidates.length,
      bySector,
    },
    candidates,
  };
}

const COLUMNS = [
  'advertiserName',
  'advertiserId',
  'primarySector',
  'country',
  'relationshipStatus',
  'joinUrl',
  'productFeedAvailable',
  'commissionStatus',
  'validationStatus',
];
const CSV_COLUMNS = [
  'advertiser_name',
  'advertiser_id',
  'primary_sector',
  'country',
  'relationship_status',
  'join_url',
  'product_feed_available',
  'commission_status',
  'validation_status',
];

function csvCell(value) {
  const textValue = value == null ? '' : String(value);
  return /[",\n\r]/.test(textValue) ? `"${textValue.replaceAll('"', '""')}"` : textValue;
}

export function formatCsv(report) {
  const rows = report.candidates.map((row) =>
    COLUMNS.map((column) => csvCell(row[column])).join(','),
  );
  return `${CSV_COLUMNS.join(',')}\n${rows.join('\n')}\n`;
}

function table(rows) {
  return rows.length
    ? rows
        .map(
          (row) =>
            `| ${COLUMNS.map((column) => String(row[column] ?? '').replaceAll('|', '\\|')).join(' | ')} |`,
        )
        .join('\n')
    : '| — | — | — | — | — | — | — | — | — |';
}

export function formatMarkdown(report) {
  const heading =
    '| advertiser name | advertiser id | primary sector | country | relationship status | join url | product feed available | commission status | validation status |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const bySectorLines = report.targetSectors
    .map((sector) => `- ${sector}: ${report.summary.bySector[sector] ?? 0}`)
    .join('\n');
  return `# Awin US retailer join-recommendation list\n\nGenerated: ${report.generatedAt}\n\n**${report.label}.**\n\nTarget sectors: ${report.targetSectors.join(', ')}. This artifact lists Awin advertisers Joey has NOT joined yet in the target US sectors, sourced from the Awin Publisher API programme directory. It does not contain affiliate links, product URLs, credentials, or feed contents, and is not a match against the current merch catalog.\n\n## Summary\n\n- Total candidates: ${report.summary.total}\n${bySectorLines}\n\n## Candidates\n\n${heading}\n${table(report.candidates)}\n`;
}

function required(value, name) {
  if (!text(value)) throw new Error(`${name} is required`);
  return value;
}

async function requestFeedAdvertiserIds(apiKey) {
  const response = await fetch(
    `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) throw new Error(`Awin feed-list request failed (${response.status})`);
  const csv = await response.text();
  const [header = '', ...lines] = csv.trim().split(/\r?\n/);
  const names = header.split(',').map((value) => value.trim().toLowerCase());
  const index = ['merchant id', 'merchant_id', 'advertiser id', 'advertiser_id', 'mid']
    .map((name) => names.indexOf(name))
    .find((value) => value >= 0);
  return new Set(
    index == null
      ? []
      : lines
          .filter(Boolean)
          .map((line) => line.split(',')[index]?.trim())
          .filter(Boolean),
  );
}

async function main() {
  const output = process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : '.artifacts/merch-awin-directory-recommendations';
  if (!output || output.startsWith('--')) throw new Error('--output requires a directory path');
  const token = required(process.env.AWIN_API_TOKEN, 'AWIN_API_TOKEN');
  const publisherId = required(process.env.AWIN_PUBLISHER_ID, 'AWIN_PUBLISHER_ID');
  const feedApiKey = required(process.env.AWIN_FEED_API_KEY, 'AWIN_FEED_API_KEY');
  const [programmeResponses, feedAdvertiserIds] = await Promise.all([
    Promise.all(
      RELATIONSHIPS.map((relationship) => requestProgrammes({ publisherId, token, relationship })),
    ),
    requestFeedAdvertiserIds(feedApiKey),
  ]);
  const report = buildRecommendations({
    programmes: programmeResponses.flat(),
    feedAdvertiserIds,
  });
  const target = resolve(ROOT, output);
  await mkdir(target, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(target, 'awin-directory-recommendations.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    ),
    writeFile(resolve(target, 'awin-directory-recommendations.csv'), formatCsv(report)),
    writeFile(resolve(target, 'awin-directory-recommendations.md'), formatMarkdown(report)),
  ]);
  console.log(JSON.stringify(report.summary));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`merch-awin-directory-recommendations: ${error.message}`);
    process.exitCode = 1;
  });
}
