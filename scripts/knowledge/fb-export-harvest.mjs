/* global document, Node, window */
import { relativeAgeMs } from './fb-export-helpers.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function neutralizeArticleRoles(html) {
  return html.replace(/\brole\s*=\s*(["'])article\1/gi, 'data-fb-role="comment-article"');
}

export function firstOwnTimestamp(values, now = new Date()) {
  return values.find((value) => relativeAgeMs(value, now) !== null) ?? null;
}

export function mergeHarvest(state, snapshot) {
  const units = new Map(state.units.map((unit) => [unit.key, unit]));
  let nextSyntheticPosition = state.nextSyntheticPosition;

  for (const capture of snapshot.units) {
    if (capture.textLength <= 300 && !capture.hasAuthor) continue;
    const key = capture.position ? `pos:${capture.position}` : `direct:${capture.identity}`;
    const previous = units.get(key);
    const position = capture.position ?? previous?.position ?? nextSyntheticPosition++;
    const ownTimestamp =
      previous?.ownTimestamp ??
      capture.ownTimestamp ??
      firstOwnTimestamp(capture.timestamps ?? []) ??
      null;
    const candidate = {
      key,
      position,
      html: neutralizeArticleRoles(capture.html),
      ownTimestamp,
      ignoreForAge: previous?.ignoreForAge || capture.ignoreForAge || false,
    };
    if (!previous || candidate.html.length > previous.html.length) units.set(key, candidate);
    else
      units.set(key, {
        ...previous,
        ownTimestamp,
        ignoreForAge: previous.ignoreForAge || capture.ignoreForAge || false,
      });
  }

  return {
    units: [...units.values()],
    nextSyntheticPosition,
    maxPosinset: Math.max(state.maxPosinset, snapshot.maxPosinset),
  };
}

export function buildHarvestedHtml(title, units) {
  const articles = [...units]
    .sort((a, b) => a.position - b.position)
    .map((unit) => `<div role="article" data-posinset="${unit.position}">${unit.html}</div>`)
    .join('\n');
  return `<!doctype html>\n<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>\n${articles}\n</body></html>\n`;
}

export async function expandVisibleUnits(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= window.innerHeight;
    };
    const feed = document.querySelector('[role="feed"]');
    const positioned = [...(feed ?? document).querySelectorAll('[aria-posinset]')];
    const units = positioned.length ? positioned : [...(feed?.children ?? [])];
    let count = 0;
    for (const unit of units.filter(visible)) {
      for (const control of unit.querySelectorAll('button, [role="button"]')) {
        const name = (control.getAttribute('aria-label') || control.textContent || '').trim();
        if (/^See more$/i.test(name)) {
          control.click();
          count += 1;
        }
      }
    }
    return count;
  });
}

export async function captureVisibleUnits(page) {
  const snapshot = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= window.innerHeight;
    };
    const feed = document.querySelector('[role="feed"]');
    const positioned = [...(feed ?? document).querySelectorAll('[aria-posinset]')];
    const maxPosinset = positioned.reduce(
      (max, unit) => Math.max(max, Number(unit.getAttribute('aria-posinset')) || 0),
      0,
    );
    const candidates = positioned.length ? positioned : [...(feed?.children ?? [])];
    const units = candidates.filter(visible).map((unit) => {
      const text = (unit.textContent ?? '').trim();
      const author = unit.querySelector('a[aria-label]');
      const permalink = unit.querySelector(
        'a[href*="/posts/"], a[href*="story_fbid"], a[href*="permalink"]',
      );
      const primaryArticle = unit.matches('[role="article"]')
        ? unit
        : unit.querySelector('[role="article"]');
      const timestampRoot = primaryArticle ?? unit;
      const messageRoot = timestampRoot.querySelector(
        '[data-ad-preview="message"], [data-ad-comet-preview="message"]',
      );
      const timestampValues = [
        ...(permalink ? [permalink] : []),
        ...timestampRoot.querySelectorAll('abbr, time'),
      ]
        .filter(
          (element) =>
            (!primaryArticle || element.closest('[role="article"]') === primaryArticle) &&
            (!messageRoot ||
              Boolean(
                element.compareDocumentPosition(messageRoot) & Node.DOCUMENT_POSITION_FOLLOWING,
              )),
        )
        .flatMap((element) => [
          element.getAttribute('datetime'),
          element.getAttribute('title'),
          element.getAttribute('aria-label'),
          element.textContent,
        ])
        .filter(Boolean);
      const markers = [...unit.querySelectorAll('[aria-label], [role="heading"], strong')].map(
        (element) => element.getAttribute('aria-label') || element.textContent || '',
      );
      const ignoreForAge = markers.some((value) =>
        /^(?:pinned|featured|announcement)(?: post)?$/i.test(value.trim()),
      );
      const position = Number(unit.getAttribute('aria-posinset')) || null;
      return {
        position,
        identity:
          permalink?.getAttribute('href') ||
          `${author?.getAttribute('aria-label') ?? ''}|${text.slice(0, 160)}`,
        textLength: text.length,
        hasAuthor: Boolean(author),
        html: unit.outerHTML,
        timestampValues,
        ignoreForAge,
      };
    });
    return { units, maxPosinset };
  });
  return {
    ...snapshot,
    units: snapshot.units.map(({ timestampValues, ...unit }) => ({
      ...unit,
      ownTimestamp:
        unit.ownTimestamp ?? firstOwnTimestamp(timestampValues ?? unit.timestamps ?? []),
    })),
  };
}
