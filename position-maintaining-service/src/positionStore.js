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