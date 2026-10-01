// @vitest-environment jsdom
// Synthetic fixtures only — every name and text below is invented.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

type Comment = {
  id: string;
  author: string;
  text: string;
  ts: string | null;
  reactions: number;
  replies?: Comment[];
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LLFB: any;

beforeAll(() => {
  const source = readFileSync(
    resolve(process.env.LLFB_EXT_DIR || 'scripts/knowledge/fb-extension', 'comments.js'),
    'utf8',
  );
  new Function(source)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LLFB = (globalThis as any).LLFB;
});

beforeEach(() => {
  document.body.innerHTML = '';
});

function commentHtml(
  kind: 'Comment' | 'Reply',
  o: { id?: string; author: string; text: string; age?: string; reactions?: number },
) {
  const link = o.id
    ? `<a href="https://www.facebook.com/groups/1/posts/99/?comment_id=${kind === 'Reply' ? '5' : o.id}${kind === 'Reply' ? `&amp;reply_comment_id=${o.id}` : ''}&amp;__cft__=x">${o.age ?? '2d'}</a>`
    : '';
  const reactions = o.reactions
    ? `<div aria-label="${o.reactions} reactions; see who reacted to this" role="button"></div>`
    : '';
  return `<div role="article" aria-label="${kind} by ${o.author} ${o.age ?? '2 days'} ago">
    <a href="/profile/synthetic"><span>${o.author}</span></a>
    <div dir="auto">${o.text}</div>
    ${link}${reactions}
    <div role="button">Like</div><div role="button">Reply</div>
  </div>`;
}

describe('comment parsing helpers', () => {
  it('parses counts, ids, hashes and post URLs', () => {
    expect(LLFB.parseCount('1.2K')).toBe(1200);
    expect(LLFB.parseCount('1,234')).toBe(1234);
    expect(LLFB.parseCount('none')).toBe(0);
    expect(LLFB.commentIdFromHref('/x?comment_id=11&reply_comment_id=22')).toBe('22');
    expect(LLFB.commentIdFromHref('/x?comment_id=11')).toBe('11');
    expect(LLFB.commentIdFromHref('/x')).toBeNull();
    expect(LLFB.stableHash('abc')).toBe(LLFB.stableHash('abc'));
    expect(LLFB.stableHash('abc')).not.toBe(LLFB.stableHash('abd'));
    expect(LLFB.cleanPostUrl('/groups/1/posts/99/?__cft__[0]=zz&__tn__=R')).toBe(
      'https://www.facebook.com/groups/1/posts/99/',
    );
    expect(LLFB.cleanPostUrl('https://evil.example/posts/1')).toBeNull();
    expect(
      LLFB.postUrlFromUnit({ key: 'pos:3', html: '<a href="/groups/1/posts/42/?__tn__=x">t</a>' }),
    ).toBe('https://www.facebook.com/groups/1/posts/42/');
  });

  it('selects the top N units by reactions + comments, skipping zero-comment units', () => {
    const units = [
      { key: 'a', reactions: 100, commentCount: 0 },
      { key: 'b', reactions: 5, commentCount: 2 },
      { key: 'c', reactions: 50, commentCount: 10 },
      { key: 'd', reactions: 1, commentCount: 1 },
    ];
    expect(LLFB.selectTopUnits(units, 2).map((u: { key: string }) => u.key)).toEqual(['c', 'b']);
    expect(LLFB.selectTopUnits(null, 5)).toEqual([]);
  });

  it('treats a null commentCount as unknown, not zero: eligible after known counts (Codex round 5 #1)', () => {
    const units = [
      { key: 'zero', reactions: 500, commentCount: 0 },
      { key: 'null-lo', reactions: 3, commentCount: null },
      { key: 'known', reactions: 1, commentCount: 1 },
      { key: 'null-hi', reactions: 90, commentCount: null },
      { key: 'undef', reactions: 10 },
    ];
    expect(LLFB.selectTopUnits(units, 20).map((u: { key: string }) => u.key)).toEqual([
      'known',
      'null-hi',
      'undef',
      'null-lo',
    ]);
    expect(LLFB.selectTopUnits(units, 2).map((u: { key: string }) => u.key)).toEqual([
      'known',
      'null-hi',
    ]);
  });

  it('fails the group loudly when both count and comment selectors drift (Codex round 5 #1)', async () => {
    document.body.innerHTML = `<div role="feed">
      <div aria-posinset="1" id="p1"><a href="/groups/1/posts/11/">t</a>
        <div class="drifted">Synthetic unrecognised comment block</div></div>
      <div aria-posinset="2" id="p2"><a href="/groups/1/posts/22/">t</a></div>
    </div>`;
    let t = 0;
    const out = await LLFB.collectComments(
      [
        { key: 'pos:1', position: 1, html: '', reactions: 4, commentCount: null },
        { key: 'pos:2', position: 2, html: '', reactions: 2, commentCount: null },
      ],
      {
        pacingMs: [0, 0],
        sleep: async (ms: number) => {
          t += ms;
        },
        now: () => t,
      },
    );
    expect(out.coverage).toEqual({ eligible: 2, processed: 0, failed: 2, timedOut: 0 });
  });

  it('extracts comments with first-level replies, ids, reactions and dedupe', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      ${commentHtml('Comment', { id: '101', author: 'Test Fan A', text: 'Synthetic comment one', reactions: 7 })}
      ${commentHtml('Reply', { id: '201', author: 'Test Fan B', text: 'Synthetic reply one' })}
      ${commentHtml('Comment', { author: 'Test Fan C', text: 'Synthetic comment two' })}
      ${commentHtml('Comment', { id: '101', author: 'Test Fan A', text: 'Synthetic comment one' })}
      ${commentHtml('Comment', { id: '102', author: 'Test Fan D', text: '' })}`;
    const comments: Comment[] = LLFB.extractCommentsFromContainer(root, { maxPerPost: 50 });
    expect(comments).toHaveLength(2);
    expect(comments[0]).toMatchObject({
      id: '101',
      author: 'Test Fan A',
      text: 'Synthetic comment one',
      ts: '2d',
      reactions: 7,
    });
    expect(comments[0].replies).toEqual([
      { id: '201', author: 'Test Fan B', text: 'Synthetic reply one', ts: '2d', reactions: 0 },
    ]);
    expect(comments[1].id).toMatch(/^h:[0-9a-f]{8}$/);
    expect(comments[1].replies).toEqual([]);
  });

  it('caps comments per post', () => {
    const root = document.createElement('div');
    root.innerHTML = Array.from({ length: 5 }, (_, i) =>
      commentHtml('Comment', {
        id: String(300 + i),
        author: `Test Fan ${i}`,
        text: `Synthetic ${i}`,
      }),
    ).join('');
    expect(LLFB.extractCommentsFromContainer(root, { maxPerPost: 3 })).toHaveLength(3);
  });

  it('finds expand controls but never Like/Reply, and skips second-level reply expanders', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div role="button">12 comments</div>
      ${commentHtml('Comment', { id: '1', author: 'Test Fan A', text: 'Synthetic' })}
      <div role="button">View 3 replies</div>
      ${commentHtml('Reply', { id: '2', author: 'Test Fan B', text: 'Synthetic reply' })}
      <div role="button">View 2 replies</div>
      <div role="button">View more replies</div>
      <div role="button">View more comments</div>`;
    const { comments, replies } = LLFB.findExpandButtons(root);
    expect(comments.map((b: HTMLElement) => b.textContent)).toEqual([
      '12 comments',
      'View more comments',
    ]);
    expect(replies.map((b: HTMLElement) => b.textContent)).toEqual([
      'View 3 replies',
      'View more replies',
    ]);
  });

  it('locates the live post by aria-posinset or by permalink', () => {
    document.body.innerHTML = `<div role="feed">
      <div aria-posinset="1" id="p1"><a href="/groups/1/posts/11/">t</a></div>
      <div aria-posinset="2" id="p2"><a href="/groups/1/posts/22/?__cft__=a">t</a></div></div>`;
    expect(LLFB.findPostElement(document, { key: 'pos:1', position: 1 }).id).toBe('p1');
    expect(
      LLFB.findPostElement(document, { key: 'direct:/groups/1/posts/22/', position: null }).id,
    ).toBe('p2');
    expect(LLFB.findPostElement(document, { key: 'pos:9', position: 9, html: '' })).toBeNull();
  });
});

describe('collectComments (live driver against a synthetic DOM)', () => {
  function setupFeed() {
    const clickedForbidden: string[] = [];
    document.body.innerHTML = `<div role="feed">
      <div aria-posinset="1" id="p1"><a href="/groups/1/posts/11/">t</a>
        <div role="button" id="open1">2 comments</div><div role="button" id="like1">Like</div></div>
      <div aria-posinset="2" id="p2"><a href="/groups/1/posts/22/">t</a>
        <div role="button" id="open2">5 comments</div></div>
      <div aria-posinset="3" id="p3"><a href="/groups/1/posts/33/">t</a></div>
    </div>`;
    const p1 = document.getElementById('p1')!;
    document
      .getElementById('like1')!
      .addEventListener('click', () => clickedForbidden.push('like'));
    document.getElementById('open1')!.addEventListener('click', () => {
      p1.insertAdjacentHTML(
        'beforeend',
        `${commentHtml('Comment', { id: '101', author: 'Test Fan A', text: 'Synthetic one' })}
         <div role="button" id="rep1">View 1 reply</div>`,
      );
      document.getElementById('rep1')!.addEventListener('click', () => {
        document
          .getElementById('rep1')!
          .insertAdjacentHTML(
            'afterend',
            commentHtml('Reply', { id: '201', author: 'Test Fan B', text: 'Synthetic reply' }),
          );
      });
      p1.querySelectorAll('[role="button"]').forEach((b) => {
        if (b.textContent === 'Reply')
          b.addEventListener('click', () => clickedForbidden.push('reply'));
      });
    });
    document.getElementById('open2')!.click = () => {
      throw new Error('synthetic failure');
    };
    return clickedForbidden;
  }

  it('opens comments, expands first-level replies, paces every click and skips failing posts', async () => {
    const forbidden = setupFeed();
    const sleeps: number[] = [];
    let t = 0;
    const units = [
      { key: 'pos:1', position: 1, html: '', reactions: 50, commentCount: 2 },
      { key: 'pos:2', position: 2, html: '', reactions: 10, commentCount: 5 },
      { key: 'pos:3', position: 3, html: '', reactions: 99, commentCount: 0 },
      { key: 'pos:7', position: 7, html: '', reactions: 1, commentCount: 1 },
    ];
    const { comments: out, coverage } = await LLFB.collectComments(units, {
      topN: 20,
      maxPerPost: 50,
      pacingMs: [2000, 5000],
      sleep: async (ms: number) => {
        sleeps.push(ms);
        t += ms;
      },
      random: () => 0.5,
      now: () => t,
    });
    expect(out).toEqual([
      {
        postKey: 'pos:1',
        postUrl: 'https://www.facebook.com/groups/1/posts/11/',
        comments: [
          {
            id: '101',
            author: 'Test Fan A',
            text: 'Synthetic one',
            ts: '2d',
            reactions: 0,
            replies: [
              { id: '201', author: 'Test Fan B', text: 'Synthetic reply', ts: '2d', reactions: 0 },
            ],
          },
        ],
      },
    ]);
    expect(forbidden).toEqual([]);
    expect(sleeps.filter((ms) => ms === 3500).length).toBeGreaterThanOrEqual(3);
    // Codex round 2 #6: failures are counted, not swallowed. pos:3 has no comments (not
    // eligible); pos:2's click throws and pos:7 is not on the page → failed.
    expect(coverage).toEqual({ eligible: 3, processed: 1, failed: 2, timedOut: 0 });
  });

  it('counts an eligible post that yields zero comments as failed (Codex round 4 #1)', async () => {
    // Selector drift: the post is on the page and reports comments, but nothing the driver
    // recognises is there to open or read.
    document.body.innerHTML = `<div role="feed">
      <div aria-posinset="1" id="p1"><a href="/groups/1/posts/11/">t</a>
        <div class="drifted">Synthetic unrecognised comment block</div></div>
      <div aria-posinset="2" id="p2"><a href="/groups/1/posts/22/">t</a></div>
    </div>`;
    let t = 0;
    const opts = {
      pacingMs: [0, 0],
      sleep: async (ms: number) => {
        t += ms;
      },
      now: () => t,
    };
    const all = await LLFB.collectComments(
      [
        { key: 'pos:1', position: 1, html: '', reactions: 1, commentCount: 4 },
        { key: 'pos:2', position: 2, html: '', reactions: 1, commentCount: 2 },
      ],
      opts,
    );
    expect(all).toEqual({
      comments: [],
      coverage: { eligible: 2, processed: 0, failed: 2, timedOut: 0 },
    });
  });

  it('never throws and stops at the time cap', async () => {
    setupFeed();
    let t = 0;
    const units = [
      { key: 'pos:1', position: 1, html: '', reactions: 1, commentCount: 2 },
      { key: 'pos:2', position: 2, html: '', reactions: 1, commentCount: 5 },
    ];
    const out = await LLFB.collectComments(units, {
      maxMs: 1000,
      pacingMs: [2000, 2000],
      sleep: async (ms: number) => {
        t += ms;
      },
      now: () => t,
    });
    // pos:2 scores first and runs past the 1 s cap mid-post; pos:1 is never attempted.
    expect(out).toEqual({
      comments: [],
      coverage: { eligible: 2, processed: 0, failed: 0, timedOut: 2 },
    });
    await expect(LLFB.collectComments(undefined, undefined)).resolves.toEqual({
      comments: [],
      coverage: { eligible: 0, processed: 0, failed: 0, timedOut: 0 },
    });
    await expect(
      LLFB.collectComments([{ key: 'pos:1', commentCount: 1 }], { document: {} }),
    ).resolves.toEqual({
      comments: [],
      coverage: { eligible: 1, processed: 0, failed: 1, timedOut: 0 },
    });
  });
});
