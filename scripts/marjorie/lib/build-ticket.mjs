import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../../lib/cli.mjs';
import { findExistingBySource, sourceKey, terminalSourceKey } from './build-ticket-source.mjs';
import { linePositions, sectionBody } from './build-ticket-structure.mjs';
const NEXT_DYNAMIC_SEGMENT =
  /^(?:\[[A-Za-z0-9_-]+\]|\[\.\.\.[A-Za-z0-9_-]+\]|\[\[\.\.\.[A-Za-z0-9_-]+\]\])$/;
const TICKET_STRUCTURE =
  /[\r\n]|\*\*(?:Expected|Where|Size|Acceptance criteria|Reporter said|From (?:a site submission|watchdog alert|founder chat))\*\*|<!-- marjorie-build:/;
export const AUSTIN_PATH_ALLOWLIST = Object.freeze(['apps/web/', 'packages/', 'docs/']);
export const AUSTIN_PATH_EXCLUSIONS = Object.freeze({
  prefixes: [
    '.github/',
    'apps/web/app/api/',
    'docs/agents/',
    'docs/proposals/',
    'docs/specs/',
    'docs/plans/',
    'supabase/migrations/',
  ],
  files: [
    'CLAUDE.md',
    'docs/architecture.md',
    'docs/cto-role.md',
    'docs/decisions.md',
    'docs/roadmap.md',
  ],
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
  const basename = segments.at(-1);
  if (!basename?.includes('.') && !['Dockerfile', 'Makefile'].includes(basename)) {
    throw new Error(`path must name a concrete file, not a directory: ${candidate}`);
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
  if (/(^|\/)(?:[^/]*secret[^/]*|(?:o?auth|authentication)(?:[-_.][^/]*)?)(?:\/|\.|$)/i.test(candidate))
    return false;
  if (/(^|\/)[^/]*(?:schema|migrations?)[^/]*(?:\/|$)/i.test(candidate)) return false;
  const root = AUSTIN_PATH_ALLOWLIST.find((entry) => candidate.startsWith(entry));
  if (!root) return false;
  if (root === 'docs/' && !candidate.endsWith('.md')) return false;
  if (/(^|\/)(?:configs?|assets?)(?:\/|$)/i.test(candidate)) return false;
  if (root === 'apps/web/' && candidate.startsWith('apps/web/public/')) return false;
  if (root === 'apps/web/' && !/\.(?:[cm]?[jt]sx?|css)$/i.test(candidate)) return false;
  if (root === 'packages/' && !/\.[cm]?[jt]sx?$/i.test(candidate)) return false;
  if (/(^|\/)(?:[^/]+\.config\.[^/]+|tsconfig(?:\.[^/]+)?\.json)$/i.test(candidate)) return false;
  return true;
}
export function sizeFromPaths(
  paths,
  estimatedLines,
  { needsSpec = false, austinScopeConfirmed = false } = {},
) {
  const normalized = normalizePaths(paths);
  if (needsSpec) return 'large';
  const linesKnown = Number.isInteger(estimatedLines) && estimatedLines > 0;
  if (
    linesKnown &&
    estimatedLines <= 150 &&
    normalized.length <= 5 &&
    austinScopeConfirmed === true &&
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
function singleLineText(value, name) {
  const text = requiredText(value, name);
  if (/[\r\n]/.test(text)) throw new Error(`${name} must be one nonempty line`);
  if (TICKET_STRUCTURE.test(text)) {
    throw new Error(`${name} must be plain text without ticket structure`);
  }
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
    .map((line) => line.replace(/@(?=[A-Za-z0-9-])/g, '@\u200b'))
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}
function sizeLine(size, paths, estimatedLines, austinScopeConfirmed) {
  const lines = Number.isInteger(estimatedLines) && estimatedLines > 0 ? estimatedLines : 'unknown';
  const allowed = paths.every(isAustinAllowedPath) ? 'yes' : 'no';
  const scope = austinScopeConfirmed === true ? 'yes' : 'no';
  return `\`${size}\` (files=${paths.length}; estimated-lines=${lines}; Austin-allowlist=${allowed}; Austin-scope=${scope})`;
}
export function renderBuildTicket(input = {}) {
  const expected = singleLineText(input.expected, 'Expected');
  const surface = singleLineText(input.surface, 'Where.surface');
  const paths = normalizePaths(input.paths);
  const acceptance = (input.acceptanceCriteria || [])
    .map((item) => singleLineText(item, 'Acceptance criterion'))
    .filter(Boolean);
  if (acceptance.length === 0) throw new Error('Acceptance criteria is required');
  const source = sourceValue(input.source);
  if (source.startsWith('chat:') && String(input.reporterSaid ?? '').trim()) {
    throw new Error(
      "founder's Discord words must not be copied into a public ticket; use the message link",
    );
  }
  const austinScopeConfirmed = input.austinScopeConfirmed === true;
  const size = sizeFromPaths(paths, input.estimatedLines, {
    needsSpec: input.needsSpec === true,
    austinScopeConfirmed,
  });
  if (size === 'large')
    throw new Error('large item requires a spec and must not be filed as a build ticket');
  const sections = [
    `**Expected**\n${expected}`,
    `**Where**\nSurface: ${surface}\nFiles:\n${paths.map((p) => `- \`${p}\``).join('\n')}`,
    `**Size**\n${sizeLine(size, paths, input.estimatedLines, austinScopeConfirmed)}`,
    `**Acceptance criteria**\n${acceptance.map((item) => `- [ ] ${item}`).join('\n')}`,
  ];
  const reporter = String(input.reporterSaid ?? '').trim();
  if (reporter) sections.push(`**Reporter said**\n${quoteVerbatim(reporter)}`);
  sections.push(`<!-- marjorie-build: size=${size} source=${source} -->`);
  const sourceContext = requiredText(input.sourceContext, 'sourceContext');
  if (/[\r\n]/.test(sourceContext)) {
    throw new Error('sourceContext must be one nonempty line');
  }
  const identity = sourceKey(sourceContext);
  if (!identity) throw new Error('sourceContext needs a canonical submission number, alert URL, or chat link');
  if (
    (source === 'issue' && !identity.startsWith('submission:')) ||
    (source === 'alert' && !identity.startsWith('alert:')) ||
    (source.startsWith('chat:') && identity !== source)
  ) {
    throw new Error('sourceContext does not match source');
  }
  const context = String(input.context ?? '').trim();
  if (/^(?:<!-- marjorie-build:|\*\*From (?:a site submission|watchdog alert|founder chat)\*\*)/m.test(context)) {
    throw new Error('context must not contain build-ticket marker or source lines');
  }
  if (context) sections.push(context);
  sections.push(sourceContext);
  const body = `${sections.join('\n\n')}\n`;
  const checked = checkBuildTicket(body);
  if (!checked.ok) throw new Error(`rendered ticket is not ready: ${checked.errors.join('; ')}`);
  return body;
}

export function findExistingBuildTicket(items, sourceContext) {
  return findExistingBySource(
    items,
    requiredText(sourceContext, 'sourceContext'),
    checkBuildTicket,
  );
}
export function checkBuildTicket(body) {
  const text = String(body ?? '');
  const required = ['**Expected**', '**Where**', '**Size**', '**Acceptance criteria**'];
  const headings = [...required, '**Reporter said**'];
  const positions = new Map(headings.map((heading) => [heading, linePositions(text, heading)]));
  const errors = [];
  for (const heading of required) {
    if (!positions.get(heading).length) errors.push(`missing section: ${heading}`);
  }
  for (const heading of headings) {
    if (positions.get(heading).length > 1) errors.push(`multiple section: ${heading}`);
  }
  const markers = [
    ...text.matchAll(
      /^<!-- marjorie-build: size=(small|medium|large) source=(issue|alert|chat:https:\/\/\S+) -->\r?$/gm,
    ),
  ];
  const marker = markers.at(-1);
  if (!marker) errors.push('missing or invalid marjorie-build marker');
  if (markers.length > 1) errors.push('multiple marjorie-build markers');
  const ordered = positions.get('**Reporter said**').length ? headings : required;
  const indices = ordered.map((token) => positions.get(token)[0] ?? -1);
  indices.push(marker?.index ?? -1);
  if (
    indices.some((index) => index < 0) ||
    indices.some((index, i) => i > 0 && index <= indices[i - 1])
  ) {
    errors.push('sections are out of order');
  }
  if (positions.get('**Expected**').length) {
    try {
      singleLineText(sectionBody(text, '**Expected**', ['**Where**']), 'Expected');
    } catch (error) {
      errors.push(error.message);
    }
  }
  const where = sectionBody(text, '**Where**', ['**Size**']);
  const whereLines = where.split(/\r?\n/);
  const surface = whereLines[0]?.match(/^Surface:\s*(\S.*)$/)?.[1]?.trim();
  if (positions.get('**Where**').length && !surface) errors.push('Where needs a surface');
  if (surface) {
    try {
      singleLineText(surface, 'Where.surface');
    } catch (error) {
      errors.push(error.message);
    }
  }
  const paths = [...where.matchAll(/^- `([^`]+)`\s*$/gm)].map((match) => match[1]);
  if (positions.get('**Where**').length && paths.length === 0)
    errors.push('Where needs at least one concrete file path');
  let pathsValid = true;
  try {
    if (paths.length) normalizePaths(paths);
  } catch (error) {
    pathsValid = false;
    errors.push(error.message);
  }
  if (
    positions.get('**Where**').length &&
    (whereLines[1] !== 'Files:' ||
      whereLines.slice(2).some((line) => !/^- `[^`]+`\s*$/.test(line)) ||
      whereLines.slice(2).length !== paths.length)
  ) {
    errors.push('Where must contain one Surface line and concrete file-path lines only');
  }
  const acceptance = sectionBody(text, '**Acceptance criteria**', [
    '**Reporter said**',
    '<!-- marjorie-build:',
  ]);
  const acceptanceLines = acceptance.split(/\r?\n/);
  if (
    positions.get('**Acceptance criteria**').length &&
    (acceptanceLines.length === 0 || acceptanceLines.some((line) => !/^- \[ \] \S.*$/.test(line)))
  ) {
    errors.push('Acceptance criteria must contain unchecked checkbox lines only');
  } else if (positions.get('**Acceptance criteria**').length) {
    for (const line of acceptanceLines) {
      try {
        singleLineText(line.slice('- [ ] '.length), 'Acceptance criterion');
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
  if (positions.get('**Reporter said**').length) {
    const markerStart = marker?.index ?? text.length;
    const reporter = text
      .slice(positions.get('**Reporter said**')[0] + '**Reporter said**'.length, markerStart)
      .trim();
    if (!reporter || reporter.split(/\r?\n/).some((line) => line !== '>' && !line.startsWith('> '))) {
      errors.push('Reporter said must contain blockquote lines only');
    }
  }
  const sizeBody = sectionBody(text, '**Size**', ['**Acceptance criteria**']);
  const claim = sizeBody.match(
    /^`(small|medium)` \(files=(\d+); estimated-lines=(\d+|unknown); Austin-allowlist=(yes|no); Austin-scope=(yes|no)\)$/,
  );
  if (positions.get('**Size**').length && !claim) {
    errors.push('Size must use the helper-derived format');
  } else if (claim && paths.length && pathsValid) {
    const [, claimedSize, claimedCount, rawLines, claimedAllowed, claimedScope] = claim;
    const estimatedLines = rawLines === 'unknown' ? undefined : Number(rawLines);
    const actualAllowed = paths.every(isAustinAllowedPath);
    const austinScopeConfirmed = claimedScope === 'yes';
    const actualSize = sizeFromPaths(paths, estimatedLines, { austinScopeConfirmed });
    if (Number(claimedCount) !== paths.length) errors.push('Size file count does not match Where');
    if ((claimedAllowed === 'yes') !== actualAllowed)
      errors.push('Size allowlist result does not match Where');
    if (claimedSize !== actualSize) errors.push(`Size claim is invalid; expected ${actualSize}`);
  }
  if (marker?.[1] === 'large') errors.push('large item must not be filed as a build ticket');
  if (marker && claim && marker[1] !== claim[1]) errors.push('marker size does not match Size');
  if (marker?.[2]?.startsWith('chat:') && positions.get('**Reporter said**').length) {
    errors.push("founder's Discord words must not appear in a public ticket");
  }
  const rawMarkerLines = [...text.matchAll(/^<!-- marjorie-build:.*\r?$/gm)];
  if (rawMarkerLines.length !== markers.length) errors.push('unexpected marjorie-build marker');
  const identity = terminalSourceKey(text);
  if (!identity) errors.push('missing canonical source line at end of ticket');
  if (
    marker &&
    identity &&
    ((marker[2] === 'issue' && !identity.startsWith('submission:')) ||
      (marker[2] === 'alert' && !identity.startsWith('alert:')) ||
      (marker[2].startsWith('chat:') && marker[2] !== identity))
  ) {
    errors.push('canonical source line does not match marker source');
  }
  const rawSourceLines = text
    .split(/\r?\n/)
    .filter((line) => sourceKey(line));
  if (rawSourceLines.length !== 1) errors.push('ticket must contain exactly one canonical source line');
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
      sizeFromPaths(input.paths, input.estimatedLines, {
        needsSpec: input.needsSpec === true,
        austinScopeConfirmed: input.austinScopeConfirmed === true,
      }),
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
