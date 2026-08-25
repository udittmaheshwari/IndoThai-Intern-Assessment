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
      console.log(`sent: ${event.event_id}`);
    } else if (isStreamFinished) {
      clearInterval(timer);
      console.log("all events sent");
      
    }
  }, intervalMs);
}