import { processRow } from './index.js';

describe('processRow', () => {
  test('continues processing valid rows after an invalid row', () => {
    const testRows = [
      { event_id: 'evt-001', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '10' },
      { event_id: 'evt-002', symbol: 'TATA', transaction_type: 'INVALID_TYPE', quantity: '10' },
      { event_id: 'evt-003', symbol: 'INFY', transaction_type: 'SELL', quantity: '5' }
    ];

    const results = testRows.map(processRow);

    expect(results[0].status).toBe('accepted');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('accepted');
  });
});