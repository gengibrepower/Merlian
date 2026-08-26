import { handlePaths } from '../http/paths.js';
import { handleReachability } from '../http/reachability.js';
import { handleRecommendations } from '../http/recommendations.js';

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'p1', role: 'attractor', label: 'Main hall', position: { x: 20, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-01', position: { x: 18, y: 2 }, dimensions: { width: 2.5, length: 5 } },
    { id: 's2', role: 'candidate', label: 'A-02', position: { x: 19, y: -2 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [
    { from: 'e1', to: 's1', weight: 19 },
    { from: 'e1', to: 's2', weight: 20 },
  ],
};

const recommendationsRequest = {
  graph,
  vehicle: { dimensions: { width: 1.9, length: 4.6 } },
  occupancy: ['s2'],
  poiId: 'p1',
  entranceId: 'e1',
};

const pathsRequest = { graph, from: 'e1', to: 's1' };

const reachabilityRequest = { graph };

function ok(result: { status: number; body: unknown }): unknown {
  if (result.status !== 200) {
    throw new Error(`example request produced ${result.status} instead of 200`);
  }
  return result.body;
}

export interface Example {
  readonly request: unknown;
  readonly response: unknown;
}

export const examples: Record<'recommendations' | 'paths' | 'reachability', Example> = {
  recommendations: {
    request: recommendationsRequest,
    response: ok(handleRecommendations(recommendationsRequest)),
  },
  paths: {
    request: pathsRequest,
    response: ok(handlePaths(pathsRequest)),
  },
  reachability: {
    request: reachabilityRequest,
    response: ok(handleReachability(reachabilityRequest)),
  },
};

