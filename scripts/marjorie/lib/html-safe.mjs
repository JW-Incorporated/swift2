// One place for keeping untrusted text from forging hidden `<!-- ... -->` markers
// in the status issue body (the page reads its own state back out of those
// markers, and the repo is public). Two tools:
//
//   neutralizeHtmlComments(text)  for text that is RENDERED into the body: every
//       `<` and `>` becomes an entity, so no comment can open or close however
//       the characters are arranged (`<!<!---->--`, `--!>`, ...). Single-character
//       replacement cannot leave a multi-character remnant behind.
//   stripHtmlComments(text)       for text that is PARSED (a plan body): removes
//       whole comments (closed by `-->` or `--!>`) until the string stops
//       changing, then neutralizes any `<!--` left unclosed.
//
// Marker-reading regexes elsewhere accept `--!?>` as the closer for the same reason.

export const neutralizeHtmlComments = (text) => String(text ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function stripHtmlComments(text) {
  let current = String(text ?? '');
  let previous;
  do {
    previous = current;
    current = current.replace(/<!--[\s\S]*?--!?>/g, '');
  } while (current !== previous);
  return current.replace(/<!--/g, '&lt;!--');
}
