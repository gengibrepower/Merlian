import {
  checkRecommendationsIntegrity,
  invalidGraphBody,
  malformedRequestBody,
  recommendationsRequestSchema,
  type RecommendationsResponseDto,
} from "../contract/index.js";
import { recommend } from "../core/index.js";
import {
  buildLabelIndex,
  toRecommendationInput,
  toRecommendationsResponse,
} from "../mapping/index.js";
import type { HttpResult } from "./result.js";

export function handleRecommendations(
  body: unknown,
): HttpResult<RecommendationsResponseDto> {
  const parsed = recommendationsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: malformedRequestBody(parsed.error) };
  }

  const dto = parsed.data;
  const issues = checkRecommendationsIntegrity(dto);
  if (issues.length > 0) {
    return { status: 422, body: invalidGraphBody(issues) };
  }

  const input = toRecommendationInput(dto);
  const labels = buildLabelIndex(dto.graph);
  const mode = dto.entranceId === undefined ? "standby" : "checkin";
  return {
    status: 200,
    body: toRecommendationsResponse(recommend(input), mode, labels),
  };
}
