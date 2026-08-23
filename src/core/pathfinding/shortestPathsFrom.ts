import type { NodeId, ParkingGraph } from '../types.js';
import type { Path, ShortestPaths } from '../ports.js';

export function shortestPathsFrom(graph: ParkingGraph, source: NodeId): ShortestPaths {
  const adjacency = new Map<NodeId, readonly { readonly to: NodeId; readonly weight: number }[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);
  for (const edge of graph.edges) {
    const outgoing = adjacency.get(edge.from);
    if (outgoing) adjacency.set(edge.from, [...outgoing, { to: edge.to, weight: edge.weight }]);
  }

  const distance = new Map<NodeId, number>([[source, 0]]);
  const previous = new Map<NodeId, NodeId>();
  const settled = new Set<NodeId>();

  while (true) {
    let current: NodeId | null = null;
    let currentDistance = Infinity;
    for (const [id, dist] of distance) {
      if (!settled.has(id) && dist < currentDistance) {
        current = id;
        currentDistance = dist;
      }
    }
    if (current === null) break;
    settled.add(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const tentative = currentDistance + neighbor.weight;
      if (tentative < (distance.get(neighbor.to) ?? Infinity)) {
        distance.set(neighbor.to, tentative);
        previous.set(neighbor.to, current);
      }
    }
  }

  return {
    distanceTo(target: NodeId): number | null {
      return distance.get(target) ?? null;
    },
    pathTo(target: NodeId): Path | null {
      const totalWeight = distance.get(target);
      if (totalWeight === undefined) return null;
      const nodes: NodeId[] = [];
      let step: NodeId | undefined = target;
      while (step !== undefined) {
        nodes.unshift(step);
        step = previous.get(step);
      }
      return { nodes, totalWeight };
    },
  };
}
