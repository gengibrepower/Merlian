import type { t } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { z, type infer } from 'zod';

export const slotSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().optional(),
});

export const routeSchema = z.strictObject({
  nodes: z.array(z.string().min(1)),
  totalWeight: z.number().finite().nonnegative(),
});

const checkinRecommendationSchema = z.strictObject({
  slot: slotSchema.nullable(),
  route: routeSchema.nullable(),
});

const standbyRecommendationSchema = z.strictObject({
  slot: slotSchema.nullable(),
});

export const recommendationsResponseSchema = z.union([
  checkinRecommendationSchema,
  standbyRecommendationSchema,
]);

export const pathsResponseSchema = z.strictObject({
  route: routeSchema.nullable(),
});

const entranceReachabilitySchema = z.strictObject({
  entranceId: z.string().min(1),
  reachableSlotIds: z.array(z.string().min(1)),
});

export const reachabilityResponseSchema = z.strictObject({
  byEntrance: z.array(entranceReachabilitySchema),
  unreachableSlotIds: z.array(z.string().min(1)),
});

export type SlotDto = z.infer<typeof slotSchema>;
export type RouteDto = z.infer<typeof routeSchema>;
export type RecommendationsResponseDto = z.infer<typeof recommendationsResponseSchema>;
export type PathsResponseDto = z.infer<typeof pathsResponseSchema>;
export type ReachabilityResponseDto = z.infer<typeof reachabilityResponseSchema>;

