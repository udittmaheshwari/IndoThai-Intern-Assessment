import { createPositionStore } from './positionStore.js';

describe('Position Store Tests', () => {
  let store;

  beforeEach(() => {
    // Instantiates a clean, isolated store instance before every test
    store = createPositionStore();
  });

  test('BUY increases position correctly for a fresh symbol', () => {
    const event = {
      event_id: 'evt-001',
      symbol: 'RELIANCE',
      transaction_type: 'BUY',
      quantity: 100
    };

    const result = store.applyEvent(event);

    expect(result.applyEvent).toBe(true);
    expect(result.reason).toBe('Event added successfully : evt-001');
    expect(store.getPositions()).toEqual({ RELIANCE: 100 });
  });

  test('SELL decreases position correctly for a fresh symbol', () => {
    const event = {
      event_id: 'evt-002',
      symbol: 'TCS',
      transaction_type: 'SELL',
      quantity: 50
    };

    const result = store.applyEvent(event);

    expect(result.applyEvent).toBe(true);
    expect(store.getPositions()).toEqual({ TCS: -50 });
  });

  test('multiple symbols are tracked independently', () => {
    store.applyEvent({
      event_id: 'evt-003',
      symbol: 'INFY',
      transaction_type: 'BUY',
      quantity: 200
    });

    store.applyEvent({
      event_id: 'evt-004',
      symbol: 'WIPRO',
      transaction_type: 'SELL',
      quantity: 75
    });

    expect(store.getPositions()).toEqual({
      INFY: 200,
      WIPRO: -75
    });
  });

  test('sequence resulting in a negative position (SELL more than net BUY)', () => {
    store.applyEvent({
      event_id: 'evt-005',
      symbol: 'HDFC',
      transaction_type: 'BUY',
      quantity: 50
    });

    store.applyEvent({
      event_id: 'evt-006',
      symbol: 'HDFC',
      transaction_type: 'SELL',
      quantity: 120
    });

    expect(store.getPositions()).toEqual({ HDFC: -70 });
  });

  test('sequence resulting in exactly zero confirms symbol remains in getPositions() output with value 0', () => {
    store.applyEvent({
      event_id: 'evt-007',
      symbol: 'ICICI',
      transaction_type: 'BUY',
      quantity: 100
    });

    store.applyEvent({
      event_id: 'evt-008',
      symbol: 'ICICI',
      transaction_type: 'SELL',
      quantity: 100
    });

    const positions = store.getPositions();

    expect(positions).toHaveProperty('ICICI');
    expect(positions.ICICI).toBe(0);
    expect(positions).toEqual({ ICICI: 0 });
  });

  test('duplicate event_id applied twice reflects position only once and rejects the second with applyEvent: false', () => {
    const event = {
      event_id: 'evt-009',
      symbol: 'TATAMOTORS',
      transaction_type: 'BUY',
      quantity: 50
    };

    const result1 = store.applyEvent(event);
    const result2 = store.applyEvent(event);

    expect(result1.applyEvent).toBe(true);
    expect(result2.applyEvent).toBe(false);
    expect(result2.reason).toBe('Event already exists : evt-009');
    expect(store.getPositions()).toEqual({ TATAMOTORS: 50 });
  });

  test('first valid event wins when two events share event_id but carry different payloads', () => {
    const originalEvent = {
      event_id: 'evt-010',
      symbol: 'SBIN',
      transaction_type: 'BUY',
      quantity: 100
    };

    const conflictingEvent = {
      event_id: 'evt-010',
      symbol: 'SBIN',
      transaction_type: 'SELL',
      quantity: 999
    };

    const result1 = store.applyEvent(originalEvent);
    const result2 = store.applyEvent(conflictingEvent);

    expect(result1.applyEvent).toBe(true);
    expect(result2.applyEvent).toBe(false);
    expect(result2.reason).toBe('Event already exists : evt-010');

    expect(store.getPositions()).toEqual({ SBIN: 100 });
  });
});