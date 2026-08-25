import { describe, expect, it } from 'vitest';
import { recommendationsRequestSchema } from './recommendations.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
    { id: 'p1', role: 'attractor', label: 'Entrance Hall', position: { x: 10, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-12', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [
    { from: 'e1', to: 'w1', weight: 5 },
    { from: 'w1', to: 's1', weight: 2 },
  ],
};

const vehicle = { dimensions: { width: 1.8, length: 4.5 } };

describe('recommendationsRequestSchema', () => {
  it('aceita request de check-in (com entranceId)', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle,
      occupancy: ['s1'],
      poiId: 'p1',
      entranceId: 'e1',
      radiusFactor: 2,
      graphVersion: 'sha256:abc123',
    });
    expect(result.success).toBe(true);
  });

  it('aceita request de standby (sem entranceId)', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.success).toBe(true);
  });

  it('deixa radiusFactor indefinido quando omitido (default vive no core)', () => {
    const parsed = recommendationsRequestSchema.parse({
      graph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
    });
    expect(parsed.radiusFactor).toBeUndefined();
  });

  it('exige poiId', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle,
      occupancy: [],
    });
    expect(result.success).toBe(false);
  });

  it('exige vehicle', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.success).toBe(false);
  });

  it('exige vehicle.dimensions', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle: {},
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.success).toBe(false);
  });

  it('exige occupancy (obrigatorio, mesmo que vazio)', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle,
      poiId: 'p1',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita radiusFactor nao-positivo ou infinito', () => {
    for (const radiusFactor of [0, -1, Infinity]) {
      const result = recommendationsRequestSchema.safeParse({
        graph,
        vehicle,
        occupancy: [],
        poiId: 'p1',
        radiusFactor,
      });
      expect(result.success).toBe(false);
    }
  });

  it('rejeita chave desconhecida no request (strict)', () => {
    const result = recommendationsRequestSchema.safeParse({
      graph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
      foo: 1,
    });
    expect(result.success).toBe(false);
  });
});

