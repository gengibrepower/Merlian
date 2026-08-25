import type { Path } from '../core/index.js';
import type { PathsResponseDto } from '../contract/index.js';
import { toRouteDto } from './responses.js';

export function toPathsResponse(route: Path | null): PathsResponseDto {
  return { route: route === null ? null : toRouteDto(route) };
}
