// Shared by the writer and judge prompts: untrusted text may not close or
// reopen the data fences, and a one-line field may not smuggle a new line.

/** Untrusted text may not close or reopen the data fences. */
export function stripFences(text: string): string {
  return text.replace(/<\/?(?:facts|context|citations)>/gi, '');
}

/** Fence-stripped and collapsed onto one line. */
export function oneLineFenced(text: string): string {
  return stripFences(text).replace(/\s+/g, ' ').trim();
}
