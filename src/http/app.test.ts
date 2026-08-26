import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();

const graph = {
  nodes: [
    { id: 'e1', role: 'source', position: { x: 0, y: 0 } },
    { id: 'p1', role: 'attractor', label: 'Hall', position: { x: 10, y: 0 } },
    { id: 's1', role: 'candidate', label: 'A-1', position: { x: 5, y: 0 }, dimensions: { width: 2.5, length: 5 } },
  ],
  edges: [{ from: 'e1', to: 's1', weight: 5 }],
};

const vehicle = { dimensions: { width: 1, length: 1 } };

describe('createApp', () => {
  it('POST /v1/paths devolve 200 e a rota', async () => {
    const res = await request(app).post('/v1/paths').send({ graph, from: 'e1', to: 's1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: { nodes: ['e1', 's1'], totalWeight: 5 } });
  });

  it('POST /v1/recommendations devolve 200 e a vaga', async () => {
    const res = await request(app)
      .post('/v1/recommendations')
      .send({ graph, vehicle, occupancy: [], poiId: 'p1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ slot: { id: 's1', label: 'A-1' } });
  });

  it('POST /v1/reachability devolve 200 e a matriz', async () => {
    const res = await request(app).post('/v1/reachability').send({ graph });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      byEntrance: [{ entranceId: 'e1', reachableSlotIds: ['s1'] }],
      unreachableSlotIds: [],
    });
  });

  it('corpo malformado devolve 400', async () => {
    const res = await request(app).post('/v1/paths').send({ graph, from: 'e1' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { type: 'malformed_request' } });
  });

  it('JSON invalido devolve 400 no formato do contrato', async () => {
    const res = await request(app)
      .post('/v1/paths')
      .set('Content-Type', 'application/json')
      .send('{ broken');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { type: 'malformed_request' } });
  });
});

