import type { NodeId, ParkingGraph } from '../types.js';
import type { Path } from '../ports.js';
import { MinHeap } from './heap.js';

export interface SearchResult {
  readonly distance: ReadonlyMap<NodeId, number>;
  readonly previous: ReadonlyMap<NodeId, NodeId>;
}

// Single-source Dijkstra over the binary-heap frontier. With stopAt the search
// halts as soon as that target is settled, so the point-to-point case pays only
// for the nodes closer than the target; distance and previous for that target are
// final at that point. The seq tie-break lives in the heap and reproduces the
// discovery-order selection of the earlier linear scan.
export function computeShortestPaths(graph: ParkingGraph, source: NodeId, stopAt?: NodeId): SearchResult {
  const adjacency = new Map<NodeId, { readonly to: NodeId; readonly weight: number }[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);
  for (const edge of graph.edges) adjacency.get(edge.from)?.push({ to: edge.to, weight: edge.weight });

  const distance = new Map<NodeId, number>([[source, 0]]);
  const previous = new Map<NodeId, NodeId>();
  const settled = new Set<NodeId>();

  const seq = new Map<NodeId, number>([[source, 0]]);
  let nextSeq = 1;
  const frontier = new MinHeap();
  frontier.push({ id: source, distance: 0, seq: 0 });

  while (frontier.size > 0) {
    const current = frontier.pop();
    if (current === undefined || settled.has(current.id)) continue;
    if (current.id === stopAt) break;
    settled.add(current.id);

    for (const neighbor of adjacency.get(current.id) ?? []) {
      const tentative = current.distance + neighbor.weight;
      if (tentative < (distance.get(neighbor.to) ?? Infinity)) {
        if (!distance.has(neighbor.to)) seq.set(neighbor.to, nextSeq++);
        distance.set(neighbor.to, tentative);
        previous.set(neighbor.to, current.id);
        frontier.push({ id: neighbor.to, distance: tentative, seq: seq.get(neighbor.to) ?? 0 });
      }
    }
  }

  return { distance, previous };
}

export function reconstructPath(result: SearchResult, target: NodeId): Path | null {
  const totalWeight = result.distance.get(target);
  if (totalWeight === undefined) return null;
  const nodes: NodeId[] = [];
  let step: NodeId | undefined = target;
  while (step !== undefined) {
    nodes.unshift(step);
    step = result.previous.get(step);
  }
  return { nodes, totalWeight };
}

