const { validateEvent } = require('./validateEvent.js');

describe('validateEvent()', () => {

  // --- VALID CASES ---
  describe('Valid Event Rows', () => {
    it('should pass for a completely valid row and return clean event data', () => {
      const input = {
        event_id: 'evt-0001',
        symbol: 'RELIANCE',
        transaction_type: 'BUY',
        quantity: '90'
      };

      const result = validateEvent(input);

      expect(result).toEqual({
        valid: true,
        event: {
          event_id: 'evt-0001',
          symbol: 'RELIANCE',
          transaction_type: 'BUY',
          quantity: 90
        }
      });
    });

    it('should accept SELL as a valid transaction_type', () => {
      const input = {
        event_id: 'evt-0002',
        symbol: 'TCS',
        transaction_type: 'SELL',
        quantity: '10'
      };

      const result = validateEvent(input);
      expect(result.valid).toBe(true);
      expect(result.event.transaction_type).toBe('SELL');
    });

    it('should preserve symbol case exactly', () => {
      const input = {
        event_id: 'evt-0003',
        symbol: 'reliance',
        transaction_type: 'BUY',
        quantity: '5'
      };

      const result = validateEvent(input);
      expect(result.valid).toBe(true);
      expect(result.event.symbol).toBe('reliance');
    });
  });

  // --- INVALID EVENT_ID ---
  describe('event_id Validation', () => {
    it('should fail when event_id is empty or whitespace', () => {
      const input = { event_id: '   ', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '10' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Missing 'event_id'.");
    });
  });

  // --- INVALID SYMBOL ---
  describe('symbol Validation', () => {
    it('should fail when symbol is empty or whitespace', () => {
      const input = { event_id: 'evt-0001', symbol: '', transaction_type: 'BUY', quantity: '10' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Missing 'symbol'.");
    });
  });

  // --- INVALID TRANSACTION_TYPE ---
  describe('transaction_type Validation', () => {
    it('should fail if transaction_type is lowercase "buy" (case-sensitive requirement)', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'buy', quantity: '10' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'transaction_type'. Expected BUY or SELL");
    });

    it('should fail if transaction_type is invalid value', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'HOLD', quantity: '10' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'transaction_type'. Expected BUY or SELL");
    });
  });

  // --- INVALID QUANTITY ---
  describe('quantity Validation', () => {
    it('should fail when quantity is 0', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '0' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'quantity'.");
    });

    it('should fail when quantity contains trailing characters ("90abc")', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '90abc' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'quantity'.");
    });

    it('should fail when quantity is a float ("90.5")', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '90.5' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'quantity'.");
    });

    it('should fail when quantity is empty ("")', () => {
      const input = { event_id: 'evt-0001', symbol: 'RELIANCE', transaction_type: 'BUY', quantity: '' };
      const result = validateEvent(input);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Invalid 'quantity'.");
    });
  });

});