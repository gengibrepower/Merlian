import { z } from 'zod';

const positionSchema = z.strictObject({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const dimensionsSchema = z.strictObject({
  width: z.number().finite().positive(),
  length: z.number().finite().positive(),
});

const baseNodeShape = {
  id: z.string().min(1),
  label: z.string().optional(),
  position: positionSchema,
};

const candidateNodeSchema = z.strictObject({
  ...baseNodeShape,
  role: z.literal('candidate'),
  dimensions: dimensionsSchema,
});

const attractorNodeSchema = z.strictObject({
  ...baseNodeShape,
  role: z.literal('attractor'),
});

const sourceNodeSchema = z.strictObject({
  ...baseNodeShape,
  role: z.literal('source'),
});

const transitNodeSchema = z.strictObject({
  ...baseNodeShape,
  role: z.literal('transit'),
});

export const nodeSchema = z.discriminatedUnion('role', [
  candidateNodeSchema,
  attractorNodeSchema,
  sourceNodeSchema,
  transitNodeSchema,
]);

export const edgeSchema = z.strictObject({
  from: z.string().min(1),
  to: z.string().min(1),
  weight: z.number().finite().nonnegative(),
});

export const graphSchema = z.strictObject({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export const graphVersionSchema = z.string().optional();

export type NodeDto = z.infer<typeof nodeSchema>;
export type EdgeDto = z.infer<typeof edgeSchema>;
export type GraphDto = z.infer<typeof graphSchema>;

