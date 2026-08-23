import { describe, expect, it } from 'vitest';
import type { ParkingGraph } from '../types.js';
import { dijkstra } from './dijkstra.js';
import { shortestPathsFrom } from './shortestPathsFrom.js';

const line: ParkingGraph = {
  nodes: [
    { kind: 'entrance', id: 'A', position: { x: 0, y: 0 } },
    { kind: 'waypoint', id: 'B', position: { x: 1, y: 0 } },
    { kind: 'slot', id: 'C', position: { x: 2, y: 0 }, dimensions: { width: 2, length: 5 } },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'B', to: 'C', weight: 1 },
  ],
};

const shortcut: ParkingGraph = {
  nodes: [
    { kind: 'entrance', id: 'A', position: { x: 0, y: 0 } },
    { kind: 'waypoint', id: 'B', position: { x: 1, y: 0 } },
    { kind: 'slot', id: 'C', position: { x: 2, y: 0 }, dimensions: { width: 2, length: 5 } },
  ],
  edges: [
    { from: 'A', to: 'C', weight: 10 },
    { from: 'A', to: 'B', weight: 1 },
    { from: 'B', to: 'C', weight: 1 },
  ],
};

describe('shortestPathsFrom', () => {
  it('distância da origem a um nó alcançável', () => {
    expect(shortestPathsFrom(line, 'A').distanceTo('C')).toBe(2);
  });

  it('caminho da origem a um nó alcançável', () => {
    expect(shortestPathsFrom(line, 'A').pathTo('C')).toEqual({ nodes: ['A', 'B', 'C'], totalWeight: 2 });
  });

  it('origem para si mesma: distância 0 e caminho de um nó', () => {
    const paths = shortestPathsFrom(line, 'A');
    expect(paths.distanceTo('A')).toBe(0);
    expect(paths.pathTo('A')).toEqual({ nodes: ['A'], totalWeight: 0 });
  });

  it('nó inalcançável respeita o sentido das arestas: distância e caminho null', () => {
    const paths = shortestPathsFrom(line, 'C');
    expect(paths.distanceTo('A')).toBeNull();
    expect(paths.pathTo('A')).toBeNull();
  });

  it('prefere a rota mais barata, não a primeira aresta', () => {
    expect(shortestPathsFrom(shortcut, 'A').pathTo('C')).toEqual({ nodes: ['A', 'B', 'C'], totalWeight: 2 });
  });

  it('invariante-âncora: pathTo casa com dijkstra ponto-a-ponto para todo alvo', () => {
    for (const graph of [line, shortcut]) {
      for (const source of ['A', 'B', 'C']) {
        const paths = shortestPathsFrom(graph, source);
        for (const target of ['A', 'B', 'C']) {
          expect(paths.pathTo(target)).toEqual(dijkstra(graph, source, target));
        }
      }
    }
  });
});

