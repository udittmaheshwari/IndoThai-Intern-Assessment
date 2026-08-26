
/* 

POST /events  → parse body, call applyEvent, respond with status
   

GET /position → return current position map as JSON

*/


/* 
POST /events  → parse body, call positionStore.applyEvent, respond with status
GET /position → return current position map as JSON
*/

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createPositionStore } from "./src/positionStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Initialize a single instance of the position store for the running server
const positionStore = createPositionStore();

app.post("/events", (req, res) => {
  const result = positionStore.applyEvent(req.body);

  if (result.applyEvent) {
    return res.status(200).json(result.reason);
  } else {
    // Return 422 Unprocessable Entity if event fails store business logic
    return res.status(422).json(result.reason);
  }
});

app.get("/position", (req, res) => {
  const positions = positionStore.getPositions();
  return res.status(200).json(positions);
});


   app.use((err, req, res, next) => {
     console.error('Unhandled error:', err.message);
     res.status(400).json({ error: 'Invalid request body' });
   });





app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
