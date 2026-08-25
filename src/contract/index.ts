export {
  graphSchema,
  nodeSchema,
  edgeSchema,
  dimensionsSchema,
  graphVersionSchema,
} from './graph.js';
export type { GraphDto, NodeDto, EdgeDto } from './graph.js';

export { recommendationsRequestSchema } from './recommendations.js';
export type { RecommendationsRequestDto } from './recommendations.ts';

export { pathsRequestSchema } from './paths.js';
export type { PathsRequestDto } from './paths.js';

export { reachabilityRequestSchema } from './reachability.js';
export type { ReachabilityRequestDto } from './reachability.js';

export {
  checkGraphIntegrity,
  checkRecommendationsIntegrity,
  checkPathsIntegrity,
  checkReachabilityIntegrity,
} from './integrity.js';
export type { Issue } from './integrity.js';

export { malformedRequestBody, invalidGraphBody, formatZodIssues } from './errors.js';
export type { ErrorBody, ErrorType } from './errors.js';

export {
  slotSchema,
  routeSchema,
  recommendationsResponseSchema,
  pathsResponseSchema,
  reachabilityResponseSchema,
} from './responses.js';
export type {
  SlotDto,
  RouteDto,
  RecommendationsResponseDto,
  PathsResponseDto,
  ReachabilityResponseDto,
} from './responses.js';

