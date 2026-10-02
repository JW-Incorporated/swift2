#!/usr/bin/env node
// One UI WP0.5b: the ReaderSpike DOM bundle must carry NO baked content.
// Run on a native export that kept sourcemaps:
//   cd apps/mobile && npx expo export --platform ios --source-maps --output-dir <dir>
//   node scripts/parity/check-dom-bundle.mjs <dir>
// Asserts (1) a DOM bundle containing ReaderSpike exists, (2) its sourcemap
// `sources` has nothing from apps/web/lib/longlive/generated/** (nor the
// web-only dev loader), (3) no DOM script contains a real moment title taken
// from the published bundle (apps/web/public/content, built by sync:content).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = [/apps\/web\/lib\/longlive\/generated\//, /dom\/spike\/dev-loader/, /index\.web\./];

export function findForbiddenSources(sources) {
  return sources.map((s) => s.replace(/\\/g, '/')).filter((s) => FORBIDDEN.some((re) => re.test(s)));
}

export function pickSentinel(items) {
  const t = items.map((i) => i?.title).find((x) => typeof x === 'string' && /^[\w ,'-]{30,}$/.test(x));
  return t ?? null;
}

function sentinelFromPublishedBundle(root) {
  const content = path.join(root, 'apps/web/public/content');
  const { bundleVersion } = JSON.parse(fs.readFileSync(path.join(content, 'current.json'), 'utf8'));
  const dir = path.join(content, bundleVersion, 'eras');
  for (const f of fs.readdirSync(dir)) {
    const s = pickSentinel(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).items ?? []);
    if (s) return s;
  }
  return null;
}

export function checkDomBundle(exportDir, sentinel) {
  const problems = [];
  const dir = path.join(exportDir, 'www.bundle');
  if (!fs.existsSync(dir)) return { problems: [`no www.bundle in ${exportDir} (native export with DOM components, --source-maps)`], files: 0 };
  const files = fs.readdirSync(dir);
  let readerSpikeMaps = 0;
  for (const f of files.filter((n) => n.endsWith('.map'))) {
    const sources = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).sources ?? [];
    if (sources.some((s) => /dom\/ReaderSpike\.tsx$/.test(s.replace(/\\/g, '/')))) readerSpikeMaps += 1;
    for (const bad of findForbiddenSources(sources)) problems.push(`${f}: forbidden source ${bad}`);
  }
  if (readerSpikeMaps === 0) problems.push('no DOM sourcemap lists dom/ReaderSpike.tsx (wrong export, or no --source-maps)');
  for (const f of files.filter((n) => n.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    if (text.includes(sentinel)) problems.push(`${f}: contains sentinel moment title "${sentinel}"`);
  }
  return { problems, files: files.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const exportDir = process.argv[2];
  if (!exportDir) {
    console.error('usage: node scripts/parity/check-dom-bundle.mjs <expo export dir>');
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const sentinel = sentinelFromPublishedBundle(root);
  if (!sentinel) {
    console.error('no sentinel moment title found; run `npm run sync:content` first');
    process.exit(2);
  }
  const { problems, files } = checkDomBundle(path.resolve(exportDir), sentinel);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`DOM bundle clean: ${files} files, no generated sources, sentinel "${sentinel}" absent`);
}
