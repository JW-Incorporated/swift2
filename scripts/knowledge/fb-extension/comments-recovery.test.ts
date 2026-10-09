// @vitest-environment jsdom
// #4688 failure modes, each against a synthetic DOM fixture (all names and text invented).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

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

const comment = (id: string, text: string) =>
  `<div role="article" aria-label="Comment by Test Fan ${id} 2 days ago">
    <a href="/profile/${id}"><span>Test Fan ${id}</span></a><div dir="auto">${text}</div>
    <a href="https://www.facebook.com/groups/1/posts/11/?comment_id=${id}">2d</a></div>`;

function clock() {
  let t = 0;
  return {
    pacingMs: [0, 0],
    settleMs: 10,
    sleep: async (ms: number) => {
      t += ms;
    },
    now: () => t,
  };
}

const unit = (n: number, commentCount: number | null = 3) => ({
  key: `pos:${n}`,
  position: n,
  html: '',
  reactions: 1,
  commentCount,
});

describe('comment collection failure modes (#4688)', () => {
  it('matches "View 3 comments" / "View more comments" expanders', () => {
    document.body.innerHTML = `<div id="r"><div role="button">View 3 comments</div>
      <div role="button">View more comments</div><div role="button">See previous comments</div>
      <div role="button">Comment</div></div>`;
    const found = LLFB.findExpandButtons(document.getElementById('r'));
    expect(found.comments).toHaveLength(3);
  });

  it('keeps clicking one expander node that loads more pages, bounded by maxRepeatClicks', async () => {
    document.body.innerHTML = `<div role="feed"><div aria-posinset="1" id="p1">
      <a href="/groups/1/posts/11/">t</a><div role="button" id="more">View more comments</div></div></div>`;
    const more = document.getElementById('more')!;
    let page = 0;
    more.addEventListener('click', () => {
      page += 1;
      more.insertAdjacentHTML('beforebegin', comment(`${page}0${page}`, `Synthetic page ${page}`));
    });
    const out = await LLFB.collectComments([unit(1)], clock());
    expect(page).toBe(3);
    expect(out.comments[0].comments).toHaveLength(3);
    expect(out.coverage).toMatchObject({ processed: 1, failed: 0 });
  });

  it('waits for lazy-loaded comments that mount after the first look', async () => {
    document.body.innerHTML = `<div role="feed"><div aria-posinset="1" id="p1">
      <a href="/groups/1/posts/11/">t</a></div></div>`;
    const opts = clock();
    let sleeps = 0;
    const baseSleep = opts.sleep;
    opts.sleep = async (ms: number) => {
      sleeps += 1;
      if (sleeps === 2) {
        document.getElementById('p1')!.insertAdjacentHTML('beforeend', comment('301', 'Late one'));
      }
      await baseSleep(ms);
    };
    const out = await LLFB.collectComments([unit(1)], opts);
    expect(out.coverage).toMatchObject({ processed: 1, failed: 0 });
  });

  it('retries once when the post is not on the page yet and records recovery', async () => {
    document.body.innerHTML = '<div role="feed"></div>';
    const opts = clock();
    let sleeps = 0;
    const baseSleep = opts.sleep;
    opts.sleep = async (ms: number) => {
      sleeps += 1;
      if (sleeps === 3) {
        document
          .querySelector('[role="feed"]')!
          .insertAdjacentHTML(
            'beforeend',
            `<div aria-posinset="1"><a href="/groups/1/posts/11/">t</a>${comment('401', 'Remounted')}</div>`,
          );
      }
      await baseSleep(ms);
    };
    const out = await LLFB.collectComments([unit(1)], opts);
    expect(out.coverage).toMatchObject({ processed: 1, failed: 0, retried: 1, recovered: 1 });
  });

  it('records a not-found reason when the post never appears', async () => {
    document.body.innerHTML = '<div role="feed"></div>';
    const out = await LLFB.collectComments([unit(1)], clock());
    expect(out.coverage).toMatchObject({
      failed: 1,
      failNotFound: 1,
      retried: 1,
      recovered: 0,
    });
  });

  it('records no-expander when nothing recognisable is on the post', async () => {
    document.body.innerHTML = `<div role="feed"><div aria-posinset="1">
      <a href="/groups/1/posts/11/">t</a><div class="drifted">x</div></div></div>`;
    const out = await LLFB.collectComments([unit(1)], clock());
    expect(out.coverage).toMatchObject({ failed: 1, failNoExpander: 1 });
  });

  it('records empty-after-expand when the expander opens nothing readable', async () => {
    document.body.innerHTML = `<div role="feed"><div aria-posinset="1">
      <a href="/groups/1/posts/11/">t</a><div role="button">3 comments</div></div></div>`;
    const out = await LLFB.collectComments([unit(1)], clock());
    expect(out.coverage).toMatchObject({ failed: 1, failEmptyAfterExpand: 1 });
  });

  it('records threw when the driver throws on both attempts, and keeps going', async () => {
    document.body.innerHTML = `<div role="feed">
      <div aria-posinset="1"><a href="/groups/1/posts/11/">t</a><div role="button" id="b">3 comments</div></div>
      <div aria-posinset="2"><a href="/groups/1/posts/22/">t</a>${comment('501', 'Fine')}</div></div>`;
    document.getElementById('b')!.click = () => {
      throw new Error('synthetic');
    };
    const out = await LLFB.collectComments([unit(1), unit(2)], clock());
    expect(out.coverage).toMatchObject({ processed: 1, failed: 1, failThrew: 1, retried: 1 });
  });

  it('never reports comment text in the coverage', async () => {
    document.body.innerHTML = `<div role="feed"><div aria-posinset="1">
      <a href="/groups/1/posts/11/">t</a>${comment('601', 'Secret synthetic words')}</div></div>`;
    const out = await LLFB.collectComments([unit(1)], clock());
    expect(JSON.stringify(out.coverage)).not.toContain('Secret');
    expect(Object.values(out.coverage).every((v) => Number.isInteger(v))).toBe(true);
  });
});
