// Validate Vault seed content against the DB constraints and the timeline model
// BEFORE it is seeded — CI runs this so a bad row can't reach prod (the seed
// scripts write straight to the shared Supabase project). Pure file check: no
// DB, no secrets.
//
//   npm run validate:content
//
// Checks each item in supabase/seed/content/*.mjs:
//   - eraSlug is a real era (from eras-data.mjs)
//   - year is an int; month is 1..12
//   - category is one of the month_item CHECK values
//   - title present; snippet + moment.context within their DB CHECK caps
//     (all caps come from scripts/lib/content-caps.mjs — never re-typed here)
//   - confidence (optional) is a known level; moment.rumors entries carry
//     claim (<=400) + reportedBy + reportedOn (ISO) + status + url .... ERROR
//   - has at least one source (link-first model) ...................... WARN
//   - (year,month) falls within the era's month span so it renders ..... WARN
//     (matches monthsInEra(): inclusive of the partial start/end months)
//
// Also checks the non-month-scoped types (audit 2026-07-08 §4b) in
// supabase/seed/{releases,tours,theories,videos}/*.mjs:
//   - stable kebab slug, unique per type; known eraSlug
//   - enums (kind / confidence / outcome / source_type / media kind+rights)
//   - length caps mirroring the DB CHECKs and the audit §5 source-excerpt cap
//     — every number from scripts/lib/content-caps.mjs (DB_CAPS/POLICY_CAPS)
//   - >= 1 source on EVERY record (hard rule for the new types) ....... ERROR
//   - theories: confidence + outcome REQUIRED so nothing renders as fact
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  RUMOR_STATUSES,
  RUMOR_SOURCE_TIERS,
  LOCATION_SPECIFICITY,
  RESOLVED_RUMOR_STATUSES,
  slugify,
} from './sync-longlive-content.mjs';
import { SLUG_TO_ERA_ID } from './lib/longlive-sync-shared.mjs';
// Every length cap lives in ONE module — see the incident note at the top of
// scripts/lib/content-caps.mjs. Never hard-code a cap number in this file.
import { DB_CAPS, POLICY_CAPS } from './lib/content-caps.mjs';
// The moment sourcing gates + the two lists of records that predate them.
// Read the header of that file before touching either list.
import {
  SINGLE_OUTLET_LEGACY,
  TWO_OUTLET_CATEGORIES,
  UNSOURCED_LEGACY,
  independentOutlets,
  momentKey,
} from './lib/sourcing-gate.mjs';
import { blockingRumorRedlineViolations } from './lib/rumor-redlines.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', 'supabase', 'seed');

// Keep in sync with the month_item.category CHECK constraint (migrations).
const CATEGORIES = new Set([
  'sighting',
  'fashion',
  'relationship',
  'tour',
  'business',
  'music',
  'release',
  'video',
]);

// Keep in sync with ContentItem.significance (apps/web/lib/longlive/types.ts)
// and the month_item.significance CHECK constraint (migrations). Found in
// review (2026-07-18): the sync script silently drops an unrecognized
// significance value to "routine" (defensive, correct for the generator),
// but with no validator check here that meant a typo like 'defineing'
// passed CI clean and silently lost the item's prominence — exactly the
// failure mode this field exists to prevent. This makes it a hard error.
const SIGNIFICANCE_VALUES = new Set(['defining', 'notable']);

// Keep in sync with packages/shared/src/vault-types.ts + the new-type
// migration CHECK constraints.
const RELEASE_KINDS = new Set(['album', 'rerecording', 'ep', 'deluxe', 'single', 'live']);
const VIDEO_KINDS = new Set([
  // Works she made or headlined.
  'music_video',
  'lyric_video',
  'short_film',
  'tour_film',
  'documentary',
  'performance',
  // Appearances — her, as herself, in someone else's programming (2026-08-12).
  'interview',
  'award_speech',
  'speech',
  'press_event',
]);
const THEORY_KINDS = new Set(['easter_egg', 'theory']);
const THEORY_CONFIDENCE = new Set([
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
]);
const THEORY_OUTCOMES = new Set([
  'confirmed',
  'partially_confirmed',
  'pending',
  'debunked',
  'abandoned',
  'unfalsifiable',
]);
const SOURCE_TYPES = new Set([
  'official',
  'interview',
  'reputable_press',
  'chart_database',
  'awards_database',
  'fashion_database',
  'fan_forum',
  'wiki',
  'social',
  'video',
  'image_source',
]);
const MEDIA_KINDS = new Set(['oembed', 'owned', 'hotlink_legacy']);
const MEDIA_RIGHTS = new Set(['platform_tos', 'licensed', 'hotlink_legacy']);

// Keep in sync with LensId (apps/web/lib/longlive/types.ts) and
// VALID_THREAD_IDS (sync-longlive-content.mjs). An unknown value here is
// always an authoring typo — sync-longlive-content.mjs silently drops
// unknown threadIds so a bad build doesn't ship broken JS, but that means a
// typo would otherwise fail closed (item just doesn't join the thread) with
// no signal. Catching it here as a hard error is what gives that signal.
const THREAD_IDS = new Set([
  'love-story',
  'fashion',
  'taylors-version',
  'easter-eggs',
  'hidden-clues',
  'the-proposal',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// audit §5 — hard cap on verbatim source excerpts
const EXCERPT_CAP = POLICY_CAPS.sourceExcerpt;

const monthIndex = (y, m) => y * 12 + (m - 1);

const { eras } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);
const eraSpan = new Map(
  eras.map((e) => [
    e.slug,
    {
      lo: monthIndex(+e.start_date.slice(0, 4), +e.start_date.slice(5, 7)),
      hi: monthIndex(+e.end_date.slice(0, 4), +e.end_date.slice(5, 7)),
    },
  ]),
);

const contentDir = join(seed, 'content');
let errors = 0;
let warnings = 0;
let checked = 0;

const contentFiles = readdirSync(contentDir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();
const loaded = [];
for (const file of contentFiles) {
  const mod = await import(pathToFileURL(join(contentDir, file)).href);
  loaded.push({ file, data: mod.default });
}

// Every real `moment:vault-<eraId>-<slug>` id the sync script would generate
// — same id-derivation the sync script uses (title -> slugify, eraSlug ->
// SLUG_TO_ERA_ID mapping) so `relatedIds` can be checked for real resolution,
// not just shape. Found in review (2026-07-19): a wrong eraId prefix
// (vault-tortured-poets-... instead of vault-ttpd-...) shipped silently,
// since relatedIds resolution is best-effort at runtime and never errors.
const validMomentIds = new Set();
for (const { data } of loaded) {
  const fileEra = data?.eraSlug;
  for (const it of Array.isArray(data?.items) ? data.items : []) {
    const eraSlug = it.eraSlug ?? fileEra;
    if (!eraSlug || !it.title) continue;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    validMomentIds.add(`vault-${eraId}-${slugify(it.title)}`);
  }
}

// Every moment key the corpus actually contains, so a grandfather entry that
// no longer matches anything (record deleted, or title rewritten) fails loudly
// instead of becoming an exemption that silently applies to nothing.
const seenMomentKeys = new Set();

for (const { file, data } of loaded) {
  const fileEra = data?.eraSlug;
  const rows = data?.items;
  if (!Array.isArray(rows)) {
    console.error(`ERROR ${file}: default export has no items[] array`);
    errors += 1;
    continue;
  }
  rows.forEach((it, i) => {
    checked += 1;
    const eraSlug = it.eraSlug ?? fileEra;
    const at = `${file}[${i}] "${String(it.title ?? '').slice(0, 42)}"`;
    const err = (msg) => {
      console.error(`ERROR ${at}: ${msg}`);
      errors += 1;
    };
    const warn = (msg) => {
      console.warn(`WARN  ${at}: ${msg}`);
      warnings += 1;
    };

    if (!eraSlug) err('missing eraSlug (not on item or file)');
    else if (!eraSpan.has(eraSlug)) err(`unknown eraSlug "${eraSlug}"`);
    if (!Number.isInteger(it.year)) err(`year is not an integer (${it.year})`);
    if (!(Number.isInteger(it.month) && it.month >= 1 && it.month <= 12))
      err(`month out of 1..12 (${it.month})`);
    if (!CATEGORIES.has(it.category))
      err(`category "${it.category}" not in ${[...CATEGORIES].join('|')}`);
    if (!it.title) err('missing title');
    if ((it.snippet ?? '').length > DB_CAPS['month_item.snippet'])
      err(`snippet ${it.snippet.length} > ${DB_CAPS['month_item.snippet']} (DB CHECK)`);
    // Raised 2000 -> 4000 on 2026-07-22 (founder decision) together with
    // supabase/migrations/20260722120000_moment_context_4000.sql. Both numbers
    // now come from scripts/lib/content-caps.mjs, whose test parses the
    // migration SQL — they physically cannot desync any more. (If this gate
    // were looser than the DB, a seed would pass CI and then fail at insert;
    // tighter, and authors are blocked by a limit that no longer exists.)
    if ((it.moment?.context ?? '').length > DB_CAPS['moment.context'])
      err(`moment.context ${it.moment.context.length} > ${DB_CAPS['moment.context']} (DB CHECK)`);

    // --- sourcing (2026-08-11) --------------------------------------------
    // Typed records have hard-failed with no sources since the audit; moments
    // only ever warned, and 45 of them were shipping to production with
    // nothing behind them on a site whose whole proposition is receipts.
    // Both gates below are ERRORS with a shrinking grandfather list —
    // see the long note at the top of scripts/lib/sourcing-gate.mjs.
    const key = momentKey(file, it);
    seenMomentKeys.add(key);
    const hasSource = Boolean(it.sourceUrl) || it.moment?.sources?.length > 0;
    const grandfathered = UNSOURCED_LEGACY.has(key);
    if (!hasSource && !grandfathered)
      err(
        'no sourceUrl and no moment.sources — every moment needs at least one source (link-first model)',
      );
    else if (!hasSource)
      warn(`no sources; grandfathered as ${key} — source it and delete that entry`);
    // The ratchet: a listed record that HAS been sourced must leave the list,
    // or the list quietly becomes a permanent exemption nobody rechecks.
    if (hasSource && grandfathered)
      err(
        `listed in UNSOURCED_LEGACY as ${key} but now has sources — delete that entry from scripts/lib/sourcing-gate.mjs`,
      );

    // "relationship and business items need two independent outlet sources"
    // (docs/content-ops/editorial-voice-and-pipeline.md) had no implementation
    // anywhere until today. 143 of the 164 records in those two categories
    // already met it; the 21 that did not are listed in SINGLE_OUTLET_LEGACY.
    if (TWO_OUTLET_CATEGORIES.has(it.category) && hasSource) {
      const outlets = independentOutlets(it.moment?.sources);
      const listed = SINGLE_OUTLET_LEGACY.has(key);
      if (outlets < 2 && !listed)
        err(
          `${it.category} item has ${outlets} independent outlet(s) — this category requires two (a wiki/forum/social citation never counts toward them)`,
        );
      else if (outlets < 2)
        warn(`only ${outlets} independent outlet(s); grandfathered as ${key}`);
      if (outlets >= 2 && listed)
        err(
          `listed in SINGLE_OUTLET_LEGACY as ${key} but now has ${outlets} independent outlets — delete that entry from scripts/lib/sourcing-gate.mjs`,
        );
    }

    // Shoppable products (moment.products — see Product in
    // apps/web/lib/longlive/types.ts). Hard errors, not warnings: a malformed
    // row is silently dropped by sync-longlive-content.mjs's productsFrom()
    // (fails closed, nothing broken ships), so — same reasoning as threadIds
    // — this check is the only loud signal an authoring mistake gets.
    if (it.moment?.products != null) {
      if (!Array.isArray(it.moment.products)) err('moment.products must be an array');
      else
        it.moment.products.forEach((p, pi) => {
          const pAt = `products[${pi}]`;
          if (!p || typeof p !== 'object') return err(`${pAt} is not an object`);
          for (const field of ['brand', 'item', 'retailer', 'url']) {
            if (!(typeof p[field] === 'string' && p[field].trim())) err(`${pAt} missing required string "${field}"`);
          }
          if (typeof p.url === 'string' && p.url && !/^https:\/\//.test(p.url)) err(`${pAt} url must be a direct https product page (got "${p.url}")`);
          // Search-page heuristic: a /search path segment or a classic search
          // query key. Deliberately NOT matching a bare `s=` param — boutiques
          // legitimately use ?s= for size/SKU on product pages.
          if (typeof p.url === 'string' && /\/search\b|[?&](q|query|search|keyword|searchterm)=/i.test(p.url)) err(`${pAt} url looks like a SEARCH page, not a product detail page — shop links must point at the exact product`);
          if (typeof p.retailer === 'string' && p.retailer && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(p.retailer)) err(`${pAt} retailer "${p.retailer}" must be a bare lowercase hostname (e.g. "ralphlauren.com") — it is the affiliate-routing key`);
          // retailer is the affiliate-routing key buildShopUrl() will branch
          // on — silent drift from the url's real host (copy a row, edit the
          // url, forget retailer) would wrap the link for the WRONG partner
          // program once affiliate goes live, with every gate green. So the
          // two must agree at authoring time: retailer equals the url host
          // (minus www.) or a parent domain of it (us.louisvuitton.com ↔
          // louisvuitton.com).
          if (typeof p.url === 'string' && typeof p.retailer === 'string' && /^https:\/\//.test(p.url) && p.retailer) {
            try {
              const host = new URL(p.url).hostname.toLowerCase().replace(/^www\./, '');
              if (host !== p.retailer && !host.endsWith(`.${p.retailer}`)) err(`${pAt} retailer "${p.retailer}" does not match the url's host "${host}" — the affiliate-routing key must agree with the actual link destination`);
            } catch {
              err(`${pAt} url "${p.url}" is not a parseable URL`);
            }
          }
          if (p.price != null && !(typeof p.price === 'string' && p.price.trim())) err(`${pAt} price must be a non-empty display string (e.g. "$319.99") when present`);
          if (p.inStock != null && typeof p.inStock !== 'boolean') err(`${pAt} inStock must be a boolean when present`);
          if (p.isAlternative != null && typeof p.isAlternative !== 'boolean') err(`${pAt} isAlternative must be a boolean when present`);
          if (p.isAlternative === true && !(typeof p.altNote === 'string' && p.altNote.trim())) err(`${pAt} isAlternative:true requires a non-empty altNote explaining why this isn't the exact piece`);
          if (p.altNote != null && p.altNote.length > POLICY_CAPS.productAltNote)
            err(`${pAt} altNote ${p.altNote.length} > ${POLICY_CAPS.productAltNote}`);
        });
    }

    if (it.threadIds != null) {
      if (!Array.isArray(it.threadIds)) err('threadIds must be an array');
      else
        for (const t of it.threadIds) {
          if (!THREAD_IDS.has(t))
            err(`threadIds contains unknown thread "${t}" — not in ${[...THREAD_IDS].join('|')}`);
        }
    }

    if (it.relatedIds != null) {
      if (!Array.isArray(it.relatedIds)) err('relatedIds must be an array');
      else
        for (const rid of it.relatedIds) {
          if (typeof rid !== 'string' || !rid.startsWith('moment:')) continue; // motif:/egg:/rel:/song: resolve elsewhere, not checked here
          const id = rid.slice('moment:'.length);
          if (!validMomentIds.has(id))
            err(`relatedIds references "${rid}" which doesn't resolve to any real moment id — dead cross-link (resolution is best-effort at runtime and never errors, so this is the only thing that catches a wrong id)`);
        }
    }

    if (it.significance != null && !SIGNIFICANCE_VALUES.has(it.significance)) {
      err(
        `significance "${it.significance}" not in ${[...SIGNIFICANCE_VALUES].join('|')} — a typo here silently loses the item's prominence`,
      );
    }

    // Rumor tier (2026-07-19). The sync script drops anything malformed
    // (fail-closed: an unattributed rumor never renders), so every drop
    // condition must be a hard error here or the rumor just vanishes. The
    // checks mirror rumorsFrom() (RUMOR_STATUSES is imported from the same
    // module, and string fields are TRIMMED before the presence check —
    // review found a whitespace-only claim passed a bare truthiness check
    // here while the generator dropped it). Both fields are read from both
    // placements, same as the sync script.
    const confidence = it.confidence ?? it.moment?.confidence;
    if (confidence != null && !THEORY_CONFIDENCE.has(confidence)) {
      err(
        `confidence "${confidence}" not a known level — a typo here silently drops the rumor banner and the claim renders as fact`,
      );
    }
    // Embedded social post (moment.socialPost — SocialPost in types.ts,
    // issue #1074). Validated here because the generator DROPS a malformed one
    // silently, which is correct for the generator and invisible to everyone
    // else: the page would simply render without the post it is about, exactly
    // the gap this field exists to close.
    const sp = it.moment?.socialPost ?? it.socialPost;
    if (sp != null) {
      if (typeof sp !== 'object' || Array.isArray(sp)) err('moment.socialPost must be an object');
      else {
        if (sp.platform !== 'instagram')
          err(`socialPost.platform "${sp.platform}" unsupported (only 'instagram')`);
        if (typeof sp.shortcode !== 'string' || !/^[A-Za-z0-9_-]+$/.test(sp.shortcode))
          err(`socialPost.shortcode "${sp.shortcode}" is not a bare Instagram shortcode`);
        // A full URL here is the easy mistake, and it produces a working-looking
        // seed that generates a broken embed src.
        if (typeof sp.shortcode === 'string' && sp.shortcode.includes('/'))
          err('socialPost.shortcode must be the id only, not the full permalink');
        if (typeof sp.label !== 'string' || !sp.label.trim())
          err('socialPost.label is required — it is all a reader sees before opting into the embed');
        if (sp.postedOn != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(sp.postedOn)))
          err(`socialPost.postedOn "${sp.postedOn}" must be YYYY-MM-DD`);
      }
    }

    const rumors = it.moment?.rumors ?? it.rumors;
    if (rumors != null) {
      if (!Array.isArray(rumors)) err('moment.rumors must be an array');
      else
        rumors.forEach((r, ri) => {
          const rAt = `rumors[${ri}]`;
          if (!r || typeof r !== 'object') return err(`${rAt} is not an object`);
          const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');
          if (!trimmed(r.claim)) err(`${rAt} missing claim`);
          if ((r.claim ?? '').length > POLICY_CAPS.rumorText)
            err(`${rAt} claim ${r.claim.length} > ${POLICY_CAPS.rumorText}`);
          if (!trimmed(r.reportedBy))
            err(`${rAt} missing reportedBy — every rumor names who reported it`);
          if (!ISO_DATE_RE.test(trimmed(r.reportedOn)))
            err(`${rAt} reportedOn "${r.reportedOn}" is not YYYY-MM-DD — every rumor is dated`);
          else {
            // Shape isn't enough: '2026-13-05' matches \d{2} but renders a
            // broken attribution line. Round-trip through UTC Date to reject
            // out-of-range months/days and rolled-over dates alike.
            const iso = trimmed(r.reportedOn);
            const d = new Date(`${iso}T00:00:00Z`);
            if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso)
              err(`${rAt} reportedOn "${iso}" is not a real calendar date`);
          }
          if (!RUMOR_STATUSES.has(r.status))
            err(`${rAt} status "${r.status}" not in ${[...RUMOR_STATUSES].join('|')}`);
          if (!/^https?:\/\//.test(trimmed(r.url))) err(`${rAt} url is not an http(s) link`);
          if ((r.note ?? '').length > POLICY_CAPS.rumorText)
            err(`${rAt} note ${r.note.length} > ${POLICY_CAPS.rumorText}`);

          // --- lifecycle integrity (2026-07-20, rumor-pipeline.md) ---------
          // A settled claim must carry the citation that settled it. Without
          // this a bot could promote a rumor to "Since confirmed" on its own
          // say-so, which is exactly the failure the rumor system exists to
          // prevent.
          if (RESOLVED_RUMOR_STATUSES.has(r.status)) {
            const res = r.resolution;
            if (!res || typeof res !== 'object') {
              err(`${rAt} status "${r.status}" requires a resolution { on, url, outlet } — a promotion without a citation is an opinion`);
            } else {
              if (!ISO_DATE_RE.test(trimmed(res.on)))
                err(`${rAt} resolution.on "${res.on}" is not YYYY-MM-DD`);
              if (!/^https?:\/\//.test(trimmed(res.url)))
                err(`${rAt} resolution.url is not an http(s) link — cite what settled it`);
              if (!trimmed(res.outlet)) err(`${rAt} resolution.outlet is required`);
              if ((res.note ?? '').length > POLICY_CAPS.rumorText)
                err(`${rAt} resolution.note ${res.note.length} > ${POLICY_CAPS.rumorText}`);
            }
          } else if (r.resolution != null) {
            err(`${rAt} has a resolution but status is "${r.status}" — only confirmed/debunked resolve`);
          }

          if (r.lastCheckedOn != null && !ISO_DATE_RE.test(trimmed(r.lastCheckedOn)))
            err(`${rAt} lastCheckedOn "${r.lastCheckedOn}" is not YYYY-MM-DD`);
          if (r.sourceTier != null && !RUMOR_SOURCE_TIERS.has(r.sourceTier))
            err(`${rAt} sourceTier "${r.sourceTier}" not in ${[...RUMOR_SOURCE_TIERS].join('|')}`);

          // The privacy matrix, made machine-checkable. An UNRESOLVED claim is
          // speculation by definition, so it is capped at region level — the
          // "expected at the Bowery Hotel" case. Once a claim is confirmed it
          // is a documented event and venue level is fine.
          if (r.locationSpecificity != null) {
            if (!LOCATION_SPECIFICITY.has(r.locationSpecificity))
              err(`${rAt} locationSpecificity "${r.locationSpecificity}" not in ${[...LOCATION_SPECIFICITY].join('|')} (there is no 'address' level — L3 is never publishable)`);
            else if (
              r.locationSpecificity !== 'region' &&
              !RESOLVED_RUMOR_STATUSES.has(r.status)
            )
              err(`${rAt} locationSpecificity "${r.locationSpecificity}" on an unresolved rumor — speculative location is capped at 'region' (privacy-redlines.md Never-OK #1). Coarsen the claim or drop it.`);
          }

          // --- Rumor Desk privacy redlines (2026-08-11) --------------------
          // The deterministic half of the judgment rules — security
          // arrangements, health/body, minors, relationship prognosis,
          // accusations — which the 2026-07-25 auto-merge decision record
          // named as the exposure it was accepting and prescribed exactly this
          // remedy for. Rules live in scripts/lib/rumor-redlines.mjs and bind
          // in two places: the BLOCKING subset here (a violating seed cannot
          // merge, which is the only form of enforcement that helps when
          // content auto-merges with no human read), and every rule as a Karen
          // finding via scripts/content-engine/checkers/rumor-redline.mjs
          // (which catches what is already live).
          //
          // Only the blocking subset runs here, and a rule is blocking only
          // when its remedy is mechanical: relabel a field, add a field, or
          // drop an inadmissible claim. Judgment-shaped rules stay advisory.
          for (const v of blockingRumorRedlineViolations(r, { category: it.category })) {
            err(`${rAt} [${v.rule}] ${v.title} — ${v.evidence} FIX: ${v.fix}`);
          }
        });
    }

    const span = eraSpan.get(eraSlug);
    if (span && Number.isInteger(it.year) && Number.isInteger(it.month)) {
      const mi = monthIndex(it.year, it.month);
      if (mi < span.lo || mi > span.hi)
        warn(
          `${it.year}-${String(it.month).padStart(2, '0')} is outside era "${eraSlug}" span — renders under its own section but check the date`,
        );
    }
  });
}

// The other half of the ratchet. Above, a grandfathered record that got sourced
// is an error so the entry gets deleted. Here, an entry matching NO record is
// an error too — otherwise deleting or retitling a record leaves behind a line
// that looks like a live exemption, and the next reader trusts a list that has
// quietly stopped describing the corpus.
for (const [label, list] of [
  ['UNSOURCED_LEGACY', UNSOURCED_LEGACY],
  ['SINGLE_OUTLET_LEGACY', SINGLE_OUTLET_LEGACY],
]) {
  for (const key of list) {
    if (seenMomentKeys.has(key)) continue;
    console.error(
      `ERROR scripts/lib/sourcing-gate.mjs: ${label} lists "${key}", which matches no moment — the record was deleted or retitled; delete the entry`,
    );
    errors += 1;
  }
}

// ---------------------------------------------------------------------------
// Non-month-scoped types (releases / tours / theories / videos)
// ---------------------------------------------------------------------------

// Era slugs allowed on new-type records: the seeded eras plus eras the audit
// expects but that land in a separate rollout PR (the-life-of-a-showgirl in
// PR 2) — content for a pending era must not fail validation in this branch.
const PENDING_ERAS = new Set(['the-life-of-a-showgirl']);
const knownEra = (slug) => eraSpan.has(slug) || PENDING_ERAS.has(slug);

async function loadTypeDir(dirName, listKey) {
  const rows = [];
  let files;
  try {
    files = readdirSync(join(seed, dirName))
      .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
      .sort();
  } catch {
    return rows; // dir may not exist in older checkouts
  }
  for (const file of files) {
    const mod = await import(pathToFileURL(join(seed, dirName, file)).href);
    const data = mod.default;
    if (!Array.isArray(data?.[listKey])) {
      console.error(`ERROR ${dirName}/${file}: default export has no ${listKey}[] array`);
      errors += 1;
      continue;
    }
    for (const row of data[listKey])
      rows.push({ file: `${dirName}/${file}`, fileEra: data.eraSlug, row });
  }
  return rows;
}

function makeReporters(at) {
  return {
    err: (msg) => {
      console.error(`ERROR ${at}: ${msg}`);
      errors += 1;
    },
    warn: (msg) => {
      console.warn(`WARN  ${at}: ${msg}`);
      warnings += 1;
    },
  };
}

// Shared checks for slug/era/sources/media on a new-type record.
function checkCommon({ row, fileEra, file, err }, slugSeen) {
  checked += 1;
  const eraSlug = row.eraSlug ?? fileEra;
  if (!row.slug) err('missing slug (stable identity is required)');
  else if (!SLUG_RE.test(row.slug)) err(`slug "${row.slug}" is not kebab-case`);
  else if (slugSeen.has(row.slug))
    err(`duplicate slug "${row.slug}" (first seen in ${slugSeen.get(row.slug)})`);
  if (row.slug && !slugSeen.has(row.slug)) slugSeen.set(row.slug, file);
  if (!eraSlug) err('missing eraSlug (not on record or file)');
  else if (!knownEra(eraSlug)) err(`unknown eraSlug "${eraSlug}"`);
  if (!row.title) err('missing title');

  const sources = row.sources ?? [];
  if (!Array.isArray(sources) || sources.length === 0)
    err('no sources — every new-type record requires >= 1 source (hard rule)');
  for (const s of sources) {
    if (!s.source_url) err('source entry missing source_url');
    if (s.source_type != null && !SOURCE_TYPES.has(s.source_type))
      err(`source_type "${s.source_type}" not a known type`);
    if (
      s.reliability_score != null &&
      !(
        Number.isInteger(s.reliability_score) &&
        s.reliability_score >= 1 &&
        s.reliability_score <= 5
      )
    )
      err(`reliability_score ${s.reliability_score} out of 1..5`);
    if (s.accessed_at != null && !ISO_DATE_RE.test(s.accessed_at))
      err(`accessed_at "${s.accessed_at}" is not YYYY-MM-DD`);
    if ((s.excerpt ?? '').length > EXCERPT_CAP)
      err(`source excerpt ${s.excerpt.length} > ${EXCERPT_CAP} (audit §5 hard cap)`);
  }

  for (const m of row.media ?? []) {
    if (!MEDIA_KINDS.has(m.kind))
      err(`media kind "${m.kind}" not in ${[...MEDIA_KINDS].join('|')}`);
    if (!MEDIA_RIGHTS.has(m.rights))
      err(
        `media rights "${m.rights}" not in ${[...MEDIA_RIGHTS].join('|')} — every media ref needs a rights status`,
      );
    if (m.kind === 'oembed' && !m.post_url) err('oembed media entry missing post_url');
    if (m.kind === 'owned' && !(m.asset_path && m.license_ref))
      err('owned media entry missing asset_path/license_ref');
    if (m.kind === 'hotlink_legacy' && !m.url) err('hotlink_legacy media entry missing url');
  }
}

const capped = (err, label, text, cap) => {
  if ((text ?? '').length > cap) err(`${label} ${text.length} > ${cap}`);
};

// -- releases --
const releaseSlugs = new Map();
const releaseRows = await loadTypeDir('releases', 'releases');
for (const entry of releaseRows) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, releaseSlugs);
  if (!RELEASE_KINDS.has(row.kind))
    err(`kind "${row.kind}" not in ${[...RELEASE_KINDS].join('|')}`);
  if (!ISO_DATE_RE.test(row.releaseDate ?? ''))
    err(`releaseDate "${row.releaseDate}" is not YYYY-MM-DD`);
  capped(err, 'note', row.note, DB_CAPS['release.note']);
  if (row.tracklist != null && !Array.isArray(row.tracklist))
    err('tracklist must be an array of track titles');
  if (
    row.trackCount != null &&
    Array.isArray(row.tracklist) &&
    row.tracklist.length > 0 &&
    row.tracklist.length !== row.trackCount
  )
    err(`trackCount ${row.trackCount} != tracklist length ${row.tracklist.length}`);
}
for (const { row, file } of releaseRows) {
  if (row.parentReleaseSlug != null && !releaseSlugs.has(row.parentReleaseSlug)) {
    console.error(
      `ERROR ${file} "${row.slug}": parentReleaseSlug "${row.parentReleaseSlug}" is not a known release slug`,
    );
    errors += 1;
  }
}

// -- tours --
const tourSlugs = new Map();
for (const entry of await loadTypeDir('tours', 'tours')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, tourSlugs);
  if (!ISO_DATE_RE.test(row.openedOn ?? '')) err(`openedOn "${row.openedOn}" is not YYYY-MM-DD`);
  if (row.closedOn != null && !ISO_DATE_RE.test(row.closedOn))
    err(`closedOn "${row.closedOn}" is not YYYY-MM-DD`);
  capped(err, 'note', row.note, DB_CAPS['tour.note']);
  capped(err, 'surpriseSongsNote', row.surpriseSongsNote, DB_CAPS['tour.note']);
  for (const leg of row.legs ?? []) {
    if (!leg.name) err('leg missing name');
    if (!ISO_DATE_RE.test(leg.from ?? '') || !ISO_DATE_RE.test(leg.to ?? ''))
      err(`leg "${leg.name}" from/to must be YYYY-MM-DD`);
  }
  for (const show of row.shows ?? []) {
    const sAt = `show ${show.date ?? '?'}`;
    if (!ISO_DATE_RE.test(show.date ?? '')) err(`${sAt}: date is not YYYY-MM-DD`);
    if (!show.city || !show.venue) err(`${sAt}: needs city + venue (venue-level, past-tense only)`);
    capped(err, `${sAt} outfitNote`, show.outfitNote, POLICY_CAPS.showNote);
    capped(err, `${sAt} setlistChange`, show.setlistChange, POLICY_CAPS.showNote);
    if (show.confidence != null && !THEORY_CONFIDENCE.has(show.confidence))
      err(`${sAt}: confidence "${show.confidence}" not a known level`);
  }
}

// -- theories --
const theorySlugs = new Map();
for (const entry of await loadTypeDir('theories', 'theories')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, theorySlugs);
  if (!THEORY_KINDS.has(row.kind)) err(`kind "${row.kind}" not in ${[...THEORY_KINDS].join('|')}`);
  if (!row.claim) err('missing claim');
  capped(err, 'claim', row.claim, DB_CAPS['theory.claim']);
  capped(err, 'evidence', row.evidence, DB_CAPS['theory.evidence']);
  if (!THEORY_CONFIDENCE.has(row.confidence))
    err(
      `confidence "${row.confidence}" missing or not a known level — REQUIRED so speculation never renders as fact`,
    );
  if (!THEORY_OUTCOMES.has(row.outcome))
    err(`outcome "${row.outcome}" missing or not a known value — REQUIRED`);
  if (row.relatedSlugs != null && !Array.isArray(row.relatedSlugs))
    err('relatedSlugs must be an array');
}

// -- videos --
const videoSlugs = new Map();
for (const entry of await loadTypeDir('videos', 'videos')) {
  const { row, file } = entry;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  checkCommon({ ...entry, err }, videoSlugs);
  if (!VIDEO_KINDS.has(row.kind)) err(`kind "${row.kind}" not in ${[...VIDEO_KINDS].join('|')}`);
  if (row.releasedOn != null && !ISO_DATE_RE.test(row.releasedOn))
    err(`releasedOn "${row.releasedOn}" is not YYYY-MM-DD`);
  capped(err, 'summary', row.summary, DB_CAPS['video_work.summary']);
  capped(err, 'symbolism', row.symbolism, DB_CAPS['video_work.symbolism']);
  for (const egg of row.easterEggs ?? []) capped(err, 'easterEggs entry', egg, POLICY_CAPS.easterEgg);
}

// -- era secrets (the Era Secret card, #688) --
// One sourced, genuinely-obscure fact per era, greeting every era entry. Every
// secret must be REAL and SOURCED — the generator drops any secret with no
// source, so a fabricated fact can't ship; this makes the same rule a hard,
// authored-early error. Self-contained (not checkCommon): the provisional-v0
// seeds carry source_type values outside the shared new-type enum
// (fan_wiki / reference), which is fine for a fact citation, so this checks the
// things that matter — identity, sourcing, and shape — without that coupling.
// `deeperLink` is an optional hop (song:/moment:/egg:) resolved at render time;
// an unresolvable one degrades to no link, so the shape check is a lint, not a
// cross-existence guarantee.
const ERA_SECRET_DEEPER_LINK_RE = /^(song|moment|egg):.+/;
const ERA_SECRET_PROVENANCE = new Set(['sourced', 'fan_consensus']);
const eraSecretSlugs = new Map();
for (const entry of await loadTypeDir('era-secrets', 'secrets')) {
  const { row, fileEra, file } = entry;
  checked += 1;
  const { err } = makeReporters(`${file} "${String(row.title ?? row.slug ?? '').slice(0, 42)}"`);
  const eraSlug = row.eraSlug ?? fileEra;
  if (!row.slug) err('missing slug (stable identity is required)');
  else if (!SLUG_RE.test(row.slug)) err(`slug "${row.slug}" is not kebab-case`);
  else if (eraSecretSlugs.has(row.slug))
    err(`duplicate slug "${row.slug}" (first seen in ${eraSecretSlugs.get(row.slug)})`);
  if (row.slug && !eraSecretSlugs.has(row.slug)) eraSecretSlugs.set(row.slug, file);
  if (!eraSlug) err('missing eraSlug (not on record or file)');
  else if (!knownEra(eraSlug)) err(`unknown eraSlug "${eraSlug}"`);
  if (!row.title) err('missing title');
  capped(err, 'title', row.title, POLICY_CAPS.eraSecretTitle);
  if (!row.secret) err('missing secret (the fact itself is required)');
  capped(err, 'secret', row.secret, POLICY_CAPS.eraSecretSecret);
  const sources = row.sources ?? [];
  if (!Array.isArray(sources) || sources.length === 0)
    err('no sources — every Era Secret must be sourced (hard rule; no invented trivia)');
  for (const s of sources) {
    if (!s.source_url) err('source entry missing source_url');
    if (s.accessed_at != null && !ISO_DATE_RE.test(s.accessed_at))
      err(`accessed_at "${s.accessed_at}" is not YYYY-MM-DD`);
    if (
      s.reliability_score != null &&
      !(Number.isInteger(s.reliability_score) && s.reliability_score >= 1 && s.reliability_score <= 5)
    )
      err(`reliability_score ${s.reliability_score} out of 1..5`);
  }
  if (row.deeperLink != null && !ERA_SECRET_DEEPER_LINK_RE.test(row.deeperLink))
    err(`deeperLink "${row.deeperLink}" must be a song:/moment:/egg: reference`);
  if (row.provenance != null && !ERA_SECRET_PROVENANCE.has(row.provenance))
    err(`provenance "${row.provenance}" not a known value (expected sourced|fan_consensus)`);
}

// -- tracks (song track guide) --
// The track seed files export `{ eraSlug, tracks: [] }` and carry per-era
// `.dossiers.mjs` side modules that export a slug->dossier map instead — skip
// those. We only enforce the machine-checkable shape here: the optional
// `youtubeId` (the song's playable audio) must be a bare 11-char YouTube id,
// same strict shape the tracks generator accepts. The audio-curator flow does
// the oEmbed author-channel verification that a static file check can't.
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
let trackFiles;
try {
  trackFiles = readdirSync(join(seed, 'tracks'))
    .filter((f) => f.endsWith('.mjs') && !f.startsWith('_') && !f.endsWith('.dossiers.mjs'))
    .sort();
} catch {
  trackFiles = []; // dir may not exist in older checkouts
}
for (const file of trackFiles) {
  const mod = await import(pathToFileURL(join(seed, 'tracks', file)).href);
  const data = mod.default;
  if (!Array.isArray(data?.tracks)) {
    console.error(`ERROR tracks/${file}: default export has no tracks[] array`);
    errors += 1;
    continue;
  }
  for (const row of data.tracks) {
    checked += 1;
    const { err } = makeReporters(
      `tracks/${file} "${String(row.trackTitle ?? row.slug ?? '').slice(0, 42)}"`,
    );
    if (row.youtubeId != null && !YOUTUBE_ID_RE.test(String(row.youtubeId)))
      err(`youtubeId "${row.youtubeId}" is not a bare 11-char YouTube id`);
    // track_note.note has a DB CHECK (<= 400, 20260704120000_track_note.sql)
    // that nothing here mirrored — found while consolidating the caps on
    // 2026-08-11. Longest note in the corpus today is 212, so this closes a
    // gap rather than changing behavior: without it an over-long note passes
    // every local gate and then fails at insert against the live project.
    capped(err, 'note', row.note, DB_CAPS['track_note.note']);
  }
}

// -- song moods (Mood Chat catalogue scores) --
// Score files under supabase/seed/song-moods/** reference real tracks by slug
// and carry the 8 mood axes. The generator (sync-song-moods.mjs) is the hard
// guard (it exits non-zero on any error, which reddens check:generated), but we
// surface the same errors here so `npm run validate:content` gives authors the
// list before they get that far. Reuses the generator's pure validators.
{
  const { loadTrackBase, loadRawScores, validateScores } = await import(
    pathToFileURL(join(here, 'sync-song-moods.mjs')).href
  );
  const { slugsByEra } = await loadTrackBase();
  const rawScores = await loadRawScores();
  checked += rawScores.length;
  for (const msg of validateScores(rawScores, slugsByEra)) {
    console.error(`ERROR song-moods ${msg}`);
    errors += 1;
  }
}

console.log(`\nvalidated ${checked} content item(s) — ${errors} error(s), ${warnings} warning(s)`);
if (errors > 0) process.exit(1);
