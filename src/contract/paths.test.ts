import { describe, expect, it } from 'vitest';
import { pathsRequestSchema } from './paths.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-12', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [
    { from: 'e1', to: 'w1', weight: 5 },
    { from: 'w1', to: 's1', weight: 2 },
  ],
};

describe('pathsRequestSchema', () => {
  it('aceita request valido', () => {
    const result = pathsRequestSchema.safeParse({
      graph,
      from: 'e1',
      to: 's1',
      graphVersion: 'sha256:abc123',
    });
    expect(result.success).toBe(true);
  });

  it('aceita sem graphVersion', () => {
    const result = pathsRequestSchema.safeParse({ graph, from: 'e1', to: 's1' });
    expect(result.success).toBe(true);
  });

  it('exige from e to', () => {
    expect(pathsRequestSchema.safeParse({ graph, to: 's1' }).success).toBe(false);
    expect(pathsRequestSchema.safeParse({ graph, from: 'e1' }).success).toBe(false);
  });

  it('rejeita from ou to vazio', () => {
    expect(pathsRequestSchema.safeParse({ graph, from: '', to: 's1' }).success).toBe(false);
  });

  it('rejeita campo desconhecido (strict): sem vehicle, occupancy, poiId', () => {
    const result = pathsRequestSchema.safeParse({
      graph,
      from: 'e1',
      to: 's1',
      poiId: 'p1',
    });
    expect(result.success).toBe(false);
  });
});

