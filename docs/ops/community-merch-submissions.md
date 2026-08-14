# Setting up link submissions (Community + Merch)

Written for Joey — no coding required. This is optional, one-time setup.

## What this is

The Community and Merch pages have a small form at the bottom: a visitor
pastes a link and hits submit. Nothing they submit ever shows up on the site
automatically — you review everything and add it by hand.

**Every submission always shows up as a GitHub issue** the moment it comes
in. That part already works, no setup needed. The two things below are
*extra* places a submission can also land — a spreadsheet you can sort and
filter, and an email straight to your inbox. Skip either one (or both) and
the GitHub issue still captures everything; nothing breaks and visitors
never see an error either way.

## If you already set this up before 2026-08-14

The Apps Script was updated to close a formula-injection hole (a submission
could write a live spreadsheet formula into your sheet). **If you already
completed Part 1 below, you need to redeploy:** open the sheet's
Extensions → Apps Script editor, delete everything, paste in the current
contents of `scripts/apps-script/submissions-doPost.gs` again, then
**Deploy → Manage deployments → edit the existing deployment → New version →
Deploy**. You do not need a new URL or a new secret — this replaces the code
behind the same web app.

## Part 1 — the Google Sheet (optional)

This makes submissions land as rows in your existing sheet
(`Swift App` folder, the sheet with id `1LsG6IviGhQfeEDIJ138w2kp-P06UWOTc5c3glRyEVd4`)
so you can sort/filter/mark things reviewed.

1. Open that sheet. Make sure it has a tab named exactly `Submissions`, with
   a header row containing these columns, in this order:
   `submitted_at, section, url, domain, platform_guess, page_title, status,
   reviewed_by, added_to_site, live_url, duplicate_of, notes,
   submitter_note, source_page, client_hash, flags`
2. Menu bar → **Extensions → Apps Script**. This opens a code editor tied to
   this specific sheet.
3. Delete anything in the editor and paste in the contents of
   `scripts/apps-script/submissions-doPost.gs` from this repo (ask Claude/
   Wyatt to hand you that file's contents, or open it on GitHub and copy it).
4. On the left, click the gear icon (**Project Settings**). Scroll to
   **Script Properties** → **Add script property**.
   - Property: `SUBMISSIONS_SHARED_SECRET`
   - Value: make up a long random password (20+ characters, mash the
     keyboard). Save it somewhere — you'll need it again in Part 3.
5. Top right → **Deploy → New deployment**.
   - Click the gear next to "Select type" → choose **Web app**.
   - "Execute as": **Me**.
   - "Who has access": **Anyone**.
   - Click **Deploy**, approve the permission prompts (it's your own
     script, on your own sheet).
   - Copy the **Web app URL** it gives you. Keep this private — anyone who
     has both this URL and your secret from step 4 can write rows into your
     sheet. You'll paste it in Part 3.

## Part 2 — email (optional)

This sends you an email at `sffan15@gmail.com` for every submission, in
addition to the GitHub issue.

1. Log into [resend.com](https://resend.com) (the same account already used
   for 4T Watches, if you have it — otherwise sign up free).
2. **Domains → Add Domain** → enter `longlivets.com`.
3. Resend shows you 2-3 DNS records to add (they'll look like `TXT` and
   `CNAME` entries). Add those in whatever service manages the
   `longlivets.com` domain's DNS (likely the same place the site itself is
   configured — ask Wyatt if unsure which one).
4. Wait for Resend to show the domain as **Verified** (can take a few
   minutes to a few hours after adding the DNS records).
5. Once verified, you can send email *from* any address `@longlivets.com` —
   e.g. `submissions@longlivets.com`. You don't need that inbox to exist;
   Resend only needs to send *from* it, and replies aren't expected.
6. **API Keys → Create API Key** → copy the key (starts with `re_`). You'll
   paste it in Part 3. You will not be able to see it again after this
   screen — if you lose it, just create a new one.

## Part 3 — tell the website about it

From a terminal, in the repo, with the Vercel CLI set up (see
`docs/deploy.md` if you haven't done this before):

```bash
# Only if you did Part 1 (the sheet):
vercel env add SUBMISSIONS_SHEET_WEBHOOK_URL     # paste the web app URL from Part 1 step 5
vercel env add SUBMISSIONS_SHEET_SECRET          # paste the same secret from Part 1 step 4

# Only if you did Part 2 (email):
vercel env add RESEND_API_KEY                    # paste the re_... key from Part 2 step 6
vercel env add SUBMISSIONS_EMAIL_FROM             # e.g. submissions@longlivets.com

vercel --prod                                     # ship it
```

Choose **Production** (and Preview, if asked) when each `vercel env add`
prompts you for environments.

## What happens if you skip a part

Nothing breaks. Visitors can always submit a link and always get a "thanks"
message. Whatever you haven't set up just doesn't happen for that
submission — e.g. skip Part 1 and nothing gets added to the sheet, but the
GitHub issue is still created and (if you did Part 2) you still get the
email. You can come back and do Parts 1/2 whenever you want; nothing needs
to be done in a particular order or all at once.
