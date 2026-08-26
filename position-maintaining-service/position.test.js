

import request from 'supertest';
import app from './index.js'; // Ensure this path points correctly to your index.js

describe('GET /position integration test', () => {
  test('GET /position returns accepted event positions correctly', async () => {
    // 1. Send initial event
    const postRes = await request(app)
      .post('/events')
      .set('Content-Type', 'application/json')
      .send({
        event_id: 'evt-x',
        symbol: 'TCS',
        transaction_type: 'BUY',
        quantity: 50
      });

    expect(postRes.status).toBe(200);

    // 2. Query positions map
    const getRes = await request(app).get('/position');

    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty('TCS');
    expect(getRes.body.TCS).toBe(50);
  });
});