import { describe, expect, it } from 'vitest';
import { recommendationsRequestSchema } from './recommendations.js';
import { invalidGraphBody, malformedRequestBody } from './errors.js';
import type { Issue } from './integrity.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-12', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [{ from: 'e1', to: 's1', weight: 2 }],
};
const vehicle = { dimensions: { width: 1.8, length: 4.5 } };

describe('invalidGraphBody', () => {
  it('envelopa issues com type invalid_graph', () => {
    const issues: Issue[] = [{ path: 'poiId', message: "no node with id 'p9'" }];
    expect(invalidGraphBody(issues)).toEqual({
      error: { type: 'invalid_graph', issues },
    });
  });
});

describe('malformedRequestBody', () => {
  it('usa type malformed_request', () => {
    const result = recommendationsRequestSchema.safeParse({ graph, vehicle, occupancy: [] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(malformedRequestBody(result.error).error.type).toBe('malformed_request');
  });

  it('achata path aninhado com indice numerico em string', () => {
    const badGraph = {
      nodes: graph.nodes,
      edges: [{ from: 'e1', to: 's1', weight: 'heavy' }],
    };
    const result = recommendationsRequestSchema.safeParse({
      graph: badGraph,
      vehicle,
      occupancy: [],
      poiId: 'p1',
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = malformedRequestBody(result.error).error.issues.map((i) => i.path);
    expect(paths).toContain('graph.edges[0].weight');
  });

  it('cada issue tem path e message', () => {
    const result = recommendationsRequestSchema.safeParse({ graph, vehicle, occupancy: [] });
    expect(result.success).toBe(false);
    if (result.success) return;
    for (const issue of malformedRequestBody(result.error).error.issues) {
      expect(typeof issue.path).toBe('string');
      expect(typeof issue.message).toBe('string');
    }
  });
});

