import type { NodeId, Path, RecommendationInput, SlotNode } from '../core/index.js';
import type {
  RecommendationsRequestDto,
  RecommendationsResponseDto,
} from '../contract/index.js';
import { hydrateGraph } from './graph.js';
import { toRouteDto, toSlotDto } from './responses.js';

export interface RecommendationResult {
  readonly slot: SlotNode | null;
  readonly route: Path | null;
}
export function toRecommendationInput(dto: RecommendationsRequestDto): RecommendationInput {
  return {
    graph: hydrateGraph(dto.graph),
    vehicle: {
      dimensions: {
        width: dto.vehicle.dimensions.width,
        length: dto.vehicle.dimensions.length,
      },
    },
    occupancy: new Set<NodeId>(dto.occupancy),
    poiId: dto.poiId,
    ...(dto.entranceId !== undefined ? { entranceId: dto.entranceId } : {}),
    ...(dto.radiusFactor !== undefined ? { radiusFactor: dto.radiusFactor } : {}),
  };
}

export function toRecommendationsResponse(
  result: RecommendationResult,
  mode: 'checkin' | 'standby',
  labels: ReadonlyMap<NodeId, string>,
): RecommendationsResponseDto {
  const slot = result.slot === null ? null : toSlotDto(result.slot, labels);
  if (mode === 'standby') return { slot };
  return { slot, route: result.route === null ? null : toRouteDto(result.route) };
}

