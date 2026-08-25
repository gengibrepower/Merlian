# API — wire contract

HTTP/JSON. Versioned in the path (`/v1`); a breaking change bumps to `/v2`. Every
endpoint is `POST` with `Content-Type: application/json`. The engine is stateless:
the full topology travels in each request.

This document is the authored source of the wire contract. The OpenAPI spec
(roadmap) is generated from the same Zod schemas; if they ever disagree, the Zod
schemas win.

## Conventions

### Graph

Every request carries the topology as `{ nodes, edges }`.

**Node.** Common shape:

```json
{ "id": "s1", "role": "candidate", "label": "A-12", "position": { "x": 6, "y": 2 } }
```

- `id` — string, non-empty, unique within the graph.
- `role` — functional, fixed by the engine (see table). This is what the algorithm
  reasons about.
- `label` — optional, cosmetic, from the consumer's domain. Echoed back, never used
  in the computation.
- `position` — `{ x, y }`, required on **every** node (the POI term is Euclidean).
  Both coordinates must be finite numbers.
- `dimensions` — `{ width, length }`, both positive and finite; required on
  `candidate` nodes only, rejected on the others (sending it elsewhere is a `400`).

**Role → kind.** The consumer sends `role`; the mapping layer translates it to the
internal `kind`:

| role        | kind       | meaning                        |
|-------------|------------|--------------------------------|
| `candidate` | `slot`     | a place that can be recommended |
| `attractor` | `poi`      | the destination being scored    |
| `source`    | `entrance` | a starting point for routing    |
| `transit`   | `waypoint` | a pass-through junction         |

**Edge.** Directed and weighted:

```json
{ "from": "w1", "to": "s1", "weight": 2 }
```

A two-way street is two edges. Weight is any non-negative, finite number (distance,
time, cost — the consumer's choice; the engine only minimizes their sum).

### graphVersion

Optional string on any request. A content hash of the topology, used only as a
cache key for the hydrated graph. Never a source of truth — if absent or stale, the
engine just re-parses. Omitting it is always valid.

## Status codes

- **200** — success, **including empty results.** No compatible slot is not an
  error; it is `slot: null` with `200`.
- **400** — malformed request: the shape is wrong. This covers a missing required
  field, a wrong type, `position` without `x`, an **unknown or extra field**
  (every object is strict — it rejects keys it does not declare), and `dimensions`
  on a node whose role is not `candidate`. Caught by schema validation.
- **422** — well-formed but incoherent graph (referential integrity). The shape is
  right, the content is not: a dangling edge endpoint, a `poiId` that names no node,
  a `poiId` that names a node whose role is not `attractor`.

Integrity rules that yield **422**:

- every `from`/`to` in `edges` is an id present in `nodes`;
- node ids are unique;
- `poiId` names a node with role `attractor`;
- `entranceId`, when present, names a node with role `source`;
- every id in `occupancy` is present in `nodes`.

**Error body** (both 400 and 422; the HTTP status distinguishes them):

```json
{
  "error": {
    "type": "invalid_graph",
    "issues": [
      { "path": "poiId", "message": "no node with id 'p9'" }
    ]
  }
}
```

`type` is `malformed_request` for 400 and `invalid_graph` for 422. `issues[]` carries
one entry per problem found; `path` is a dotted/indexed pointer into the request
(e.g. `graph.edges[0].weight`, `occupancy[1]`).

## POST /v1/recommendations

Recommends a single slot. With `entranceId` (check-in) the route to that slot comes
too; without it (standby) only the slot.

**Request:**

```json
{
  "graph": {
    "nodes": [
      { "id": "e1", "role": "source",    "position": { "x": 0,  "y": 0 } },
      { "id": "w1", "role": "transit",   "position": { "x": 5,  "y": 0 } },
      { "id": "p1", "role": "attractor", "label": "Entrance Hall", "position": { "x": 10, "y": 0 } },
      { "id": "s1", "role": "candidate", "label": "A-12", "position": { "x": 6, "y": 2 }, "dimensions": { "width": 2.5, "length": 5 } },
      { "id": "s2", "role": "candidate", "label": "A-13", "position": { "x": 8, "y": 2 }, "dimensions": { "width": 2.5, "length": 5 } }
    ],
    "edges": [
      { "from": "e1", "to": "w1", "weight": 5 },
      { "from": "w1", "to": "s1", "weight": 2 },
      { "from": "w1", "to": "s2", "weight": 3 }
    ]
  },
  "vehicle": { "dimensions": { "width": 1.8, "length": 4.5 } },
  "occupancy": ["s2"],
  "poiId": "p1",
  "entranceId": "e1",
  "radiusFactor": 2,
  "graphVersion": "sha256:abc123"
}
```

- `vehicle.dimensions` — required.
- `occupancy` — required array of unavailable node ids (occupied + reserved). May be
  empty, but the key must be present.
- `poiId` — required; must name an `attractor`.
- `entranceId` — optional; must name a `source`. Presence enables check-in.
- `radiusFactor` — optional, positive; defaults to `2` (the default lives in the
  engine, not the wire).

**Response — check-in (with `entranceId`):** always both keys.

```json
{
  "slot": { "id": "s1", "label": "A-12" },
  "route": { "nodes": ["e1", "w1", "s1"], "totalWeight": 7 }
}
```

`slot` echoes the recommended node's `id` and its `label` (when the consumer sent
one). `route.totalWeight` is the sum of edge weights along `nodes`.

**Response — standby (no `entranceId`):** slot only.

```json
{
  "slot": { "id": "s1", "label": "A-12" }
}
```

**Response — no compatible slot (`200`):** empty, shaped by mode.

```json
{ "slot": null, "route": null }
```

(Standby empty is `{ "slot": null }`.)

## POST /v1/paths

Bare route between two nodes. Any roles — `from`/`to` need only exist.

**Request:**

```json
{
  "graph": { "nodes": [ "… same shape as above …" ], "edges": [ "…" ] },
  "from": "e1",
  "to": "s1",
  "graphVersion": "sha256:abc123"
}
```

**Response — reachable:**

```json
{ "route": { "nodes": ["e1", "w1", "s1"], "totalWeight": 7 } }
```

**Response — unreachable:** not an error.

```json
{ "route": null }
```

## POST /v1/reachability

Which candidates are reachable from each source. Serves both "can I route here from
there" and the consumer's publish-time connectivity check. No target in the request
— it uses every `source` node in the graph. This is a purely topological question:
`occupancy` plays no part and is not accepted.

**Request:** here `s2` has no incoming edge, so it is unreachable from `e1`.

```json
{
  "graph": {
    "nodes": [
      { "id": "e1", "role": "source",    "position": { "x": 0, "y": 0 } },
      { "id": "w1", "role": "transit",   "position": { "x": 5, "y": 0 } },
      { "id": "s1", "role": "candidate", "label": "A-12", "position": { "x": 6, "y": 2 }, "dimensions": { "width": 2.5, "length": 5 } },
      { "id": "s2", "role": "candidate", "label": "A-13", "position": { "x": 8, "y": 2 }, "dimensions": { "width": 2.5, "length": 5 } }
    ],
    "edges": [
      { "from": "e1", "to": "w1", "weight": 5 },
      { "from": "w1", "to": "s1", "weight": 2 }
    ]
  },
  "graphVersion": "sha256:def456"
}
```

**Response:** a per-entrance matrix plus a global summary.

```json
{
  "byEntrance": [
    { "entranceId": "e1", "reachableSlotIds": ["s1"] }
  ],
  "unreachableSlotIds": ["s2"]
}
```

- `byEntrance[i].reachableSlotIds` — candidate ids with a finite path from that
  source.
- `unreachableSlotIds` — candidate ids reachable from **no** source. Empty means the
  layout is fully connected — the publish-time green light.

With no `source` nodes, `byEntrance` is `[]` and every candidate lands in
`unreachableSlotIds`.

