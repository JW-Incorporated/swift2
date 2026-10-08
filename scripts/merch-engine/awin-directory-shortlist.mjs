#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROGRAMMES_URL = 'https://api.awin.com/publishers/{publisherId}/programmes';
// Real Awin API sector taxonomy strings (UK English spelling), confirmed against a
// live unfiltered directory probe of this publisher's account (t_a57b0362, 2026-08-30):
// "Clothing", "Clothing Accessories", "Jewellery", "Health & Beauty" are the actual
// sector values Awin returns for US fashion/accessories/beauty programmes. The
// previous strings ('Fashion/Clothing', 'Accessories/Jewelry', 'Beauty' — US spelling)
// never matched any real programme, so eligibleProgrammes() silently filtered out
// the entire directory. Do not rename these without re-verifying against a live probe.
const TARGET_SECTORS = ['Clothing', 'Clothing Accessories', 'Jewellery', 'Health & Beauty'];
const RELATIONSHIPS = ['joined', 'pending', 'suspended', 'rejected', 'notjoined'];

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function hostname(value) {
  const candidate = text(value);
  if (!candidate) return null;
  try {
    return new URL(candidate.includes('://') ? candidate : `https://${candidate}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isDomainSuffixMatch(left, right) {
  if (!left || !right || left === right) return false;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  return shorter.includes('.') && longer.endsWith(`.${shorter}`);
}

function domainKey(value) {
  const host = hostname(value);
  if (!host) return null;
  const labels = host.split('.');
  const meaningful = labels.length > 1 ? labels.slice(0, -1).join('') : labels[0];
  return meaningful.replace(/[^a-z0-9]/g, '') || null;
}

function brandKey(value) {
  return (
    text(value)
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || null
  );
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

function programmeStatus(programme) {
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

const SOURCE_FIELD_PRECEDENCE = ['displayUrl', 'primaryDomain', 'validDomains', 'domains'];

function sourceHostnames(programme) {
  const info = programmeInfo(programme);
  const byHost = new Map();
  for (const field of SOURCE_FIELD_PRECEDENCE) {
    const raw = info[field];
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      const host = hostname(
        typeof value === 'object' && value ? (value.domain ?? value.url ?? value.name) : value,
      );
      if (host && !byHost.has(host)) byHost.set(host, field);
    }
  }
  return [...byHost.entries()].map(([host, sourceField]) => ({ host, sourceField }));
}

function eligibleProgrammes(programmes) {
  const targetSectors = new Set(TARGET_SECTORS.map((sector) => sector.toLowerCase()));
  return programmes
    .map((programme) => ({
      id: advertiserId(programme),
      name: advertiserName(programme),
      status: programmeStatus(programme),
      country: programmeCountry(programme),
      sectors: programmeSectors(programme),
      hosts: sourceHostnames(programme),
    }))
    .filter((programme) => programme.id && programme.name && programme.country === 'US')
    .filter((programme) =>
      programme.sectors.some((sector) => targetSectors.has(sector.toLowerCase())),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function retailerRows(catalogue) {
  const counts = new Map();
  for (const product of catalogue) {
    const retailer = hostname(product?.retailer);
    if (retailer) counts.set(retailer, (counts.get(retailer) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([currentRetailer, productCount]) => ({ currentRetailer, productCount }))
    .sort((left, right) => left.currentRetailer.localeCompare(right.currentRetailer));
}

function candidateRow(
  retailer,
  programme,
  sourceHostname,
  sourceField,
  matchType,
  matchEvidence,
  feedAdvertiserIds,
) {
  return {
    currentRetailer: retailer.currentRetailer,
    productCount: retailer.productCount,
    awinAdvertiserName: programme?.name ?? null,
    awinAdvertiserId: programme?.id ?? null,
    sourceHostname: sourceHostname ?? null,
    sourceField: sourceField ?? null,
    matchEvidence,
    matchType,
    usProgrammeStatus: programme?.status ?? 'not found',
    feedAvailable: programme ? feedAdvertiserIds.has(programme.id) : false,
  };
}

export function buildShortlist({
  catalogue = [],
  programmes = [],
  feedAdvertiserIds = new Set(),
  generatedAt = new Date().toISOString(),
} = {}) {
  const eligible = eligibleProgrammes(programmes);
  const retailers = retailerRows(catalogue);
  const exactByRetailer = new Map();
  for (const retailer of retailers) {
    const matches = eligible.flatMap((programme) =>
      programme.hosts
        .filter((entry) => entry.host === retailer.currentRetailer)
        .map((entry) => ({ programme, entry })),
    );
    if (matches.length === 1) exactByRetailer.set(retailer.currentRetailer, matches[0]);
  }
  const usedIds = new Set([...exactByRetailer.values()].map(({ programme }) => programme.id));
  const domainSuffixByRetailer = new Map();
  for (const retailer of retailers.filter((row) => !exactByRetailer.has(row.currentRetailer))) {
    const matches = eligible
      .filter((programme) => !usedIds.has(programme.id))
      .flatMap((programme) =>
        programme.hosts
          .filter((entry) => isDomainSuffixMatch(entry.host, retailer.currentRetailer))
          .map((entry) => ({ programme, entry })),
      );
    if (matches.length === 1) domainSuffixByRetailer.set(retailer.currentRetailer, matches[0]);
  }
  const matches = [
    ...retailers
      .filter((row) => exactByRetailer.has(row.currentRetailer))
      .map((retailer) => {
        const match = exactByRetailer.get(retailer.currentRetailer);
        return candidateRow(
          retailer,
          match.programme,
          match.entry.host,
          match.entry.sourceField,
          'exact-hostname',
          'Awin programme domain hostname exactly matches retailer',
          feedAdvertiserIds,
        );
      }),
    ...retailers
      .filter((row) => domainSuffixByRetailer.has(row.currentRetailer))
      .map((retailer) => {
        const match = domainSuffixByRetailer.get(retailer.currentRetailer);
        return candidateRow(
          retailer,
          match.programme,
          match.entry.host,
          match.entry.sourceField,
          'domain-suffix',
          'Awin programme domain is a unique suffix match for retailer',
          feedAdvertiserIds,
        );
      }),
  ];
  const matchedRetailers = new Set(matches.map((row) => row.currentRetailer));
  const manualReview = retailers
    .filter((retailer) => !matchedRetailers.has(retailer.currentRetailer))
    .flatMap((retailer) => {
      const retailerBrand = domainKey(retailer.currentRetailer);
      return eligible
        .filter(
          (programme) =>
            brandKey(programme.name) === retailerBrand ||
            programme.hosts.some(
              (entry) =>
                domainKey(entry.host) === retailerBrand ||
                isDomainSuffixMatch(entry.host, retailer.currentRetailer),
            ),
        )
        .map((programme) => {
          const nameMatches = brandKey(programme.name) === retailerBrand;
          const domainTrigger = programme.hosts.find(
            (entry) =>
              domainKey(entry.host) === retailerBrand ||
              isDomainSuffixMatch(entry.host, retailer.currentRetailer),
          );
          return candidateRow(
            retailer,
            programme,
            nameMatches ? null : domainTrigger ? domainTrigger.host : null,
            nameMatches ? 'name' : domainTrigger ? domainTrigger.sourceField : 'name',
            'manual-review',
            'Awin programme name or domain shares a normalized key or suffix with retailer',
            feedAdvertiserIds,
          );
        });
    })
    .sort(
      (left, right) =>
        left.currentRetailer.localeCompare(right.currentRetailer) ||
        left.awinAdvertiserId.localeCompare(right.awinAdvertiserId),
    );
  const reviewRetailers = new Set(manualReview.map((row) => row.currentRetailer));
  const unmatched = retailers
    .filter(
      (retailer) =>
        !matchedRetailers.has(retailer.currentRetailer) &&
        !reviewRetailers.has(retailer.currentRetailer),
    )
    .map((retailer) =>
      candidateRow(
        retailer,
        null,
        null,
        null,
        'unmatched',
        'no supported Awin name or domain signal',
        feedAdvertiserIds,
      ),
    );
  return {
    version: 1,
    generatedAt,
    source: 'Awin Publisher API GET programmes filtered by countryCode=US and target sectors',
    targetSectors: TARGET_SECTORS,
    summary: {
      exact: matches.filter((row) => row.matchType === 'exact-hostname').length,
      domainSuffix: matches.filter((row) => row.matchType === 'domain-suffix').length,
      manualReview: manualReview.length,
      unmatched: unmatched.length,
    },
    matches,
    manualReview,
    unmatched,
  };
}

const COLUMNS = [
  'currentRetailer',
  'productCount',
  'awinAdvertiserName',
  'awinAdvertiserId',
  'sourceHostname',
  'sourceField',
  'matchEvidence',
  'matchType',
  'usProgrammeStatus',
  'feedAvailable',
];
const CSV_COLUMNS = [
  'current_retailer',
  'product_count',
  'awin_advertiser_name',
  'awin_advertiser_id',
  'source_hostname',
  'source_field',
  'match_evidence',
  'match_type',
  'us_programme_status',
  'product_feed_available',
];

function csvCell(value) {
  const textValue = value == null ? '' : String(value);
  return /[",\n\r]/.test(textValue) ? `"${textValue.replaceAll('"', '""')}"` : textValue;
}

function csvRows(rows) {
  return rows.map((row) => COLUMNS.map((column) => csvCell(row[column])).join(','));
}

export function formatCsv(report) {
  return `${CSV_COLUMNS.join(',')}\n${csvRows([...report.matches, ...report.manualReview, ...report.unmatched]).join('\n')}\n`;
}

function table(rows) {
  return rows.length
    ? rows
        .map(
          (row) =>
            `| ${COLUMNS.map((column) => String(row[column] ?? '').replaceAll('|', '\\|')).join(' | ')} |`,
        )
        .join('\n')
    : '| — | — | — | — | — | — | — | — | — | — |';
}

export function formatMarkdown(report) {
  const heading =
    '| current retailer | product count | Awin advertiser name | Awin advertiser id | source hostname | source field | match evidence | match type | US/programme status | product feed available |\n| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |';
  return `# Awin US advertiser directory shortlist\n\nGenerated: ${report.generatedAt}\n\nTarget sectors: ${report.targetSectors.join(', ')}. This artifact is derived from the Awin Publisher API and does not contain affiliate links, product URLs, credentials, or feed contents.\n\n## Summary\n\n- Exact hostname matches: ${report.summary.exact}\n- Domain-suffix matches: ${report.summary.domainSuffix}\n- Manual-review candidates: ${report.summary.manualReview}\n- Unmatched retailers: ${report.summary.unmatched}\n\n## Exact hostname and domain-suffix matches\n\n${heading}\n${table(report.matches)}\n\n## Manual-review candidates\n\nThese records share only a normalized name or domain signal. They are not join recommendations.\n\n${heading}\n${table(report.manualReview)}\n\n## Unmatched retailers\n\n${heading}\n${table(report.unmatched)}\n`;
}

function parseFeedAdvertiserIds(csv) {
  const [header = '', ...lines] = String(csv).trim().split(/\r?\n/);
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

function nextPageUrl(link) {
  const next = link?.split(',').find((part) => /\brel="?next"?/i.test(part));
  return next?.match(/<([^>]+)>/)?.[1] ?? null;
}

function validatedPageUrl(value, base) {
  const url = new URL(value, base);
  if (url.protocol !== 'https:' || url.origin !== 'https://api.awin.com') {
    throw new Error('Awin programme pagination must remain on the Awin API origin');
  }
  return url;
}

export async function requestProgrammes({ publisherId, token, relationship, fetchImpl = fetch }) {
  const programmes = [];
  const seen = new Set();
  let pageUrl = new URL(PROGRAMMES_URL.replace('{publisherId}', encodeURIComponent(publisherId)));
  pageUrl.searchParams.set('countryCode', 'US');
  pageUrl.searchParams.set('relationship', relationship);
  do {
    pageUrl.searchParams.set('countryCode', 'US');
    pageUrl.searchParams.set('relationship', relationship);
    pageUrl.searchParams.set('accessToken', token);
    const response = await fetchImpl(pageUrl, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Awin programmes request failed (${response.status})`);
    const payload = await response.json();
    const page = Array.isArray(payload) ? payload : (payload?.programmes ?? payload?.data ?? []);
    programmes.push(...page.map((programme) => ({ ...programme, relationship })));
    const next = nextPageUrl(response.headers.get('link'));
    pageUrl = next ? validatedPageUrl(next, pageUrl) : null;
    if (pageUrl) {
      pageUrl.searchParams.set('countryCode', 'US');
      pageUrl.searchParams.set('relationship', relationship);
    }
    if (pageUrl && seen.has(pageUrl.toString())) {
      throw new Error('Awin programme pagination repeated a page URL');
    }
    if (pageUrl) seen.add(pageUrl.toString());
  } while (pageUrl);
  return programmes;
}

async function requestFeedAdvertiserIds(apiKey) {
  const response = await fetch(
    `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) throw new Error(`Awin feed-list request failed (${response.status})`);
  return parseFeedAdvertiserIds(await response.text());
}

function required(value, name) {
  if (!text(value)) throw new Error(`${name} is required`);
  return value;
}

async function catalogue() {
  const { MERCH_CATALOGUE } = await import('../../apps/web/lib/longlive/merch.ts');
  return Object.values(MERCH_CATALOGUE).flat();
}

async function main() {
  const output = process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : '.artifacts/merch-awin-directory-shortlist';
  if (!output || output.startsWith('--')) throw new Error('--output requires a directory path');
  const token = required(process.env.AWIN_API_TOKEN, 'AWIN_API_TOKEN');
  const publisherId = required(process.env.AWIN_PUBLISHER_ID, 'AWIN_PUBLISHER_ID');
  const feedApiKey = required(process.env.AWIN_FEED_API_KEY, 'AWIN_FEED_API_KEY');
  const [programmeResponses, feedAdvertiserIds, products] = await Promise.all([
    Promise.all(
      RELATIONSHIPS.map((relationship) => requestProgrammes({ publisherId, token, relationship })),
    ),
    requestFeedAdvertiserIds(feedApiKey),
    catalogue(),
  ]);
  const report = buildShortlist({
    catalogue: products,
    programmes: programmeResponses.flat(),
    feedAdvertiserIds,
  });
  const target = resolve(ROOT, output);
  await mkdir(target, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(target, 'awin-directory-shortlist.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    ),
    writeFile(resolve(target, 'awin-directory-shortlist.csv'), formatCsv(report)),
    writeFile(resolve(target, 'awin-directory-shortlist.md'), formatMarkdown(report)),
  ]);
  console.log(JSON.stringify(report.summary));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`merch-awin-directory-shortlist: ${error.message}`);
    process.exitCode = 1;
  });
}
