/* Long Live FB export — content script (FB-EXTENSION-1).
 *
 * Two jobs, chosen by the page it runs on:
 *  - http://127.0.0.1:<port>/start#<token>: the start handshake. Reads port + token, hands them to
 *    the background service worker (which keeps them in chrome.storage.session), then scrubs the
 *    token from the address bar. No network I/O here.
 *  - https://www.facebook.com/groups/*: asks the background whether this tab has an active job.
 *    No job → does nothing at all. Job → classify the page, harvest the feed at a human pace,
 *    collect comments (comments.js, if loaded), and hand the result back to the background.
 *
 * Never fetches anything itself: every request to the receiver is made by background.js.
 * runJob(job, env) is exported on globalThis.LLFB so vitest can drive it with a jsdom page.
 */
/* global setTimeout, setInterval, clearInterval */
(function (root) {
  'use strict';

  const LLFB = root.LLFB || (root.LLFB = {});
  const HEARTBEAT_MS = 30_000;
  const SHELL_WAIT_MS = 20_000;
  const EXPAND_WAIT_MS = 500;
  const COMMENTS_MAX_MS = 15 * 60_000;
  const COMMENTS_RESERVE_MS = 60_000;
  const DEFAULT_WALL_MS = 20 * 60_000; // stopDecision's default wallBudgetMs
  const RESULT_RETRY_MS = [0, 5_000, 10_000, 20_000, 30_000, 60_000, 60_000, 60_000];

  function statusBox(doc) {
    let box = null;
    return (lines) => {
      try {
        if (!box) {
          box = doc.createElement('div');
          box.setAttribute('data-llfb-status', '');
          box.style.cssText =
            'position:fixed;top:70px;right:16px;z-index:2147483647;background:#111;color:#fff;' +
            'font:14px/1.4 system-ui,sans-serif;padding:10px 14px;border-radius:10px;' +
            'box-shadow:0 4px 16px rgba(0,0,0,.4);min-width:220px;white-space:pre;pointer-events:none';
          doc.documentElement.appendChild(box);
        }
        box.textContent = lines.join('\n');
      } catch {
        // The status box is cosmetic; never let it break a harvest.
      }
    };
  }

  async function waitForShell(env) {
    const deadline = env.clock() + SHELL_WAIT_MS;
    while (!LLFB.shellReady(env.doc) && env.clock() < deadline) await env.sleep(500);
  }

  function pageMetrics(env) {
    const element = env.doc.documentElement;
    const scrollHeight = element?.scrollHeight ?? 0;
    const bottom = (env.win.scrollY ?? 0) + (env.win.innerHeight ?? 0);
    return { scrollHeight, nearBottom: bottom >= scrollHeight - 200 };
  }

  function baseResult(job, status, extra = {}) {
    return {
      v: 1,
      slug: job.slug,
      status,
      stopReason: null,
      units: [],
      comments: [],
      commentCoverage: null,
      coverage: null,
      ...extra,
    };
  }

  // Comments run AFTER the feed harvest, inside the same group wall budget: the launcher kills
  // Chrome at Σ budgets + 10 min, so a group must never overrun its own budget. Cap = min(15 min,
  // remaining budget − 60 s); ≤ 0 → skip comments entirely (comments.js treats 0 as "default").
  function commentsBudgetMs(job, elapsedMs) {
    const wallBudgetMs = Number.isFinite(job.wallBudgetMs) ? job.wallBudgetMs : DEFAULT_WALL_MS;
    return Math.max(0, Math.min(COMMENTS_MAX_MS, wallBudgetMs - elapsedMs - COMMENTS_RESERVE_MS));
  }

  const COVERAGE_KEYS = ['eligible', 'processed', 'failed', 'timedOut'];
  // Round 5 (PM decision): passed through when the collector reports them.
  const OPTIONAL_COVERAGE_KEYS = [
    'knownPositiveEligible',
    'unknownEmpty',
    'countUnknown',
    'unitsSent',
  ];
  // Mirrors COMMENT_ERROR_CODES in fb-export-helpers.mjs.
  const COMMENT_ERRORS = Object.freeze({
    missing: 'collector-missing',
    threw: 'collector-threw',
    badShape: 'bad-shape',
    budgetSkip: 'budget-skip',
  });
  const isCount = (value) => Number.isInteger(value) && value >= 0;

  // comments.js returns {comments, coverage:{eligible, processed, failed, timedOut}}. Codex round
  // 3 #5: commentCoverage is never null for a harvested group — a missing collector, a collector
  // that returns no usable coverage (an older bare-array build) or one that throws produces an
  // explicit {error} coverage, which the receiver turns into a failed group.
  // Codex round 4 #4: the error is one of a fixed set of codes (COMMENT_ERRORS); an exception's
  // message is never put on the wire — it can carry DOM-derived private comment text.
  async function collectCommentsSafely(units, options) {
    if (typeof LLFB.collectComments !== 'function')
      return { comments: [], commentCoverage: { error: COMMENT_ERRORS.missing } };
    try {
      const out = await LLFB.collectComments(units, options);
      const coverage = out?.coverage;
      if (
        !coverage ||
        typeof coverage !== 'object' ||
        !COVERAGE_KEYS.every((k) => isCount(coverage[k]))
      )
        return { comments: [], commentCoverage: { error: COMMENT_ERRORS.badShape } };
      return {
        comments: Array.isArray(out.comments) ? out.comments : [],
        commentCoverage: Object.fromEntries(
          [...COVERAGE_KEYS, ...OPTIONAL_COVERAGE_KEYS]
            .filter((k) => isCount(coverage[k]))
            .map((k) => [k, coverage[k]]),
        ),
      };
    } catch {
      return { comments: [], commentCoverage: { error: COMMENT_ERRORS.threw } };
    }
  }

  // The posts comments.js would select (commentCount > 0, top N) — reported as timed out when the
  // group wall budget leaves no room for comment collection at all.
  function eligibleCommentPosts(units, topN) {
    const limit = Number.isFinite(topN) ? Math.max(0, topN) : 20;
    return Math.min(limit, units.filter((unit) => Number(unit.commentCount) > 0).length);
  }

  // profileCheck (harvest-core) → {status: 'ok'|'unverified'|'wrong-profile', profileVerified}.
  // Only 'wrong-profile' stops the group. An older harvest-core without it: the i_user cookie
  // check, never verified.
  function checkProfile(job, env) {
    if (typeof LLFB.profileCheck === 'function') {
      const verdict = LLFB.profileCheck({
        doc: env.doc,
        cookie: env.cookie,
        readAs: job.readAs,
        actingPage: job.actingPage,
      });
      return {
        wrongProfile: verdict?.status === 'wrong-profile',
        profileVerified: verdict?.profileVerified === true,
      };
    }
    return {
      wrongProfile: LLFB.detectWrongProfile({ cookie: env.cookie, readAs: job.readAs }) === true,
      profileVerified: false,
    };
  }

  // env: { doc, win, url, cookie, sleep, random, clock, now, render, heartbeat, every }
  async function runJob(job, env) {
    const startedAtMs = Number.isFinite(job.startedAtMs) ? job.startedAtMs : env.clock();
    const now = env.now();
    const render = env.render ?? (() => {});
    const collectedAt = () => env.now().toISOString();

    render([`LL export — ${job.label ?? job.slug}`, 'waiting for the group page…']);
    // Tab ↔ group binding (Codex round 3 #3), re-checked on the page itself: this page must be
    // the job's group, or nothing of it is read.
    if (typeof LLFB.groupMatches === 'function' && !LLFB.groupMatches(env.url, job)) {
      render([`LL export — ${job.label ?? job.slug}`, 'STOP: not the job’s group page']);
      return baseResult(job, 'failed', { message: 'redirected', collectedAt: collectedAt() });
    }
    await waitForShell(env);

    // Profile first (Codex round 3 #2): a Page session that lands on "join group" / "isn't
    // available" is wrong-profile, not a membership fact; and a not-member / unavailable result
    // carries whether the profile was verified, so an unverified one is never ledgered as a skip.
    const { wrongProfile, profileVerified } = checkProfile(job, env);
    const classification = LLFB.inspectPage(env.doc, env.url);
    const challenge = ['login', 'checkpoint', 'captcha'].includes(classification);
    if (wrongProfile && !challenge) {
      render([`LL export — ${job.label ?? job.slug}`, 'STOP: wrong-profile']);
      return baseResult(job, 'wrong-profile', { collectedAt: collectedAt() });
    }
    if (classification !== 'ready') {
      render([`LL export — ${job.label ?? job.slug}`, `STOP: ${classification}`]);
      return baseResult(job, classification, {
        coverage: { profileVerified },
        collectedAt: collectedAt(),
      });
    }

    // Capture mode (FB-EXTENSION-1 capture): the receiver's job says capture:true. The feed is
    // scrolled exactly as usual (same classification, pacing, stop rules, 3-min budget from the
    // receiver), but what leaves the page is a privacy-safe SKELETON of up to 15 post containers
    // (skeleton.js) — no unit html, no comments, no text. Used once to read Facebook's real
    // markup so buildPostHtml / the count reader can be fixed.
    const capture = job.capture === true && typeof LLFB.captureVisibleSkeletons === 'function';
    const captureState = capture ? {} : null;
    let captureFull = false;

    let harvest = LLFB.emptyHarvest();
    let previousHarvestCount = 0;
    let previousMaxPosinset = 0;
    let previousScrollHeight = pageMetrics(env).scrollHeight;
    let stagnantScrolls = 0;
    let scrollCount = 0;
    const stopHeartbeat = env.every(
      () =>
        env.heartbeat({
          slug: job.slug,
          scrolls: scrollCount,
          slotCount: LLFB.harvestSlotCount(harvest),
        }),
      HEARTBEAT_MS,
    );

    try {
      for (; ; scrollCount += 1) {
        const expanded = LLFB.expandVisibleUnits(env.doc, env.win);
        if (expanded) await env.sleep(EXPAND_WAIT_MS);
        const snapshot = LLFB.captureVisibleUnits(env.doc, env.win);
        harvest = LLFB.mergeHarvest(harvest, snapshot);
        if (capture)
          captureFull = LLFB.captureVisibleSkeletons(env.doc, env.win, captureState).full;
        const metrics = pageMetrics(env);
        const progress = LLFB.madeProgress({
          snapshotMaxPosinset: snapshot.maxPosinset,
          previousMaxPosinset,
          harvestCount: harvest.units.length,
          previousHarvestCount,
          nearBottom: metrics.nearBottom,
          scrollHeight: metrics.scrollHeight,
          previousScrollHeight,
        });
        stagnantScrolls = progress ? 0 : stagnantScrolls + 1;
        previousHarvestCount = harvest.units.length;
        previousMaxPosinset = Math.max(previousMaxPosinset, snapshot.maxPosinset);
        previousScrollHeight = Math.max(previousScrollHeight, metrics.scrollHeight);

        const elapsedMs = env.clock() - startedAtMs;
        const tick = LLFB.tickDecision({
          units: harvest.units,
          slotCount: LLFB.harvestSlotCount(harvest),
          now,
          stagnantScrolls,
          scrollCount,
          elapsedMs,
          scrollCap: job.maxScrolls,
          wallBudgetMs: job.wallBudgetMs,
        });
        // Capture stops early once its pools are full (stunted / seven-days / budget still win).
        const decision =
          !tick.stop && captureFull
            ? { stop: true, status: 'collected', reason: 'capture-full', ageRuleMet: false }
            : tick;
        render([
          `LL export — ${job.label ?? job.slug}${capture ? ' (capture)' : ''}`,
          `feed slots loaded: ${LLFB.harvestSlotCount(harvest)}`,
          `posts kept: ${harvest.units.length}`,
          ...(capture
            ? [`skeletons: ${captureState.dropped?.length ?? 0} dropped, ${captureState.kept?.length ?? 0} kept`]
            : []),
          `scroll steps: ${scrollCount}   time: ${Math.round(elapsedMs / 1000)}s`,
        ]);

        if (decision.stop) {
          const { units, coverage } = LLFB.buildCoverage({
            harvest,
            now,
            stopReason: decision.reason,
            ageRuleMet: decision.ageRuleMet,
            scrolls: scrollCount,
            wallMs: elapsedMs,
            profileVerified,
          });
          if (capture) {
            // Only skeletons leave the page: no units, no comments. The harvest counts ride
            // along so the receiver can print them next to the capture counts.
            const skeletons = LLFB.pickSkeletons(captureState);
            render([
              `LL export — ${job.label ?? job.slug} (capture)`,
              `DONE (${decision.reason}) — ${skeletons.length} skeletons`,
            ]);
            return baseResult(job, decision.status, {
              stopReason: decision.reason,
              units: [],
              comments: [],
              commentCoverage: null,
              skeletons,
              coverage: {
                ...coverage,
                profileVerified,
                wallMs: env.clock() - startedAtMs,
                captureInspected: captureState.inspected ?? 0,
                captureDropped: captureState.dropped?.length ?? 0,
                captureKept: captureState.kept?.length ?? 0,
              },
              collectedAt: collectedAt(),
            });
          }
          let comments = [];
          let commentCoverage = null;
          let message;
          const commentsMaxMs = commentsBudgetMs(job, env.clock() - startedAtMs);
          if (decision.status === 'collected' && units.length) {
            if (commentsMaxMs > 0) {
              render([
                `LL export — ${job.label ?? job.slug}`,
                `comments for ${units.length} posts…`,
              ]);
              ({ comments, commentCoverage } = await collectCommentsSafely(units, {
                ...job.comments,
                maxMs: commentsMaxMs,
              }));
            } else {
              // No budget left for comments: every eligible post counts as timed out, so the
              // receiver fails the group instead of recording it complete without its comments.
              const eligible = eligibleCommentPosts(units, job.comments?.topN);
              commentCoverage = { eligible, processed: 0, failed: 0, timedOut: eligible };
              if (typeof LLFB.commentCountStats === 'function') {
                const stats = LLFB.commentCountStats(units, job.comments?.topN);
                commentCoverage = {
                  ...stats,
                  processed: 0,
                  failed: 0,
                  timedOut: stats.eligible,
                  unknownEmpty: 0,
                };
              }
              if (eligible) message = `comments skipped: ${COMMENT_ERRORS.budgetSkip}`;
            }
          }
          render([
            `LL export — ${job.label ?? job.slug}`,
            `DONE (${decision.reason}) — ${units.length} recent posts`,
          ]);
          return baseResult(job, decision.status, {
            stopReason: decision.reason,
            ...(message ? { message } : {}),
            units,
            comments,
            commentCoverage,
            coverage: { ...coverage, profileVerified, wallMs: env.clock() - startedAtMs },
            collectedAt: collectedAt(),
          });
        }

        const step = LLFB.humanScrollStep(env.random);
        env.win.scrollBy({ top: step.top, behavior: 'smooth' });
        await env.sleep(step.pauseMs);
      }
    } catch (error) {
      return baseResult(job, 'failed', {
        // Error class name only: a message could carry DOM-derived (private) text.
        message: `harvest-threw:${/^[A-Za-z]{1,40}$/.test(error?.name ?? '') ? error.name : 'Error'}`,
        collectedAt: collectedAt(),
      });
    } finally {
      stopHeartbeat();
    }
  }

  LLFB.runJob = runJob;
  LLFB.commentsBudgetMs = commentsBudgetMs;

  // ---- bootstrap (only inside a real extension) -----------------------------------------------

  const chromeApi = root.chrome;
  if (!chromeApi?.runtime?.id || typeof root.location === 'undefined') return;
  const { location } = root;

  const send = (message) =>
    new Promise((resolve) => {
      try {
        chromeApi.runtime.sendMessage(message, (response) => {
          void chromeApi.runtime.lastError;
          resolve(response);
        });
      } catch {
        resolve(undefined);
      }
    });

  if (location.hostname === '127.0.0.1' && location.pathname.startsWith('/start')) {
    const token = location.hash.replace(/^#/, '');
    const port = Number(location.port);
    const render = statusBox(root.document);
    if (!/^[0-9a-f]{32,128}$/i.test(token) || !Number.isInteger(port) || port <= 0) {
      render(['LL export', 'start page without a valid token — nothing to do']);
      return;
    }
    // Scrub the token from the address bar and history entry before anything else.
    root.history.replaceState(null, '', location.pathname);
    send({ type: 'llfb-start', port, token }).then((response) => {
      render([
        'LL export',
        response?.ok ? 'started — this tab will open each group' : 'start failed',
      ]);
    });
    return;
  }

  if (location.hostname !== 'www.facebook.com' || !location.pathname.startsWith('/groups/')) return;

  send({ type: 'llfb-ready' }).then(async (response) => {
    const job = response?.job;
    if (!job) return; // no active job for this tab → do nothing
    const env = {
      doc: root.document,
      win: root,
      url: location.href,
      cookie: root.document.cookie,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      random: Math.random,
      clock: Date.now,
      now: () => new Date(),
      render: statusBox(root.document),
      heartbeat: (beat) => send({ type: 'llfb-heartbeat', ...beat }),
      every: (fn, ms) => {
        const id = setInterval(fn, ms);
        return () => clearInterval(id);
      },
    };
    const result = await runJob(job, env);
    // This page holds the result until the background acknowledges it ({ok:true}: persisted or
    // delivered). No answer (the worker was stopped mid-delivery) or {ok:false} → send it again.
    for (const delayMs of RESULT_RETRY_MS) {
      if (delayMs) await env.sleep(delayMs);
      const response = await send({ type: 'llfb-result', result });
      if (response?.ok === true) return;
    }
    env.render([`LL export — ${job.label ?? job.slug}`, 'could not hand the result back']);
  });
})(globalThis);
