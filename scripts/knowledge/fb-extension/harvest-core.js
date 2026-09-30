/* Long Live FB export — harvest core (FB-EXTENSION-1).
 *
 * A plain classic script: no import/export. It assigns pure functions onto globalThis.LLFB so the
 * same file runs as an MV3 content script, is importScripts()-ed by the background service
 * worker (classifyPage for off-group redirects), and loads in vitest through node:vm.
 *
 * Ported from scripts/knowledge/fb-export-helpers.mjs and fb-export-harvest.mjs. Behaviour of the
 * ported functions must stay identical to those originals — fb-extension.test.ts runs both on
 * the same synthetic input. DOM functions take (doc, win) instead of reading globals so the test
 * can hand them a jsdom document; the content script passes document/window.
 */
(function (root) {
  'use strict';

  const LLFB = root.LLFB || (root.LLFB = {});

  const DAY_MS = 86_400_000;
  const AGE_STOP_COUNT = 3;
  const STUNTED_SCROLLS = 20;
  const STUNTED_MAX_SLOTS = 3;
  const DOCUMENT_POSITION_FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING

  const MONTHS = new Map(
    [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ].map((month, index) => [month, index]),
  );

  // ---- fb-export-helpers.mjs ports ------------------------------------------------------------

  function relativeAgeMs(value, now = new Date()) {
    const text = String(value ?? '')
      .trim()
      .replace(/\u00a0/g, ' ');
    if (!text) return null;
    if (/^(?:just now|now)$/i.test(text)) return 0;
    if (/^yesterday(?: at \d{1,2}:\d{2}(?: [ap]m)?)?$/i.test(text)) return DAY_MS;
    const relative = text.match(
      /^(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)(?:\s+ago)?$/i,
    );
    if (relative) {
      const amount = Number(relative[1]);
      const unit = relative[2].toLowerCase()[0];
      const multiplier =
        unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : unit === 'd' ? DAY_MS : 7 * DAY_MS;
      return amount * multiplier;
    }
    const monthDay = text.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s+at\s+(\d{1,2}):(\d{2})(?:\s*([ap]m))?)?$/i,
    );
    if (monthDay) {
      const [, monthName, dayText, yearText, hourText, minuteText, meridiem] = monthDay;
      let hour = Number(hourText ?? 0);
      if (meridiem) {
        hour %= 12;
        if (meridiem.toLowerCase() === 'pm') hour += 12;
      }
      const year = Number(yearText ?? now.getFullYear());
      const absolute = new Date(
        year,
        MONTHS.get(monthName.toLowerCase()),
        Number(dayText),
        hour,
        Number(minuteText ?? 0),
      );
      if (
        absolute.getFullYear() !== year ||
        absolute.getMonth() !== MONTHS.get(monthName.toLowerCase()) ||
        absolute.getDate() !== Number(dayText) ||
        (!yearText && absolute.getTime() > now.getTime())
      )
        return null;
      return Math.max(0, now.getTime() - absolute.getTime());
    }
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ][0-9:.+-]+(?:Z)?)?$/.test(text)) return null;
    const absolute = new Date(text);
    return Number.isNaN(absolute.getTime())
      ? null
      : Math.max(0, now.getTime() - absolute.getTime());
  }

  function unitAgeMs(unit, now = new Date()) {
    return relativeAgeMs(unit.ownTimestamp ?? unit.timestamps?.[0], now);
  }

  function unitsInFeedOrder(units) {
    return [...units].sort((left, right) => left.position - right.position);
  }

  function trailingOldBoundary(units, now = new Date(), count = AGE_STOP_COUNT) {
    const ordered = unitsInFeedOrder(units);
    const trailingOld = [];
    let boundaryIndex = ordered.length;
    for (let index = ordered.length - 1; index >= 0; index -= 1) {
      const unit = ordered[index];
      if (unit.ignoreForAge) continue;
      const ageMs = unitAgeMs(unit, now);
      if (ageMs === null) continue;
      if (ageMs <= 7 * DAY_MS) break;
      trailingOld.unshift({ index, ageMs });
      boundaryIndex = index;
    }
    if (trailingOld.length < count) return null;
    const stopUnits = trailingOld.slice(-count);
    return {
      boundaryIndex,
      coverageAgeMs: Math.min(...stopUnits.map(({ ageMs }) => ageMs)),
    };
  }

  function recentHarvestUnits(units, now = new Date()) {
    const ordered = unitsInFeedOrder(units);
    const boundary = trailingOldBoundary(ordered, now);
    if (!boundary) return ordered;
    return ordered.filter(
      (unit, index) =>
        index < boundary.boundaryIndex || unitAgeMs(unit, now) === null || unit.ignoreForAge,
    );
  }

  function median(values) {
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function harvestCoverageAge(units, now = new Date(), stopReason = null) {
    const boundary = trailingOldBoundary(units, now);
    if (stopReason === 'seven-days' && boundary) return boundary.coverageAgeMs;
    const ages = recentHarvestUnits(units, now)
      .map((unit) => unitAgeMs(unit, now))
      .filter(Number.isFinite);
    if (!ages.length) return null;
    const comparison = ages.slice(-20);
    const outlierLimit = 2 * median(comparison);
    const inliers = ages.filter((ageMs) => ageMs <= outlierLimit);
    return inliers.length ? Math.max(...inliers) : null;
  }

  function stopDecision({
    ageStopMet = false,
    stagnantScrolls,
    scrollCount,
    elapsedMs = 0,
    scrollCap = 250,
    wallBudgetMs = 20 * 60_000,
  }) {
    if (ageStopMet) return { stop: true, reason: 'seven-days', ageRuleMet: true };
    if (stagnantScrolls >= 3) return { stop: true, reason: 'feed-end', ageRuleMet: true };
    if (scrollCount >= scrollCap) return { stop: true, reason: 'scroll-cap', ageRuleMet: false };
    if (elapsedMs >= wallBudgetMs) return { stop: true, reason: 'wall-budget', ageRuleMet: false };
    return { stop: false, reason: null, ageRuleMet: false };
  }

  function classifyPage({ url = '', text = '', hasPassword = false, hasJoinGroup = false }) {
    const haystack = `${url}\n${text}`;
    if (/checkpoint|two[._ -]?step|two[._ -]?factor|2fa|approvals_code/i.test(haystack))
      return 'checkpoint';
    if (/captcha|security check|required to confirm/i.test(haystack)) return 'captcha';
    if (/this content isn['’]t available/i.test(haystack)) return 'unavailable';
    if (hasJoinGroup) return 'not-member';
    if (hasPassword || /facebook\.com\/login/i.test(url)) return 'login';
    return 'ready';
  }

  // ---- fb-export-harvest.mjs ports ------------------------------------------------------------

  function neutralizeArticleRoles(html) {
    return html.replace(/\brole\s*=\s*(["'])article\1/gi, 'data-fb-role="comment-article"');
  }

  function firstOwnTimestamp(values, now = new Date()) {
    return values.find((value) => relativeAgeMs(value, now) !== null) ?? null;
  }

  function maxCount(left, right) {
    const a = Number.isFinite(left) ? left : null;
    const b = Number.isFinite(right) ? right : null;
    if (a === null) return b;
    if (b === null) return a;
    return Math.max(a, b);
  }

  // Identical to the original for every original field. Extension addition: `reactions` and
  // `commentCount` ride along (larger known value wins, null when never seen).
  function mergeHarvest(state, snapshot) {
    const units = new Map(state.units.map((unit) => [unit.key, unit]));
    let nextSyntheticPosition = state.nextSyntheticPosition;

    for (const capture of snapshot.units) {
      if (capture.textLength <= 300 && !capture.hasAuthor) continue;
      const key = capture.position ? `pos:${capture.position}` : `direct:${capture.identity}`;
      const previous = units.get(key);
      const position = capture.position ?? previous?.position ?? nextSyntheticPosition++;
      const ownTimestamp =
        previous?.ownTimestamp ??
        capture.ownTimestamp ??
        firstOwnTimestamp(capture.timestamps ?? []) ??
        null;
      const reactions = maxCount(previous?.reactions, capture.reactions);
      const commentCount = maxCount(previous?.commentCount, capture.commentCount);
      const candidate = {
        key,
        position,
        html: neutralizeArticleRoles(capture.html),
        ownTimestamp,
        ignoreForAge: previous?.ignoreForAge || capture.ignoreForAge || false,
        reactions,
        commentCount,
      };
      if (!previous || candidate.html.length > previous.html.length) units.set(key, candidate);
      else
        units.set(key, {
          ...previous,
          ownTimestamp,
          ignoreForAge: previous.ignoreForAge || capture.ignoreForAge || false,
          reactions,
          commentCount,
        });
    }

    return {
      units: [...units.values()],
      nextSyntheticPosition,
      maxPosinset: Math.max(state.maxPosinset, snapshot.maxPosinset),
    };
  }

  function emptyHarvest() {
    return { units: [], nextSyntheticPosition: 1, maxPosinset: 0 };
  }

  function visibleIn(win) {
    return (element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= win.innerHeight;
    };
  }

  // Port of the page.evaluate body of expandVisibleUnits.
  function expandVisibleUnits(doc, win) {
    const visible = visibleIn(win);
    const feed = doc.querySelector('[role="feed"]');
    const positioned = [...(feed ?? doc).querySelectorAll('[aria-posinset]')];
    const units = positioned.length ? positioned : [...(feed?.children ?? [])];
    let count = 0;
    for (const unit of units.filter(visible)) {
      for (const control of unit.querySelectorAll('button, [role="button"]')) {
        const name = (control.getAttribute('aria-label') || control.textContent || '').trim();
        if (/^See more$/i.test(name)) {
          control.click();
          count += 1;
        }
      }
    }
    return count;
  }

  // "12", "1,204", "1.2K", "3M" → number; anything else → null.
  function parseCount(value) {
    const match = String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .trim()
      .match(/^(\d[\d,]*(?:\.\d+)?)\s*([KkMm])?$/);
    if (!match) return null;
    const base = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(base)) return null;
    const scale = !match[2] ? 1 : match[2].toLowerCase() === 'k' ? 1_000 : 1_000_000;
    return Math.round(base * scale);
  }

  const COUNT = String.raw`(\d[\d,]*(?:\.\d+)?\s*[KkMm]?)`;
  const REACTION_PATTERNS = [
    new RegExp(`^All reactions:?\\s*${COUNT}$`, 'i'),
    new RegExp(`^${COUNT}\\s+reactions?$`, 'i'),
  ];
  const COMMENT_PATTERN = new RegExp(`^${COUNT}\\s+comments?$`, 'i');

  // Best-effort engagement numbers from a unit's own (non-comment) DOM. DOM GUESS: Facebook
  // renders "All reactions:" + a count, "<n> reactions" or "<n> comments" as short labels; none
  // of this is verified against the live DOM. Unknown → null, never 0.
  function extractEngagement(unit, primaryArticle) {
    let reactions = null;
    let commentCount = null;
    const own = (element) =>
      !primaryArticle || element.closest('[role="article"]') === primaryArticle;
    for (const element of unit.querySelectorAll('[aria-label], span, a, div[role="button"]')) {
      if (reactions !== null && commentCount !== null) break;
      if (!own(element)) continue;
      const labels = [element.getAttribute('aria-label'), element.textContent]
        .filter(Boolean)
        .map((value) =>
          value
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )
        .filter((value) => value.length <= 40);
      for (const label of labels) {
        if (reactions === null) {
          for (const pattern of REACTION_PATTERNS) {
            const match = label.match(pattern);
            if (match) {
              reactions = parseCount(match[1]);
              break;
            }
          }
        }
        if (commentCount === null) {
          const match = label.match(COMMENT_PATTERN);
          if (match) commentCount = parseCount(match[1]);
        }
      }
    }
    return { reactions, commentCount };
  }

  // Port of captureVisibleUnits: the page.evaluate body plus the ownTimestamp post-processing.
  // Extension addition per unit: reactions, commentCount.
  function captureVisibleUnits(doc, win) {
    const visible = visibleIn(win);
    const feed = doc.querySelector('[role="feed"]');
    const positioned = [...(feed ?? doc).querySelectorAll('[aria-posinset]')];
    const maxPosinset = positioned.reduce(
      (max, unit) => Math.max(max, Number(unit.getAttribute('aria-posinset')) || 0),
      0,
    );
    const candidates = positioned.length ? positioned : [...(feed?.children ?? [])];
    const units = candidates.filter(visible).map((unit) => {
      const text = (unit.textContent ?? '').trim();
      const author = unit.querySelector('a[aria-label]');
      const permalink = unit.querySelector(
        'a[href*="/posts/"], a[href*="story_fbid"], a[href*="permalink"]',
      );
      const primaryArticle = unit.matches('[role="article"]')
        ? unit
        : unit.querySelector('[role="article"]');
      const timestampRoot = primaryArticle ?? unit;
      const messageRoot = timestampRoot.querySelector(
        '[data-ad-preview="message"], [data-ad-comet-preview="message"]',
      );
      const timestampValues = [
        ...(permalink ? [permalink] : []),
        ...timestampRoot.querySelectorAll('abbr, time'),
      ]
        .filter(
          (element) =>
            (!primaryArticle || element.closest('[role="article"]') === primaryArticle) &&
            (!messageRoot ||
              Boolean(element.compareDocumentPosition(messageRoot) & DOCUMENT_POSITION_FOLLOWING)),
        )
        .flatMap((element) => [
          element.getAttribute('datetime'),
          element.getAttribute('title'),
          element.getAttribute('aria-label'),
          element.textContent,
        ])
        .filter(Boolean);
      const markers = [...unit.querySelectorAll('[aria-label], [role="heading"], strong')].map(
        (element) => element.getAttribute('aria-label') || element.textContent || '',
      );
      const ignoreForAge = markers.some((value) =>
        /^(?:pinned|featured|announcement)(?: post)?$/i.test(value.trim()),
      );
      const position = Number(unit.getAttribute('aria-posinset')) || null;
      const { reactions, commentCount } = extractEngagement(unit, primaryArticle);
      return {
        position,
        identity:
          permalink?.getAttribute('href') ||
          `${author?.getAttribute('aria-label') ?? ''}|${text.slice(0, 160)}`,
        textLength: text.length,
        hasAuthor: Boolean(author),
        html: unit.outerHTML,
        ignoreForAge,
        ownTimestamp: firstOwnTimestamp(timestampValues),
        reactions,
        commentCount,
      };
    });
    return { units, maxPosinset };
  }

  // ---- extension-only helpers -----------------------------------------------------------------

  // Same inputs the CDP collector's inspectPage() gathered.
  function inspectPage(doc, url) {
    const elements = [...doc.querySelectorAll('button, [role="button"], input')];
    const name = (el) =>
      el.getAttribute('aria-label') || el.textContent || el.getAttribute('value') || '';
    return classifyPage({
      url,
      text: (doc.body?.innerText ?? doc.body?.textContent ?? '').slice(0, 50_000),
      hasPassword: Boolean(doc.querySelector('input[type="password"], input[name="pass"]')),
      hasJoinGroup: elements.some((el) => /^Join group$/i.test(name(el).trim())),
    });
  }

  // The group shell has rendered enough to classify (feed/article, or unavailable/join text).
  function shellReady(doc) {
    return Boolean(
      doc.querySelector('[role="feed"], [role="article"]') ||
      /this content isn['’]t available|join group/i.test(
        doc.body?.innerText ?? doc.body?.textContent ?? '',
      ),
    );
  }

  // DOM GUESS: Facebook keeps the acting Page id in the i_user cookie (fb-export-profile.mjs reads
  // it over CDP). If that cookie is readable from the page and we are meant to read as the personal
  // profile, we are acting as a Page → wrong-profile. A missing cookie proves nothing (it may be
  // HttpOnly), so readAs 'page' cannot be verified here and is reported as not detected (null).
  function detectWrongProfile({ cookie = '', readAs = 'personal' } = {}) {
    const actingAsPage = /(?:^|;\s*)i_user=\d+/.test(String(cookie));
    if (readAs === 'page') return null;
    return actingAsPage;
  }

  // Stagnation for a human-paced tick. The CDP loop counted a scroll as stagnant when no new
  // aria-posinset (or unit) appeared; one human tick moves ~350–800 px (the CDP scroll moved
  // ~2 000 px), so a tall post would read as "feed end" after three ticks. Extension rule: a tick
  // is stagnant only when the original rule says so AND we are at the bottom of the page AND the
  // page did not grow.
  function madeProgress({
    snapshotMaxPosinset,
    previousMaxPosinset,
    harvestCount,
    previousHarvestCount,
    nearBottom = true,
    scrollHeight = 0,
    previousScrollHeight = 0,
  }) {
    const original = snapshotMaxPosinset
      ? snapshotMaxPosinset > previousMaxPosinset
      : harvestCount > previousHarvestCount;
    return original || !nearBottom || scrollHeight > previousScrollHeight;
  }

  // One tick's stop decision: stopDecision plus the stunted-feed rule (slot count still ≤ 3 after
  // 20 scrolls — the CDP symptom). While the feed shows ≤ 3 slots a feed-end stop is suppressed
  // until the stunted check can fire; the seven-days rule, scroll cap and wall budget still apply.
  function tickDecision({
    units,
    slotCount,
    now,
    stagnantScrolls,
    scrollCount,
    elapsedMs,
    scrollCap,
    wallBudgetMs,
  }) {
    const ageStopMet = Boolean(trailingOldBoundary(units, now));
    const lowSlots = slotCount <= STUNTED_MAX_SLOTS;
    if (!ageStopMet && lowSlots && scrollCount >= STUNTED_SCROLLS)
      return { stop: true, status: 'stunted', reason: 'stunted-feed', ageRuleMet: false };
    const decision = stopDecision({
      ageStopMet,
      stagnantScrolls: lowSlots ? 0 : stagnantScrolls,
      scrollCount,
      elapsedMs,
      scrollCap,
      wallBudgetMs,
    });
    return { ...decision, status: decision.stop ? 'collected' : null };
  }

  // Units + coverage block for POST /result (schema v1). Only recent units leave the page.
  function buildCoverage({ harvest, now, stopReason, ageRuleMet, scrolls, wallMs }) {
    const recent = recentHarvestUnits(harvest.units, now);
    return {
      units: recent.map((unit) => ({
        key: unit.key,
        position: unit.position,
        html: unit.html,
        ownTimestamp: unit.ownTimestamp ?? null,
        ignoreForAge: Boolean(unit.ignoreForAge),
        reactions: Number.isFinite(unit.reactions) ? unit.reactions : null,
        commentCount: Number.isFinite(unit.commentCount) ? unit.commentCount : null,
      })),
      coverage: {
        harvestedCount: harvest.units.length,
        recentCount: recent.length,
        slotCount: harvest.maxPosinset,
        coverageAgeMs: harvestCoverageAge(harvest.units, now, stopReason),
        partial: ['scroll-cap', 'wall-budget'].includes(stopReason),
        ageRuleMet: Boolean(ageRuleMet),
        scrolls,
        wallMs,
      },
    };
  }

  // Human rhythm from the proven test extension: scrollBy 350–800 px (smooth), then mostly a
  // 1.2–3.2 s pause, 12 % of the time a 4–8 s "reading" pause.
  function humanScrollStep(random = Math.random) {
    const top = 350 + Math.floor(random() * 451);
    const pauseMs = random() < 0.12 ? 4000 + random() * 4000 : 1200 + random() * 2000;
    return { top, pauseMs };
  }

  Object.assign(LLFB, {
    DAY_MS,
    AGE_STOP_COUNT,
    STUNTED_SCROLLS,
    STUNTED_MAX_SLOTS,
    relativeAgeMs,
    unitAgeMs,
    trailingOldBoundary,
    recentHarvestUnits,
    harvestCoverageAge,
    stopDecision,
    classifyPage,
    neutralizeArticleRoles,
    firstOwnTimestamp,
    mergeHarvest,
    emptyHarvest,
    expandVisibleUnits,
    captureVisibleUnits,
    parseCount,
    extractEngagement,
    inspectPage,
    shellReady,
    detectWrongProfile,
    madeProgress,
    tickDecision,
    buildCoverage,
    humanScrollStep,
  });
})(globalThis);
