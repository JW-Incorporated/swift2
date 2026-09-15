function sourceKey(line) {
  const submission = String(line).match(
    /^\*\*From a site submission\*\*\s+—\s+#([1-9]\d*)(?:[.,;:]?\s+.*|[.)]?)$/,
  );
  if (submission) return `submission:${submission[1]}`;
  const alert = String(line).match(
    /^\*\*From watchdog alert\*\*\s+—\s+https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/([1-9]\d*)(?:[.,;:]?\s+.*|[.)]?)$/,
  );
  return alert ? `alert:${alert[1].toLowerCase()}/${alert[2].toLowerCase()}#${alert[3]}` : null;
}

export function findExistingBySource(items, sourceContext, checkBody) {
  const needle = sourceKey(sourceContext);
  if (!needle) throw new Error('sourceContext needs a canonical submission number or alert URL');
  return (
    (items || []).find((item) => {
      const labels = (item.labels || []).map((label) => label.name);
      const sameSource = String(item.body || '')
        .split(/\r?\n/)
        .some((line) => sourceKey(line) === needle);
      const ready = labels.includes('marjorie-filed') && checkBody(item.body).ok;
      const banked = labels.includes('marjorie-filed') && labels.includes('founder-decision');
      return sameSource && (ready || banked);
    }) || null
  );
}
