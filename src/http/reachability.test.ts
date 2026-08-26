import { describe, expect, it } from 'vitest';
import { handleReachability } from './reachability.js';

const nodes = [
  { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
  { id: 'e2', role: 'source', position: { x: 0, y: 5 } },
  { id: 's1', role: 'candidate', position: { x: 5, y: 0 }, dimensions: { width: 2.5, length: 5 } },
  { id: 's2', role: 'candidate', position: { x: 6, y: 0 }, dimensions: { width: 2.5, length: 5 } },
  { id: 's3', role: 'candidate', position: { x: 9, y: 9 }, dimensions: { width: 2.5, length: 5 } },
];

const graph = {
  nodes,
  edges: [
    { from: 'e1', to: 's1', weight: 5 },
    { from: 'e1', to: 's2', weight: 6 },
    { from: 'e2', to: 's2', weight: 2 },
  ],
};

describe('handleReachability', () => {
  it('400 quando ha chave desconhecida', () => {
    const result = handleReachability({ graph, extra: 1 });
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: { type: 'malformed_request' } });
  });

  it('422 quando uma aresta aponta para no inexistente', () => {
    const dangling = { nodes, edges: [{ from: 'e1', to: 'nope', weight: 1 }] };
    const result = handleReachability({ graph: dangling });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({ error: { type: 'invalid_graph' } });
  });

  it('200 com a matriz por entrada e resumo de inalcancaveis', () => {
    const result = handleReachability({ graph });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      byEntrance: [
        { entranceId: 'e1', reachableSlotIds: ['s1', 's2'] },
        { entranceId: 'e2', reachableSlotIds: ['s2'] },
      ],
      unreachableSlotIds: ['s3'],
    });
  });

  it('sem arestas: nenhuma vaga alcancavel', () => {
    const result = handleReachability({ graph: { nodes, edges: [] } });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      byEntrance: [
        { entranceId: 'e1', reachableSlotIds: [] },
        { entranceId: 'e2', reachableSlotIds: [] },
      ],
      unreachableSlotIds: ['s1', 's2', 's3'],
    });
  });
});

