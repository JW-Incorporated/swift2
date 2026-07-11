// Image moderation adapter (deterministic, network, API-gated).
//
// This is the seam for a REAL image-safety API. Today the engine has no such key
// in the repo, so this checker NO-OPS (returns []) unless GOOGLE_VISION_API_KEY
// is set. When a key is present it runs Google Cloud Vision SafeSearch over every
// distinct hotlinked image and files an `image.safety` P0 escalation for anything
// LIKELY/VERY_LIKELY adult, racy, or violent — the automated backstop behind the
// host-reputation tripwire and the vision-agent pass.
//
// Swapping providers (AWS Rekognition Moderation, Hive, etc.) means replacing
// `annotate()` with the equivalent call that returns the same {adult,racy,violence}
// likelihoods — nothing else changes. CSAM is deliberately NOT handled here (see
// README + the PhotoDNA/NCMEC enrollment ticket); this is NSFW/violence only.
import { makeFinding } from '../lib/finding.mjs';
import { imageIndex } from '../lib/corpus.mjs';

export const id = 'image.safety';

const API_KEY = process.env.GOOGLE_VISION_API_KEY || '';
const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';
const FLAG_AT = new Set(['LIKELY', 'VERY_LIKELY']); // ignore POSSIBLE and below
const BATCH = 16; // Vision allows up to 16 image requests per call
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function annotate(urls) {
  const body = {
    requests: urls.map((u) => ({
      image: { source: { imageUri: u } },
      features: [{ type: 'SAFE_SEARCH_DETECTION' }],
    })),
  };
  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vision API ${res.status}`);
  const json = await res.json();
  return (json.responses || []).map((r) => r.safeSearchAnnotation || null);
}

export async function check(items, ctx = {}) {
  if (!API_KEY) {
    if (ctx.log) ctx.log('  image-moderation: skipped (no GOOGLE_VISION_API_KEY — adapter seam only)');
    return [];
  }
  const imgs = imageIndex(items).filter((im) => /^https?:\/\//.test(im.url));
  if (ctx.log) ctx.log(`  image-moderation: SafeSearch over ${imgs.length} images…`);
  const findings = [];
  for (let i = 0; i < imgs.length; i += BATCH) {
    const slice = imgs.slice(i, i + BATCH);
    let anns;
    try { anns = await annotate(slice.map((im) => im.url)); }
    catch (e) { if (ctx.log) ctx.log(`  image-moderation: batch failed (${e.message})`); await sleep(1500); continue; }
    slice.forEach((im, j) => {
      const a = anns[j];
      if (!a) return;
      const hits = ['adult', 'racy', 'violence'].filter((k) => FLAG_AT.has(a[k]));
      if (!hits.length) return;
      const first = im.usedBy[0] ?? {};
      findings.push(makeFinding({
        checker: id, severity: 'P0', escalate: true,
        title: `Image flagged ${hits.map((h) => `${h}:${a[h]}`).join(', ')} by SafeSearch`,
        itemRef: { type: 'image', file: first.file ?? null, era: null, key: im.url, field: null },
        excerpt: im.url,
        evidence: `Google Vision SafeSearch rated this image ${hits.map((h) => `${h}=${a[h]}`).join(', ')}. Used by ${im.usedBy.length} item(s): ${im.usedBy.slice(0, 4).map((u) => u.key).join('; ')}. Human review required before it stays on the site.`,
        suggestedFix: 'Review the image; remove or replace if it is NSFW/inappropriate.',
        confidence: 0.85,
        sources: ['https://cloud.google.com/vision/docs/detecting-safe-search'],
      }));
    });
    await sleep(200);
  }
  if (ctx.log) ctx.log(`  image-moderation: ${findings.length} flagged.`);
  return findings;
}
