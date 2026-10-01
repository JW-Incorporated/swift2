/* Long Live FB export — privacy-safe DOM skeleton capture (FB-EXTENSION-1, capture mode).
 *
 * Problem: buildPostHtml and the engagement-count reader are guesses at Facebook's markup
 * (dry run 2026-09-30: Vault dropped 96 of 131 posts for "no message container"; Kulto read no
 * "N comments" count from any of 45 posts). To fix them we need the real structure of a post
 * container WITHOUT capturing a single word of a member's post, name or id.
 *
 * A SKELETON is a nested tree {tag, role?, attrs?, n, children?} of a post container where
 *   - every text node becomes {text:'T', len}
 *   - attribute VALUES survive only for a fixed set of structural attributes (role, data-ad-*,
 *     data-pagelet, aria-posinset, dir, tabindex, type, data-testid) and enum-valued aria-*;
 *   - aria-label / title / alt keep a SHAPE only: lower-cased words kept when in WORDS (UI
 *     vocabulary: comment, reactions, see more, Tagalog equivalents, time units), digits → '9',
 *     every other word → 'w' ("Comment by Maria Santos 2 hrs ago" → "comment by w w 9 hrs ago");
 *   - href keeps its path shape: known Facebook path words survive, every other segment (numeric
 *     ids, vanity names, usernames) → ':id', query KEYS only, no values, no hash
 *     ("/groups/123/posts/456/?comment_id=7&__cft__[0]=x" → "/groups/:id/posts/:id/?comment_id&__x");
 *   - class, src, srcset, style, id, name, value, placeholder-like attributes are dropped; any
 *     other attribute keeps its NAME with the value withheld ('-').
 * Each unit also carries a diagnosis (what postRegion / postMessageVerdict / extractEngagement
 * concluded, as codes and tag paths) and short label samples (aria-labels and ≤ 40-char texts
 * holding a digit, same shape redaction) so the count bar can be found even past the node cap.
 *
 * isRedactedSkeleton() is the same vocabulary used as a CHECKER: the receiver runs it on every
 * skeleton it is handed and refuses the group when anything outside the shape grammar appears.
 * Classic script (globalThis.LLFB), loaded by content.js on group pages and by the receiver /
 * vitest through node:vm.
 */
/* global URL */
(function (root) {
  'use strict';

  const LLFB = root.LLFB || (root.LLFB = {});

  const MAX_DEPTH = 25;
  const MAX_NODES = 600;
  const MAX_LABELS = 60;
  const MAX_DATA_ATTR_SAMPLES = 30;
  const MAX_ATTRS = 16;
  const MAX_SHAPE_CHARS = 160;
  const MAX_PATH_SEGMENTS = 25;
  const MAX_DROPPED = 15;
  const MAX_KEPT = 6;
  const PICK_MAX = 15;
  const PICK_MIN_KEPT = 3;
  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

  // Attributes whose VALUE is structural (never text a member wrote).
  const KEEP_VALUE = new Set([
    'role',
    'data-ad-rendering-role',
    'data-pagelet',
    'aria-posinset',
    'aria-setsize',
    'dir',
    'tabindex',
    'type',
    'data-testid',
  ]);
  const KEEP_VALUE_SHAPE = /^[\w .:/-]{0,60}$/;
  // Enum-valued attributes: kept only when the value is from the enum.
  const KEEP_ENUM = new Set([
    'aria-hidden',
    'aria-expanded',
    'aria-pressed',
    'aria-haspopup',
    'aria-level',
    'aria-busy',
    'aria-disabled',
    'aria-checked',
    'aria-selected',
    'aria-current',
    'aria-live',
    'aria-modal',
    'aria-multiline',
    'aria-readonly',
    'aria-required',
    'aria-autocomplete',
    'contenteditable',
    'draggable',
    'hidden',
    'disabled',
    'loading',
    'decoding',
  ]);
  const ENUM_VALUE =
    /^(?:|true|false|mixed|undefined|none|menu|listbox|tree|grid|dialog|polite|assertive|off|page|step|location|date|time|async|sync|lazy|eager|auto|list|both|inline|plaintext-only|\d{1,4})$/i;
  // Shape-redacted attributes (the label grammar below).
  const SHAPE_ATTRS = new Set(['aria-label', 'title', 'alt']);
  const HREF_ATTRS = new Set(['href', 'action', 'formaction']);
  // Never recorded, not even by name.
  const DROPPED = new Set([
    'class',
    'src',
    'srcset',
    'style',
    'id',
    'name',
    'value',
    'content',
    'placeholder',
    'poster',
    'data-src',
    'data-href',
    'xlink:href',
  ]);
  const NEVER_WALKED = new Set(['svg', 'script', 'style', 'template', 'iframe', 'noscript']);

  // UI vocabulary that survives in a label shape. English (the Like / Comment / Share row, the
  // comment-list controls, the count bar), their Tagalog equivalents, and the time units a
  // timestamp label is made of. Nothing here can name a person or quote a post.
  const WORDS = new Set([
    'comment',
    'comments',
    'reaction',
    'reactions',
    'like',
    'likes',
    'love',
    'share',
    'shares',
    'reply',
    'replies',
    'see',
    'more',
    'all',
    'view',
    'previous',
    'most',
    'relevant',
    'write',
    'a',
    'an',
    'by',
    'and',
    'the',
    'to',
    'of',
    'on',
    'in',
    'at',
    'ago',
    'public',
    'post',
    'posts',
    'photo',
    'photos',
    'video',
    'videos',
    'pinned',
    'featured',
    'announcement',
    'admin',
    'moderator',
    'author',
    'top',
    'contributor',
    'new',
    'member',
    'group',
    'send',
    'hide',
    'follow',
    'newest',
    'oldest',
    'sort',
    'who',
    'reacted',
    'this',
    'leave',
    'open',
    'close',
    'menu',
    'actions',
    'for',
    'profile',
    'link',
    'image',
    'may',
    'be',
    'link',
    'shared',
    'with',
    'edited',
    'just',
    'now',
    'yesterday',
    'today',
    'am',
    'pm',
    'second',
    'seconds',
    'minute',
    'minutes',
    'min',
    'mins',
    'hour',
    'hours',
    'hr',
    'hrs',
    'day',
    'days',
    'week',
    'weeks',
    'month',
    'months',
    'year',
    'years',
    's',
    'm',
    'h',
    'd',
    'w',
    'y',
    'january',
    'february',
    'march',
    'april',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
    // Tagalog UI words
    'komento',
    'mga',
    'reaksyon',
    'tingnan',
    'pa',
    'lahat',
    'tugon',
    'sagot',
    'ibahagi',
    'magsulat',
    'isulat',
    'ni',
    'nina',
    'ng',
    'sa',
    'ang',
    'nakaraang',
    'oras',
    'minuto',
    'araw',
    'linggo',
    'kahapon',
    'ngayon',
    'gusto',
    'ipadala',
    'sumagot',
    'higit',
    'nagustuhan',
  ]);
  // Known Facebook path words; any other segment is an id (numeric, vanity, username).
  const PATH_WORDS = new Set([
    'groups',
    'posts',
    'permalink',
    'permalink.php',
    'photo',
    'photo.php',
    'photos',
    'video',
    'videos',
    'watch',
    'reel',
    'reels',
    'user',
    'profile.php',
    'people',
    'pages',
    'page',
    'events',
    'hashtag',
    'search',
    'marketplace',
    'stories',
    'story.php',
    'share',
    'sharer',
    'sharer.php',
    'login',
    'login.php',
    'checkpoint',
    'l.php',
    'media',
    'set',
    'about',
    'members',
    'files',
    'discussion',
    'announcements',
    'ajax',
    'dialog',
    'help',
    'privacy',
    'policies',
    'settings',
    'notifications',
    'messages',
    'friends',
    'home.php',
    'albums',
    'comment',
    'comments',
    'pending_posts',
    'my_posted_content',
    'badges',
    'learning_content',
  ]);

  const NBSP = String.fromCharCode(0xa0);
  const squash = (value) =>
    String(value ?? '')
      .split(NBSP).join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  // One whitespace-separated token of a label → its shape. Numbers keep their punctuation with
  // every digit → '9' ("1,204" → "9,999", "1.2K" → "9.9k", "3:15" → "9:99"); a number with a
  // unit suffix keeps the unit when it is a known word ("2h" → "9h", "15m" → "99m"); words in
  // WORDS survive; everything else is 'w'. Leading/trailing punctuation (≤ 2 chars) is kept.
  function redactToken(token) {
    const lower = token.toLowerCase();
    if (/^[^\p{L}\p{N}]+$/u.test(lower)) return lower.length <= 2 ? lower : 'w';
    const match = /^([^\p{L}\p{N}]{0,2})(.*?)([^\p{L}\p{N}]{0,2})$/su.exec(lower);
    const lead = match ? match[1] : '';
    const core = match ? match[2] : lower;
    const trail = match ? match[3] : '';
    if (!core) return 'w';
    let word;
    if (/^[\d.,:%+]+[km]?$/.test(core) && /\d/.test(core)) word = core.replace(/\d/g, '9');
    else if (/^\d[\d.,]*[a-z]{1,7}$/.test(core)) {
      const unit = core.replace(/^[\d.,]+/, '');
      word = `${core.slice(0, core.length - unit.length).replace(/\d/g, '9')}${WORDS.has(unit) ? unit : 'w'}`;
    } else if (WORDS.has(core)) word = core;
    else word = 'w';
    return `${lead}${word}${trail}`;
  }

  function redactLabel(value) {
    const text = squash(value);
    if (!text) return '';
    const shaped = text.split(' ').map(redactToken).join(' ');
    return shaped.length > MAX_SHAPE_CHARS ? `${shaped.slice(0, MAX_SHAPE_CHARS - 1)}…` : shaped;
  }

  // Path shape of an href (see the file comment). Non-facebook hosts collapse to 'ext'.
  function redactHref(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    let url;
    try {
      url = new URL(raw.replace(/&amp;/g, '&'), 'https://www.facebook.com/');
    } catch {
      return 'invalid';
    }
    if (!/^https?:$/.test(url.protocol)) return 'ext';
    if (!/(^|\.)facebook\.com$/i.test(url.hostname)) return 'ext';
    const segments = url.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => (PATH_WORDS.has(segment.toLowerCase()) ? segment.toLowerCase() : ':id'));
    const keys = [...new Set([...url.searchParams.keys()])]
      .map((key) => (key.startsWith('__') ? '__x' : key))
      .filter((key) => /^[\w.[\]-]{1,40}$/.test(key))
      .slice(0, 12);
    const trailing = segments.length && url.pathname.endsWith('/') ? '/' : '';
    return `/${segments.join('/')}${trailing}${keys.length ? `?${[...new Set(keys)].join('&')}` : ''}`;
  }

  function redactAttribute(name, value) {
    const key = String(name).toLowerCase();
    const text = String(value ?? '');
    if (DROPPED.has(key) || key.startsWith('on')) return undefined;
    if (KEEP_VALUE.has(key) || key.startsWith('data-ad-'))
      return KEEP_VALUE_SHAPE.test(text) ? text : '-';
    if (HREF_ATTRS.has(key)) return redactHref(text);
    if (SHAPE_ATTRS.has(key)) return redactLabel(text);
    if (KEEP_ENUM.has(key) && ENUM_VALUE.test(text.trim())) return text.trim().toLowerCase();
    return '-';
  }

  function redactAttributes(el) {
    const out = {};
    let count = 0;
    for (const { name, value } of [...el.attributes]) {
      if (count >= MAX_ATTRS) break;
      const key = String(name).toLowerCase();
      if (key === 'role') continue; // carried at the node's top level
      const redacted = redactAttribute(key, value);
      if (redacted === undefined) continue;
      out[key] = redacted;
      count += 1;
    }
    return out;
  }

  const tagOf = (el) => String(el.localName || el.tagName || '').toLowerCase();
  const roleOf = (el) => {
    const role = squash(el.getAttribute?.('role')).toLowerCase();
    return role && /^[a-z]{1,40}$/.test(role) ? role : null;
  };

  function meaningfulChildren(el) {
    return [...el.childNodes].filter(
      (node) =>
        node.nodeType === ELEMENT_NODE ||
        (node.nodeType === TEXT_NODE && String(node.nodeValue ?? '').trim()),
    );
  }

  // The skeleton tree: depth ≤ maxDepth, at most maxNodes nodes (text nodes included) in
  // document order; svg / script-like subtrees are counted (`n`) but never walked.
  function buildSkeleton(rootEl, { maxDepth = MAX_DEPTH, maxNodes = MAX_NODES } = {}) {
    let budget = maxNodes;
    function visit(node, depth) {
      if (node.nodeType === TEXT_NODE) {
        const len = String(node.nodeValue ?? '').trim().length;
        if (!len) return null;
        budget -= 1;
        return { text: 'T', len };
      }
      if (node.nodeType !== ELEMENT_NODE) return null;
      budget -= 1;
      const tag = tagOf(node);
      const out = { tag };
      const role = roleOf(node);
      if (role) out.role = role;
      const attrs = redactAttributes(node);
      if (Object.keys(attrs).length) out.attrs = attrs;
      const kids = meaningfulChildren(node);
      out.n = kids.length;
      if (!kids.length || NEVER_WALKED.has(tag)) return out;
      if (depth >= maxDepth) {
        out.cut = 'depth';
        return out;
      }
      const children = [];
      for (const kid of kids) {
        if (budget <= 0) {
          out.cut = 'budget';
          break;
        }
        const child = visit(kid, depth + 1);
        if (child) children.push(child);
      }
      if (children.length) out.children = children;
      return out;
    }
    return visit(rootEl, 0);
  }

  // 'div>div[article]>span[button]' from `from` (exclusive) down to `el` (inclusive).
  function pathTo(from, el) {
    const parts = [];
    for (let node = el; node && node !== from; node = node.parentElement) {
      const role = roleOf(node);
      parts.unshift(role ? `${tagOf(node)}[${role}]` : tagOf(node));
    }
    if (parts.length > MAX_PATH_SEGMENTS)
      return `…>${parts.slice(parts.length - MAX_PATH_SEGMENTS).join('>')}`;
    return parts.join('>');
  }

  const depthOf = (from, el) => {
    let depth = 0;
    for (let node = el; node && node !== from; node = node.parentElement) depth += 1;
    return depth;
  };

  // Every aria-label, and every element whose OWN text is ≤ 40 chars and holds a digit (count
  // and timestamp candidates), as shapes with their tag path — findable even past the node cap.
  function labelSamples(unitEl, region, max = MAX_LABELS) {
    const out = [];
    for (const el of unitEl.querySelectorAll('*')) {
      if (out.length >= max) break;
      const label = el.getAttribute('aria-label');
      const own = squash(
        [...el.childNodes]
          .filter((node) => node.nodeType === TEXT_NODE)
          .map((node) => node.nodeValue)
          .join(''),
      );
      const shortText = own && own.length <= 40 && /\d/.test(own) ? own : null;
      if (!label && !shortText) continue;
      const sample = { path: pathTo(unitEl, el), depth: depthOf(unitEl, el) };
      if (label) sample.label = redactLabel(label);
      if (shortText) sample.text = redactLabel(shortText);
      if (region) sample.inRegion = region.inRegion(el);
      out.push(sample);
    }
    return out;
  }

  // Where Facebook's own structural data-* attributes sit (the message selector's candidates).
  function dataAttributeSamples(unitEl, region, max = MAX_DATA_ATTR_SAMPLES) {
    const out = [];
    for (const el of unitEl.querySelectorAll('*')) {
      if (out.length >= max) break;
      const attrs = {};
      for (const { name, value } of [...el.attributes]) {
        const key = String(name).toLowerCase();
        if (key.startsWith('data-ad-') || key === 'data-pagelet' || key === 'data-testid')
          attrs[key] = redactAttribute(key, value);
      }
      if (!Object.keys(attrs).length) continue;
      const sample = { path: pathTo(unitEl, el), depth: depthOf(unitEl, el), attrs };
      if (region) sample.inRegion = region.inRegion(el);
      out.push(sample);
    }
    return out;
  }

  // What the harvest concluded about this unit, as codes and tag paths only.
  function unitDiagnosis(unitEl) {
    const region = LLFB.postRegion(unitEl);
    const verdict = LLFB.postMessageVerdict(unitEl, region);
    const { reactions, commentCount, countElement } = LLFB.extractEngagement(unitEl, region);
    const text = squash(unitEl.textContent);
    return {
      posinset: Number(unitEl.getAttribute('aria-posinset')) || null,
      unitTag: roleOf(unitEl) ? `${tagOf(unitEl)}[${roleOf(unitEl)}]` : tagOf(unitEl),
      primaryArticlePath: region.primary ? pathTo(unitEl, region.primary) || '.' : null,
      articleCount: unitEl.querySelectorAll('[role="article"]').length,
      cutKind: region.cutKind ?? null,
      cutPath: region.cut ? pathTo(unitEl, region.cut) : null,
      message: verdict.reason,
      messagePath: verdict.message ? pathTo(unitEl, verdict.message) : null,
      messageSelectorHitsAnywhere: unitEl.querySelectorAll(LLFB.MESSAGE_SELECTOR).length,
      reactions: Number.isFinite(reactions) ? reactions : null,
      commentCount: Number.isFinite(commentCount) ? commentCount : null,
      countPath: countElement ? pathTo(unitEl, countElement) : null,
      textLength: text.length,
      hasAuthorLabel: Boolean(unitEl.querySelector('a[aria-label]')),
      hasPermalink: Boolean(unitEl.querySelector(LLFB.PERMALINK_SELECTOR)),
      dirAutoCount: unitEl.querySelectorAll('[dir="auto"]').length,
      kept: verdict.reason === 'ok',
    };
  }

  function unitSkeleton(unitEl, key) {
    const region = LLFB.postRegion(unitEl);
    return {
      key,
      diagnosis: unitDiagnosis(unitEl),
      labels: labelSamples(unitEl, region),
      dataAttributes: dataAttributeSamples(unitEl, region),
      tree: buildSkeleton(unitEl),
    };
  }

  const visibleIn = (win) => (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top <= win.innerHeight;
  };

  // One tick of capture: every newly visible feed unit (same candidates as captureVisibleUnits,
  // same ≤ 300-chars-without-author skip as mergeHarvest) is diagnosed and pooled — units
  // buildPostHtml DROPS first (up to maxDropped), kept ones up to maxKept. `full` once both pools
  // hold what pickSkeletons needs.
  function captureVisibleSkeletons(doc, win, state, { maxDropped = MAX_DROPPED, maxKept = MAX_KEPT } = {}) {
    state.seen ??= new WeakSet();
    state.seenKeys ??= new Set();
    state.dropped ??= [];
    state.kept ??= [];
    state.inspected ??= 0;
    const visible = visibleIn(win);
    const feed = doc.querySelector('[role="feed"]');
    const positioned = [...(feed ?? doc).querySelectorAll('[aria-posinset]')];
    const candidates = positioned.length ? positioned : [...(feed?.children ?? [])];
    for (const unit of candidates) {
      if (!visible(unit)) continue;
      const posinset = Number(unit.getAttribute('aria-posinset')) || 0;
      const key = posinset ? `pos:${posinset}` : null;
      if (state.seen.has(unit) || (key && state.seenKeys.has(key))) continue;
      state.seen.add(unit);
      if (key) state.seenKeys.add(key);
      const text = squash(unit.textContent);
      if (text.length <= 300 && !unit.querySelector('a[aria-label]')) continue;
      state.inspected += 1;
      let entry;
      try {
        entry = unitSkeleton(unit, key ?? `seen:${state.inspected}`);
      } catch {
        continue; // one odd unit never breaks the capture
      }
      const pool = entry.diagnosis.kept ? state.kept : state.dropped;
      const cap = entry.diagnosis.kept ? maxKept : maxDropped;
      if (pool.length < cap) pool.push(entry);
    }
    return {
      dropped: state.dropped.length,
      kept: state.kept.length,
      inspected: state.inspected,
      full: state.dropped.length >= maxDropped && state.kept.length >= Math.min(maxKept, PICK_MIN_KEPT),
    };
  }

  // Up to `max` skeletons: dropped units first, keeping room for at least `minKept` kept ones.
  function pickSkeletons(state, max = PICK_MAX, minKept = PICK_MIN_KEPT) {
    const kept = Array.isArray(state?.kept) ? state.kept : [];
    const dropped = Array.isArray(state?.dropped) ? state.dropped : [];
    const reserve = Math.min(kept.length, minKept);
    const takeDropped = dropped.slice(0, Math.max(0, max - reserve));
    const takeKept = kept.slice(0, Math.max(0, max - takeDropped.length));
    return [...takeDropped, ...takeKept];
  }

  // ---- checker: the same grammar, run on the receiving side -----------------------------------

  function isRedactedLabel(value) {
    if (typeof value !== 'string') return false;
    if (value.length > MAX_SHAPE_CHARS) return false;
    const text = value.endsWith('…') ? value.slice(0, -1) : value;
    if (!text) return true;
    return text.split(' ').every((token) => token !== '' && redactToken(token) === token);
  }

  const HREF_SHAPE =
    /^(?:|ext|invalid|\/(?:(?:[a-z0-9_.-]+|:id)(?:\/(?:[a-z0-9_.-]+|:id))*\/?)?(?:\?[\w.[\]-]{1,40}(?:&[\w.[\]-]{1,40})*)?)$/;

  function isRedactedHref(value) {
    if (typeof value !== 'string' || !HREF_SHAPE.test(value)) return false;
    if (value === '' || value === 'ext' || value === 'invalid') return true;
    const path = value.split('?')[0];
    return path
      .split('/')
      .filter(Boolean)
      .every((segment) => segment === ':id' || PATH_WORDS.has(segment));
  }

  function isRedactedAttribute(name, value) {
    const key = String(name).toLowerCase();
    if (typeof value !== 'string') return false;
    if (DROPPED.has(key) || key.startsWith('on') || key === 'role') return false;
    if (value === '-') return true;
    if (KEEP_VALUE.has(key) || key.startsWith('data-ad-')) return KEEP_VALUE_SHAPE.test(value);
    if (HREF_ATTRS.has(key)) return isRedactedHref(value);
    if (SHAPE_ATTRS.has(key)) return isRedactedLabel(value);
    if (KEEP_ENUM.has(key)) return ENUM_VALUE.test(value);
    return false;
  }

  const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isCount = (v) => Number.isInteger(v) && v >= 0;

  function checkTree(node, depth, counter) {
    if (!isPlainObject(node)) return 'node';
    counter.nodes += 1;
    if (counter.nodes > MAX_NODES) return 'node-cap';
    if (depth > MAX_DEPTH) return 'depth-cap';
    if ('text' in node) {
      const keys = Object.keys(node).sort().join(',');
      return node.text === 'T' && isCount(node.len) && keys === 'len,text' ? null : 'text';
    }
    if (typeof node.tag !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(node.tag)) return 'tag';
    if (node.role !== undefined && !/^[a-z]{1,40}$/.test(String(node.role))) return 'role';
    if (!isCount(node.n)) return 'n';
    if (node.cut !== undefined && node.cut !== 'depth' && node.cut !== 'budget') return 'cut';
    for (const key of Object.keys(node))
      if (!['tag', 'role', 'attrs', 'n', 'cut', 'children'].includes(key)) return 'node-key';
    if (node.attrs !== undefined) {
      if (!isPlainObject(node.attrs)) return 'attrs';
      for (const [name, value] of Object.entries(node.attrs))
        if (!isRedactedAttribute(name, value)) return `attr:${String(name).slice(0, 40)}`;
    }
    if (node.children !== undefined) {
      if (!Array.isArray(node.children)) return 'children';
      for (const child of node.children) {
        const problem = checkTree(child, depth + 1, counter);
        if (problem) return problem;
      }
    }
    return null;
  }

  const PATH_SHAPE = /^(?:…>)?[a-z][a-z0-9-]*(?:\[[a-z]{1,40}\])?(?:>[a-z][a-z0-9-]*(?:\[[a-z]{1,40}\])?)*$|^\.?$/;

  function checkSamples(list, kind) {
    if (!Array.isArray(list)) return `${kind}:list`;
    for (const sample of list) {
      if (!isPlainObject(sample)) return `${kind}:sample`;
      if (typeof sample.path !== 'string' || !PATH_SHAPE.test(sample.path)) return `${kind}:path`;
      if (sample.label !== undefined && !isRedactedLabel(sample.label)) return `${kind}:label`;
      if (sample.text !== undefined && !isRedactedLabel(sample.text)) return `${kind}:text`;
      if (sample.attrs !== undefined) {
        if (!isPlainObject(sample.attrs)) return `${kind}:attrs`;
        for (const [name, value] of Object.entries(sample.attrs))
          if (!isRedactedAttribute(name, value)) return `${kind}:attr`;
      }
      for (const key of Object.keys(sample))
        if (!['path', 'depth', 'label', 'text', 'inRegion', 'attrs'].includes(key))
          return `${kind}:key`;
    }
    return null;
  }

  const DIAGNOSIS_STRINGS = new Set([
    'unitTag',
    'primaryArticlePath',
    'cutKind',
    'cutPath',
    'message',
    'messagePath',
    'countPath',
  ]);

  // {ok:true} or {ok:false, reason}: every string in the skeleton is from the shape grammar.
  function isRedactedSkeleton(skeleton) {
    if (!isPlainObject(skeleton)) return { ok: false, reason: 'skeleton' };
    if (skeleton.key !== undefined && !/^(?:pos|seen):\d{1,9}$/.test(String(skeleton.key)))
      return { ok: false, reason: 'key' };
    if (!isPlainObject(skeleton.diagnosis)) return { ok: false, reason: 'diagnosis' };
    for (const [name, value] of Object.entries(skeleton.diagnosis)) {
      if (value === null || typeof value === 'number' || typeof value === 'boolean') continue;
      if (typeof value !== 'string' || !DIAGNOSIS_STRINGS.has(name))
        return { ok: false, reason: `diagnosis:${String(name).slice(0, 40)}` };
      const shape = name === 'cutKind' || name === 'message' ? /^[a-z-]{1,60}$/ : PATH_SHAPE;
      if (!shape.test(value) && !(name === 'unitTag' && /^[a-z0-9-]+(?:\[[a-z]+\])?$/.test(value)))
        return { ok: false, reason: `diagnosis:${name}` };
    }
    const labels = checkSamples(skeleton.labels ?? [], 'labels');
    if (labels) return { ok: false, reason: labels };
    const data = checkSamples(skeleton.dataAttributes ?? [], 'data');
    if (data) return { ok: false, reason: data };
    const tree = checkTree(skeleton.tree, 0, { nodes: 0 });
    if (tree) return { ok: false, reason: `tree:${tree}` };
    for (const key of Object.keys(skeleton))
      if (!['key', 'diagnosis', 'labels', 'dataAttributes', 'tree'].includes(key))
        return { ok: false, reason: `key:${String(key).slice(0, 40)}` };
    return { ok: true };
  }

  Object.assign(LLFB, {
    SKELETON_LIMITS: Object.freeze({ MAX_DEPTH, MAX_NODES, MAX_DROPPED, MAX_KEPT, PICK_MAX }),
    redactToken,
    redactLabel,
    redactHref,
    redactAttribute,
    redactAttributes,
    buildSkeleton,
    labelSamples,
    dataAttributeSamples,
    unitDiagnosis,
    unitSkeleton,
    captureVisibleSkeletons,
    pickSkeletons,
    isRedactedLabel,
    isRedactedHref,
    isRedactedAttribute,
    isRedactedSkeleton,
  });
})(globalThis);
