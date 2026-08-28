# Algorithm — recommendation and routing

> Parameters below are confirmed against the core source (`recommend.ts`,
> `dijkstra.ts`, `shortestPathsFrom.ts`, `poiDistance.ts`, `sizeBias.ts`,
> `eligibility.ts`, `neighborhood.ts`, `ports.ts`).

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
  Coefficient `1`. Requires `position` on every node in the wire.
- **Occupancy** — neighborhood occupancy; radius = `radiusFactor` × slot length.
  Coefficient `occWeight`.
- **Driving** — `totalWeight` of the entrance→slot path. Coefficient `0.1`.

Lowest cost = recommended. `occWeight = occupancyWeight(vehicle)`: baseline `1`,
growing for large vehicles — so "1:1:0.1" is the **baseline**, and the occupancy
term scales with vehicle size:

```
occWeight = 1 + k · max(0, w/W0 − 1, l/L0 − 1)
```

with baseline `W0 = 1.85`, `L0 = 4.5` and intensity `k = 2`. A vehicle at or below
baseline size gets `occWeight = 1`; a larger one weighs neighborhood occupancy more
heavily (squeezing a big vehicle into a crowded neighborhood is more disruptive).

## Eligibility

Two hard filters — a slot failing either is never recommended:

- **Fit** — `slot.width ≥ vehicle.width && slot.length ≥ vehicle.length`. No
  rotation, no clearance margin.
- **Availability** — a slot whose id is in `occupancy` is excluded.

## Normalization and tie-breaking

Min-max per component. Tie order: cost → neighborhood occupancy → ascending `id`
(deterministic).

## Routing

Dijkstra over directed weighted edges. `Path = { nodes: NodeId[], totalWeight }`.
A two-way street = two edges (the consumer models it; the engine honors it).

### Single-source primitive: `shortestPathsFrom`

Check-in needs the driving distance from the entrance to **every** eligible slot.
Rather than one point-to-point Dijkstra per slot (N slots ⇒ N searches from the
same entrance), `shortestPathsFrom(graph, source)` runs **one** single-source
Dijkstra that settles every reachable node in a single pass, and exposes:

- `distanceTo(target)` — cost source→target, or `null` if unreachable.
- `pathTo(target)` — the route `{ nodes, totalWeight }`, or `null`.

`recommend` runs **one** `shortestPathsFrom` from the entrance, reads `distanceTo`
per eligible slot for scoring, and — once a slot is chosen — reads `pathTo(slot.id)`
off that same pass. It returns a `Recommendation` `{ slot, route }`: the check-in
route is the intended free byproduct of the search the scoring already needed, so the
HTTP layer runs no pathfinding of its own. Only the finished `Path` is surfaced, not
the `ShortestPaths` handle, so the search internals (`previous`, the binary-heap frontier)
stay private. In standby (no entrance) there is no search and `route` is `null`. The
same primitive backs all three endpoints: recommendation (distance + route), paths
(route), reachability (reachable = finite distance from each source).

The point-to-point `shortestPath(from, to)` stays on the `PathfindingService` port
for the bare `/paths` case; both live on `dijkstraPathfinding` and share one private
core — point-to-point passes its target so the search stops once that node settles,
then reads the route off the same `previous` map the full pass would have built.

### Frontier: binary heap

Both the single-source pass and the point-to-point search take the next node from
a binary min-heap, so a run is O(E log V) instead of O(V²). The heap is a core
internal, never exposed on the `ShortestPaths` handle. Shortest distances are
unique, so the heap changes nothing there; among equal-cost routes it returns the
same one the linear scan did, because ties in tentative distance break by discovery
order — the node whose finite distance was recorded first is settled first. That
path tie-break is deterministic but follows insertion order, not `id`; it is
distinct from the scoring tie-break above, and switching it to ascending `id` would
be a separate, behavior-changing step.

## Future / not in v1

Ideas discussed and **deliberately deferred**. Each is a core change with its own
red-green, to land after the v1 boundary is up. None is a breaking wire change: an
optional field added later is additive, so v1 reserves nothing for them now.

- **Aisle width (the "T" rule).** Parking perpendicular to an aisle needs turning
  room that grows with vehicle length; a too-narrow aisle makes the maneuver
  impossible. It would act in **both** places, mirroring how vehicle size already
  works: a **hard filter** in eligibility (aisle below the minimum for this vehicle
  ⇒ slot ineligible) *and* a **weight** in the score (tighter aisle ⇒ worse, so a
  large vehicle prefers slots with more maneuvering room). Open modelling question,
  to settle at implementation time: where the width lives. Natural candidate is an
  **edge** attribute (`width` on the aisle segment),
  since the aisle *is* the edge — caveat:
  a two-way street is two edges over
  one physical aisle, so both carry the
  same width (consistent by construction; widths are **not** summed across
  directions). Whether every edge needs a width (vehicle trafficability along any
  segment) or only the slot's access edge (the parking maneuver) is unresolved and
  decides the schema shape.
- **Reserved / accessible slots.** Slots restricted or preferred for a driver
  profile (accessible, elderly). This is **not** a `label`: label is cosmetic and
  never enters the computation, so anything that affects the result is functional
  by definition. It is a **functional attribute on the `candidate`** — a new axis
  orthogonal to role
  (role says the node *is* a candidate slot; this says *what kind*
  of slot it is) — plus a driver profile on the request and eligibility logic (an


