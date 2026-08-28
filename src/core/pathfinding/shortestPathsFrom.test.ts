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

const diamondNodes = [
  { kind: 'entrance', id: 'A', position: { x: 0, y: 0 } },
  { kind: 'waypoint', id: 'B', position: { x: 1, y: 1 } },
  { kind: 'waypoint', id: 'C', position: { x: 1, y: -1 } },
  { kind: 'slot', id: 'D', position: { x: 2, y: 0 }, dimensions: { width: 2, length: 5 } },
] as const;

const diamondBC: ParkingGraph = {
  nodes: diamondNodes,
  edges: [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'A', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 1 },
    { from: 'C', to: 'D', weight: 1 },
  ],
};

const diamondCB: ParkingGraph = {
  nodes: diamondNodes,
  edges: [
    { from: 'A', to: 'C', weight: 1 },
    { from: 'A', to: 'B', weight: 1 },
    { from: 'C', to: 'D', weight: 1 },
    { from: 'B', to: 'D', weight: 1 },
  ],
};

// Two equal-cost routes C→A→E and C→D→E. A heap keyed on distance alone settles
// D before A here (heap order is not insertion-stable) and returns C→D→E; the
// linear scan settles A first (discovered earlier) and returns C→A→E. The
// discovery-order tie-break keeps the heap on the linear scan's choice.
const heapTieBreak: ParkingGraph = {
  nodes: [
    { kind: 'entrance', id: 'A', position: { x: 0, y: 0 } },
    { kind: 'waypoint', id: 'B', position: { x: 1, y: 1 } },
    { kind: 'waypoint', id: 'C', position: { x: 1, y: 0 } },
    { kind: 'waypoint', id: 'D', position: { x: 2, y: -1 } },
    { kind: 'slot', id: 'E', position: { x: 3, y: 0 }, dimensions: { width: 2, length: 5 } },
  ],
  edges: [
    { from: 'A', to: 'E', weight: 2 },
    { from: 'C', to: 'A', weight: 2 },
    { from: 'C', to: 'B', weight: 1 },
    { from: 'C', to: 'D', weight: 2 },
    { from: 'D', to: 'E', weight: 2 },
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

  it('empate de custo: rota escolhida segue a ordem de descoberta (aresta B antes de C)', () => {
    expect(shortestPathsFrom(diamondBC, 'A').pathTo('D')).toEqual({ nodes: ['A', 'B', 'D'], totalWeight: 2 });
  });

  it('empate de custo: rota escolhida segue a ordem de descoberta (aresta C antes de B)', () => {
    expect(shortestPathsFrom(diamondCB, 'A').pathTo('D')).toEqual({ nodes: ['A', 'C', 'D'], totalWeight: 2 });
  });

  it('empate de custo que um heap ingênuo trocaria: mantém a rota do scan linear', () => {
    expect(shortestPathsFrom(heapTieBreak, 'C').pathTo('E')).toEqual({ nodes: ['C', 'A', 'E'], totalWeight: 4 });
  });

  it('invariante-âncora: pathTo casa com dijkstra ponto-a-ponto para todo alvo', () => {
    const cases = [
      { graph: line, ids: ['A', 'B', 'C'] },
      { graph: shortcut, ids: ['A', 'B', 'C'] },
      { graph: diamondBC, ids: ['A', 'B', 'C', 'D'] },
      { graph: diamondCB, ids: ['A', 'B', 'C', 'D'] },
      { graph: heapTieBreak, ids: ['A', 'B', 'C', 'D', 'E'] },
    ];
    for (const { graph, ids } of cases) {
      for (const source of ids) {
        const paths = shortestPathsFrom(graph, source);
        for (const target of ids) {
          expect(paths.pathTo(target)).toEqual(dijkstra(graph, source, target));
        }
      }
    }
  });
});

