#!/usr/bin/env node
// One-time, owner-authorized cleanup for exactly two X posts that used site
// screenshots. This script is intentionally non-configurable: changing its
// target set requires a reviewed code change, not an Action input.

import { oauth1Header } from './lib/oauth1.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DELETE_X_SITE_SCREEN_POST_IDS = Object.freeze(['2092348505243160881', '2092276284667691117']);
const X_TWEET_API_ROOT = 'https://api.twitter.com/2/tweets';

function isFixedAllowlist(postIds) {
  return Array.isArray(postIds) && postIds.length === DELETE_X_SITE_SCREEN_POST_IDS.length && postIds.every((id, index) => id === DELETE_X_SITE_SCREEN_POST_IDS[index]);
}

async function responseText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

export async function deleteXSiteScreenPosts({ credentials, fetchImpl = fetch, postIds = DELETE_X_SITE_SCREEN_POST_IDS }) {
  if (!isFixedAllowlist(postIds)) {
    throw new Error('delete-x-site-screens: refusing targets outside the fixed owner-approved allowlist.');
  }

  for (const postId of postIds) {
    const url = `${X_TWEET_API_ROOT}/${postId}`;
    const authorization = oauth1Header({
      method: 'DELETE',
      url,
      consumerKey: credentials.apiKey,
      consumerSecret: credentials.apiKeySecret,
      token: credentials.accessToken,
      tokenSecret: credentials.accessTokenSecret,
    });
    const res = await fetchImpl(url, { method: 'DELETE', headers: { Authorization: authorization } });
    const text = await responseText(res);
    if (res.status === 404) {
      console.log(`delete-x-site-screens: ${postId} was already absent.`);
      continue;
    }
    if (!res.ok) throw new Error(`delete-x-site-screens: X deletion failed for ${postId} (${res.status}): ${text}`);

    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`delete-x-site-screens: X deletion returned non-JSON success for ${postId}.`);
    }
    if (body?.data?.deleted !== true) {
      throw new Error(`delete-x-site-screens: X deletion did not confirm deleted=true for ${postId}.`);
    }
    console.log(`delete-x-site-screens: deleted ${postId}.`);
  }

  return postIds;
}

async function main() {
  const { X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env;
  if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    throw new Error('delete-x-site-screens: X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET are required.');
  }
  await deleteXSiteScreenPosts({
    credentials: {
      apiKey: X_API_KEY,
      apiKeySecret: X_API_KEY_SECRET,
      accessToken: X_ACCESS_TOKEN,
      accessTokenSecret: X_ACCESS_TOKEN_SECRET,
    },
  });
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
