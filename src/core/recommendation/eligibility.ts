import type { Dimensions, ParkingGraph, SlotNode } from '../types.js';
import type { Occupancy, Vehicle } from '../model.js';

export function eligibleSlots(
  graph: ParkingGraph,
  vehicle: Vehicle,
  occupancy: Occupancy,
): readonly SlotNode[] {
  return graph.nodes.filter(
    (node): node is SlotNode =>
      node.kind === 'slot' &&
      !occupancy.has(node.id) &&
      accommodates(node.dimensions, vehicle.dimensions),
  );
}

function accommodates(slot: Dimensions, vehicle: Dimensions): boolean {
  return slot.width >= vehicle.width && slot.length >= vehicle.length;
}

