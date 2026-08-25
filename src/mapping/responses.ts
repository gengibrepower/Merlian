import type { NodeId, Path, SlotNode } from "../core/index.js";
import type { RouteDto, SlotDto } from "../contract/index.js";

export function toSlotDto(slot: SlotNode, labels: ReadonlyMap<NodeId, string>): SlotDto {
  const label = labels.get(slot.id);
  return label === undefined ? {id : slot.id } : {id: slot.id, label };
}

export function toRouteDto(path: Path): RouteDto {
  return { nodes: [...path.nodes], totalWeight: path.totalWeight };
}

