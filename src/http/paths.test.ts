import { describe, expect, it } from 'vitest';
import { handlePaths } from './paths.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
    { id: 's1', role: 'candidate', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [
    { from: 'e1', to: 'w1', weight: 5 },
    { from: 'w1', to: 's1', weight: 2 },
  ],
};

describe('handlePaths', () => {
  it('400 quando o corpo e malformado', () => {
    const result = handlePaths({ graph, from: 'e1' });
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ error: { type: 'malformed_request' } });
  });

  it('400 quando ha chave desconhecida (strict)', () => {
    const result = handlePaths({ graph, from: 'e1', to: 's1', extra: true });
    expect(result.status).toBe(400);
  });

  it('422 quando from nao existe no grafo', () => {
    const result = handlePaths({ graph, from: 'nope', to: 's1' });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({
      error: { type: 'invalid_graph', issues: [{ path: 'from' }] },
    });
  });

  it('200 com a rota quando ha caminho', () => {
    const result = handlePaths({ graph, from: 'e1', to: 's1' });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ route: { nodes: ['e1', 'w1', 's1'], totalWeight: 7 } });
  });

  it('200 com route null quando nao ha caminho (arestas dirigidas)', () => {
    const result = handlePaths({ graph, from: 's1', to: 'e1' });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ route: null });
  });
});

