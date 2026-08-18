# Algorithm — recommendation and routing

> These parameters were confirmed against the core source (`recommend.ts`,
> `dijkstra.ts`, `poiDistance.ts`, `ports.ts`), except where marked
> `[to verify against <file not yet read>]`.

Merlian solves two problems over a directed weighted graph `{ nodes, edges }`:
**recommend** the best slot (`candidate`) and **route** to it. Occupancy does not
live in the graph — it comes in the request.

## Inputs (`recommend`)

`{ graph, vehicle, occupancy, poiId, entranceId?, radiusFactor? }`

- `poiId` — **required**; always part of the score (distance to the POI).
- `entranceId` — **optional**; its presence enables check-in mode (driving factor
  + discarding unreachable slots). Absence = standby.
- `occupancy` — set of unavailable node ids (occupied + reserved). On the wire, an
  array of ids.
- `radiusFactor` — optional, default `2`.

`recommend` returns a **single** slot (`SlotNode`) or `null` — not a ranked list.

## Modes

- **Check-in** (with `entranceId`): cost = POI + occupancy + driving. Slots with
  no path from the entrance are discarded.
- **Standby** (no `entranceId`): cost = POI + occupancy. No driving, no route.

## Cost (minimized)

For each eligible slot, three components normalized **min-max** across candidates:

```
cost = poiNorm(poi) + occWeight · occNorm(occ) + (checkin ? 0.1 · driveNorm(drive) : 0)
```

- **POI** — Euclidean distance slot→POI (`Math.hypot` over `position`).
  Coefficient `1`. (Requires `position` on every node in the wire.)
- **Occupancy** — neighborhood occupancy; radius = `radiusFactor` × slot length.
  Coefficient `occWeight`.
- **Driving** — `totalWeight` of the entrance→slot path (Dijkstra). Coefficient `0.1`.

Lowest cost = recommended. `occWeight = occupancyWeight(vehicle)`: baseline `1`,
grows for large vehicles — so "1:1:0.1" is the **baseline**, and the occupancy
term scales with vehicle size.
`[formula: 1 + k·max(0, w/W0−1, l/L0−1), with W0=1.85, L0=4.5, k=2 — to verify
against sizeBias.ts]`

## Eligibility

Hard dimension filter: a slot that does not fit the vehicle is never recommended.
Occupied slots are never recommended. `[detail to verify against eligibility.ts]`

## Normalization and tie-breaking

Min-max per component. Tie: cost → neighborhood occupancy → ascending `id`
(deterministic).

## Routing (`dijkstra`)

Dijkstra over directed weighted edges. `Path = { nodes: NodeId[], totalWeight }`.
A two-way street = two edges (the consumer models it; the engine honors it).

## Pending refactor (decided, to implement after the port)

Today check-in runs a **full Dijkstra per eligible slot** — N slots ⇒ N searches
from the same entrance, each rebuilding adjacency and scanning the whole graph
(linear-scan minimum selection, O(V²)). This is wasteful: single-source Dijkstra
already computes the distance from the entrance to **every** node in one pass.

Replace it with a **single** single-source search from the entrance, reading each
slot's distance and reconstructing the chosen slot's route from the same result
(`previous`). This collapses N searches into 1 and yields the check-in route as a
free byproduct.

It becomes a primitive — `shortestPathsFrom(graph, from)` — behind three uses:
the `recommend` driving factor, the check-in route, and `/reachability`
(reachable = single-source from each entrance). The current point-to-point
`shortestPath` becomes a case of it.

Do this **after** the mechanical core port (first get the tests green identically,
proving the port broke nothing; only then the refactor, in its own red-green).
Swapping the linear scan for a binary heap is a separate, later gain — do not mix.
