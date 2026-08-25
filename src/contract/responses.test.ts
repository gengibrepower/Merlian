import { describe, expect, it } from 'vitest';
import {
  pathsResponseSchema,
  reachabilityResponseSchema,
  recommendationsResponseSchema,
  routeSchema,
  slotSchema,
} from './responses.js';

describe('recommendationsResponseSchema (union check-in / standby)', () => {
  it('aceita check-in com slot e route', () => {
    const result = recommendationsResponseSchema.safeParse({
      slot: { id: 's1', label: 'A-12' },
      route: { nodes: ['e1', 'w1', 's1'], totalWeight: 7 },
    });
    expect(result.success).toBe(true);
  });

  it('aceita check-in sem vaga compativel (slot e route null)', () => {
    const result = recommendationsResponseSchema.safeParse({ slot: null, route: null });
    expect(result.success).toBe(true);
  });

  it('aceita standby so com slot', () => {
    const result = recommendationsResponseSchema.safeParse({ slot: { id: 's1' } });
    expect(result.success).toBe(true);
  });

  it('aceita standby vazio (slot null)', () => {
    const result = recommendationsResponseSchema.safeParse({ slot: null });
    expect(result.success).toBe(true);
  });

  it('rejeita chave extra (strict nos dois membros)', () => {
    const result = recommendationsResponseSchema.safeParse({
      slot: { id: 's1' },
      route: null,
      foo: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('slotSchema', () => {
  it('label e opcional', () => {
    expect(slotSchema.safeParse({ id: 's1' }).success).toBe(true);
    expect(slotSchema.safeParse({ id: 's1', label: 'A-12' }).success).toBe(true);
  });

  it('rejeita chave desconhecida', () => {
    expect(slotSchema.safeParse({ id: 's1', role: 'candidate' }).success).toBe(false);
  });
});

describe('routeSchema', () => {
  it('aceita rota valida', () => {
    expect(routeSchema.safeParse({ nodes: ['e1', 's1'], totalWeight: 7 }).success).toBe(true);
  });

  it('rejeita totalWeight negativo', () => {
    expect(routeSchema.safeParse({ nodes: ['e1'], totalWeight: -1 }).success).toBe(false);
  });
});

describe('pathsResponseSchema', () => {
  it('aceita rota e null', () => {
    expect(pathsResponseSchema.safeParse({ route: { nodes: ['e1', 's1'], totalWeight: 7 } }).success).toBe(true);
    expect(pathsResponseSchema.safeParse({ route: null }).success).toBe(true);
  });

  it('exige a chave route', () => {
    expect(pathsResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe('reachabilityResponseSchema', () => {
  it('aceita matriz por entrada + resumo global', () => {
    const result = reachabilityResponseSchema.safeParse({
      byEntrance: [{ entranceId: 'e1', reachableSlotIds: ['s1'] }],
      unreachableSlotIds: ['s2'],
    });
    expect(result.success).toBe(true);
  });

  it('aceita sem source (byEntrance vazio)', () => {
    const result = reachabilityResponseSchema.safeParse({
      byEntrance: [],
      unreachableSlotIds: ['s1', 's2'],
    });
    expect(result.success).toBe(true);
  });

  it('exige unreachableSlotIds', () => {
    expect(reachabilityResponseSchema.safeParse({ byEntrance: [] }).success).toBe(false);
  });
});

