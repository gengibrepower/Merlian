import { describe, expect, it } from 'vitest';
import { handleRecommendations } from './recommendations.js';

const nodes = [
  { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
  { id: 'p1', role: 'attractor', label: 'Hall', position: { x: 10, y: 0 } },
  { id: 's1', role: 'candidate', label: 'A-1', position: { x: 5, y: 0 }, dimensions: { width: 2.5, length: 5 } },
  { id: 's2', role: 'candidate', label: 'A-2', position: { x: 6, y: 0 }, dimensions: { width: 2.5, length: 5 } },
];

const vehicle = { dimensions: { width: 1, length: 1 } };

const reachableGraph = {
  nodes,
  edges: [{ from: 'e1', to: 's1', weight: 5 }],
};

describe('handleRecommendations', () => {
  it('400 quando falta poiId', () => {
    const result = handleRecommendations({ graph: reachableGraph, vehicle, occupancy: [] });
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: { type: 'malformed_request' } });
  });

  it('422 quando poiId nao aponta para um attractor', () => {
    const result = handleRecommendations({
      graph: reachableGraph,
      vehicle,
      occupancy: [],
      poiId: 'e1',
    });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({
      error: { type: 'invalid_graph', issues: [{ path: 'poiId' }] },
    });
  });

  it('standby (sem entranceId): so slot, sem campo route', () => {
    const result = handleRecommendations({
      graph: reachableGraph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ slot: { id: 's2', label: 'A-2' } });
  });

  it('standby sem vaga compativel devolve slot null', () => {
    const bus = { dimensions: { width: 10, length: 20 } };
    const result = handleRecommendations({
      graph: reachableGraph,
      vehicle: bus,
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ slot: null });
  });

  it('check-in: slot e route acoplados quando ha caminho', () => {
    const result = handleRecommendations({
      graph: reachableGraph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
      entranceId: 'e1',
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      slot: { id: 's1', label: 'A-1' },
      route: { nodes: ['e1', 's1'], totalWeight: 5 },
    });
  });

  it('check-in sem vaga alcancavel devolve slot e route ambos null', () => {
    const isolated = { nodes, edges: [] };
    const result = handleRecommendations({
      graph: isolated,
      vehicle,
      occupancy: [],
      poiId: 'p1',
      entranceId: 'e1',
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ slot: null, route: null });
  });
});

