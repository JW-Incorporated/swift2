#!/usr/bin/env node
// E2 image verifier. Detection produces a bounded proposal; only an authoring
// lane may apply it to content.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_IMAGE_BYTES = 512;

function declaredSize(response) {
  const value = response.headers.get('content-length');
  const size = value === null ? NaN : Number(value);
  return Number.isFinite(size) && size >= 0 ? size : null;
}

export async function verifyImage(url, { fetchImpl = fetch } = {}) {
  let response = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
  const isImage = (response.headers.get('content-type') ?? '').toLowerCase().startsWith('image/');
  if ([403, 405, 501].includes(response.status) || (response.ok && isImage && declaredSize(response) === null)) {
    response = await fetchImpl(url, { method: 'GET', redirect: 'follow', headers: { Range: 'bytes=0-1023' } });
  }
  if (response.status === 403) return { verdict: 'blocked', status: response.status };
  if (!response.ok) return { verdict: 'invalid', status: response.status };
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) return { verdict: 'invalid', status: response.status };
  const size = declaredSize(response) ?? (await response.arrayBuffer()).byteLength;
  if (size < MIN_IMAGE_BYTES) return { verdict: 'invalid', status: response.status };
  return { verdict: 'ok', status: response.status };
}

export function extractReplacementImage(html) {
  const meta = /<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["'][^>]*>/i.exec(html)
    ?? /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i.exec(html);
  if (meta?.[1]) return meta[1];
  const schema = /["']image["']\s*:\s*["'](https?:\/\/[^"']+)["']/i.exec(html);
  return schema?.[1] ?? null;
}

export async function planImageRepairs(records, { fetchImpl = fetch } = {}) {
  const updates = [];
  for (const record of records) {
    if (!record?.productId || !record.imageUrl) continue;
    const verification = await verifyImage(record.imageUrl, { fetchImpl });
    if (verification.verdict === 'ok' || verification.verdict === 'blocked') {
      updates.push({ productId: record.productId, imageUrl: record.imageUrl, verdict: verification.verdict });
      continue;
    }
    if (record.listingVerdict !== 'ok' || !record.url) {
      updates.push({ productId: record.productId, imageUrl: null, verdict: 'drop-image' });
      continue;
    }
    const page = await fetchImpl(record.url, { method: 'GET', redirect: 'follow' });
    const replacement = page.ok ? extractReplacementImage(await page.text()) : null;
    updates.push({ productId: record.productId, imageUrl: replacement, verdict: replacement ? 'replace-image' : 'drop-image' });
  }
  return { updates };
}

async function main() {
  const args = process.argv.slice(2);
  const inputAt = args.indexOf('--input');
  const outputAt = args.indexOf('--write');
  if (inputAt < 0 || outputAt < 0 || !args[inputAt + 1] || !args[outputAt + 1]) {
    throw new Error('usage: verify-images.mjs --input products.json --write image-plan.json');
  }
  const input = JSON.parse(await readFile(resolve(args[inputAt + 1]), 'utf8'));
  const records = Array.isArray(input)
    ? input
    : input.products ?? (input.results ?? []).map((record) => ({ ...record, listingVerdict: record.verdict }));
  const plan = await planImageRepairs(records);
  const output = resolve(args[outputAt + 1]);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ updates: plan.updates.length }));
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-image-verifier: ${error.message}`);
    process.exitCode = 1;
  });
}
