import { describe, expect, it } from 'vitest';
import type { Path } from '../core/index.js';
import { toPathsResponse } from './paths.js';

describe('toPathsResponse', () => {
  it('route null vira { route: null }', () => {
    expect(toPathsResponse(null)).toEqual({ route: null });
  });

  it('projeta o caminho em RouteDto', () => {
    const route: Path = { nodes: ['a', 'b', 'c'], totalWeight: 4 };
    expect(toPathsResponse(route)).toEqual({
      route: { nodes: ['a', 'b', 'c'], totalWeight: 4 },
    });
  });
});

