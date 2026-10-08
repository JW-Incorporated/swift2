// The post-run guard of the ask-response routines (Tree and Marjorie): after the
// agent's run, every ask that was in its queue and still has no `Disposition:`
// comment gets one fallback `NEEDS HELP` from the workflow identity, so an ask is
// never silently dropped (runs 36828261914 / 36831500246: #4675 was skipped twice
// with no comment). Deterministic — no LLM, no agent token.
//
// "Answered" means a `Disposition:` line (any word) from a responder identity
// (`claude`) or the workflow's own marker-bearing fallback; a stranger's comment on
// this public repo never counts. Posting is once per ask: the fallback itself counts
// as an answer, so a re-run cannot post a second one. It also counts as `NEEDS HELP`
// to lib/loop-queue.mjs `parseDisposition`, so the ask leaves the responder's queue.
import { gh as ghRun } from '../../lib/gh.mjs';
import { REPO } from './loop-asks.mjs';
import { apiFor } from './issues-rest.mjs';
import { FALLBACK_MARKER, RESPONDER_LOGINS, parseDisposition } from './loop-queue.mjs';

const ANY_DISPOSITION_RE = /^\s*\**Disposition:/im;
const NAMES = { tree: { self: 'Tree', other: 'Marjorie' }, marjorie: { self: 'Marjorie', other: 'Tree' } };
const firstLine = (err) => String(err?.message || err).split('\n')[0].slice(0, 160);

export function fallbackBody(bot) {
  const { self, other } = NAMES[bot];
  return `Disposition: NEEDS HELP — ${self}'s run ended without answering this ask; ${other} will re-raise it.\n\n${FALLBACK_MARKER}`;
}

/** Has a trusted identity already answered (or been given the fallback for) this ask? */
export function isAnswered(comments, bot) {
  if (parseDisposition(comments, bot)) return true;
  return (comments || []).some((c) => RESPONDER_LOGINS.has(c?.user?.login ?? c?.author?.login) && ANY_DISPOSITION_RE.test(String(c.body ?? '')));
}

/** Queue item numbers out of a queue file's parsed JSON; [] for anything malformed. */
export function queueNumbers(queue) {
  return [...new Set((Array.isArray(queue?.items) ? queue.items : []).map((i) => Number(i?.number)).filter((n) => Number.isInteger(n) && n > 0))];
}

/**
 * Posts the fallback on each queued ask with no Disposition. Never throws: an
 * unreadable ask is skipped with a `::warning::` (posting blind could double up).
 * @returns {Promise<{ posted: number[], answered: number[], failed: number[] }>}
 */
export async function postMissingDispositions(bot, numbers, { repo = REPO, gh = ghRun, log = console.log } = {}) {
  if (!NAMES[bot]) throw new Error(`unknown bot: ${bot}`);
  const api = apiFor(gh);
  const out = { posted: [], answered: [], failed: [] };
  for (const number of numbers) {
    try {
      const comments = (await api(`/repos/${repo}/issues/${number}/comments?per_page=100`)) || [];
      if (isAnswered(comments, bot)) {
        out.answered.push(number);
        continue;
      }
      await gh(['issue', 'comment', String(number), '--repo', repo, '--body', fallbackBody(bot)]);
      out.posted.push(number);
      await gh(['issue', 'edit', String(number), '--repo', repo, '--add-label', 'loop:needs-help']).catch((err) => log(`::warning::loop-fallback: #${number} commented but not labelled: ${firstLine(err)}`));
    } catch (err) {
      out.failed.push(number);
      log(`::warning::loop-fallback: #${number}: ${firstLine(err)}`);
    }
  }
  log(`loop-fallback: ${bot} — ${out.answered.length} answered, ${out.posted.length} fallback posted${out.failed.length ? `, ${out.failed.length} failed` : ''}.`);
  return out;
}
