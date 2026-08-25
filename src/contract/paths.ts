import { z } from "zod";
import { graphSchema, graphVersionSchema } from "./graph.js";

export const pathsRequestSchema = z.strictObject({
  graph: graphSchema,
  from: z.string().min(1),
  to: z.string().min(1),
  graphVersion: graphVersionSchema,
});

export type PathsRequestDto = z.infer<typeof pathsRequestSchema>;
