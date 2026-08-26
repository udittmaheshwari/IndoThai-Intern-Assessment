/*
Things to do :
 seen set,
 position map,
 a function like applyEvent(event) that returns { applied: true/false, reason }

 if event_id already in seen set → ignore (duplicate)
else:
  add event_id to seen set
  if transaction_type === "BUY": position[symbol] = (position[symbol] || 0) + quantity
  if transaction_type === "SELL": position[symbol] = (position[symbol] || 0) - quantity

*/

export function createPositionStore() {
  const seenEventIds = new Set();
  const positionMap = {};

  const applyEvent = (event) => {

    if (!event || typeof event !== 'object') {
  return { applied: false, reason: 'Event payload missing or invalid.' };
}
if (!event.event_id || typeof event.event_id !== 'string') {
  return { applied: false, reason: 'Missing or invalid event_id.' };
}
if (event.transaction_type !== 'BUY' && event.transaction_type !== 'SELL') {
  return { applied: false, reason: 'Invalid transaction_type.' };
}
if (typeof event.quantity !== 'number' || !Number.isInteger(event.quantity) || event.quantity <= 0) {
  return { applied: false, reason: 'Invalid quantity.' };
}
if (!event.symbol || typeof event.symbol !== 'string') {
  return { applied: false, reason: 'Missing or invalid symbol.' };
}



    const { event_id, symbol, transaction_type, quantity } = event;

    if (seenEventIds.has(event_id)) {
      return {
        applyEvent: false,
        reason: `Event already exists : ${event_id}`
      };
    }

    seenEventIds.add(event_id);

    if (transaction_type === "BUY") {
      positionMap[symbol] = (positionMap[symbol] || 0) + quantity;
    } else if (transaction_type === "SELL") {
      positionMap[symbol] = (positionMap[symbol] || 0) - quantity;
    }

    return {
      applyEvent: true,
      reason: `Event added successfully : ${event_id}`
    };
  };

  const getPositions = () => positionMap;

  return {
    applyEvent,
    getPositions
  };
}