import { z, type ZodError } from 'zod';
import { issueSchema, type Issue } from './integrity.js';
 
export const ErrorTypeSchema = z.enum(['malformed_request', 'invalid_graph']);

export type ErrorType = z.infer<typeof ErrorTypeSchema>;

export const errorBodySchema = z.strictObject({
  error: z.strictObject({
    type: ErrorTypeSchema,
    issues: z.array(issueSchema),
  }),
});

export type ErrorBody = z.infer<typeof errorBodySchema>;

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

