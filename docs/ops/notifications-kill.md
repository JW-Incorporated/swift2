# Notifications backlog kill (workflow)

Before push is switched on, list and kill the stale pending backlog so it is
not pushed at go-live. `.github/workflows/notifications-kill.yml` is the
sanctioned way to run `scripts/notifications-kill.mjs` against production.

1. Actions, `notifications-kill`, Run workflow on `main`, `mode: list`. This is
   read-only. The log shows a count and, per event, id, tier, title and
   timestamps. No device tokens or user identifiers are printed.
2. Review the list. To kill everything it shows, run again with `mode: apply`
   and `confirm: KILL-STALE-BACKLOG`. Any other confirm value fails the job
   before anything is touched.

Apply runs `--kill --all-pending --apply`: it sets `killed_at` on every event
with no instant delivery that has not expired. The script has no age filter.
A kill also hides the event from the in-app inbox, and it does not reach
digest rows already queued. Sent pushes cannot be retracted.

The workflow only runs on `main` and needs the `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` repo secrets.
