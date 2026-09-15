# Founders brief delivery recovery

`marjorie-brief-delivery-recovery.yml` is a manual, main-only recovery path for
an existing brief whose normal delivery job did not run. It does not assemble or
create a brief and does not count as evidence that the scheduled routine ran.

The operator supplies one issue number. Before exposing the ops delivery secret,
the workflow reads that issue and all comments through GitHub REST and requires:

- an open issue with the `founders-brief` label;
- the exact Los Angeles calendar-date title and self-link header; and
- no Discord or recovery delivery marker in the issue or its comments.

The validated REST body is delivered through the same loop-ask and
`post-or-mail.mjs` path as the routine, under the same delivery concurrency group.
A successful delivery persists either its Discord message ID or an email recovery
marker so a later recovery dispatch refuses to duplicate it.

Both the routine and recovery delivery steps explicitly bind the existing
`vars.MARJORIE_EMAIL` and `secrets.GMAIL_APP_PASSWORD` alongside the ops webhook.
They keep the default mail fallback enabled: only a failed Discord delivery
invokes the existing mailer. Without those step environment bindings, the mailer
skips and delivery ends as `neither`, even when the repository credentials exist.
The bindings stay in the trusted, main-pinned delivery jobs; the agent receives
neither credential. Workflow invariant tests cover both delivery steps without
sending a message or reading credential values.
