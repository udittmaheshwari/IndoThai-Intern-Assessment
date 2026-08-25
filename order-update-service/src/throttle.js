import dotenv from 'dotenv';
dotenv.config();

const queue = [];
let isStreamFinished = false;

/**
 * Pushes a validated clean event into the queue.
 * @param {Object} event 
 */
export function enqueueEvent(event) {
  queue.push(event);
}

/**
 * Signals to the throttler that no more items will be added to the queue.
 */
export function markStreamComplete() {
  isStreamFinished = true;
}

/**
 * Starts the interval-based queue drainer.
 * @param {number} [maxPerSecOverride] - Optional rate limit override
 */
export function startQueueDrainer(maxPerSecOverride) {
  const maxPerSec = maxPerSecOverride || Number(process.env.MAX_PER_SEC) || 50;
  const intervalMs = 1000 / maxPerSec;

  const timer = setInterval(() => {
    if (queue.length > 0) {
      const event = queue.shift();
      const positionUrl= process.env.POSITION_SERVICE_URL || "http://localhost:5000"

      fetch(`${positionUrl}/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event)
})
.then(res => {
  if (res.ok) {
    console.log(`sent : ${event.event_id}`)
  } else {
   console.log(`delivery rejected: ${event.event_id} — HTTP ${res.status}`);
  }
})
.catch(err => {
  console.log(`delivery failed: ${event.event_id} — ${err.message} — cause: ${err.cause}`);
});


      
    } else if (isStreamFinished) {
      clearInterval(timer);
      console.log("all events sent");
      
    }
  }, intervalMs);
}