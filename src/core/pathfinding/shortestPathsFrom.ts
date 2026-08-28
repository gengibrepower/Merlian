import type { NodeId, ParkingGraph } from '../types.js';
import type { Path, ShortestPaths } from '../ports.js';
import { computeShortestPaths, reconstructPath } from './search.js';

export function shortestPathsFrom(graph: ParkingGraph, source: NodeId): ShortestPaths {
  const result = computeShortestPaths(graph, source);
  return {
    distanceTo(target: NodeId): number | null {
      return result.distance.get(target) ?? null;
    },
    pathTo(target: NodeId): Path | null {
      return reconstructPath(result, target);
    },
  };
}

