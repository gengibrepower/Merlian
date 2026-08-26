import { unknown } from 'zod';
import {
  checkPathsIntegrity,
  invalidGraphBody,
  malformedRequestBody,
  pathsRequestSchema,
  type PathsResponseDto,
} from '../contract/index.js';
import { dijkstraPathfinding } from '../core/index.js';
import { hydrateGraph, toPathsResponse } from '../mapping/index.js';
import type { HttpResult } from './result.js';

export function handlePaths(body: unknown): HttpResult<PathsResponseDto> {
  const parsed = pathsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: malformedRequestBody(parsed.error) };
  }

  const dto = parsed.data;
  const issues = checkPathsIntegrity(dto);
  if (issues.length > 0) {
    return { status: 422, body: invalidGraphBody(issues) };
  }
  
  const graph = hydrateGraph(dto.graph);
  const route = dijkstraPathfinding.shortestPath(graph, dto.from, dto.to);
  return { status: 200, body: toPathsResponse(route) };
}
