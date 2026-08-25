import { describe, expect, it } from 'vitest';
import type { GraphDto } from '../contract/index.js';
import { buildLabelIndex, hydrateGraph } from './graph.js';

const graph: GraphDto = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
    { id: 'p1', role: 'attractor', label: 'Hall', position: { x: 10, y: 0 } },
    {
      id: 's1',
      role: 'candidate',
      label: 'A-12',
      position: { x: 6, y: 2 },
      dimensions: { width: 2.5, length: 5 },
    },
  ],
  edges: [
    { from: 'e1', to: 'w1', weight: 5 },
    { from: 'w1', to: 's1', weight: 2 },
  ],
};

describe('hydrateGraph', () => {
  it('traduz role em kind', () => {
    const kinds = new Map(hydrateGraph(graph).nodes.map((n) => [n.id, n.kind]));
    expect(kinds.get('s1')).toBe('slot');
    expect(kinds.get('p1')).toBe('poi');
    expect(kinds.get('e1')).toBe('entrance');
    expect(kinds.get('w1')).toBe('waypoint');
  });

  it('carrega dimensions apenas no slot', () => {
    const slot = hydrateGraph(graph).nodes.find((n) => n.id === 's1');
    expect(slot).toMatchObject({ kind: 'slot', dimensions: { width: 2.5, length: 5 } });
  });

  it('copia posicao e arestas sem alterar', () => {
    const out = hydrateGraph(graph);
    expect(out.nodes.find((n) => n.id === 'w1')?.position).toEqual({ x: 5, y: 0 });
    expect(out.edges).toEqual([
      { from: 'e1', to: 'w1', weight: 5 },
      { from: 'w1', to: 's1', weight: 2 },
    ]);
  });

  it('poi sem label recebe o id como fallback (inferido)', () => {
    const dto: GraphDto = {
      nodes: [{ id: 'p2', role: 'attractor', position: { x: 0, y: 0 } }],
      edges: [],
    };
    const poi = hydrateGraph(dto).nodes[0];
    expect(poi).toMatchObject({ kind: 'poi', label: 'p2' });
  });
});

describe('buildLabelIndex', () => {
  it('inclui apenas nos com label', () => {
    const index = buildLabelIndex(graph);
    expect(index.get('s1')).toBe('A-12');
    expect(index.get('p1')).toBe('Hall');
    expect(index.has('e1')).toBe(false);
    expect(index.has('w1')).toBe(false);
  });
});

