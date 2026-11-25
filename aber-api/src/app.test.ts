import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, type AppRouters } from './app';

const routersForTest = (): AppRouters => ({
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
});

const testApp = () =>
  createApp({ corsOrigin: 'http://localhost:5173', isTest: true }, routersForTest());

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(testApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('GET /health/db runs the check and returns no database data', async () => {
    let calls = 0;
    const app = createApp(
      {
        corsOrigin: 'http://localhost:5173',
        isTest: true,
        dbPing: () => {
          calls += 1;
          return Promise.resolve();
        },
      },
      routersForTest(),
    );
    const res = await request(app).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
    expect(calls).toBe(1);
  });

  it('GET /health/db answers 503 when the database check fails', async () => {
    const app = createApp(
      {
        corsOrigin: 'http://localhost:5173',
        isTest: true,
        dbPing: () => Promise.reject(new Error('connection refused')),
      },
      routersForTest(),
    );
    const res = await request(app).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ data: { status: 'unavailable' } });
  });

  it('returns the central error shape for unknown routes', async () => {
    const res = await request(testApp()).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
