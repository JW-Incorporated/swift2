// Route-wide request body cap (bytes), enforced before JSON parsing on every
// path. 5000 chars of 4-byte UTF-8 is ~20 KB, so real feedback fits. Watch
// signal: any 413 from a real user in the Vercel logs means the cap is too tight.
const MAX_BODY_BYTES = 32 * 1024;

/** Read the body as text, aborting past the cap even when no Content-Length is sent. */
export async function readBodyText(req: Request): Promise<string | null> {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}
