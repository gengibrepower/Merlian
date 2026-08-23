import { describe, expect, it } from 'vitest';
import type { ParkingGraph, SlotNode } from '../types.js';
import { straightLineDistanceToPoi } from './poiDistance.js';

const slot: SlotNode = { kind: 'slot', id: 's', position: { x: 0, y: 0 }, dimensions: { width: 2.5, length: 5 } };

const graph: ParkingGraph = {
  nodes: [
    slot,
    { kind: 'poi', id: 'p', position: { x: 3, y: 4 }, label: 'Loja' },
  ],
  edges: [],
};

describe('straightLineDistanceToPoi', () => {
  it('distância euclidiana do centro da vaga ao POI', () => {
    expect(straightLineDistanceToPoi(graph, slot, 'p')).toBe(5);
  });

  it('lança quando o POI não existe no grafo', () => {
    expect(() => straightLineDistanceToPoi(graph, slot, 'inexistente')).toThrow();
  });
})

