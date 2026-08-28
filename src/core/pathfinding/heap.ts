import type { NodeId } from '../types.js';

export interface FrontierEntry {
  readonly id: NodeId;
  readonly distance: number;
  readonly seq: number;
}

// Orders the frontier by distance, then by discovery order (seq). The seq
// tie-break reproduces the linear scan's behavior: among equal-distance nodes
// it settles the one inserted earliest, so equal-cost routes resolve identically.
function precedes(a: FrontierEntry, b: FrontierEntry): boolean {
  return a.distance < b.distance || (a.distance === b.distance && a.seq < b.seq);
}

export class MinHeap {
  private readonly items: FrontierEntry[] = [];

  get size(): number {
    return this.items.length;
  }

  push(entry: FrontierEntry): void {
    const items = this.items;
    items.push(entry);
    let child = items.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      const c = items[child];
      const p = items[parent];
      if (c === undefined || p === undefined || !precedes(c, p)) break;
      items[child] = p;
      items[parent] = c;
      child = parent;
    }
  }

  pop(): FrontierEntry | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0 && last !== undefined) {
      items[0] = last;
      let parent = 0;
      for (;;) {
        const left = 2 * parent + 1;
        const right = left + 1;
        let smallest = parent;
        const s = items[smallest];
        const l = items[left];
        const r = items[right];
        if (s !== undefined && l !== undefined && precedes(l, s)) smallest = left;
        const sm = items[smallest];
        if (sm !== undefined && r !== undefined && precedes(r, sm)) smallest = right;
        if (smallest === parent) break;
        const a = items[parent];
        const b = items[smallest];
        if (a === undefined || b === undefined) break;
        items[parent] = b;
        items[smallest] = a;
        parent = smallest;
      }
    }
    return top;
  }
}

