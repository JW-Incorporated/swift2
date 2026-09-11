#!/usr/bin/env python3
"""Unit tests for scripts/watchdog/send-mail.py's From-header behavior
(Tree Overhaul T1, 2026-09-12, spec docs/specs/tree-overhaul/t1-one-charter.md
§Mechanics-6): the shared mailer now takes an optional `fromName` in the
payload so Tree's weekly-plan email can say "From Tree (Long Live social)"
instead of "From Marjorie" — every other caller omits it and is unaffected.

No pytest in this repo's dependency set; matches
scripts/community/inbox.test.py's convention (stdlib `unittest`, zero extra
dependencies, `.test.py` suffix). Mocks `smtplib.SMTP_SSL` (captures the
built message instead of really sending) and `subprocess.run`
(`render_html_body`'s `gh api markdown` call) so this test makes no real
network/SMTP/gh call.

Run: python3 scripts/watchdog/send-mail.test.py
"""
import importlib
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
send_mail = importlib.import_module("send-mail")  # noqa: E402 — hyphenated filename


class FromHeaderTests(unittest.TestCase):
    def _run(self, payload):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(payload, f)
            payload_path = f.name
        self.addCleanup(lambda: Path(payload_path).unlink(missing_ok=True))

        fake_smtp = MagicMock()
        fake_smtp.__enter__ = MagicMock(return_value=fake_smtp)
        fake_smtp.__exit__ = MagicMock(return_value=False)

        with patch("sys.argv", ["send-mail.py", payload_path]), patch.dict(
            "os.environ",
            {"MARJORIE_EMAIL": "marjorie@example.com", "GMAIL_APP_PASSWORD": "abcd efgh ijkl mnop"},
        ), patch("smtplib.SMTP_SSL", return_value=fake_smtp), patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(stdout="<p>body</p>", returncode=0)
            rc = send_mail.main()

        self.assertEqual(rc, 0)
        self.assertEqual(fake_smtp.send_message.call_count, 1)
        msg = fake_smtp.send_message.call_args[0][0]
        # `msg["From"]` re-parses into a structured Address and silently
        # drops an unquoted "(display name)" as an RFC 5322 comment — the
        # exact bytes smtplib actually sends (`.as_string()`) are the real
        # contract; assert against those, not the lossy dict accessor.
        raw_from = re.search(r"^From: (.+)$", msg.as_string(), re.MULTILINE).group(1)
        return raw_from

    def test_no_fromname_in_payload_produces_the_exact_marjorie_header(self):
        raw_from = self._run({"subject": "s", "body": "b", "url": "https://example.com"})
        self.assertEqual(raw_from, "Marjorie (swift2 chief of staff) <marjorie@example.com>")

    def test_fromname_in_payload_overrides_the_display_name(self):
        raw_from = self._run(
            {
                "subject": "s",
                "body": "b",
                "url": "https://example.com",
                "fromName": "Tree (Long Live social)",
            }
        )
        self.assertEqual(raw_from, "Tree (Long Live social) <marjorie@example.com>")


if __name__ == "__main__":
    unittest.main()
