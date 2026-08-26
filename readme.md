## Architecture & Design Decisions

### Why two separate processes + HTTP

The system runs as two independent Node.js processes communicating over HTTP, rather than a single app with two route groups. This satisfies the requirement that both services be independently runnable and restartable — Service B (position tracking) can be restarted or redeployed without stopping Service A's CSV ingestion, and vice versa, which wouldn't be possible if both lived in one process.

### Why streaming CSV read (readline over createReadStream)

Rather than loading the entire CSV into memory, Service A reads it incrementally using Node's `readline` interface over a `fs.createReadStream`. This keeps memory usage roughly constant regardless of file size, satisfying the requirement to process input incrementally rather than all at once.

### Why the queue + interval throttle

Valid events are placed into an in-memory queue and drained at a fixed interval (`1000 / MAX_PER_SEC` ms), rather than sent immediately as they're validated. This throttles delivery to Service B to a configurable, predictable rate. The assessment explicitly notes that exact sub-millisecond timing isn't expected, so a simple interval-based approach was preferred over a more complex rate-limiting algorithm (e.g. token bucket), since it's easier to reason about and test without introducing timing-dependent flakiness.

### Why fire-and-forget, no retries

The assessment requires documenting delivery limitations but leaves the retry strategy open. This project uses a fire-and-forget delivery model: Service A sends each event to Service B via HTTP without waiting for or retrying on failure. This keeps the throttle's timing predictable — it doesn't block on slow or failed responses — and matches the assessment's scope, which explicitly excludes durable delivery guarantees.

**Trade-off:** if Service B is unreachable or returns an error, that event is lost silently from Service B's perspective — Service A logs the failure but does not requeue or retry it.

### Why the factory function for the position store

The position store is created via a factory function (`createPositionStore()`) rather than exported as module-level singleton state. This matters primarily for testing: module-level state persists across all test cases in a file, so one test's events would silently affect another test's results. The factory pattern lets each test create its own isolated store instance, and also makes the design more explicit about what state is shared versus scoped to a single running server instance.

### Concurrency correctness

Position updates are safe under concurrent access because `applyEvent` executes entirely synchronously — it contains no `await`, promises, timers, or I/O. Node's single-threaded event loop guarantees a synchronous function runs to completion without another request being interleaved partway through. This protection would break if `applyEvent` ever yielded control back to the event loop (e.g. via an `await`, a timer, or a worker thread) partway through a state mutation, since another request could then read or write the shared state mid-update.

---

## Setup & Running

### Prerequisites

- Node.js v18 or higher
- npm

### Install dependencies

```bash
cd order-update-service
npm install

cd ../position-maintaining-service
npm install
```

### Configuration (optional .env files)

Create a `.env` file in each service folder if you want to override defaults (see Configuration Options below).

### Run both services

In one terminal:

```bash
cd position-maintaining-service
node index.js
```

In a second terminal:

```bash
cd order-update-service
node index.js
```

Service A will read the CSV, validate and throttle events, and send them to Service B. Service B exposes `GET /position` for querying current net positions.

---

## Configuration Options

| Variable               | Service               | Default                 | Description                                  |
|-------------------------|------------------------|--------------------------|-----------------------------------------------|
| `CSV_FILE_PATH`         | Order Update           | `./order_updates.csv`   | Path to input CSV file                        |
| `MAX_PER_SEC`           | Order Update           | `50`                     | Maximum events sent to Service B per second   |
| `POSITION_SERVICE_URL`  | Order Update           | `http://localhost:5000` | Base URL of Service B                         |
| `PORT`                  | Position Maintaining   | `3000`                   | Port Service B listens on                     |



---

## API Usage & Examples

### POST /events

Submits a single order event to Service B.

**Request:**

```bash
curl.exe -X POST http://localhost:5000/events -H "Content-Type: application/json" -d "@body.json"
```

Where `body.json` contains:

```json
{
  "event_id": "evt-fresh-1",
  "symbol": "TCS",
  "transaction_type": "BUY",
  "quantity": 25
}
```

**Response (success):**

```
"Event added successfully : evt-fresh-1"
```

**Response (duplicate event_id):**

```
HTTP/1.1 422 Unprocessable Entity

"Event already exists : evt-test"
```

**Response (malformed JSON body):**

```json
{"error":"Invalid request body"}
```

### GET /position

Returns the current net position for every symbol seen in an accepted event.

**Request:**

```bash
curl.exe http://localhost:5000/position
```

**Response:**

```json
{
  "TCS": 50
}
```

---

## Known Limitations and Trade-offs

1. **No persistence (state is lost on restart)**
   The Position Maintaining Service stores positions and processed `event_id` values only in memory. State is therefore lost when the service restarts. This is intentional, since database persistence and recovery after a complete process restart are explicitly out of scope for the assessment.

2. **No retry on delivery failure**
   The project uses a fire-and-forget delivery model: Service A sends each event to Service B via HTTP without waiting for or retrying on failure. This keeps the throttle's timing predictable, since it does not block on slow or failed responses, and matches the assessment's scope, which explicitly excludes durable delivery guarantees.

3. **Duplicate detection resets if Service B restarts**
   Duplicate detection is maintained using an in-memory set of accepted `event_id` values. If Service B restarts, this set is cleared, so previously processed event IDs are no longer remembered. This is an accepted trade-off, since the assessment explicitly allows in-memory idempotency state to reset after a restart.

4. **Leading-zero quantities are rejected**
   Quantity validation uses the regex `/^[1-9]\d*$/`, so quantities must consist only of digits and must start with a non-zero digit. Values such as `"090"` are rejected rather than normalized to `90`. This keeps validation strict and ensures input follows a plain positive-integer format.

5. **`POSITION_SERVICE_URL` and `PORT` defaults don't align out of the box**
   Service A's default target (`http://localhost:5000`) and Service B's default listen port (`3000`) point at different ports. Running both with no `.env` configuration will result in Service A failing to reach Service B. At least one must be set explicitly to match the other.

---

## AI Assistance

ClaudeAI was used for guidance, explanations, debugging assistance, and code review throughout this project. All code was implemented, tested, and understood by me; AI was not used to generate the final implementation or documentation without my own review and verification against the running system.
