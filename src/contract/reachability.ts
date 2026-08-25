import { z } from 'zod';
import { graphSchema, graphVersionSchema } from './graph.js';

export const reachabilityRequestSchema = z.strictObject({
  graph: graphSchema,
  graphVersion: graphVersionSchema,
});

export type ReachabilityRequestDto = z.infer<typeof reachabilityRequestSchema>;

