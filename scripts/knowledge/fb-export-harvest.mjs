/* global document, window */

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

export function mergeHarvest(state, snapshot) {
  const units = new Map(state.units.map((unit) => [unit.key, unit]));
  let nextSyntheticPosition = state.nextSyntheticPosition;

  for (const capture of snapshot.units) {
    if (capture.textLength <= 300 && !capture.hasAuthor) continue;
    const key = capture.position ? `pos:${capture.position}` : `direct:${capture.identity}`;
    const previous = units.get(key);
    const position = capture.position ?? previous?.position ?? nextSyntheticPosition++;
    const timestamps = [...new Set([...(previous?.timestamps ?? []), ...capture.timestamps])];
    const candidate = {
      key,
      position,
      html: neutralizeArticleRoles(capture.html),
      timestamps,
    };
    if (!previous || candidate.html.length > previous.html.length) units.set(key, candidate);
    else units.set(key, { ...previous, timestamps });
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
  return page.evaluate(() => {
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
      const timestamps = [...timestampRoot.querySelectorAll('abbr, time, a[aria-label]')]
        .filter(
          (element) => !primaryArticle || element.closest('[role="article"]') === primaryArticle,
        )
        .map(
          (element) =>
            element.getAttribute('datetime') ||
            element.getAttribute('title') ||
            element.getAttribute('aria-label') ||
            element.textContent,
        )
        .filter(Boolean);
      const position = Number(unit.getAttribute('aria-posinset')) || null;
      return {
        position,
        identity:
          permalink?.getAttribute('href') ||
          `${author?.getAttribute('aria-label') ?? ''}|${text.slice(0, 160)}`,
        textLength: text.length,
        hasAuthor: Boolean(author),
        html: unit.outerHTML,
        timestamps,
      };
    });
    return { units, maxPosinset };
  });
}
