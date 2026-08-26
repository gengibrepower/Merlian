import type { NodeId, ParkingGraph } from "./types.js";

export function slotIds(graph: ParkingGraph): NodeId[] {
  return graph.nodes.filter((node) => node.kind === 'slot').map((node) => node.id);
}

export function entranceIds(graph: ParkingGraph): NodeId[] {
  return graph.nodes.filter((node) => node.kind === 'entrance').map((node) => node.id);
}

