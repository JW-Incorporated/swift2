#!/usr/bin/env python3
"""Shared mail-send used by brief-mailer.yml and watchdog.yml.

Extracted from brief-mailer.yml (2026-07-23) so watchdog-alert issues can
use the exact same proven delivery path as the Founders' Brief, instead of
relying on GitHub @mentions of bot identities, which do not reach the
founders' real inboxes (see docs/agents/marjorie.md - Delivery).

Deterministic, zero AI, zero extra dependencies (stdlib smtplib only,
matching the sender identity and setup this repo already has working).

Usage: python3 send-mail.py <payload.json>
  payload.json: {"subject": str, "body": str (markdown), "url": str}

Env (same as brief-mailer.yml; skips quietly if either is unset):
  MARJORIE_EMAIL      - repo variable, the sender Gmail address
  GMAIL_APP_PASSWORD  - repo secret, a 16-char App Password on that account

Recipients are fixed (Joey to, Wyatt cc) to match brief-mailer.yml's
existing "From Marjorie, To Joey, CC Wyatt" arrangement (Joey's calls,
2026-07-11) - not parameterized, since every current caller wants the same
two addresses.
"""
import json
import os
import sys
import smtplib
from email.message import EmailMessage

TO = "sffan15@gmail.com"
CC = "wjduvall@gmail.com"


def render_html_body(body_md: str, repo: str) -> str:
    # Same renderer brief-mailer.yml already uses: GitHub's own GFM->HTML API,
    # so tables/task-lists/links render identically to the issue page, with
    # zero extra dependencies. Emoji checkboxes instead of <input>: Gmail
    # strips form elements.
    import subprocess

    checkbox_md = body_md
    # Match brief-mailer.yml's sed passes for GFM task-list checkboxes.
    import re

    checkbox_md = re.sub(r"^(\s*)- \[ \]", r"\1- ☐", checkbox_md, flags=re.MULTILINE)
    checkbox_md = re.sub(r"^(\s*)- \[[xX]\]", r"\1- ☑", checkbox_md, flags=re.MULTILINE)
    result = subprocess.run(
        ["gh", "api", "markdown", "-X", "POST", "-f", "mode=gfm", "-f", f"context={repo}", "-F", "text=@-"],
        input=checkbox_md,
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: send-mail.py <payload.json>", file=sys.stderr)
        return 2

    with open(sys.argv[1], encoding="utf-8") as f:
        payload = json.load(f)

    sender = os.environ.get("MARJORIE_EMAIL", "").strip()
    pw = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
    if not sender or not pw:
        print(
            "MARJORIE_EMAIL variable and/or GMAIL_APP_PASSWORD secret not set - "
            "skipping (see docs/agents/marjorie.md - Delivery; setup: issue #484)."
        )
        return 0

    repo = os.environ.get("GITHUB_REPOSITORY", "")
    body_html = render_html_body(payload["body"], repo)

    msg = EmailMessage()
    msg["Subject"] = payload["subject"]
    msg["From"] = f"Marjorie (swift2 chief of staff) <{sender}>"
    msg["To"] = TO
    msg["Cc"] = CC
    msg.set_content(
        f"{payload['body']}\n\n---\nOpen here: {payload['url']}\n"
        "(Sent by the shared watchdog/brief mailer - deterministic, no AI involved.)"
    )
    msg.add_alternative(
        f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body {{ font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
         font-size: 15px; line-height: 1.5; color: #1f2328; margin: 0; padding: 12px; }}
  .wrap {{ max-width: 720px; margin: 0 auto; }}
  h1, h2 {{ font-size: 18px; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; }}
  h3 {{ font-size: 16px; }}
  table {{ border-collapse: collapse; width: 100%; margin: 8px 0; }}
  th, td {{ border: 1px solid #d0d7de; padding: 5px 9px; text-align: left;
           vertical-align: top; font-size: 14px; }}
  th {{ background: #f6f8fa; }}
  code {{ background: #f6f8fa; padding: 1px 4px; border-radius: 4px; font-size: 13px; }}
  a {{ color: #0969da; }}
  .footer {{ color: #57606a; font-size: 13px; margin-top: 16px;
            border-top: 1px solid #d0d7de; padding-top: 8px; }}
</style></head><body><div class="wrap">
{body_html}
<p class="footer"><a href="{payload['url']}">Open on GitHub</a><br>
Sent by the shared watchdog/brief mailer - deterministic, no AI involved.</p>
</div></body></html>""",
        subtype="html",
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(sender, pw)
            s.send_message(msg)
    except smtplib.SMTPAuthenticationError as e:
        print(
            f"Gmail auth failed for {sender} (535 BadCredentials). Re-check, in order:\n"
            "  1. GMAIL_APP_PASSWORD is a 16-char App Password (NOT the account\n"
            "     login password), stored WITHOUT spaces.\n"
            f"  2. 2-Step Verification is ON for {sender} (App Passwords require it).\n"
            "  3. MARJORIE_EMAIL is the SAME account the App Password was generated on.\n"
            f"Gmail said: {e}",
            file=sys.stderr,
        )
        return 1

    print(f"Mailed [{payload['subject']}] To {TO}, Cc {CC}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
