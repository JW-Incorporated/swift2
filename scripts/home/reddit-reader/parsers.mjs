function isoFromUnix(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? new Date(seconds * 1_000).toISOString() : null;
}

function canonicalPermalink(value) {
  try {
    const url = new URL(value, 'https://www.reddit.com');
    if (!/(^|\.)reddit\.com$/i.test(url.hostname)) return null;
    return `https://www.reddit.com${url.pathname}`;
  } catch {
    return null;
  }
}

function commentRow(child, depth) {
  if (child?.kind !== 't1') return null;
  const data = child.data ?? {};
  if (typeof data.body !== 'string' || ['[deleted]', '[removed]'].includes(data.body)) return null;
  const body = data.body.trim();
  if (!body) return null;
  return {
    author: null,
    body,
    score: data.score != null && Number.isFinite(Number(data.score)) ? Number(data.score) : null,
    depth,
    publishedAt: isoFromUnix(data.created_utc),
  };
}

function firstReplies(child) {
  const replies = child?.data?.replies;
  if (!replies || typeof replies !== 'object') return [];
  return replies.data?.children ?? [];
}

export function parseThreadJson(payload, { now = new Date(), maxComments = 100 } = {}) {
  const postData = payload?.[0]?.data?.children?.[0]?.data;
  if (!postData?.id) throw new Error('Reddit JSON is missing the thread post');
  const createdAt = isoFromUnix(postData.created_utc);
  const comments = [];
  for (const child of payload?.[1]?.data?.children ?? []) {
    const top = commentRow(child, 0);
    if (!top) continue;
    comments.push(top);
    if (comments.length >= maxComments) break;
    for (const reply of firstReplies(child)) {
      const row = commentRow(reply, 1);
      if (row) comments.push(row);
      if (comments.length >= maxComments) break;
    }
    if (comments.length >= maxComments) break;
  }
  const createdMs = Date.parse(createdAt ?? '');
  return {
    post: {
      id: String(postData.id),
      title: typeof postData.title === 'string' ? postData.title : null,
      permalink: canonicalPermalink(postData.permalink),
      subreddit: typeof postData.subreddit === 'string' ? postData.subreddit : null,
      score:
        postData.score != null && Number.isFinite(Number(postData.score))
          ? Number(postData.score)
          : null,
      numComments:
        postData.num_comments != null && Number.isFinite(Number(postData.num_comments))
          ? Number(postData.num_comments)
          : null,
      createdAt,
      ageHours: Number.isFinite(createdMs)
        ? Math.max(0, (now.getTime() - createdMs) / 3_600_000)
        : null,
      locked: postData.locked === true,
      archived: postData.archived === true,
    },
    comments,
  };
}
