import type { NodeId, ParkingGraph } from './types.js';

export interface Path {
  readonly nodes: readonly NodeId[];
  readonly totalWeight: number;
}

export interface ShortestPaths {
  distanceTo(target: NodeId): number | null;
  pathTo(target: NodeId): Path | null;
}

export interface PathfindingService {
  shortestPath(graph: ParkingGraph, from: NodeId, to: NodeId): Path | null;
  shortestPathsFrom(graph: ParkingGraph, source: NodeId): ShortestPaths;
}
