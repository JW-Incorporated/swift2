import { describe, expect, it } from 'vitest';
import { extractPostsFromHtml, parseFacebookExport } from './facebook-groups-parser';

// SYNTHETIC fixture, illustrative only — no real Facebook export was
// available to verify against (see the module's header comment). Targets
// this parser's own `role="article"` / `aria-label` assumptions.
const SYNTHETIC_EXPORT_HTML = `<html><body>
  <div role="article">
    <a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>
    <div dir="auto">the clowning today is unreal, easter eggs everywhere in the new merch drop</div>
    <span>42 reactions</span>
    <span>7 comments</span>
  </div>
  <div role="article">
    <a href="/profile/2" aria-label="Another Fan">Another Fan</a>
    <div dir="auto">does anyone else think the color palette this era is a clue</div>
    <span>10 likes</span>
    <span>3 comments</span>
  </div>
</body></html>`;

describe('extractPostsFromHtml', () => {
  it('extracts one post per role="article" block with counts and a hashed author', () => {
    const posts = extractPostsFromHtml(SYNTHETIC_EXPORT_HTML);
    expect(posts).toHaveLength(2);
    expect(posts[0]!.text).toContain('clowning today is unreal');
    expect(posts[0]!.reactionCount).toBe(42);
    expect(posts[0]!.commentCount).toBe(7);
    expect(posts[0]!.authorHash).not.toBe('Jane Fan');
    expect(posts[0]!.authorHash).toMatch(/^[0-9a-f]{16}$/);
    expect(posts[1]!.reactionCount).toBe(10); // "likes" phrasing also matches
  });

  it('never throws on malformed/empty input', () => {
    expect(extractPostsFromHtml('')).toEqual([]);
    expect(extractPostsFromHtml('<html><body>no articles here</body></html>')).toEqual([]);
    expect(() => extractPostsFromHtml('<div role="article">unclosed')).not.toThrow();
  });

  // Regression: issue #4885 bug 1 — blocks used to start at the `role="article"`
  // attribute match, so the rest of the enclosing tag survived stripTags().
  it('leaks no markup fragment into the derived text', () => {
    const posts = extractPostsFromHtml(
      '<div aria-posinset="1" role="article" data-posinset="65" class="x1y">' +
        '<a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">the vault door theory is back</div></div>',
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]!.text).toBe('the vault door theory is back');
    expect(posts[0]!.text).not.toMatch(/role=|data-posinset|class=|["<>]/);
  });

  // Regression: issue #4885 bug 2 (privacy) — AUTHOR_RE stripped only the
  // aria-label attribute, leaving the identical name as the anchor's visible
  // text, which became the leading words of the stored excerpt.
  it('removes the author name from the visible anchor text, not just the attribute', () => {
    const posts = extractPostsFromHtml(SYNTHETIC_EXPORT_HTML);
    expect(posts).toHaveLength(2);
    for (const post of posts) {
      expect(post.text).not.toMatch(/Jane Fan|Another Fan/i);
    }
    expect(posts[0]!.text.startsWith('the clowning today is unreal')).toBe(true);
  });

  it('removes repeated copies of the author name elsewhere in the block', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/profile/1" aria-label="Jane Fan">Jane Fan</a>' +
        '<span>Jane Fan shared a link</span>' +
        '<div dir="auto">look at this bracelet</div>' +
        '<span>Reply to Jane Fan</span></div>',
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]!.text).not.toMatch(/Jane Fan/i);
    expect(posts[0]!.text).toContain('look at this bracelet');
  });

  it('still hashes an author whose profile link has no closing tag', () => {
    const posts = extractPostsFromHtml(
      '<div role="article"><a href="/profile/1" aria-label="Jane Fan"><div dir="auto">unclosed anchor post</div>',
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]!.authorHash).toMatch(/^[0-9a-f]{16}$/);
    expect(posts[0]!.text).not.toMatch(/Jane Fan|aria-label/i);
  });

  it('decodes entity-escaped author names before hashing and redacting', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/profile/1" aria-label="Jane &amp; Jo">Jane &amp; Jo</a>' +
        '<div dir="auto">entity names count too</div></div>',
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]!.text).toBe('entity names count too');
  });

  it('does not double-unescape an escaped entity in post text', () => {
    const posts = extractPostsFromHtml(
      '<div role="article"><div dir="auto">she literally wrote &amp;quot; in the caption</div></div>',
    );
    expect(posts[0]!.text).toBe('she literally wrote &quot; in the caption');
  });

  it('removes a mentioned member whose profile link carries no aria-label', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">tagging <a href="/groups/x/user/777/">Priya Raman</a> who called this months ago</div>' +
        '</div>',
    );
    expect(posts).toHaveLength(1);
    expect(posts[0]!.text).not.toMatch(/Jane Fan|Priya Raman/i);
    expect(posts[0]!.text).toContain('who called this months ago');
  });

  it('leaves an ordinary outbound link in the post body alone', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">bought it at <a href="https://www.etsy.com/listing/1">this etsy shop</a></div>' +
        '</div>',
    );
    expect(posts[0]!.text).toContain('this etsy shop');
  });

  // The mention-stripping href match is scoped to Facebook's own profile
  // paths: a third-party URL that merely contains /people/ or /user/ must
  // keep its visible text (over-redaction would silently eat post content).
  it('keeps the text of a third-party link whose path looks profile-shaped', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">read the <a href="https://www.gq.com/people/taylor-swift">profile piece</a> and the ' +
        '<a href="https://forum.example/user/42">forum thread</a></div></div>',
    );
    expect(posts[0]!.text).toContain('profile piece');
    expect(posts[0]!.text).toContain('forum thread');
  });

  it('still strips a facebook.com absolute profile-link mention', () => {
    const posts = extractPostsFromHtml(
      '<div role="article">' +
        '<a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">tagging <a href="https://www.facebook.com/profile.php?id=777">Priya Raman</a> here</div>' +
        '</div>',
    );
    expect(posts[0]!.text).not.toMatch(/Priya Raman/i);
    expect(posts[0]!.text).toContain('tagging');
  });

  it('hashes the post author, not a member they mentioned', () => {
    const withMention = extractPostsFromHtml(
      '<div role="article"><a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">hi <a href="/groups/x/user/777/">Priya Raman</a></div></div>',
    );
    const withoutMention = extractPostsFromHtml(
      '<div role="article"><a href="/groups/x/user/999/" aria-label="Jane Fan">Jane Fan</a>' +
        '<div dir="auto">hi</div></div>',
    );
    expect(withMention[0]!.authorHash).toBe(withoutMention[0]!.authorHash);
  });
});

describe('parseFacebookExport', () => {
  it('produces a fan_signal-shaped draft: platform, community, 7-day window, no sample_urls', () => {
    const draft = parseFacebookExport(SYNTHETIC_EXPORT_HTML, {
      groupSlug: 'taylor-swift-fans',
      exportedAt: new Date('2026-08-23T16:00:00Z'),
    });
    expect(draft.platform).toBe('facebook');
    expect(draft.community).toBe('facebook:taylor-swift-fans');
    expect(draft.sample_urls).toEqual([]);
    expect(draft.volume).toBe(2);
    expect(draft.window_end).toBe('2026-08-23T16:00:00.000Z');
    expect(draft.window_start).toBe('2026-08-16T16:00:00.000Z'); // exactly 7 days
    expect(draft.redline_ok).toBe(true);
    expect(draft).not.toHaveProperty('source_tier'); // real schema has no such column — see header
  });

  it('drops a redline-flagged post from volume/heat/summary entirely', () => {
    const withFlagged = SYNTHETIC_EXPORT_HTML.replace(
      'the clowning today is unreal, easter eggs everywhere in the new merch drop',
      'is she pregnant? someone said they saw a bump',
    );
    const draft = parseFacebookExport(withFlagged, { groupSlug: 'taylor-swift-fans' });
    expect(draft.volume).toBe(1); // only the clean second post survives
    expect(draft.summary).not.toMatch(/pregnant/i);
  });

  it('handles zero postable content without crashing (all screened out or none found)', () => {
    const draft = parseFacebookExport('<html><body>nothing here</body></html>', {
      groupSlug: 'empty-group',
    });
    expect(draft.volume).toBe(0);
    expect(draft.heat).toBe(0);
    expect(draft.summary).toMatch(/no postable content/);
  });
});

// SYNTHETIC: the href shapes mirror the live-DOM selector the export extension
// already uses (scripts/knowledge/fb-extension/comments.js postPermalink); no
// saved real export was available to confirm them (#5013).
describe('post permalink capture', () => {
  const post = (anchor: string) =>
    `<div role="article"><a href="/groups/1/user/9/" aria-label="Jane Fan">Jane Fan</a>${anchor}<div dir="auto">which era has the best bridge</div><span>3 comments</span></div>`;

  it('captures a /posts/ permalink, dropping tracking and comment ids', () => {
    const [p] = extractPostsFromHtml(
      post(
        '<a href="https://www.facebook.com/groups/1/posts/99/?comment_id=5&amp;__cft__[0]=x&amp;__tn__=R">2d</a>',
      ),
    );
    expect(p!.permalink).toBe('https://www.facebook.com/groups/1/posts/99/');
  });

  it('captures root-relative /permalink/ and story_fbid links', () => {
    expect(
      extractPostsFromHtml(post('<a href="/groups/1/permalink/77/?ref=x">1h</a>'))[0]!.permalink,
    ).toBe('https://www.facebook.com/groups/1/permalink/77/');
    expect(
      extractPostsFromHtml(
        post(
          '<a href="https://m.facebook.com/permalink.php?story_fbid=55&amp;id=1&amp;fbclid=z">t</a>',
        ),
      )[0]!.permalink,
    ).toBe('https://m.facebook.com/permalink.php?story_fbid=55&id=1');
  });

  it('is null with no permalink, for profile links, and for off-Facebook hosts', () => {
    expect(extractPostsFromHtml(post(''))[0]!.permalink).toBeNull();
    expect(
      extractPostsFromHtml(post('<a href="https://evil.example/posts/1/">t</a>'))[0]!.permalink,
    ).toBeNull();
  });

  it('keeps the permalink out of the text and still strips the author', () => {
    const [p] = extractPostsFromHtml(post('<a href="/groups/1/posts/99/">2d</a>'));
    expect(p!.text).not.toContain('Jane Fan');
    expect(p!.text).not.toContain('/posts/');
  });
});
