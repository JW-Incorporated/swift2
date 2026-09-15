import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../../lib/cli.mjs';
import { findExistingBySource } from './build-ticket-source.mjs';
const NEXT_DYNAMIC_SEGMENT =
  /^(?:\[[A-Za-z0-9_-]+\]|\[\.\.\.[A-Za-z0-9_-]+\]|\[\[\.\.\.[A-Za-z0-9_-]+\]\])$/;
export const AUSTIN_PATH_ALLOWLIST = Object.freeze(['apps/web/', 'packages/', 'docs/']);
export const AUSTIN_PATH_EXCLUSIONS = Object.freeze({
  prefixes: [
    '.github/',
    'apps/web/app/api/',
    'docs/agents/',
    'docs/proposals/',
    'docs/specs/',
    'supabase/migrations/',
  ],
  files: ['CLAUDE.md', 'docs/architecture.md', 'docs/decisions.md'],
  basenames: [
    'package.json',
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
  ],
});
function normalizedPath(value) {
  const candidate = String(value ?? '')
    .trim()
    .replaceAll('\\', '/')
    .replace(/^\.\//, '');
  if (!candidate) throw new Error('Where needs at least one concrete file path');
  if (/^[A-Za-z]:\//.test(candidate) || candidate.startsWith('/')) {
    throw new Error(`path must be repository-relative: ${candidate}`);
  }
  const segments = candidate.split('/');
  if (segments.includes('..')) throw new Error(`path may not traverse: ${candidate}`);
  if (segments.includes('.') || segments.includes('')) {
    throw new Error(`path must be canonical: ${candidate}`);
  }
  if (['*', '?', '{', '}'].some((token) => candidate.includes(token))) {
    throw new Error(`path must name a concrete file, not a pattern: ${candidate}`);
  }
  if (segments.some((segment) => /[[\]]/.test(segment) && !NEXT_DYNAMIC_SEGMENT.test(segment))) {
    throw new Error(`path must name a concrete file, not a pattern: ${candidate}`);
  }
  return candidate;
}
export function normalizePaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('Where needs at least one concrete file path');
  }
  return [...new Set(paths.map(normalizedPath))];
}
export function isAustinAllowedPath(value) {
  let candidate;
  try {
    candidate = normalizedPath(value);
  } catch {
    return false;
  }
  const basename = candidate.split('/').at(-1);
  if (!basename?.includes('.')) return false;
  if (AUSTIN_PATH_EXCLUSIONS.files.includes(candidate)) return false;
  if (AUSTIN_PATH_EXCLUSIONS.basenames.includes(basename)) return false;
  if (AUSTIN_PATH_EXCLUSIONS.prefixes.some((prefix) => candidate.startsWith(prefix))) return false;
  if (/^apps\/web\/app\/(?:.*\/)?route\.[cm]?[jt]sx?$/i.test(candidate)) return false;
  if (/(^|\/)\.env(?:\.|$)/i.test(candidate)) return false;
  if (/(^|\/)(?:[^/]*secret[^/]*|auth(?:entication)?(?:[-_.][^/]*)?)(?:\/|\.|$)/i.test(candidate))
    return false;
  if (/(^|\/)(?:schema|migrations?)(?:\/|\.|$)/i.test(candidate)) return false;
  const root = AUSTIN_PATH_ALLOWLIST.find((entry) => candidate.startsWith(entry));
  if (!root) return false;
  if (root === 'docs/' && !candidate.endsWith('.md')) return false;
  return true;
}
export function sizeFromPaths(paths, estimatedLines, { needsSpec = false } = {}) {
  const normalized = normalizePaths(paths);
  if (needsSpec) return 'large';
  const linesKnown = Number.isInteger(estimatedLines) && estimatedLines > 0;
  if (
    linesKnown &&
    estimatedLines <= 150 &&
    normalized.length <= 5 &&
    normalized.every(isAustinAllowedPath)
  ) {
    return 'small';
  }
  return 'medium';
}
function requiredText(value, name) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${name} is required`);
  return text;
}
function expectedText(value) {
  const text = requiredText(value, 'Expected');
  const masked = text.replace(/\b(?:[A-Za-z]\.){2,}/g, (match) => ' '.repeat(match.length));
  if (/[.!?](?=\p{Lu})/u.test(masked)) {
    throw new Error('Expected must be one to three sentences');
  }
  const sentences = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(masked)]
    .length;
  if (sentences > 3) throw new Error('Expected must be one to three sentences');
  return text;
}
function sourceValue(source) {
  const value = requiredText(source, 'source');
  if (value === 'issue' || value === 'alert' || /^chat:https:\/\/\S+$/.test(value)) return value;
  throw new Error('source must be issue, alert, or chat:<https message link>');
}
function quoteVerbatim(value) {
  return String(value)
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => (line.startsWith('@') ? `> \`${line}\`` : line ? `> ${line}` : '>'))
    .join('\n');
}
function sizeLine(size, paths, estimatedLines) {
  const lines = Number.isInteger(estimatedLines) && estimatedLines > 0 ? estimatedLines : 'unknown';
  const allowed = paths.every(isAustinAllowedPath) ? 'yes' : 'no';
  return `\`${size}\` (files=${paths.length}; estimated-lines=${lines}; Austin-allowlist=${allowed})`;
}
export function renderBuildTicket(input = {}) {
  const expected = expectedText(input.expected);
  const surface = requiredText(input.surface, 'Where.surface');
  const paths = normalizePaths(input.paths);
  const acceptance = (input.acceptanceCriteria || [])
    .map((item) => String(item).trim())
    .filter(Boolean);
  if (acceptance.length === 0) throw new Error('Acceptance criteria is required');
  const source = sourceValue(input.source);
  if (source.startsWith('chat:') && String(input.reporterSaid ?? '').trim()) {
    throw new Error(
      "founder's Discord words must not be copied into a public ticket; use the message link",
    );
  }
  const size = sizeFromPaths(paths, input.estimatedLines, { needsSpec: input.needsSpec === true });
  if (size === 'large')
    throw new Error('large item requires a spec and must not be filed as a build ticket');
  const sections = [
    `**Expected**\n${expected}`,
    `**Where**\nSurface: ${surface}\nFiles:\n${paths.map((p) => `- \`${p}\``).join('\n')}`,
    `**Size**\n${sizeLine(size, paths, input.estimatedLines)}`,
    `**Acceptance criteria**\n${acceptance.map((item) => `- [ ] ${item}`).join('\n')}`,
  ];
  const reporter = String(input.reporterSaid ?? '').trim();
  if (reporter) sections.push(`**Reporter said**\n${quoteVerbatim(reporter)}`);
  sections.push(`<!-- marjorie-build: size=${size} source=${source} -->`);
  const sourceContext = String(input.sourceContext ?? '').trim();
  const context = String(input.context ?? '').trim();
  if (sourceContext) sections.push(sourceContext);
  if (context) sections.push(context);
  return `${sections.join('\n\n')}\n`;
}

export function findExistingBuildTicket(items, sourceContext) {
  return findExistingBySource(
    items,
    requiredText(sourceContext, 'sourceContext'),
    checkBuildTicket,
  );
}
function sectionBody(body, heading, nextTokens) {
  const start = body.indexOf(heading);
  if (start < 0) return '';
  const contentStart = start + heading.length;
  const ends = nextTokens
    .map((token) => body.indexOf(token, contentStart))
    .filter((index) => index >= 0);
  const end = ends.length ? Math.min(...ends) : body.length;
  return body.slice(contentStart, end).trim();
}
export function checkBuildTicket(body) {
  const text = String(body ?? '');
  const required = ['**Expected**', '**Where**', '**Size**', '**Acceptance criteria**'];
  const errors = [];
  for (const heading of required) {
    if (!text.includes(heading)) errors.push(`missing section: ${heading}`);
  }
  const markers = [
    ...text.matchAll(
      /^<!-- marjorie-build: size=(small|medium|large) source=(issue|alert|chat:https:\/\/\S+) -->$/gm,
    ),
  ];
  const marker = markers.at(-1);
  if (!marker) errors.push('missing or invalid marjorie-build marker');
  if (markers.length > 1) errors.push('multiple marjorie-build markers');
  const ordered = [...required];
  if (text.includes('**Reporter said**')) ordered.push('**Reporter said**');
  const indices = ordered.map((token) => text.indexOf(token));
  indices.push(marker?.index ?? -1);
  if (
    indices.some((index) => index < 0) ||
    indices.some((index, i) => i > 0 && index <= indices[i - 1])
  ) {
    errors.push('sections are out of order');
  }
  if (text.includes('**Expected**')) {
    try {
      expectedText(sectionBody(text, '**Expected**', ['**Where**']));
    } catch (error) {
      errors.push(error.message);
    }
  }
  const where = sectionBody(text, '**Where**', ['**Size**']);
  const surface = where.match(/^Surface:\s*(.+)$/m)?.[1]?.trim();
  if (text.includes('**Where**') && !surface) errors.push('Where needs a surface');
  const paths = [...where.matchAll(/^- `([^`]+)`\s*$/gm)].map((match) => match[1]);
  if (text.includes('**Where**') && paths.length === 0)
    errors.push('Where needs at least one concrete file path');
  let pathsValid = true;
  try {
    if (paths.length) normalizePaths(paths);
  } catch (error) {
    pathsValid = false;
    errors.push(error.message);
  }
  const acceptance = sectionBody(text, '**Acceptance criteria**', [
    '**Reporter said**',
    '<!-- marjorie-build:',
  ]);
  if (text.includes('**Acceptance criteria**') && !/^- \[ \] \S.+$/m.test(acceptance)) {
    errors.push('Acceptance criteria needs at least one unchecked checkbox');
  }
  if (text.includes('**Reporter said**')) {
    const markerStart = marker?.index ?? text.length;
    const reporter = text
      .slice(text.indexOf('**Reporter said**') + '**Reporter said**'.length, markerStart)
      .trim();
    if (!/^>./m.test(reporter)) errors.push('Reporter said must contain a blockquote');
  }
  const sizeBody = sectionBody(text, '**Size**', ['**Acceptance criteria**']);
  const claim = sizeBody.match(
    /^`(small|medium)` \(files=(\d+); estimated-lines=(\d+|unknown); Austin-allowlist=(yes|no)\)$/,
  );
  if (text.includes('**Size**') && !claim) {
    errors.push('Size must use the helper-derived format');
  } else if (claim && paths.length && pathsValid) {
    const [, claimedSize, claimedCount, rawLines, claimedAllowed] = claim;
    const estimatedLines = rawLines === 'unknown' ? undefined : Number(rawLines);
    const actualAllowed = paths.every(isAustinAllowedPath);
    const actualSize = sizeFromPaths(paths, estimatedLines);
    if (Number(claimedCount) !== paths.length) errors.push('Size file count does not match Where');
    if ((claimedAllowed === 'yes') !== actualAllowed)
      errors.push('Size allowlist result does not match Where');
    if (claimedSize !== actualSize) errors.push(`Size claim is invalid; expected ${actualSize}`);
  }
  if (marker?.[1] === 'large') errors.push('large item must not be filed as a build ticket');
  if (marker && claim && marker[1] !== claim[1]) errors.push('marker size does not match Size');
  if (marker?.[2]?.startsWith('chat:') && text.includes('**Reporter said**')) {
    errors.push("founder's Discord words must not appear in a public ticket");
  }
  return { ok: errors.length === 0, errors };
}
async function main(argv = process.argv.slice(2)) {
  const [command, inputPath, outputPath] = argv;
  if (command === 'render' && inputPath) {
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const rendered = renderBuildTicket(input);
    if (outputPath) fs.writeFileSync(outputPath, rendered);
    else process.stdout.write(rendered);
    return 0;
  }
  if (command === 'size' && inputPath) {
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log(
      sizeFromPaths(input.paths, input.estimatedLines, { needsSpec: input.needsSpec === true }),
    );
    return 0;
  }
  if (command === 'check' && inputPath) {
    const result = checkBuildTicket(fs.readFileSync(inputPath, 'utf8'));
    if (result.ok) {
      console.log('ready');
      return 0;
    }
    for (const error of result.errors) console.error(error);
    return 1;
  }
  if (command === 'find' && inputPath && outputPath) {
    const items = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const input = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const found = findExistingBuildTicket(items, input.sourceContext);
    console.log(found ? JSON.stringify({ number: found.number, url: found.url }) : 'none');
    return 0;
  }
  console.error(
    'Usage: build-ticket.mjs render <input.json> [output.md] | size <input.json> | check <body.md> | find <issues.json> <input.json>',
  );
  return 2;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'build-ticket' });
}
