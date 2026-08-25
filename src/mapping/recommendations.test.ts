import { describe, expect, it } from 'vitest';
import type { RecommendationsRequestDto } from '../contract/index.js';
import type { Path, SlotNode } from '../core/index.js';
import { toRecommendationInput, toRecommendationsResponse } from './recommendations.js';

const baseRequest: RecommendationsRequestDto = {
  graph: {
    nodes: [
      { id: 'p1', role: 'attractor', position: { x: 0, y: 0 } },
      {
        id: 's1',
        role: 'candidate',
        position: { x: 1, y: 0 },
        dimensions: { width: 2.5, length: 5 },
      },
    ],
    edges: [],
  },
  vehicle: { dimensions: { width: 1.8, length: 4.5 } },
  occupancy: ['s1'],
  poiId: 'p1',
};

const slot: SlotNode = {
  kind: 'slot',
  id: 's1',
  position: { x: 1, y: 0 },
  dimensions: { width: 2.5, length: 5 },
};

const route: Path = { nodes: ['e1', 's1'], totalWeight: 7 };

describe('toRecommendationInput', () => {
  it('converte occupancy em Set e hidrata o grafo', () => {
    const input = toRecommendationInput(baseRequest);
    expect(input.occupancy.has('s1')).toBe(true);
    expect(input.graph.nodes.find((n) => n.id === 's1')?.kind).toBe('slot');
    expect(input.poiId).toBe('p1');
  });

  it('omite entranceId e radiusFactor quando ausentes', () => {
    const input = toRecommendationInput(baseRequest);
    expect('entranceId' in input).toBe(false);
    expect('radiusFactor' in input).toBe(false);
  });

  it('inclui entranceId e radiusFactor quando presentes', () => {
    const input = toRecommendationInput({ ...baseRequest, entranceId: 'e1', radiusFactor: 3 });
    expect(input.entranceId).toBe('e1');
    expect(input.radiusFactor).toBe(3);
  });
});

describe('toRecommendationsResponse', () => {
  const labels = new Map([['s1', 'A-12']]);

  it('standby devolve apenas slot com label ecoado', () => {
    const out = toRecommendationsResponse({ slot, route: null }, 'standby', labels);
    expect(out).toEqual({ slot: { id: 's1', label: 'A-12' } });
    expect('route' in out).toBe(false);
  });

  it('checkin devolve slot e route', () => {
    const out = toRecommendationsResponse({ slot, route }, 'checkin', labels);
    expect(out).toEqual({
      slot: { id: 's1', label: 'A-12' },
      route: { nodes: ['e1', 's1'], totalWeight: 7 },
    });
  });

  it('slot null vira null; sem label omite o campo', () => {
    const standby = toRecommendationsResponse({ slot: null, route: null }, 'standby', new Map());
    expect(standby).toEqual({ slot: null });
    const echoed = toRecommendationsResponse({ slot, route: null }, 'standby', new Map());
    expect(echoed).toEqual({ slot: { id: 's1' } });
  });

  it('checkin sem rota alcancavel devolve route null', () => {
    const out = toRecommendationsResponse({ slot, route: null }, 'checkin', labels);
    expect(out).toEqual({ slot: { id: 's1', label: 'A-12' }, route: null });
  });
});

