// The branch-name shape of a Tree draft PR. One definition, shared by the poll/notifier (stamp-health.mjs)
// and the approval gate (tree-approve-gate.mjs).
export const HEAD_REF_RE = /^tree\/draft\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
export const isTreeDraftRef = (ref) => typeof ref === 'string' && HEAD_REF_RE.test(ref) && !ref.includes('..');
