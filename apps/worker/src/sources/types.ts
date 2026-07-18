// Source adapter contract (proposal §3.1). Source *instances* are DB config
// rows — adding a feed is a data change (INSERT into news_source), never a
// deploy or a code change. Only source *types* need an adapter implemented.

import type { NormalizedNewsItem } from '@swift2/shared/news';

export interface NewsSourceRow {
  id: string;
  name: string;
  sourceType: string;
  config: Record<string, unknown>;
}

export interface SourceAdapter {
  /** Fetch and normalize this source's current items. Title/snippet/link/metadata only. */
  fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]>;
}
