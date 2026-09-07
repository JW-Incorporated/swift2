#!/usr/bin/env python3
"""Community Engine mailer send (P1-6) — sibling of scripts/watchdog/send-mail.py.

Reads a JSON payload from stdin: {"subject": str, "html": str, "text": str}.
Unlike send-mail.py (which always renders its body through `gh api markdown`
from raw issue markdown and mails Joey only), this script sends the ALREADY-
RENDERED HTML mailer.mjs built (drafts + one-click ack/skip links need real
<a>/<pre> markup markdown can't express cleanly) and CCs Wyatt — every
founder-facing Marjorie email goes to both (docs/agents/marjorie.md §
Delivery, Joey 2026-07-11).

Deterministic, zero AI, stdlib smtplib only (same posture as send-mail.py).

Env (same names/account as brief-mailer.yml; skips quietly if either is unset):
  MARJORIE_EMAIL      - repo variable, the sender Gmail address
  GMAIL_APP_PASSWORD  - repo secret, a 16-char App Password on that account
"""
import json
import os
import sys
import smtplib
from email.message import EmailMessage

TO = "sffan15@gmail.com"
CC = "wjduvall@gmail.com"


def main() -> int:
    payload = json.load(sys.stdin)

    sender = os.environ.get("MARJORIE_EMAIL", "").strip()
    pw = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
    if not sender or not pw:
        print(
            "send-community-mail: MARJORIE_EMAIL variable and/or GMAIL_APP_PASSWORD "
            "secret not set - skipping (see docs/agents/marjorie.md - Delivery)."
        )
        return 0

    msg = EmailMessage()
    msg["Subject"] = payload["subject"]
    msg["From"] = f"Marjorie (swift2 chief of staff) <{sender}>"
    msg["To"] = TO
    msg["Cc"] = CC
    msg.set_content(payload["text"])
    msg.add_alternative(payload["html"], subtype="html")

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(sender, pw)
            s.send_message(msg, to_addrs=[TO, CC])
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
