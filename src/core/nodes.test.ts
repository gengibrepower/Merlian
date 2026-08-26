import { describe, expect, it } from 'vitest';
import type { ParkingGraph } from './types.js';
import { entranceIds, slotIds } from './nodes.js';

const graph: ParkingGraph = {
  nodes: [
    { kind: 'entrance', id: 'e1', position: { x: 0, y: 0 } },
    { kind: 'waypoint', id: 'w1', position: { x: 1, y: 0 } },
    { kind: 'slot', id: 's1', position: { x: 2, y: 0 }, dimensions: { width: 2, length: 4 } },
    { kind: 'poi', id: 'p1', position: { x: 3, y: 0 }, label: 'L' },
    { kind: 'entrance', id: 'e2', position: { x: 4, y: 0 } },
    { kind: 'slot', id: 's2', position: { x: 5, y: 0 }, dimensions: { width: 2, length: 4 } },
  ],
  edges: [],
};

describe('slotIds', () => {
  it('devolve apenas ids de nos slot na ordem do grafo', () => {
    expect(slotIds(graph)).toEqual(['s1', 's2']);
  });
});

describe('entranceIds', () => {
  it('devolve apenas ids de nos entrance na ordem do grafo', () => {
    expect(entranceIds(graph)).toEqual(['e1', 'e2']);
  });
});

