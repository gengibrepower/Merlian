import { describe, expect, it } from 'vitest';
import {
  pathsRequestSchema,
  reachabilityRequestSchema,
  recommendationsRequestSchema,
} from '../contract/index.js';
import { examples } from './examples.js';

describe('examples', () => {
  it('recommendations: request valido, response fixado', () => {
    expect(recommendationsRequestSchema.safeParse(examples.recommendations.request).success).toBe(true);
    expect(examples.recommendations.response).toEqual({
      slot: { id: 's1', label: 'A-01' },
      route: { nodes: ['e1', 's1'], totalWeight: 19 },
    });
  });

  it('paths: request valido, response fixado', () => {
    expect(pathsRequestSchema.safeParse(examples.paths.request).success).toBe(true);
    expect(examples.paths.response).toEqual({
      route: { nodes: ['e1', 's1'], totalWeight: 19 },
    });
  });

  it('reachability: request valido, response fixado', () => {
    expect(reachabilityRequestSchema.safeParse(examples.reachability.request).success).toBe(true);
    expect(examples.reachability.response).toEqual({
      byEntrance: [{ entranceId: 'e1', reachableSlotIds: ['s1', 's2'] }],
      unreachableSlotIds: [],
    });
  });
});

