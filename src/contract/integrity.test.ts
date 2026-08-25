import { describe, expect, it } from 'vitest';
import { graphSchema } from './graph.js';
import { recommendationsRequestSchema } from './recommendations.js';
import { pathsRequestSchema } from './paths.js';
import { reachabilityRequestSchema } from './reachability.js';
import {
  checkGraphIntegrity,
  checkPathsIntegrity,
  checkReachabilityIntegrity,
  checkRecommendationsIntegrity,
} from './integrity.js';

const nodes = [
  { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
  { id: 'w1', role: 'transit', position: { x: 5, y: 0 } },
  { id: 'p1', role: 'attractor', label: 'Hall', position: { x: 10, y: 0 } },
  { id: 's1', role: 'candidate', label: 'A-12', position: { x: 6, y: 2 }, dimensions: { width: 2.5, length: 5 } },
];
const edges = [
  { from: 'e1', to: 'w1', weight: 5 },
  { from: 'w1', to: 's1', weight: 2 },
];
const vehicle = { dimensions: { width: 1.8, length: 4.5 } };

const paths = (issues: { path: string }[]) => issues.map((i) => i.path);

describe('checkGraphIntegrity', () => {
  it('grafo coerente nao tem issues', () => {
    expect(checkGraphIntegrity(graphSchema.parse({ nodes, edges }))).toEqual([]);
  });

  it('acusa id de no duplicado', () => {
    const dup = [...nodes, { id: 's1', role: 'candidate', position: { x: 9, y: 9 }, dimensions: { width: 2, length: 4 } }];
    const issues = checkGraphIntegrity(graphSchema.parse({ nodes: dup, edges }));
    expect(paths(issues)).toContain('nodes[4].id');
  });

  it('acusa endpoint de aresta inexistente', () => {
    const bad = [...edges, { from: 'ghost', to: 's1', weight: 1 }];
    const issues = checkGraphIntegrity(graphSchema.parse({ nodes, edges: bad }));
    expect(paths(issues)).toContain('edges[2].from');
  });
});

describe('checkRecommendationsIntegrity', () => {
  const base = { graph: { nodes, edges }, vehicle, occupancy: [] as string[], poiId: 'p1' };

  it('request coerente nao tem issues', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, entranceId: 'e1' });
    expect(checkRecommendationsIntegrity(dto)).toEqual([]);
  });

  it('acusa poiId inexistente', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, poiId: 'nope' });
    expect(paths(checkRecommendationsIntegrity(dto))).toContain('poiId');
  });

  it('acusa poiId que nao e attractor', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, poiId: 's1' });
    const issues = checkRecommendationsIntegrity(dto);
    expect(issues.some((i) => i.path === 'poiId' && /attractor/.test(i.message))).toBe(true);
  });

  it('acusa entranceId que nao e source', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, entranceId: 'w1' });
    const issues = checkRecommendationsIntegrity(dto);
    expect(issues.some((i) => i.path === 'entranceId' && /source/.test(i.message))).toBe(true);
  });

  it('nao acusa entranceId quando ausente (standby)', () => {
    const dto = recommendationsRequestSchema.parse(base);
    expect(paths(checkRecommendationsIntegrity(dto))).not.toContain('entranceId');
  });

  it('acusa id de occupancy inexistente com indice', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, occupancy: ['s1', 'ghost'] });
    expect(paths(checkRecommendationsIntegrity(dto))).toContain('occupancy[1]');
  });

  it('acumula multiplos issues numa passada', () => {
    const dto = recommendationsRequestSchema.parse({ ...base, poiId: 'nope', occupancy: ['ghost'] });
    expect(checkRecommendationsIntegrity(dto).length).toBeGreaterThanOrEqual(2);
  });
});

describe('checkPathsIntegrity', () => {
  it('from/to existentes de qualquer role nao tem issues', () => {
    const dto = pathsRequestSchema.parse({ graph: { nodes, edges }, from: 's1', to: 'e1' });
    expect(checkPathsIntegrity(dto)).toEqual([]);
  });

  it('acusa from e to inexistentes', () => {
    const dto = pathsRequestSchema.parse({ graph: { nodes, edges }, from: 'x', to: 'y' });
    expect(paths(checkPathsIntegrity(dto))).toEqual(expect.arrayContaining(['from', 'to']));
  });
});

describe('checkReachabilityIntegrity', () => {
  it('delega pra checagem de grafo', () => {
    const bad = [...edges, { from: 'ghost', to: 's1', weight: 1 }];
    const dto = reachabilityRequestSchema.parse({ graph: { nodes, edges: bad } });
    expect(paths(checkReachabilityIntegrity(dto))).toContain('edges[2].from');
  });
});

