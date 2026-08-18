# Contributing to Merlian

Thanks for your interest. Merlian is a stateless graph-based recommendation and
routing engine; contributions are welcome as long as they respect the
architecture and style below. Every PR goes through **CI** and **maintainer
review** before it lands.

## Running it

Requires Node >= 20.

```bash
npm install
npm test          # run the tests (Vitest)
npm run typecheck # type check (tsc, no emit)
```

For development with reload:

```bash
npm run dev
```

## Contribution flow

1. Fork and create a branch off `main` (`feat/...`, `fix/...`).
2. Write the test **first** (see TDD below).
3. Make sure `npm test` and `npm run typecheck` are green locally.
4. Open the PR and fill in the template. Describe **what** and **why**.
5. CI runs automatically; the maintainer reviews and approves. Small, focused PRs
   are reviewed faster.

## Code style

- **Strict TypeScript, ESM.** Relative imports end in `.js`
  (`moduleResolution: NodeNext`).
- **No comments as a rule.** The code documents itself through names and types.
  The only exception: explaining non-obvious or surprising behavior.
- **TDD.** Red test first, then the implementation that turns it green. Tests are
  co-located (`*.test.ts` next to the code).
- **Pure functions first.** All domain logic is I/O-free.

## Architecture (respect the boundaries)

The engine is hexagonal, with one inbound adapter (HTTP) and no outbound adapter.
The layers and the direction of dependency matter:

```
http/  →  contract/  →  mapping/  →  core/
```

- `core/` is **pure**: it does not import from `http/`, `contract/`, or
  `mapping/`, and touches no I/O. PRs that put I/O in the core are not accepted.
- `contract/` is the published surface (Zod + OpenAPI). All input is **validated
  at the boundary** — never trust what comes off the wire.
- A change that alters the wire contract (`{ nodes, edges }`, request/response
  shape) is **breaking** and requires a new path version (`/v2`), not a silent
  change to `/v1`.
- The node vocabulary is fixed: `role` (functional), `label` (cosmetic, from the
  consumer), `kind` (structural, internal). Do not conflate the three.

## Commits

Prefer Conventional Commit messages (`feat:`, `fix:`, `chore:`, `refactor:`,
`test:`, `docs:`). A PR should tell a clean story; merges are squashed.

## Reporting issues

Open an issue describing the expected behavior, the observed behavior, and a
minimal reproduction. For architecture questions, reference `README.md` and
`docs/algorithm.md`.
