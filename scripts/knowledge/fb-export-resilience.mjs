import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const GUARDED_PATHS = ['scripts/knowledge', 'scripts/community'];

// One retry: a transient upload failure should not leave a kept file for a manual re-run.
export async function uploadWithRetry(upload, filePath) {
  const first = await upload(filePath);
  if (first.ok) return first;
  const second = await upload(filePath);
  return second.ok ? second : { ...second, attempts: 2 };
}

// A GitHub failure (gh missing from PATH, auth, network) is a warning: the run's result and
// summary must always survive it.
export async function reportToIssue({ weekLabel, summary, failed, findIssue, reportIssue }) {
  const warnings = [];
  let issue = null;
  try {
    issue = await findIssue(weekLabel);
  } catch (error) {
    warnings.push(`GitHub issue lookup failed: ${errorLine(error)}`);
    return { issue, warnings };
  }
  try {
    await reportIssue(issue, summary, { close: !failed });
  } catch (error) {
    warnings.push(`GitHub issue report failed: ${errorLine(error)}`);
  }
  return { issue, warnings };
}

function errorLine(error) {
  return String(error?.message ?? error)
    .split('\n')[0]
    .slice(0, 200);
}

export async function gitProbe(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd, windowsHide: true });
  return stdout;
}

// The unattended run executes whatever checkout it launches from, so refuse unless that checkout
// is on main and has no uncommitted changes in the export code (issue #4870).
export async function checkCheckout(probe = gitProbe, cwd = process.cwd()) {
  try {
    const branch = (await probe(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)).trim();
    if (branch !== 'main') return { ok: false, reason: `checkout is on '${branch}', not 'main'` };
    const dirty = (await probe(['status', '--porcelain', '--', ...GUARDED_PATHS], cwd)).trim();
    if (dirty) {
      const files = dirty.split('\n').length;
      return {
        ok: false,
        reason: `${files} uncommitted change(s) under ${GUARDED_PATHS.join(', ')}`,
      };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: `git check failed: ${errorLine(error)}` };
  }
}

export function refusalSummary(reason) {
  return `Facebook export refused to run: ${reason}. The weekly run must execute reviewed main code: put the shared checkout back on a clean main and re-run.`;
}
