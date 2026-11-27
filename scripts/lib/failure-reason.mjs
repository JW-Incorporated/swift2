// One short, secret-free sentence explaining why a child process failed.
//
// Extracted from scripts/knowledge/fb-export-run.mjs (#7175) because the
// marjorie auto-defer lane needed the same thing and a second copy of a
// redactor is exactly the duplication CLAUDE.md rule 8 forbids. Behaviour is
// unchanged for the original caller, which re-exports these.

const ERROR_LINE = /^(\w*Error|Error)\b|:\s*Error\b|^error:/i;

// <=200 chars, secrets redacted, so a failed child reports WHY instead of a stack frame.
export function failureReason(error, fallback) {
  const lines = String(error?.stderr ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const last = lines.findLast((line) => ERROR_LINE.test(line)) ?? lines.at(-1);
  return last ? redactReason(last).slice(0, 200) : fallback;
}

export function redactReason(text) {
  return String(text)
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s/@]*:[^\s/@]*@\S+/gi, '[redacted-url]')
    .replace(/\beyJ[\w-]{10,}(?:\.[\w-]+){0,2}/g, '[redacted]')
    .replace(/\b(?:sb_secret_|sk-|ghp_|github_pat_|xox[a-z]-)[\w-]+/gi, '[redacted]')
    .replace(
      /((?:key|token|secret|password|passwd|authorization|bearer)\w*\s*[=:]\s*)\S+/gi,
      '$1[redacted]',
    )
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]');
}

// `failureReason` reads only stderr, which is empty for an error thrown in-process
// (and for a `gh` failure node reports as `Command failed: <argv>\n<stderr>`). This
// prefers stderr and falls back to the redacted message, so neither case reports nothing.
export function failureDetail(error, fallback = 'no error detail available') {
  const raw = typeof error?.message === 'string' ? error.message
    : (typeof error === 'string' || typeof error === 'number') ? String(error) : '';
  const message = raw.trim();
  return failureReason(error, message ? redactReason(message).slice(0, 200) : fallback);
}
