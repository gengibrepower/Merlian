import { describe, expect, it } from 'vitest';
import {
  pathsRequestSchema,
  pathsResponseSchema,
  reachabilityRequestSchema,
  reachabilityResponseSchema,
  recommendationsRequestSchema,
  recommendationsResponseSchema,
} from '../contract/index.js';
import { examples } from './examples.js';

describe('examples', () => {
  it('recommendations request e response batem com os schemas', () => {
    expect(recommendationsRequestSchema.safeParse(examples.recommendations.request).success).toBe(true);
    expect(recommendationsResponseSchema.safeParse(examples.recommendations.response).success).toBe(true);
  });

  it('paths request e response batem com os schemas', () => {
    expect(pathsRequestSchema.safeParse(examples.paths.request).success).toBe(true);
    expect(pathsResponseSchema.safeParse(examples.paths.response).success).toBe(true);
  });

  it('reachability request e response batem com os schemas', () => {
    expect(reachabilityRequestSchema.safeParse(examples.reachability.request).success).toBe(true);
    expect(reachabilityResponseSchema.safeParse(examples.reachability.response).success).toBe(true);
  });
});

