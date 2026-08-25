import { describe, expect, it } from 'vitest';
import { toReachabilityResponse } from './reachability.js';

describe('toReachabilityResponse', () => {
  it('monta a matriz por entrada e ecoa reachableSlotIds', () => {
    const out = toReachabilityResponse(
      [
        { entranceId: 'e1', reachableSlotIds: ['s1', 's2'] },
        { entranceId: 'e2', reachableSlotIds: ['s2'] },
      ],
      ['s1', 's2', 's3'],
    );
    expect(out.byEntrance).toEqual([
      { entranceId: 'e1', reachableSlotIds: ['s1', 's2'] },
      { entranceId: 'e2', reachableSlotIds: ['s2'] },
    ]);
  });

  it('unreachableSlotIds sao as vagas nao alcancadas por nenhuma entrada', () => {
    const out = toReachabilityResponse(
      [
        { entranceId: 'e1', reachableSlotIds: ['s1'] },
        { entranceId: 'e2', reachableSlotIds: ['s1'] },
      ],
      ['s1', 's2', 's3'],
    );
    expect(out.unreachableSlotIds).toEqual(['s2', 's3']);
  });

  it('todas alcancaveis => unreachable vazio', () => {
    const out = toReachabilityResponse(
      [{ entranceId: 'e1', reachableSlotIds: ['s1', 's2'] }],
      ['s1', 's2'],
    );
    expect(out.unreachableSlotIds).toEqual([]);
  });

  it('sem entradas => todas as vagas ficam unreachable', () => {
    const out = toReachabilityResponse([], ['s1', 's2']);
    expect(out.byEntrance).toEqual([]);
    expect(out.unreachableSlotIds).toEqual(['s1', 's2']);
  });
});

