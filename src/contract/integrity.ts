import { z } from 'zod';
import type { GraphDto, NodeDto } from './graph.js';
import type { RecommendationsRequestDto } from './recommendations.js';
import type { PathsRequestDto } from './paths.js';
import type { ReachabilityRequestDto } from './reachability.js';

export const issueSchema = z.strictObject({
  path: z.string(),
  message: z.string(),
});

export type Issue = z.infer<typeof issueSchema>;

const nodeIndex = (nodes: readonly NodeDto[]): Map<string, NodeDto> =>
  new Map(nodes.map((node) => [node.id, node]));

export function checkGraphIntegrity(graph: GraphDto): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();

  graph.nodes.forEach((node, i) => {
    if (seen.has(node.id)) {
      issues.push({ path: `nodes[${i}].id`, message: `duplicate node id '${node.id}'` });
    }
    seen.add(node.id);
  });

  graph.edges.forEach((edge, i) => {
    if (!seen.has(edge.from)) {
      issues.push({ path: `edges[${i}].from`, message: `no node with id '${edge.from}'` });
    }
    if (!seen.has(edge.to)) {
      issues.push({ path: `edges[${i}].to`, message: `no node with id '${edge.to}'` });
    }
  });

  return issues;
}

export function checkRecommendationsIntegrity(dto: RecommendationsRequestDto): Issue[] {
  const issues = checkGraphIntegrity(dto.graph);
  const nodes = nodeIndex(dto.graph.nodes);

  const poi = nodes.get(dto.poiId);
  if (poi === undefined) {
    issues.push({ path: 'poiId', message: `no node with id '${dto.poiId}'` });
  } else if (poi.role !== 'attractor') {
    issues.push({ path: 'poiId', message: `node '${dto.poiId}' is not an attractor` });
  }

  if (dto.entranceId !== undefined) {
    const entrance = nodes.get(dto.entranceId);
    if (entrance === undefined) {
      issues.push({ path: 'entranceId', message: `no node with id '${dto.entranceId}'` });
    } else if (entrance.role !== 'source') {
      issues.push({ path: 'entranceId', message: `node '${dto.entranceId}' is not a source` });
    }
  }

  dto.occupancy.forEach((id, i) => {
    if (!nodes.has(id)) {
      issues.push({ path: `occupancy[${i}]`, message: `no node with id '${id}'` });
    }
  });

  return issues;
}

export function checkPathsIntegrity(dto: PathsRequestDto): Issue[] {
  const issues = checkGraphIntegrity(dto.graph);
  const nodes = nodeIndex(dto.graph.nodes);

  if (!nodes.has(dto.from)) {
    issues.push({ path: 'from', message: `no node with id '${dto.from}'` });
  }
  if (!nodes.has(dto.to)) {
    issues.push({ path: 'to', message: `no node with id '${dto.to}'` });
  }

  return issues;
}

export function checkReachabilityIntegrity(dto: ReachabilityRequestDto): Issue[] {
  return checkGraphIntegrity(dto.graph);
}

