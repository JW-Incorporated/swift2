// @vitest-environment jsdom
// Synthetic fixtures only — every name, sentence, id and link below is invented. The point of
// this suite is that NONE of them survive into a skeleton.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
let LLFB: Any;

const DIR = process.env.LLFB_EXT_DIR || 'scripts/knowledge/fb-extension';

beforeAll(() => {
  for (const file of ['harvest-core.js', 'skeleton.js'])
    new Function(readFileSync(resolve(DIR, file), 'utf8'))();
  LLFB = (globalThis as Any).LLFB;
});

beforeEach(() => {
  document.body.innerHTML = '';
});

// Every private-looking token in the fixtures; the skeleton JSON must contain none of them.
const SENSITIVE = [
  'Maria',
  'Santos',
  'Juan',
  'dela',
  'Cruz',
  'Eras',
  'Manila',
  'tickets',
  'excited',
  'Congrats',
  'people',
  'says',
  'finally',
  '987654321',
  '1122334455',
  '5566778899',
  '99887766',
  'AbCdEf',
  '0917',
  '4567',
  'example.com',
  'example',
  'fbcdn',
  'scontent',
  'ABC123',
  'mount_0_0_x',
  'x1n2onr6',
  'Hinahanap',
  'kaibigan',
  'ticketbuddy',
];

const authorHref = '/groups/987654321/user/1122334455/?__cft__[0]=AbCdEf&__tn__=-UC';
const permalink = '/groups/987654321/posts/5566778899/?__cft__[0]=AbCdEf&__tn__=%2CO%2CP-R';
const commentLink = `${permalink}&comment_id=99887766&reply_comment_id=4455`;
const message =
  'I finally got tickets to the Eras Tour in Manila, so excited!!! Call 0917 123 4567';
const tagalog = 'Hinahanap ko ang kaibigan ko sa Manila';
const commentText = 'Congrats Maria! See you there, email me at maria.santos@example.com';

// A "kept" post: it has the message container buildPostHtml looks for.
const keptPost = (position: number) => `
  <div aria-posinset="${position}" class="x1n2onr6 x1qjc9v5" id="mount_0_0_x${position}">
    <div role="article" aria-labelledby="mount_0_0_x${position}-h" class="x1n2onr6">
      <div class="x1n2onr6"><div><div>
        <a aria-label="Maria Santos" href="${authorHref}" class="x1i10hfl"><span dir="auto">Maria Santos</span></a>
        <span aria-hidden="true"> · </span>
        <a href="${permalink}" aria-label="2 hrs ago"><abbr title="Tuesday, September 29, 2026 at 3:15 PM" data-utime="1790000000">2h</abbr></a>
        <span>${tagalog}</span>
      </div></div></div>
      <div data-ad-preview="message" data-ad-comet-preview="message" dir="auto" style="color:red">
        <div dir="auto" class="xdj266r">${message}</div>
        <div dir="auto"><a href="https://tickets.example.com/order/ABC123?user=maria">tickets.example.com</a></div>
      </div>
      <div><img src="https://scontent.xx.fbcdn.net/v/t39.123/456_789.jpg?_nc_cat=1" alt="May be an image of 2 people and text that says 'Eras Tour'"></div>
      <div><span aria-label="All reactions: 1,204"><span>1.2K</span></span><span>12 comments</span><span>3 shares</span></div>
      <div><div role="button" aria-label="Like">Like</div><div role="button">Comment</div><div role="button">Share</div></div>
      <div role="button" aria-label="Tingnan ang 5 pang komento">Tingnan ang 5 pang komento</div>
      <div role="article" aria-label="Comment by Juan dela Cruz 2 hrs ago">
        <a href="/groups/987654321/user/5544332211/">Juan dela Cruz</a>
        <div dir="auto">${commentText}</div>
        <a href="${commentLink}">2h</a>
      </div>
      <form><div contenteditable="true" role="textbox" aria-label="Write a comment…" aria-placeholder="Write a comment…"></div></form>
    </div>
  </div>`;

// A "dropped" post: same chrome, no message container (the live-feed shape of the dry run).
const droppedPost = (position: number) =>
  keptPost(position)
    .replace('data-ad-preview="message" data-ad-comet-preview="message" ', '')
    .replace(
      'role="article" aria-labelledby',
      'role="article" data-pagelet="FeedUnit_x" aria-labelledby',
    );

const feed = (html: string) => {
  document.body.innerHTML = `<div role="feed">${html}</div>`;
  return document.querySelector('[role="feed"]') as HTMLElement;
};

const countNodes = (node: Any): number =>
  1 + (node.children ?? []).reduce((sum: number, child: Any) => sum + countNodes(child), 0);
const maxDepth = (node: Any): number =>
  1 + Math.max(0, ...(node.children ?? []).map((child: Any) => maxDepth(child)));
const allStrings = (value: Any): string[] =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(allStrings)
      : [];

describe('skeleton redaction', () => {
  it('label shapes: allowlisted UI words survive, digits → 9, everything else → w', () => {
    expect(LLFB.redactLabel('Comment by Maria Santos 2 hrs ago')).toBe('comment by w w 9 hrs ago');
    expect(LLFB.redactLabel('All reactions: 1,204')).toBe('all reactions: 9,999');
    expect(LLFB.redactLabel('1.2K comments')).toBe('9.9k comments');
    expect(LLFB.redactLabel('View 3 more replies')).toBe('view 9 more replies');
    expect(LLFB.redactLabel('Tingnan ang 5 pang komento')).toBe('tingnan ang 9 w komento');
    expect(LLFB.redactLabel('Write a public comment…')).toBe('write a public comment…');
    expect(LLFB.redactLabel("Maria's photo · 2h")).toBe('w photo · 9h');
    expect(LLFB.redactLabel('José María 你好 ❤️')).toBe('w w w ❤️');
    expect(LLFB.redactLabel('')).toBe('');
    // Idempotent: a shape is its own shape (what the checker relies on).
    for (const label of ['comment by w w 9 hrs ago', 'all reactions: 9,999', 'w photo · 9h'])
      expect(LLFB.redactLabel(label)).toBe(label);
  });

  it('href shapes: known path words, every id → :id, query keys only, no hash, no host', () => {
    expect(LLFB.redactHref(permalink)).toBe('/groups/:id/posts/:id/?__x');
    expect(LLFB.redactHref(commentLink)).toBe(
      '/groups/:id/posts/:id/?__x&comment_id&reply_comment_id',
    );
    expect(LLFB.redactHref(authorHref)).toBe('/groups/:id/user/:id/?__x');
    for (const href of [permalink, commentLink, authorHref, 'https://x.example.com/a?b=c'])
      expect(LLFB.isRedactedHref(LLFB.redactHref(href)), href).toBe(true);
    expect(LLFB.isRedactedHref('/groups/987654321/posts/1')).toBe(false);
    expect(LLFB.redactHref('https://www.facebook.com/taylornation/posts/pfbid0abc#x')).toBe(
      '/:id/posts/:id',
    );
    expect(LLFB.redactHref('/photo/?fbid=123&set=gm.456')).toBe('/photo/?fbid&set');
    expect(LLFB.redactHref('/l.php?u=https%3A%2F%2Fexample.com%2Fsecret&h=AT0')).toBe('/l.php?u&h');
    expect(LLFB.redactHref('https://tickets.example.com/order/ABC123?user=maria')).toBe('ext');
    expect(LLFB.redactHref('mailto:maria.santos@example.com')).toBe('ext');
    expect(LLFB.redactHref('#')).toBe('/');
    expect(LLFB.redactHref('')).toBe('');
  });

  it('attributes: structural values kept, class/src/style/id dropped, the rest present-only', () => {
    feed(keptPost(1));
    const img = document.querySelector('img') as HTMLElement;
    expect(LLFB.redactAttributes(img)).toEqual({
      alt: "may be an image of 9 w and w w w 'w w'",
    });
    const container = document.querySelector('[data-ad-preview]') as HTMLElement;
    expect(LLFB.redactAttributes(container)).toEqual({
      'data-ad-preview': 'message',
      'data-ad-comet-preview': 'message',
      dir: 'auto',
    });
    const article = document.querySelector('[role="article"]') as HTMLElement;
    expect(LLFB.redactAttributes(article)).toEqual({ 'aria-labelledby': '-' });
    const box = document.querySelector('[role="textbox"]') as HTMLElement;
    expect(LLFB.redactAttributes(box)).toEqual({
      contenteditable: 'true',
      'aria-label': 'write a comment…',
      'aria-placeholder': '-',
    });
  });

  it('no synthetic sentence, name, id or link survives a unit skeleton', () => {
    feed(keptPost(1) + droppedPost(2));
    for (const unit of document.querySelectorAll('[aria-posinset]')) {
      const skeleton = LLFB.unitSkeleton(unit, `pos:${unit.getAttribute('aria-posinset')}`);
      const json = JSON.stringify(skeleton).toLowerCase();
      for (const token of SENSITIVE) expect(json, token).not.toContain(token.toLowerCase());
      expect(json).not.toContain(message.toLowerCase());
      expect(json).not.toContain(commentText.toLowerCase());
      expect(json).not.toContain('@');
      expect(json).not.toContain('http');
      // Every text node is {text:'T', len}; every string is from the shape grammar.
      expect(LLFB.isRedactedSkeleton(skeleton)).toEqual({ ok: true });
      const texts = allStrings(skeleton.tree).filter((s) => s === 'T');
      expect(texts.length).toBeGreaterThan(5);
    }
  });

  it('keeps what the selector fix needs: structure, data-ad-* values, count shapes, reason codes', () => {
    feed(keptPost(1) + droppedPost(2));
    const [kept, dropped] = [...document.querySelectorAll('[aria-posinset]')].map((unit) =>
      LLFB.unitSkeleton(unit, `pos:${unit.getAttribute('aria-posinset')}`),
    );
    expect(kept.diagnosis).toMatchObject({
      posinset: 1,
      message: 'ok',
      kept: true,
      messagePath: 'div[article]>div',
      messageSelectorHitsAnywhere: 1,
      reactions: 1204,
      commentCount: 12,
      cutKind: 'toolbar', // the Like / Comment / Share row precedes the first comment article
      articleCount: 2,
      hasAuthorLabel: true,
      hasPermalink: true,
    });
    expect(kept.diagnosis.countPath).toMatch(/^div\[article\]>div>span$/);
    expect(dropped.diagnosis).toMatchObject({
      posinset: 2,
      message: 'no-message-container',
      kept: false,
      messagePath: null,
      messageSelectorHitsAnywhere: 0,
      primaryArticlePath: 'div[article]',
      articleCount: 2,
      cutKind: 'toolbar',
    });
    expect(kept.diagnosis.cutPath).toBe('div[article]>div');
    expect(kept.labels.map((l: Any) => l.label ?? l.text)).toEqual(
      expect.arrayContaining([
        'w w',
        '9 hrs ago',
        '9h',
        'all reactions: 9,999',
        '9.9k',
        '99 comments',
        '9 shares',
        'like',
        'tingnan ang 9 w komento',
        'comment by w w w 9 hrs ago',
        'write a comment…',
      ]),
    );
    expect(kept.labels.find((l: Any) => l.text === '99 comments')).toMatchObject({
      path: 'div[article]>div>span',
      depth: 3,
      inRegion: true,
    });
    expect(kept.dataAttributes).toEqual([
      {
        path: 'div[article]>div',
        depth: 2,
        attrs: { 'data-ad-preview': 'message', 'data-ad-comet-preview': 'message' },
        inRegion: true,
      },
    ]);
    expect(dropped.dataAttributes[0].attrs).toEqual({ 'data-pagelet': 'FeedUnit_x' });
    expect(kept.tree).toMatchObject({
      tag: 'div',
      attrs: { 'aria-posinset': '1' },
      n: 1,
      children: [{ tag: 'div', role: 'article', attrs: { 'aria-labelledby': '-' } }],
    });
    const img = allStrings(kept.tree);
    expect(img).toContain('img');
    expect(img).not.toContain('x1n2onr6');
  });

  it('caps depth at 25 and nodes at 600, marking the cut', () => {
    const deep = `${'<div>'.repeat(40)}leaf${'</div>'.repeat(40)}`;
    const wide = Array.from({ length: 700 }, (_, i) => `<span>${i}</span>`).join('');
    feed(`<div aria-posinset="1"><div role="article">${deep}${wide}</div></div>`);
    const unit = document.querySelector('[aria-posinset]') as HTMLElement;
    const tree = LLFB.buildSkeleton(unit);
    expect(countNodes(tree)).toBeLessThanOrEqual(600);
    expect(maxDepth(tree)).toBeLessThanOrEqual(26); // root + 25 levels
    expect(JSON.stringify(tree)).toContain('"cut":"depth"');
    expect(JSON.stringify(tree)).toContain('"cut":"budget"');
    expect(LLFB.isRedactedSkeleton(LLFB.unitSkeleton(unit, 'pos:1'))).toEqual({ ok: true });
  });

  it('the checker refuses anything outside the shape grammar', () => {
    feed(keptPost(1));
    const unit = document.querySelector('[aria-posinset]') as HTMLElement;
    const good = LLFB.unitSkeleton(unit, 'pos:1');
    const tamper = (mutate: (copy: Any) => void) => {
      const copy = JSON.parse(JSON.stringify(good));
      mutate(copy);
      return LLFB.isRedactedSkeleton(copy);
    };
    expect(tamper((c) => (c.tree.attrs['aria-label'] = 'comment by maria santos'))).toEqual({
      ok: false,
      reason: 'tree:attr:aria-label',
    });
    expect(tamper((c) => c.tree.children[0].children.push({ text: 'Hello', len: 5 }))).toEqual({
      ok: false,
      reason: 'tree:text',
    });
    expect(tamper((c) => (c.tree.attrs.href = '/groups/987654321/posts/1'))).toMatchObject({
      ok: false,
      reason: 'tree:attr:href',
    });
    expect(tamper((c) => (c.tree.attrs.class = 'x1n2onr6'))).toMatchObject({ ok: false });
    expect(tamper((c) => (c.labels[0].label = 'Maria'))).toEqual({
      ok: false,
      reason: 'labels:label',
    });
    expect(tamper((c) => (c.diagnosis.note = 'Maria said hi'))).toEqual({
      ok: false,
      reason: 'diagnosis:note',
    });
    expect(tamper((c) => (c.html = '<p>Maria</p>'))).toEqual({ ok: false, reason: 'key:html' });
    expect(tamper((c) => (c.key = 'maria'))).toEqual({ ok: false, reason: 'key' });
  });
});

describe('capture pools', () => {
  it('pools dropped units first (max 15), kept up to 6, and picks 15 with room for 3 kept', () => {
    const html = [
      ...Array.from({ length: 20 }, (_, i) => droppedPost(i + 1)),
      ...Array.from({ length: 8 }, (_, i) => keptPost(i + 21)),
    ].join('');
    feed(html);
    const state: Any = {};
    const tick = LLFB.captureVisibleSkeletons(document, window, state);
    expect(tick).toEqual({ dropped: 15, kept: 6, inspected: 28, full: true });
    // A second tick re-reads nothing (every unit was seen).
    expect(LLFB.captureVisibleSkeletons(document, window, state)).toEqual(tick);
    const picked = LLFB.pickSkeletons(state);
    expect(picked).toHaveLength(15);
    expect(picked.filter((s: Any) => !s.diagnosis.kept)).toHaveLength(12);
    expect(picked.filter((s: Any) => s.diagnosis.kept)).toHaveLength(3);
    expect(picked.slice(0, 12).map((s: Any) => s.key)).toEqual(
      Array.from({ length: 12 }, (_, i) => `pos:${i + 1}`),
    );
    for (const skeleton of picked) expect(LLFB.isRedactedSkeleton(skeleton)).toEqual({ ok: true });
  });

  it('with few dropped units the pick fills from kept ones, never past the pools', () => {
    feed(droppedPost(1) + droppedPost(2) + keptPost(3) + keptPost(4) + keptPost(5));
    const state: Any = {};
    expect(LLFB.captureVisibleSkeletons(document, window, state)).toEqual({
      dropped: 2,
      kept: 3,
      inspected: 5,
      full: false,
    });
    expect(LLFB.pickSkeletons(state).map((s: Any) => s.key)).toEqual([
      'pos:1',
      'pos:2',
      'pos:3',
      'pos:4',
      'pos:5',
    ]);
  });

  it('skips the short author-less fragments mergeHarvest skips', () => {
    feed('<div aria-posinset="1"><div role="article">short</div></div>' + keptPost(2));
    const state: Any = {};
    expect(LLFB.captureVisibleSkeletons(document, window, state)).toMatchObject({
      inspected: 1,
      kept: 1,
      dropped: 0,
    });
  });
});
