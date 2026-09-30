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
      coverage: null,
      ...extra,
    };
  }

  async function collectCommentsSafely(units, options) {
    if (typeof LLFB.collectComments !== 'function') return { comments: [] };
    try {
      const comments = await LLFB.collectComments(units, options);
      return { comments: Array.isArray(comments) ? comments : [] };
    } catch (error) {
      return { comments: [], message: `comments failed: ${String(error?.message ?? error)}` };
    }
  }

  // env: { doc, win, url, cookie, sleep, random, clock, now, render, heartbeat, every }
  async function runJob(job, env) {
    const startedAtMs = Number.isFinite(job.startedAtMs) ? job.startedAtMs : env.clock();
    const now = env.now();
    const render = env.render ?? (() => {});
    const collectedAt = () => env.now().toISOString();

    render([`LL export — ${job.label ?? job.slug}`, 'waiting for the group page…']);
    await waitForShell(env);

    const classification = LLFB.inspectPage(env.doc, env.url);
    if (classification !== 'ready') {
      render([`LL export — ${job.label ?? job.slug}`, `STOP: ${classification}`]);
      return baseResult(job, classification, { collectedAt: collectedAt() });
    }
    if (LLFB.detectWrongProfile({ cookie: env.cookie, readAs: job.readAs }) === true) {
      render([`LL export — ${job.label ?? job.slug}`, 'STOP: wrong-profile']);
      return baseResult(job, 'wrong-profile', { collectedAt: collectedAt() });
    }

    let harvest = LLFB.emptyHarvest();
    let previousHarvestCount = 0;
    let previousMaxPosinset = 0;
    let previousScrollHeight = pageMetrics(env).scrollHeight;
    let stagnantScrolls = 0;
    let scrollCount = 0;
    const stopHeartbeat = env.every(
      () => env.heartbeat({ slug: job.slug, scrolls: scrollCount, slotCount: harvest.maxPosinset }),
      HEARTBEAT_MS,
    );

    try {
      for (; ; scrollCount += 1) {
        const expanded = LLFB.expandVisibleUnits(env.doc, env.win);
        if (expanded) await env.sleep(EXPAND_WAIT_MS);
        const snapshot = LLFB.captureVisibleUnits(env.doc, env.win);
        harvest = LLFB.mergeHarvest(harvest, snapshot);
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
        const decision = LLFB.tickDecision({
          units: harvest.units,
          slotCount: harvest.maxPosinset,
          now,
          stagnantScrolls,
          scrollCount,
          elapsedMs,
          scrollCap: job.maxScrolls,
          wallBudgetMs: job.wallBudgetMs,
        });
        render([
          `LL export — ${job.label ?? job.slug}`,
          `feed slots loaded: ${harvest.maxPosinset}`,
          `posts kept: ${harvest.units.length}`,
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
          });
          let comments = [];
          let message;
          if (decision.status === 'collected' && units.length) {
            render([`LL export — ${job.label ?? job.slug}`, `comments for ${units.length} posts…`]);
            ({ comments, message } = await collectCommentsSafely(units, job.comments));
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
            coverage: { ...coverage, wallMs: env.clock() - startedAtMs },
            collectedAt: collectedAt(),
          });
        }

        const step = LLFB.humanScrollStep(env.random);
        env.win.scrollBy({ top: step.top, behavior: 'smooth' });
        await env.sleep(step.pauseMs);
      }
    } catch (error) {
      return baseResult(job, 'failed', {
        message: String(error?.message ?? error).slice(0, 300),
        collectedAt: collectedAt(),
      });
    } finally {
      stopHeartbeat();
    }
  }

  LLFB.runJob = runJob;

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
    await send({ type: 'llfb-result', result });
  });
})(globalThis);
