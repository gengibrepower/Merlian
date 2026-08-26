import { string, z } from 'zod';
import { dimensionsSchema, edgeSchema, graphSchema, nodeSchema } from '../contract/graph.js';
import { recommendationsRequestSchema } from '../contract/recommendations.js';
import { pathsRequestSchema } from '../contract/paths.js';
import { reachabilityRequestSchema } from '../contract/reachability.js';
import {
  pathsResponseSchema,
  reachabilityResponseSchema,
  recommendationsResponseSchema,
  routeSchema,
  slotSchema,
} from '../contract/responses.js';
import { issueSchema } from '../contract/integrity.js';
import { errorBodySchema } from '../contract/errors.js';
import { required } from 'zod/mini';
import { json } from 'express';
import { title } from 'process';

const components: ReadonlyArray<{id: string, schema: z._ZodType }> = [
  { id: 'Dimensions', schema: dimensionsSchema },
  { id: 'Node', schema: nodeSchema },
  { id: 'Edge', schema: edgeSchema },
  { id: 'Graph', schema: graphSchema },
  { id: 'RecommendationsRequest', schema: recommendationsRequestSchema },
  { id: 'PathsRequest', schema: pathsRequestSchema },
  { id: 'ReachabilityRequest', schema: reachabilityRequestSchema },
  { id: 'Slot', schema: slotSchema },
  { id: 'Route', schema: routeSchema },
  { id: 'RecommendationsResponse', schema: recommendationsResponseSchema },
  { id: 'PathsResponse', schema: pathsResponseSchema },
  { id: 'ReachabilityResponse', schema: reachabilityResponseSchema },
  { id: 'Issue', schema: issueSchema },
  { id: 'ErrorBody', schema: errorBodySchema },
];

function componentSchemas(): Record<string, Record<string, unknown>> {
  const registry = z.registry<{ id: string }>();
  for (const { id, schema } of components) registry.add(schema, { id });
  const { schemas } = z.toJSONSchema(registry, {
    target: 'openapi-3.0',
    uri: (id) => `#/components/schemas/${id}`,
  }) as { schemas: Record<string, Record<string, unknown>> };
  for (const schema of  Object.values(schemas)) delete schema['$id'];
  return schemas;
}

const ref = (id: string) => ({ $ref:`#/components/schemas/${id}` });

const jsonBody = (id: string) => ({
  required: true,
  constent: { 'application/json': { schema: ref(id) } },
});

const jsonResponse = (id: string, description: string) => ({
  description,
  constent: { 'application/json': { schema: ref(id) } },
});

const errorResponses = {
  '400': jsonResponse('ErrorBody', 'Malformed request body'),
  '422': jsonResponse('ErrorBody', 'Graph fails referential integrity'),
};

export function buildOpenApiDocument(version: string): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Merlian API',
      version,
      description:
        'Stateless placement recommendation and routing engine over directed weighted graphs.',
      license: { name: 'MIT' },
    },
    paths: {
      '/v1/recommendations': {
        post: {
          operationId: 'recommend',
          summary: 'Recommend a slot for a POI, optionally with a check-in route',
          requestBody: jsonBody('RecommendationsRequest'),
          responses: {
            '200': jsonResponse(
              'RecommendationsResponse',
              'Recommended slot, plus a route in check-in mode',
            ),
            ...errorResponses,
          },
        },
      },
      '/v1/paths': {
        post: {
          operationId: 'shortestPath',
          summary: 'shortest path between two nodes',
          requestBody: jsonBody('PathsRequest'),
          responses: {
            '200': jsonResponse(
              'PathsResponse',
              'Shortest route, or null when unreachable',
            ),
            ...errorResponses,
          },
        },
      },
      '/v1/reachability': {
        post: {
          operationId: 'reachability',
          summary: 'Reachable slots per entrance, with a global unreachable summary',
          requestBody: jsonBody('ReachabilityRequest'),
          responses: {
            '200': jsonResponse(
              'ReachabilityResponse',
              'Per-entrance reachable slots and global unreachable summary',
            ),
            ...errorResponses,
          },
        },
      },
    },
    components: { schemas: componentSchemas() },
  };
}

