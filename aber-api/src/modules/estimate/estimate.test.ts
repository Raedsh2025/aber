import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../middlewares/errorHandler';
import type { EstimateRepository } from './estimate.repository';
import { createEstimateRouter } from './estimate.routes';
import { createEstimateService } from './estimate.service';

const repo: EstimateRepository = {
  findRoute: (from, to) =>
    Promise.resolve(
      from === 'ALP' && to === 'DAM'
        ? { base_price: 20_000, price_per_kg: 500, est_hours: 6 }
        : undefined,
    ),
  listPricedGovernorates: () => Promise.resolve([{ code: 'ALP', nameAr: 'حلب' }]),
};

const app = (): express.Express => {
  const a = express();
  a.use('/api/public', createEstimateRouter(createEstimateService(repo)));
  a.use(errorHandler);
  return a;
};
const get = (qs: string) => request(app()).get(`/api/public/estimate${qs}`);

describe('GET /api/public/estimate', () => {
  it('prices a route with the shared formula and needs no token', async () => {
    const res = await get('?from=ALP&to=DAM&weightKg=10&goodsType=fragile');
    expect(res.status).toBe(200);
    // (20000 + 500 * 10) * 1.25 = 31250
    expect(res.body).toEqual({ data: { from: 'ALP', to: 'DAM', price: 31_250, estHours: 6 } });
  });

  it('defaults to normal goods', async () => {
    const res = await get('?from=ALP&to=DAM&weightKg=10');
    expect((res.body as { data: { price: number } }).data.price).toBe(25_000);
  });

  it('returns 404 with an Arabic message when the route has no price', async () => {
    const res = await get('?from=DAM&to=ALP&weightKg=10');
    expect(res.status).toBe(404);
    expect((res.body as { message: string }).message).toContain('لا يوجد سعر');
  });

  it('returns 400 for invalid input', async () => {
    expect((await get('?from=ALP&to=DAM&weightKg=0')).status).toBe(400);
    expect((await get('?from=ALP&to=DAM&weightKg=20001')).status).toBe(400);
    expect((await get('?from=ALP&to=ALP&weightKg=5')).status).toBe(400);
    expect((await get('?from=alp&to=DAM&weightKg=5')).status).toBe(400);
    expect((await get('?from=ALP&to=DAM&weightKg=5&goodsType=gold')).status).toBe(400);
    expect((await get('')).status).toBe(400);
  });
});

describe('GET /api/public/governorates', () => {
  it('lists priced governorates without a token', async () => {
    const res = await request(app()).get('/api/public/governorates');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [{ code: 'ALP', nameAr: 'حلب' }] });
  });
});
