import type { EdgeDto, GraphDto, NodeDto } from "../contract/index.js";
import type { Edge, GraphNode, NodeId, ParkingGraph } from "../core/index.js";

function toNode(node: NodeDto): GraphNode {
  const id = node.id;
  const position = node.position;
  switch (node.role) {
    case "candidate":
      return  {
        kind: 'slot',
        id,
        position,
        dimensions: { width: node.dimensions.width, length: node.dimensions.length },
      };
    case "attractor":
     return {
        kind: 'poi',
        id,
        position,
        label: node.label ?? node.id
      };
    case "source":
      return {kind: 'entrance', id, position};
    case "transit":
      return {kind: 'waypoint', id, position};
  }
}

function toEdge(edge: EdgeDto): Edge {
  return {from: edge.from, to: edge.to, weight: edge.weight};
}

export function hydrateGraph(dto: GraphDto): ParkingGraph {
  return {
    nodes: dto.nodes.map(toNode),
    edges: dto.edges.map(toEdge),
  };
}

export function buildLabelIndex(dto: GraphDto): ReadonlyMap<NodeId, string> {
  const index  = new Map<NodeId, string>;
  for ( const node of dto.nodes ) {
    if (node.label !== undefined) index.set(node.id, node.label);
  }
  return index;
}
