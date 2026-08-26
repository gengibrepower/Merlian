import { describe, expect, it } from 'vitest';
import { errorBodySchema } from '../contract/errors.js';
import { buildOpenApiDocument } from './document.js';

const doc = buildOpenApiDocument('9.9.9') as {
  openapi: string;
  info: { version: string };
  paths: Record<string, { post: { requestBody: unknown; responses: Record<string, unknown> } }>;
  components: { schemas: Record<string, Record<string, unknown>> };
};

describe('buildOpenApiDocument', () => {
  it('declara OpenAPI 3.0 e injeta a versao recebida', () => {
    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info.version).toBe('9.9.9');
  });

  it('expoe os tres endpoints como POST', () => {
    expect(Object.keys(doc.paths).sort()).toEqual([
      '/v1/paths',
      '/v1/reachability',
      '/v1/recommendations',
    ]);
    for (const path of Object.values(doc.paths)) {
      expect(path.post.requestBody).toBeDefined();
      expect(Object.keys(path.post.responses).sort()).toEqual(['200', '400', '422']);
    }
  });

  it('registra os schemas do contrato como componentes com $ref', () => {
    const schemas = doc.components.schemas;
    expect(schemas).toHaveProperty('Graph');
    expect(schemas).toHaveProperty('ErrorBody');
    expect(schemas.Graph?.['properties']).toHaveProperty('nodes');
    expect(JSON.stringify(schemas.Graph)).toContain('#/components/schemas/Node');
  });

  it('nao deixa $id residual nos componentes', () => {
    for (const schema of Object.values(doc.components.schemas)) {
      expect(schema).not.toHaveProperty('$id');
    }
  });

  it('o componente ErrorBody aceita um corpo de erro real', () => {
    const sample = { error: { type: 'invalid_graph', issues: [{ path: 'poiId', message: 'x' }] } };
    expect(errorBodySchema.parse(sample)).toEqual(sample);
  });
});

