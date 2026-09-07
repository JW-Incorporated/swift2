#!/usr/bin/env python3
"""Unit tests for the pure/deterministic pieces of scripts/community/inbox.py
(Community Engine P1-1). Only tests logic inbox.py owns directly — the
MIME classification/link-extraction itself is scripts/lib/reddit-rss.mjs's
`parseRedditEmail`, already covered by scripts/lib/reddit-rss.test.ts
(P0-3, 29 cases); duplicating that here would just re-test someone else's
contract. What's actually inbox.py's own logic and needs its own coverage:
subreddit-from-link extraction, the founder command regex, and DKIM-pass
detection off a raw email.Message.

No pytest in this repo's dependency set (Node/vitest is the only wired
test runner — see vitest.config.ts); stdlib `unittest` needs nothing extra
and matches scripts/watchdog/send-mail.py's zero-extra-dependency posture.

Run: python3 scripts/community/inbox.test.py
"""
import email
import email.policy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from inbox import (  # noqa: E402
    FOUNDER_COMMAND_RE,
    REDDIT_FROM_RE,
    community_from_link,
    dkim_pass,
)


class CommunityFromLinkTests(unittest.TestCase):
    def test_extracts_subreddit_from_a_comments_link(self):
        link = "https://www.reddit.com/r/TaylorSwift/comments/abc123/some_thread/"
        self.assertEqual(community_from_link(link), "TaylorSwift")

    def test_extracts_subreddit_from_a_comment_permalink(self):
        link = "https://www.reddit.com/r/SwiftlyNeutral/comments/abc123/some_thread/def456/"
        self.assertEqual(community_from_link(link), "SwiftlyNeutral")

    def test_returns_none_for_a_non_comments_link(self):
        self.assertIsNone(community_from_link("https://www.reddit.com/r/TaylorSwift/"))


class FounderCommandRegexTests(unittest.TestCase):
    def test_matches_posted_with_a_uuid(self):
        m = FOUNDER_COMMAND_RE.search("posted 11111111-2222-3333-4444-555555555555")
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1).lower(), "posted")
        self.assertEqual(m.group(2), "11111111-2222-3333-4444-555555555555")

    def test_matches_skip_case_insensitively_with_surrounding_whitespace(self):
        m = FOUNDER_COMMAND_RE.search("  SKIP  abc12345-def6-7890-abcd-ef1234567890  ")
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1).lower(), "skip")

    def test_matches_the_command_on_its_own_line_within_a_longer_reply(self):
        body = "Sounds good.\nposted 11111111-2222-3333-4444-555555555555\nThanks!"
        m = FOUNDER_COMMAND_RE.search(body)
        self.assertIsNotNone(m)

    def test_does_not_match_an_unrelated_reply(self):
        self.assertIsNone(FOUNDER_COMMAND_RE.search("Sounds good, thanks!"))


class RedditFromRegexTests(unittest.TestCase):
    def test_matches_the_canonical_noreply_address(self):
        self.assertTrue(REDDIT_FROM_RE.match("noreply@reddit.com"))

    def test_matches_a_redditmail_relay_address(self):
        self.assertTrue(REDDIT_FROM_RE.match("abc123@redditmail.com"))

    def test_rejects_a_spoofed_lookalike_domain(self):
        self.assertFalse(REDDIT_FROM_RE.match("noreply@reddit.com.evil.example"))

    def test_rejects_an_unrelated_address(self):
        self.assertFalse(REDDIT_FROM_RE.match("someone@gmail.com"))


class DkimPassTests(unittest.TestCase):
    def _msg(self, auth_results):
        raw = "\r\n".join(
            [
                "From: noreply@reddit.com",
                "Subject: test",
                *([f"Authentication-Results: {auth_results}"] if auth_results else []),
                "Content-Type: text/plain",
                "",
                "body",
            ]
        )
        return email.message_from_string(raw, policy=email.policy.default)

    def test_true_when_dkim_pass_is_present(self):
        msg = self._msg("mx.google.com; dkim=pass header.i=@reddit.com")
        self.assertTrue(dkim_pass(msg))

    def test_false_when_dkim_fails(self):
        msg = self._msg("mx.google.com; dkim=fail header.i=@reddit.com")
        self.assertFalse(dkim_pass(msg))

    def test_false_when_header_is_missing_entirely(self):
        msg = self._msg(None)
        self.assertFalse(dkim_pass(msg))


if __name__ == "__main__":
    unittest.main()
