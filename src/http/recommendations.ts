import { check, union } from 'zod';
import {
  checkRecommendationsIntegrity,
  invalidGraphBody,
  malformedRequestBody,
  recommendationsRequestSchema,
  type RecommendationsResponseDto,
} from '../contract/index.js';
import { dijkstraPathfinding, recommend, type Path, type RecommendationInput } from '../core/index.js';
import {
  buildLabelIndex,
  toRecommendationInput,
  toRecommendationsResponse,
  type RecommendationResult,
} from '../mapping/index.js';
import type { HttpResult } from './result.js';

export function handleRecommendations(body: unknown): HttpResult<RecommendationsResponseDto> {
  const parsed = recommendationsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: malformedRequestBody(parsed.error)}
  }
  
  const dto = parsed.data;
  const issues = checkRecommendationsIntegrity(dto);
  if (issues.length > 0) {
    return { status: 422, body: invalidGraphBody(issues) };
  }

  const input = toRecommendationInput(dto);
  const labels = buildLabelIndex(dto.graph);
  const slot = recommend(input);

  if (dto.entranceId === undefined) {
    return {
      status: 200,
      body: toRecommendationsResponse({ slot, route: null }, 'standby', labels),
    };
  }

  const route: Path | null =
    slot === null
      ? null
      : dijkstraPathfinding.shortestPathsFrom(input.graph, dto.entranceId).pathTo(slot.id);
  const result: RecommendationResult = 
    route === null ? { slot: null, route: null } : { slot, route };
  return { status: 200, body: toRecommendationsResponse(result, 'checkin', labels) };
}

