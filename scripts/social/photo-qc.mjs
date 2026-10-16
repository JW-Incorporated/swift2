#!/usr/bin/env node
// Vision quality gate for auto-sourced social photos (founder decision "QC
// sonnet", 2026-10-07; cost model in docs/decisions.md). One Claude Sonnet 5.5
// call per candidate, through the subscription wrapper (scripts/lib/claude-call.mjs,
// priority P3, never the API), decides whether the image is an awesome, usable
// photo of Taylor Swift for a fan app's social posts. Fail-closed everywhere: an
// unavailable, limited or capped wrapper, or an unparsable answer, HOLDS the photo
// (never keep, retried next run). The model is
// told never to identify anyone from facial features, so it judges composition,
// photo type, quality, overlays and consistency with the caption only.
//
// CLI (manual spot check, one paid call):
//   node scripts/social/photo-qc.mjs <image> [--caption "..."] [--kind wikimedia] [--source host]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { callClaude } from '../lib/claude-call.mjs';
import { isMain } from '../lib/is-main.mjs';

export const QC_MODEL = 'claude-sonnet-5-5';
export const QC_PRIORITY = 'P3';
export const QC_CALLER = 'photo-qc';
export const QC_EDGE_PX = 768;
export const DEFAULT_MAX_CHECKS = 200;
export const DEFAULT_CONCURRENCY = 4;
const PRICE_PER_M_INPUT = 2;
const PRICE_PER_M_OUTPUT = 10;
const BOOLEAN_CHECKS = [
  'main_subject_is_single_prominent_person',
  'consistent_with_caption',
  'is_real_photograph',
  'has_watermark_or_logo_overlay',
  'sharp_and_well_lit',
  'subject_fills_frame_enough',
  'keep',
];

export const QC_SCHEMA = {
  type: 'object',
  properties: {
    main_subject_is_single_prominent_person: { type: 'boolean' },
    consistent_with_caption: { type: 'boolean' },
    is_real_photograph: { type: 'boolean' },
    has_watermark_or_logo_overlay: { type: 'boolean' },
    sharp_and_well_lit: { type: 'boolean' },
    subject_fills_frame_enough: { type: 'boolean' },
    keep: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: [...BOOLEAN_CHECKS, 'reason'],
  additionalProperties: false,
};

export const QC_SYSTEM_PROMPT = `Photo editor for a Taylor Swift fan app's social posts: is this candidate a good photo to post?

Never identify anyone from facial features. Judge only composition, photo type, quality, overlays, and whether the image plausibly shows what the caption claims (the caption says who is pictured).

Stylized or artistic official music-video stills, editorial portraits and concert close-ups are GOOD when one person is clearly the main subject and it fits the caption.

Reject only: crowd, venue or stage panoramas where the subject is small; other people dominant; objects, buildings or text; cover art, posters, graphics, or screenshots of a UI or TV broadcast; a watermark, agency logo or large sponsor wall; blurry, dark or back-view shots.

Checks: main_subject_is_single_prominent_person; consistent_with_caption; is_real_photograph (not art/poster/graphic/screenshot); has_watermark_or_logo_overlay (true = bad); sharp_and_well_lit; subject_fills_frame_enough (not a speck); keep (true only if all positive checks pass and no watermark); reason (max 80 chars).`;

export function kindFromId(id) {
  const s = String(id ?? '');
  if (s.startsWith('official-video')) return 'video-frame';
  if (s.startsWith('wikimedia')) return 'wikimedia';
  if (s.startsWith('openverse')) return 'openverse';
  if (s.startsWith('reddit')) return 'reddit';
  return 'press';
}

export function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

export function estimateCost({ inputTokens, outputTokens }) {
  return (inputTokens * PRICE_PER_M_INPUT + outputTokens * PRICE_PER_M_OUTPUT) / 1_000_000;
}

const notKeep = (reason, extra = {}) => ({
  keep: false,
  reason,
  usage: { inputTokens: 0, outputTokens: 0 },
  ...extra,
});

function parseVerdict(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of BOOLEAN_CHECKS) if (typeof parsed[key] !== 'boolean') return null;
  if (typeof parsed.reason !== 'string') return null;
  return parsed;
}

/**
 * One QC call through the subscription wrapper. Never throws. Returns
 * { keep, reason, checks?, usage, error? }. `error` is set when the result says
 * nothing about the photo itself (wrapper unavailable/limited/capped, bad
 * answer), so callers HOLD it and retry tomorrow instead of recording a rejection.
 */
export async function qcPhoto(
  { buffer, caption, source, kind },
  { call = callClaude, maxCalls, log = console.error } = {},
) {
  let jpeg;
  try {
    jpeg = await sharp(buffer)
      .resize(QC_EDGE_PX, QC_EDGE_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return notKeep('qc-error: unreadable image', { error: true });
  }
  let outcome;
  try {
    outcome = await call({
      caller: QC_CALLER,
      priority: QC_PRIORITY,
      model: QC_MODEL,
      system: QC_SYSTEM_PROMPT,
      user: `Caption: ${caption ?? '(none)'}
Source host: ${source ?? '(unknown)'}
Kind: ${kind ?? 'unknown'}`,
      schema: QC_SCHEMA,
      images: [{ buffer: jpeg, mimeType: 'image/jpeg' }],
      ...(maxCalls === undefined ? {} : { maxCalls }),
    });
  } catch {
    outcome = null;
  }
  const status = outcome?.status ?? 'unavailable';
  const usage = {
    inputTokens: outcome?.usage?.inputTokens ?? 0,
    outputTokens: outcome?.usage?.outputTokens ?? 0,
  };
  if (status !== 'ok') {
    log(`${QC_CALLER}: holding photo (${status}: ${outcome?.reason ?? 'Claude subscription unavailable'})`);
    return { keep: false, reason: `qc-error: ${status}`, usage, error: true };
  }
  const verdict = parseVerdict(outcome.data);
  if (!verdict) return { keep: false, reason: 'qc-error: unparsable verdict', usage, error: true };
  const keep =
    verdict.keep &&
    !verdict.has_watermark_or_logo_overlay &&
    BOOLEAN_CHECKS.filter((k) => k !== 'has_watermark_or_logo_overlay' && k !== 'keep').every(
      (k) => verdict[k],
    );
  return { keep, reason: verdict.reason.slice(0, 120), checks: verdict, usage };
}

/**
 * Run-level wrapper: the per-run check cap, bounded
 * concurrency, token totals and the fail-closed hold path.
 * `check()` resolves to { status: 'kept' | 'rejected' | 'held' | 'deferred', ... }.
 */
export function createQcSession({
  call = callClaude,
  env = process.env,
  maxChecks,
  concurrency = DEFAULT_CONCURRENCY,
  log,
} = {}) {
  const cap = Number.isFinite(maxChecks)
    ? maxChecks
    : Number(env.QC_MAX_CHECKS_PER_RUN) > 0
      ? Number(env.QC_MAX_CHECKS_PER_RUN)
      : DEFAULT_MAX_CHECKS;
  const totals = {
    checks: 0,
    kept: 0,
    rejected: 0,
    held: 0,
    deferred: 0,
    inputTokens: 0,
    outputTokens: 0,
    failures: {},
  };
  let active = 0;
  const waiting = [];
  const acquire = async () => {
    if (active >= concurrency) await new Promise((resolve) => waiting.push(resolve));
    active++;
  };
  const release = () => {
    active--;
    waiting.shift()?.();
  };

  async function check(input) {
    if (totals.checks >= cap) {
      totals.deferred++;
      return { status: 'deferred', reason: 'qc-cap' };
    }
    totals.checks++;
    await acquire();
    let result;
    try {
      result = await qcPhoto(input, { call, maxCalls: cap, log });
    } catch {
      result = notKeep('qc-error: unexpected', { error: true });
    } finally {
      release();
    }
    totals.inputTokens += result.usage.inputTokens;
    totals.outputTokens += result.usage.outputTokens;
    if (result.keep) {
      totals.kept++;
      return { status: 'kept', ...result };
    }
    if (result.error) {
      totals.held++;
      return { status: 'held', ...result };
    }
    totals.rejected++;
    const failing = Object.entries(result.checks ?? {})
      .filter(
        ([k, v]) =>
          k !== 'keep' && typeof v === 'boolean' && v === (k === 'has_watermark_or_logo_overlay'),
      )
      .map(([k]) => k);
    for (const key of failing.length ? failing : ['keep'])
      totals.failures[key] = (totals.failures[key] ?? 0) + 1;
    return { status: 'rejected', ...result };
  }

  function summary() {
    const cost = estimateCost(totals);
    const failures =
      Object.entries(totals.failures)
        .map(([k, n]) => `${k}=${n}`)
        .join(', ') || 'none';
    return (
      `photo QC: ${totals.checks} checked (${totals.kept} kept, ${totals.rejected} rejected, ${totals.held} held on unavailable/error), ` +
      `${totals.deferred} deferred over the ${cap}-check cap; ${totals.inputTokens} in / ${totals.outputTokens} out tokens, ~$${cost.toFixed(3)}; failing checks: ${failures}`
    );
  }

  return { check, summary, totals };
}

if (isMain(import.meta.url, process.argv[1])) {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const file = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!file)
    throw new Error(
      'Usage: node scripts/social/photo-qc.mjs <image> [--caption "..."] [--kind kind] [--source host]',
    );
  const result = await qcPhoto(
    {
      buffer: await readFile(file),
      caption: flag('--caption') ?? 'Taylor Swift performing',
      source: flag('--source'),
      kind: flag('--kind') ?? kindFromId(path.basename(file)),
    },
    {},
  );
  console.log(
    JSON.stringify(
      { ...result, estimatedUsd: Number(estimateCost(result.usage).toFixed(5)) },
      null,
      2,
    ),
  );
}
