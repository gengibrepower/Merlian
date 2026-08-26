import {
  checkReachabilityIntegrity,
  invalidGraphBody,
  malformedRequestBody,
  reachabilityRequestSchema,
  type ReachabilityResponseDto,
} from '../contract/index.js';
import { dijkstraPathfinding, entranceIds, slotIds } from '../core/index.js';
import {
  hydrateGraph,
  toReachabilityResponse,
  type EntranceReachability,
} from '../mapping/index.js';
import type { HttpResult } from './result.js';

export function handleReachability(body: unknown): HttpResult<ReachabilityResponseDto> {
  const parsed = reachabilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: malformedRequestBody(parsed.error) };
  }

  const dto = parsed.data;
  const issues = checkReachabilityIntegrity(dto);
  if (issues.length > 0) {
    return { status: 422, body: invalidGraphBody(issues) };
  }

  const graph = hydrateGraph(dto.graph);
  const slots = slotIds(graph);
  const byEntrance: EntranceReachability[] = entranceIds(graph).map((entranceId) => {
    const paths = dijkstraPathfinding.shortestPathsFrom(graph, entranceId);
    return {
      entranceId,
      reachableSlotIds: slots.filter((id) => paths.distanceTo(id) !== null),
    };
  });
  
  return { status: 200, body: toReachabilityResponse(byEntrance, slots) };
}

