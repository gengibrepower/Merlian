import { z } from "zod";
import { dimensionsSchema, graphSchema, graphVersionSchema } from './graph.js';

const vehicleSchema = z.strictObject({
  dimensions: dimensionsSchema,
});

export const recommendationsRequestSchema = z.strictObject({
  graph: graphSchema,
  vehicle: vehicleSchema,
  occupancy: z.array(z.string().min(1)),
  poiId: z.string().min(1),
  entranceId: z.string().min(1).optional(),
  radiusFactor: z.number().finite().positive().optional(),
  graphVersion: graphVersionSchema,
});

export type RecommendationsRequestDto = z.infer<typeof recommendationsRequestSchema>;

