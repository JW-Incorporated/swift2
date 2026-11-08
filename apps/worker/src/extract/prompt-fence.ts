// Shared by the writer and judge prompts: untrusted text may not close or
// reopen the data fences, and a one-line field may not smuggle a new line.

/** Untrusted text may not close or reopen the data fences. */
export function stripFences(text: string): string {
  let current = text.replace(/[\u200b-\u200f\u2060\ufeff]/g, '');
  for (;;) {
    const next = current.replace(/<\s*\/?\s*(?:facts|context|citations|headline|sources)\s*>/gi, '');
    if (next === current) return current;
    current = next;
  }
}

/** Fence-stripped and collapsed onto one line. */
export function oneLineFenced(text: string): string {
  return stripFences(text).replace(/\s+/g, ' ').trim();
}
