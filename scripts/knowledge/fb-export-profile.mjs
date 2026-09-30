/* global window, document */
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

// Without a pinned id, any i_user counts: the only switch controls this module clicks are
// the ones named for actingPage, so a set i_user after a switch means we are acting as it.
// Live 2026-09-30: no control is named exactly "Long Live" once switched, so a name check
// here would reject a successful switch.
async function identityMatches(page, actingPage) {
  const id = await actingPageId(page);
  if (!id || (actingPage.id && id !== actingPage.id)) return { ok: false, id };
  return { ok: true, id };
}

// A profile switch reloads the whole page; poll the cookie instead of a fixed short settle.
// Bounded by poll count, not the clock, so injected instant sleeps (tests) stay finite.
async function waitForIdentity(page, actingPage, sleep, polls = 20) {
  let identity = { ok: false, id: null };
  for (let i = 0; i < polls; i += 1) {
    identity = await identityMatches(page, actingPage).catch(() => ({ ok: false, id: null }));
    if (identity.ok) return identity;
    await sleep(1_000);
  }
  return identity;
}

// Live 2026-09-30: Facebook ignores a DOM element.click() on the profile switcher; only a
// real (CDP) mouse click switches profile. Find the element in the page, click it from puppeteer.
async function clickVisibleControl(page, pattern) {
  const handle = await page.evaluateHandle(
    (source, flags) => {
      const matcher = new RegExp(source, flags);
      const elements = document.querySelectorAll(
        '[role="button"], [role="menuitem"], [role="link"], a, div[role]',
      );
      return (
        [...elements].find((element) => {
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
        }) ?? null
      );
    },
    pattern.source,
    pattern.flags,
  );
  const element = handle.asElement?.();
  if (!element) {
    await handle.dispose?.();
    return false;
  }
  await element.click();
  await element.dispose?.();
  return true;
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

// Read as Joey's own profile: Facebook keeps the acting Page in the i_user cookie, so
// dropping it (and reloading) returns the session to the personal profile. Verified by
// the cookie being gone afterwards; anything else is 'wrong-profile'.
export async function ensurePersonalProfile(page, options = {}) {
  const log = options.log ?? console.log;
  const before = await actingPageId(page);
  if (options.probe) log(`[profile probe] personal check: i_user set: ${before ? 'yes' : 'no'}`);
  if (!before) return { status: 'ready', actingPageId: null };
  await page.deleteCookie({ name: 'i_user', domain: '.facebook.com' });
  await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const after = await actingPageId(page);
  if (options.probe) log(`[profile probe] after reset: i_user set: ${after ? 'yes' : 'no'}`);
  return after
    ? { status: 'wrong-profile', actingPageId: after }
    : { status: 'ready', actingPageId: null };
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
    identity = await waitForIdentity(page, actingPage, sleep);
    await snapshot('strategy a result');
    if (identity.ok) return { status: 'ready', actingPageId: identity.id };
  }

  await snapshot('strategy b before account menu');
  const escapedName = actingPage.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (await clickVisibleControl(page, /your profile|account controls|^account$/i)) {
    await settle();
    await snapshot('strategy b account menu');
    // Live 2026-09-30: the account menu lists "Switch to Long Live" directly.
    if (await clickVisibleControl(page, new RegExp(`^switch to ${escapedName}$`, 'i'))) {
      await settle();
    } else if (await clickVisibleControl(page, /see all profiles/i)) {
      await settle();
      await snapshot('strategy b profiles');
      if (await clickVisibleControl(page, new RegExp(`^${escapedName}$`, 'i'))) await settle();
    }
  }
  identity = await waitForIdentity(page, actingPage, sleep);
  await snapshot('strategy b result');
  if (identity.ok) return { status: 'ready', actingPageId: identity.id };

  const fallbackUrl = actingPage.id
    ? `https://www.facebook.com/profile.php?id=${actingPage.id}`
    : 'https://www.facebook.com/pages/?category=your_pages';
  await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await snapshot('strategy c page');
  if (await clickPageSwitch(page, actingPage)) await settle();
  identity = await waitForIdentity(page, actingPage, sleep);
  await snapshot('strategy c result');
  return identity.ok
    ? { status: 'ready', actingPageId: identity.id }
    : { status: 'wrong-profile', actingPageId: null };
}
