import { describe, expect, it } from 'vitest';
import { edgeSchema, graphSchema, nodeSchema } from './graph.js';

describe('nodeSchema', () => {
  it('aceita candidate com dimensions', () => {
    const result = nodeSchema.safeParse({
      id: 's1',
      role: 'candidate',
      position: { x: 6, y: 2 },
      dimensions: { width: 2.5, length: 5 },
    });
    expect(result.success).toBe(true);
  });

  it('rejeita candidate sem dimensions', () => {
    const result = nodeSchema.safeParse({
      id: 's1',
      role: 'candidate',
      position: { x: 6, y: 2 },
    });
    expect(result.success).toBe(false);
  });

  it('aceita attractor, source e transit sem dimensions', () => {
    for (const role of ['attractor', 'source', 'transit'] as const) {
      const result = nodeSchema.safeParse({
        id: 'n1',
        role,
        position: { x: 0, y: 0 },
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejeita dimensions em no nao-candidate (strict, 400)', () => {
    const result = nodeSchema.safeParse({
      id: 'e1',
      role: 'source',
      position: { x: 0, y: 0 },
      dimensions: { width: 2, length: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejeita chave desconhecida (strict)', () => {
    const result = nodeSchema.safeParse({
      id: 's1',
      role: 'source',
      position: { x: 0, y: 0 },
      foo: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita role desconhecido', () => {
    const result = nodeSchema.safeParse({
      id: 'x1',
      role: 'gate',
      position: { x: 0, y: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('label e opcional e ecoado quando presente', () => {
    const without = nodeSchema.parse({
      id: 'p1',
      role: 'attractor',
      position: { x: 10, y: 0 },
    });
    expect(without).not.toHaveProperty('label');

    const withLabel = nodeSchema.parse({
      id: 'p1',
      role: 'attractor',
      label: 'Entrance Hall',
      position: { x: 10, y: 0 },
    });
    expect(withLabel).toHaveProperty('label', 'Entrance Hall');
  });

  it('exige position em todo no', () => {
    const result = nodeSchema.safeParse({ id: 's1', role: 'source' });
    expect(result.success).toBe(false);
  });

  it('rejeita id vazio', () => {
    const result = nodeSchema.safeParse({
      id: '',
      role: 'transit',
      position: { x: 0, y: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejeita position nao-finita', () => {
    const result = nodeSchema.safeParse({
      id: 's1',
      role: 'source',
      position: { x: Infinity, y: 0 },
    });
    expect(result.success).toBe(false);
  });
});

describe('edgeSchema', () => {
  it('aceita weight zero e positivo', () => {
    expect(edgeSchema.safeParse({ from: 'a', to: 'b', weight: 0 }).success).toBe(true);
    expect(edgeSchema.safeParse({ from: 'a', to: 'b', weight: 3.5 }).success).toBe(true);
  });

  it('rejeita weight negativo', () => {
    expect(edgeSchema.safeParse({ from: 'a', to: 'b', weight: -1 }).success).toBe(false);
  });

  it('rejeita weight infinito', () => {
    expect(edgeSchema.safeParse({ from: 'a', to: 'b', weight: Infinity }).success).toBe(false);
  });
});

describe('graphSchema', () => {
  it('parseia um grafo completo valido', () => {
    const result = graphSchema.safeParse({
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
    });
    expect(result.success).toBe(true);
  });
});

