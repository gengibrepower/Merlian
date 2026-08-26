# Merlian

Stateless engine for placement recommendation and routing over directed weighted
graphs. It receives the full topology per request, computes, and returns. No
state, no database, domain-agnostic.

AMPS (a parking-slot recommender) is the **example consumer**. The same engine
fits any "pick the best node in a graph and route to it" problem — heavy-machinery
yards, loading docks, etc.

## Philosophy

- **Stateless.** The topology comes in the request; the engine has no database.
- **Domain-agnostic.** It reasons about *functional roles*, not domain names
  (see role/label/kind).
- **Pure core.** The logic is I/O-free; the HTTP edge is a thin shell.
- **Contract as boundary.** `{ nodes, edges }` is published and versioned (OpenAPI).

## Node vocabulary: role / label / kind

Three deliberately distinct concepts — the name clash is a trap:

- **`role`** — external, functional, **fixed by the engine**: `candidate`,
  `attractor`, `source`, `transit`. This is what the algorithm understands.
- **`label`** — external, cosmetic, from the consumer's domain (optional):
  "Slot", "Bay", "LoadingDock". Echoed back in responses; the engine does **not**
  use it in the computation.
- **`kind`** — internal, structural to the core: `slot`, `poi`, `entrance`,
  `waypoint`. The mapping layer translates `role → kind` on the way in.

The consumer sends `role` (+ optional `label`); the engine maps to `kind` internally.

## Endpoints (overview)

Versioned in the path (`/v1`). Breaking change ⇒ `/v2`.

- `POST /v1/recommendations` — recommends the slot. Check-in (with an entrance)
  returns the route too; standby (no entrance) returns only the slot.
- `POST /v1/paths` — bare route between two nodes.
- `POST /v1/reachability` — slots reachable from each entrance; validates layout
  connectivity (serves the consumer's publish-time rule).

`graphVersion` is optional on the wire: a content hash of the topology used as a
cache key for the hydrated graph. An optimization, **never** a source of truth —
if absent or wrong, the engine simply re-parses.

A [Prism](https://github.com/stoplightio/prism) mock served from the OpenAPI spec
(`npm run mock`) lets consumers build against these endpoints before a real engine
is deployed. See [docs/api.md](docs/api.md#mock-server).

## What the engine does **not** do

No map authoring or editing. No rendering. No persistence. No auth or
multi-tenancy. No history or reporting — that is the consumer's job.

## Stack

TypeScript (strict, ESM, NodeNext) · Express (thin shell) · Zod (contract) ·
Vitest (tests). Pure core with no I/O dependency.

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Every PR goes through CI and maintainer review.

## Roadmap

- Possible Rust rewrite of the core — transparent to consumers, since the
  contract travels as language-agnostic HTTP/JSON. Nothing to build for that now.
