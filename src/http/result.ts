import type { ErrorBody } from '../contract/index.js';

export interface HttpResult<T> {
  readonly status: number;
  readonly body: T | ErrorBody;
}

