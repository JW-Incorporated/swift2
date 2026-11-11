import { watchCandidate } from '../fingerprint.mjs';

const VIDEO = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([\w-]{6,})/i;

export function mapIssue(issue) {
  const appearance = /^intake:\s*youtube appearance\b/i.test(issue.title ?? '');
  const videoId = appearance ? VIDEO.exec(issue.body ?? '')?.[1] : null;
  return watchCandidate({
    itemKey: videoId ? `yt:${videoId}` : `issue:${issue.number}`,
    cursorKey: String(issue.number).padStart(20, '0'),
    source: videoId ? 'youtube' : 'intake',
    sourceRef: issue.number,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : issue.url,
    title: issue.title,
    excerpt: issue.body,
    detectedAt: issue.createdAt ?? issue.created_at,
  });
}

export function mapIssues(rows = []) {
  return rows.map(mapIssue);
}
