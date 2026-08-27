import { dijkstraPathfinding } from '../pathfinding/dijkstra.js';
import type { NodeId, ParkingGraph, SlotNode } from '../types.js';
import type { Occupancy, Vehicle } from '../model.js';
import type { Path, PathfindingService } from '../ports.js';
import { eligibleSlots } from './eligibility.js';
import { neighborhoodOccupancy } from './neighborhood.js';
import { straightLineDistanceToPoi } from './poiDistance.js';
import { occupancyWeight } from './sizeBias.js';

const DEFAULT_RADIUS_FACTOR = 2;
const DRIVING_WEIGHT = 0.1;

export interface RecommendationInput {
  readonly graph: ParkingGraph;
  readonly vehicle: Vehicle;
  readonly occupancy: Occupancy;
  readonly poiId: NodeId;
  readonly entranceId?: NodeId;
  readonly radiusFactor?: number;
}

export interface Recommendation {
  readonly slot: SlotNode | null;
  readonly route: Path | null;
}

interface ScoredSlot {
  readonly slot: SlotNode;
  readonly poi: number;
  readonly occupancy: number;
  readonly driving: number | null;
}

export function recommend(
  input: RecommendationInput,
  pathfinding: PathfindingService = dijkstraPathfinding,
): Recommendation {
  const radiusFactor = input.radiusFactor ?? DEFAULT_RADIUS_FACTOR;
  const withDriving = input.entranceId !== undefined;
  const drivingPaths =
    input.entranceId === undefined
      ? null
      : pathfinding.shortestPathsFrom(input.graph, input.entranceId);

  const scored: ScoredSlot[] = [];
  for (const slot of eligibleSlots(input.graph, input.vehicle, input.occupancy)) {
    const driving = drivingPaths === null ? null : drivingPaths.distanceTo(slot.id);
    if (withDriving && driving === null) continue;
    scored.push({
      slot,
      poi: straightLineDistanceToPoi(input.graph, slot, input.poiId),
      occupancy: neighborhoodOccupancy(input.graph, slot, input.occupancy, radiusFactor),
      driving,
    });
  }

  if (scored.length === 0) return { slot: null, route: null };

  const poiNorm = normalizer(scored.map((s) => s.poi));
  const occNorm = normalizer(scored.map((s) => s.occupancy));
  const driveNorm = normalizer(scored.map((s) => s.driving ?? 0));
  const occWeight = occupancyWeight(input.vehicle);

  const ranked = scored
    .map((s) => ({
      slot: s.slot,
      occupancy: s.occupancy,
      cost: poiNorm(s.poi) + occWeight * occNorm(s.occupancy) + (withDriving ? DRIVING_WEIGHT * driveNorm(s.driving ?? 0) : 0),
    }))
    .sort((a, b) => a.cost - b.cost || a.occupancy - b.occupancy || (a.slot.id < b.slot.id ? -1 : 1));

  const best = ranked[0];
  if (best === undefined) return { slot: null, route: null };
  const route = drivingPaths === null ? null : drivingPaths.pathTo(best.slot.id);
  return { slot: best.slot, route };
}

function normalizer(values: readonly number[]): (value: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return () => 0;
  return (value) => (value - min) / (max - min);
}

