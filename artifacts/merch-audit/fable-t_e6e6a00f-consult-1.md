# Fable ruling — t_e6e6a00f — consult 1

## Question

Can the E3 repair assign valid scored outcomes or valid `unscored` exceptions to the remaining retained products using only the checked-in authoring receipt/cache, after a sandbox guard denied a non-secret environment-presence check for a new vision run?

## Evidence presented

- Fresh detector: 108 records, 100 queued, 0 reused, 8 unscored.
- Existing authoring artifact: 125 detector pairs, 31 judgments; 23 of the 43 retained tierless products map to unresolved outcomes and fresh image verification shows comparable images for many of them.
- Fresh E1 sweep: 108 retained moment products, 2 dead primary URLs, 5 blocked primary URLs, and transient outcomes. Dead URLs are non-purchasable.
- No score may be inferred from image validity, and unresolved authoring results are not valid `unscored` exceptions.

## Ruling

Apply only existing evidence-backed outcomes. Do not manufacture scores, convert unresolved comparisons into `unscored`, or retry the guarded environment check by another invocation. Record the unresolved E3 inventory for a future authoring run. The guard denial requires human-only authorization before establishing whether the secret-bound vision runner can run.

## Resulting scope decision

E1 freshness evidence may proceed independently. E3 completion remains pending the guarded environment check and a subsequent manual, cap-bounded authoring run.
