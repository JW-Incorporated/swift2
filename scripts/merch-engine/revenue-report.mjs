import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_COVERAGE_PATH = 'docs/ops/AFFILIATE-COVERAGE.md';
export const DEFAULT_OUTPUT_PATH = 'docs/ops/MERCH-REVENUE.json';

function nonNegativeNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return value;
}

function nonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

export function parseNetworkReport(input) {
  const network = nonEmptyString(input?.network, 'network');
  if (input.available === false) {
    return { network, available: false, reason: nonEmptyString(input.reason, 'reason'), rows: [] };
  }
  if (!Array.isArray(input?.rows)) throw new Error(`${network} rows must be an array`);
  return {
    network,
    available: true,
    rows: input.rows.map((row) => ({
      subid: nonEmptyString(row?.subid, 'subid'),
      retailer: row.retailer == null ? undefined : nonEmptyString(row.retailer, 'retailer'),
      clicks: nonNegativeNumber(row?.clicks, 'clicks'),
      revenue: nonNegativeNumber(row?.revenue, 'revenue'),
    })),
  };
}

export function parseReportInput(input) {
  return Array.isArray(input?.reports) ? input.reports : [input];
}

function addMetric(map, id, row) {
  const previous = map.get(id) ?? { id, clicks: 0, revenue: 0 };
  previous.clicks += row.clicks;
  previous.revenue += row.revenue;
  map.set(id, previous);
}

function ranked(map) {
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks || a.id.localeCompare(b.id));
}

function coverageBySource(coverage) {
  const rows = Array.isArray(coverage?.rows) ? coverage.rows : [];
  return rows.reduce((bySource, row) => {
    if (!row?.source || !row?.retailer || !row?.status) return bySource;
    const entries = bySource.get(row.source) ?? [];
    entries.push(row);
    bySource.set(row.source, entries);
    return bySource;
  }, new Map());
}

export function buildRevenueReport({ coverage = { rows: [] }, reports = [] } = {}) {
  const parsedReports = reports.map(parseNetworkReport);
  const sources = parsedReports.map(({ network, available, reason }) => available
    ? { network, status: 'available' }
    : { network, status: 'unavailable', reason });
  const byEra = new Map();
  const byMoment = new Map();
  const byBucket = new Map();
  const uncovered = new Map();
  const coverageSources = coverageBySource(coverage);
  const totals = { clicks: 0, revenue: 0 };

  for (const report of parsedReports.filter((item) => item.available)) {
    for (const row of report.rows) {
      totals.clicks += row.clicks;
      totals.revenue += row.revenue;
      const [era, ...momentParts] = row.subid.split('.');
      if (momentParts.length) {
        addMetric(byEra, era, row);
        addMetric(byMoment, row.subid, row);
      } else {
        addMetric(byBucket, row.subid, row);
      }
      const matchingCoverage = coverageSources.get(row.subid) ?? [];
      const retailerRows = row.retailer
        ? matchingCoverage.filter((coverageRow) => coverageRow.retailer === row.retailer)
        : [];
      for (const coverageRow of retailerRows) {
        if (coverageRow.status !== 'uncovered') continue;
        uncovered.set(coverageRow.retailer, (uncovered.get(coverageRow.retailer) ?? 0) + row.clicks);
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sources,
    totals,
    byEra: ranked(byEra),
    byMoment: ranked(byMoment),
    byBucket: ranked(byBucket),
    uncoveredRetailers: [...uncovered.entries()]
      .map(([retailer, clicks]) => ({ retailer, clicks }))
      .sort((a, b) => b.clicks - a.clicks || a.retailer.localeCompare(b.retailer)),
  };
}

function money(value) {
  return `$${value.toFixed(2)}`;
}

function metricLines(rows) {
  return rows.length ? rows.map((row) => `- ${row.id}: ${row.clicks} clicks · ${money(row.revenue)}`) : ['- —'];
}

export function formatRevenueSection(report) {
  const sourceLines = report.sources.length
    ? report.sources.map((source) => source.status === 'available'
      ? `- ${source.network[0].toUpperCase()}${source.network.slice(1)}: available`
      : `- ${source.network[0].toUpperCase()}${source.network.slice(1)}: unavailable — ${source.reason}`)
    : ['- No network reports were supplied.'];
  const availableSources = report.sources.filter((source) => source.status === 'available');
  const total = availableSources.length
    ? `- Total reported: ${report.totals.clicks} clicks · ${money(report.totals.revenue)}`
    : '- Total reported: unavailable (no reporting source is available)';
  const uncovered = report.uncoveredRetailers.length
    ? report.uncoveredRetailers.map((row) => `- ${row.retailer}: ${row.clicks} clicks`)
    : ['- —'];
  return [
    '## Merch revenue and clicks',
    '',
    total,
    '- Availability:', ...sourceLines,
    '- By era:', ...metricLines(report.byEra),
    '- By moment:', ...metricLines(report.byMoment),
    '- By bucket:', ...metricLines(report.byBucket),
    '- Top uncovered retailers by identified clicks:', ...uncovered,
  ].join('\n');
}

export function parseCoverage(markdown) {
  const rows = [...String(markdown).matchAll(/^\| (?!item \||--- \|)(.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$/gm)]
    .map((match) => ({
      item: match[1],
      retailer: match[2],
      network: match[3],
      status: match[4],
      linkFormat: match[5],
      source: match[6],
    }));
  return { rows };
}

export function loadRevenueSection(path = resolve(ROOT, DEFAULT_OUTPUT_PATH)) {
  if (!existsSync(path)) return null;
  try {
    const report = JSON.parse(readFileSync(path, 'utf8'));
    return formatRevenueSection(report);
  } catch {
    return null;
  }
}

function parseArguments(args) {
  const options = { inputs: [], coveragePath: resolve(ROOT, DEFAULT_COVERAGE_PATH), outputPath: resolve(ROOT, DEFAULT_OUTPUT_PATH) };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--input') options.inputs.push(args[++index]);
    else if (value === '--coverage') options.coveragePath = resolve(args[++index]);
    else if (value === '--output') options.outputPath = resolve(args[++index]);
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (options.inputs.some((input) => !input)) throw new Error('--input requires a JSON file path');
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const coverage = existsSync(options.coveragePath) ? parseCoverage(readFileSync(options.coveragePath, 'utf8')) : { rows: [] };
  const reports = options.inputs.flatMap((input) => {
    const parsed = JSON.parse(readFileSync(resolve(input), 'utf8'));
    return parseReportInput(parsed);
  });
  const report = buildRevenueReport({ coverage, reports });
  writeFileSync(options.outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(formatRevenueSection(report));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
