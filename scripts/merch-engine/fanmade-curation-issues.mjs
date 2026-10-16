import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { FANMADE_CANDIDATE_LABEL } from './fanmade-sources.mjs';

const execFileAsync = promisify(execFile);

function observed(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^${escaped}:\\s*(.+)$`, 'mi').exec(body ?? '');
  const value = match?.[1]?.trim();
  return value && value !== 'unknown' ? value : null;
}

function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href.replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export function parseCandidateIssue(issue) {
  const body = typeof issue?.body === 'string' ? issue.body : '';
  const url = httpsUrl(observed(body, 'Candidate URL'));
  const sources = body.split(/\r?\n/).flatMap((line) => {
    const match = /^- ([^:]+):\s*(.+)$/.exec(line.trim());
    if (!match) return [];
    return [{ discoveredVia: match[1].trim(), evidenceUrl: httpsUrl(match[2].trim()) }];
  });
  if (!Number.isInteger(issue?.number) || !url) return null;
  const firstSource = sources[0];
  return {
    issueNumber: issue.number,
    issueUrl: httpsUrl(issue.url),
    item: observed(body, 'Title observed'),
    brand: observed(body, 'Observed maker'),
    price: observed(body, 'Observed price'),
    imageUrl: httpsUrl(observed(body, 'Observed image')),
    url,
    provenance: [{
      discoveredVia: firstSource?.discoveredVia || 'fanmade-candidate',
      discoveredAt: issue.createdAt || null,
      sourceUrl: url,
      ...(firstSource?.evidenceUrl && firstSource.evidenceUrl !== url
        ? { discoveryEvidenceUrl: firstSource.evidenceUrl } : {}),
    }],
  };
}

async function defaultRunGh(args) {
  const { stdout } = await execFileAsync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
  return stdout;
}

export async function listOpenCandidateIssues({ runGh = defaultRunGh } = {}) {
  const stdout = await runGh([
    'issue', 'list', '--label', FANMADE_CANDIDATE_LABEL, '--state', 'open',
    '--limit', '100', '--json', 'number,title,body,createdAt,url',
  ]);
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed)) throw new Error('gh returned an invalid issue list');
  return parsed;
}
