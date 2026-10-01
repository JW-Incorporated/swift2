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

  // Extension rule (Codex round 2 #3 — deliberately diverges from the CDP original, which scanned
  // all page text): checkpoint/captcha/login come ONLY from the URL or from dedicated challenge UI
  // (`challenge`, found by inspectPage), never from text, because members' posts can say "2FA" or
  // "captcha". A page with a rendered group feed (`hasFeed`) is ready whatever its post text says;
  // the "isn't available" text is only read when there is no feed (shared posts in a feed say it).
  function classifyPage({
    url = '',
    text = '',
    hasPassword = false,
    hasJoinGroup = false,
    hasFeed = false,
    challenge = null,
  }) {
    if (/\/checkpoint(?:[/?#]|$)|two_step_verification|two[._-]?factor|approvals_code/i.test(url))
      return 'checkpoint';
    if (/captcha/i.test(url)) return 'captcha';
    if (/facebook\.com\/login(?:[/.?#]|$)/i.test(url)) return 'login';
    if (challenge === 'captcha' || challenge === 'checkpoint') return challenge;
    if (hasJoinGroup) return 'not-member';
    if (hasPassword) return 'login';
    if (hasFeed) return 'ready';
    if (/this content isn['’]t available/i.test(text)) return 'unavailable';
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
        // null = sanitizeUnitElement dropped it (comment residue); a clean capture always wins.
        html: typeof capture.html === 'string' ? neutralizeArticleRoles(capture.html) : null,
        ownTimestamp,
        ignoreForAge: previous?.ignoreForAge || capture.ignoreForAge || false,
        reactions,
        commentCount,
      };
      if (!previous || (candidate.html?.length ?? -1) > (previous.html?.length ?? -1))
        units.set(key, candidate);
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

  // Comments are PRIVATE (PLAN schema v1): they may only leave the page through comments.js into
  // the local private store, never inside the uploaded unit HTML. The CDP harvester captured the
  // unit's full outerHTML, which carries every rendered comment/reply subtree. The extension
  // serializes a sanitized clone instead. DOM GUESS (like the rest of this file): comments and
  // replies are role=article elements nested inside the post's own article (aria-label
  // "Comment by …" / "Reply by …"); the composer is a textbox/contenteditable/form; the comment
  // list controls are buttons like "View more comments" / "Most relevant".
  const COMMENT_LABEL = /^(?:comment|reply) by\b/i;
  const COMPOSER_LABEL = /^(?:write a (?:public )?(?:comment|reply)|comment as|reply as)\b/i;
  const COMMENT_LIST_CONTROL =
    /^(?:(?:view|see|hide)\s+(?:more|all|previous|\d[\d.,]*\s*[km]?\s+(?:more\s+)?)?\s*(?:comments?|repl(?:y|ies))\b|most relevant|newest|all comments|\d[\d.,]*\s*[km]?\s+repl(?:y|ies)$)/i;
  const COMPOSER_SELECTOR =
    'form, [contenteditable="true"], [role="textbox"], textarea, input[type="text"], [role="combobox"]';

  //
  // Codex round 2 #1: that label pass alone is a denylist (fail-open). So, in order:
  //  1. STRUCTURAL CUT — find the post's action toolbar and remove it and everything after it
  //     within the unit (comments render below the toolbar). See findActionToolbar.
  //  2. The nested-article / label / composer removal below, as a second pass.
  //  3. FAIL-CLOSED residual check — if the clone still holds a comment permalink
  //     (comment_id= / reply_comment_id=) or any aria-label starting "Comment"/"Reply", return
  //     null: the unit's html is dropped (never uploaded) and buildCoverage counts it in
  //     coverage.sanitizeDropped.
  const CONTROL_SELECTOR = 'button, [role="button"]';
  const TOOLBAR_LIKE = /^(?:like|react)$/i;
  const TOOLBAR_COMMENT = /^(?:comment|leave a comment|write a comment)$/i;
  const TOOLBAR_MAX_TEXT = 120;
  const RESIDUAL_LINK = 'a[href*="comment_id="]'; // also matches reply_comment_id=
  const RESIDUAL_LABEL = /^(?:comment|reply)/i;

  const squash = (value) =>
    String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const controlName = (el) => squash(el.getAttribute('aria-label') || el.textContent);

  // DOM GUESS, two detectors, earliest in document order wins:
  //  - structural (language-neutral): an element owned by the post (not inside a nested
  //    role=article) with 3–6 element children where EVERY child is or holds a button /
  //    role=button and carries ≤ 40 chars of text — the Like / Comment / Share (/ Send) row.
  //  - labelled (English): the nearest ancestor of the first own "Like" control that also holds
  //    an own "Comment" control.
  // Either candidate must carry ≤ 120 chars of text so a match can never swallow the post body.
  function findActionToolbar(clone, primary) {
    const own = (el) => !primary || el.closest('[role="article"]') === primary;
    const small = (el) => squash(el.textContent).length <= TOOLBAR_MAX_TEXT;
    const holdsControl = (el) => el.matches(CONTROL_SELECTOR) || el.querySelector(CONTROL_SELECTOR);
    const candidates = [];

    const structural = [...clone.querySelectorAll('*')].find((el) => {
      if (!own(el) || el === primary) return false;
      const children = [...el.children];
      return (
        children.length >= 3 &&
        children.length <= 6 &&
        small(el) &&
        children.every((child) => holdsControl(child) && squash(child.textContent).length <= 40)
      );
    });
    if (structural) candidates.push(structural);

    const controls = [...clone.querySelectorAll(CONTROL_SELECTOR)].filter(own);
    const like = controls.find((el) => TOOLBAR_LIKE.test(controlName(el)));
    if (like) {
      for (let node = like.parentElement; node && node !== clone; node = node.parentElement) {
        if (node === primary || !small(node)) break;
        if (controls.some((el) => node.contains(el) && TOOLBAR_COMMENT.test(controlName(el)))) {
          candidates.push(node);
          break;
        }
      }
    }
    if (!candidates.length) return null;
    return candidates.reduce((first, next) =>
      first.compareDocumentPosition(next) & DOCUMENT_POSITION_FOLLOWING ? first : next,
    );
  }

  // Remove `node` and every following sibling of it and of each ancestor up to `container`.
  function cutFrom(node, container) {
    for (let current = node; current && current !== container; current = current.parentNode)
      while (current.nextSibling) current.nextSibling.remove();
    node.remove();
  }

  function hasCommentResidue(clone) {
    if (clone.querySelector(RESIDUAL_LINK)) return true;
    return [clone, ...clone.querySelectorAll('[aria-label]')].some((el) =>
      RESIDUAL_LABEL.test((el.getAttribute('aria-label') || '').trim()),
    );
  }

  function sanitizeUnitElement(unit) {
    const clone = unit.cloneNode(true);
    const primary = clone.matches?.('[role="article"]')
      ? clone
      : clone.querySelector('[role="article"]');
    const toolbar = findActionToolbar(clone, primary);
    if (toolbar) cutFrom(toolbar, clone);
    const doomed = new Set();
    // Every role=article other than the post's own (the first, outermost one) is a comment/reply.
    for (const article of clone.querySelectorAll('[role="article"]'))
      if (article !== primary) doomed.add(article);
    for (const element of clone.querySelectorAll('[aria-label]')) {
      const label = (element.getAttribute('aria-label') || '').trim();
      if (element !== primary && COMMENT_LABEL.test(label)) doomed.add(element);
      if (COMPOSER_LABEL.test(label)) doomed.add(element);
    }
    for (const element of clone.querySelectorAll(COMPOSER_SELECTOR)) doomed.add(element);
    for (const control of clone.querySelectorAll('button, [role="button"]')) {
      const name = (control.getAttribute('aria-label') || control.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (COMMENT_LIST_CONTROL.test(name)) doomed.add(control);
    }
    for (const element of doomed)
      if (element !== clone && !(primary && element.contains(primary))) element.remove();
    // Comment lists wrap each comment in <ul><li>; drop the now-empty scaffolding too.
    for (const list of clone.querySelectorAll('ul, ol'))
      if (!(list.textContent ?? '').trim()) list.remove();
    return hasCommentResidue(clone) ? null : clone.outerHTML;
  }

  // Port of captureVisibleUnits: the page.evaluate body plus the ownTimestamp post-processing.
  // Extension additions per unit: reactions, commentCount, and `html` is the sanitized clone
  // (sanitizeUnitElement) instead of the raw outerHTML. Every other field is computed exactly as
  // the original did, from the live element.
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
        html: sanitizeUnitElement(unit),
        ignoreForAge,
        ownTimestamp: firstOwnTimestamp(timestampValues),
        reactions,
        commentCount,
      };
    });
    return { units, maxPosinset };
  }

  // ---- extension-only helpers -----------------------------------------------------------------

  // Dedicated challenge UI only (DOM GUESS, structural — no page text): a captcha iframe/widget or
  // a checkpoint / two-factor form. Returns 'captcha' | 'checkpoint' | null.
  const CAPTCHA_UI =
    'iframe[src*="captcha" i], iframe[title*="captcha" i], [id*="captcha" i], ' +
    '[name*="captcha" i], .g-recaptcha, [data-sitekey]';
  const CHECKPOINT_UI =
    'form[action*="checkpoint"], form[action*="two_step_verification"], ' +
    'input[name="approvals_code"], [autocomplete="one-time-code"]';
  function challengeUi(doc) {
    if (doc.querySelector(CAPTCHA_UI)) return 'captcha';
    if (doc.querySelector(CHECKPOINT_UI)) return 'checkpoint';
    return null;
  }

  // Same inputs the CDP collector's inspectPage() gathered, plus the structural signals classifyPage
  // now relies on (rendered feed, challenge UI). Page text is only used for "isn't available".
  function inspectPage(doc, url) {
    const elements = [...doc.querySelectorAll('button, [role="button"], input')];
    const name = (el) =>
      el.getAttribute('aria-label') || el.textContent || el.getAttribute('value') || '';
    return classifyPage({
      url,
      text: (doc.body?.innerText ?? doc.body?.textContent ?? '').slice(0, 50_000),
      hasPassword: Boolean(doc.querySelector('input[type="password"], input[name="pass"]')),
      hasJoinGroup: elements.some((el) => /^Join group$/i.test(name(el).trim())),
      hasFeed: Boolean(doc.querySelector('[role="feed"], [aria-posinset]')),
      challenge: challengeUi(doc),
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

  // Who is the page acting as? (Codex round 2 #3: a missing i_user cookie used to count as
  // "personal verified".) Positive signals only:
  //  - Page: the i_user cookie is readable (Facebook sets it while acting as a Page; it may also be
  //    HttpOnly, so its absence proves nothing), or the top-bar account control
  //    ([role="banner"] element whose aria-label starts "Your profile" / "Account") names the
  //    acting Page (actingPage.name, FB_ACTING_PAGE in fb-groups-checklist.mjs) or links to its id.
  //  - personal: that account control is present and names/links to neither.
  //  - neither → 'unverified'. CHOICE: unverified does NOT stop the run — the account control is a
  //    DOM guess, and an unverifiable guess must not block every weekly run; the result carries
  //    coverage.profileVerified=false and the receiver records it.
  function actorSignal(doc, actingPage) {
    const banner = doc?.querySelector?.('[role="banner"]');
    if (!banner) return null;
    const control = [...banner.querySelectorAll('[aria-label]')].find((el) =>
      /^(?:your profile|account)\b/i.test((el.getAttribute('aria-label') || '').trim()),
    );
    if (!control) return null;
    const parts = [control, ...control.querySelectorAll('*')].flatMap((el) => [
      el.getAttribute('aria-label') || '',
      el.getAttribute('href') || '',
      el.getAttribute('xlink:href') || '',
    ]);
    parts.push(control.textContent || '');
    const name = String(actingPage?.name ?? '')
      .trim()
      .toLowerCase();
    const id = String(actingPage?.id ?? '').trim();
    const namesPage = parts.some(
      (part) =>
        (name && part.trim().toLowerCase() === name) ||
        (id && new RegExp(`[=/]${id.replace(/[^\w.-]/g, '\\$&')}(?:\\D|$)`).test(part)),
    );
    return namesPage ? 'page' : 'personal';
  }

  function profileCheck({ doc, cookie = '', readAs = 'personal', actingPage = null } = {}) {
    const iUser = /(?:^|;\s*)i_user=\d+/.test(String(cookie));
    const actor = iUser ? 'page' : actorSignal(doc, actingPage);
    if (!actor) return { status: 'unverified', profileVerified: false };
    const wanted = readAs === 'page' ? 'page' : 'personal';
    return actor === wanted
      ? { status: 'ok', profileVerified: true }
      : { status: 'wrong-profile', profileVerified: false };
  }

  // Kept for content.js: true = wrong profile, false = verified, null = unverified. `doc` defaults
  // to the content script's own document.
  function detectWrongProfile({ cookie = '', readAs = 'personal', doc, actingPage = null } = {}) {
    const { status } = profileCheck({ doc: doc ?? root.document, cookie, readAs, actingPage });
    return status === 'unverified' ? null : status === 'wrong-profile';
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

  // Feed slots seen so far. aria-posinset is the primary signal, but when Facebook omits it the
  // capture falls back to the feed's children and maxPosinset stays 0 — so the number of distinct
  // merged units counts too. Without this a posinset-less feed read as "stunted" after 20 scrolls.
  function harvestSlotCount(harvest) {
    return Math.max(Number(harvest?.maxPosinset) || 0, harvest?.units?.length ?? 0);
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

  // Units + coverage block for POST /result (schema v1). Only recent units leave the page, and
  // only those whose html survived sanitizing; the rest are counted in coverage.sanitizeDropped.
  // profileVerified is profileCheck's verdict; anything but an explicit true reports false.
  function buildCoverage({
    harvest,
    now,
    stopReason,
    ageRuleMet,
    scrolls,
    wallMs,
    profileVerified = false,
  }) {
    const recent = recentHarvestUnits(harvest.units, now);
    const clean = recent.filter((unit) => typeof unit.html === 'string');
    return {
      units: clean.map((unit) => ({
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
        slotCount: harvestSlotCount(harvest),
        coverageAgeMs: harvestCoverageAge(harvest.units, now, stopReason),
        partial: ['scroll-cap', 'wall-budget'].includes(stopReason),
        ageRuleMet: Boolean(ageRuleMet),
        scrolls,
        wallMs,
        sanitizeDropped: recent.length - clean.length,
        profileVerified: profileVerified === true,
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
    sanitizeUnitElement,
    harvestSlotCount,
    parseCount,
    extractEngagement,
    inspectPage,
    shellReady,
    detectWrongProfile,
    profileCheck,
    challengeUi,
    findActionToolbar,
    madeProgress,
    tickDecision,
    buildCoverage,
    humanScrollStep,
  });
})(globalThis);
