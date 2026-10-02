import { describe, expect, it } from 'vitest';
import { makeSearchDoc, searchDocs } from '../search-index';

describe('search ranking is independent of index order', () => {
  // Same score and same title: only the key can separate them. With a cap of 2,
  // which two survive must not depend on how the index was ordered.
  const docs = ['c', 'a', 'd', 'b'].map((id) =>
    makeSearchDoc('moment', id, 'Same title', 'snippet', null, { kind: 'moment', itemId: id }, []),
  );

  it('ties on score and title break on key, so the cap keeps the same docs', () => {
    const forward = searchDocs(docs, 'same', 2)[0]!.results.map((r) => r.doc.key);
    const reversed = searchDocs([...docs].reverse(), 'same', 2)[0]!.results.map((r) => r.doc.key);
    expect(forward).toEqual(['moment:a', 'moment:b']);
    expect(reversed).toEqual(forward);
  });
});
