// Read-only GitHub lookups behind the page's "For fans" section. `api(path)`
// is scripts/lib/gh.mjs `ghApi` in production and a fake in tests; each lookup
// fails soft (the caller names it in a warning), never blanks the page.
import { listIssuesByLabels } from './issues-rest.mjs';
import { needsFiles } from './status-fans.mjs';
import { selectShipped } from './status-shipped.mjs';

export const FEEDBACK_LABEL = 'user-feedback';
const DAY_MS = 86_400_000;
const FILE_LOOKUPS = 40;
const BATCH = 8;
const LATEST = 3;

/** Changed paths per merged PR worth asking about (newest first, capped). A failed lookup just leaves that PR out of the map. */
export async function fetchPrFiles(api, repo, mergedPrs, now) {
  const wanted = selectShipped(mergedPrs, now).filter(needsFiles).slice(0, FILE_LOOKUPS);
  const files = new Map();
  for (let i = 0; i < wanted.length; i += BATCH) {
    await Promise.all(wanted.slice(i, i + BATCH).map(async (pr) => {
      try {
        const rows = (await api(`/repos/${repo}/pulls/${pr.number}/files?per_page=100`)) || [];
        if (Array.isArray(rows)) files.set(pr.number, rows.map((r) => String(r.filename || '')).filter(Boolean));
      } catch { /* the title decides for this one */ }
    }));
  }
  return files;
}

/** Feedback tickets filed in the last 7 days: { count, latest: [{ number, title, url }] }. Throws when unreadable. */
export async function fetchFeedback(api, repo, now) {
  const rows = await listIssuesByLabels(api, { repo, labels: [FEEDBACK_LABEL], state: 'all', limit: 100 });
  const recent = rows.filter((r) => now - Date.parse(r.createdAt) <= 7 * DAY_MS && Date.parse(r.createdAt) <= now);
  return {
    count: recent.length,
    numbers: recent.map((r) => r.number),
    latest: recent.slice(0, LATEST).map((r) => ({ number: r.number, title: r.title, url: r.url })),
  };
}
