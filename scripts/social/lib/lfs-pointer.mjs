// Git LFS pointer detection. Library photos are LFS objects and CI checkouts
// hold pointer files only (.lfsconfig fetchexclude; docs/decisions.md
// 2026-10-07), so any tool that reads photo bytes must check for a pointer
// first and use the recorded width/height/bytes/sha256 instead.
import { open } from 'node:fs/promises';

const POINTER_PREFIX = 'version https://git-lfs';

/** True when `buffer` starts like a Git LFS pointer file. */
export function isLfsPointerBuffer(buffer) {
  return Buffer.from(buffer.subarray(0, POINTER_PREFIX.length)).toString('utf8') === POINTER_PREFIX;
}

/** True when the file at `filePath` is a Git LFS pointer. Reads only the first bytes; false if unreadable. */
export async function isLfsPointer(filePath) {
  let handle;
  try {
    handle = await open(filePath, 'r');
    const head = Buffer.alloc(POINTER_PREFIX.length);
    const { bytesRead } = await handle.read(head, 0, head.length, 0);
    return isLfsPointerBuffer(head.subarray(0, bytesRead));
  } catch {
    return false;
  } finally {
    await handle?.close();
  }
}

/** `{ oid, size }` parsed from a Git LFS pointer buffer, or `null` when it is not a well-formed pointer. */
export function parseLfsPointer(buffer) {
  if (!isLfsPointerBuffer(buffer) || buffer.length > 1024) return null;
  const text = Buffer.from(buffer).toString('utf8');
  const oid = /^oid sha256:([0-9a-f]{64})$/m.exec(text)?.[1];
  if (!oid) return null;
  const size = Number(/^size (\d+)$/m.exec(text)?.[1]);
  return { oid, size: Number.isFinite(size) ? size : null };
}
