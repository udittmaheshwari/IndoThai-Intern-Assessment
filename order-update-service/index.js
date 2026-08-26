/*
Things to do : 

1) read from readCsv.js file 

2) validate it from validateEvent.js.


3)   on stream 'close'/'end': log "input processing complete", 
      but note: the queue may still have items left to drain — 
      don't let "processing complete" imply "all events sent"! 
      Those are two different milestones in the log's meaning.



4)   maintains the queue

5)   a function to push new events into it


6) an interval-based drainer that pulls one event per (1000/maxPerSec) ms 
    and does something with it (for now: log "sending: evt-xxxx")
  
  
7)    - make maxPerSec configurable via param or env var


*/

import path from "path";
import { fileURLToPath } from "url";
import { readCsvRows } from "./src/readCsv.js";
import { validateEvent } from "./src/validateEvent.js";
import { enqueueEvent, startQueueDrainer, markStreamComplete } from "./src/throttle.js";

/**
 * Orchestrates a single raw row: validates, enqueues on success, 
 * logs the outcome, and returns the execution result.
 */
export function processRow(row) {
  const final_row = validateEvent(row);

  if (final_row.valid) {
    enqueueEvent(final_row.event);
    console.log(`accepted: ${final_row.event.event_id}`);
    return { status: 'accepted', event: final_row.event };
  } else {
    console.log(`rejected: ${final_row.event_id} — reason: ${final_row.reason}`);
    return { status: 'rejected', event_id: final_row.event_id, reason: final_row.reason };
  }
}

export const readStream = async (overridePath) => {
  try {
    for await (const row of readCsvRows(overridePath)) {
      processRow(row);
    }
    console.log("input processing complete");
  } catch (err) {
    console.log("input processing failed: " + err.message);
  } finally {
    markStreamComplete();
  }
};

// Start execution if run directly
const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = path.resolve(process.argv[1]);

if (currentFilePath === entryFilePath) {
  startQueueDrainer();
  await readStream();
}
