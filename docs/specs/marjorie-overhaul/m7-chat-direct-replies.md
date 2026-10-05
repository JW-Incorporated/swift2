# M7 chat replies: channel-level defaults

## Behavior

Routine replies to ordinary founder messages stay concise: 2–4 short sentences
and at most 80 whitespace-separated words. The save step enforces the word
limit; sentence count remains prompt guidance. A founder request for detail (`--detail requested`), or
action-critical steps and evidence (`--detail essential`), may produce a longer
single reply within the existing 1,800-character cap. No other detail reason is
accepted.

Replies preserve the place the founder chose. A top-level message receives one
webhook reply at channel level. A message already in a Discord thread receives
one reply in that existing thread. The routine never creates a new thread and
does not remove existing threads.

## Acceptance criteria

- A top-level context job makes no thread-create request and outputs an empty
  reply thread id.
- A message in an existing thread keeps that thread id through delivery.
- Channel-level replies retain the message URL correlation line, so finish and
  poll reconciliation mark the correct message once.
- Both Marjorie and Tree prompts apply the concise default and allow requested
  or essential detail.

## Files

`scripts/marjorie/chat-post.mjs`, its focused test, both chat workflows, both
chat prompts, the M5 spec, and the Marjorie/Tree agent contracts.
