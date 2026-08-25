import { describe, expect, it } from 'vitest';
import { reachabilityRequestSchema } from './reachability.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-12', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [{ from: 'e1', to: 'w1', weight: 5 }],
};

describe('reachabilityRequestSchema', () => {
  it('aceita apenas graph', () => {
    expect(reachabilityRequestSchema.safeParse({ graph }).success).toBe(true);
  });

  it('aceita graph + graphVersion', () => {
    const result = reachabilityRequestSchema.safeParse({ graph, graphVersion: 'sha256:def456' });
    expect(result.success).toBe(true);
  });

  it('exige graph', () => {
    expect(reachabilityRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejeita occupancy (reachability e topologica, nao considera ocupacao)', () => {
    const result = reachabilityRequestSchema.safeParse({ graph, occupancy: ['s1'] });
    expect(result.success).toBe(false);
  });
});

