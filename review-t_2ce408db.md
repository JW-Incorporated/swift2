# Code Review: OS-020 — packages/experience headless core skeleton

Repo: /workspace/projects/Swift2/.worktrees/t_2ce408db (branch swift2/t_2ce408db vs origin/main)
Diff: 5 files, ~102 lines (package.json, tsconfig.json, src/index.ts for packages/experience; eslint.config.mjs addition; package-lock.json update; unrelated HUMAN-ACTIONS.md cleanup).

## Findings

1. `packages/experience/package.json` and `tsconfig.json` mirror sibling packages
   (`packages/shared`, `packages/core`) exactly: `private: true`, `type: module`,
   `main`/`types` -> `src/index.ts`, `exports["."]` -> `./src/index.ts`,
   `tsconfig` extends `../../tsconfig.base.json` with `include: ["src"]`.
2. Root `workspaces: ["apps/*", "packages/*"]` auto-registers the new package;
   no manual wiring needed. `package-lock.json` correctly adds the
   `@swift2/experience` link entry and lockfile package block
   (dependency on `@swift2/shared: "*"`, consistent with `packages/core`'s pattern).
3. Root vitest `include` already covers `packages/**/*.test.ts`, so
   `packages/experience/**/*.test.ts` is picked up automatically — no config
   change was needed and none was made. Correct per task (no test files yet).
4. ESLint addition: new block scoped to
   `files: ['packages/experience/**/*.{ts,tsx}']`, placed before the
   Node-tooling-scripts block; does not alter rules for any other package.
   - `no-restricted-imports.paths` blocks bare `react-dom`, `next`,
     `react-native`.
   - `no-restricted-imports.patterns` additionally blocks subpath imports
     (`next/*`, `react-dom/*`, `react-native/*`).
   - `no-restricted-globals` blocks `window` and `document`.
   - This correctly satisfies the acceptance criterion: a deliberate
     `import 'next'` inside packages/experience will fail lint (implementer
     confirmed this manually and then removed the scratch file).
5. `src/index.ts` is a clean, well-commented skeleton exporting
   `EXPERIENCE_CORE_VERSION`; no forbidden imports; appropriate for a
   no-real-logic-yet package per the task description.
6. No syntax errors observed in the eslint.config.mjs or JSON additions;
   object/array structure is valid.
7. Minor/non-blocking: `package-lock.json` diff includes a batch of unrelated
   `"dev": true` flag additions on optional deps (sharp/fsevents platform
   binaries), likely incidental to an `npm install` re-lock rather than
   intentional. Harmless, not in scope of concern, does not block approval.
8. `HUMAN-ACTIONS.md` diff removes an already-resolved, unrelated action item
   (OS-004) — unrelated cleanup bundled into the commit but harmless.

## Verdict

VERDICT: APPROVE
The new packages/experience skeleton, its scoped ESLint no-restricted-imports/globals rule, and lockfile/workspace wiring all correctly follow sibling-package conventions with no syntax errors, no scope leakage to other packages, and the rule as written will correctly fail lint on `import 'next'`.
