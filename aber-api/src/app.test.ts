import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

const testApp = () =>
  createApp(
    { corsOrigin: 'http://localhost:5173', isTest: true },
    {
      authRouter: Router(),
      publicRouter: Router(),
      shipmentRouter: Router(),
      tripRouter: Router(),
      branchRouter: Router(),
      vehicleRouter: Router(),
      staffRouter: Router(),
      companyRouter: Router(),
      reportRouter: Router(),
      statsRouter: Router(),
      estimateRouter: Router(),
    },
  );

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(testApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('returns the central error shape for unknown routes', async () => {
    const res = await request(testApp()).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
