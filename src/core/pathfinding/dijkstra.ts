import type { NodeId, ParkingGraph } from '../types.js';
import type { Path, PathfindingService } from '../ports.js';
import { computeShortestPaths, reconstructPath } from './search.js';
import { shortestPathsFrom } from './shortestPathsFrom.js';

export function dijkstra(graph: ParkingGraph, from: NodeId, to: NodeId): Path | null {
  return reconstructPath(computeShortestPaths(graph, from, to), to);
}

export const dijkstraPathfinding: PathfindingService = {
  shortestPath: dijkstra,
  shortestPathsFrom,
};

