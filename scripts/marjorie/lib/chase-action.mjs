const SNOWFLAKE = /^\d{15,21}$/;
const URL = /^https:\/\/discord\.com\/channels\/(?:\d+|@me)\/\d+\/(\d{15,21})$/;
const ACTION = /^(assign|defer|close)(?:\s+(HA\s*#\s*\d+|#\s*\d+))?[.!]?$/i;
const CHASE = /<!-- marjorie-chase: 96h issue=(\d+) -->/;

const labels = (issue) => new Set((issue?.labels || []).map((x) => typeof x === 'string' ? x : x?.name));
const owned = (issue) => labels(issue).has('marjorie-filed');

function records(markdown, open) {
  if (!open) return String(markdown || '').split(/\r?\n/).flatMap((line) => {
    const ha = /^- #(?<ha>\d+) .*?· (?<outcome>done|skip) ·/.exec(line);
    const issue = CHASE.exec(line);
    return ha && issue ? [{ ha: Number(ha.groups.ha), issue: Number(issue[1]), outcome: ha.groups.outcome, open: false }] : [];
  });
  const found = [];
  const blocks = String(markdown || '').split(/(?=^## #\d+\s)/m);
  for (const block of blocks) {
    const ha = /^## #(\d+)\s/m.exec(block);
    const issue = CHASE.exec(block);
    if (ha && issue) found.push({ ha: Number(ha[1]), issue: Number(issue[1]), open: true });
  }
  return found;
}

function refs(text) {
  const value = String(text || '');
  const has = [...value.matchAll(/\bHA\s*#\s*(\d+)\b/gi)].map((m) => Number(m[1]));
  const safe = value.replace(/\bHA\s*#\s*\d+/gi, '');
  const issues = [...safe.matchAll(/(?:^|\s)#\s*(\d+)(?=$|[\s.,;:!?])/g)].map((m) => Number(m[1]));
  return { has: [...new Set(has)], issues: [...new Set(issues)] };
}

function targetRefs(context) {
  const has = new Set();
  const issues = new Set();
  for (const value of [context?.text, context?.replying_to?.text, context?.thread_root?.text]) {
    const found = refs(value);
    for (const number of found.has) has.add(number);
    for (const number of found.issues) issues.add(number);
  }
  return { has: [...has], issues: [...issues] };
}

export function actionMarker({ ha, issue, action, messageId }) {
  return `<!-- marjorie-chase-action: HA=${ha} issue=${issue} action=${action} message=${messageId} -->`;
}

export function renderActionComment({ ha, issue, action, messageId, messageUrl }) {
  if (URL.exec(String(messageUrl || ''))?.[1] !== String(messageId)) throw new Error('action message URL and id must match');
  const sentence = action === 'assign' ? 'Founder assigned this to the next session.'
    : action === 'defer' ? 'Founder deferred this item.' : 'Founder closed this item.';
  return `${sentence} Discord: ${messageUrl}\n\n${actionMarker({ ha, issue, action, messageId })}`;
}

function already(comments, marker) {
  return (comments || []).some((comment) => {
    const author = comment?.author || comment?.user;
    return (author?.type === 'Bot' || author?.__typename === 'Bot')
      && ['app/claude', 'claude[bot]', 'claude'].includes(author.login)
      && String(comment.body || '').trimEnd().split('\n').at(-1) === marker;
  });
}

export function resolveChaseAction({ context, issues, openMd, doneMd, comments = [] }) {
  const match = ACTION.exec(String(context?.text || '').trim());
  const urlId = URL.exec(String(context?.url || ''))?.[1];
  if (context?.bot !== 'marjorie' || context?.already || !match || !SNOWFLAKE.test(String(context?.message_id || '')) || urlId !== String(context.message_id)) {
    return { ok: false, reason: 'untrusted-or-not-an-action' };
  }
  const action = match[1].toLowerCase();
  const open = records(openMd, true);
  const done = records(doneMd, false);
  const wanted = targetRefs(context);
  if (wanted.has.length > 1 || wanted.issues.length > 1) return { ok: false, reason: 'ambiguous' };
  if (wanted.has.length === 1 && wanted.issues.length === 1) {
    const named = [...open, ...done].find((item) => item.ha === wanted.has[0]);
    if (named && named.issue !== wanted.issues[0]) {
      return { ok: false, reason: 'target-mismatch' };
    }
  }
  let candidates = open;
  if (wanted.has.length) candidates = candidates.filter((item) => item.ha === wanted.has[0]);
  if (wanted.issues.length) candidates = candidates.filter((item) => item.issue === wanted.issues[0]);
  if (candidates.length !== 1) {
    const past = done.filter((item) => (!wanted.has.length || item.ha === wanted.has[0]) && (!wanted.issues.length || item.issue === wanted.issues[0]));
    if (past.length === 1) return { ok: true, noop: true, final: past[0].outcome === 'skip', ...past[0], action };
    return { ok: false, reason: 'ambiguous' };
  }
  const target = candidates[0];
  if (wanted.has.length && wanted.issues.length && (target.ha !== wanted.has[0] || target.issue !== wanted.issues[0])) return { ok: false, reason: 'target-mismatch' };
  const issue = (issues || []).find((item) => Number(item.number) === target.issue);
  if (!issue || !owned(issue)) return { ok: false, reason: 'not-marjorie-owned' };
  if (labels(issue).has('deferred')) return { ok: true, noop: true, final: true, ...target, action };
  const marker = actionMarker({ ...target, action, messageId: context.message_id });
  return {
    ok: true, noop: false, ...target, action, issueObject: issue,
    duplicate: already(comments, marker), comment: renderActionComment({ ...target, action, messageId: context.message_id, messageUrl: context.url }),
    label: action === 'assign' ? 'founder-assigned' : action === 'defer' ? 'deferred' : '',
    closeIssue: action === 'close' && String(issue.state).toLowerCase() === 'open',
    haOutcome: action === 'defer' ? 'skip' : 'done',
  };
}
