import type { NodeId, ParkingGraph } from './types.js';

export interface Path {
  readonly nodes: readonly NodeId[];
  readonly totalWeight: number;
}

export interface PathfindingService {
  shortestPath(graph: ParkingGraph, from: NodeId, to: NodeId): Path | null;
}

