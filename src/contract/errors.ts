import type { ZodError } from 'zod';
import type { Issue } from './integrity.js';
 
export type ErrorType = 'malformed_request' | 'invalid_graph';

export interface ErrorBody {
  readonly error: {
    readonly type: ErrorType;
    readonly issues: Issue[];
  };
}

const formatPath = (path: readonly PropertyKey[]): string => 
  path.reduce<string>((acc, key) => {
    if (typeof key === 'number') return `${acc}[${key}]`;
    return acc === '' ? String(key) : `${acc}.${String(key)}`;
  }, '');

export const formatZodIssues = (error: ZodError): Issue[] => 
  error.issues.map((issue) => ({
    path: formatPath(issue.path),
    message: issue.message,
  }));

export const malformedRequestBody = (error: ZodError): ErrorBody => ({
  error: {type: 'malformed_request', issues: formatZodIssues(error) },
});

export const invalidGraphBody = (issues: Issue[]): ErrorBody => ({
  error: {type: 'invalid_graph', issues },
});

