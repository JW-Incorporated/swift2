import { BASE, openAOnlyRoute, test } from './helpers';
import { ERA_CONTROL_ROUTES } from './routes-era-controls';
import { createHash } from 'node:crypto';

const route = ERA_CONTROL_ROUTES.find((r) => r.name === 'era-track-guide-bar')!;
const h = (s: string | null | undefined) => createHash('md5').update(s ?? 'null').digest('hex').slice(0, 8);

for (const side of ['a', 'b'] as const) {
  test(`DIAG ${side}`, async ({ page, pages }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone-15');
    const p = side === 'a' ? page : pages.b;
    let ssr = 'n/a';
    if (side === 'a') {
      const html = await (await page.request.get(`${BASE.a}/`)).text();
      const m = /<path d="(M 100 0 L[^"]*)"/.exec(html);
      ssr = `${h(m?.[1])} len=${m?.[1]?.length}`;
    }
    for (let i = 0; i < 3; i++) {
      await openAOnlyRoute(p, route, side);
      const info = await p.evaluate(() => {
        const rail = document.querySelector('[role="slider"][aria-label$="timeline scrubber"]');
        const d = rail?.querySelector('path')?.getAttribute('d') ?? null;
        const clip = document.querySelector('[data-parity-clip]')!.getBoundingClientRect();
        const r = rail?.getBoundingClientRect();
        return {
          now: new Date().toISOString(),
          d,
          dlen: d?.length,
          scrollY: window.scrollY,
          docH: document.documentElement.scrollHeight,
          items: document.querySelectorAll('[data-ll-item]').length,
          clip: [clip.x, clip.y, clip.width, clip.height],
          rail: r ? [r.x, r.y, r.width, r.height] : null,
        };
      });
      console.log(`DIAG ${side} #${i} ssr=${ssr} dom=${h(info.d)} ${JSON.stringify({ ...info, d: undefined })}`);
    }
  });
}
