// Long Live FB extension — comment collector (content script, classic script,
// no import/export). Defines globalThis.LLFB.collectComments(units, opts) plus
// the pure parsing helpers it is built from (exposed on LLFB for vitest/jsdom).
//
// Comments are PRIVATE (see PLAN.md): this file never logs comment text, never
// does network I/O, and only ever clicks "open/expand" controls — never Like,
// Reply, Share or any composer.
/* global URL, setTimeout, KeyboardEvent */
(function llfbComments() {
  'use strict';
  const LLFB = (globalThis.LLFB = globalThis.LLFB || {});

  // ===========================================================================
  // DOM SELECTORS AND LABEL PATTERNS — BEST-EFFORT GUESSES.
  // Facebook's markup is obfuscated and changes often; none of these have been
  // verified against a live page from this code. Keep every Facebook-specific
  // guess in this block so a live run only has to adjust it here.
  // ===========================================================================
  const SEL = {
    feed: '[role="feed"]',
    // Post permalinks (same set the CDP harvester used).
    postPermalink: 'a[href*="/posts/"], a[href*="story_fbid"], a[href*="permalink"]',
    // Comment / reply containers: role=article with an aria-label such as
    // "Comment by <name> 2 days ago" / "Reply by <name> …".
    commentArticle: '[role="article"]',
    // Clickable controls (FB renders most as div/span role=button).
    button: '[role="button"], button',
    // Link to a single comment: …?comment_id=123[&reply_comment_id=456]
    commentPermalink: 'a[href*="comment_id="]',
    // Comment body blocks.
    commentBody: 'div[dir="auto"], span[dir="auto"]',
    // Timestamp carriers.
    timestamp: 'abbr[title], time[datetime], abbr[data-utime]',
    // Reaction count carriers ("12 reactions; see who reacted to this").
    reactionLabel: '[aria-label*="reaction" i]',
    dialog: '[role="dialog"]',
    dialogClose: '[aria-label="Close"][role="button"], [aria-label="Close"]',
  };
  const LABELS = {
    topLevel: /^comment\b/i, // aria-label of a top-level comment article
    reply: /^repl(?:y|ied)\b/i, // aria-label of a reply article
    // Opens / extends the comment list of a post.
    openComments: [
      /^\d[\d.,]*\s*[km]?\s+comments?$/i, // "12 comments", "1.2K comments"
      /^(?:view|see)\s+(?:more|all|previous)\s+comments?\b/i,
      /^(?:view|see)\s+\d[\d.,]*\s*[km]?\s+more\s+comments?\b/i,
    ],
    // Expands replies. "View more replies"/"View previous replies" continue a
    // first-level thread; "View N replies"/"N replies" open one.
    continueReplies: /^(?:view|see)\s+(?:more|previous|all)\s+repl(?:y|ies)\b/i,
    openReplies: [
      /^(?:view|see)\s+(?:all\s+)?\d[\d.,]*\s*[km]?\s+(?:more\s+)?repl(?:y|ies)\b/i,
      /^\d[\d.,]*\s*[km]?\s+repl(?:y|ies)$/i,
      /\breplied\b.*\b\d[\d.,]*\s*repl(?:y|ies)$/i, // "Name replied · 3 replies"
    ],
    // Never click anything matching these, whatever else matches.
    forbidden:
      /^(?:like|reply|share|send|comment|write a (?:comment|reply)|follow|join|more|edit|delete|report)\b/i,
  };
  // ===========================================================================

  const DEFAULTS = {
    topN: 20,
    maxPerPost: 50,
    pacingMs: [2000, 5000],
    maxMs: 15 * 60_000,
    maxClicksPerPost: 30,
    settleMs: 1200,
  };
  const FB_ORIGIN = 'https://www.facebook.com';
  const NBSP = String.fromCharCode(0xa0);

  // --------------------------------------------------------------- pure helpers
  function textOf(el) {
    if (!el) return '';
    const raw = typeof el.innerText === 'string' ? el.innerText : el.textContent;
    return String(raw ?? '')
      .split(NBSP)
      .join(' ')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  function labelOf(el) {
    return String(el?.getAttribute?.('aria-label') || textOf(el) || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // "12" → 12, "1.2K" → 1200, "3M" → 3000000, "1,234" → 1234; else 0.
  function parseCount(value) {
    const match = String(value ?? '')
      .split(NBSP)
      .join(' ')
      .match(/(\d[\d,]*(?:\.\d+)?)\s*([km])?/i);
    if (!match) return 0;
    const base = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(base)) return 0;
    const mult = { k: 1e3, m: 1e6 }[String(match[2] || '').toLowerCase()] || 1;
    return Math.round(base * mult);
  }

  // FNV-1a 32-bit, hex. Stable across runs for the same input.
  function stableHash(value) {
    let hash = 0x811c9dc5;
    const str = String(value ?? '');
    for (let i = 0; i < str.length; i += 1) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  // Reply id wins over the parent comment id in a reply permalink.
  function commentIdFromHref(href) {
    const str = String(href ?? '');
    const reply = str.match(/[?&]reply_comment_id=(\d+)/);
    if (reply) return reply[1];
    const comment = str.match(/[?&]comment_id=(\d+)/);
    return comment ? comment[1] : null;
  }

  // Absolute, tracking-free post URL, or null.
  function cleanPostUrl(href) {
    if (!href) return null;
    let url;
    try {
      url = new URL(String(href).replace(/&amp;/g, '&'), FB_ORIGIN);
    } catch {
      return null;
    }
    if (!/(^|\.)facebook\.com$/i.test(url.hostname)) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('__') || key === 'comment_id' || key === 'reply_comment_id') {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    return url.toString();
  }

  function postUrlFromUnit(unit) {
    const key = String(unit?.key ?? '');
    if (key.startsWith('direct:')) {
      const identity = key.slice('direct:'.length);
      if (/\/posts\/|story_fbid|permalink/.test(identity)) return cleanPostUrl(identity);
    }
    const match = String(unit?.html ?? '').match(
      /href="([^"]*(?:\/posts\/|story_fbid|permalink)[^"]*)"/,
    );
    return match ? cleanPostUrl(match[1]) : null;
  }

  function unitScore(unit) {
    const reactions = Number(unit?.reactions) || 0;
    const comments = Number(unit?.commentCount) || 0;
    return Math.max(0, reactions) + Math.max(0, comments);
  }

  // Top N units by reactions + commentCount; units with no comments skipped.
  function selectTopUnits(units, topN = DEFAULTS.topN) {
    const list = Array.isArray(units) ? units : [];
    return list
      .map((unit, index) => ({ unit, index }))
      .filter(({ unit }) => unit && typeof unit.key === 'string' && Number(unit.commentCount) > 0)
      .sort((a, b) => unitScore(b.unit) - unitScore(a.unit) || a.index - b.index)
      .slice(0, Math.max(0, Number(topN) || 0))
      .map(({ unit }) => unit);
  }

  function pathOf(href) {
    try {
      const url = new URL(String(href).replace(/&amp;/g, '&'), FB_ORIGIN);
      const fbid = url.searchParams.get('story_fbid');
      return fbid ? `story_fbid=${fbid}` : url.pathname.replace(/\/+$/, '');
    } catch {
      return null;
    }
  }

  // Locate the live post element for a harvest unit: by aria-posinset, else by
  // matching permalink path.
  function findPostElement(doc, unit) {
    const root = doc?.querySelector?.(SEL.feed) || doc;
    if (!root?.querySelectorAll) return null;
    const pos = Number(unit?.position) || Number(/^pos:(\d+)$/.exec(unit?.key ?? '')?.[1]) || 0;
    if (pos > 0) {
      const byPos = root.querySelector(`[aria-posinset="${pos}"]`);
      if (byPos) return byPos;
    }
    const wanted = postUrlFromUnit(unit);
    const wantedPath = wanted && pathOf(wanted);
    if (!wantedPath) return null;
    for (const link of root.querySelectorAll(SEL.postPermalink)) {
      if (pathOf(link.getAttribute('href')) === wantedPath) {
        return link.closest('[aria-posinset]') || link.closest(SEL.commentArticle) || null;
      }
    }
    return null;
  }

  function isCommentArticle(el) {
    const label = el.getAttribute('aria-label') || '';
    return LABELS.topLevel.test(label) || LABELS.reply.test(label);
  }

  function commentArticles(root) {
    if (!root?.querySelectorAll) return [];
    return [...root.querySelectorAll(SEL.commentArticle)].filter(isCommentArticle);
  }

  function authorOf(article) {
    const label = article.getAttribute('aria-label') || '';
    const fromLabel = label.match(
      /^(?:comment|reply)\s+by\s+(.+?)(?:\s+(?:\d+\s*\w+|a|an|about an?|yesterday|just now)(?:\s+ago)?)?$/i,
    );
    const link = [...article.querySelectorAll('a')].find((a) => {
      if (a.closest(SEL.commentArticle) !== article) return false;
      if (commentIdFromHref(a.getAttribute('href'))) return false; // timestamp link
      return textOf(a).length > 0;
    });
    return (link ? textOf(link) : fromLabel?.[1] || '').slice(0, 200);
  }

  function ownElements(article, selector) {
    return [...article.querySelectorAll(selector)].filter(
      (el) => el.closest(SEL.commentArticle) === article,
    );
  }

  function bodyOf(article, author) {
    const blocks = ownElements(article, SEL.commentBody).filter(
      (el) => !el.closest('a') && !el.parentElement?.closest(SEL.commentBody),
    );
    const text = blocks.map(textOf).filter(Boolean).join('\n').trim();
    if (text) return text;
    // Fallback: the article's own text without links, controls, timestamps
    // or nested comment articles (so "Like · Reply · 2d" never becomes text).
    const clone = article.cloneNode(true);
    for (const el of clone.querySelectorAll(
      `a, ${SEL.button}, ${SEL.timestamp}, ${SEL.commentArticle}`,
    )) {
      el.remove();
    }
    let all = String(clone.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (author && all.startsWith(author)) all = all.slice(author.length).trim();
    return all;
  }

  function timestampOf(article) {
    const carrier = ownElements(article, SEL.timestamp)[0];
    if (carrier) {
      return (
        carrier.getAttribute('datetime') ||
        carrier.getAttribute('data-utime') ||
        carrier.getAttribute('title') ||
        textOf(carrier) ||
        null
      );
    }
    const link = ownElements(article, SEL.commentPermalink)[0];
    return link ? link.getAttribute('aria-label') || textOf(link) || null : null;
  }

  function reactionsOf(article) {
    for (const el of ownElements(article, SEL.reactionLabel)) {
      const label = el.getAttribute('aria-label') || '';
      const match = label.match(/(\d[\d.,]*\s*[km]?)\s+reactions?/i);
      if (match) return parseCount(match[1]);
    }
    return 0;
  }

  function parseCommentArticle(article) {
    const author = authorOf(article);
    const text = bodyOf(article, author);
    const ts = timestampOf(article);
    const link = ownElements(article, SEL.commentPermalink)[0];
    const permalinkId = link ? commentIdFromHref(link.getAttribute('href')) : null;
    return {
      id: permalinkId || `h:${stableHash(`${author}|${text}|${ts ?? ''}`)}`,
      author,
      text,
      ts,
      reactions: reactionsOf(article),
    };
  }

  // Parse every comment article under rootEl into
  // [{id, author, text, ts, reactions, replies:[…]}]. Replies attach to the
  // nearest preceding top-level comment in document order (deeper replies are
  // flattened into that first level). Empty-text comments are dropped; ids are
  // deduplicated; at most maxPerPost top-level comments and maxPerPost replies
  // per comment.
  function extractCommentsFromContainer(rootEl, options = {}) {
    const maxPerPost = Math.max(0, Number(options.maxPerPost ?? DEFAULTS.maxPerPost));
    const seen = new Set();
    const comments = [];
    let current = null;
    for (const article of commentArticles(rootEl)) {
      const isReply = LABELS.reply.test(article.getAttribute('aria-label') || '');
      const parsed = parseCommentArticle(article);
      if (!parsed.text || seen.has(parsed.id)) continue;
      if (isReply) {
        if (!current || current.replies.length >= maxPerPost) continue;
        seen.add(parsed.id);
        current.replies.push(parsed);
      } else {
        if (comments.length >= maxPerPost) {
          current = null;
          continue;
        }
        seen.add(parsed.id);
        current = { ...parsed, replies: [] };
        comments.push(current);
      }
    }
    return comments;
  }

  function matchesAny(patterns, label) {
    return patterns.some((pattern) => pattern.test(label));
  }

  function precedingArticle(el, articles) {
    let found = null;
    for (const article of articles) {
      if (article.contains(el)) continue;
      // DOCUMENT_POSITION_FOLLOWING (4): el follows article.
      if (article.compareDocumentPosition(el) & 4) found = article;
      else break;
    }
    return found;
  }

  // Controls to click next inside root, in priority order: one "open/more
  // comments" control, else first-level reply expanders. Never forbidden ones.
  function findExpandButtons(root) {
    if (!root?.querySelectorAll) return { comments: [], replies: [] };
    const buttons = [...root.querySelectorAll(SEL.button)].filter(
      (el) => !el.getAttribute('aria-disabled') || el.getAttribute('aria-disabled') === 'false',
    );
    const articles = commentArticles(root);
    const comments = [];
    const replies = [];
    for (const button of buttons) {
      const label = labelOf(button);
      if (!label || LABELS.forbidden.test(label)) continue;
      if (matchesAny(LABELS.openComments, label)) {
        comments.push(button);
        continue;
      }
      const cont = LABELS.continueReplies.test(label);
      if (!cont && !matchesAny(LABELS.openReplies, label)) continue;
      const owner = button.closest(SEL.commentArticle);
      const before = owner && isCommentArticle(owner) ? owner : precedingArticle(button, articles);
      if (!before) continue;
      const beforeIsReply = LABELS.reply.test(before.getAttribute('aria-label') || '');
      // "View N replies" after a reply would open a second level: skip.
      if (beforeIsReply && !cont) continue;
      replies.push(button);
    }
    return { comments, replies };
  }

  // ------------------------------------------------------------- live driver
  function makeSleep(opts) {
    if (typeof opts.sleep === 'function') return opts.sleep;
    return (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }

  function pacing(opts, random) {
    const [lo, hi] = Array.isArray(opts.pacingMs) ? opts.pacingMs : DEFAULTS.pacingMs;
    const min = Math.max(0, Number(lo) || 0);
    const max = Math.max(min, Number(hi) || min);
    return Math.round(min + random() * (max - min));
  }

  async function collectForPost(unit, ctx) {
    const { doc, opts, sleep, random, now, deadline } = ctx;
    const post = findPostElement(doc, unit);
    if (!post) return null;
    const dialogsBefore = new Set(doc.querySelectorAll(SEL.dialog));
    let root = post;
    let openedDialog = null;
    const clicked = new WeakSet();
    let clicks = 0;
    const click = async (el) => {
      await sleep(pacing(opts, random));
      if (now() >= deadline) return false;
      try {
        el.scrollIntoView?.({ block: 'center' });
      } catch {
        /* ignore */
      }
      el.click();
      clicked.add(el);
      clicks += 1;
      await sleep(opts.settleMs ?? DEFAULTS.settleMs);
      if (!openedDialog) {
        const fresh = [...doc.querySelectorAll(SEL.dialog)].find((d) => !dialogsBefore.has(d));
        if (fresh) {
          openedDialog = fresh;
          root = fresh;
        }
      }
      return true;
    };
    try {
      const maxClicks = Number(opts.maxClicksPerPost ?? DEFAULTS.maxClicksPerPost);
      while (clicks < maxClicks && now() < deadline) {
        const current = extractCommentsFromContainer(root, opts);
        const { comments, replies } = findExpandButtons(root);
        const nextComments = comments.find((b) => !clicked.has(b));
        const nextReply = replies.find((b) => !clicked.has(b));
        let next = null;
        if (nextComments && current.length < opts.maxPerPost) next = nextComments;
        else if (nextReply) next = nextReply;
        if (!next) break;
        if (!(await click(next))) break;
      }
      return {
        postKey: unit.key,
        postUrl:
          postUrlFromUnit(unit) ||
          cleanPostUrl(post.querySelector(SEL.postPermalink)?.getAttribute('href')),
        comments: extractCommentsFromContainer(root, opts),
      };
    } finally {
      if (openedDialog) {
        try {
          const close = openedDialog.querySelector(SEL.dialogClose);
          if (close) close.click();
          else doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          await sleep(pacing(opts, random));
        } catch {
          /* ignore */
        }
      }
    }
  }

  // units: merged harvest units; opts: {topN, maxPerPost, pacingMs, maxMs}.
  // Test hooks: opts.document, opts.sleep, opts.random, opts.now.
  // Never throws; returns {comments: [{postKey, postUrl, comments}], coverage}. coverage counts the
  // eligible posts (top-N with commentCount > 0) and how each ended: processed (opened and at
  // least one comment read), failed (post not found on the page, the driver threw, or it
  // yielded zero comments despite commentCount > 0 — selector drift) or
  // timedOut (the time cap hit during it, or it was never reached). The four always add up:
  // eligible = processed + failed + timedOut. The receiver fails the group when comments were
  // systematically broken (Codex round 2 #6: failures used to be swallowed into []).
  async function collectComments(units, options) {
    const results = [];
    const coverage = { eligible: 0, processed: 0, failed: 0, timedOut: 0 };
    let unaccounted = 'failed'; // how posts never attempted are counted
    try {
      const opts = { ...DEFAULTS, ...(options || {}) };
      opts.maxPerPost = Math.max(0, Number(opts.maxPerPost) || 0);
      const selected = selectTopUnits(units, opts.topN);
      coverage.eligible = selected.length;
      const doc = opts.document || globalThis.document;
      if (!doc) {
        coverage.failed = selected.length;
        return { comments: results, coverage };
      }
      const now = typeof opts.now === 'function' ? opts.now : () => Date.now();
      const ctx = {
        doc,
        opts,
        sleep: makeSleep(opts),
        random: typeof opts.random === 'function' ? opts.random : Math.random,
        now,
        deadline: now() + Math.max(0, Number(opts.maxMs) || DEFAULTS.maxMs),
      };
      for (const unit of selected) {
        if (now() >= ctx.deadline) {
          unaccounted = 'timedOut';
          break;
        }
        try {
          const result = await collectForPost(unit, ctx);
          if (!result) coverage.failed += 1;
          else if (now() >= ctx.deadline) coverage.timedOut += 1;
          // Codex round 4 #1: an eligible post (commentCount > 0) that yields zero extracted
          // comments is selector drift, not "no comments" — the page offers no positive
          // zero-comments signal, so it always counts as failed.
          else if (!result.comments.length) coverage.failed += 1;
          else coverage.processed += 1;
          if (result && result.comments.length) results.push(result);
        } catch {
          coverage.failed += 1; // per-post failure: counted, keep going
        }
      }
    } catch {
      // never throw to the harvester; posts never attempted are counted as failed below
    }
    const accounted = coverage.processed + coverage.failed + coverage.timedOut;
    coverage[unaccounted] += Math.max(0, coverage.eligible - accounted);
    return { comments: results, coverage };
  }

  Object.assign(LLFB, {
    collectComments,
    extractCommentsFromContainer,
    findExpandButtons,
    findPostElement,
    selectTopUnits,
    postUrlFromUnit,
    cleanPostUrl,
    commentIdFromHref,
    parseCount,
    stableHash,
    COMMENT_SELECTORS: SEL,
    COMMENT_LABELS: LABELS,
  });
})();
