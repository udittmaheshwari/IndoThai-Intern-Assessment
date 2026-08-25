/*
evt-0001,RELIANCE,BUY,90

Things to check:
{ event_id, symbol, transaction_type, quantity } - all inside one string

event id: non empty string,

symbol: non empty string and preserve case exactly,

transaction_type: exactly "BUY" or "SELL" (case-sensitive)


quantity: {
must be greater than 0 
not float
"" -> invalid
"90abc"-> invalid
}

if all this ticks then the row is valid

function validateEvent(rawRow) {
  // rawRow: { event_id, symbol, transaction_type, quantity } — all strings, since CSV gives strings
  // return something that tells the caller: valid or not, and if valid, the clean event object, if not, why

  { valid: true, event } / { valid: false, reason: "..." }
}

*/



export function validateEvent(rawRow = {}) {
  const { event_id, symbol, transaction_type, quantity } = rawRow;
  const errors = [];

  // Validate event_id
  if (!event_id || typeof event_id !== 'string' || !event_id.trim()) {
    errors.push("Missing or invalid 'event_id'.");
  }

  // Validate symbol (preserve case)
  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    errors.push("Missing or invalid 'symbol'.");
  }

  // Validate transaction_type
  const validTypes = ['BUY', 'SELL'];
  if (!transaction_type || !validTypes.includes(transaction_type)) {
    errors.push(`Invalid 'transaction_type'. Expected BUY or SELL, got '${transaction_type}'.`);
  }

  // Validate quantity: strictly positive integer string
  if (typeof quantity !== 'string' || !/^[1-9]\d*$/.test(quantity.trim())) {
    errors.push(`Invalid 'quantity'. Expected a positive whole number, got '${quantity}'.`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      reason: errors.join(" "),
      event_id: event_id ? String(event_id).trim() : 'UNKNOWN'
    };
  }

  return {
    valid: true,
    event: {
      event_id: event_id.trim(),
      symbol: symbol, // exact case preserved
      transaction_type: transaction_type,
      quantity: Number(quantity) // parsed to integer
    }
  };
}

