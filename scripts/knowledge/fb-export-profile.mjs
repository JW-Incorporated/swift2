/* global window */
import { FB_ACTING_PAGE } from './fb-groups-checklist.mjs';

async function actingPageId(page) {
  const cookies = await page.cookies('https://www.facebook.com/');
  return (
    cookies.find(
      (cookie) =>
        cookie.name === 'i_user' &&
        /(^|\.)facebook\.com$/i.test(cookie.domain) &&
        /^\d+$/.test(cookie.value ?? ''),
    )?.value ?? null
  );
}

async function visibleControlNames(page) {
  return page.$$eval(
    '[role="button"], [role="menuitem"], [role="link"], a, div[role]',
    (elements) =>
      elements
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
        })
        .map((element) => (element.getAttribute('aria-label') || element.textContent || '').trim())
        .filter(Boolean),
  );
}

async function identityMatches(page, actingPage) {
  const id = await actingPageId(page);
  if (!id || (actingPage.id && id !== actingPage.id)) return { ok: false, id };
  if (actingPage.id) return { ok: true, id };
  const names = await visibleControlNames(page).catch(() => []);
  const expected = actingPage.name.trim().toLocaleLowerCase();
  return {
    ok: names.some((name) => name.trim().toLocaleLowerCase() === expected),
    id,
  };
}

async function clickVisibleControl(page, pattern) {
  return page.$$eval(
    '[role="button"], [role="menuitem"], [role="link"], a, div[role]',
    (elements, source, flags) => {
      const matcher = new RegExp(source, flags);
      const target = elements.find((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const name = (element.getAttribute('aria-label') || element.textContent || '').trim();
        return (
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          rect.width > 0 &&
          rect.height > 0 &&
          matcher.test(name)
        );
      });
      if (!target) return false;
      target.click();
      return true;
    },
    pattern.source,
    pattern.flags,
  );
}

async function clickPageSwitch(page, actingPage) {
  if (actingPage.id)
    return clickVisibleControl(page, /^switch(?: now)?$|switch (?:in)?to/i);
  return page.$$eval(
    '[role="button"], [role="menuitem"], [role="link"], a, div[role]',
    (elements, pageName) => {
      const target = elements.find((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const name = (element.getAttribute('aria-label') || element.textContent || '').trim();
        if (
          style.visibility === 'hidden' ||
          style.display === 'none' ||
          rect.width === 0 ||
          rect.height === 0 ||
          !/^switch(?: now)?$|switch (?:in)?to/i.test(name)
        )
          return false;
        let ancestor = element.parentElement;
        for (let depth = 0; ancestor && depth < 6; depth += 1, ancestor = ancestor.parentElement) {
          if ((ancestor.textContent || '').toLocaleLowerCase().includes(pageName)) return true;
        }
        return false;
      });
      if (!target) return false;
      target.click();
      return true;
    },
    actingPage.name.toLocaleLowerCase(),
  );
}

async function probeSnapshot(page, label, log) {
  const id = await actingPageId(page);
  const names = await visibleControlNames(page).catch(() => []);
  log(`[profile probe] ${label}: ${page.url()} | i_user set: ${id ? 'yes' : 'no'}`);
  for (const name of names.slice(0, 40)) log(`  - ${name.slice(0, 60)}`);
}

export async function ensureActingAsPage(page, options = {}) {
  const actingPage = options.actingPage ?? FB_ACTING_PAGE;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = options.random ?? Math.random;
  const log = options.log ?? console.log;
  const settle = () => sleep(1_000 + Math.floor(random() * 2_001));
  const snapshot = (label) =>
    options.probe ? probeSnapshot(page, label, log) : Promise.resolve();
  await snapshot('initial');

  let identity = await identityMatches(page, actingPage);
  if (identity.ok) return { status: 'ready', actingPageId: identity.id };

  if (actingPage.url) {
    await page.goto(actingPage.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await snapshot('strategy a page');
    if (await clickVisibleControl(page, /^switch(?: now)?$|switch (?:in)?to/i)) await settle();
    await snapshot('strategy a result');
    identity = await identityMatches(page, actingPage);
    if (identity.ok) return { status: 'ready', actingPageId: identity.id };
  }

  await snapshot('strategy b before account menu');
  if (await clickVisibleControl(page, /your profile|account controls|^account$/i)) {
    await settle();
    await snapshot('strategy b account menu');
    if (await clickVisibleControl(page, /see all profiles/i)) {
      await settle();
      await snapshot('strategy b profiles');
      const pageName = new RegExp(`^${actingPage.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      if (await clickVisibleControl(page, pageName)) await settle();
    }
  }
  await snapshot('strategy b result');
  identity = await identityMatches(page, actingPage);
  if (identity.ok) return { status: 'ready', actingPageId: identity.id };

  const fallbackUrl = actingPage.id
    ? `https://www.facebook.com/profile.php?id=${actingPage.id}`
    : 'https://www.facebook.com/pages/?category=your_pages';
  await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await snapshot('strategy c page');
  if (await clickPageSwitch(page, actingPage)) await settle();
  await snapshot('strategy c result');
  identity = await identityMatches(page, actingPage);
  return identity.ok
    ? { status: 'ready', actingPageId: identity.id }
    : { status: 'wrong-profile', actingPageId: null };
}
