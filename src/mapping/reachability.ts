import type { NodeId } from '../core/index.js';
import type { ReachabilityResponseDto } from '../contract/index.js';

export interface EntranceReachability {
  readonly entranceId: NodeId;
  readonly reachableSlotIds: readonly NodeId[];
}

export function toReachabilityResponse(
  byEntrance: readonly EntranceReachability[],
  allSlotsIds: readonly NodeId[],
): ReachabilityResponseDto {
  const reached = new Set<NodeId>;
  for (const entrance of byEntrance) {
    for (const id of entrance.reachableSlotIds) reached.add(id);
  }
  
  return {
    byEntrance: byEntrance.map((entrance) => ({
      entranceId: entrance.entranceId,
      reachableSlotIds: [...entrance.reachableSlotIds],
    })),
    unreachableSlotIds: allSlotsIds.filter((id) => !reached.has(id)),
  };
}
