# Fable ruling — t_e6e6a00f — consult 2 (binding)

## Question

May the existing manually dispatched GitHub `merch-audit-authoring.yml` workflow run with its exact `RUN_AUTHORED_VISION_AUDIT` confirmation under the recorded $5 authoring cap, and can that cap complete the remaining E3 queue?

## Ruling

Yes. The confirmation string is an intent interlock, not a human-only approval. Joey's existing standing authorization permits agents to dispatch the workflow whenever eligible image pairs exist, while preserving the unchanged model, secret boundary, and $5 per-run reservation cap. The runner is artifact-only and the secret remains GitHub-held.

The authoring runner reserves about $0.0341 per request, so 100 queued pairs fit under a $5 cap in the expected case. If transient retries cause a cap stop, the workflow receipt cache persists completed judgments and the standing authorization permits another dispatch until the existing queue drains. No human input is needed unless the model, cap, or lane policy must change.

## Directive

Dispatch `merch-audit-authoring.yml` on `main` with the exact confirmation string. Apply only resulting artifact outcomes to the bounded content paths; do not manufacture scores or `unscored` exceptions.
