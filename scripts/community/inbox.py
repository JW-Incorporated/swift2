#!/usr/bin/env python3
# community-inbox.yml — Reddit alert/reply email reader (Flow E1/E3,
# docs/proposals/2026-09-06-community-engine-plan.md §2.1/§2.3/§2.6). Mirrors
# marjorie-inbox.yml's IMAP style (same account, same App Password secret,
# same DKIM-verification posture) but reads Reddit's own notification mail
# instead of founder replies to the brief, and instead of posting a GitHub
# comment it upserts an `engagement_lead` row (via
# scripts/community/upsert-lead.mjs — this repo's Postgres access is
# Node-only, see that script's header).
#
# Deterministic, zero LLM (plan §4 cost table). Safety properties, same
# shape as marjorie-inbox.yml:
#   - Only mail whose From carries a DKIM pass is processed. Reddit
#     notification mail: From must be noreply@reddit.com or
#     *@redditmail.com. Founder command replies (`posted <id>` / `skip
#     <id>`): From must be a founder address, same FOUNDERS map as
#     marjorie-inbox.yml.
#   - Everything else is left unread and ignored (spoof resistance).
#   - Idempotent: engagement_lead's own dedupe index
#     (platform, coalesce(thread_id, locator), kind) makes a re-processed
#     Reddit email a safe no-op; a message is marked \Seen only after its
#     leads are all attempted (success or a clean dedupe skip — never left
#     \Seen on a genuine failure, so a transient error gets retried next run).
#   - DRY_RUN=true (workflow_dispatch input, plan P1-1 "Dry-run mode"):
#     reads and classifies mail, logs what WOULD be upserted/updated, but
#     never marks \Seen and passes DRY_RUN through to the Node helpers so
#     no DB row is ever written. Safe to run against the real inbox
#     repeatedly while testing.
import email
import email.policy
import email.utils
import imaplib
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PARSE_SCRIPT = os.path.join(HERE, "parse-reddit-email.mjs")
UPSERT_SCRIPT = os.path.join(HERE, "upsert-lead.mjs")
MARK_STATUS_SCRIPT = os.path.join(HERE, "mark-lead-status.mjs")

# Same founder map as marjorie-inbox.yml (kept in sync there; duplicated
# here rather than shared because the two workflows have no common Python
# module today and this list changes rarely).
FOUNDERS = {
    "sffan15@gmail.com": "Joey",
    "wjduvall@gmail.com": "Wyatt",
}

REDDIT_FROM_RE = re.compile(r"^(noreply@reddit\.com|[\w.+-]+@redditmail\.com)$", re.IGNORECASE)
FOUNDER_COMMAND_RE = re.compile(r"^\s*(posted|skip)\s+([0-9a-f-]{8,36})\s*$", re.IGNORECASE | re.MULTILINE)


def dry_run() -> bool:
    return os.environ.get("DRY_RUN", "false").lower() == "true"


def run_node(script_path, stdin_text=None, args=None):
    """Runs a Node helper, passing DRY_RUN through unchanged. Raises on a
    non-zero exit so a helper failure surfaces as a run failure rather than
    silently skipping a lead."""
    cmd = ["node", script_path, *(args or [])]
    env = dict(os.environ)
    result = subprocess.run(
        cmd,
        input=stdin_text,
        text=True,
        capture_output=True,
        env=env,
        check=True,
    )
    return result.stdout.strip()


def dkim_pass(msg) -> bool:
    auth = " ".join(msg.get_all("Authentication-Results", []) or [])
    return "dkim=pass" in auth


def community_from_link(link):
    match = re.search(r"reddit\.com/r/([\w-]+)/comments/", link)
    return match.group(1) if match else None


def process_reddit_mail(raw_mime, subject):
    parsed_json = run_node(PARSE_SCRIPT, stdin_text=raw_mime)
    parsed = json.loads(parsed_json)
    kind = parsed["kind"]
    links = parsed["links"]
    if not links:
        print(f"no post links found in: {subject}")
        return True  # nothing to do, but not an error — mark \Seen

    ok = True
    for link in links:
        community = community_from_link(link)
        if not community:
            print(f"could not extract subreddit from link: {link}")
            continue
        post_id_match = re.search(r"/comments/([\w]+)", link)
        thread_id = post_id_match.group(1) if post_id_match else None
        lead = {
            "platform": "reddit",
            "community": community,
            "kind": kind,
            "threadId": thread_id,
            "url": link,
            "title": subject,
            "context": None,
        }
        try:
            out = run_node(UPSERT_SCRIPT, stdin_text=json.dumps(lead))
            result = json.loads(out)
            if result.get("dryRun"):
                print(f"[dry-run] would upsert lead: {lead['platform']}/{lead['community']} {lead['kind']} {thread_id}")
            elif result.get("inserted"):
                print(f"inserted lead {result['id']}: r/{community} ({kind})")
            else:
                print(f"lead already exists (dedupe): r/{community} ({kind})")
        except subprocess.CalledProcessError as exc:
            print(f"FAILED to upsert lead for {link}: {exc.stderr}", file=sys.stderr)
            ok = False
    return ok


def process_founder_command(body, from_addr):
    match = FOUNDER_COMMAND_RE.search(body)
    if not match:
        return False, True  # not a command; not handled, no error
    verb, lead_id = match.group(1).lower(), match.group(2)
    who = FOUNDERS[from_addr]
    try:
        out = run_node(MARK_STATUS_SCRIPT, args=[lead_id, verb])
        result = json.loads(out)
        if result.get("dryRun"):
            print(f"[dry-run] would mark lead {lead_id} as '{verb}' (from {who})")
        elif result.get("updated"):
            print(f"{who} marked lead {lead_id} as '{verb}'")
        else:
            print(f"lead {lead_id} not found for '{verb}' command from {who}")
        return True, True
    except subprocess.CalledProcessError as exc:
        print(f"FAILED to apply '{verb}' for lead {lead_id}: {exc.stderr}", file=sys.stderr)
        return True, False


def main():
    mail_user = os.environ.get("MARJORIE_EMAIL", "").strip()
    mail_pass = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "").strip()
    if not mail_user or not mail_pass:
        print("Mail credentials not configured — skipping.")
        return 0

    conn = imaplib.IMAP4_SSL("imap.gmail.com")
    conn.login(mail_user, mail_pass)
    conn.select("INBOX")
    _, data = conn.search(None, "UNSEEN")
    message_nums = data[0].split()
    print(f"{len(message_nums)} unread message(s)")

    processed, skipped, failed = 0, 0, 0
    for num in message_nums:
        _, msg_data = conn.fetch(num, "(BODY.PEEK[])")
        raw_bytes = msg_data[0][1]
        msg = email.message_from_bytes(raw_bytes, policy=email.policy.default)
        from_addr = email.utils.parseaddr(msg.get("From", ""))[1].lower()
        subject = msg.get("Subject", "(no subject)")

        if REDDIT_FROM_RE.match(from_addr) and dkim_pass(msg):
            raw_mime = raw_bytes.decode("utf-8", errors="replace")
            ok = process_reddit_mail(raw_mime, subject)
            if ok:
                processed += 1
                if not dry_run():
                    conn.store(num, "+FLAGS", "\\Seen")
            else:
                failed += 1
            continue

        if from_addr in FOUNDERS and dkim_pass(msg):
            body_part = msg.get_body(preferencelist=("plain",))
            body = body_part.get_content() if body_part else ""
            handled, ok = process_founder_command(body, from_addr)
            if handled:
                if ok:
                    processed += 1
                    if not dry_run():
                        conn.store(num, "+FLAGS", "\\Seen")
                else:
                    failed += 1
                continue

        print(f"ignored (not Reddit mail or verified founder command): {from_addr} — {subject}")
        skipped += 1

    conn.logout()
    print(f"done: {processed} processed, {skipped} ignored, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
