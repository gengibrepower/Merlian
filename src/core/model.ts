import type { Dimensions, NodeId } from './types.js';

export interface Vehicle {
  readonly dimensions: Dimensions;
}

export type Occupancy = ReadonlySet<NodeId>;

